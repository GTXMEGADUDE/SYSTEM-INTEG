<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BarangayDirectory
{
    public static function names(): array
    {
        if (! Schema::hasTable('barangays')) {
            return config('anibayan.barangays', []);
        }

        return DB::table('barangays')->where('municipality', config('anibayan.city'))->orderBy('name')->pluck('name')->all();
    }
}
