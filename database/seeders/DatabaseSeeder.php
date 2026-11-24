<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Address;
use App\Models\Crop;
use App\Models\Feedback;
use App\Models\Member;
use App\Models\Order;
use App\Models\Organization;
use App\Models\OrderItem;
use App\Models\RefundRequest;
use App\Models\Report;
use App\Models\User;
use App\Support\Calapan;
use App\Support\Documents;
use App\Support\RefundMediaStore;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

// AniBayan's starting data, all in Calapan City. Dates count back from today, so a fresh copy is always current.
// Run with: php artisan migrate:fresh --seed
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $ago = fn (int $days) => today()->subDays($days)->toDateString();
        $password = Hash::make(config('anibayan.demo_password'));
        $all = array_keys(Documents::TYPES);

        // [name, barangay, crop, image, status, representative, documents (Documents::TYPES keys), applied, approved, phone, description]
        $organizations = [
            ['Canubing Vegetable Growers', 'Canubing I', 'Vegetables & root crops', 'grower.png', 'Active', 'Ramon Dulnuan', $all, 39, 34, '0917 555 0110', 'Smallholder vegetable growers from Barangay Canubing and nearby barangays of Calapan City.'],
            ['Managpi Fruit Growers', 'Managpi', 'Mangoes & fruits', 'mango.jpg', 'Active', 'Carlo Mendoza', $all, 42, 38, '0918 555 0122', 'Mango and banana growers from Barangay Managpi, Calapan City.'],
            ['Bucayao Rice Farmers', 'Bucayao', 'Rice & grains', 'rice-hero.png', 'Active', 'Teodoro Pascual', $all, 46, 43, '0919 555 0133', 'Rice farming families from Barangay Bucayao, Calapan City.'],
            ['Sapul Harvest Collective', 'Sapul', 'Vegetables & roots', 'soil-story.png', 'Pending review', 'Joel Malabanan', ['registration', 'endorsement'], 2, null, null, null],
            ['Comunal Coconut Farmers Association', 'Comunal', 'Coconuts & root crops', 'seedlings-story.png', 'Pending review', 'Edna Villareal', $all, 1, null, null, null],
            ['Gulod Vegetable Growers', 'Gulod', 'Leafy vegetables', 'field-detail.jpg', 'Declined', 'Ben Soriano', ['id'], 15, null, null, null],
        ];
        $org = [];
        foreach ($organizations as [$name, $barangay, $crop, $image, $status, $rep, $docs, $applied, $approved, $phone, $description]) {
            $created = Organization::create([
                'name' => $name, 'barangay' => $barangay, 'crop' => $crop, 'image' => $image, 'status' => $status,
                'representative' => $rep, 'applied_on' => $ago($applied),
                'approved_on' => $approved === null ? null : $ago($approved), 'phone' => $phone, 'description' => $description,
            ]);
            foreach ($docs as $type) {
                Documents::seedSample($created, $type);
            }
            $org[$name] = $created->id;
        }

        // [name, email, role, organization, joined, last active, status, phone, address, note]
        $accounts = [
            ['Alex Reyes', 'alex@example.com', 'Consumer', null, 44, 0, 'Active', '0917 555 0148', '12 J.P. Rizal Street, Barangay Lalud, Calapan City, Oriental Mindoro', null],
            ['Maria Santos', 'maria@example.com', 'Consumer', null, 42, 0, 'Active', '0927 555 0161', '45 Mabini Street, Barangay Camilmil, Calapan City, Oriental Mindoro', null],
            ['Isabel Cruz', 'isabel@example.com', 'Consumer', null, 40, 1, 'Active', '0939 555 0172', '8 Del Pilar Street, Barangay Suqui, Calapan City, Oriental Mindoro', null],
            ['Daniel Tan', 'daniel@example.com', 'Consumer', null, 35, 5, 'Active', '0945 555 0183', '23 Luna Street, Barangay Guinobatan, Calapan City, Oriental Mindoro', null],
            ['Jessa Bautista', 'jessa@example.com', 'Consumer', null, 27, 25, 'Suspended', null, null, 'Suspended after repeated abusive messages to growers.'],
            ['Ramon Dulnuan', 'ramon@example.com', 'Representative', 'Canubing Vegetable Growers', 39, 0, 'Active', '0917 555 0110', null, null],
            ['Carlo Mendoza', 'carlo@example.com', 'Representative', 'Managpi Fruit Growers', 42, 1, 'Active', '0918 555 0122', null, null],
            ['Teodoro Pascual', 'teodoro@example.com', 'Representative', 'Bucayao Rice Farmers', 46, 2, 'Active', '0919 555 0133', null, null],
            ['Joel Malabanan', 'joel@example.com', 'Representative', 'Sapul Harvest Collective', 2, 2, 'Pending', null, null, null],
            ['Edna Villareal', 'edna@example.com', 'Representative', 'Comunal Coconut Farmers Association', 1, 1, 'Pending', null, null, null],
            ['AniBayan Admin', 'admin@example.com', 'Administrator', null, 47, 0, 'Active', null, null, null],
        ];
        $user = [];
        foreach ($accounts as [$name, $email, $role, $organization, $joined, $active, $status, $phone, $address, $note]) {
            $user[$name] = User::create([
                'name' => $name, 'email' => $email, 'password' => $password, 'role' => $role,
                'organization_id' => $organization ? $org[$organization] : null, 'status' => $status,
                'phone' => $phone, 'note' => $note, 'joined_on' => $ago($joined), 'last_active_on' => $ago($active),
            ])->id;
            // Buyers' saved delivery address, pinned near the middle of their barangay.
            if ($address && preg_match('/^(.*?),\s*Barangay\s+([^,]+),/u', $address, $m)) {
                [$lat, $lng] = Calapan::centre($m[2]) ?? [null, null];
                Address::create(['user_id' => $user[$name], 'label' => 'Home', 'details' => $m[1], 'barangay' => $m[2], 'lat' => $lat, 'lng' => $lng, 'is_default' => true]);
            }
        }

        // [id, name, organization, image, price, category, stock, status, harvested, shelf life]
        $crops = [
            ['CROP-001', 'Carabao mangoes', 'Managpi Fruit Growers', 'mango.jpg', 130, 'Fruits', 180, 'Active', 3, 7],
            ['CROP-002', 'Fresh carrots', 'Canubing Vegetable Growers', 'carrot.jpg', 70, 'Vegetables', 96, 'Active', 2, 21],
            ['CROP-003', 'Dinorado rice', 'Bucayao Rice Farmers', 'rice.jpg', 58, 'Rice & grains', 850, 'Active', 19, 180],
            ['CROP-004', 'Red onions', 'Canubing Vegetable Growers', 'onion.jpg', 90, 'Vegetables', 45, 'Active', 11, 30],
            ['CROP-005', 'Purple eggplants', 'Canubing Vegetable Growers', 'eggplant.jpg', 65, 'Vegetables', 0, 'Unavailable', 9, 7],
            ['CROP-006', 'Golden bananas', 'Managpi Fruit Growers', 'bananas.jpg', 55, 'Fruits', 74, 'Active', 4, 6],
            ['CROP-007', 'Vine-ripened tomatoes', 'Canubing Vegetable Growers', 'tomatoes.jpg', 80, 'Vegetables', 132, 'Active', 5, 7],
            ['CROP-008', 'Sweet potatoes', 'Canubing Vegetable Growers', 'sweet-potatoes.jpg', 45, 'Vegetables', 28, 'Active', 14, 28],
        ];
        foreach ($crops as [$id, $name, $organization, $image, $price, $category, $stock, $status, $harvested, $shelfLife]) {
            Crop::create(['id' => $id, 'organization_id' => $org[$organization], 'name' => $name, 'image' => $image, 'price' => $price, 'unit' => 'kg', 'category' => $category, 'stock' => $stock, 'status' => $status, 'harvested_on' => $ago($harvested), 'shelf_life' => $shelfLife]);
        }

        // [number, buyer, organization, crop, image, quantity, total, days ago, status, payment]
        $orders = [
            [1048, 'Alex Reyes', 'Canubing Vegetable Growers', 'Vegetable basket', 'vegetable-cutout.png', '3 items', 485, 0, 'Processing', 'Paid'],
            [1047, 'Maria Santos', 'Managpi Fruit Growers', 'Carabao mangoes', 'mango.jpg', '5 kg', 650, 0, 'Pending', 'Unpaid'],
            [1046, 'Carlo Mendoza', 'Bucayao Rice Farmers', 'Dinorado rice', 'rice.jpg', '25 kg', 1450, 1, 'Confirmed', 'Paid'],
            [1045, 'Alex Reyes', 'Managpi Fruit Growers', 'Carabao mangoes', 'mango.jpg', '2 kg', 260, 2, 'Completed', 'Paid'],
            [1044, 'Isabel Cruz', 'Canubing Vegetable Growers', 'Fresh carrots', 'carrot.jpg', '4 kg', 280, 2, 'Completed', 'Paid'],
            [1043, 'Alex Reyes', 'Bucayao Rice Farmers', 'Dinorado rice', 'rice.jpg', '10 kg', 580, 4, 'Completed', 'Paid'],
            [1042, 'Daniel Tan', 'Canubing Vegetable Growers', 'Red onions', 'onion.jpg', '2 kg', 180, 5, 'Cancelled', 'Unpaid'],
            [1041, 'Alex Reyes', 'Canubing Vegetable Growers', 'Fresh carrots', 'carrot.jpg', '2 kg', 140, 6, 'Pending', 'Unpaid'],
            [1040, 'Maria Santos', 'Canubing Vegetable Growers', 'Vine-ripened tomatoes', 'tomatoes.jpg', '6 kg', 480, 6, 'Confirmed', 'Paid'],
            [1039, 'Isabel Cruz', 'Canubing Vegetable Growers', 'Sweet potatoes', 'sweet-potatoes.jpg', '8 kg', 360, 7, 'Completed', 'Paid'],
            [1038, 'Carlo Mendoza', 'Canubing Vegetable Growers', 'Red onions', 'onion.jpg', '5 kg', 450, 7, 'Completed', 'Paid'],
            [1037, 'Daniel Tan', 'Bucayao Rice Farmers', 'Dinorado rice', 'rice.jpg', '15 kg', 870, 9, 'Completed', 'Paid'],
            [1036, 'Maria Santos', 'Canubing Vegetable Growers', 'Fresh carrots', 'carrot.jpg', '5 kg', 350, 10, 'Completed', 'Paid'],
            [1035, 'Isabel Cruz', 'Managpi Fruit Growers', 'Golden bananas', 'bananas.jpg', '4 kg', 220, 11, 'Completed', 'Paid'],
            [1034, 'Alex Reyes', 'Canubing Vegetable Growers', 'Vine-ripened tomatoes', 'tomatoes.jpg', '3 kg', 240, 12, 'Completed', 'Paid'],
            [1033, 'Carlo Mendoza', 'Bucayao Rice Farmers', 'Dinorado rice', 'rice.jpg', '20 kg', 1160, 13, 'Completed', 'Paid'],
            [1032, 'Daniel Tan', 'Managpi Fruit Growers', 'Carabao mangoes', 'mango.jpg', '3 kg', 390, 14, 'Completed', 'Paid'],
            [1031, 'Maria Santos', 'Canubing Vegetable Growers', 'Sweet potatoes', 'sweet-potatoes.jpg', '6 kg', 270, 15, 'Completed', 'Paid'],
            [1030, 'Isabel Cruz', 'Bucayao Rice Farmers', 'Dinorado rice', 'rice.jpg', '10 kg', 580, 17, 'Completed', 'Paid'],
            [1029, 'Alex Reyes', 'Canubing Vegetable Growers', 'Red onions', 'onion.jpg', '3 kg', 270, 18, 'Cancelled', 'Unpaid'],
            [1028, 'Maria Santos', 'Managpi Fruit Growers', 'Carabao mangoes', 'mango.jpg', '4 kg', 520, 19, 'Completed', 'Paid'],
            [1027, 'Daniel Tan', 'Canubing Vegetable Growers', 'Fresh carrots', 'carrot.jpg', '6 kg', 420, 21, 'Completed', 'Paid'],
            [1026, 'Carlo Mendoza', 'Canubing Vegetable Growers', 'Vine-ripened tomatoes', 'tomatoes.jpg', '4 kg', 320, 23, 'Completed', 'Paid'],
            [1025, 'Isabel Cruz', 'Bucayao Rice Farmers', 'Dinorado rice', 'rice.jpg', '25 kg', 1450, 24, 'Completed', 'Paid'],
            [1024, 'Alex Reyes', 'Managpi Fruit Growers', 'Golden bananas', 'bananas.jpg', '3 kg', 165, 26, 'Completed', 'Paid'],
            [1023, 'Maria Santos', 'Canubing Vegetable Growers', 'Red onions', 'onion.jpg', '4 kg', 360, 27, 'Completed', 'Paid'],
            [1022, 'Daniel Tan', 'Bucayao Rice Farmers', 'Dinorado rice', 'rice.jpg', '10 kg', 580, 30, 'Completed', 'Paid'],
            [1021, 'Isabel Cruz', 'Canubing Vegetable Growers', 'Sweet potatoes', 'sweet-potatoes.jpg', '10 kg', 450, 33, 'Completed', 'Paid'],
            [1020, 'Carlo Mendoza', 'Managpi Fruit Growers', 'Carabao mangoes', 'mango.jpg', '5 kg', 650, 36, 'Completed', 'Paid'],
        ];
        // Paid orders that aren't delivered yet were paid online, so AniBayan holds the money; completed ones alternate
        // between GCash (money released to the organization) and cash on delivery. Unpaid ones are cash on delivery.
        foreach ($orders as [$number, $buyer, $organization, $crop, $image, $quantity, $total, $days, $status, $payment]) {
            $placed = today()->subDays($days)->setTime(9, 0)->addMinutes($number % 480);
            $online = $payment === 'Paid' && ($status !== 'Completed' || $number % 2 === 0);
            $home = Address::where('user_id', $user[$buyer])->first();
            Order::create([
                'id' => 'AB-2026-'.$number, 'user_id' => $user[$buyer], 'organization_id' => $org[$organization], 'crop' => $crop, 'image' => $image,
                'quantity' => $quantity, 'total' => $total, 'placed_on' => $ago($days), 'status' => $status, 'payment' => $payment,
                'method' => $online ? 'GCash' : 'Cash on delivery', 'address' => $home?->fullText(), 'lat' => $home?->lat, 'lng' => $home?->lng,
                'phone' => User::find($user[$buyer])->phone, 'paid_at' => $payment === 'Paid' ? ($online ? $placed : $placed->copy()->addDay()) : null,
                'delivered_at' => $status === 'Completed' ? $placed->copy()->addDay() : null, 'received_at' => $status === 'Completed' ? $placed->copy()->addDays(2) : null,
                'funds' => $online ? ($status === 'Completed' ? 'Released' : 'Held') : null,
                'funds_settled_at' => $online && $status === 'Completed' ? $placed->copy()->addDays(2) : null,
                'created_at' => $placed, 'updated_at' => $placed,
            ]);
        }

        // Two GCash orders to try the newer steps with: Alex's delivered order waits for "Order received" (or a refund
        // request), and Maria asked for a refund that Canubing Vegetable Growers hasn't answered yet.
        // [number, buyer, organization, crop id, kg, placed days ago, delivered days ago, status]
        $recent = [
            [1049, 'Alex Reyes', 'Managpi Fruit Growers', 'CROP-006', 4, 4, 2, 'Delivered'],
            [1050, 'Maria Santos', 'Canubing Vegetable Growers', 'CROP-007', 5, 5, 3, 'Refund requested'],
            [1051, 'Isabel Cruz', 'Bucayao Rice Farmers', 'CROP-003', 10, 6, 4, 'Refund requested'],
        ];
        foreach ($recent as [$number, $buyer, $organization, $cropId, $kg, $placedAgo, $deliveredAgo, $status]) {
            $crop = Crop::find($cropId);
            $home = Address::where('user_id', $user[$buyer])->first();
            $placed = now()->subDays($placedAgo)->setTime(10, 15);
            Order::create([
                'id' => 'AB-2026-'.$number, 'user_id' => $user[$buyer], 'organization_id' => $org[$organization], 'crop' => $crop->name, 'image' => $crop->image,
                'quantity' => $kg.' '.$crop->unit, 'total' => $kg * $crop->price, 'placed_on' => $placed->toDateString(), 'status' => $status, 'payment' => 'Paid',
                'method' => 'GCash', 'address' => $home?->fullText(), 'lat' => $home?->lat, 'lng' => $home?->lng, 'phone' => User::find($user[$buyer])->phone,
                'paid_at' => $placed, 'delivered_at' => now()->subDays($deliveredAgo)->setTime(15, 30), 'funds' => 'Held', 'created_at' => $placed, 'updated_at' => $placed,
            ]);
            OrderItem::create(['order_id' => 'AB-2026-'.$number, 'crop_id' => $crop->id, 'name' => $crop->name, 'quantity' => $kg, 'unit' => $crop->unit, 'price' => $crop->price]);
        }
        $requested = now()->subDay()->setTime(8, 40);
        $refund = RefundRequest::create([
            'id' => 'RF-001', 'order_id' => 'AB-2026-1050', 'user_id' => $user['Maria Santos'], 'organization_id' => $org['Canubing Vegetable Growers'],
            'reason' => 'Spoiled or poor quality', 'details' => 'About half of the tomatoes were split and soft when the order arrived, and a few had mould near the stem.',
            'status' => 'Requested', 'requested_at' => $requested, 'respond_by' => $requested->copy()->addDays(Order::RESPOND_DAYS),
        ]);
        RefundMediaStore::seedFrom($refund, 'tomatoes.jpg', 'tomatoes-on-arrival.jpg');
        // Bucayao disputed Isabel's request, so it waits for an administrator.
        $requested = now()->subDays(3)->setTime(9, 5);
        $dispute = RefundRequest::create([
            'id' => 'RF-002', 'order_id' => 'AB-2026-1051', 'user_id' => $user['Isabel Cruz'], 'organization_id' => $org['Bucayao Rice Farmers'],
            'reason' => 'Wrong items', 'details' => 'Ordered 10 kg of Dinorado rice, but the sack that arrived was ordinary well-milled rice.',
            'status' => 'Disputed', 'requested_at' => $requested, 'respond_by' => $requested->copy()->addDays(Order::RESPOND_DAYS),
            'dispute_reason' => 'The sack was packed from our Dinorado harvest and labelled at the mill; the photo shows the same grain.',
            'disputed_at' => now()->subDay()->setTime(16, 20),
        ]);
        RefundMediaStore::seedFrom($dispute, 'rice.jpg', 'rice-sack.jpg');

        // [id, organization, buyer, rating, comment, days ago, order]
        $feedback = [
            ['FB-118', 'Managpi Fruit Growers', 'Alex Reyes', 5, 'Sweet, ripe mangoes and very well packed.', 1, 'AB-2026-1045'],
            ['FB-117', 'Bucayao Rice Farmers', 'Daniel Tan', 5, 'Clean grains, exactly as described.', 3, 'AB-2026-1037'],
            ['FB-116', 'Canubing Vegetable Growers', 'Isabel Cruz', 5, 'Carrots were crisp and arrived quickly.', 1, 'AB-2026-1044'],
            ['FB-115', 'Canubing Vegetable Growers', 'Carlo Mendoza', 4, 'Good onions; one bag was slightly bruised.', 6, 'AB-2026-1038'],
            ['FB-114', 'Canubing Vegetable Growers', 'Isabel Cruz', 5, 'Sweet potatoes were fresh and well sorted.', 6, 'AB-2026-1039'],
            ['FB-113', 'Bucayao Rice Farmers', 'Isabel Cruz', 4, 'Good rice. Delivery took one day longer than expected.', 15, 'AB-2026-1030'],
            ['FB-112', 'Managpi Fruit Growers', 'Daniel Tan', 3, 'Tasty, but a few mangoes were overripe.', 11, 'AB-2026-1032'],
            ['FB-111', 'Canubing Vegetable Growers', 'Maria Santos', 5, 'Carrots were fresh and the order was well packed.', 8, 'AB-2026-1036'],
            ['FB-110', 'Managpi Fruit Growers', 'Isabel Cruz', 4, 'Lovely fruit; the order was confirmed late.', 9, 'AB-2026-1035'],
            ['FB-109', 'Bucayao Rice Farmers', 'Carlo Mendoza', 5, 'Will order again.', 11, 'AB-2026-1033'],
            ['FB-108', 'Canubing Vegetable Growers', 'Daniel Tan', 4, 'Fresh vegetables, fair prices.', 19, 'AB-2026-1027'],
            ['FB-107', 'Managpi Fruit Growers', 'Maria Santos', 2, 'Received fewer kilos than ordered.', 17, 'AB-2026-1028'],
        ];
        foreach ($feedback as [$id, $organization, $buyer, $rating, $comment, $days, $order]) {
            Feedback::create(['id' => $id, 'organization_id' => $org[$organization], 'user_id' => $user[$buyer], 'order_id' => $order, 'rating' => $rating, 'comment' => $comment, 'given_on' => $ago($days)]);
        }

        // [id, organization, buyer, reason, details, days ago, status, order, decided days ago]
        $reports = [
            ['RP-031', 'Managpi Fruit Growers', 'Maria Santos', 'Short or wrong quantity', 'The order weighed 3.4 kg instead of the 4 kg I paid for.', 17, 'Upheld', 'AB-2026-1028', 16],
            ['RP-032', 'Managpi Fruit Growers', 'Daniel Tan', 'Poor quality or spoiled', 'Several mangoes were overripe and bruised on arrival.', 11, 'Open', 'AB-2026-1032', null],
            ['RP-033', 'Canubing Vegetable Growers', 'Carlo Mendoza', 'Late or no fulfillment', 'The organization took more than two days to confirm my order.', 6, 'Dismissed', 'AB-2026-1038', 5],
        ];
        foreach ($reports as [$id, $organization, $buyer, $reason, $details, $days, $status, $order, $decided]) {
            Report::create(['id' => $id, 'organization_id' => $org[$organization], 'user_id' => $user[$buyer], 'order_id' => $order, 'reason' => $reason, 'details' => $details, 'filed_on' => $ago($days), 'status' => $status, 'decided_on' => $decided === null ? null : $ago($decided)]);
        }

        // [minutes ago, actor, type, detail, target]
        $activity = [
            [23, 'admin@anibayan.ph', 'signin-failed', 'No account with this email'], [24, 'admin@anibayan.ph', 'signin-failed', 'No account with this email'],
            [24, 'admin@anibayan.ph', 'signin-failed', 'No account with this email'], [26, 'admin@anibayan.ph', 'signin-failed', 'No account with this email'],
            [40, 'jessa@example.com', 'signin-blocked', 'Account suspended'], [41, 'jessa@example.com', 'signin-blocked', 'Account suspended'],
            [43, 'jessa@example.com', 'signin-blocked', 'Account suspended'], [50, 'ramon@example.com', 'order-updated', '#1048 → Processing'],
            [55, 'ramon@example.com', 'signin', ''], [67, 'alex@example.com', 'order-paid', '#1048 · ₱485'],
            [68, 'alex@example.com', 'order-placed', '#1048 · ₱485 · Canubing Vegetable Growers'], [72, 'alex@example.com', 'signin', ''],
            [170, 'maria@example.com', 'order-placed', '#1047 · ₱650 · Managpi Fruit Growers'], [175, 'maria@example.com', 'password-changed', ''],
            [178, 'maria@example.com', 'signin', ''], [180, 'maria@example.com', 'signin-failed', 'Wrong password'],
            [182, 'maria@example.com', 'signin-failed', 'Wrong password'], [1500, 'edna@example.com', 'register', 'Organization application · Comunal Coconut Farmers Association'],
            [2910, 'joel@example.com', 'register', 'Organization application · Sapul Harvest Collective'], [3080, 'ramon@example.com', 'price-changed', 'Fresh carrots · ₱65 → ₱70 /kg'],
            [7395, 'admin@example.com', 'report-dismissed', 'RP-033 · Canubing Vegetable Growers'], [7500, 'daniel@example.com', 'order-cancelled', '#1042'],
            [16110, 'daniel@example.com', 'report-filed', 'RP-032 · Managpi Fruit Growers'], [18990, 'admin@example.com', 'application-declined', 'Gulod Vegetable Growers'],
            [23275, 'admin@example.com', 'report-upheld', 'RP-031 · Managpi Fruit Growers'], [24610, 'maria@example.com', 'report-filed', 'RP-031 · Managpi Fruit Growers'],
            [36260, 'admin@example.com', 'account-suspended', 'Jessa Bautista', 'jessa@example.com'],
        ];
        foreach (array_reverse($activity) as $row) {
            Activity::create(['happened_at' => now()->subMinutes($row[0]), 'actor' => $row[1], 'type' => $row[2], 'detail' => $row[3], 'target' => $row[4] ?? null]);
        }

        // [id, organization, name, barangay (always the organization's own), crops, hectares, member since, status]
        $members = [
            ['MB-001', 'Canubing Vegetable Growers', 'Ramon Dulnuan', 'Canubing I', 'Carrots, cabbage', 1.2, '2021', 'Active'],
            ['MB-002', 'Canubing Vegetable Growers', 'Josefa Baniwas', 'Canubing I', 'Potatoes, carrots', 0.8, '2021', 'Active'],
            ['MB-003', 'Canubing Vegetable Growers', 'Marlon Pocding', 'Canubing I', 'Onions, tomatoes', 1.5, '2022', 'Active'],
            ['MB-004', 'Canubing Vegetable Growers', 'Teresita Lumbag', 'Canubing I', 'Sweet potatoes', 0.6, '2023', 'Active'],
            ['MB-005', 'Canubing Vegetable Growers', 'Norma Calatan', 'Canubing I', 'Lettuce, carrots', 0.7, '2024', 'Active'],
            ['MB-006', 'Canubing Vegetable Growers', 'Alfredo Sagayo', 'Canubing I', 'Eggplants, tomatoes', 0.9, '2026', 'Pending'],
            ['MB-007', 'Managpi Fruit Growers', 'Lorna Gallego', 'Managpi', 'Carabao mangoes', 2.1, '2020', 'Active'],
            ['MB-008', 'Managpi Fruit Growers', 'Rodel Gabasa', 'Managpi', 'Mangoes, bananas', 1.4, '2022', 'Active'],
            ['MB-009', 'Bucayao Rice Farmers', 'Felipe Dizon', 'Bucayao', 'Rice', 3.5, '2019', 'Active'],
            ['MB-010', 'Bucayao Rice Farmers', 'Celia Manalo', 'Bucayao', 'Rice, corn', 2.8, '2021', 'Active'],
        ];
        foreach ($members as [$id, $organization, $name, $place, $grown, $area, $joined, $status]) {
            Member::create(['id' => $id, 'organization_id' => $org[$organization], 'name' => $name, 'place' => $place, 'crops' => $grown, 'area' => $area, 'joined' => $joined, 'status' => $status]);
        }

        // Alex's saved harvests.
        foreach (['CROP-001', 'CROP-002', 'CROP-003'] as $crop) {
            DB::table('saved_crops')->insert(['user_id' => $user['Alex Reyes'], 'crop_id' => $crop]);
        }
    }
}
