<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PaymentControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('orders');
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
        Schema::create('orders', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id');
            $table->unsignedInteger('total');
            $table->string('status')->default('Pending');
            $table->string('payment')->default('Unpaid');
            $table->string('method')->nullable();
            $table->string('checkout_session')->nullable();
            $table->string('payment_ref')->nullable();
            $table->timestamps();
        });

        config()->set('services.paymongo.secret', 'sk_test_payment_controller_test');
        config()->set('services.paymongo.public', 'pk_test_payment_controller_test');
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('orders');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_creates_a_qr_ph_intent_for_the_exact_peso_total(): void
    {
        Http::fake(['*' => Http::response([
            'data' => ['id' => 'pi_test_100', 'attributes' => ['client_key' => 'pi_test_100_secret_test']],
        ], 201)]);

        $buyer = $this->buyer();
        $order = $this->order($buyer, 'AB-2026-1001', 375, 'GCash or QR Ph');

        $this->actingAs($buyer)->postJson('/api/payments', ['orders' => [$order->id], 'method' => 'GCash or QR Ph'])
            ->assertOk()
            ->assertJsonPath('intentId', 'pi_test_100')
            ->assertJsonPath('method', 'qrph');

        Http::assertSent(fn (ClientRequest $request) => str_ends_with($request->url(), '/payment_intents')
            && $request->data()['data']['attributes']['amount'] === 37_500
            && $request->data()['data']['attributes']['payment_method_allowed'] === ['qrph']);

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'method' => 'GCash or QR Ph', 'checkout_session' => 'pi_test_100']);
    }

    public function test_accepts_a_one_peso_qr_ph_payment(): void
    {
        Http::fake(['*' => Http::response([
            'data' => ['id' => 'pi_test_one_peso', 'attributes' => ['client_key' => 'pi_test_one_peso_secret_test']],
        ], 201)]);

        $buyer = $this->buyer();
        $order = $this->order($buyer, 'AB-2026-1007', 1, 'GCash or QR Ph');

        $this->actingAs($buyer)->postJson('/api/payments', ['orders' => [$order->id], 'method' => 'GCash or QR Ph'])
            ->assertOk()
            ->assertJsonPath('method', 'qrph');

        Http::assertSent(fn (ClientRequest $request) => str_ends_with($request->url(), '/payment_intents')
            && $request->data()['data']['attributes']['amount'] === 100
            && $request->data()['data']['attributes']['payment_method_allowed'] === ['qrph']);
    }

    public function test_refuses_mismatched_paymongo_key_modes_before_contacting_paymongo(): void
    {
        config()->set('services.paymongo.public', 'pk_live_config_test');
        Http::fake();

        $buyer = $this->buyer();
        $order = $this->order($buyer, 'AB-2026-1008', 1, 'GCash or QR Ph');

        $this->actingAs($buyer)->postJson('/api/payments', ['orders' => [$order->id], 'method' => 'GCash or QR Ph'])
            ->assertStatus(503)
            ->assertJsonPath('message', 'PayMongo public and secret keys must both be test keys or both be live keys. Save a matching pair in the app environment.');

        $this->postJson('/api/payments/check')
            ->assertStatus(503)
            ->assertJsonPath('message', 'PayMongo public and secret keys must both be test keys or both be live keys. Save a matching pair in the app environment.');

        Http::assertNothingSent();
    }

    public function test_accepts_the_highest_whole_peso_amount_paymongo_allows(): void
    {
        Http::fake(['*' => Http::response([
            'data' => ['id' => 'pi_test_max', 'attributes' => ['client_key' => 'pi_test_max_secret_test']],
        ], 201)]);

        $buyer = $this->buyer();
        $order = $this->order($buyer, 'AB-2026-1002', 9_999_999, 'GCash or QR Ph');

        $this->actingAs($buyer)->postJson('/api/payments', ['orders' => [$order->id], 'method' => 'GCash or QR Ph'])
            ->assertOk();

        Http::assertSent(fn (ClientRequest $request) => str_ends_with($request->url(), '/payment_intents')
            && $request->data()['data']['attributes']['amount'] === 999_999_900);
    }

    public function test_rejects_amounts_outside_paymongos_transaction_range_before_calling_the_provider(): void
    {
        Http::fake();
        $buyer = $this->buyer();
        $order = $this->order($buyer, 'AB-2026-1003', 10_000_000, 'GCash or QR Ph');

        $this->actingAs($buyer)->postJson('/api/payments', ['orders' => [$order->id], 'method' => 'GCash or QR Ph'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'PayMongo accepts up to ₱9,999,999.99 per transaction. This total needs to be split into smaller orders before payment.');

        Http::assertNothingSent();
    }

    public function test_reports_a_clear_minimum_when_order_total_is_zero(): void
    {
        Http::fake();
        $buyer = $this->buyer();
        $order = $this->order($buyer, 'AB-2026-1004', 0, 'GCash or QR Ph');

        $this->actingAs($buyer)->postJson('/api/payments', ['orders' => [$order->id], 'method' => 'GCash or QR Ph'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'The minimum online payment is ₱1.00.');

        Http::assertNothingSent();
    }

    public function test_keeps_card_payment_available_alongside_qr_ph(): void
    {
        Http::fake(['*' => Http::response([
            'data' => ['id' => 'pi_test_card', 'attributes' => ['client_key' => 'pi_test_card_secret_test']],
        ], 201)]);
        $buyer = $this->buyer();
        $order = $this->order($buyer, 'AB-2026-1006', 100, 'Credit or debit card');

        $this->actingAs($buyer)->postJson('/api/payments', ['orders' => [$order->id], 'method' => 'Credit or debit card'])
            ->assertOk()
            ->assertJsonPath('method', 'card');

        Http::assertSent(fn (ClientRequest $request) => str_ends_with($request->url(), '/payment_intents')
            && $request->data()['data']['attributes']['payment_method_allowed'] === ['card']);
    }

    public function test_returns_a_json_connection_error_when_paymongo_is_unreachable(): void
    {
        Http::fake(fn () => throw new ConnectionException('Simulated provider outage.'));
        $buyer = $this->buyer();
        $order = $this->order($buyer, 'AB-2026-1005', 125, 'GCash or QR Ph');

        $this->actingAs($buyer)->postJson('/api/payments', ['orders' => [$order->id]])
            ->assertStatus(503)
            ->assertJsonPath('message', 'PayMongo could not be reached. Check your connection and try again.');
    }

    private function buyer(): User
    {
        return User::create([
            'name' => 'Test buyer',
            'email' => 'buyer@example.test',
            'password' => 'secret',
            'role' => 'Consumer',
            'status' => 'Active',
        ]);
    }

    private function order(User $buyer, string $id, int $total, string $method): Order
    {
        return Order::create([
            'id' => $id,
            'user_id' => $buyer->id,
            'total' => $total,
            'status' => 'Pending',
            'payment' => 'Unpaid',
            'method' => $method,
        ]);
    }
}
