<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// AniBayan's data: accounts, farmer organizations and their listings, orders, buyer reviews and reports,
// administrator warnings, member farmers, saved harvests, carts, the activity log and site-health checks.
// Listings, orders, reviews, reports, warnings and members keep the readable ids the pages show (CROP-001,
// AB-2026-1048, FB-118, RP-031, WN-001, MB-001).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120)->unique();
            $table->string('barangay', 60);
            $table->string('crop', 80);
            $table->string('image', 200)->default('field-detail.jpg');
            // Pending review, Active, Declined or Terminated.
            $table->string('status', 20)->default('Pending review');
            $table->string('representative', 120);
            $table->unsignedInteger('members_declared')->default(0);
            $table->json('documents')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('description', 240)->nullable();
            $table->date('applied_on');
            $table->date('approved_on')->nullable();
            $table->date('terminated_on')->nullable();
            $table->string('terminated_for', 200)->nullable();
            $table->string('avatar', 200)->nullable();
            $table->string('banner', 200)->nullable();
            $table->decimal('banner_x', 4, 1)->nullable();
            $table->decimal('banner_y', 4, 1)->nullable();
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('email', 160)->unique();
            $table->string('password');
            // Consumer (buyer), Representative or Administrator.
            $table->string('role', 20)->default('Consumer');
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            // Active, Suspended, Pending, Declined or Terminated.
            $table->string('status', 20)->default('Active');
            $table->string('phone', 20)->nullable();
            $table->string('address', 300)->nullable();
            $table->string('note', 300)->nullable();
            $table->date('joined_on');
            $table->date('last_active_on');
            $table->json('privacy')->nullable();
            $table->json('preferences')->nullable();
            $table->string('avatar', 200)->nullable();
            $table->string('banner', 200)->nullable();
            $table->decimal('banner_x', 4, 1)->nullable();
            $table->decimal('banner_y', 4, 1)->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('crops', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->string('image', 200);
            $table->unsignedInteger('price');
            $table->string('unit', 20)->default('kg');
            $table->string('category', 40);
            $table->unsignedInteger('stock');
            // Active or Unavailable (paused by the organization).
            $table->string('status', 20)->default('Active');
            $table->date('harvested_on');
            $table->unsignedSmallInteger('shelf_life');
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('crop', 120);
            $table->string('image', 200);
            $table->string('quantity', 40);
            $table->unsignedInteger('total');
            $table->date('placed_on');
            // Pending, Confirmed, Processing, Completed or Cancelled.
            $table->string('status', 20)->default('Pending');
            // Paid or Unpaid.
            $table->string('payment', 20)->default('Unpaid');
            $table->string('address', 300)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('method', 40)->nullable();
            $table->string('note', 200)->nullable();
            // PayMongo: the checkout opened for an unpaid order, and the payment once it is paid.
            $table->string('checkout_session', 80)->nullable();
            $table->string('payment_ref', 80)->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->string('order_id', 20);
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->string('crop_id', 20)->nullable();
            $table->string('name', 80);
            $table->unsignedInteger('quantity');
            $table->string('unit', 20);
            $table->unsignedInteger('price');
        });

        Schema::create('feedback', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('order_id', 20)->nullable();
            $table->unsignedTinyInteger('rating');
            $table->string('comment', 300)->default('');
            $table->date('given_on');
            $table->timestamps();
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('order_id', 20)->nullable();
            $table->string('reason', 80);
            $table->string('details', 500);
            $table->date('filed_on');
            // Open, Upheld (counts as a warning) or Dismissed.
            $table->string('status', 20)->default('Open');
            $table->date('decided_on')->nullable();
            $table->timestamps();
        });

        Schema::create('warnings', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('reason', 120);
            $table->string('details', 500)->default('');
            $table->date('given_on');
            $table->string('given_by', 120);
            $table->timestamps();
        });

        Schema::create('members', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->string('place', 60);
            $table->string('crops', 80);
            $table->decimal('area', 6, 1);
            $table->string('joined', 4);
            // Active or Pending.
            $table->string('status', 20)->default('Active');
            $table->timestamps();
        });

        Schema::create('saved_crops', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('crop_id', 20);
            $table->foreign('crop_id')->references('id')->on('crops')->cascadeOnDelete();
            $table->primary(['user_id', 'crop_id']);
        });

        Schema::create('cart_lines', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('crop_id', 20);
            $table->foreign('crop_id')->references('id')->on('crops')->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->primary(['user_id', 'crop_id']);
        });

        // actor: the email that did it (also an unknown email that tried to sign in); target: the account acted on.
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->dateTime('happened_at');
            $table->string('actor', 160);
            $table->string('type', 40);
            $table->string('detail', 300)->default('');
            $table->string('target', 160)->nullable();
            $table->index('happened_at');
        });

        Schema::create('health_runs', function (Blueprint $table) {
            $table->id();
            $table->dateTime('ran_at');
            $table->json('results');
            $table->json('hardware')->nullable();
            $table->string('hardware_error', 300)->nullable();
        });
    }

    public function down(): void
    {
        foreach (['health_runs', 'activities', 'cart_lines', 'saved_crops', 'members', 'warnings', 'reports', 'feedback', 'order_items', 'orders', 'crops', 'users', 'organizations'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
