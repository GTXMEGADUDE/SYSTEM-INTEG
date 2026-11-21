<?php

namespace App\Models;

use App\Models\Concerns\HasReadableId;
use Illuminate\Database\Eloquent\Model;

// A buyer's 1–5 star rating of a completed order, with an optional comment.
class Feedback extends Model
{
    use HasReadableId;

    protected $table = 'feedback';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['given_on' => 'date:Y-m-d', 'rating' => 'integer'];
    }
}
