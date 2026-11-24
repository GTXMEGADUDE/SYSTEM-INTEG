<?php

namespace App\Support;

use App\Models\Activity;
use App\Models\Address;
use App\Models\Crop;
use App\Models\Feedback;
use App\Models\HealthRun;
use App\Models\Member;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Organization;
use App\Models\OrganizationDocument;
use App\Models\RefundMedia;
use App\Models\RefundRequest;
use App\Models\Report;
use App\Models\User;
use App\Models\Warning;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

// Everything one person's AniBayan pages need, shaped the way the pages use it, and only what that person may see:
//   guests       – the shop, public organization profiles and reviews, public buyer profiles
//   buyers       – the same plus their own account, orders, reports, cart and saved harvests
//   organizations – the same plus their organization's orders, reports, warnings and member farmers
//   administrators – everything, including the activity log and site-health checks
// Buyers' privacy settings are applied here, so a private profile's details never leave the server.
class AppState
{
    // Counts and names shared by every organization and account in one answer (filled at the start of for()).
    private static array $counts = [];

    public static function for(?User $viewer): array
    {
        // Held payments and refund requests that came due are settled first (at most once a minute; they're due by the day).
        if (Cache::add('anibayan:settled', true, 60)) {
            Escrow::settle();
        }
        $admin = $viewer?->isAdmin() ?? false;
        $ownOrg = $viewer?->isRepresentative() ? $viewer->organization_id : null;
        $buyer = $viewer?->isBuyer() ?? false;
        // Organizations this person may see: all for administrators, otherwise selling or terminated ones and their own.
        $visible = Organization::select('id')->when(! $admin, fn ($q) => $q->where(fn ($w) => $w->whereIn('status', ['Active', 'Terminated'])->orWhere('id', $ownOrg ?? 0)));
        $orders = match (true) {
            $admin => Order::query(),
            $ownOrg !== null => Order::where('organization_id', $ownOrg),
            $buyer => Order::where('user_id', $viewer->id),
            default => Order::whereRaw('1 = 0'),
        };
        $orderIds = (clone $orders)->select('id');
        $refundIds = RefundRequest::select('id')->whereIn('order_id', $orderIds);
        $data = self::batch([
            'orgs' => Organization::orderBy('id'),
            'documents' => OrganizationDocument::orderBy('id')->when(! $admin, fn ($q) => $q->where('organization_id', $ownOrg ?? 0)),
            'people' => User::orderBy('id'),
            'memberCounts' => Member::selectRaw('organization_id, COUNT(*) AS n')->groupBy('organization_id'),
            'farmers' => Member::where('status', 'Active')->orderBy('id')->select(['organization_id', 'name', 'crops', 'area', 'joined']),
            'completed' => Order::where('status', 'Completed')->selectRaw('organization_id, COUNT(*) AS n')->groupBy('organization_id'),
            'buyerOrders' => Order::where('status', '!=', 'Cancelled')->select(['user_id', 'organization_id', 'status']),
            'addresses' => Address::orderByDesc('is_default')->orderBy('id'),
            'orders' => $orders,
            'items' => OrderItem::whereIn('order_id', $orderIds)->orderBy('id'),
            'refunds' => RefundRequest::whereIn('order_id', $orderIds),
            'media' => RefundMedia::whereIn('refund_request_id', $refundIds)->orderBy('id'),
            'reports' => match (true) {
                $admin => Report::query(),
                $ownOrg !== null => Report::where('organization_id', $ownOrg),
                $viewer !== null => Report::where('user_id', $viewer->id),
                default => Report::whereRaw('1 = 0'),
            },
            'crops' => Crop::whereIn('organization_id', $visible)
                ->when(! $admin && $ownOrg === null, fn ($q) => $q->where('status', '!=', 'Removed'))
                ->orderBy('created_at', 'desc')->orderBy('id'),
            'feedback' => Feedback::whereIn('organization_id', $visible)->orderByDesc('given_on'),
            'warnings' => Warning::query()->when(! $admin, fn ($q) => $q->where('organization_id', $ownOrg ?? 0)),
            'members' => Member::orderBy('id')->when(! $admin, fn ($q) => $q->where('organization_id', $ownOrg ?? 0)),
            'activity' => $admin ? Activity::orderByDesc('happened_at')->orderByDesc('id')->limit(1000) : Activity::whereRaw('1 = 0'),
            'health' => $admin ? HealthRun::orderByDesc('id')->limit(30) : HealthRun::whereRaw('1 = 0'),
            'saved' => DB::table('saved_crops')->where('user_id', $buyer ? $viewer->id : 0)->select('crop_id'),
            'cart' => DB::table('cart_lines')->where('user_id', $buyer ? $viewer->id : 0)->orderBy('crop_id')->select(['crop_id as crop', 'quantity']),
        ]);

        // Put the related records back on their parents, as eager loading would have.
        $documents = $data['documents']->groupBy('organization_id');
        $all = $data['orgs']->each(fn ($o) => $o->setRelation('documents', $documents[$o->id] ?? new EloquentCollection()));
        $orgs = $all->filter(fn ($o) => $admin || $o->id === $ownOrg || in_array($o->status, ['Active', 'Terminated'], true));
        $media = $data['media']->groupBy('refund_request_id');
        $refunds = $data['refunds']->each(fn ($r) => $r->setRelation('media', $media[$r->id] ?? new EloquentCollection()))->keyBy('order_id');
        $items = $data['items']->groupBy('order_id');
        $orders = $data['orders']->each(function ($o) use ($items, $refunds) {
            $o->setRelation('items', $items[$o->id] ?? new EloquentCollection());
            $o->setRelation('refundRequest', $refunds[$o->id] ?? null);
        });
        $reports = $data['reports'];
        $names = $all->pluck('name', 'id');
        $people = $data['people'];
        $personName = $people->pluck('name', 'id');
        // Counts for every organization and buyer, rather than a few queries per record.
        self::$counts = [
            'names' => $names,
            'public' => $all->filter(fn ($o) => in_array($o->status, ['Active', 'Terminated'], true))->pluck('name', 'id'),
            'members' => $data['memberCounts']->pluck('n', 'organization_id'),
            // Active member farmers show on each organization's public profile (name, crops, farm area, member since).
            'farmers' => $data['farmers']->groupBy('organization_id'),
            'completed' => $data['completed']->pluck('n', 'organization_id'),
            'buyerOrders' => $data['buyerOrders']->groupBy('user_id'),
            'addresses' => $data['addresses']->groupBy('user_id'),
            // Organizations whose representative is suspended can't sell for now.
            'suspendedReps' => $people->where('role', 'Representative')->where('status', 'Suspended')->pluck('organization_id')->flip()->map(fn () => true),
        ];

        return [
            'me' => $viewer?->email,
            'preferences' => $viewer?->preferences ?? (object) [],
            'organizations' => $orgs->map(fn ($o) => self::organization($o, $admin || $o->id === $ownOrg))->values(),
            'accounts' => $people->filter(fn ($u) => $admin || $u->id === $viewer?->id || ($u->role !== 'Administrator' && $u->status === 'Active'))
                ->map(fn ($u) => self::account($u, $viewer))->values(),
            'crops' => $data['crops']->map(fn ($c) => array_filter([
                'id' => $c->id, 'name' => $c->name, 'organization' => $names[$c->organization_id] ?? '', 'image' => $c->image, 'price' => $c->price,
                'unit' => $c->unit, 'category' => $c->category, 'stock' => $c->stock, 'status' => $c->status,
                'harvested' => $c->harvested_on->toDateString(), 'shelfLife' => $c->shelf_life,
                'removalReason' => ($admin || $c->organization_id === $ownOrg) ? $c->removal_reason : null,
            ], fn ($value) => $value !== null))->values(),
            'orders' => $orders->sortByDesc(fn ($o) => [$o->placed_on->toDateString(), (int) substr($o->id, 8)])->map(fn ($o) => array_filter([
                'id' => $o->id, 'customer' => $personName[$o->user_id] ?? '', 'organization' => $names[$o->organization_id] ?? '', 'crop' => $o->crop,
                'image' => $o->image, 'quantity' => $o->quantity, 'total' => $o->total, 'date' => $o->placed_on->toDateString(),
                'status' => $o->status, 'payment' => $o->payment,
                'items' => $o->items->isEmpty() ? null : $o->items->map(fn ($i) => ['crop' => $i->crop_id, 'name' => $i->name, 'quantity' => $i->quantity, 'unit' => $i->unit, 'price' => $i->price])->values(),
                'address' => $o->address, 'phone' => $o->phone, 'method' => $o->method, 'note' => $o->note,
                'checkout' => $viewer && $o->user_id === $viewer->id ? $o->checkout_session : null, 'paymentRef' => $o->payment_ref,
                'lat' => $o->lat, 'lng' => $o->lng, 'paidAt' => $o->paid_at?->toIso8601String(), 'deliveredAt' => $o->delivered_at?->toIso8601String(),
                'receivedAt' => $o->received_at?->toIso8601String(), 'releaseOn' => $o->status === 'Delivered' ? $o->releaseOn()?->toIso8601String() : null,
                'funds' => $o->funds, 'fundsSettledAt' => $o->funds_settled_at?->toIso8601String(), 'cancelReason' => $o->cancel_reason,
                'buyerSuspended' => ($people->firstWhere('id', $o->user_id)?->status === 'Suspended') ?: null,
                'refund' => $o->refundRequest ? self::refund($o->refundRequest) : null,
            ], fn ($v) => $v !== null))->values(),
            // Reviews are public: they show on each organization's profile.
            'feedback' => $data['feedback']->map(fn ($f) => array_filter([
                'id' => $f->id, 'organization' => $names[$f->organization_id] ?? '', 'customer' => $personName[$f->user_id] ?? '', 'rating' => $f->rating,
                'comment' => $f->comment, 'date' => $f->given_on->toDateString(), 'order' => $f->order_id,
            ], fn ($v) => $v !== null))->values(),
            'reports' => $reports->map(fn ($r) => array_filter([
                'id' => $r->id, 'organization' => $names[$r->organization_id] ?? '', 'customer' => $personName[$r->user_id] ?? '', 'reason' => $r->reason,
                'details' => $r->details, 'date' => $r->filed_on->toDateString(), 'status' => $r->status, 'order' => $r->order_id,
                'decided' => $r->decided_on?->toDateString(), 'decisionNote' => $r->decision_note,
            ], fn ($v) => $v !== null))->values(),
            'warnings' => $data['warnings']->map(fn ($w) => [
                'id' => $w->id, 'organization' => $names[$w->organization_id] ?? '', 'reason' => $w->reason, 'details' => $w->details,
                'date' => $w->given_on->toDateString(), 'by' => $w->given_by,
            ])->values(),
            'members' => $data['members']->map(fn ($m) => [
                'id' => $m->id, 'organization' => $names[$m->organization_id] ?? '', 'name' => $m->name, 'place' => $m->place, 'crops' => $m->crops,
                'area' => $m->area, 'joined' => $m->joined, 'status' => $m->status, 'applicationMessage' => $m->application_message,
            ])->values(),
            'activity' => $admin ? $data['activity']->map(fn ($a) => array_filter([
                'time' => $a->happened_at->toIso8601String(), 'actor' => $a->actor, 'type' => $a->type, 'detail' => $a->detail, 'target' => $a->target,
            ], fn ($v) => $v !== null))->values() : [],
            'saved' => $buyer ? [$viewer->email => $data['saved']->pluck('crop_id')] : (object) [],
            'carts' => $buyer ? [$viewer->email => $data['cart']->map(fn ($l) => ['crop' => $l->crop, 'quantity' => (int) $l->quantity])->values()] : (object) [],
            'healthLog' => $admin ? $data['health']->reverse()->map(fn ($h) => array_filter([
                'time' => $h->ran_at->toIso8601String(), 'results' => $h->results, 'hardware' => $h->hardware, 'hardwareError' => $h->hardware_error,
            ], fn ($v) => $v !== null))->values() : [],
            'barangays' => BarangayDirectory::names(),
        ];
    }

    // Runs several read queries. On Postgres (Supabase) they go to the database as one statement (each wrapped in
    // json_agg), so a page costs one round trip however many lists it needs; the database is far away (Paris), and
    // each round trip is about 0.2 s. Eloquent queries come back as models, plain ones as rows. Other databases run
    // them one by one.
    private static function batch(array $queries): array
    {
        if (DB::getDriverName() !== 'pgsql') {
            return array_map(fn ($q) => $q->get(), $queries);
        }
        $parts = [];
        $bindings = [];
        foreach ($queries as $name => $query) {
            $parts[] = '(select coalesce(json_agg(t), \'[]\'::json) from ('.$query->toSql().') t) as "'.$name.'"';
            array_push($bindings, ...$query->getBindings());
        }
        $row = DB::selectOne('select '.implode(', ', $parts), $bindings);
        $out = [];
        foreach ($queries as $name => $query) {
            $rows = json_decode($row->{$name}, true) ?? [];
            if ($query instanceof EloquentBuilder) {
                // JSON columns arrive as nested JSON; the models expect them as text, like the database driver gives them.
                $json = array_keys(array_filter($query->getModel()->getCasts(), fn ($cast) => in_array($cast, ['array', 'json', 'object', 'collection'], true)));
                foreach ($rows as &$r) {
                    foreach ($json as $column) {
                        if (isset($r[$column]) && ! is_string($r[$column])) {
                            $r[$column] = json_encode($r[$column]);
                        }
                    }
                }
                unset($r);
                $out[$name] = $query->hydrate($rows);
            } else {
                $out[$name] = collect($rows)->map(fn ($r) => (object) $r);
            }
        }

        return $out;
    }

    // $full: the organization itself and administrators also see its documents and contact details.
    private static function organization(Organization $o, bool $full): array
    {
        $members = (int) (self::$counts['members'][$o->id] ?? 0);

        return array_filter([
            'name' => $o->name, 'region' => $o->region(), 'crop' => $o->crop, 'image' => $o->image, 'listings' => 0, 'status' => $o->status,
            'representative' => $o->representative, 'applied' => $o->applied_on->toDateString(), 'members' => $members,
            'completedOrders' => (int) (self::$counts['completed'][$o->id] ?? 0),
            'stopped' => $o->status === 'Active' && (self::$counts['suspendedReps'][$o->id] ?? false) ?: null,
            'farmers' => (self::$counts['farmers'][$o->id] ?? collect())->map(fn ($m) => ['name' => $m->name, 'crops' => $m->crops, 'area' => (float) $m->area, 'joined' => $m->joined])->values(),
            'documents' => $full ? $o->documents->map(fn ($d) => Documents::forPage($d))->values() : [], 'approved' => $o->approved_on?->toDateString(),
            'phone' => $full ? $o->phone : null, 'description' => $o->description,
            'terminated' => $o->terminated_on?->toDateString(), 'terminatedFor' => $full ? $o->terminated_for : null,
            'applicationDeclineReason' => $full ? $o->application_decline_reason : null,
            'avatar' => $o->avatar, 'banner' => $o->banner, 'bannerX' => $o->banner_x, 'bannerY' => $o->banner_y,
        ], fn ($v) => $v !== null);
    }

    // Administrators and the person themself get the whole account; everyone else gets the public profile,
    // trimmed to what a buyer's privacy settings allow.
    private static function account(User $u, ?User $viewer): array
    {
        $look = ['avatar' => $u->avatar, 'banner' => $u->banner, 'bannerX' => $u->banner_x, 'bannerY' => $u->banner_y];
        $base = ['name' => $u->name, 'role' => $u->role, 'organization' => $u->organization_id ? (self::$counts['names'][$u->organization_id] ?? null) : null, 'status' => $u->status];
        if ($viewer && ($viewer->isAdmin() || $viewer->id === $u->id)) {
            return array_filter($base + $look + [
                'email' => $u->email, 'joined' => $u->joined_on->toDateString(), 'lastActive' => $u->last_active_on->toDateString(),
                'note' => $u->note, 'suspensionReason' => $u->suspension_reason, 'phone' => $u->phone, 'privacy' => $u->privacySettings(),
                // Their saved delivery addresses for themself; administrators see the default one.
                'addresses' => $viewer->id === $u->id && $u->isBuyer() ? self::addressesOf($u)->map(fn ($a) => $a->forPage())->values() : null,
                'address' => $viewer->id !== $u->id ? self::addressesOf($u)->first()?->fullText() : null,
            ] + self::buyerStats($u, true), fn ($v) => $v !== null);
        }
        $privacy = $u->privacySettings();
        if ($u->isBuyer() && ! $privacy['profile']) {
            return array_filter($base + $look + ['privacy' => $privacy, 'joined' => $u->joined_on->toDateString()], fn ($v) => $v !== null);
        }

        return array_filter($base + $look + ['joined' => $u->joined_on->toDateString(), 'privacy' => $u->isBuyer() ? $privacy : null, 'city' => $u->isBuyer() && $privacy['city'] && self::addressesOf($u)->isNotEmpty() ? config('anibayan.city').', '.config('anibayan.province') : null]
            + ($u->isBuyer() ? self::buyerStats($u, $privacy['growers']) : []), fn ($v) => $v !== null);
    }

    // A buyer profile's numbers: completed orders, and the organizations they buy from (when shown).
    private static function buyerStats(User $u, bool $growers): array
    {
        if (! $u->isBuyer()) {
            return [];
        }
        $orders = self::$counts['buyerOrders'][$u->id] ?? collect();
        $public = self::$counts['public'];

        return ['completedOrders' => $orders->where('status', 'Completed')->count(),
            'growers' => $growers ? $orders->pluck('organization_id')->unique()->filter(fn ($id) => isset($public[$id]))->map(fn ($id) => $public[$id])->values() : null];
    }

    private static function addressesOf(User $u): \Illuminate\Support\Collection
    {
        return self::$counts['addresses'][$u->id] ?? collect();
    }

    // A refund request as the buyer, the organization and administrators see it.
    private static function refund(RefundRequest $r): array
    {
        return array_filter([
            'id' => $r->id, 'reason' => $r->reason, 'details' => $r->details, 'status' => $r->status,
            'requestedAt' => $r->requested_at->toIso8601String(), 'respondBy' => $r->respond_by->toIso8601String(),
            'disputeReason' => $r->dispute_reason, 'disputedAt' => $r->disputed_at?->toIso8601String(), 'adminNote' => $r->admin_note,
            'decidedAt' => $r->decided_at?->toIso8601String(), 'decidedBy' => $r->decided_by,
            'media' => $r->media->map(fn ($m) => RefundMediaStore::forPage($m))->values(),
        ], fn ($v) => $v !== null);
    }
}
