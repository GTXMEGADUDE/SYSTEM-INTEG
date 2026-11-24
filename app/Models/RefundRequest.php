<?php

namespace App\Models;

use App\Models\Concerns\HasReadableId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// A buyer's request for their money back on a delivered order, made within the 7 days the payment is held.
// The organization accepts it (refund) or disputes it within 10 days; if it does neither, the buyer is refunded
// automatically. A disputed request waits for an administrator, who refunds the buyer or releases the money to the
// organization. The payment stays held until then.
class RefundRequest extends Model
{
    use HasReadableId;

    public const REASONS = ['Damaged items', 'Spoiled or poor quality', 'Wrong items', 'Missing items', 'Not delivered', 'Other'];

    protected $guarded = [];

    protected function casts(): array
    {
        return ['requested_at' => 'datetime', 'respond_by' => 'datetime', 'decided_at' => 'datetime', 'disputed_at' => 'datetime'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(RefundMedia::class)->orderBy('id');
    }
}
