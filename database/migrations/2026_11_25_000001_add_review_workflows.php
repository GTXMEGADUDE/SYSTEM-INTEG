<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('suspension_reason', 500)->nullable();
        });

        Schema::table('crops', function (Blueprint $table) {
            $table->string('removal_reason', 500)->nullable();
            $table->foreignId('removed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('removed_at')->nullable();
        });

        Schema::table('members', function (Blueprint $table) {
            $table->string('application_message', 500)->nullable();
        });

        Schema::create('barangays', function (Blueprint $table) {
            $table->id();
            $table->string('municipality', 80);
            $table->string('name', 80);
            $table->string('name_key', 80);
            $table->timestamps();
            $table->unique(['municipality', 'name_key']);
        });

        $now = now();
        $rows = collect(config('anibayan.barangays', []))->map(fn ($name) => [
            'municipality' => config('anibayan.city'),
            'name' => $name,
            'name_key' => mb_strtolower(trim($name)),
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();
        if ($rows) {
            DB::table('barangays')->insert($rows);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('barangays');
        Schema::table('members', fn (Blueprint $table) => $table->dropColumn('application_message'));
        Schema::table('crops', function (Blueprint $table) {
            $table->dropConstrainedForeignId('removed_by');
            $table->dropColumn(['removal_reason', 'removed_at']);
        });
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('suspension_reason'));
    }
};
