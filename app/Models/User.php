<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;

// An AniBayan account: a buyer (role Consumer), an organization's representative, or an administrator.
class User extends Authenticatable
{
    protected $guarded = [];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'joined_on' => 'date:Y-m-d',
            'last_active_on' => 'date:Y-m-d',
            'privacy' => 'array',
            'preferences' => 'array',
            'banner_x' => 'float',
            'banner_y' => 'float',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function isBuyer(): bool
    {
        return $this->role === 'Consumer';
    }

    public function isRepresentative(): bool
    {
        return $this->role === 'Representative';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'Administrator';
    }

    // What a buyer's profile shows to others; every option is on until the buyer turns it off.
    public function privacySettings(): array
    {
        return array_merge(['profile' => true, 'reviews' => true, 'city' => true, 'growers' => true], $this->privacy ?? []);
    }
}
