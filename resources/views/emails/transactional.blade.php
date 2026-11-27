<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $heading }}</title>
</head>
<body style="margin:0;background:#f3f6f0;color:#173d2b;font-family:Arial,sans-serif;line-height:1.6">
    <main style="max-width:600px;margin:32px auto;padding:32px;background:#fff;border:1px solid #dfe7dc;border-radius:16px">
        <p style="margin:0 0 8px;color:#278343;font-size:12px;font-weight:bold;letter-spacing:1px">ANIBAYAN</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3">{{ $heading }}</h1>
        <p style="margin:0 0 20px;color:#526257">{{ $message }}</p>
        @if ($facts !== [])
            <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 24px">
                @foreach ($facts as $label => $value)
                    <tr>
                        <th scope="row" style="padding:9px 12px;border-top:1px solid #e6ebe3;text-align:left;color:#647267;font-size:13px;font-weight:normal">{{ $label }}</th>
                        <td style="padding:9px 12px;border-top:1px solid #e6ebe3;text-align:right;color:#173d2b;font-size:14px;font-weight:bold">{{ $value }}</td>
                    </tr>
                @endforeach
            </table>
        @endif
        @if ($url)
            <p style="margin:0 0 24px"><a href="{{ $url }}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#205b3b;color:#fff;text-decoration:none;font-weight:bold">{{ $actionLabel }}</a></p>
        @endif
        <p style="margin:0;color:#718076;font-size:12px">This is an automatic service email from AniBayan. Please do not reply with passwords or payment details.</p>
    </main>
</body>
</html>
