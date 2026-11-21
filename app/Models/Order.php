<?php

namespace App\Models;

use App\Models\Concerns\HasReadableId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// One buyer's order with one organization. Checkout places one order per organization in the cart.
class Order extends Model
{
    use HasReadableId;

    // What an organization does next with an order: current status => [next status, button label].
    public const NEXT_STEP = ['Pending' => ['Confirmed', 'Confirm order'], 'Confirmed' => ['Processing', 'Start preparing'], 'Processing' => ['Completed', 'Mark completed']];

    protected $guarded = [];

    protected function casts(): array
    {
        return ['placed_on' => 'date:Y-m-d', 'total' => 'integer'];
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

    // Paid online with GCash or a card through PayMongo (not cash on delivery).
    public function isOnline(): bool
    {
        return $this->method !== null && $this->method !== 'Cash on delivery';
    }

    // Cancelling puts its items back in stock; cash-on-delivery orders count as paid once completed.
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
        if ($status === 'Completed' && $this->method === 'Cash on delivery') {
            $this->payment = 'Paid';
        }
        $this->save();
    }

    // "#1048" for "AB-2026-1048".
    public function number(): string
    {
        return '#'.substr($this->id, 8);
    }
}
