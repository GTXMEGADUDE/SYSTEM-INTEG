<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO,
        );
        $middleware->trustHosts(at: static function (): array {
            $appHost = parse_url((string) config('app.url'), PHP_URL_HOST);
            $trustedHosts = $appHost ? ['^'.preg_quote($appHost, '#').'$'] : [];
            $trustedHosts[] = '^localhost$';
            $trustedHosts[] = '^127\\.0\\.0\\.1$';
            $trustedHosts[] = '^\\[?::1\\]?$';

            return $trustedHosts;
        }, subdomains: false);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
        // AniBayan's pages only ever show messages AniBayan wrote: form-field messages and refusals from
        // Controller::refuse(). Anything else that goes wrong (a database error, a missing route, an expired form)
        // reaches the page as a short generic message, even with APP_DEBUG on, so no query, file path or stack trace
        // is ever shown. The full error is still written to storage/logs.
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*', 'server-health') && ! $request->expectsJson()) {
                return null;
            }
            if ($e instanceof HttpResponseException) {
                return null;
            }
            if ($e instanceof ValidationException) {
                $errors = $e->errors();

                return response()->json(['message' => collect($errors)->flatten()->first(), 'errors' => $errors], $e->status);
            }
            $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : ($e instanceof AuthenticationException ? 401 : 500);
            $message = match ($status) {
                401 => 'Sign in again to continue.',
                403, 404, 405 => 'That isn’t available.',
                419 => 'This page expired. Reload it and try again.',
                429 => 'Too many tries. Wait a minute, then try again.',
                default => 'Something went wrong. Try again in a moment.',
            };

            return response()->json(['message' => $message], $status >= 400 && $status < 600 ? $status : 500);
        });
    })->create();
