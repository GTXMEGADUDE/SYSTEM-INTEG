<?php

namespace App\Http\Controllers;

use Illuminate\Http\Exceptions\HttpResponseException;

abstract class Controller
{
    // A refusal whose message AniBayan wrote for the person using the page ("That order wasn't found."). Only these
    // and form-field messages reach the pages; every other error becomes a generic message (bootstrap/app.php).
    protected static function refuse(string $message, int $status = 422): never
    {
        throw new HttpResponseException(response()->json(['message' => $message], $status));
    }

    protected static function refuseIf(mixed $condition, int $status, string $message): void
    {
        if ($condition) {
            self::refuse($message, $status);
        }
    }

    protected static function refuseUnless(mixed $condition, int $status, string $message): void
    {
        if (! $condition) {
            self::refuse($message, $status);
        }
    }
}
