<?php

namespace App\Support;

use App\Models\Activity;
use App\Models\Order;
use App\Models\RefundRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

// Online payments (GCash, card) stay with AniBayan until the order is settled:
//   - the buyer confirms "Order received"                      → the money goes to the organization;
//   - 7 days pass after delivery without a refund request        → the order completes and the money goes to the organization;
//   - the buyer asks for a refund within those 7 days, and then
//       the organization accepts it, or doesn't answer in 10 days → the buyer is refunded through PayMongo;
//       the organization disputes it                           → the money goes to the organization.
// Nothing runs on a timer: settle() runs whenever someone loads AniBayan, and catches up on whatever came due.
class Escrow
{
    public static function settle(): void
    {
        // Delivered orders whose 7 days passed without a refund request complete on their own.
        $due = Order::where('status', 'Delivered')->whereNotNull('delivered_at')->where('delivered_at', '<=', now()->subDays(Order::HOLD_DAYS))->get();
        foreach ($due as $order) {
            DB::transaction(function () use ($order) {
                $order->update(['status' => 'Completed']);
                self::release($order);
                Activity::record('order-updated', 'AniBayan', $order->number().' → Completed after '.Order::HOLD_DAYS.' days');
            });
        }
        // Refund requests the organization didn't answer in time are refunded; refunds PayMongo hasn't confirmed are tried again.
        $refunds = RefundRequest::with('order')->where(fn ($q) => $q->where('status', 'Requested')->where('respond_by', '<=', now()))
            ->orWhere('status', 'Refunding')->get();
        foreach ($refunds as $request) {
            self::refund($request, $request->status === 'Refunding' ? (string) $request->decided_by : 'automatic');
        }
        // Cancelled orders whose refund PayMongo didn't take the first time.
        foreach (Order::where('funds', 'Refund due')->get() as $order) {
            self::refundOrder($order, (string) $order->cancel_reason);
        }
    }

    // A cancelled order's held payment goes back to the buyer (through PayMongo when it was paid there). If PayMongo
    // refuses for now, the order is marked "Refund due" and the next settle() tries again.
    public static function refundOrder(Order $order, string $note): void
    {
        $ref = null;
        if ($order->payment_ref && str_starts_with($order->payment_ref, 'pay_')) {
            $ref = self::payMongoRefund($order, 'AniBayan order '.$order->number().' cancelled: '.$note);
            if (! $ref) {
                $order->update(['funds' => 'Refund due']);

                return;
            }
        }
        $order->update(['funds' => 'Refunded', 'funds_settled_at' => now()]);
        Activity::record('refund-paid', 'AniBayan', $order->number().' · cancelled order · ₱'.number_format($order->total));
    }

    // The held payment goes to the organization.
    public static function release(Order $order): void
    {
        if ($order->funds === 'Held') {
            $order->update(['funds' => 'Released', 'funds_settled_at' => now()]);
        }
    }

    // Sends the order's payment back to the buyer. A payment made through PayMongo is refunded there; if PayMongo
    // doesn't accept it right now, the request stays "Refunding" and the next settle() tries again.
    public static function refund(RefundRequest $request, string $decidedBy): void
    {
        $order = $request->order;
        $ref = null;
        if ($order->payment_ref && str_starts_with($order->payment_ref, 'pay_')) {
            $ref = self::payMongoRefund($order, 'AniBayan '.$request->id.' for order '.$order->number().': '.$request->reason);
            if (! $ref) {
                $request->update(['status' => 'Refunding', 'decided_by' => $decidedBy, 'decided_at' => $request->decided_at ?? now()]);

                return;
            }
        }
        DB::transaction(function () use ($request, $order, $decidedBy, $ref) {
            $request->update(['status' => 'Refunded', 'decided_by' => $decidedBy, 'decided_at' => $request->decided_at ?? now(), 'refund_ref' => $ref]);
            $order->update(['status' => 'Refunded', 'funds' => 'Refunded', 'funds_settled_at' => now()]);
        });
        Activity::record('refund-paid', $decidedBy === 'organization' ? $order->organization->name : 'AniBayan', $order->number().' · '.$request->id.' · ₱'.number_format($order->total));
    }

    // Returns PayMongo's refund id, or null when PayMongo isn't set up or refused (the reason goes to the log).
    private static function payMongoRefund(Order $order, string $notes): ?string
    {
        $secret = config('services.paymongo.secret');
        if (! $secret) {
            Log::warning('Refund for '.$order->number().' waits: PAYMONGO_SECRET_KEY is missing from .env.');

            return null;
        }
        $response = Http::withBasicAuth($secret, '')->acceptJson()->asJson()->timeout(20)->post('https://api.paymongo.com/refunds', ['data' => ['attributes' => [
            'amount' => $order->total * 100, 'payment_id' => $order->payment_ref, 'reason' => 'requested_by_customer', 'notes' => mb_substr($notes, 0, 250),
        ]]]);
        if ($response->failed()) {
            Log::warning('PayMongo refused the refund for '.$order->number().': '.($response->json('errors.0.detail') ?? $response->status()));

            return null;
        }

        return $response->json('data.id');
    }
}
