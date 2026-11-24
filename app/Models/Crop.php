<?php

namespace App\Models;

use App\Models\Concerns\HasReadableId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// A crop listing. harvested_on is required; shelf_life is how many days the produce keeps after harvest.
class Crop extends Model
{
    use HasReadableId;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['harvested_on' => 'date:Y-m-d', 'price' => 'integer', 'stock' => 'integer', 'shelf_life' => 'integer'];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    // Days of shelf life left today; negative once it is past its shelf life.
    public function daysLeft(): int
    {
        return $this->shelf_life - (int) $this->harvested_on->copy()->startOfDay()->diffInDays(today());
    }

    // Shown in the shop and orderable: active, in stock, within its shelf life, from an organization still selling.
    public function isBuyable(): bool
    {
        return $this->status === 'Active' && $this->stock > 0 && $this->daysLeft() >= 0
            && $this->organization && ! $this->organization->isStopped();
    }
}
