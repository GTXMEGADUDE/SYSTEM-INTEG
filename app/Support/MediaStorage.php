<?php

namespace App\Support;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Client\ConnectionException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

// Uploaded user files live in Supabase Storage in production, because Render's free filesystem is temporary.
// Local development keeps the same private/public split on disk. The service-role key is only ever used server-side.
class MediaStorage
{
    private const STORAGE_TIMEOUT_SECONDS = 45;
    private const MAX_DELETE_BATCH = 1000;

    /** Check the persistent storage service and the public/private bucket settings without exposing credentials. */
    public static function healthCheck(): array
    {
        if (! self::remote()) {
            if (config('app.env') === 'production') {
                return ['ok' => false, 'error' => 'Persistent Supabase Storage is not enabled.'];
            }

            return ['ok' => true, 'message' => 'Local development storage is selected.'];
        }

        try {
            $public = self::publicBucket();
            $private = self::privateBucket();
            if ($public === $private) {
                return ['ok' => false, 'error' => 'Public and private storage buckets must be different.'];
            }

            foreach ([[$public, true], [$private, false]] as [$bucket, $expectedPublic]) {
                $response = self::client()->get(self::supabaseUrl().'/storage/v1/bucket/'.self::encodePath($bucket));
                if ($response->status() === 404) {
                    return ['ok' => false, 'error' => 'Supabase Storage bucket "'.$bucket.'" was not found.'];
                }
                if (in_array($response->status(), [401, 403], true)) {
                    return ['ok' => false, 'error' => 'Supabase Storage rejected the server credentials.'];
                }
                if (! $response->successful()) {
                    return ['ok' => false, 'error' => 'Supabase Storage returned HTTP '.$response->status().'.'];
                }
                if ($response->json('public') !== $expectedPublic) {
                    $visibility = $expectedPublic ? 'public' : 'private';

                    return ['ok' => false, 'error' => 'The "'.$bucket.'" bucket must be '.$visibility.'.'];
                }
            }
        } catch (ConnectionException) {
            return ['ok' => false, 'error' => 'Supabase Storage could not be reached.'];
        } catch (ServiceUnavailableHttpException $exception) {
            return ['ok' => false, 'error' => $exception->getMessage()];
        } catch (\Throwable) {
            return ['ok' => false, 'error' => 'Supabase Storage could not be checked.'];
        }

        return ['ok' => true, 'message' => 'Public photos and private documents buckets are available.'];
    }

    public static function putPublic(string $path, string $contents, string $mime): void
    {
        $path = self::cleanPath($path);
        if (! self::remote()) {
            $file = public_path('anibayan/'.$path);
            File::ensureDirectoryExists(dirname($file));
            if (file_put_contents($file, $contents, LOCK_EX) === false) {
                throw new ServiceUnavailableHttpException(null, 'Media storage is unavailable.');
            }

            return;
        }

        self::upload(self::publicBucket(), $path, $contents, $mime, 'public, max-age=3600');
    }

    public static function putPrivate(string $path, string $contents, string $mime): void
    {
        $path = self::cleanPath($path);
        if (! self::remote()) {
            if (! Storage::disk('local')->put($path, $contents)) {
                throw new ServiceUnavailableHttpException(null, 'Private file storage is unavailable.');
            }

            return;
        }

        self::upload(self::privateBucket(), $path, $contents, $mime, 'private, no-store');
    }

    public static function publicUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return $path;
        }
        if (! self::remote() || ! str_starts_with($path, 'uploads/') || preg_match('#^(?:https?:|data:|blob:)#i', $path)) {
            return $path;
        }

        $path = self::cleanPath($path);

        return rtrim(self::supabaseUrl(), '/').'/storage/v1/object/public/'.self::encodePath(self::publicBucket()).'/'.self::encodePath($path);
    }

    public static function deletePublic(?string $path): void
    {
        if (! $path || ! preg_match('#^uploads/[a-z]+/[A-Za-z0-9]+\.(jpg|png|webp)$#', $path)) {
            return;
        }

        if (! self::remote()) {
            $file = public_path('anibayan/'.$path);
            if (is_file($file)) {
                @unlink($file);
            }

            return;
        }

        self::deleteObjects(self::publicBucket(), [$path]);
    }

    /** @param string[] $paths */
    public static function deletePrivate(array $paths): void
    {
        $paths = array_values(array_unique(array_map(self::cleanPath(...), $paths)));
        if ($paths === []) {
            return;
        }

        if (! self::remote()) {
            Storage::disk('local')->delete($paths);

            return;
        }

        self::deleteObjects(self::privateBucket(), $paths);
    }

    public static function deletePublicPrefix(string $prefix): void
    {
        $prefix = self::cleanPath($prefix);
        if (! self::remote()) {
            File::deleteDirectory(public_path('anibayan/'.$prefix));

            return;
        }

        self::deletePrefix(self::publicBucket(), $prefix);
    }

    public static function deletePrivatePrefix(string $prefix): void
    {
        $prefix = self::cleanPath($prefix);
        if (! self::remote()) {
            Storage::disk('local')->deleteDirectory($prefix);

            return;
        }

        self::deletePrefix(self::privateBucket(), $prefix);
    }

    public static function privateResponse(string $path, string $mime, string $disposition = 'inline'): Response
    {
        $contents = self::readPrivate(self::cleanPath($path));
        if ($contents === null) {
            throw new NotFoundHttpException('That file isn’t available.');
        }

        return response($contents, 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => $disposition,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    private static function remote(): bool
    {
        return config('anibayan.media.driver') === 'supabase';
    }

    private static function upload(string $bucket, string $path, string $contents, string $mime, string $cacheControl): void
    {
        $response = self::client()->withHeaders([
            'Content-Type' => $mime,
            'Cache-Control' => $cacheControl,
            'x-upsert' => 'false',
        ])->withBody($contents, $mime)->send('POST', self::objectUrl($bucket, $path));

        if ($response->successful()) {
            return;
        }

        Log::error('Supabase Storage upload failed.', ['status' => $response->status(), 'bucket' => $bucket]);
        throw new ServiceUnavailableHttpException(null, 'File storage is temporarily unavailable. Please try again.');
    }

    private static function readPrivate(string $path): ?string
    {
        if (! self::remote()) {
            return Storage::disk('local')->exists($path) ? Storage::disk('local')->get($path) : null;
        }

        $response = self::client()->get(self::objectUrl(self::privateBucket(), $path, 'authenticated'));
        if ($response->status() === 404) {
            return null;
        }
        if (! $response->successful()) {
            Log::error('Supabase Storage download failed.', ['status' => $response->status(), 'bucket' => self::privateBucket()]);
            throw new ServiceUnavailableHttpException(null, 'File storage is temporarily unavailable.');
        }

        return $response->body();
    }

    /** @param string[] $paths */
    private static function deleteObjects(string $bucket, array $paths): void
    {
        foreach (array_chunk($paths, self::MAX_DELETE_BATCH) as $batch) {
            $response = self::client()->withBody(json_encode(['prefixes' => $batch], JSON_THROW_ON_ERROR), 'application/json')
                ->send('DELETE', self::objectUrl($bucket));
            if (! $response->successful()) {
                Log::error('Supabase Storage delete failed.', ['status' => $response->status(), 'bucket' => $bucket]);
                throw new ServiceUnavailableHttpException(null, 'File storage is temporarily unavailable.');
            }
        }
    }

    private static function deletePrefix(string $bucket, string $prefix): void
    {
        self::deleteObjects($bucket, self::listObjects($bucket, $prefix));
    }

    /** @return string[] */
    private static function listObjects(string $bucket, string $prefix): array
    {
        $folders = [$prefix];
        $paths = [];
        while ($folder = array_pop($folders)) {
            $offset = 0;
            do {
                $response = self::client()->post(self::supabaseUrl().'/storage/v1/object/list/'.self::encodePath($bucket), [
                    'prefix' => $folder,
                    'limit' => self::MAX_DELETE_BATCH,
                    'offset' => $offset,
                ]);
                if (! $response->successful()) {
                    Log::error('Supabase Storage listing failed.', ['status' => $response->status(), 'bucket' => $bucket]);
                    throw new ServiceUnavailableHttpException(null, 'File storage is temporarily unavailable.');
                }

                $items = $response->json();
                if (! is_array($items)) {
                    throw new ServiceUnavailableHttpException(null, 'File storage returned an invalid response.');
                }
                foreach ($items as $item) {
                    $name = is_array($item) ? trim((string) ($item['name'] ?? '')) : '';
                    if ($name === '' || $name === '.' || $name === '..') {
                        continue;
                    }
                    $path = $folder.'/'.$name;
                    if (($item['id'] ?? null) === null) {
                        $folders[] = $path;
                    } else {
                        $paths[] = $path;
                    }
                }

                $count = count($items);
                $offset += $count;
            } while ($count === self::MAX_DELETE_BATCH);
        }

        return $paths;
    }

    private static function client(): PendingRequest
    {
        $key = (string) config('anibayan.media.service_role_key', '');
        if ($key === '' || self::supabaseUrl() === '') {
            Log::critical('Supabase Storage is selected but its server credentials are missing.');
            throw new ServiceUnavailableHttpException(null, 'File storage is not configured.');
        }

        return Http::acceptJson()->withHeaders([
            'apikey' => $key,
            'Authorization' => 'Bearer '.$key,
        ])->timeout(self::STORAGE_TIMEOUT_SECONDS);
    }

    private static function supabaseUrl(): string
    {
        return rtrim((string) config('anibayan.media.url', ''), '/');
    }

    private static function publicBucket(): string
    {
        return self::cleanBucket((string) config('anibayan.media.public_bucket', 'anibayan-public'));
    }

    private static function privateBucket(): string
    {
        return self::cleanBucket((string) config('anibayan.media.private_bucket', 'anibayan-private'));
    }

    private static function objectUrl(string $bucket, ?string $path = null, string $mode = ''): string
    {
        $route = '/storage/v1/object'.($mode !== '' ? '/'.$mode : '').'/'.self::encodePath($bucket);

        return self::supabaseUrl().$route.($path !== null ? '/'.self::encodePath($path) : '');
    }

    private static function cleanBucket(string $bucket): string
    {
        if (! preg_match('/^[A-Za-z0-9_-]{1,100}$/', $bucket)) {
            throw new ServiceUnavailableHttpException(null, 'File storage is not configured.');
        }

        return $bucket;
    }

    private static function cleanPath(string $path): string
    {
        $path = trim(str_replace('\\', '/', $path), '/');
        $parts = explode('/', $path);
        if ($path === '' || in_array('', $parts, true) || in_array('.', $parts, true) || in_array('..', $parts, true)) {
            throw new ServiceUnavailableHttpException(null, 'The requested file path is invalid.');
        }

        return $path;
    }

    private static function encodePath(string $path): string
    {
        return implode('/', array_map(rawurlencode(...), explode('/', $path)));
    }
}
