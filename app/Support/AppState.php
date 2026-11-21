<?php

namespace App\Support;

use App\Models\Activity;
use App\Models\Crop;
use App\Models\Feedback;
use App\Models\HealthRun;
use App\Models\Member;
use App\Models\Order;
use App\Models\Organization;
use App\Models\Report;
use App\Models\User;
use App\Models\Warning;
use Illuminate\Support\Facades\DB;

// Everything one person's AniBayan pages need, shaped the way the pages use it, and only what that person may see:
//   guests       – the shop, public organization profiles and reviews, public buyer profiles
//   buyers       – the same plus their own account, orders, reports, cart and saved harvests
//   organizations – the same plus their organization's orders, reports, warnings and member farmers
//   administrators – everything, including the activity log and site-health checks
// Buyers' privacy settings are applied here, so a private profile's details never leave the server.
class AppState
{
    public static function for(?User $viewer): array
    {
        $admin = $viewer?->isAdmin() ?? false;
        $ownOrg = $viewer?->isRepresentative() ? $viewer->organization_id : null;

        $orgs = Organization::orderBy('id')->get()->filter(fn ($o) => $admin || $o->id === $ownOrg || in_array($o->status, ['Active', 'Terminated'], true));
        $names = Organization::pluck('name', 'id');
        $people = User::orderBy('id')->get();
        $personName = $people->pluck('name', 'id');
        $visibleOrgIds = $orgs->pluck('id')->all();

        $orders = match (true) {
            $admin => Order::with('items')->get(),
            $ownOrg !== null => Order::with('items')->where('organization_id', $ownOrg)->get(),
            $viewer?->isBuyer() => Order::with('items')->where('user_id', $viewer->id)->get(),
            default => collect(),
        };
        $reports = match (true) {
            $admin => Report::all(),
            $ownOrg !== null => Report::where('organization_id', $ownOrg)->get(),
            $viewer !== null => Report::where('user_id', $viewer->id)->get(),
            default => collect(),
        };

        return [
            'me' => $viewer?->email,
            'preferences' => $viewer?->preferences ?? (object) [],
            'organizations' => $orgs->map(fn ($o) => self::organization($o, $admin || $o->id === $ownOrg))->values(),
            'accounts' => $people->filter(fn ($u) => $admin || $u->id === $viewer?->id || ($u->role !== 'Administrator' && $u->status === 'Active'))
                ->map(fn ($u) => self::account($u, $viewer))->values(),
            'crops' => Crop::whereIn('organization_id', $visibleOrgIds)->orderBy('created_at', 'desc')->orderBy('id')->get()->map(fn ($c) => [
                'id' => $c->id, 'name' => $c->name, 'organization' => $names[$c->organization_id] ?? '', 'image' => $c->image, 'price' => $c->price,
                'unit' => $c->unit, 'category' => $c->category, 'stock' => $c->stock, 'status' => $c->status,
                'harvested' => $c->harvested_on->toDateString(), 'shelfLife' => $c->shelf_life,
            ])->values(),
            'orders' => $orders->sortByDesc(fn ($o) => [$o->placed_on->toDateString(), (int) substr($o->id, 8)])->map(fn ($o) => array_filter([
                'id' => $o->id, 'customer' => $personName[$o->user_id] ?? '', 'organization' => $names[$o->organization_id] ?? '', 'crop' => $o->crop,
                'image' => $o->image, 'quantity' => $o->quantity, 'total' => $o->total, 'date' => $o->placed_on->toDateString(),
                'status' => $o->status, 'payment' => $o->payment,
                'items' => $o->items->isEmpty() ? null : $o->items->map(fn ($i) => ['crop' => $i->crop_id, 'name' => $i->name, 'quantity' => $i->quantity, 'unit' => $i->unit, 'price' => $i->price])->values(),
                'address' => $o->address, 'phone' => $o->phone, 'method' => $o->method, 'note' => $o->note,
                'checkout' => $viewer && $o->user_id === $viewer->id ? $o->checkout_session : null, 'paymentRef' => $o->payment_ref,
            ], fn ($v) => $v !== null))->values(),
            // Reviews are public: they show on each organization's profile.
            'feedback' => Feedback::whereIn('organization_id', $visibleOrgIds)->orderByDesc('given_on')->get()->map(fn ($f) => array_filter([
                'id' => $f->id, 'organization' => $names[$f->organization_id] ?? '', 'customer' => $personName[$f->user_id] ?? '', 'rating' => $f->rating,
                'comment' => $f->comment, 'date' => $f->given_on->toDateString(), 'order' => $f->order_id,
            ], fn ($v) => $v !== null))->values(),
            'reports' => $reports->map(fn ($r) => array_filter([
                'id' => $r->id, 'organization' => $names[$r->organization_id] ?? '', 'customer' => $personName[$r->user_id] ?? '', 'reason' => $r->reason,
                'details' => $r->details, 'date' => $r->filed_on->toDateString(), 'status' => $r->status, 'order' => $r->order_id,
                'decided' => $r->decided_on?->toDateString(),
            ], fn ($v) => $v !== null))->values(),
            'warnings' => ($admin ? Warning::all() : ($ownOrg ? Warning::where('organization_id', $ownOrg)->get() : collect()))->map(fn ($w) => [
                'id' => $w->id, 'organization' => $names[$w->organization_id] ?? '', 'reason' => $w->reason, 'details' => $w->details,
                'date' => $w->given_on->toDateString(), 'by' => $w->given_by,
            ])->values(),
            'members' => ($admin ? Member::all() : ($ownOrg ? Member::where('organization_id', $ownOrg)->get() : collect()))->sortBy('id')->map(fn ($m) => [
                'id' => $m->id, 'organization' => $names[$m->organization_id] ?? '', 'name' => $m->name, 'place' => $m->place, 'crops' => $m->crops,
                'area' => $m->area, 'joined' => $m->joined, 'status' => $m->status,
            ])->values(),
            'activity' => $admin ? Activity::orderByDesc('happened_at')->orderByDesc('id')->limit(1000)->get()->map(fn ($a) => array_filter([
                'time' => $a->happened_at->toIso8601String(), 'actor' => $a->actor, 'type' => $a->type, 'detail' => $a->detail, 'target' => $a->target,
            ], fn ($v) => $v !== null))->values() : [],
            'saved' => $viewer?->isBuyer() ? [$viewer->email => DB::table('saved_crops')->where('user_id', $viewer->id)->pluck('crop_id')] : (object) [],
            'carts' => $viewer?->isBuyer() ? [$viewer->email => DB::table('cart_lines')->where('user_id', $viewer->id)->orderBy('crop_id')->get(['crop_id as crop', 'quantity'])] : (object) [],
            'healthLog' => $admin ? HealthRun::orderByDesc('id')->limit(30)->get()->reverse()->map(fn ($h) => array_filter([
                'time' => $h->ran_at->toIso8601String(), 'results' => $h->results, 'hardware' => $h->hardware, 'hardwareError' => $h->hardware_error,
            ], fn ($v) => $v !== null))->values() : [],
        ];
    }

    // $full: the organization itself and administrators also see its documents and contact details.
    private static function organization(Organization $o, bool $full): array
    {
        $members = Member::where('organization_id', $o->id)->count();

        return array_filter([
            'name' => $o->name, 'region' => $o->region(), 'crop' => $o->crop, 'image' => $o->image, 'listings' => 0, 'status' => $o->status,
            'representative' => $o->representative, 'applied' => $o->applied_on->toDateString(), 'members' => $members ?: $o->members_declared,
            'completedOrders' => Order::where('organization_id', $o->id)->where('status', 'Completed')->count(),
            'documents' => $full ? ($o->documents ?? []) : [], 'approved' => $o->approved_on?->toDateString(),
            'phone' => $full ? $o->phone : null, 'description' => $o->description,
            'terminated' => $o->terminated_on?->toDateString(), 'terminatedFor' => $full ? $o->terminated_for : null,
            'avatar' => $o->avatar, 'banner' => $o->banner, 'bannerX' => $o->banner_x, 'bannerY' => $o->banner_y,
        ], fn ($v) => $v !== null);
    }

    // Administrators and the person themself get the whole account; everyone else gets the public profile,
    // trimmed to what a buyer's privacy settings allow.
    private static function account(User $u, ?User $viewer): array
    {
        $look = ['avatar' => $u->avatar, 'banner' => $u->banner, 'bannerX' => $u->banner_x, 'bannerY' => $u->banner_y];
        $base = ['name' => $u->name, 'role' => $u->role, 'organization' => $u->organization_id ? Organization::find($u->organization_id)?->name : null, 'status' => $u->status];
        if ($viewer && ($viewer->isAdmin() || $viewer->id === $u->id)) {
            return array_filter($base + $look + [
                'email' => $u->email, 'joined' => $u->joined_on->toDateString(), 'lastActive' => $u->last_active_on->toDateString(),
                'note' => $u->note, 'phone' => $u->phone, 'address' => $u->address, 'privacy' => $u->privacySettings(),
            ] + self::buyerStats($u, true), fn ($v) => $v !== null);
        }
        $privacy = $u->privacySettings();
        if ($u->isBuyer() && ! $privacy['profile']) {
            return array_filter($base + $look + ['privacy' => $privacy, 'joined' => $u->joined_on->toDateString()], fn ($v) => $v !== null);
        }

        return array_filter($base + $look + ['joined' => $u->joined_on->toDateString(), 'privacy' => $u->isBuyer() ? $privacy : null, 'city' => $u->isBuyer() && $privacy['city'] ? self::city($u->address) : null]
            + ($u->isBuyer() ? self::buyerStats($u, $privacy['growers']) : []), fn ($v) => $v !== null);
    }

    // A buyer profile's numbers: completed orders, and the organizations they buy from (when shown).
    private static function buyerStats(User $u, bool $growers): array
    {
        if (! $u->isBuyer()) {
            return [];
        }
        $orders = Order::where('user_id', $u->id)->where('status', '!=', 'Cancelled')->get(['organization_id', 'status']);

        return ['completedOrders' => $orders->where('status', 'Completed')->count(),
            'growers' => $growers ? Organization::whereIn('id', $orders->pluck('organization_id')->unique())->whereIn('status', ['Active', 'Terminated'])->pluck('name')->values() : null];
    }

    // "12 J.P. Rizal Street, Barangay Lalud, Calapan City, Oriental Mindoro" → "Calapan City, Oriental Mindoro".
    private static function city(?string $address): ?string
    {
        $parts = array_values(array_filter(array_map('trim', explode(',', (string) $address))));

        return count($parts) >= 3 ? implode(', ', array_slice($parts, -2)) : null;
    }
}
