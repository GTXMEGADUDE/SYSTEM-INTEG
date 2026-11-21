<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Crop;
use App\Models\Order;
use App\Support\AppState;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

// Card and GCash payments through PayMongo's hosted checkout. The secret key stays on the server (.env).
// The checkout is built from the orders in the database, and only PayMongo's answer marks an order paid.
class PaymentController extends Controller
{
    private const API = 'https://api.paymongo.com/v1/checkout_sessions';

    private const METHODS = ['GCash' => 'gcash', 'Credit or debit card' => 'card'];

    // Opens a PayMongo checkout for the signed-in buyer's unpaid card or GCash orders.
    public function create(Request $request): JsonResponse
    {
        $buyer = Auth::user();
        abort_unless($buyer && $buyer->isBuyer() && $buyer->status === 'Active', 403, 'Sign in with a buyer account to pay.');
        $ids = $request->validate(['orders' => 'required|array|min:1|max:20', 'orders.*' => 'string'])['orders'];
        $orders = Order::with(['items', 'organization'])->whereIn('id', $ids)->where('user_id', $buyer->id)
            ->where('payment', 'Unpaid')->where('status', '!=', 'Cancelled')->get();
        if ($orders->isEmpty() || $orders->contains(fn ($o) => ! $o->isOnline())) {
            return response()->json(['message' => 'These orders can’t be paid online.'], 422);
        }
        if (! $this->client()) {
            return $this->notSetUp();
        }

        // The buyer's details fill PayMongo's form, so they don't type them again.
        $first = $orders->first();
        $billing = array_filter(['name' => $buyer->name, 'email' => $buyer->email, 'phone' => $first->phone ?: $buyer->phone]);
        // "12 J.P. Rizal Street, Barangay Lalud, Calapan City, Oriental Mindoro": the last two parts are the city and province.
        $parts = array_values(array_filter(array_map('trim', explode(',', (string) ($first->address ?: $buyer->address)))));
        if (count($parts) >= 3) {
            $billing['address'] = ['line1' => implode(', ', array_slice($parts, 0, -2)), 'city' => $parts[count($parts) - 2], 'state' => end($parts), 'country' => 'PH'];
        }
        $photos = Crop::whereIn('id', $orders->flatMap(fn ($o) => $o->items->pluck('crop_id'))->filter())->pluck('image', 'id');
        // One line per crop, with its photo; PayMongo shows the price per unit times the quantity.
        $lines = $orders->flatMap(fn ($o) => $o->items->isEmpty()
            ? [array_filter(['currency' => 'PHP', 'amount' => $o->total * 100, 'name' => $o->crop, 'description' => $o->organization->name, 'quantity' => 1, 'images' => $this->image($o->image)])]
            : $o->items->map(fn ($i) => array_filter(['currency' => 'PHP', 'amount' => $i->price * 100, 'name' => $i->name, 'description' => $o->organization->name.' · per '.$i->unit, 'quantity' => $i->quantity, 'images' => $this->image($photos[$i->crop_id] ?? null)])))->values()->all();
        $numbers = $orders->map(fn ($o) => $o->number())->join(', ');
        $response = $this->client()->post(self::API, ['data' => ['attributes' => [
            'billing' => $billing,
            'line_items' => $lines,
            'payment_method_types' => [self::METHODS[$first->method] ?? 'gcash'],
            'description' => 'AniBayan '.($orders->count() > 1 ? 'orders ' : 'order ').$numbers,
            'reference_number' => $orders->pluck('id')->join(','),
            'send_email_receipt' => false,
            'show_description' => true,
            'show_line_items' => true,
            'success_url' => url('/anibayan/consumer.html').'?payment=done#orders',
            'cancel_url' => url('/anibayan/consumer.html').'?payment=cancelled#orders',
        ]]]);
        if ($response->failed()) {
            return $this->failed($response->json('errors.0.detail'));
        }
        Order::whereIn('id', $orders->pluck('id'))->update(['checkout_session' => $response->json('data.id')]);

        return response()->json(['checkoutUrl' => $response->json('data.attributes.checkout_url')]);
    }

    // Asks PayMongo about each of the buyer's open checkouts: paid orders turn Paid; expired or cancelled
    // checkouts are forgotten so the buyer can pay again.
    public function check(Request $request): JsonResponse
    {
        $buyer = Auth::user();
        abort_unless($buyer && $buyer->isBuyer() && $buyer->status === 'Active', 403, 'Sign in with a buyer account.');
        $cancelled = $request->boolean('cancelled');
        $paid = [];
        if ($this->client()) {
            $open = Order::where('user_id', $buyer->id)->where('payment', 'Unpaid')->whereNotNull('checkout_session')->get()->groupBy('checkout_session');
            foreach ($open as $session => $orders) {
                $response = $this->client()->get(self::API.'/'.$session);
                if ($response->failed()) {
                    continue;
                }
                $payment = collect($response->json('data.attributes.payments') ?? [])->firstWhere('attributes.status', 'paid');
                foreach ($orders as $order) {
                    if ($payment) {
                        $order->update(['payment' => 'Paid', 'payment_ref' => $payment['id'], 'checkout_session' => null]);
                        Activity::record('order-paid', $buyer->email, $order->number().' · ₱'.number_format($order->total).' · '.$order->method);
                        $paid[] = $order->number();
                    } elseif ($response->json('data.attributes.status') !== 'active' || $cancelled) {
                        $order->update(['checkout_session' => null]);
                    }
                }
            }
        }

        return response()->json(['result' => ['paid' => $paid], 'state' => AppState::for($buyer->fresh())]);
    }

    // A photo as a public https address: the site's own copy when it runs on https, otherwise the public GitHub
    // copy of a stock photo (PayMongo's page loads only https pictures). Uploaded photos need the https site.
    private function image(?string $file): ?array
    {
        if (! $file) {
            return null;
        }
        $secure = str_starts_with(url('/'), 'https://');
        if (preg_match('#^uploads/[a-z]+/[A-Za-z0-9]+\.(jpg|png|webp)$#', $file)) {
            return $secure && is_file(public_path('anibayan/'.$file)) ? [url('anibayan/'.$file)] : null;
        }
        if (! preg_match('/^[\w-]+\.(jpe?g|png|webp)$/i', $file) || ! is_file(public_path('anibayan/assets/'.$file))) {
            return null;
        }
        $base = $secure ? url('anibayan/assets') : config('services.paymongo.images');

        return $base ? [rtrim($base, '/').'/'.$file] : null;
    }

    private function client(): ?PendingRequest
    {
        $secret = config('services.paymongo.secret');

        return $secret ? Http::withBasicAuth($secret, '')->acceptJson()->asJson()->timeout(20) : null;
    }

    private function notSetUp(): JsonResponse
    {
        return response()->json(['message' => 'PayMongo isn’t set up on this server. Add PAYMONGO_SECRET_KEY to .env.'], 503);
    }

    private function failed(?string $detail, int $status = 502): JsonResponse
    {
        return response()->json(['message' => 'PayMongo: '.($detail ?: 'no answer.')], $status);
    }
}
