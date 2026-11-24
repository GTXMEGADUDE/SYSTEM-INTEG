<?php

namespace App\Support;

use App\Models\RefundMedia;
use App\Models\RefundRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

// Photos and videos a buyer attaches to a refund request. They're kept outside the public folder
// (storage/app/private/refund-media, random names); the buyer, the organization and administrators open them
// through /api/refund-media/{id}.
class RefundMediaStore
{
    public const MIMES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];

    public const MAX_FILES = 5;

    // Kilobytes, as Laravel's "max" rule counts them (50 MB).
    public const MAX_KB = 51200;

    public const FOLDER = 'refund-media';

    /** @param UploadedFile[] $files */
    public static function storeAll(RefundRequest $refund, array $files): void
    {
        $stored = [];
        try {
            foreach ($files as $file) {
                $path = $file->store(self::FOLDER, 'local');
                $stored[] = $path;
                RefundMedia::create(['refund_request_id' => $refund->id, 'name' => Str::limit(trim(str_replace(['/', '\\'], ' ', $file->getClientOriginalName())) ?: 'proof', 150, ''),
                    'path' => $path, 'mime' => $file->getMimeType(), 'size' => $file->getSize()]);
            }
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($stored);
            throw $e;
        }
    }

    // A file from the app's own assets, for the starting data's sample refund request.
    public static function seedFrom(RefundRequest $refund, string $asset, string $name): void
    {
        $path = self::FOLDER.'/'.Str::random(40).'.'.pathinfo($asset, PATHINFO_EXTENSION);
        Storage::disk('local')->put($path, (string) file_get_contents(public_path('anibayan/assets/'.$asset)));
        RefundMedia::create(['refund_request_id' => $refund->id, 'name' => $name, 'path' => $path,
            'mime' => mime_content_type(Storage::disk('local')->path($path)) ?: 'image/jpeg', 'size' => Storage::disk('local')->size($path)]);
    }

    public static function forPage(RefundMedia $m): array
    {
        return ['id' => $m->id, 'name' => $m->name, 'mime' => $m->mime, 'size' => (int) $m->size];
    }
}
