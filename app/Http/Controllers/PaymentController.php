<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Order;
use App\Support\AppState;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

// AniBayan renders the payment flow itself with PayMongo Payment Intents. The secret key stays on the server;
// public-key tokenization keeps card details out of AniBayan's server and database.
class PaymentController extends Controller
{
    private const INTENTS = 'https://api.paymongo.com/v1/payment_intents';

    // QR Ph can be scanned with GCash while keeping the customer on AniBayan. The old GCash value is
    // mapped to QR Ph too, so legacy orders do not start another hosted GCash authorization page.
    private const METHODS = ['GCash' => 'qrph', 'GCash or QR Ph' => 'qrph', 'Credit or debit card' => 'card', 'QR Ph' => 'qrph'];

    private const UNAVAILABLE = 'Online payment isn’t available right now. Try again in a moment.';

    // Creates an intent from the signed-in buyer's unpaid orders. Payment details are tokenized in the browser.
    public function create(Request $request): JsonResponse
    {
        $buyer = Auth::user();
        self::refuseUnless($buyer && $buyer->isBuyer() && $buyer->status === 'Active', 403, 'Sign in with a buyer account to pay.');
        $ids = $request->validate(['orders' => 'required|array|min:1|max:20', 'orders.*' => 'required|string|distinct'])['orders'];
        $orders = Order::whereIn('id', $ids)->where('user_id', $buyer->id)->where('payment', 'Unpaid')
            ->where('status', '!=', 'Cancelled')->get();
        if ($orders->count() !== count($ids)) {
            return response()->json(['message' => 'Some selected orders are no longer waiting for payment. Refresh your orders and try again.'], 422);
        }
        $method = $orders->first()->method;
        $methodType = self::METHODS[$method] ?? null;
        if (! $methodType || $orders->contains(fn ($order) => $order->method !== $method || ! $order->isOnline())) {
            return response()->json(['message' => 'These orders do not share an available online payment method.'], 422);
        }
        if (! $this->client() || ! config('services.paymongo.public')) {
            return $this->notSetUp();
        }

        // Do not create a second charge while a previous checkout or intent is still open.
        foreach ($orders->pluck('checkout_session')->filter()->unique() as $openId) {
            if (str_starts_with($openId, 'pi_')) {
                $existing = $this->client()->get(self::INTENTS.'/'.$openId);
                if ($existing->failed()) {
                    return $this->failed($existing->json('errors.0.detail'));
                }
                $attributes = $existing->json('data.attributes') ?? [];
                $status = $attributes['status'] ?? '';
                if (in_array($status, ['succeeded', 'processing', 'awaiting_next_action'], true)) {
                    $allowedMethods = $attributes['payment_method_allowed'] ?? [];
                    if ($status === 'awaiting_next_action' && ! in_array($methodType, $allowedMethods, true)) {
                        // An older GCash redirect is being replaced by the in-app QR Ph flow. Cancel only an
                        // intent still waiting for the payer; never replace one that is processing or paid.
                        $cancelled = $this->client()->post(self::INTENTS.'/'.$openId.'/cancel');
                        if ($cancelled->failed()) {
                            return response()->json(['message' => 'The earlier GCash request is still open. Return to AniBayan and refresh its payment status before trying again.'], 409);
                        }
                        $status = 'cancelled';
                    } else {
                        return response()->json([
                            'intentId' => $openId, 'existing' => true, 'status' => $status,
                            'nextAction' => $attributes['next_action'] ?? null, 'publicKey' => config('services.paymongo.public'), 'method' => $methodType,
                        ]);
                    }
                }
                if (! in_array($status, ['awaiting_payment_method', 'cancelled'], true)) {
                    return response()->json(['message' => 'The previous payment status could not be confirmed. Refresh your orders before trying again.'], 409);
                }
            } else {
                $existing = $this->client()->get('https://api.paymongo.com/v1/checkout_sessions/'.$openId);
                if ($existing->failed()) {
                    return response()->json(['message' => 'An earlier PayMongo checkout is still open for these orders. Finish it or wait for it to expire before starting another payment.'], 409);
                }
                $sessionAttributes = $existing->json('data.attributes') ?? [];
                $sessionPayments = collect($sessionAttributes['payments'] ?? []);
                $hasPaid = $sessionPayments->contains(fn ($payment) => data_get($payment, 'attributes.status') === 'paid');
                $hasProcessing = $sessionPayments->contains(fn ($payment) => in_array(data_get($payment, 'attributes.status'), ['pending', 'processing'], true));
                if ($hasPaid || $hasProcessing) {
                    return response()->json(['message' => 'The earlier payment is already processing or complete. Refresh your orders before trying again.'], 409);
                }
                if (($sessionAttributes['status'] ?? '') === 'active') {
                    $expired = $this->client()->post('https://api.paymongo.com/v1/checkout_sessions/'.$openId.'/expire');
                    if ($expired->failed() && $expired->json('data.attributes.status') !== 'expired') {
                        return response()->json(['message' => 'The earlier checkout could not be safely closed yet. Refresh your orders and try again.'], 409);
                    }
                }
            }
        }

        $total = $orders->sum('total');
        $response = $this->client()->post(self::INTENTS, ['data' => ['attributes' => [
            'amount' => $total * 100,
            'currency' => 'PHP',
            'payment_method_allowed' => [$methodType],
            'description' => 'AniBayan '.($orders->count() > 1 ? 'orders ' : 'order ').$orders->map(fn ($order) => $order->number())->join(', '),
        ]]]);
        if ($response->failed()) {
            return $this->failed($response->json('errors.0.detail'));
        }

        $intentId = (string) $response->json('data.id');
        $clientKey = (string) $response->json('data.attributes.client_key');
        if (! str_starts_with($intentId, 'pi_') || ! $clientKey) {
            return $this->failed('PayMongo returned an incomplete payment intent.');
        }
        Order::whereIn('id', $orders->pluck('id'))->where('payment', 'Unpaid')->update(['checkout_session' => $intentId]);

        return response()->json(['intentId' => $intentId, 'clientKey' => $clientKey, 'publicKey' => config('services.paymongo.public'),
            'method' => $methodType, 'returnUrl' => url('/anibayan/consumer.html?payment=return#orders')]);
    }

    // Checks open Payment Intents (and older hosted sessions created before the in-app flow was added).
    public function check(Request $request): JsonResponse
    {
        $buyer = Auth::user();
        self::refuseUnless($buyer && $buyer->isBuyer() && $buyer->status === 'Active', 403, 'Sign in with a buyer account.');
        $cancelled = $request->boolean('cancelled');
        $paid = [];
        if ($this->client()) {
            $open = Order::where('user_id', $buyer->id)->where('payment', 'Unpaid')->whereNotNull('checkout_session')->get()->groupBy('checkout_session');
            foreach ($open as $session => $orders) {
                $isIntent = str_starts_with((string) $session, 'pi_');
                $url = $isIntent ? self::INTENTS.'/'.$session : 'https://api.paymongo.com/v1/checkout_sessions/'.$session;
                $response = $this->client()->get($url);
                if ($response->failed()) {
                    continue;
                }
                $attributes = $response->json('data.attributes') ?? [];
                if ($isIntent) {
                    $intentStatus = $attributes['status'] ?? '';
                    $payment = collect($attributes['payments'] ?? [])->first(fn ($item) => data_get($item, 'attributes.status') === 'paid');
                    foreach ($orders as $order) {
                        if ($intentStatus === 'succeeded') {
                            $order->update(['payment' => 'Paid', 'payment_ref' => data_get($payment, 'id') ?: $session, 'checkout_session' => null, 'paid_at' => now(), 'funds' => 'Held']);
                            Activity::record('order-paid', $buyer->email, $order->number().' · ₱'.number_format($order->total).' · '.$order->method);
                            $paid[] = $order->number();
                        } elseif (in_array($intentStatus, ['awaiting_payment_method', 'cancelled'], true)) {
                            $order->update(['checkout_session' => null]);
                        }
                    }
                    continue;
                }

                // Legacy hosted checkout reconciliation for orders opened before this flow changed.
                $payment = collect($attributes['payments'] ?? [])->firstWhere('attributes.status', 'paid');
                foreach ($orders as $order) {
                    if ($payment) {
                        $order->update(['payment' => 'Paid', 'payment_ref' => $payment['id'], 'checkout_session' => null, 'paid_at' => now(), 'funds' => 'Held']);
                        Activity::record('order-paid', $buyer->email, $order->number().' · ₱'.number_format($order->total).' · '.$order->method);
                        $paid[] = $order->number();
                    } elseif (! collect($attributes['payments'] ?? [])->contains(fn ($item) => in_array(data_get($item, 'attributes.status'), ['pending', 'processing'], true))
                        && (($attributes['status'] ?? '') !== 'active' || $cancelled)) {
                        $order->update(['checkout_session' => null]);
                    }
                }
            }
        }

        return response()->json(['result' => ['paid' => $paid], 'state' => AppState::for($buyer->fresh())]);
    }

    private function client(): ?PendingRequest
    {
        $secret = config('services.paymongo.secret');

        return $secret ? Http::withBasicAuth($secret, '')->acceptJson()->asJson()->timeout(20) : null;
    }

    private function notSetUp(): JsonResponse
    {
        Log::warning('PayMongo is not fully configured: PAYMONGO_SECRET_KEY or PAYMONGO_PUBLIC_KEY is missing from .env.');

        return response()->json(['message' => self::UNAVAILABLE], 503);
    }

    private function failed(?string $detail): JsonResponse
    {
        Log::warning('PayMongo refused a request: '.($detail ?: 'no answer.'));

        return response()->json(['message' => self::UNAVAILABLE], 502);
    }
}
