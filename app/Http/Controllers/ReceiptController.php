<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\RefundMedia;
use App\Models\User;
use App\Support\Escrow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

// Electronic receipts, and the photos and videos attached to refund requests. Each is shown only to the order's buyer,
// the selling organization's representative and administrators.
class ReceiptController extends Controller
{
    private static function canSee(?User $viewer, Order $order): bool
    {
        return $viewer && $viewer->status === 'Active' && ($viewer->isAdmin() || $order->user_id === $viewer->id
            || ($viewer->isRepresentative() && $viewer->organization_id === $order->organization_id));
    }

    // /receipt?orders=AB-2026-1053,AB-2026-1054: one receipt per order (one per organization at checkout).
    public function show(Request $request): View
    {
        Escrow::settle();
        $ids = array_slice(array_filter(explode(',', (string) $request->query('orders'))), 0, 20);
        $orders = Order::with(['items', 'organization', 'user', 'refundRequest'])->whereIn('id', $ids)->get()->sortBy('id')->values();
        abort_if($orders->isEmpty() || $orders->count() !== count(array_unique($ids)) || $orders->contains(fn ($o) => ! self::canSee(Auth::user(), $o)), 404);

        return view('receipt', ['orders' => $orders, 'city' => config('anibayan.city').', '.config('anibayan.province')]);
    }

    public function media(int $id): BinaryFileResponse
    {
        $media = RefundMedia::with('refundRequest.order')->find($id);
        if (! $media || ! self::canSee(Auth::user(), $media->refundRequest->order) || ! Storage::disk('local')->exists($media->path)) {
            self::refuse('That file isn’t available.', 404);
        }

        return response()->file(Storage::disk('local')->path($media->path), [
            'Content-Type' => $media->mime, 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store',
        ]);
    }
}
