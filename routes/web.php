<?php

use App\Http\Controllers\ActionController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReceiptController;
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
    Route::post('/password/forgot', [AuthController::class, 'forgotPassword']);
    Route::post('/password/reset', [AuthController::class, 'resetPassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
    // A file attached to an organization's application (administrators only).
    Route::get('/documents/{id}', [AuthController::class, 'document'])->whereNumber('id');
    // A photo or video attached to a refund request (the buyer, the organization and administrators).
    Route::get('/refund-media/{id}', [ReceiptController::class, 'media'])->whereNumber('id');
    // Every change: cart, checkout, orders, listings, members, reviews, reports, warnings, accounts, photos.
    Route::post('/actions/{action}', ActionController::class)->where('action', '[a-z.-]+');
    // AniBayan's in-app PayMongo Payment Intent flow (keys in .env).
    Route::post('/payments', [PaymentController::class, 'create']);
    Route::post('/payments/check', [PaymentController::class, 'check']);
    // For the admin's site-health check: how long a database read takes.
    Route::get('/health/database', function () {
        $start = microtime(true);
        $accounts = DB::table('users')->count();

        return response()->json(['ok' => true, 'accounts' => $accounts, 'ms' => round((microtime(true) - $start) * 1000, 1)])->header('Cache-Control', 'no-store');
    });
});

// Electronic receipts, printable (the pages open it after checkout and from each order). It sits outside /anibayan/
// because PHP's built-in server (php artisan serve) answers paths inside that folder itself.
Route::get('/receipt', [ReceiptController::class, 'show']);

// CPU, memory and storage readings for the Site health page.
Route::get('/server-health', ServerHealthController::class);
