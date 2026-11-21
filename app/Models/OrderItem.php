<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// One crop in an order, with the price it was bought at.
class OrderItem extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['quantity' => 'integer', 'price' => 'integer'];
    }
}
