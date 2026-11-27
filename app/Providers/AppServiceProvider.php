<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('auth-login', function (Request $request) {
            $email = mb_strtolower(trim((string) $request->input('email')));
            $failed = static fn ($response): bool => $response->getStatusCode() === 422;

            return [
                Limit::perMinute(20)->by('login-ip:'.$request->ip())->after($failed),
                Limit::perMinute(5)->by('login-email:'.hash('sha256', $email))->after($failed),
            ];
        });
    }
}
