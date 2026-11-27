<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
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

        ResetPassword::createUrlUsing(static function (User $user, string $token): string {
            $query = http_build_query([
                'reset' => 1,
                'token' => $token,
                'email' => $user->getEmailForPasswordReset(),
            ]);

            return url('/anibayan/login.html?'.$query.'#reset');
        });
    }
}
