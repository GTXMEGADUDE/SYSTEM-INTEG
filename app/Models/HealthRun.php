<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// One run of the administrators' site-health checks; the newest 30 are kept.
class HealthRun extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['ran_at' => 'datetime', 'results' => 'array', 'hardware' => 'array'];
    }
}
