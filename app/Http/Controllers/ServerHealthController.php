<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

// CPU, memory and storage of the machine running AniBayan, for the administrator's Site health page.
// Sizes are in bytes. A reading the machine doesn't give is null.
class ServerHealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $reading = PHP_OS_FAMILY === 'Windows' ? $this->windows() : $this->linux();
        $total = @disk_total_space(base_path());
        $free = @disk_free_space(base_path());
        $storageTotal = $total ? (int) $total : null;

        return response()->json([
            'cpu' => $reading['cpu'],
            'cores' => $reading['cores'],
            'memoryTotal' => $reading['memoryTotal'],
            'memoryUsed' => $reading['memoryTotal'] !== null && $reading['memoryFree'] !== null ? $reading['memoryTotal'] - $reading['memoryFree'] : null,
            'storageTotal' => $storageTotal,
            'storageUsed' => $storageTotal !== null && $free !== false ? $storageTotal - (int) $free : null,
        ])->header('Cache-Control', 'no-store');
    }

    /** @return array{cpu: ?int, cores: ?int, memoryTotal: ?int, memoryFree: ?int} */
    private function windows(): array
    {
        $none = ['cpu' => null, 'cores' => null, 'memoryTotal' => null, 'memoryFree' => null];
        if (! function_exists('shell_exec')) {
            return $none;
        }
        $script = '$p=Get-CimInstance Win32_Processor; $o=Get-CimInstance Win32_OperatingSystem; '
            .'[pscustomobject]@{cpu=[math]::Round(($p|Measure-Object LoadPercentage -Average).Average); '
            .'cores=($p|Measure-Object NumberOfLogicalProcessors -Sum).Sum; '
            .'total=[int64]$o.TotalVisibleMemorySize*1024; free=[int64]$o.FreePhysicalMemory*1024} | ConvertTo-Json -Compress';
        $data = json_decode((string) shell_exec('powershell -NoProfile -NonInteractive -Command "'.$script.'"'), true);
        if (! is_array($data)) {
            return $none;
        }

        return [
            'cpu' => isset($data['cpu']) ? (int) $data['cpu'] : null,
            'cores' => isset($data['cores']) ? (int) $data['cores'] : null,
            'memoryTotal' => isset($data['total']) ? (int) $data['total'] : null,
            'memoryFree' => isset($data['free']) ? (int) $data['free'] : null,
        ];
    }

    /** @return array{cpu: ?int, cores: ?int, memoryTotal: ?int, memoryFree: ?int} */
    private function linux(): array
    {
        // CPU use: the share of non-idle time between two readings of /proc/stat, 250 ms apart.
        $before = $this->cpuTimes();
        usleep(250000);
        $after = $this->cpuTimes();
        $cpu = null;
        if ($before && $after && $after[1] > $before[1]) {
            $cpu = (int) round(100 * (1 - ($after[0] - $before[0]) / ($after[1] - $before[1])));
        }
        $cpuinfo = @file_get_contents('/proc/cpuinfo');
        $meminfo = (string) @file_get_contents('/proc/meminfo');
        $kb = fn (string $key) => preg_match('/^'.$key.':\s+(\d+)/m', $meminfo, $m) ? (int) $m[1] * 1024 : null;

        return [
            'cpu' => $cpu,
            'cores' => $cpuinfo ? preg_match_all('/^processor\s*:/m', $cpuinfo) : null,
            'memoryTotal' => $kb('MemTotal'),
            'memoryFree' => $kb('MemAvailable'),
        ];
    }

    /** @return ?array{0: int, 1: int} idle time and total time since boot */
    private function cpuTimes(): ?array
    {
        $line = @file('/proc/stat')[0] ?? '';
        if (! str_starts_with($line, 'cpu ')) {
            return null;
        }
        $times = array_map('intval', array_slice(preg_split('/\s+/', trim($line)), 1));

        return [$times[3] + ($times[4] ?? 0), array_sum($times)];
    }
}
