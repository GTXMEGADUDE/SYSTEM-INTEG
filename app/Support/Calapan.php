<?php

namespace App\Support;

// Calapan City's 62 barangay outlines (public/anibayan/assets/calapan-barangays.json, from Philippines JSON Maps),
// for checking that a delivery pin is inside the city and which barangay it falls in.
class Calapan
{
    private static ?array $barangays = null;

    private static function barangays(): array
    {
        return self::$barangays ??= json_decode((string) file_get_contents(public_path('anibayan/assets/calapan-barangays.json')), true)['barangays'] ?? [];
    }

    public static function barangayAt(float $lat, float $lng): ?string
    {
        foreach (self::barangays() as $b) {
            foreach ($b['polygons'] as $polygon) {
                if (self::inPolygon($lng, $lat, $polygon)) {
                    return $b['name'];
                }
            }
        }

        return null;
    }

    // [lat, lng] near the middle of a barangay and inside it, for the starting data's pins.
    public static function centre(string $name): ?array
    {
        foreach (self::barangays() as $b) {
            if ($b['name'] !== $name) {
                continue;
            }
            $ring = $b['polygons'][0][0];
            $xs = array_column($ring, 0);
            $ys = array_column($ring, 1);
            $cx = array_sum($xs) / count($xs);
            $cy = array_sum($ys) / count($ys);
            $best = null;
            for ($i = 0; $i <= 24; $i++) {
                for ($j = 0; $j <= 24; $j++) {
                    $x = min($xs) + (max($xs) - min($xs)) * $i / 24;
                    $y = min($ys) + (max($ys) - min($ys)) * $j / 24;
                    $d = ($x - $cx) ** 2 + ($y - $cy) ** 2;
                    if (self::inPolygon($x, $y, $b['polygons'][0]) && ($best === null || $d < $best[2])) {
                        $best = [$y, $x, $d];
                    }
                }
            }

            return $best ? [round($best[0], 6), round($best[1], 6)] : null;
        }

        return null;
    }

    // Ray casting over the outer ring, minus any holes.
    private static function inPolygon(float $x, float $y, array $rings): bool
    {
        $inside = false;
        foreach ($rings as $i => $ring) {
            $hit = false;
            for ($a = 0, $b = count($ring) - 1; $a < count($ring); $b = $a++) {
                [$xa, $ya] = $ring[$a];
                [$xb, $yb] = $ring[$b];
                if (($ya > $y) !== ($yb > $y) && $x < ($xb - $xa) * ($y - $ya) / ($yb - $ya) + $xa) {
                    $hit = ! $hit;
                }
            }
            if ($i === 0) {
                $inside = $hit;
            } elseif ($hit) {
                return false;
            }
        }

        return $inside;
    }
}
