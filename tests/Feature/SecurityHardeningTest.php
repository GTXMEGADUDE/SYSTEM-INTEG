<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('activities');
        Schema::dropIfExists('users');
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('Consumer');
            $table->string('status')->default('Active');
            $table->timestamps();
        });
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->timestamp('happened_at');
            $table->string('actor');
            $table->string('type');
            $table->string('detail');
            $table->string('target')->nullable();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('activities');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_health_endpoints_are_hidden_from_guests_and_regular_accounts(): void
    {
        $this->getJson('/api/health/database')->assertNotFound();
        $this->getJson('/server-health')->assertNotFound();

        $buyer = new User(['name' => 'Buyer', 'email' => 'buyer@example.com', 'role' => 'Consumer', 'status' => 'Active']);
        $this->actingAs($buyer)->getJson('/api/health/database')->assertNotFound();
        $this->getJson('/server-health')->assertNotFound();
    }

    public function test_database_health_is_available_to_an_active_administrator(): void
    {
        User::create([
            'name' => 'Admin', 'email' => 'admin@example.com', 'password' => Hash::make('a-secure-test-password'),
            'role' => 'Administrator', 'status' => 'Active',
        ]);

        $admin = User::where('email', 'admin@example.com')->firstOrFail();
        $this->actingAs($admin)->getJson('/api/health/database')
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('accounts', 1);
    }

    public function test_login_failures_are_rate_limited_per_email(): void
    {
        foreach (range(1, 5) as $_) {
            $this->postJson('/api/login', ['email' => 'unknown@example.com', 'password' => 'wrong-password'])
                ->assertUnprocessable();
        }

        $this->postJson('/api/login', ['email' => 'unknown@example.com', 'password' => 'wrong-password'])
            ->assertTooManyRequests();
    }

    public function test_shared_seed_password_is_rejected_in_production(): void
    {
        config()->set('app.env', 'production');
        User::create([
            'name' => 'Seeded Buyer', 'email' => 'buyer@example.com', 'password' => Hash::make(config('anibayan.demo_password')),
            'role' => 'Consumer', 'status' => 'Active',
        ]);

        $this->postJson('/api/login', ['email' => 'buyer@example.com', 'password' => config('anibayan.demo_password')])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'The email or password is incorrect.');
    }
}
