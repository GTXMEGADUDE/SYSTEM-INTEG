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
        $entry = static::create(['happened_at' => now(), 'actor' => mb_substr($actor, 0, 160), 'type' => $type, 'detail' => mb_substr($detail, 0, 300), 'target' => $target ? mb_substr($target, 0, 160) : null]);
        // Keep about the newest 1000; checking every 50th entry is enough (each check is a round trip to the database).
        if ($entry->id % 50 !== 0) {
            return;
        }
        $cutoff = static::orderByDesc('id')->skip(1000)->value('id');
        if ($cutoff) {
            static::where('id', '<=', $cutoff)->delete();
        }
    }
}
