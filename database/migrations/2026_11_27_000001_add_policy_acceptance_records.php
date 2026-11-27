<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('terms_version', 20)->nullable();
            $table->string('privacy_notice_version', 20)->nullable();
            $table->timestampTz('policies_accepted_at')->nullable();
            $table->string('sensitive_data_consent_version', 20)->nullable();
            $table->timestampTz('sensitive_data_consent_at')->nullable();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('terms_version', 20)->nullable();
            $table->timestampTz('terms_accepted_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['terms_version', 'terms_accepted_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['terms_version', 'privacy_notice_version', 'policies_accepted_at', 'sensitive_data_consent_version', 'sensitive_data_consent_at']);
        });
    }
};
