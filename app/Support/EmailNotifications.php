<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Throwable;

// Transactional messages are sent only after their database change commits. A mail outage never undoes an order
// or account change; the administrator can see whether a delivery provider is configured in Site health.
class EmailNotifications
{
    public static function isConfigured(): bool
    {
        $from = (string) config('mail.from.address', '');
        if (! filter_var($from, FILTER_VALIDATE_EMAIL) || str_ends_with(strtolower($from), '@example.com')) {
            return false;
        }

        return match ((string) config('mail.default')) {
            // This Render service uses the free plan, which blocks outbound SMTP ports.
            'smtp' => config('app.env') !== 'production' && self::smtpConfigured(),
            'postmark' => (string) config('services.postmark.key', '') !== '',
            'resend' => (string) config('services.resend.key', '') !== '',
            'ses', 'ses-v2' => (string) config('services.ses.key', '') !== ''
                && (string) config('services.ses.secret', '') !== ''
                && (string) config('services.ses.region', '') !== '',
            default => false,
        };
    }

    public static function setupMessage(): string
    {
        return 'Set RESEND_API_KEY and a Resend-verified MAIL_FROM_ADDRESS in the Render environment.';
    }

    public static function isPlaceholderAddress(string $address): bool
    {
        $domain = strtolower(substr(strrchr($address, '@') ?: '', 1));

        return in_array($domain, ['example.com', 'example.net', 'example.org', 'test', 'invalid', 'localhost'], true);
    }

    public static function sendPasswordResetLink(string $to, string $url): void
    {
        if (! self::isConfigured() || ! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Password reset email is not configured.');
        }

        self::deliver($to, 'Reset your AniBayan password', 'Reset your password',
            'We received a request to reset the password for your AniBayan account. This link expires in 60 minutes. If you did not request it, you can ignore this message.',
            ['Email' => $to], $url, 'Reset password');
    }

    /** @param array<string, string|int|float> $facts */
    public static function send(
        string $to,
        string $subject,
        string $heading,
        string $message,
        array $facts = [],
        ?string $url = null,
        string $actionLabel = 'Open AniBayan',
    ): void {
        if (! self::isConfigured() || ! filter_var($to, FILTER_VALIDATE_EMAIL)
            || self::isPlaceholderAddress($to)) {
            return;
        }

        $deliver = static function () use ($to, $subject, $heading, $message, $facts, $url, $actionLabel): void {
            try {
                self::deliver($to, $subject, $heading, $message, $facts, $url, $actionLabel);
            } catch (Throwable $exception) {
                // Don't log the recipient, message, or mail credentials. Email is best-effort and must not break checkout.
                Log::warning('AniBayan transactional email failed.', [
                    'mailer' => (string) config('mail.default'),
                    'error_type' => $exception::class,
                ]);
            }
        };

        $connection = DB::connection();
        if ($connection->transactionLevel() > 0) {
            $connection->afterCommit($deliver);
        } else {
            $deliver();
        }
    }

    /** @param array<string, string|int|float> $facts */
    private static function deliver(
        string $to,
        string $subject,
        string $heading,
        string $message,
        array $facts,
        ?string $url,
        string $actionLabel,
    ): void {
        $viewData = compact('heading', 'message', 'facts', 'url', 'actionLabel');

        if ((string) config('mail.default') === 'resend') {
            Http::withToken((string) config('services.resend.key'))
                ->acceptJson()
                ->asJson()
                ->timeout((int) config('mail.mailers.resend.timeout', 10))
                ->post('https://api.resend.com/emails', [
                    'from' => sprintf('%s <%s>', config('mail.from.name'), config('mail.from.address')),
                    'to' => [$to],
                    'subject' => $subject,
                    'html' => view('emails.transactional', $viewData)->render(),
                ])
                ->throw();

            return;
        }

        Mail::send('emails.transactional', $viewData, static function ($mail) use ($to, $subject): void {
            $mail->to($to)->subject($subject);
        });
    }

    private static function smtpConfigured(): bool
    {
        $smtp = config('mail.mailers.smtp', []);

        return is_array($smtp)
            && trim((string) ($smtp['host'] ?? '')) !== ''
            && ! in_array(strtolower((string) $smtp['host']), ['127.0.0.1', 'localhost'], true)
            && (int) ($smtp['port'] ?? 0) > 0
            && trim((string) ($smtp['username'] ?? '')) !== ''
            && trim((string) ($smtp['password'] ?? '')) !== '';
    }
}
