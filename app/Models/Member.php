<?php

namespace App\Models;

use App\Models\Concerns\HasReadableId;
use Illuminate\Database\Eloquent\Model;

// A farmer who belongs to an organization. Members don't have accounts; the representative keeps this list.
class Member extends Model
{
    use HasReadableId;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['area' => 'float'];
    }
}
