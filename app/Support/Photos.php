<?php

namespace App\Support;

use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

// Photos people upload (listing photos, profile pictures, banners). The page shrinks them to a JPEG first and sends
// it as a data URL; the server checks it really is an image and saves it under public/anibayan/uploads/<folder>/.
// Saved paths look like "uploads/banners/abc.jpg", relative to the AniBayan pages.
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
        if (! $info || ! isset($types[$info['mime']])) {
            $fail('This picture couldn’t be read. Try another one.');
        }
        $directory = public_path('anibayan/uploads/'.$folder);
        if (! is_dir($directory)) {
            mkdir($directory, 0775, true);
        }
        $name = Str::random(24).'.'.$types[$info['mime']];
        file_put_contents($directory.DIRECTORY_SEPARATOR.$name, $bytes);

        return 'uploads/'.$folder.'/'.$name;
    }

    // Removes an uploaded file; stock photos and other paths are left alone.
    public static function delete(?string $path): void
    {
        if ($path && preg_match('#^uploads/[a-z]+/[A-Za-z0-9]+\.(jpg|png|webp)$#', $path)) {
            $file = public_path('anibayan/'.$path);
            if (is_file($file)) {
                unlink($file);
            }
        }
    }
}
