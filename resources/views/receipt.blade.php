<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AniBayan receipt {{ $orders->map(fn ($o) => $o->number())->join(', ') }}</title>
<link rel="icon" href="anibayan/favicon.svg" type="image/svg+xml">
<style>
@font-face{font-family:Jakarta;src:url('anibayan/assets/jakarta-400.ttf') format('truetype');font-weight:400}
@font-face{font-family:Jakarta;src:url('anibayan/assets/jakarta-600.ttf') format('truetype');font-weight:600}
@font-face{font-family:Jakarta;src:url('anibayan/assets/jakarta-700.ttf') format('truetype');font-weight:700}
:root{--green-strong:#1c8540;--deep:#214c35;--ink:#1c2a21;--muted:#5d695f;--line:#e3e8e1;--tint:#eef6ea;--canvas:#f5f7f3}
*{box-sizing:border-box}
body{margin:0;font:14px/1.5 Jakarta,Arial,sans-serif;color:var(--ink);background:var(--canvas)}
.wrap{max-width:720px;margin:0 auto;padding:20px 16px 32px}
.tools{display:flex;justify-content:flex-end;margin-bottom:12px}
.tools button{font:600 14px Jakarta,Arial,sans-serif;color:#fff;background:var(--deep);border:0;border-radius:10px;padding:10px 16px;cursor:pointer}
.receipt{background:#fff;border:1px solid var(--line);border-radius:14px;padding:24px;margin-bottom:16px}
.top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;padding-bottom:16px;border-bottom:2px solid var(--deep)}
.brand{display:flex;align-items:center;gap:8px;font-weight:700;font-size:20px;color:var(--deep)}
.brand img{width:26px;height:26px}
.kind{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--green-strong)}
.number{font-size:22px;font-weight:700;letter-spacing:-.4px}
.right{text-align:right}
.muted{color:var(--muted);font-size:13px}
.parties{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;padding:16px 0;border-bottom:1px solid var(--line)}
.parties h2{font-size:12px;font-weight:600;color:var(--muted);margin:0 0 4px;text-transform:uppercase;letter-spacing:.06em}
.parties p{margin:0}
table{width:100%;border-collapse:collapse;margin-top:12px}
th{font-size:12px;font-weight:600;color:var(--muted);text-align:left;padding:8px 0;border-bottom:1px solid var(--line)}
td{padding:10px 0;border-bottom:1px solid var(--line);vertical-align:top}
.num{text-align:right;white-space:nowrap;padding-left:12px}
tfoot td{border-bottom:0;font-weight:700;font-size:16px;padding-top:14px}
.payment{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:16px;padding:12px 14px;border-radius:10px;background:var(--tint)}
.payment strong{display:block}
.refunded{background:#fbeaea;color:#9c3d3d}
.status{display:inline-block;font-size:12px;font-weight:600;padding:2px 9px;border-radius:999px;background:#e7f5e3;color:#2a6b2f}
.status.unpaid{background:#fff4d6;color:#7d5a00}
.status.refunded{background:#fbeaea;color:#9c3d3d}
footer{margin-top:16px;font-size:12px;color:var(--muted);text-align:center}
@media (max-width:480px){.receipt{padding:16px}.right{text-align:left}}
@media print{body{background:#fff}.wrap{padding:0;max-width:none}.tools{display:none}.receipt{border:0;border-radius:0;padding:0 0 24px;margin:0;break-after:page}.receipt:last-of-type{break-after:auto}}
</style>
</head>
<body>
<div class="wrap">
<div class="tools"><button type="button" onclick="window.print()">Print or save as PDF</button></div>
@foreach ($orders as $order)
@php
    $paid = $order->payment === 'Paid';
    $refund = $order->refundRequest && $order->refundRequest->status === 'Refunded' ? $order->refundRequest : null;
    $peso = fn ($n) => '₱'.number_format($n, 2);
@endphp
<article class="receipt">
  <div class="top">
    <div>
      <div class="brand"><img src="anibayan/favicon.svg" alt="" width="26" height="26">AniBayan</div>
      <div class="kind">Electronic receipt</div>
    </div>
    <div class="right">
      <div class="number">{{ $order->id }}</div>
      <div class="muted">Issued {{ $order->created_at?->timezone(config('app.timezone'))->format('F j, Y · g:i A') ?? $order->placed_on->format('F j, Y') }}</div>
      <span class="status {{ $refund ? 'refunded' : ($paid ? '' : 'unpaid') }}">{{ $refund ? 'Refunded' : ($paid ? 'Paid' : ($order->method === 'Cash on delivery' ? 'Pay on delivery' : 'Unpaid')) }}</span>
    </div>
  </div>
  <div class="parties">
    <div><h2>Sold by</h2><p><strong>{{ $order->organization->name }}</strong></p><p class="muted">Barangay {{ $order->organization->barangay }}, {{ $city }}</p>@if ($order->organization->phone)<p class="muted">{{ $order->organization->phone }}</p>@endif</div>
    <div><h2>Billed to</h2><p><strong>{{ $order->user->name }}</strong></p><p class="muted">{{ $order->user->email }}</p>@if ($order->phone)<p class="muted">{{ $order->phone }}</p>@endif</div>
    @if ($order->address)<div><h2>Deliver to</h2><p>{{ $order->address }}</p></div>@endif
  </div>
  <table>
    <thead><tr><th scope="col">Item</th><th scope="col" class="num">Quantity</th><th scope="col" class="num">Price</th><th scope="col" class="num">Amount</th></tr></thead>
    <tbody>
    @forelse ($order->items as $item)
      <tr><td>{{ $item->name }}</td><td class="num">{{ $item->quantity }} {{ $item->unit }}</td><td class="num">{{ $peso($item->price) }} / {{ $item->unit }}</td><td class="num">{{ $peso($item->quantity * $item->price) }}</td></tr>
    @empty
      <tr><td>{{ $order->crop }}</td><td class="num">{{ $order->quantity }}</td><td class="num"></td><td class="num">{{ $peso($order->total) }}</td></tr>
    @endforelse
    </tbody>
    <tfoot><tr><td colspan="3">Total</td><td class="num">{{ $peso($order->total) }}</td></tr></tfoot>
  </table>
  <div class="payment">
    <div><span class="muted">Payment method</span><strong>{{ $order->method ?? '—' }}</strong></div>
    @if ($paid && $order->paid_at)<div><span class="muted">Paid on</span><strong>{{ $order->paid_at->timezone(config('app.timezone'))->format('F j, Y · g:i A') }}</strong></div>@endif
    @if ($order->payment_ref)<div><span class="muted">PayMongo reference</span><strong>{{ $order->payment_ref }}</strong></div>@endif
  </div>
  @if ($refund)
  <div class="payment refunded">
    <div><span>Refunded</span><strong>{{ $peso($order->total) }}</strong></div>
    <div><span>On</span><strong>{{ ($refund->decided_at ?? $refund->updated_at)->timezone(config('app.timezone'))->format('F j, Y') }}</strong></div>
    @if ($refund->refund_ref)<div><span>PayMongo refund</span><strong>{{ $refund->refund_ref }}</strong></div>@endif
  </div>
  @endif
</article>
@endforeach
<footer>AniBayan · {{ $city }}</footer>
</div>
</body>
</html>
