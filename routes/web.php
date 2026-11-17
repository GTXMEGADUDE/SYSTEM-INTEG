<?php

use App\Http\Controllers\ServerHealthController;
use Illuminate\Support\Facades\Route;

// AniBayan's pages are static files in public/anibayan/.
Route::redirect('/', '/anibayan/');

// CPU, memory and storage readings for the Site health page.
Route::get('/server-health', ServerHealthController::class);
