<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// One event in the administrators' activity log. actor: the email that did it (also an unknown email that
// tried to sign in). target: the account an administrator acted on.
class Activity extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['happened_at' => 'datetime'];
    }

    // Records an event now. The log keeps the newest 1,000.
    public static function record(string $type, string $actor, string $detail = '', ?string $target = null): void
    {
        static::create(['happened_at' => now(), 'actor' => $actor, 'type' => $type, 'detail' => mb_substr($detail, 0, 300), 'target' => $target ?: null]);
        $cutoff = static::orderByDesc('id')->skip(1000)->value('id');
        if ($cutoff) {
            static::where('id', '<=', $cutoff)->delete();
        }
    }
}
