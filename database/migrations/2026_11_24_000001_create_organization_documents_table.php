<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Organization applications now attach their documents as files (kept in storage/app/private, opened only by
// administrators), instead of ticking which documents they could submit. The member-farmer count typed at sign-up
// is gone too: an organization's member count is the member farmers its representative records.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            // One of App\Support\Documents::TYPES.
            $table->string('type', 60);
            // The file's name on the applicant's computer, shown to administrators.
            $table->string('name', 160);
            // Where it's saved on the 'local' disk, under a random name.
            $table->string('path', 200);
            $table->string('mime', 60);
            $table->unsignedInteger('size');
            $table->timestamps();
        });
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn(['members_declared', 'documents']);
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->unsignedInteger('members_declared')->default(0);
            $table->json('documents')->nullable();
        });
        Schema::dropIfExists('organization_documents');
    }
};
