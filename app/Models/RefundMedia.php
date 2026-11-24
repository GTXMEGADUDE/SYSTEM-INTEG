<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// A photo or video a buyer attached to a refund request as proof (kept in storage/app/private/refund-media).
class RefundMedia extends Model
{
    protected $table = 'refund_media';

    protected $guarded = [];

    public function refundRequest(): BelongsTo
    {
        return $this->belongsTo(RefundRequest::class);
    }
}
