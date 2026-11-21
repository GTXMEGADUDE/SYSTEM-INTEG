<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

// A farmer organization in one of Calapan City's barangays.
class Organization extends Model
{
    // Every upheld report and every administrator warning counts; at this many the organization is on its final warning.
    public const WARNING_LIMIT = 3;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'documents' => 'array',
            'applied_on' => 'date:Y-m-d',
            'approved_on' => 'date:Y-m-d',
            'terminated_on' => 'date:Y-m-d',
            'banner_x' => 'float',
            'banner_y' => 'float',
        ];
    }

    public function crops(): HasMany
    {
        return $this->hasMany(Crop::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }

    public function representativeAccount(): ?User
    {
        return User::where('organization_id', $this->id)->where('role', 'Representative')->first();
    }

    // "<barangay>, Calapan City", as the pages show it.
    public function region(): string
    {
        return $this->barangay.', Calapan City';
    }

    public function warningCount(): int
    {
        return Report::where('organization_id', $this->id)->where('status', 'Upheld')->count()
            + Warning::where('organization_id', $this->id)->count();
    }

    public function onFinalWarning(): bool
    {
        return $this->status !== 'Terminated' && $this->warningCount() >= self::WARNING_LIMIT;
    }
}
