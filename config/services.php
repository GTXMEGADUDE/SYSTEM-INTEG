<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'paymongo' => [
        'public' => env('PAYMONGO_PUBLIC_KEY'),
        'secret' => env('PAYMONGO_SECRET_KEY'),
        // PayMongo's checkout only shows photos from a public https address. A site served over https uses its own
        // copies; otherwise (127.0.0.1) the copies in the GitHub repo are used.
        'images' => env('PAYMONGO_IMAGE_URL', 'https://raw.githubusercontent.com/GTXMEGADUDE/SYSTEM-INTEG/main/public/anibayan/assets'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
