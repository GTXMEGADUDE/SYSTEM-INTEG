<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Buyers keep saved delivery addresses (each can be a pin on the map); organizations mark orders delivered and
// buyers confirm receipt; online payments are held for 7 days after delivery, and buyers can ask for a refund
// in that time with photos or videos as proof.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label', 40);
            // House number, street or landmark; may be empty when the address is a pin.
            $table->string('details', 120)->nullable();
            $table->string('barangay', 60);
            $table->decimal('lat', 9, 6)->nullable();
            $table->decimal('lng', 9, 6)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('lat', 9, 6)->nullable();
            $table->decimal('lng', 9, 6)->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->dateTime('delivered_at')->nullable();
            $table->dateTime('received_at')->nullable();
            // Online payments only: Held (AniBayan keeps it), Released (to the organization) or Refunded (to the buyer).
            $table->string('funds', 20)->nullable();
            $table->dateTime('funds_settled_at')->nullable();
        });

        Schema::create('refund_requests', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('order_id', 20);
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('reason', 60);
            $table->string('details', 1000);
            // Requested (waiting for the organization), Disputed (waiting for an administrator), Refunding (PayMongo hasn't
            // confirmed yet), Refunded, or Denied (an administrator released the money to the organization).
            $table->string('status', 20)->default('Requested');
            $table->dateTime('requested_at');
            $table->dateTime('respond_by');
            $table->string('dispute_reason', 300)->nullable();
            $table->dateTime('disputed_at')->nullable();
            // What the administrator wrote when deciding a dispute, shown to the buyer and the organization.
            $table->string('admin_note', 300)->nullable();
            $table->dateTime('decided_at')->nullable();
            // organization, admin or automatic.
            $table->string('decided_by', 20)->nullable();
            $table->string('refund_ref', 80)->nullable();
            $table->timestamps();
        });

        Schema::create('refund_media', function (Blueprint $table) {
            $table->id();
            $table->string('refund_request_id', 20);
            $table->foreign('refund_request_id')->references('id')->on('refund_requests')->cascadeOnDelete();
            $table->string('name', 160);
            $table->string('path', 200);
            $table->string('mime', 60);
            $table->unsignedBigInteger('size');
            $table->timestamps();
        });

        // Each buyer's one saved address becomes their first saved address ("12 Street, Barangay X, Calapan City, ...").
        foreach (DB::table('users')->whereNotNull('address')->get(['id', 'address']) as $user) {
            if (preg_match('/^(.*?),\s*Barangay\s+([^,]+),/u', $user->address, $m)) {
                DB::table('addresses')->insert([
                    'user_id' => $user->id, 'label' => 'Home', 'details' => trim($m[1]), 'barangay' => trim($m[2]),
                    'is_default' => true, 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('address');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('address', 300)->nullable();
        });
        Schema::dropIfExists('refund_media');
        Schema::dropIfExists('refund_requests');
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['lat', 'lng', 'paid_at', 'delivered_at', 'received_at', 'funds', 'funds_settled_at']);
        });
        Schema::dropIfExists('addresses');
    }
};
