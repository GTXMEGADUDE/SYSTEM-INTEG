<?php

namespace App\Support;

use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

// Photos people upload (listing photos, profile pictures, banners). The page shrinks them to a JPEG first and sends
// it as a data URL; the server validates the bytes and stores them in the public media bucket in production.
class Photos
{
    private const MAX_BYTES = 4 * 1024 * 1024;

    // The stock photos a listing can use instead of an upload.
    public const STOCK = ['vegetable-cutout.png', 'carrot.jpg', 'tomatoes.jpg', 'onion.jpg', 'eggplant.jpg', 'sweet-potatoes.jpg', 'mango.jpg', 'bananas.jpg', 'rice.jpg'];

    public static function store(string $dataUrl, string $folder, string $field = 'photo'): string
    {
        $fail = fn (string $message) => throw ValidationException::withMessages([$field => $message]);
        if (! preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$#', $dataUrl, $match)) {
            $fail('Choose a JPG, PNG or WebP picture.');
        }
        $bytes = base64_decode($match[2], true);
        if ($bytes === false || strlen($bytes) > self::MAX_BYTES) {
            $fail('Choose a picture smaller than 4 MB.');
        }
        $info = @getimagesizefromstring($bytes);
        $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        if (! $info || ! isset($types[$info['mime']]) || $info[0] > 4096 || $info[1] > 4096 || $info[0] * $info[1] > 16_000_000) {
            $fail('This picture couldn’t be read. Try another one.');
        }
        $name = Str::random(24).'.'.$types[$info['mime']];
        $path = 'uploads/'.$folder.'/'.$name;
        MediaStorage::putPublic($path, $bytes, $info['mime']);

        return $path;
    }

    public static function url(?string $path): ?string
    {
        return MediaStorage::publicUrl($path);
    }

    // Removes an uploaded file; stock photos and other paths are left alone.
    public static function delete(?string $path): void
    {
        MediaStorage::deletePublic($path);
    }
}
