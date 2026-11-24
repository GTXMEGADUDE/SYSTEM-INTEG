<?php

namespace App\Support;

use App\Models\Activity;
use App\Models\Order;
use App\Models\Organization;
use App\Models\RefundRequest;
use App\Models\User;

// What happens to orders that are still open when an administrator suspends someone.
//
// A buyer is suspended:
//   - orders the organization hasn't confirmed yet are cancelled (stock goes back; online payments are refunded);
//   - orders already confirmed or being prepared stay with the organization, which may still deliver them or cancel
//     them (ActionController::orderDecline);
//   - delivered orders complete on their own 7 days after delivery, since the buyer can't confirm them;
//   - refund requests the buyer already made carry on.
// An organization is terminated or its representative suspended:
//   - its listings leave the shop (Organization::isStopped);
//   - every order it hasn't delivered is cancelled and refunded;
//   - refund requests waiting for its answer are granted at once, and so are new ones, since nobody can answer them;
//   - delivered orders keep their 7 days for the buyer to confirm or ask for a refund.
class Suspensions
{
    // Returns how many orders were cancelled.
    public static function buyerSuspended(User $buyer, string $reason = ''): int
    {
        $orders = Order::where('user_id', $buyer->id)->where('status', 'Pending')->get();
        foreach ($orders as $order) {
            $notice = 'The buyer’s account was suspended.'.($reason !== '' ? ' Reason: '.$reason : '');
            self::cancel($order, mb_substr($notice, 0, 500));
        }

        return $orders->count();
    }

    public static function organizationStopped(Organization $org, string $what, string $reason = ''): int
    {
        $orders = Order::where('organization_id', $org->id)->whereIn('status', ['Pending', 'Confirmed', 'Processing'])->get();
        foreach ($orders as $order) {
            $notice = $org->name.' '.$what.'.'.($reason !== '' ? ' Reason: '.$reason : '');
            self::cancel($order, mb_substr($notice, 0, 500));
        }
        foreach (RefundRequest::with('order.organization')->where('organization_id', $org->id)->where('status', 'Requested')->get() as $request) {
            $refundNote = $org->name.' '.$what.($reason !== '' ? ' because: '.$reason : '').'. AniBayan approved this refund because the organization can’t respond.';
            $request->update(['admin_note' => mb_substr($refundNote, 0, 300)]);
            Escrow::refund($request, 'automatic');
        }

        return $orders->count();
    }

    // Cancels one order with the reason both sides see, and sends back a payment AniBayan is holding.
    public static function cancel(Order $order, string $reason): void
    {
        $order->cancel_reason = $reason;
        $order->moveTo('Cancelled');
        if ($order->payment === 'Paid' && $order->funds === 'Held') {
            Escrow::refundOrder($order, $reason);
        }
        Activity::record('order-cancelled', 'AniBayan', $order->number().' · '.$reason);
    }
}
