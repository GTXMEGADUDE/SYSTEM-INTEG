<?php

use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

// Card and GCash payments through PayMongo's hosted checkout (keys in .env).
Route::post('/payments', [PaymentController::class, 'create']);
Route::get('/payments/{session}', [PaymentController::class, 'show']);
