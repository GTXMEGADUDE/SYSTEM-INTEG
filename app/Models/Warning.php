<?php

namespace App\Models;

use App\Models\Concerns\HasReadableId;
use Illuminate\Database\Eloquent\Model;

// A warning an administrator gave an organization directly. Upheld reports count as warnings too.
class Warning extends Model
{
    use HasReadableId;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['given_on' => 'date:Y-m-d'];
    }
}
