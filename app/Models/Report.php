<?php

namespace App\Models;

use App\Models\Concerns\HasReadableId;
use Illuminate\Database\Eloquent\Model;

// A buyer's report about an organization. An administrator upholds it (it counts as a warning) or dismisses it.
class Report extends Model
{
    use HasReadableId;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['filed_on' => 'date:Y-m-d', 'decided_on' => 'date:Y-m-d'];
    }
}
