<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Order;
use App\Support\AppState;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

// AniBayan renders the payment flow itself with PayMongo Payment Intents. The secret key stays on the server;
// public-key tokenization keeps card details out of AniBayan's server and database.
class PaymentController extends Controller
{
    private const INTENTS = 'https://api.paymongo.com/v1/payment_intents';
    private const MIN_AMOUNT_CENTAVOS = 100;
    private const MAX_AMOUNT_CENTAVOS = 999_999_999;
    private const MAX_ORDERS_PER_PAYMENT = 100;

    // QR Ph can be scanned with GCash while keeping the customer on AniBayan. The old GCash value is
    // mapped to QR Ph too, so legacy orders do not start another hosted GCash authorization page.
    private const METHODS = ['GCash' => 'qrph', 'GCash or QR Ph' => 'qrph', 'Credit or debit card' => 'card', 'QR Ph' => 'qrph'];

    private const UNAVAILABLE = 'Online payment isn’t available right now. Try again in a moment.';

    // Creates an intent from the signed-in buyer's unpaid orders. Payment details are tokenized in the browser.
    public function create(Request $request): JsonResponse
    {
        $buyer = Auth::user();
        self::refuseUnless($buyer && $buyer->isBuyer() && $buyer->status === 'Active', 403, 'Sign in with a buyer account to pay.');
        $data = $request->validate([
            'orders' => 'required|array|min:1|max:'.self::MAX_ORDERS_PER_PAYMENT,
            'orders.*' => 'required|string|distinct',
            'method' => ['sometimes', 'required', 'string', Rule::in(array_keys(self::METHODS))],
        ]);
        $ids = $data['orders'];
        $orders = Order::whereIn('id', $ids)->where('user_id', $buyer->id)->where('payment', 'Unpaid')
            ->where('status', '!=', 'Cancelled')->get();
        if ($orders->count() !== count($ids)) {
            return response()->json(['message' => 'Some selected orders are no longer waiting for payment. Refresh your orders and try again.'], 422);
        }
        $method = $data['method'] ?? $orders->first()->method;
        $methodType = self::METHODS[$method] ?? null;
        $hasOfflineOrder = $orders->contains(fn ($order) => ! $order->isOnline());
        $hasMixedMethods = ! isset($data['method']) && $orders->contains(fn ($order) => $order->method !== $method);
        if (! $methodType || $hasOfflineOrder || $hasMixedMethods) {
            return response()->json(['message' => 'These orders do not share an available online payment method.'], 422);
        }
        $amount = $this->amountInCentavos($orders);
        if ($amount instanceof JsonResponse) {
            return $amount;
        }
        if ($configurationError = $this->keyConfigurationError()) {
            return $configurationError;
        }

        $requestedIds = $orders->pluck('id')->sort()->values()->all();
        $openIds = $orders->pluck('checkout_session')->filter()->unique();
        if ($openIds->count() > 1) {
            return response()->json(['message' => 'These orders belong to separate payment attempts. Refresh your orders and pay each group separately.'], 409);
        }

        // Do not create a second charge while a previous checkout or intent is still open.
        foreach ($openIds as $openId) {
            $sessionOrderIds = Order::where('checkout_session', $openId)->where('payment', 'Unpaid')
                ->where('status', '!=', 'Cancelled')->pluck('id')->sort()->values()->all();
            if ($sessionOrderIds !== $requestedIds) {
                return response()->json(['message' => 'This payment covers a group of orders. Open the payment for that whole group to avoid charging the wrong total.'], 409);
            }
            if (str_starts_with($openId, 'pi_')) {
                $existing = $this->safePayMongoRequest(fn () => $this->client()->get(self::INTENTS.'/'.$openId));
                if (! $existing) {
                    return $this->unreachable();
                }
                if ($existing->failed()) {
                    return $this->failed($existing);
                }
                $attributes = $existing->json('data.attributes') ?? [];
                $status = $attributes['status'] ?? '';
                if (in_array($status, ['succeeded', 'processing', 'awaiting_next_action'], true)) {
                    $allowedMethods = $attributes['payment_method_allowed'] ?? [];
                    if ($status === 'awaiting_next_action' && ! in_array($methodType, $allowedMethods, true)) {
                        // An older GCash redirect is being replaced by the in-app QR Ph flow. Cancel only an
                        // intent still waiting for the payer; never replace one that is processing or paid.
                        $cancelled = $this->safePayMongoRequest(fn () => $this->client()->post(self::INTENTS.'/'.$openId.'/cancel'));
                        if (! $cancelled) {
                            return $this->unreachable();
                        }
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
                if ($status === 'awaiting_payment_method') {
                    $cancelled = $this->safePayMongoRequest(fn () => $this->client()->post(self::INTENTS.'/'.$openId.'/cancel'));
                    if (! $cancelled) {
                        return $this->unreachable();
                    }
                    if ($cancelled->failed() && $cancelled->json('data.attributes.status') !== 'cancelled') {
                        return response()->json(['message' => 'The earlier payment attempt could not be safely closed. Refresh your orders and try again.'], 409);
                    }
                }
            } else {
                $existing = $this->safePayMongoRequest(fn () => $this->client()->get('https://api.paymongo.com/v1/checkout_sessions/'.$openId));
                if (! $existing) {
                    return $this->unreachable();
                }
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
                    $expired = $this->safePayMongoRequest(fn () => $this->client()->post('https://api.paymongo.com/v1/checkout_sessions/'.$openId.'/expire'));
                    if (! $expired) {
                        return $this->unreachable();
                    }
                    if ($expired->failed() && $expired->json('data.attributes.status') !== 'expired') {
                        return response()->json(['message' => 'The earlier checkout could not be safely closed yet. Refresh your orders and try again.'], 409);
                    }
                }
            }
        }

        $response = $this->safePayMongoRequest(fn () => $this->client()->post(self::INTENTS, ['data' => ['attributes' => [
            'amount' => $amount,
            'currency' => 'PHP',
            'payment_method_allowed' => [$methodType],
            'description' => 'AniBayan '.($orders->count() > 1 ? 'orders ' : 'order ').$orders->map(fn ($order) => $order->number())->join(', '),
        ]]]));
        if (! $response) {
            return $this->unreachable();
        }
        if ($response->failed()) {
            return $this->failed($response);
        }

        $intentId = (string) $response->json('data.id');
        $clientKey = (string) $response->json('data.attributes.client_key');
        if (! str_starts_with($intentId, 'pi_') || ! $clientKey) {
            return $this->failed(null);
        }
        $updated = Order::whereIn('id', $orders->pluck('id'))->where('payment', 'Unpaid')->where('status', '!=', 'Cancelled')
            ->update(['checkout_session' => $intentId, 'method' => $method]);
        if ($updated !== $orders->count()) {
            $this->safePayMongoRequest(fn () => $this->client()->post(self::INTENTS.'/'.$intentId.'/cancel'));

            return response()->json(['message' => 'The order changed while payment was starting. Refresh your orders and try again.'], 409);
        }

        return response()->json(['intentId' => $intentId, 'clientKey' => $clientKey, 'publicKey' => config('services.paymongo.public'),
            'method' => $methodType, 'returnUrl' => url('/anibayan/consumer.html?payment=return#orders')]);
    }

    // Checks open Payment Intents (and older hosted sessions created before the in-app flow was added).
    public function check(Request $request): JsonResponse
    {
        $buyer = Auth::user();
        self::refuseUnless($buyer && $buyer->isBuyer() && $buyer->status === 'Active', 403, 'Sign in with a buyer account.');
        if ($configurationError = $this->keyConfigurationError()) {
            return $configurationError;
        }
        $cancelled = $request->boolean('cancelled');
        $paid = [];
        $pending = [];
        $unverified = false;
        if ($this->client()) {
            $open = Order::where('user_id', $buyer->id)->where('payment', 'Unpaid')->whereNotNull('checkout_session')->get()->groupBy('checkout_session');
            foreach ($open as $session => $orders) {
                $isIntent = str_starts_with((string) $session, 'pi_');
                $url = $isIntent ? self::INTENTS.'/'.$session : 'https://api.paymongo.com/v1/checkout_sessions/'.$session;
                $response = $this->safePayMongoRequest(fn () => $this->client()->get($url));
                if (! $response) {
                    $unverified = true;
                    continue;
                }
                if ($response->failed()) {
                    Log::warning('PayMongo payment status check failed.', [
                        'status' => $response->status(),
                        'code' => $response->json('errors.0.code'),
                    ]);
                    $unverified = true;
                    continue;
                }
                $attributes = $response->json('data.attributes') ?? [];
                if ($isIntent) {
                    $intentStatus = $attributes['status'] ?? '';
                    $payment = collect($attributes['payments'] ?? [])->first(fn ($item) => in_array(data_get($item, 'attributes.status'), ['paid', 'succeeded'], true));
                    foreach ($orders as $order) {
                        if ($intentStatus === 'succeeded' || $payment) {
                            $order->update(['payment' => 'Paid', 'payment_ref' => data_get($payment, 'id') ?: $session, 'checkout_session' => null, 'paid_at' => now(), 'funds' => 'Held']);
                            Activity::record('order-paid', $buyer->email, $order->number().' · ₱'.number_format($order->total).' · '.$order->method);
                            $paid[] = $order->number();
                        } elseif (in_array($intentStatus, ['awaiting_payment_method', 'cancelled'], true)) {
                            $order->update(['checkout_session' => null]);
                        } else {
                            $pending[] = $order->number();
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
                    } else {
                        $pending[] = $order->number();
                    }
                }
            }
        }

        return response()->json(['result' => ['paid' => array_values(array_unique($paid)), 'pending' => array_values(array_unique($pending)), 'unverified' => $unverified], 'state' => AppState::for($buyer->fresh())]);
    }

    private function client(): ?PendingRequest
    {
        $secret = config('services.paymongo.secret');

        return $secret ? Http::withBasicAuth($secret, '')->acceptJson()->asJson()->timeout(20) : null;
    }

    // PayMongo rejects credentials from different accounts or environments. Check modes first and never
    // include either key in the response or logs.
    private function keyConfigurationError(): ?JsonResponse
    {
        $public = (string) config('services.paymongo.public', '');
        $secret = (string) config('services.paymongo.secret', '');
        if ($public === '' || $secret === '') {
            return $this->notSetUp();
        }

        $publicMode = str_starts_with($public, 'pk_test_') ? 'test' : (str_starts_with($public, 'pk_live_') ? 'live' : null);
        $secretMode = str_starts_with($secret, 'sk_test_') ? 'test' : (str_starts_with($secret, 'sk_live_') ? 'live' : null);
        if ($publicMode === null || $secretMode === null) {
            Log::warning('PayMongo public or secret key has an unrecognized format.');

            return response()->json(['message' => 'PayMongo keys are not configured correctly. Use a valid public and secret key from the same account.'], 503);
        }
        if ($publicMode !== $secretMode) {
            Log::warning('PayMongo public and secret keys use different modes.');

            return response()->json(['message' => 'PayMongo public and secret keys must both be test keys or both be live keys. Save a matching pair in the app environment.'], 503);
        }

        return null;
    }

    private function amountInCentavos($orders): int|JsonResponse
    {
        $maximumPesos = intdiv(self::MAX_AMOUNT_CENTAVOS, 100);
        $totalPesos = 0;
        foreach ($orders as $order) {
            $orderTotal = (int) $order->total;
            if ($orderTotal < 0 || $orderTotal > $maximumPesos - $totalPesos) {
                return response()->json(['message' => 'PayMongo accepts up to ₱9,999,999.99 per transaction. This total needs to be split into smaller orders before payment.'], 422);
            }
            $totalPesos += $orderTotal;
        }

        $amount = $totalPesos * 100;
        if ($amount < self::MIN_AMOUNT_CENTAVOS) {
            return response()->json(['message' => 'The minimum online payment is ₱1.00.'], 422);
        }
        if ($amount > self::MAX_AMOUNT_CENTAVOS) {
            return response()->json(['message' => 'PayMongo accepts up to ₱9,999,999.99 per transaction. This total needs to be split into smaller orders before payment.'], 422);
        }

        return $amount;
    }

    private function safePayMongoRequest(callable $send): ?Response
    {
        try {
            return $send();
        } catch (ConnectionException) {
            return null;
        }
    }

    private function unreachable(): JsonResponse
    {
        Log::warning('PayMongo could not be reached while starting a payment.');

        return response()->json(['message' => 'PayMongo could not be reached. Check your connection and try again.'], 503);
    }

    private function notSetUp(): JsonResponse
    {
        Log::warning('PayMongo is not fully configured: PAYMONGO_SECRET_KEY or PAYMONGO_PUBLIC_KEY is missing from .env.');

        return response()->json(['message' => self::UNAVAILABLE], 503);
    }

    private function failed(?Response $response): JsonResponse
    {
        $code = strtolower((string) ($response?->json('errors.0.code') ?? ''));
        Log::warning('PayMongo refused a payment request.', ['code' => $code ?: null, 'status' => $response?->status()]);

        $message = match ($code) {
            'parameter_below_minimum' => 'The minimum online payment is ₱1.00.',
            'parameter_above_maximum' => 'PayMongo accepts up to ₱9,999,999.99 per transaction. This total needs to be split into smaller orders before payment.',
            'amount_exceed_limit' => 'This amount is over your QR Ph bank or wallet limit. Contact your provider or choose card payment.',
            'payment_method_not_allowed', 'account_not_activated' => 'The selected payment method is not enabled for the PayMongo account. Enable it in PayMongo or choose another method.',
            'card_declined' => 'Your card was declined. Check the details or try another card.',
            default => 'PayMongo could not start this payment. Please try again.',
        };

        return response()->json(['message' => $message], in_array($code, ['parameter_below_minimum', 'parameter_above_maximum', 'amount_exceed_limit'], true) ? 422 : 502);
    }
}
