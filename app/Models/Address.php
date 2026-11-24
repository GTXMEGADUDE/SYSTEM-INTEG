<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// A buyer's saved delivery address in Calapan City: a barangay, optional house/street details and an optional map pin.
class Address extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['lat' => 'float', 'lng' => 'float', 'is_default' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // "12 J.P. Rizal Street, Barangay Lalud, Calapan City, Oriental Mindoro"; a pin without details reads "Pinned location, …".
    public static function text(?string $details, string $barangay, bool $pinned): string
    {
        $first = trim((string) $details) !== '' ? trim($details) : ($pinned ? 'Pinned location' : '');

        return ltrim($first.', Barangay '.$barangay.', '.config('anibayan.city').', '.config('anibayan.province'), ', ');
    }

    public function fullText(): string
    {
        return self::text($this->details, $this->barangay, $this->lat !== null);
    }

    public function forPage(): array
    {
        return array_filter(['id' => $this->id, 'label' => $this->label, 'details' => $this->details ?? '', 'barangay' => $this->barangay,
            'lat' => $this->lat, 'lng' => $this->lng, 'isDefault' => $this->is_default, 'text' => $this->fullText()], fn ($v) => $v !== null);
    }
}
