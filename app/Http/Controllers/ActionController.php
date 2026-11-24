<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Address;
use App\Models\Crop;
use App\Models\Feedback;
use App\Models\HealthRun;
use App\Models\Member;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Organization;
use App\Models\RefundRequest;
use App\Models\Report;
use App\Models\User;
use App\Models\Warning;
use App\Support\AppState;
use App\Support\BarangayDirectory;
use App\Support\Calapan;
use App\Support\Documents;
use App\Support\Escrow;
use App\Support\Photos;
use App\Support\RefundMediaStore;
use App\Support\Suspensions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

// Every change the AniBayan pages make goes through here: POST /api/actions/{action}. Each action checks who is
// signed in and what they may change, writes the database, records the activity log, and answers with the
// person's fresh data (see AppState), so the page redraws from what the server now holds.
class ActionController extends Controller
{
    private const ACTIONS = [
        // Buyers
        'cart.add' => 'cartAdd', 'cart.step' => 'cartStep', 'cart.remove' => 'cartRemove', 'cart.clear' => 'cartClear',
        'save.toggle' => 'saveToggle', 'checkout' => 'checkout', 'order.cancel' => 'orderCancel', 'feedback.create' => 'feedbackCreate',
        'report.create' => 'reportCreate', 'profile.contact' => 'profileContact', 'privacy' => 'privacy',
        'address.save' => 'addressSave', 'address.remove' => 'addressRemove', 'address.default' => 'addressDefault',
        'order.received' => 'orderReceived', 'refund.request' => 'refundRequest',
        // Organizations
        'order.advance' => 'orderAdvance', 'order.decline' => 'orderDecline', 'listing.save' => 'listingSave', 'listing.toggle' => 'listingToggle',
        'listing.remove' => 'listingRemove', 'member.add' => 'memberAdd', 'member.confirm' => 'memberConfirm', 'member.remove' => 'memberRemove',
        'org.profile' => 'orgProfile', 'refund.accept' => 'refundAccept', 'refund.dispute' => 'refundDispute',
        // Administrators
        'account.suspend' => 'accountSuspend', 'account.reset-password' => 'accountResetPassword', 'application.review' => 'applicationReview',
        'report.decide' => 'reportDecide', 'warning.create' => 'warningCreate', 'warning.withdraw' => 'warningWithdraw',
        'admin.listing.remove' => 'adminListingRemove', 'barangay.add' => 'barangayAdd', 'barangay.update' => 'barangayUpdate', 'barangay.remove' => 'barangayRemove',
        'organization.terminate' => 'organizationTerminate', 'refund.decide' => 'refundDecide', 'health.record' => 'healthRecord', 'data.reset' => 'dataReset',
        // Everyone signed in
        'password.change' => 'passwordChange', 'preferences' => 'preferences',
        'look.upload' => 'lookUpload', 'look.remove' => 'lookRemove', 'look.position' => 'lookPosition',
    ];

    private const REPORT_REASONS = ['Short or wrong quantity', 'Poor quality or spoiled', 'Harvest date not as listed', 'Late or no fulfillment', 'Payment or refund problem', 'Other'];

    private const PAYMENT_METHODS = ['Cash on delivery', 'GCash', 'GCash or QR Ph', 'Credit or debit card', 'QR Ph'];

    // A Philippine mobile number: 0917 555 0148 or +63 917 555 0148 (at most 12 digits).
    public const PHONE = '/^(\+63[\s-]?|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/';

    public function __invoke(Request $request, string $action): JsonResponse
    {
        $method = self::ACTIONS[$action] ?? abort(404, 'Unknown action.');
        $user = Auth::user();
        if (! $user || $user->status !== 'Active') {
            return response()->json(['message' => 'Sign in again to continue.', 'signedOut' => true], 401);
        }
        // Each action saves everything or nothing. Resetting rebuilds the tables, so it runs on its own.
        $result = $method === 'dataReset' ? $this->dataReset($request, $user) : DB::transaction(fn () => $this->{$method}($request, $user));
        $user = Auth::user();

        return response()->json(['result' => $result ?? (object) [], 'state' => AppState::for($user && $user->status === 'Active' ? $user->fresh() : null)]);
    }

    /* ---------- Who may do what ---------- */

    private function buyer(User $user): void
    {
        self::refuseUnless($user->isBuyer(), 403, 'Sign in with a buyer account to do this.');
    }

    // The representative's organization, which must be approved and still selling.
    private function myOrg(User $user): Organization
    {
        self::refuseUnless($user->isRepresentative(), 403, 'Only an organization’s representative can do this.');
        $org = $user->organization;
        self::refuseUnless($org && $org->status === 'Active', 403, 'Your organization can’t do this right now.');

        return $org;
    }

    private function admin(User $user): void
    {
        self::refuseUnless($user->isAdmin(), 403, 'Only an administrator can do this.');
    }

    private function fail(string $message, int $status = 422): never
    {
        abort(response()->json(['message' => $message], $status));
    }

    private function money(int $pesos): string
    {
        return '₱'.number_format($pesos);
    }

    private function repEmail(Organization $org): ?string
    {
        return $org->representativeAccount()?->email;
    }

    private function buyableCrop(string $id, bool $lock = false): Crop
    {
        $query = Crop::with('organization')->whereKey($id);
        if ($lock) {
            $query->lockForUpdate();
        }
        $crop = $query->first();
        if (! $crop || ! $crop->isBuyable()) {
            $this->fail('This harvest isn’t available right now.');
        }

        return $crop;
    }

    /* ---------- Buyers ---------- */

    private function cartAdd(Request $request, User $user): array
    {
        $this->buyer($user);
        $data = $request->validate(['crop' => 'required|string', 'quantity' => 'required|integer|min:1|max:100000']);
        $crop = $this->buyableCrop($data['crop'], true);
        if (! $crop || ! $crop->isBuyable()) {
            $this->fail('This harvest isn’t available right now.');
        }
        $inCart = (int) DB::table('cart_lines')->where(['user_id' => $user->id, 'crop_id' => $crop->id])->value('quantity');
        $room = $crop->stock - $inCart;
        if ($room <= 0) {
            $this->fail('Your cart already has all '.$crop->stock.' '.$crop->unit.' of '.$crop->name.'.');
        }
        if ($data['quantity'] > $room) {
            $this->fail('Only '.$room.' '.$crop->unit.' of '.$crop->name.' can be added. Update the quantity and try again.');
        }
        $amount = $data['quantity'];
        DB::table('cart_lines')->updateOrInsert(['user_id' => $user->id, 'crop_id' => $crop->id], ['quantity' => $inCart + $amount]);

        return ['added' => $amount];
    }

    private function cartStep(Request $request, User $user): void
    {
        $this->buyer($user);
        $data = $request->validate(['crop' => 'required|string', 'step' => 'required|integer|in:-1,1']);
        $line = DB::table('cart_lines')->where(['user_id' => $user->id, 'crop_id' => $data['crop']]);
        $quantity = (int) $line->value('quantity');
        $crop = Crop::find($data['crop']);
        if ($quantity && $crop) {
            $line->update(['quantity' => max(1, min($crop->stock, $quantity + $data['step']))]);
        }
    }

    private function cartRemove(Request $request, User $user): void
    {
        $this->buyer($user);
        DB::table('cart_lines')->where(['user_id' => $user->id, 'crop_id' => (string) $request->input('crop')])->delete();
    }

    private function cartClear(Request $request, User $user): void
    {
        $this->buyer($user);
        DB::table('cart_lines')->where('user_id', $user->id)->delete();
    }

    private function saveToggle(Request $request, User $user): array
    {
        $this->buyer($user);
        $crop = Crop::find((string) $request->input('crop')) ?? $this->fail('This harvest isn’t listed any more.');
        $row = DB::table('saved_crops')->where(['user_id' => $user->id, 'crop_id' => $crop->id]);
        if ($row->exists()) {
            $row->delete();

            return ['saved' => false];
        }
        DB::table('saved_crops')->insert(['user_id' => $user->id, 'crop_id' => $crop->id]);

        return ['saved' => true];
    }

    // Places one order per organization in the cart. Card and GCash orders wait for payment through PayMongo.
    // The delivery address is one of the buyer's saved addresses, or a new one (typed, pinned, or both) that can be saved.
    private function checkout(Request $request, User $user): array
    {
        $this->buyer($user);
        $data = $request->validate([
            'address' => 'nullable|integer', 'phone' => ['required', 'regex:'.self::PHONE], 'method' => ['required', Rule::in(self::PAYMENT_METHODS)],
            'note' => 'nullable|string|max:200', 'save' => 'boolean', 'crops' => 'required|array|min:1|max:100', 'crops.*' => 'required|string|distinct',
        ], ['phone.regex' => 'Enter a mobile number like 0917 555 0148.']);
        if (! empty($data['address'])) {
            $saved = $user->addresses()->find($data['address']) ?? $this->fail('Choose one of your saved addresses.');
            $place = ['text' => $saved->fullText(), 'lat' => $saved->lat, 'lng' => $saved->lng];
        } else {
            $new = $this->addressInput($request);
            $place = ['text' => Address::text($new['details'] ?? '', $new['barangay'], isset($new['lat'])), 'lat' => $new['lat'] ?? null, 'lng' => $new['lng'] ?? null];
        }
        $selected = array_values(array_unique($data['crops']));
        $lines = DB::table('cart_lines')->where('user_id', $user->id)->whereIn('crop_id', $selected)->get();
        if ($lines->count() !== count($selected)) {
            $this->fail('Some selected items are no longer in your cart. Review your cart and try again.');
        }
        if ($lines->isEmpty()) {
            $this->fail('Your cart is empty.');
        }
        $crops = Crop::with('organization')->whereIn('id', $lines->pluck('crop_id'))->lockForUpdate()->get()->keyBy('id');
        $problems = $lines->filter(fn ($l) => ! isset($crops[$l->crop_id]) || ! $crops[$l->crop_id]->isBuyable() || $l->quantity > $crops[$l->crop_id]->stock)
            ->map(fn ($l) => $crops[$l->crop_id]->name ?? 'A harvest');
        if ($problems->isNotEmpty()) {
            $this->fail('Some items changed while you were checking out: '.$problems->join(', ').'. Go back to your cart to update them.');
        }
        $next = (int) Order::pluck('id')->map(fn ($id) => (int) substr($id, 8))->max() + 1;
        $placed = [];
        foreach ($lines->groupBy(fn ($l) => $crops[$l->crop_id]->organization_id) as $orgId => $group) {
            $items = $group->map(fn ($l) => ['crop' => $crops[$l->crop_id], 'quantity' => $l->quantity]);
            $first = $items->first();
            $total = $items->sum(fn ($i) => $i['quantity'] * $i['crop']->price);
            $order = Order::create([
                'id' => 'AB-2026-'.$next++, 'user_id' => $user->id, 'organization_id' => $orgId,
                'crop' => $items->count() === 1 ? $first['crop']->name : $first['crop']->name.' + '.($items->count() - 1).' more',
                'image' => $first['crop']->image,
                'quantity' => $items->count() === 1 ? $first['quantity'].' '.$first['crop']->unit : $items->count().' items',
                'total' => $total, 'placed_on' => today(), 'status' => 'Pending', 'payment' => 'Unpaid',
                'address' => $place['text'], 'lat' => $place['lat'], 'lng' => $place['lng'],
                'phone' => $data['phone'], 'method' => $data['method'], 'note' => $data['note'] ?? '',
            ]);
            foreach ($items as $item) {
                OrderItem::create(['order_id' => $order->id, 'crop_id' => $item['crop']->id, 'name' => $item['crop']->name, 'quantity' => $item['quantity'], 'unit' => $item['crop']->unit, 'price' => $item['crop']->price]);
                $item['crop']->decrement('stock', $item['quantity']);
            }
            Activity::record('order-placed', $user->email, $order->number().' · '.$this->money($total).' · '.$first['crop']->organization->name);
            $placed[] = ['id' => $order->id, 'organization' => $first['crop']->organization->name];
        }
        DB::table('cart_lines')->where('user_id', $user->id)->whereIn('crop_id', $selected)->delete();
        if (isset($new) && ! empty($data['save'])) {
            $this->storeAddress($user, $new);
        }
        if (! $user->phone) {
            $user->update(['phone' => $data['phone']]);
        }

        return ['orders' => $placed, 'method' => $data['method']];
    }

    /* ---------- Saved delivery addresses ---------- */

    // A delivery address from the form: a barangay of Calapan City plus house/street details, a map pin, or both.
    private function addressInput(Request $request): array
    {
        $data = $request->validate([
            'label' => 'nullable|string|max:40', 'details' => 'nullable|string|max:120', 'barangay' => ['required', Rule::in(BarangayDirectory::names())],
            'lat' => 'nullable|numeric|required_with:lng', 'lng' => 'nullable|numeric|required_with:lat',
        ], ['barangay.*' => 'Choose a barangay in Calapan City.', 'lat.*' => 'Pin a place in Calapan City.', 'lng.*' => 'Pin a place in Calapan City.']);
        if (isset($data['lat'], $data['lng'])) {
            if (! Calapan::barangayAt((float) $data['lat'], (float) $data['lng'])) {
                throw ValidationException::withMessages(['pin' => 'AniBayan delivers only within Calapan City. Pin a place inside the city.']);
            }
            $data['lat'] = round((float) $data['lat'], 6);
            $data['lng'] = round((float) $data['lng'], 6);
        } else {
            unset($data['lat'], $data['lng']);
            if (mb_strlen(trim($data['details'] ?? '')) < 4) {
                throw ValidationException::withMessages(['details' => 'Enter the house number and street, or pin the place on the map.']);
            }
        }
        $data['details'] = trim($data['details'] ?? '');

        return $data;
    }

    private function storeAddress(User $user, array $data, ?Address $address = null): Address
    {
        $first = ! $user->addresses()->exists();
        $values = ['label' => trim($data['label'] ?? '') ?: ($first ? 'Home' : 'Other'), 'details' => $data['details'] ?: null, 'barangay' => $data['barangay'],
            'lat' => $data['lat'] ?? null, 'lng' => $data['lng'] ?? null];
        if ($address) {
            $address->update($values);
        } else {
            $address = $user->addresses()->create($values + ['is_default' => $first]);
        }
        if (! empty($data['default']) && ! $address->is_default) {
            $this->makeDefault($user, $address);
        }

        return $address;
    }

    private function makeDefault(User $user, Address $address): void
    {
        $user->addresses()->update(['is_default' => false]);
        $address->update(['is_default' => true]);
    }

    private function ownAddress(Request $request, User $user): Address
    {
        $this->buyer($user);

        return $user->addresses()->find((int) $request->input('id')) ?? $this->fail('That address wasn’t found.', 404);
    }

    private function addressSave(Request $request, User $user): array
    {
        $this->buyer($user);
        $existing = $request->filled('id') ? $this->ownAddress($request, $user) : null;
        $data = $this->addressInput($request) + ['default' => $request->boolean('default')];
        $address = $this->storeAddress($user, $data, $existing);
        Activity::record('profile-updated', $user->email, ($existing ? 'Delivery address edited · ' : 'Delivery address added · ').$address->label);

        return ['id' => $address->id];
    }

    private function addressRemove(Request $request, User $user): void
    {
        $address = $this->ownAddress($request, $user);
        $wasDefault = $address->is_default;
        $address->delete();
        if ($wasDefault && ($next = $user->addresses()->first())) {
            $next->update(['is_default' => true]);
        }
        Activity::record('profile-updated', $user->email, 'Delivery address removed · '.$address->label);
    }

    private function addressDefault(Request $request, User $user): void
    {
        $this->makeDefault($user, $this->ownAddress($request, $user));
    }

    private function ownOrder(Request $request, User $user): Order
    {
        $order = Order::find((string) $request->input('order'));
        self::refuseUnless($order && $order->user_id === $user->id, 404, 'That order wasn’t found.');

        return $order;
    }

    // The buyer confirms the delivered order arrived: it completes and a held payment goes to the organization.
    private function orderReceived(Request $request, User $user): void
    {
        $this->buyer($user);
        $order = $this->ownOrder($request, $user);
        if ($order->status !== 'Delivered') {
            $this->fail('Only delivered orders can be marked as received.');
        }
        $order->update(['status' => 'Completed', 'received_at' => now()]);
        Escrow::release($order);
        Activity::record('order-received', $user->email, $order->number().' · '.$order->organization->name);
    }

    // Within the 7 days after delivery, the buyer of an order paid online can ask for the money back, with a reason,
    // what went wrong, and at least one photo or video. The organization then has 10 days to accept or dispute it.
    private function refundRequest(Request $request, User $user): array
    {
        $this->buyer($user);
        $order = $this->ownOrder($request, $user);
        if (! $order->canRequestRefund()) {
            $this->fail('A refund can be requested within '.Order::HOLD_DAYS.' days after delivery, for orders paid online.');
        }
        $data = $request->validate([
            'reason' => ['required', Rule::in(RefundRequest::REASONS)], 'details' => 'required|string|min:20|max:1000',
            'media' => 'required|array|min:1|max:'.RefundMediaStore::MAX_FILES,
            'media.*' => 'required|file|max:'.RefundMediaStore::MAX_KB.'|mimetypes:'.implode(',', RefundMediaStore::MIMES),
        ], ['reason.*' => 'Choose a reason.', 'details.*' => 'Describe what went wrong in at least 20 characters.',
            'media.*' => 'Attach photos or videos (JPG, PNG, WebP, MP4, WebM or MOV, up to 50 MB each).']);
        $refund = RefundRequest::create([
            'id' => RefundRequest::nextId('RF-', 3), 'order_id' => $order->id, 'user_id' => $user->id, 'organization_id' => $order->organization_id,
            'reason' => $data['reason'], 'details' => trim($data['details']), 'status' => 'Requested',
            'requested_at' => now(), 'respond_by' => now()->addDays(Order::RESPOND_DAYS),
        ]);
        RefundMediaStore::storeAll($refund, $request->file('media'));
        $order->update(['status' => 'Refund requested']);
        Activity::record('refund-requested', $user->email, $order->number().' · '.$refund->id.' · '.$refund->reason);
        // Nobody can answer for a terminated or suspended organization, so the refund is granted straight away.
        if ($order->organization->isStopped()) {
            $stopReason = $order->organization->status === 'Terminated'
                ? $order->organization->terminated_for
                : $order->organization->representativeAccount()?->suspension_reason;
            $note = $order->organization->name.' can’t respond to refund requests right now.'.($stopReason ? ' Reason: '.$stopReason.'.' : '').' AniBayan approved this refund automatically.';
            $refund->update(['admin_note' => mb_substr($note, 0, 300)]);
            Escrow::refund($refund->load('order'), 'automatic');
        }

        return ['id' => $refund->id];
    }

    private function orderCancel(Request $request, User $user): void
    {
        $this->buyer($user);
        $order = $this->ownOrder($request, $user);
        if ($order->status !== 'Pending') {
            $this->fail('Only orders still waiting for confirmation can be cancelled.');
        }
        $reason = 'Cancelled at the buyer’s request.';
        $order->cancel_reason = $reason;
        $order->moveTo('Cancelled');
        if ($order->payment === 'Paid' && $order->funds === 'Held') {
            Escrow::refundOrder($order, $reason);
        }
        Activity::record('order-cancelled', $user->email, $order->number().' · '.$reason);
    }

    private function feedbackCreate(Request $request, User $user): array
    {
        $this->buyer($user);
        $data = $request->validate(['rating' => 'required|integer|min:1|max:5', 'comment' => 'nullable|string|max:300'], ['rating.*' => 'Choose a rating from 1 to 5 stars.']);
        $order = $this->ownOrder($request, $user);
        if ($order->status !== 'Completed' || Feedback::where('order_id', $order->id)->exists()) {
            $this->fail('This order can’t be rated.');
        }
        $org = Organization::find($order->organization_id);
        Feedback::create(['id' => Feedback::nextId('FB-'), 'organization_id' => $org->id, 'user_id' => $user->id, 'order_id' => $order->id, 'rating' => $data['rating'], 'comment' => trim($data['comment'] ?? ''), 'given_on' => today()]);
        Activity::record('rating', $user->email, $data['rating'].'★ · '.$org->name);

        return ['organization' => $org->name];
    }

    private function reportCreate(Request $request, User $user): void
    {
        $this->buyer($user);
        $data = $request->validate(['reason' => ['required', Rule::in(self::REPORT_REASONS)], 'details' => 'required|string|min:20|max:500'],
            ['reason.*' => 'Choose a reason.', 'details.*' => 'Describe the problem in at least 20 characters.']);
        $order = $this->ownOrder($request, $user);
        if (Report::where('order_id', $order->id)->where('user_id', $user->id)->exists()) {
            $this->fail('You already reported this order.');
        }
        $id = Report::nextId('RP-', 3);
        Report::create(['id' => $id, 'organization_id' => $order->organization_id, 'user_id' => $user->id, 'order_id' => $order->id, 'reason' => $data['reason'], 'details' => trim($data['details']), 'filed_on' => today(), 'status' => 'Open']);
        Activity::record('report-filed', $user->email, $id.' · '.Organization::find($order->organization_id)->name);
    }

    private function profileContact(Request $request, User $user): void
    {
        $this->buyer($user);
        $data = $request->validate(['phone' => ['required', 'regex:'.self::PHONE]], ['phone.regex' => 'Enter a mobile number like 0917 555 0148.']);
        $user->update(['phone' => $data['phone']]);
        Activity::record('profile-updated', $user->email, 'Mobile number');
    }

    private function privacy(Request $request, User $user): void
    {
        $this->buyer($user);
        $data = $request->validate(['key' => 'required|in:profile,reviews,city,growers', 'value' => 'required|boolean']);
        $user->update(['privacy' => array_merge($user->privacySettings(), [$data['key'] => (bool) $data['value']])]);
        Activity::record('profile-updated', $user->email, 'Privacy settings');
    }

    /* ---------- Organizations ---------- */

    private function orgOrder(Request $request, Organization $org): Order
    {
        $order = Order::find((string) $request->input('order'));
        self::refuseUnless($order && $order->organization_id === $org->id, 404, 'That order wasn’t found.');

        return $order;
    }

    private function orderAdvance(Request $request, User $user): array
    {
        $order = $this->orgOrder($request, $this->myOrg($user));
        $next = Order::NEXT_STEP[$order->status] ?? $this->fail('This order has no next step.');
        $order->moveTo($next[0]);
        Activity::record('order-updated', $user->email, $order->number().' → '.$order->status);

        return ['status' => $order->status];
    }

    private function orderDecline(Request $request, User $user): void
    {
        $org = $this->myOrg($user);
        $order = $this->orgOrder($request, $org);
        // New orders can be declined; confirmed or preparing ones only when the buyer's account is suspended.
        $buyerSuspended = $order->user?->status === 'Suspended';
        if ($order->status !== 'Pending' && ! ($buyerSuspended && in_array($order->status, ['Confirmed', 'Processing'], true))) {
            $this->fail('Only new orders can be declined.');
        }
        if ($order->status === 'Pending' && ! $buyerSuspended) {
            $reason = trim((string) $request->validate(['reason' => 'required|string|min:10|max:300'], ['reason.*' => 'Explain why the order was declined in at least 10 characters.'])['reason']);
            if (mb_strlen($reason) < 10) {
                throw ValidationException::withMessages(['reason' => 'Explain why the order was declined in at least 10 characters.']);
            }
            $order->cancel_reason = 'Declined by '.$org->name.': '.$reason;
            $order->moveTo('Cancelled');
            if ($order->payment === 'Paid' && $order->funds === 'Held') {
                Escrow::refundOrder($order, $order->cancel_reason);
            }
            Activity::record('order-cancelled', $user->email, $order->number().' · '.$order->cancel_reason, $order->user?->email);

            return;
        }
        $accountReason = trim((string) $order->user?->suspension_reason);
        $reason = 'Cancelled by '.$org->name.' because the buyer’s account is suspended.'.($accountReason ? ' Reason: '.$accountReason : '');
        Suspensions::cancel($order, mb_substr($reason, 0, 200));
    }

    private function orgRefund(Request $request, Organization $org): RefundRequest
    {
        $refund = RefundRequest::with('order.organization')->find((string) $request->input('id'));
        self::refuseUnless($refund && $refund->organization_id === $org->id, 404, 'That refund request wasn’t found.');
        if ($refund->status !== 'Requested' || $refund->respond_by->isPast()) {
            $this->fail('This refund request was already settled.');
        }

        return $refund;
    }

    private function refundAccept(Request $request, User $user): array
    {
        $refund = $this->orgRefund($request, $this->myOrg($user));
        Escrow::refund($refund, 'organization');
        Activity::record('refund-accepted', $user->email, $refund->order->number().' · '.$refund->id);

        return ['status' => $refund->fresh()->status];
    }

    // A dispute goes to the administrators; the payment stays held until one of them decides.
    private function refundDispute(Request $request, User $user): void
    {
        $refund = $this->orgRefund($request, $this->myOrg($user));
        $reason = trim((string) $request->validate(['reason' => 'required|string|min:10|max:300'], ['reason.*' => 'Explain why in at least 10 characters.'])['reason']);
        $refund->update(['status' => 'Disputed', 'dispute_reason' => $reason, 'disputed_at' => now()]);
        Activity::record('refund-disputed', $user->email, $refund->order->number().' · '.$refund->id);
    }

    private function orgCrop(Request $request, Organization $org, string $key = 'id'): Crop
    {
        $crop = Crop::find((string) $request->input($key));
        self::refuseUnless($crop && $crop->organization_id === $org->id, 404, 'That listing wasn’t found.');

        return $crop;
    }

    private function listingSave(Request $request, User $user): array
    {
        $org = $this->myOrg($user);
        $editing = $request->filled('id') ? $this->orgCrop($request, $org) : null;
        if ($editing?->status === 'Removed') {
            $this->fail('This listing was removed by AniBayan and can’t be edited or published again.');
        }
        $data = $request->validate([
            'name' => 'required|string|min:2|max:80', 'category' => 'required|in:Vegetables,Fruits,Rice & grains',
            'unit' => 'required|in:kg,piece,bundle,sack', 'price' => 'required|integer|min:1|max:1000000',
            'stock' => 'required|integer|min:'.($editing ? 0 : 1).'|max:1000000', 'shelfLife' => 'required|integer|min:1|max:365',
            'harvested' => 'required|date_format:Y-m-d|before_or_equal:today', 'image' => 'nullable|string|max:200', 'photo' => 'nullable|string',
        ], ['harvested.before_or_equal' => 'The harvest date can’t be in the future.']);
        if (today()->diffInDays(\Illuminate\Support\Carbon::parse($data['harvested']), true) > $data['shelfLife']) {
            $this->fail('This harvest is already past its '.$data['shelfLife'].'-day shelf life, so it can’t be listed.');
        }
        $image = $editing?->image ?? 'vegetable-cutout.png';
        if (! empty($data['photo'])) {
            $image = Photos::store($data['photo'], 'listings');
        } elseif (! empty($data['image'])) {
            self::refuseUnless(in_array($data['image'], Photos::STOCK, true), 422, 'Choose one of the stock photos.');
            $image = $data['image'];
        }
        if ($editing && $image !== $editing->image) {
            Photos::delete($editing->image);
        }
        $fields = ['name' => $data['name'], 'category' => $data['category'], 'unit' => $data['unit'], 'price' => $data['price'], 'stock' => $data['stock'],
            'shelf_life' => $data['shelfLife'], 'harvested_on' => $data['harvested'], 'image' => $image];
        if ($editing) {
            $oldPrice = $editing->price;
            $editing->fill($fields);
            if ($editing->stock === 0 && $editing->status === 'Active') {
                $editing->status = 'Unavailable';
            }
            $editing->save();
            Activity::record($oldPrice !== $editing->price ? 'price-changed' : 'listing-edited', $user->email,
                $oldPrice !== $editing->price ? $editing->name.' · '.$this->money($oldPrice).' → '.$this->money($editing->price).' /'.$editing->unit : $editing->name);

            return ['id' => $editing->id, 'name' => $editing->name];
        }
        $crop = Crop::create(['id' => Crop::nextId('CROP-', 3), 'organization_id' => $org->id, 'status' => 'Active'] + $fields);
        Activity::record('listing-added', $user->email, $crop->name.' · '.$this->money($crop->price).' /'.$crop->unit);

        return ['id' => $crop->id, 'name' => $crop->name];
    }

    private function listingToggle(Request $request, User $user): array
    {
        $crop = $this->orgCrop($request, $this->myOrg($user));
        $crop = Crop::whereKey($crop->id)->lockForUpdate()->firstOrFail();
        if ($crop->status === 'Removed') {
            $this->fail('This listing was removed by AniBayan and can’t be published again.');
        }
        if ($crop->status !== 'Active' && $crop->stock === 0) {
            $this->fail('Add stock before publishing this listing.');
        }
        $activeOrders = 0;
        if ($crop->status === 'Active') {
            $activeOrders = DB::table('order_items')->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('order_items.crop_id', $crop->id)->whereNotIn('orders.status', ['Completed', 'Cancelled', 'Refunded'])
                ->distinct()->count('orders.id');
            if ($activeOrders && ! $request->boolean('confirmActiveOrders')) {
                $this->fail('This listing has '.$activeOrders.' active '.($activeOrders === 1 ? 'order' : 'orders').'. Confirm that you want to unpublish it; existing orders will stay active.');
            }
        }
        $crop->update(['status' => $crop->status === 'Active' ? 'Unavailable' : 'Active']);
        Activity::record($crop->status === 'Active' ? 'listing-resumed' : 'listing-paused', $user->email, $crop->name);

        return ['status' => $crop->status, 'activeOrders' => $activeOrders ?? 0];
    }

    // Removing a listing also takes it out of carts and saved harvests; placed orders keep their items.
    private function listingRemove(Request $request, User $user): array
    {
        $crop = $this->orgCrop($request, $this->myOrg($user));
        if ($crop->status === 'Removed') {
            $this->fail('This listing was removed by AniBayan. Contact support if you need help.');
        }
        $name = $crop->name;
        Photos::delete($crop->image);
        $crop->delete();
        Activity::record('listing-removed', $user->email, $name);

        return ['name' => $name];
    }

    private function memberAdd(Request $request, User $user): void
    {
        $org = $this->myOrg($user);
        $data = $request->validate([
            'name' => 'required|string|min:3|max:80', 'area' => 'required|numeric|min:0.1|max:500',
            'crops' => 'required|string|min:3|max:80', 'applicationMessage' => 'required|string|min:10|max:500',
        ]);
        $message = trim($data['applicationMessage']);
        if (mb_strlen($message) < 10) {
            throw ValidationException::withMessages(['applicationMessage' => 'Enter an application message of at least 10 characters.']);
        }
        // Only farmers from the organization's own barangay can be members, so the barangay is always the organization's.
        Member::create([
            'id' => Member::nextId('MB-', 3), 'organization_id' => $org->id, 'name' => $data['name'], 'place' => $org->barangay,
            'crops' => $data['crops'], 'area' => round($data['area'], 1), 'joined' => (string) today()->year,
            'status' => 'Pending', 'application_message' => $message,
        ]);
    }

    private function orgMember(Request $request, Organization $org): Member
    {
        $member = Member::find((string) $request->input('id'));
        self::refuseUnless($member && $member->organization_id === $org->id, 404, 'That member wasn’t found.');

        return $member;
    }

    private function memberConfirm(Request $request, User $user): void
    {
        $this->orgMember($request, $this->myOrg($user))->update(['status' => 'Active']);
    }

    private function memberRemove(Request $request, User $user): void
    {
        $this->orgMember($request, $this->myOrg($user))->delete();
    }

    private function orgProfile(Request $request, User $user): void
    {
        $org = $this->myOrg($user);
        $data = $request->validate([
            'crop' => 'required|string|min:3|max:80', 'barangay' => ['required', Rule::in(BarangayDirectory::names())],
            'phone' => ['required', 'regex:'.self::PHONE], 'description' => 'nullable|string|max:240',
        ], ['barangay.in' => 'Choose your barangay.', 'phone.regex' => 'Enter a mobile number like 0917 555 0148.']);
        $org->update(['crop' => $data['crop'], 'barangay' => $data['barangay'], 'phone' => $data['phone'], 'description' => $data['description'] ?? '']);
        Activity::record('profile-updated', $user->email, 'Organization profile');
    }

    /* ---------- Administrators ---------- */

    private function otherAccount(Request $request, User $admin): User
    {
        $account = User::where('email', (string) $request->input('email'))->first();
        self::refuseUnless($account, 404, 'That account wasn’t found.');
        self::refuseIf($account->id === $admin->id, 422, 'You can’t do this to your own account.');

        return $account;
    }

    private function adminListingRemove(Request $request, User $admin): array
    {
        $this->admin($admin);
        $data = $request->validate(['id' => 'required|string', 'reason' => 'required|string|min:10|max:500']);
        $crop = Crop::with('organization')->find($data['id']) ?? $this->fail('That listing wasn’t found.', 404);
        if ($crop->status === 'Removed') {
            $this->fail('That listing has already been removed.');
        }
        $reason = trim($data['reason']);
        if (mb_strlen($reason) < 10) {
            throw ValidationException::withMessages(['reason' => 'Give a reason of at least 10 characters.']);
        }
        $crop->update(['status' => 'Removed', 'removal_reason' => $reason, 'removed_by' => $admin->id, 'removed_at' => now()]);
        DB::table('cart_lines')->where('crop_id', $crop->id)->delete();
        DB::table('saved_crops')->where('crop_id', $crop->id)->delete();
        Activity::record('listing-removed', $admin->email, $crop->name.' · '.Str::limit($reason, 200), $crop->organization->name);

        return ['name' => $crop->name, 'organization' => $crop->organization->name];
    }

    private function barangayAdd(Request $request, User $admin): array
    {
        $this->admin($admin);
        $data = $request->validate([
            'municipality' => ['required', Rule::in([config('anibayan.city')])],
            'name' => 'required|string|min:2|max:80',
        ]);
        $name = trim(preg_replace('/\s+/', ' ', $data['name']));
        if (mb_strlen($name) < 2) {
            throw ValidationException::withMessages(['name' => 'Enter a barangay name.']);
        }
        $key = mb_strtolower($name);
        if (DB::table('barangays')->where('municipality', $data['municipality'])->where('name_key', $key)->exists()) {
            $this->fail('That barangay is already listed under '.$data['municipality'].'.');
        }
        $inserted = DB::table('barangays')->insertOrIgnore([
            'municipality' => $data['municipality'], 'name' => $name, 'name_key' => $key, 'created_at' => now(), 'updated_at' => now(),
        ]);
        if (! $inserted) {
            $this->fail('That barangay is already listed under '.$data['municipality'].'.');
        }
        Activity::record('barangay-added', $admin->email, $name.' · '.$data['municipality']);

        return ['name' => $name, 'municipality' => $data['municipality']];
    }

    private function barangayUpdate(Request $request, User $admin): array
    {
        $this->admin($admin);
        $data = $request->validate([
            'municipality' => ['required', Rule::in([config('anibayan.city')])],
            'current' => 'required|string|max:80', 'name' => 'required|string|min:2|max:80',
        ]);
        $currentKey = mb_strtolower(trim($data['current']));
        $current = DB::table('barangays')->where('municipality', $data['municipality'])->where('name_key', $currentKey)->first();
        self::refuseUnless($current, 404, 'That barangay wasn’t found. Refresh the list and try again.');
        $name = trim(preg_replace('/\s+/', ' ', $data['name']));
        if (mb_strlen($name) < 2) {
            throw ValidationException::withMessages(['name' => 'Enter a barangay name.']);
        }
        $key = mb_strtolower($name);
        if (DB::table('barangays')->where('municipality', $data['municipality'])->where('name_key', $key)->where('id', '!=', $current->id)->exists()) {
            $this->fail('That barangay is already listed under '.$data['municipality'].'.');
        }

        DB::transaction(function () use ($admin, $current, $name, $key) {
            DB::table('organizations')->where('barangay', $current->name)->update(['barangay' => $name]);
            DB::table('addresses')->where('barangay', $current->name)->update(['barangay' => $name]);
            DB::table('members')->where('place', $current->name)->update(['place' => $name]);
            DB::table('barangays')->where('id', $current->id)->update(['name' => $name, 'name_key' => $key, 'updated_at' => now()]);
            Activity::record('barangay-updated', $admin->email, $current->name.' → '.$name.' · '.config('anibayan.city'));
        });

        return ['current' => $current->name, 'name' => $name, 'municipality' => $data['municipality']];
    }

    private function barangayRemove(Request $request, User $admin): array
    {
        $this->admin($admin);
        $data = $request->validate([
            'municipality' => ['required', Rule::in([config('anibayan.city')])],
            'name' => 'required|string|max:80', 'replacement' => 'nullable|string|max:80',
        ]);
        $nameKey = mb_strtolower(trim($data['name']));
        $barangay = DB::table('barangays')->where('municipality', $data['municipality'])->where('name_key', $nameKey)->first();
        self::refuseUnless($barangay, 404, 'That barangay wasn’t found. Refresh the list and try again.');
        self::refuseUnless(DB::table('barangays')->where('municipality', $data['municipality'])->count() > 1, 422, 'Keep at least one barangay in '.$data['municipality'].'.');

        $organizations = DB::table('organizations')->where('barangay', $barangay->name)->count();
        $addresses = DB::table('addresses')->where('barangay', $barangay->name)->count();
        $members = DB::table('members')->where('place', $barangay->name)->count();
        $replacement = trim((string) ($data['replacement'] ?? ''));
        if ($replacement === '' && ($organizations || $addresses || $members)) {
            $this->fail('This barangay is in use. Choose another barangay to move its organizations, member records and saved addresses.');
        }
        if ($replacement !== '') {
            $replacementRecord = DB::table('barangays')->where('municipality', $data['municipality'])->where('name', $replacement)->first();
            self::refuseUnless($replacementRecord && $replacementRecord->id !== $barangay->id, 422, 'Choose another barangay from the same municipality.');
        }

        DB::transaction(function () use ($admin, $barangay, $replacement, $data) {
            if ($replacement !== '') {
                DB::table('organizations')->where('barangay', $barangay->name)->update(['barangay' => $replacement]);
                DB::table('addresses')->where('barangay', $barangay->name)->update(['barangay' => $replacement]);
                DB::table('members')->where('place', $barangay->name)->update(['place' => $replacement]);
            }
            DB::table('barangays')->where('id', $barangay->id)->delete();
            Activity::record('barangay-removed', $admin->email, $barangay->name.' · '.($replacement !== '' ? 'moved to '.$replacement : 'unused').' · '.$data['municipality']);
        });

        return ['name' => $barangay->name, 'replacement' => $replacement ?: null, 'organizations' => $organizations, 'addresses' => $addresses, 'members' => $members];
    }

    private function accountSuspend(Request $request, User $user): array
    {
        $this->admin($user);
        $account = $this->otherAccount($request, $user);
        self::refuseIf($account->isAdmin() || ! in_array($account->status, ['Active', 'Suspended'], true), 422, 'This account can’t be suspended.');
        $suspend = $account->status === 'Active';
        $reason = $suspend ? trim($request->validate(['reason' => 'required|string|min:10|max:500'])['reason']) : null;
        if ($suspend && mb_strlen((string) $reason) < 10) {
            throw ValidationException::withMessages(['reason' => 'Give a reason of at least 10 characters.']);
        }
        $account->update([
            'status' => $suspend ? 'Suspended' : 'Active',
            'note' => $suspend ? 'Suspended by '.$user->name.' on '.today()->format('M d, Y').'.' : null,
            'suspension_reason' => $reason,
        ]);
        Activity::record($suspend ? 'account-suspended' : 'account-reactivated', $user->email, $account->name, $account->email);
        // Open orders: see App\Support\Suspensions.
        $cancelled = 0;
        if ($suspend && $account->isBuyer()) {
            $cancelled = Suspensions::buyerSuspended($account, (string) $reason);
        } elseif ($suspend && $account->isRepresentative() && $account->organization) {
            $cancelled = Suspensions::organizationStopped($account->organization, 'was suspended', (string) $reason);
        }

        return ['status' => $account->status, 'cancelled' => $cancelled, 'reason' => $reason];
    }

    // A new temporary password, shown once so the administrator can pass it on.
    private function accountResetPassword(Request $request, User $user): array
    {
        $this->admin($user);
        $account = $this->otherAccount($request, $user);
        $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
        $temporary = 'ab-'.implode('', array_map(fn () => $alphabet[random_int(0, strlen($alphabet) - 1)], range(1, 8)));
        $account->update(['password' => $temporary]);
        Activity::record('password-reset', $user->email, $account->name, $account->email);

        return ['password' => $temporary];
    }

    private function applicationReview(Request $request, User $user): array
    {
        $this->admin($user);
        $data = $request->validate([
            'name' => 'required|string', 'decision' => 'required|in:Active,Declined',
            'reason' => 'required_if:decision,Declined|nullable|string|min:10|max:500',
        ], ['reason.required_if' => 'Add a reason so the representative knows why the application was declined.', 'reason.min' => 'Give a reason of at least 10 characters.']);
        $org = Organization::where('name', $data['name'])->first();
        self::refuseUnless($org && $org->status === 'Pending review', 422, 'This application was already decided.');
        $reason = $data['decision'] === 'Declined' ? trim((string) $data['reason']) : null;
        if ($reason !== null && mb_strlen($reason) < 10) {
            throw ValidationException::withMessages(['reason' => 'Give a reason of at least 10 characters.']);
        }
        if ($data['decision'] === 'Active') {
            $barangayName = trim(preg_replace('/\s+/', ' ', $org->barangay));
            $barangayKey = mb_strtolower($barangayName);
            $listed = DB::table('barangays')->where('municipality', config('anibayan.city'))->where('name_key', $barangayKey)->first();
            if ($listed) {
                $barangayName = $listed->name;
            } else {
                $inserted = DB::table('barangays')->insertOrIgnore([
                    'municipality' => config('anibayan.city'), 'name' => $barangayName, 'name_key' => $barangayKey, 'created_at' => now(), 'updated_at' => now(),
                ]);
                if ($inserted) {
                    Activity::record('barangay-added', $user->email, $barangayName.' · '.config('anibayan.city').' · from approved application '.$org->name);
                } else {
                    $barangayName = DB::table('barangays')->where('municipality', config('anibayan.city'))->where('name_key', $barangayKey)->value('name') ?? $barangayName;
                }
            }
            $org->barangay = $barangayName;
        }
        $org->update([
            'status' => $data['decision'], 'approved_on' => $data['decision'] === 'Active' ? today() : null,
            'application_decline_reason' => $reason,
        ]);
        $rep = User::where('organization_id', $org->id)->where('status', 'Pending')->first();
        $rep?->update(['status' => $data['decision'] === 'Active' ? 'Active' : 'Declined']);
        Activity::record($data['decision'] === 'Active' ? 'application-approved' : 'application-declined', $user->email, $org->name.($reason ? ' · '.$reason : ''), $rep?->email);

        return ['representative' => $rep?->name, 'reason' => $reason];
    }

    private function reportDecide(Request $request, User $user): void
    {
        $this->admin($user);
        $data = $request->validate([
            'id' => 'required|string', 'decision' => 'required|in:Upheld,Dismissed,Open',
            'note' => 'required_if:decision,Dismissed|nullable|string|min:10|max:500',
        ], ['note.required_if' => 'Explain why the report was dismissed so the reporter understands the decision.', 'note.min' => 'Give an explanation of at least 10 characters.']);
        $report = Report::find($data['id']) ?? $this->fail('That report wasn’t found.', 404);
        $org = Organization::find($report->organization_id);
        if ($data['decision'] === 'Upheld' && $org->onFinalWarning()) {
            $this->fail($org->name.' is on its final warning: uphold this report and terminate the organization instead.');
        }
        $note = $data['decision'] === 'Dismissed' ? trim((string) $data['note']) : null;
        if ($note !== null && mb_strlen($note) < 10) {
            throw ValidationException::withMessages(['note' => 'Give an explanation of at least 10 characters.']);
        }
        $report->update(['status' => $data['decision'], 'decided_on' => $data['decision'] === 'Open' ? null : today(), 'decision_note' => $note]);
        $reporterEmail = User::whereKey($report->user_id)->value('email');
        Activity::record(['Upheld' => 'report-upheld', 'Dismissed' => 'report-dismissed', 'Open' => 'report-reopened'][$data['decision']], $user->email, $report->id.' · '.$org->name.($note ? ' · '.$note : ''), $reporterEmail);
    }

    private function namedOrg(string $name): Organization
    {
        return Organization::where('name', $name)->first() ?? $this->fail('That organization wasn’t found.', 404);
    }

    private function warningCreate(Request $request, User $user): void
    {
        $this->admin($user);
        $data = $request->validate(['organization' => 'required|string', 'reason' => 'required|string|min:5|max:120', 'details' => 'nullable|string|max:500'],
            ['reason.*' => 'Give a reason of at least 5 characters.']);
        $org = $this->namedOrg($data['organization']);
        self::refuseIf($org->status !== 'Active', 422, 'Only organizations that are selling can be warned.');
        self::refuseIf($org->onFinalWarning(), 422, $org->name.' is on its final warning: the next step is termination.');
        Warning::create(['id' => Warning::nextId('WN-', 3), 'organization_id' => $org->id, 'reason' => $data['reason'], 'details' => trim($data['details'] ?? ''), 'given_on' => today(), 'given_by' => $user->name]);
        Activity::record('warning-given', $user->email, $org->name.' · '.$data['reason'], $this->repEmail($org));
    }

    private function warningWithdraw(Request $request, User $user): array
    {
        $this->admin($user);
        $warning = Warning::find((string) $request->input('id')) ?? $this->fail('That warning wasn’t found.', 404);
        $org = Organization::find($warning->organization_id);
        self::refuseIf($org->status === 'Terminated', 422, 'Warnings can’t be withdrawn after termination.');
        $warning->delete();
        Activity::record('warning-withdrawn', $user->email, $org->name.' · '.$warning->reason, $this->repEmail($org));

        return ['organization' => $org->name];
    }

    // The offence after the final warning: with a report, upholding that report is what ends it.
    private function organizationTerminate(Request $request, User $user): void
    {
        $this->admin($user);
        $org = $this->namedOrg((string) $request->input('organization'));
        self::refuseIf($org->status === 'Terminated', 422, $org->name.' is already terminated.');
        self::refuseUnless($org->onFinalWarning(), 422, $org->name.' isn’t on its final warning yet.');
        if ($request->filled('report')) {
            $report = Report::where('id', $request->input('report'))->where('organization_id', $org->id)->first() ?? $this->fail('That report wasn’t found.', 404);
            $report->update(['status' => 'Upheld', 'decided_on' => today()]);
            $reason = mb_substr($report->reason.' (report '.$report->id.'): '.Str::limit(trim($report->details), 100), 0, 200);
            Activity::record('report-upheld', $user->email, $report->id.' · '.$org->name);
        } else {
            $reason = trim((string) $request->validate(['reason' => 'required|string|min:5|max:120'], ['reason.*' => 'Give a reason of at least 5 characters.'])['reason']);
        }
        $org->update(['status' => 'Terminated', 'terminated_on' => today(), 'terminated_for' => $reason]);
        User::where('organization_id', $org->id)->where('role', 'Representative')->update(['status' => 'Terminated', 'note' => $org->name.' was terminated: '.$reason]);
        Activity::record('org-terminated', $user->email, $org->name.' · '.$reason, $this->repEmail($org));
        Suspensions::organizationStopped($org, 'was terminated', $reason);
    }

    // An administrator settles a refund request: refund the buyer, or release the held payment to the organization.
    // Disputed requests wait for this; an administrator can also step in before the organization answers.
    private function refundDecide(Request $request, User $user): array
    {
        $this->admin($user);
        $data = $request->validate([
            'id' => 'required|string', 'decision' => 'required|in:refund,release',
            'note' => 'required_if:decision,release|nullable|string|min:10|max:300',
        ], ['note.required_if' => 'Explain why the refund was denied before releasing the payment.', 'note.min' => 'Give an explanation of at least 10 characters.', 'note.max' => 'Keep the note under 300 characters.']);
        $refund = RefundRequest::with('order.organization')->find($data['id']) ?? $this->fail('That refund request wasn’t found.', 404);
        self::refuseUnless(in_array($refund->status, ['Requested', 'Disputed'], true), 422, 'This refund request was already settled.');
        $note = trim((string) ($data['note'] ?? ''));
        if ($data['decision'] === 'release' && mb_strlen($note) < 10) {
            throw ValidationException::withMessages(['note' => 'Explain why the refund was denied in at least 10 characters.']);
        }
        $refund->update(['admin_note' => $note ?: null]);
        if ($data['decision'] === 'refund') {
            Escrow::refund($refund, 'admin');
        } else {
            $refund->update(['status' => 'Denied', 'decided_at' => now(), 'decided_by' => 'admin']);
            $refund->order->update(['status' => 'Completed']);
            Escrow::release($refund->order);
        }
        Activity::record('refund-decided', $user->email, $refund->id.' · '.$refund->order->number().' · '.($data['decision'] === 'refund' ? 'refunded to the buyer' : 'released to '.$refund->order->organization->name).($note ? ' · '.$note : ''));

        return ['status' => $refund->fresh()->status];
    }

    // One run of the site-health checks the admin page ran; the newest 30 are kept.
    private function healthRecord(Request $request, User $user): void
    {
        $this->admin($user);
        $data = $request->validate([
            'results' => 'required|array|max:10', 'results.*.service' => 'required|string|max:60', 'results.*.ok' => 'required|boolean',
            'results.*.latency' => 'required|numeric|min:0', 'results.*.error' => 'nullable|string|max:200',
            'hardware' => 'nullable|array', 'hardwareError' => 'nullable|string|max:300',
        ]);
        HealthRun::create(['ran_at' => now(), 'results' => $data['results'], 'hardware' => $data['hardware'] ?? null, 'hardware_error' => $data['hardwareError'] ?? null]);
        $cutoff = HealthRun::orderByDesc('id')->skip(30)->value('id');
        if ($cutoff) {
            HealthRun::where('id', '<=', $cutoff)->delete();
        }
    }

    // Puts every table back to the starting data and removes uploaded photos and application documents. Everyone is signed out.
    private function dataReset(Request $request, User $user): array
    {
        $this->admin($user);
        Storage::disk('local')->deleteDirectory(Documents::FOLDER);
        Storage::disk('local')->deleteDirectory(RefundMediaStore::FOLDER);
        Artisan::call('migrate:fresh', ['--seed' => true, '--force' => true]);
        File::deleteDirectory(public_path('anibayan/uploads'));
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return ['signedOut' => true];
    }

    /* ---------- Everyone signed in ---------- */

    private function passwordChange(Request $request, User $user): void
    {
        $data = $request->validate(['current' => 'required|string', 'password' => 'required|string|min:8|max:200', 'confirm' => 'required|same:password'],
            ['password.min' => 'Use at least 8 characters.', 'confirm.same' => 'The two new passwords don’t match.']);
        if (! Hash::check($data['current'], $user->password)) {
            abort(response()->json(['message' => 'That isn’t your current password.', 'errors' => ['current' => ['That isn’t your current password.']]], 422));
        }
        if ($data['password'] === $data['current']) {
            abort(response()->json(['message' => 'Choose a password different from the current one.', 'errors' => ['password' => ['Choose a password different from the current one.']]], 422));
        }
        $user->update(['password' => $data['password']]);
        Activity::record('password-changed', $user->email);
    }

    private function preferences(Request $request, User $user): void
    {
        $data = $request->validate(['compact' => 'required|boolean', 'contrast' => 'required|boolean']);
        $user->update(['preferences' => ['compact' => (bool) $data['compact'], 'contrast' => (bool) $data['contrast']]]);
    }

    // "org:<name>" (the representative's organization) or "user:<email>" (a buyer's own profile).
    private function look(Request $request, User $user): User|Organization
    {
        $target = (string) $request->input('target');
        if (Str::startsWith($target, 'org:')) {
            $org = $this->myOrg($user);
            self::refuseUnless($org->name === substr($target, 4), 403, 'You can only change your own organization’s photos.');

            return $org;
        }
        self::refuseUnless($user->isBuyer() && strcasecmp(substr($target, 5), $user->email) === 0 && Str::startsWith($target, 'user:'), 403, 'You can only change your own photos.');

        return $user;
    }

    private function lookUpload(Request $request, User $user): void
    {
        $owner = $this->look($request, $user);
        $data = $request->validate(['kind' => 'required|in:avatar,banner', 'photo' => 'required|string']);
        $path = Photos::store($data['photo'], $data['kind'] === 'avatar' ? 'avatars' : 'banners');
        Photos::delete($owner->{$data['kind']});
        $owner->update($data['kind'] === 'avatar' ? ['avatar' => $path] : ['banner' => $path, 'banner_x' => 50, 'banner_y' => 50]);
        Activity::record('profile-updated', $user->email, $data['kind'] === 'avatar' ? 'Profile picture' : 'Profile banner');
    }

    private function lookRemove(Request $request, User $user): void
    {
        $owner = $this->look($request, $user);
        $kind = $request->validate(['kind' => 'required|in:avatar,banner'])['kind'];
        Photos::delete($owner->{$kind});
        $owner->update($kind === 'avatar' ? ['avatar' => null] : ['banner' => null, 'banner_x' => null, 'banner_y' => null]);
        Activity::record('profile-updated', $user->email, $kind === 'avatar' ? 'Profile picture removed' : 'Profile banner removed');
    }

    private function lookPosition(Request $request, User $user): void
    {
        $owner = $this->look($request, $user);
        $data = $request->validate(['x' => 'required|numeric|min:0|max:100', 'y' => 'required|numeric|min:0|max:100']);
        $owner->update(['banner_x' => round($data['x'], 1), 'banner_y' => round($data['y'], 1)]);
        Activity::record('profile-updated', $user->email, 'Banner position');
    }
}
