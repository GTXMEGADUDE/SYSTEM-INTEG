<?php

namespace App\Models\Concerns;

// Records whose id is a readable code like CROP-007 or RP-031: the next one continues the highest number.
trait HasReadableId
{
    public function getIncrementing(): bool
    {
        return false;
    }

    public function getKeyType(): string
    {
        return 'string';
    }

    // $prefix "CROP-" with $pad 3 gives CROP-009 after CROP-008; $pad 0 gives FB-119 after FB-118.
    public static function nextId(string $prefix, int $pad = 0): string
    {
        $highest = static::query()->where('id', 'like', $prefix.'%')->pluck('id')
            ->map(fn ($id) => (int) substr($id, strlen($prefix)))->max() ?? 0;

        return $prefix.str_pad((string) ($highest + 1), $pad, '0', STR_PAD_LEFT);
    }
}
