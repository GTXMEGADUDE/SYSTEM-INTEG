<?php

use App\Http\Controllers\ActionController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ServerHealthController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// AniBayan's pages are static files in public/anibayan/; they read and change their data through these routes.
// They run in the web group, so sign-in uses Laravel's session cookie and every POST needs the XSRF-TOKEN cookie
// sent back as the X-XSRF-TOKEN header (the pages do this in shared.ts).
Route::redirect('/', '/anibayan/');

Route::prefix('api')->group(function () {
    // The signed-in person's data (see App\Support\AppState).
    Route::get('/state', [AuthController::class, 'state']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/logout', [AuthController::class, 'logout']);
    // Every change: cart, checkout, orders, listings, members, reviews, reports, warnings, accounts, photos.
    Route::post('/actions/{action}', ActionController::class)->where('action', '[a-z.-]+');
    // Card and GCash payments through PayMongo's hosted checkout (keys in .env).
    Route::post('/payments', [PaymentController::class, 'create']);
    Route::post('/payments/check', [PaymentController::class, 'check']);
    // For the admin's site-health check: how long a database read takes.
    Route::get('/health/database', function () {
        $start = microtime(true);
        $accounts = DB::table('users')->count();

        return response()->json(['ok' => true, 'accounts' => $accounts, 'ms' => round((microtime(true) - $start) * 1000, 1)])->header('Cache-Control', 'no-store');
    });
});

// CPU, memory and storage readings for the Site health page.
Route::get('/server-health', ServerHealthController::class);
