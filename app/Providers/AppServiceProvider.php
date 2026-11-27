<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
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
