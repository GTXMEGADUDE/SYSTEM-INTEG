<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

// Card and GCash payments through PayMongo's hosted checkout. The secret key stays on the server (.env).
// AniBayan's orders live in the buyer's browser, so the page sends the orders to pay and later asks whether
// the checkout was paid; PayMongo's answer is what marks an order paid.
class PaymentController extends Controller
{
    private const API = 'https://api.paymongo.com/v1/checkout_sessions';

    private const METHODS = ['GCash' => 'gcash', 'Credit or debit card' => 'card'];

    public function create(Request $request): JsonResponse
    {
        $data = $request->validate([
            'method' => ['required', 'in:'.implode(',', array_keys(self::METHODS))],
            'orders' => ['required', 'array', 'min:1', 'max:20'],
            'orders.*.id' => ['required', 'string', 'regex:/^AB-\d{4}-\d+$/'],
            'orders.*.total' => ['required', 'numeric', 'min:20', 'max:1000000'],
            'orders.*.organization' => ['required', 'string', 'max:120'],
            'orders.*.items' => ['required', 'array', 'min:1', 'max:50'],
            'orders.*.items.*.name' => ['required', 'string', 'max:120'],
            'orders.*.items.*.quantity' => ['required', 'integer', 'min:1', 'max:100000'],
            'orders.*.items.*.unit' => ['required', 'string', 'max:20'],
            'orders.*.items.*.price' => ['required', 'numeric', 'min:0.01', 'max:1000000'],
            'orders.*.items.*.image' => ['nullable', 'string', 'max:120'],
            'buyer.name' => ['required', 'string', 'max:120'],
            'buyer.email' => ['required', 'email', 'max:160'],
            'buyer.phone' => ['nullable', 'string', 'max:20'],
            'buyer.address' => ['nullable', 'string', 'max:300'],
        ]);
        if (! $this->client()) {
            return $this->notSetUp();
        }

        $numbers = array_map(fn ($o) => '#'.substr($o['id'], 8), $data['orders']);
        // The buyer's details fill PayMongo's form, so they don't type them again.
        $billing = array_filter(['name' => $data['buyer']['name'], 'email' => $data['buyer']['email'], 'phone' => $data['buyer']['phone'] ?? null]);
        // "12 Mabini Street, Barangay San Isidro, Quezon City, Metro Manila": the last two parts are the city and province.
        $parts = array_values(array_filter(array_map('trim', explode(',', (string) ($data['buyer']['address'] ?? '')))));
        if (count($parts) >= 3) {
            $billing['address'] = ['line1' => implode(', ', array_slice($parts, 0, -2)), 'city' => $parts[count($parts) - 2], 'state' => end($parts), 'country' => 'PH'];
        }
        $response = $this->client()->post(self::API, ['data' => ['attributes' => [
            'billing' => $billing,
            // One line per crop, with its photo; PayMongo shows the price per unit times the quantity.
            'line_items' => collect($data['orders'])->flatMap(fn ($o) => array_map(fn ($item) => array_filter([
                'currency' => 'PHP',
                'amount' => (int) round($item['price'] * 100),
                'name' => $item['name'],
                'description' => $o['organization'].' · per '.$item['unit'],
                'quantity' => (int) $item['quantity'],
                'images' => $this->image($item['image'] ?? null),
            ]), $o['items']))->all(),
            'payment_method_types' => [self::METHODS[$data['method']]],
            'description' => 'AniBayan '.(count($numbers) > 1 ? 'orders ' : 'order ').implode(', ', $numbers),
            'reference_number' => implode(',', array_column($data['orders'], 'id')),
            'send_email_receipt' => false,
            'show_description' => true,
            'show_line_items' => true,
            'success_url' => url('/anibayan/consumer.html').'?payment=done#orders',
            'cancel_url' => url('/anibayan/consumer.html').'?payment=cancelled#orders',
        ]]]);
        if ($response->failed()) {
            return $this->failed($response->json('errors.0.detail'));
        }

        return response()->json([
            'session' => $response->json('data.id'),
            'checkoutUrl' => $response->json('data.attributes.checkout_url'),
        ]);
    }

    public function show(string $session): JsonResponse
    {
        if (! preg_match('/^cs_[A-Za-z0-9]+$/', $session)) {
            return response()->json(['message' => 'Unknown checkout.'], 404);
        }
        if (! $this->client()) {
            return $this->notSetUp();
        }
        $response = $this->client()->get(self::API.'/'.$session);
        if ($response->failed()) {
            return $this->failed($response->json('errors.0.detail'), $response->status() === 404 ? 404 : 502);
        }
        $attributes = $response->json('data.attributes');
        $payment = collect($attributes['payments'] ?? [])->firstWhere('attributes.status', 'paid');

        return response()->json([
            'paid' => $payment !== null,
            'status' => $attributes['status'] ?? 'unknown',
            'payment' => $payment['id'] ?? null,
            'method' => $payment['attributes']['source']['type'] ?? null,
            'orders' => array_values(array_filter(explode(',', (string) ($attributes['reference_number'] ?? '')))),
        ])->header('Cache-Control', 'no-store');
    }

    // A photo from public/anibayan/assets as a public https address. Photos a grower uploaded live only in their
    // browser, so those items go without one.
    private function image(?string $file): ?array
    {
        if (! $file || ! preg_match('/^[\w-]+\.(jpe?g|png|webp)$/i', $file) || ! is_file(public_path('anibayan/assets/'.$file))) {
            return null;
        }
        $base = str_starts_with(url('/'), 'https://') ? url('anibayan/assets') : config('services.paymongo.images');

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
