<?php

namespace App\Support;

use App\Models\Organization;
use App\Models\OrganizationDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

// The documents an organization attaches to its application. They hold IDs and registration papers, so they're
// saved outside the public folder (storage/app/private/organization-documents, random names) and only administrators
// can open them, through /api/documents/{id}.
class Documents
{
    // The form's upload slots: key sent by the page => what administrators see.
    public const TYPES = ['registration' => 'CDA or SEC registration', 'endorsement' => 'Barangay endorsement', 'id' => 'Representative ID'];

    public const MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

    // Kilobytes, as Laravel's "max" rule counts them (5 MB).
    public const MAX_KB = 5120;

    public const FOLDER = 'organization-documents';

    // Saves one checked upload for the organization. Returns the stored path, so a failed sign-up can remove it again.
    public static function store(Organization $org, string $type, UploadedFile $file): string
    {
        $path = self::FOLDER.'/'.Str::random(40).'.'.$file->guessExtension();
        MediaStorage::putPrivate($path, (string) file_get_contents($file->getRealPath()), $file->getMimeType() ?: 'application/octet-stream');
        try {
            $org->documents()->create([
                'type' => self::TYPES[$type], 'name' => self::cleanName($file->getClientOriginalName()), 'path' => $path,
                'mime' => $file->getMimeType(), 'size' => $file->getSize(),
            ]);
        } catch (\Throwable $e) {
            MediaStorage::deletePrivate([$path]);
            throw $e;
        }

        return $path;
    }

    // What the pages get: enough to list the files; the files themselves come from /api/documents/{id}.
    public static function forPage(OrganizationDocument $d): array
    {
        return ['id' => $d->id, 'type' => $d->type, 'name' => $d->name, 'size' => $d->size, 'mime' => $d->mime];
    }

    // The starting data's organizations get a one-page sample PDF per document, so their applications can be opened.
    public static function seedSample(Organization $org, string $type): void
    {
        $title = ['registration' => 'Certificate of registration', 'endorsement' => 'Barangay endorsement', 'id' => 'Representative identification'][$type];
        $pdf = self::samplePdf($title, [
            'Organization: '.$org->name, 'Barangay: '.$org->region().', Oriental Mindoro', 'Representative: '.$org->representative,
            'Main crops: '.$org->crop, 'Issued: '.$org->applied_on->format('F j, Y'),
        ]);
        $path = self::FOLDER.'/'.Str::random(40).'.pdf';
        MediaStorage::putPrivate($path, $pdf, 'application/pdf');
        $org->documents()->create(['type' => self::TYPES[$type], 'name' => Str::slug($title).'.pdf', 'path' => $path, 'mime' => 'application/pdf', 'size' => strlen($pdf)]);
    }

    private static function cleanName(string $name): string
    {
        $name = trim(preg_replace('/[\x00-\x1F\x7F\/\\\\]+/u', ' ', $name) ?? '');

        return Str::limit($name !== '' ? $name : 'document', 150, '');
    }

    // A letter-size page with a title, a few lines and a light "SAMPLE" mark, written as PDF by hand (Helvetica only).
    private static function samplePdf(string $title, array $lines): string
    {
        $text = fn (string $s) => '('.str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], iconv('UTF-8', 'CP1252//TRANSLIT', $s) ?: '').')';
        $body = "q 0.88 g BT /F2 110 Tf 0.766 0.643 -0.643 0.766 150 230 Tm ".$text('SAMPLE')." Tj ET Q\n"
            ."0.75 G 1 w 54 54 504 684 re S\n"
            ."BT 0.12 0.35 0.18 rg /F2 11 Tf 80 700 Td ".$text('AniBayan · organization application')." Tj ET\n"
            ."BT 0 g /F2 22 Tf 80 660 Td ".$text($title)." Tj ET\n";
        $y = 620;
        foreach ($lines as $line) {
            $body .= "BT 0 g /F1 12 Tf 80 $y Td ".$text($line)." Tj ET\n";
            $y -= 22;
        }
        $body .= "BT 0.4 g /F1 9 Tf 80 80 Td ".$text('Sample file from AniBayan’s starting data. Not a real document.')." Tj ET\n";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
            '<< /Length '.strlen($body)." >>\nstream\n".$body."endstream",
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $i => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($i + 1)." 0 obj\n".$object."\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= 'xref'."\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf.'trailer'."\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF\n";
    }
}
