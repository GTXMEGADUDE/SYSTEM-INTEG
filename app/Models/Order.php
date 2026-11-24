<?php

namespace App\Models;

use App\Models\Concerns\HasReadableId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

// One buyer's order with one organization. Checkout places one order per organization in the cart.
class Order extends Model
{
    use HasReadableId;

    // What an organization does next with an order: current status => [next status, button label]. After
    // "Delivered" it's the buyer who confirms "Order received", which completes the order.
    public const NEXT_STEP = ['Pending' => ['Confirmed', 'Confirm order'], 'Confirmed' => ['Processing', 'Start preparing'], 'Processing' => ['Delivered', 'Mark delivered']];

    // An online payment stays with AniBayan for this many days after delivery, or until the buyer confirms receipt.
    // A refund can be requested in that time.
    public const HOLD_DAYS = 7;

    // Days an organization has to accept or dispute a refund request before the buyer is refunded automatically.
    public const RESPOND_DAYS = 10;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['placed_on' => 'date:Y-m-d', 'total' => 'integer', 'lat' => 'float', 'lng' => 'float', 'paid_at' => 'datetime',
            'delivered_at' => 'datetime', 'received_at' => 'datetime', 'funds_settled_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function refundRequest(): HasOne
    {
        return $this->hasOne(RefundRequest::class);
    }

    // When the held payment goes to the organization if the buyer neither confirms receipt nor asks for a refund.
    public function releaseOn(): ?\Illuminate\Support\Carbon
    {
        return $this->delivered_at?->copy()->addDays(self::HOLD_DAYS);
    }

    // A delivered order paid online, still inside its 7 days, can get a refund request (one per order).
    public function canRequestRefund(): bool
    {
        return $this->status === 'Delivered' && $this->funds === 'Held' && $this->releaseOn()?->isFuture() && ! $this->refundRequest()->exists();
    }

    // Paid online with GCash or a card through PayMongo (not cash on delivery).
    public function isOnline(): bool
    {
        return $this->method !== null && $this->method !== 'Cash on delivery';
    }

    // Cancelling puts its items back in stock; cash-on-delivery orders count as paid once delivered.
    public function moveTo(string $status): void
    {
        if ($status === 'Cancelled' && $this->status !== 'Cancelled') {
            foreach ($this->items as $item) {
                if ($item->crop_id) {
                    Crop::where('id', $item->crop_id)->increment('stock', $item->quantity);
                }
            }
        }
        $this->status = $status;
        if ($status === 'Delivered') {
            $this->delivered_at = now();
            if ($this->method === 'Cash on delivery' && $this->payment !== 'Paid') {
                $this->payment = 'Paid';
                $this->paid_at = now();
            }
        }
        $this->save();
    }

    // "#1048" for "AB-2026-1048".
    public function number(): string
    {
        return '#'.substr($this->id, 8);
    }
}
