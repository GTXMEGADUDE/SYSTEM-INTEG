<?php

use Illuminate\Support\Facades\Route;

// AniBayan's pages are static files in public/anibayan/.
Route::redirect('/', '/anibayan/');
