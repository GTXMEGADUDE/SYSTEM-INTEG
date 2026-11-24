<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->string('application_decline_reason', 500)->nullable();
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->string('decision_note', 500)->nullable();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('cancel_reason', 500)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn('decision_note');
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn('application_decline_reason');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('cancel_reason', 200)->nullable()->change();
        });
    }
};
