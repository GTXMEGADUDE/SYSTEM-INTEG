"use strict";
const dashTodayDate = new Date();
const dashIsoDate = (date) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
const dashToday = dashIsoDate(dashTodayDate);
const dashDaysAgo = (days) => { const date = new Date(dashTodayDate); date.setDate(date.getDate() - days); return dashIsoDate(date); };
const dashDemoPassword = 'anibayan';
// Orders: [number, buyer, organization, crop, image, quantity, total, days ago, status, payment]
const dashboardOrders = [
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
].map(([n, customer, organization, crop, image, quantity, total, days, status, payment]) => ({ id: 'AB-2026-' + n, customer, organization, crop, image, quantity, total, date: dashDaysAgo(days), status, payment }));
const dashboardCrops = [
    { id: 'CROP-001', name: 'Carabao mangoes', organization: 'Managpi Fruit Growers', image: 'mango.jpg', price: 130, unit: 'kg', category: 'Fruits', stock: 180, status: 'Active', harvested: dashDaysAgo(3), shelfLife: 7 },
    { id: 'CROP-002', name: 'Fresh carrots', organization: 'Canubing Vegetable Growers', image: 'carrot.jpg', price: 70, unit: 'kg', category: 'Vegetables', stock: 96, status: 'Active', harvested: dashDaysAgo(2), shelfLife: 21 },
    { id: 'CROP-003', name: 'Dinorado rice', organization: 'Bucayao Rice Farmers', image: 'rice.jpg', price: 58, unit: 'kg', category: 'Rice & grains', stock: 850, status: 'Active', harvested: dashDaysAgo(19), shelfLife: 180 },
    { id: 'CROP-004', name: 'Red onions', organization: 'Canubing Vegetable Growers', image: 'onion.jpg', price: 90, unit: 'kg', category: 'Vegetables', stock: 45, status: 'Active', harvested: dashDaysAgo(11), shelfLife: 30 },
    { id: 'CROP-005', name: 'Purple eggplants', organization: 'Canubing Vegetable Growers', image: 'eggplant.jpg', price: 65, unit: 'kg', category: 'Vegetables', stock: 0, status: 'Unavailable', harvested: dashDaysAgo(9), shelfLife: 7 },
    { id: 'CROP-006', name: 'Golden bananas', organization: 'Managpi Fruit Growers', image: 'bananas.jpg', price: 55, unit: 'kg', category: 'Fruits', stock: 74, status: 'Active', harvested: dashDaysAgo(4), shelfLife: 6 },
    { id: 'CROP-007', name: 'Vine-ripened tomatoes', organization: 'Canubing Vegetable Growers', image: 'tomatoes.jpg', price: 80, unit: 'kg', category: 'Vegetables', stock: 132, status: 'Active', harvested: dashDaysAgo(1), shelfLife: 7 },
    { id: 'CROP-008', name: 'Sweet potatoes', organization: 'Canubing Vegetable Growers', image: 'sweet-potatoes.jpg', price: 45, unit: 'kg', category: 'Vegetables', stock: 28, status: 'Active', harvested: dashDaysAgo(14), shelfLife: 28 },
];
const dashboardOrganizations = [
    { name: 'Canubing Vegetable Growers', region: 'Canubing I, Calapan City', crop: 'Vegetables & root crops', image: 'grower.png', listings: 0, status: 'Active', representative: 'Ramon Dulnuan', applied: dashDaysAgo(39), members: 6, documents: ['CDA registration', 'Barangay endorsement', 'Representative ID'], approved: dashDaysAgo(34), phone: '0917 555 0110', description: 'Smallholder vegetable growers from Barangay Canubing and nearby barangays of Calapan City.' },
    { name: 'Managpi Fruit Growers', region: 'Managpi, Calapan City', crop: 'Mangoes & fruits', image: 'mango.jpg', listings: 0, status: 'Active', representative: 'Carlo Mendoza', applied: dashDaysAgo(42), members: 14, documents: ['CDA registration', 'Barangay endorsement', 'Representative ID'], approved: dashDaysAgo(38), phone: '0918 555 0122', description: 'Mango and banana growers from Barangay Managpi, Calapan City.' },
    { name: 'Bucayao Rice Farmers', region: 'Bucayao, Calapan City', crop: 'Rice & grains', image: 'rice-hero.png', listings: 0, status: 'Active', representative: 'Teodoro Pascual', applied: dashDaysAgo(46), members: 31, documents: ['CDA registration', 'Barangay endorsement', 'Representative ID'], approved: dashDaysAgo(43), phone: '0919 555 0133', description: 'Rice farming families from Barangay Bucayao, Calapan City.' },
    { name: 'Sapul Harvest Collective', region: 'Sapul, Calapan City', crop: 'Vegetables & roots', image: 'soil-story.png', listings: 0, status: 'Pending review', representative: 'Joel Malabanan', applied: dashDaysAgo(2), members: 9, documents: ['CDA registration', 'Barangay endorsement'] },
    { name: 'Comunal Coconut Farmers Association', region: 'Comunal, Calapan City', crop: 'Coconuts & root crops', image: 'seedlings-story.png', listings: 0, status: 'Pending review', representative: 'Edna Villareal', applied: dashDaysAgo(1), members: 22, documents: ['SEC registration', 'Barangay endorsement', 'Representative ID'] },
    { name: 'Gulod Vegetable Growers', region: 'Gulod, Calapan City', crop: 'Leafy vegetables', image: 'field-detail.jpg', listings: 0, status: 'Declined', representative: 'Ben Soriano', applied: dashDaysAgo(15), members: 4, documents: ['Representative ID'] },
];
const dashboardAccounts = [
    { name: 'Alex Reyes', email: 'alex@example.com', role: 'Consumer', joined: dashDaysAgo(44), lastActive: dashToday, status: 'Active', phone: '0917 555 0148', address: '12 J.P. Rizal Street, Barangay Lalud, Calapan City, Oriental Mindoro' },
    { name: 'Maria Santos', email: 'maria@example.com', role: 'Consumer', joined: dashDaysAgo(42), lastActive: dashToday, status: 'Active', phone: '0927 555 0161', address: '45 Mabini Street, Barangay Camilmil, Calapan City, Oriental Mindoro' },
    { name: 'Isabel Cruz', email: 'isabel@example.com', role: 'Consumer', joined: dashDaysAgo(40), lastActive: dashDaysAgo(1), status: 'Active', phone: '0939 555 0172', address: '8 Del Pilar Street, Barangay Suqui, Calapan City, Oriental Mindoro' },
    { name: 'Daniel Tan', email: 'daniel@example.com', role: 'Consumer', joined: dashDaysAgo(35), lastActive: dashDaysAgo(5), status: 'Active', phone: '0945 555 0183', address: '23 Luna Street, Barangay Guinobatan, Calapan City, Oriental Mindoro' },
    { name: 'Jessa Bautista', email: 'jessa@example.com', role: 'Consumer', joined: dashDaysAgo(27), lastActive: dashDaysAgo(25), status: 'Suspended', note: 'Suspended after repeated abusive messages to growers.' },
    { name: 'Ramon Dulnuan', email: 'ramon@example.com', role: 'Representative', organization: 'Canubing Vegetable Growers', joined: dashDaysAgo(39), lastActive: dashToday, status: 'Active', phone: '0917 555 0110' },
    { name: 'Carlo Mendoza', email: 'carlo@example.com', role: 'Representative', organization: 'Managpi Fruit Growers', joined: dashDaysAgo(42), lastActive: dashDaysAgo(1), status: 'Active', phone: '0918 555 0122' },
    { name: 'Teodoro Pascual', email: 'teodoro@example.com', role: 'Representative', organization: 'Bucayao Rice Farmers', joined: dashDaysAgo(46), lastActive: dashDaysAgo(2), status: 'Active', phone: '0919 555 0133' },
    { name: 'Joel Malabanan', email: 'joel@example.com', role: 'Representative', organization: 'Sapul Harvest Collective', joined: dashDaysAgo(2), lastActive: dashDaysAgo(2), status: 'Pending' },
    { name: 'Edna Villareal', email: 'edna@example.com', role: 'Representative', organization: 'Comunal Coconut Farmers Association', joined: dashDaysAgo(1), lastActive: dashDaysAgo(1), status: 'Pending' },
    { name: 'AniBayan Admin', email: 'admin@example.com', role: 'Administrator', joined: dashDaysAgo(47), lastActive: dashToday, status: 'Active' },
];
const dashboardFeedback = [
    { id: 'FB-118', organization: 'Managpi Fruit Growers', customer: 'Alex Reyes', rating: 5, comment: 'Sweet, ripe mangoes and very well packed.', date: dashDaysAgo(1), order: 'AB-2026-1045' },
    { id: 'FB-117', organization: 'Bucayao Rice Farmers', customer: 'Daniel Tan', rating: 5, comment: 'Clean grains, exactly as described.', date: dashDaysAgo(3), order: 'AB-2026-1037' },
    { id: 'FB-116', organization: 'Canubing Vegetable Growers', customer: 'Isabel Cruz', rating: 5, comment: 'Carrots were crisp and arrived quickly.', date: dashDaysAgo(1), order: 'AB-2026-1044' },
    { id: 'FB-115', organization: 'Canubing Vegetable Growers', customer: 'Carlo Mendoza', rating: 4, comment: 'Good onions; one bag was slightly bruised.', date: dashDaysAgo(6), order: 'AB-2026-1038' },
    { id: 'FB-114', organization: 'Canubing Vegetable Growers', customer: 'Isabel Cruz', rating: 5, comment: 'Sweet potatoes were fresh and well sorted.', date: dashDaysAgo(6), order: 'AB-2026-1039' },
    { id: 'FB-113', organization: 'Bucayao Rice Farmers', customer: 'Isabel Cruz', rating: 4, comment: 'Good rice. Delivery took one day longer than expected.', date: dashDaysAgo(15), order: 'AB-2026-1030' },
    { id: 'FB-112', organization: 'Managpi Fruit Growers', customer: 'Daniel Tan', rating: 3, comment: 'Tasty, but a few mangoes were overripe.', date: dashDaysAgo(11), order: 'AB-2026-1032' },
    { id: 'FB-111', organization: 'Canubing Vegetable Growers', customer: 'Maria Santos', rating: 5, comment: 'Carrots were fresh and the order was well packed.', date: dashDaysAgo(8), order: 'AB-2026-1036' },
    { id: 'FB-110', organization: 'Managpi Fruit Growers', customer: 'Isabel Cruz', rating: 4, comment: 'Lovely fruit; the order was confirmed late.', date: dashDaysAgo(9), order: 'AB-2026-1035' },
    { id: 'FB-109', organization: 'Bucayao Rice Farmers', customer: 'Carlo Mendoza', rating: 5, comment: 'Will order again.', date: dashDaysAgo(11), order: 'AB-2026-1033' },
    { id: 'FB-108', organization: 'Canubing Vegetable Growers', customer: 'Daniel Tan', rating: 4, comment: 'Fresh vegetables, fair prices.', date: dashDaysAgo(19), order: 'AB-2026-1027' },
    { id: 'FB-107', organization: 'Managpi Fruit Growers', customer: 'Maria Santos', rating: 2, comment: 'Received fewer kilos than ordered.', date: dashDaysAgo(17), order: 'AB-2026-1028' },
];
const dashboardReports = [
    { id: 'RP-031', organization: 'Managpi Fruit Growers', customer: 'Maria Santos', reason: 'Short or wrong quantity', details: 'The order weighed 3.4 kg instead of the 4 kg I paid for.', date: dashDaysAgo(17), status: 'Upheld', order: 'AB-2026-1028', decided: dashDaysAgo(16) },
    { id: 'RP-032', organization: 'Managpi Fruit Growers', customer: 'Daniel Tan', reason: 'Poor quality or spoiled', details: 'Several mangoes were overripe and bruised on arrival.', date: dashDaysAgo(11), status: 'Open', order: 'AB-2026-1032' },
    { id: 'RP-033', organization: 'Canubing Vegetable Growers', customer: 'Carlo Mendoza', reason: 'Late or no fulfillment', details: 'The organization took more than two days to confirm my order.', date: dashDaysAgo(6), status: 'Dismissed', order: 'AB-2026-1038', decided: dashDaysAgo(5) },
];
const dashboardWarnings = [];
// Activity log: [minutes ago, actor, type, detail, target]
const dashMinutesAgo = (minutes) => new Date(dashTodayDate.getTime() - minutes * 60000).toISOString();
const dashboardActivity = [
    [23, 'admin@anibayan.ph', 'signin-failed', 'No account with this email'],
    [24, 'admin@anibayan.ph', 'signin-failed', 'No account with this email'],
    [24, 'admin@anibayan.ph', 'signin-failed', 'No account with this email'],
    [26, 'admin@anibayan.ph', 'signin-failed', 'No account with this email'],
    [40, 'jessa@example.com', 'signin-blocked', 'Account suspended'],
    [41, 'jessa@example.com', 'signin-blocked', 'Account suspended'],
    [43, 'jessa@example.com', 'signin-blocked', 'Account suspended'],
    [50, 'ramon@example.com', 'order-updated', '#1048 → Processing'],
    [55, 'ramon@example.com', 'signin', ''],
    [67, 'alex@example.com', 'order-paid', '#1048 · ₱485'],
    [68, 'alex@example.com', 'order-placed', '#1048 · ₱485 · Canubing Vegetable Growers'],
    [72, 'alex@example.com', 'signin', ''],
    [170, 'maria@example.com', 'order-placed', '#1047 · ₱650 · Managpi Fruit Growers'],
    [175, 'maria@example.com', 'password-changed', ''],
    [178, 'maria@example.com', 'signin', ''],
    [180, 'maria@example.com', 'signin-failed', 'Wrong password'],
    [182, 'maria@example.com', 'signin-failed', 'Wrong password'],
    [1500, 'edna@example.com', 'register', 'Organization application · Comunal Coconut Farmers Association'],
    [2910, 'joel@example.com', 'register', 'Organization application · Sapul Harvest Collective'],
    [3080, 'ramon@example.com', 'price-changed', 'Fresh carrots · ₱65 → ₱70 /kg'],
    [7395, 'admin@example.com', 'report-dismissed', 'RP-033 · Canubing Vegetable Growers'],
    [7500, 'daniel@example.com', 'order-cancelled', '#1042'],
    [16110, 'daniel@example.com', 'report-filed', 'RP-032 · Managpi Fruit Growers'],
    [18990, 'admin@example.com', 'application-declined', 'Gulod Vegetable Growers'],
    [23275, 'admin@example.com', 'report-upheld', 'RP-031 · Managpi Fruit Growers'],
    [24610, 'maria@example.com', 'report-filed', 'RP-031 · Managpi Fruit Growers'],
    [36260, 'admin@example.com', 'account-suspended', 'Jessa Bautista', 'jessa@example.com'],
].map(([minutes, actor, type, detail, target]) => target ? { time: dashMinutesAgo(minutes), actor, type, detail, target } : { time: dashMinutesAgo(minutes), actor, type, detail });
const dashboardMembers = [
    { id: 'MB-001', organization: 'Canubing Vegetable Growers', name: 'Ramon Dulnuan', place: 'Canubing I', crops: 'Carrots, cabbage', area: 1.2, joined: '2021', status: 'Active' },
    { id: 'MB-002', organization: 'Canubing Vegetable Growers', name: 'Josefa Baniwas', place: 'Canubing II', crops: 'Potatoes, carrots', area: 0.8, joined: '2021', status: 'Active' },
    { id: 'MB-003', organization: 'Canubing Vegetable Growers', name: 'Marlon Pocding', place: 'Bayanan II', crops: 'Onions, tomatoes', area: 1.5, joined: '2022', status: 'Active' },
    { id: 'MB-004', organization: 'Canubing Vegetable Growers', name: 'Teresita Lumbag', place: 'Parang', crops: 'Sweet potatoes', area: 0.6, joined: '2023', status: 'Active' },
    { id: 'MB-005', organization: 'Canubing Vegetable Growers', name: 'Norma Calatan', place: 'Masipit', crops: 'Lettuce, carrots', area: 0.7, joined: '2024', status: 'Active' },
    { id: 'MB-006', organization: 'Canubing Vegetable Growers', name: 'Alfredo Sagayo', place: 'Lumangbayan', crops: 'Eggplants, tomatoes', area: 0.9, joined: '2026', status: 'Pending' },
    { id: 'MB-007', organization: 'Managpi Fruit Growers', name: 'Lorna Gallego', place: 'Managpi', crops: 'Carabao mangoes', area: 2.1, joined: '2020', status: 'Active' },
    { id: 'MB-008', organization: 'Managpi Fruit Growers', name: 'Rodel Gabasa', place: 'Tawiran', crops: 'Mangoes, bananas', area: 1.4, joined: '2022', status: 'Active' },
    { id: 'MB-009', organization: 'Bucayao Rice Farmers', name: 'Felipe Dizon', place: 'Bucayao', crops: 'Rice', area: 3.5, joined: '2019', status: 'Active' },
    { id: 'MB-010', organization: 'Bucayao Rice Farmers', name: 'Celia Manalo', place: 'Baruyan', crops: 'Rice, corn', area: 2.8, joined: '2021', status: 'Active' },
];
// Saved harvests and shopping carts, keyed by buyer email.
const dashboardSaved = { 'alex@example.com': ['CROP-001', 'CROP-002', 'CROP-003'] };
const dashboardCarts = {};
// Results of the admin site-health checks, oldest first; the newest 30 runs are kept.
const dashboardHealthLog = [];
// AniBayan serves Calapan City, Oriental Mindoro only. Organizations and delivery addresses pick one of its
// 62 barangays (names from Philippines JSON Maps, PSGC 2026-3q). An organization's region is "<barangay>, Calapan City".
const dashCityName = 'Calapan City';
const dashBarangays = ['Balingayan', 'Balite', 'Baruyan', 'Batino', 'Bayanan I', 'Bayanan II', 'Biga', 'Bondoc', 'Bucayao', 'Buhuan', 'Bulusan', 'Calero', 'Camansihan', 'Camilmil', 'Canubing I', 'Canubing II', 'Comunal', 'Guinobatan', 'Gulod', 'Gutad', 'Ibaba East', 'Ibaba West', 'Ilaya', 'Lalud', 'Lazareto', 'Libis', 'Lumangbayan', 'Mahal Na Pangalan', 'Maidlang', 'Malad', 'Malamig', 'Managpi', 'Masipit', 'Nag-Iba I', 'Nag-Iba II', 'Navotas', 'Pachoca', 'Palhi', 'Panggalaan', 'Parang', 'Patas', 'Personas', 'Puting Tubig', 'Salong', 'San Antonio', 'San Vicente Central', 'San Vicente East', 'San Vicente North', 'San Vicente South', 'San Vicente West', 'Sapul', 'Silonay', 'Sta. Cruz', 'Sta. Isabel', 'Sta. Maria Village', 'Sta. Rita', 'Sto. Niño', 'Suqui', 'Tawagan', 'Tawiran', 'Tibag', 'Wawa'];
// Delivery addresses: "<house and street>, Barangay <name>, Calapan City, Oriental Mindoro".
const dashJoinAddress = (street, barangay) => street + ', Barangay ' + barangay + ', ' + dashCityName + ', Oriental Mindoro';
function dashSplitAddress(address) {
    const match = /^(.*?),\s*Barangay ([^,]+),\s*Calapan City\b/i.exec(address || '');
    if (match && dashBarangays.includes(match[2].trim()))
        return { street: match[1].trim(), barangay: match[2].trim() };
    return { street: (address || '').replace(/,\s*Calapan City.*$/i, '').trim(), barangay: '' };
}
const dashBarangayOptions = (current) => '<option value="">Choose a barangay…</option>' + dashBarangays.map(b => '<option' + (b === current ? ' selected' : '') + '>' + b + '</option>').join('');
// Shared by every AniBayan page (homepage, sign-in and the three dashboards): text helpers, form helpers,
// and the browser-stored copy of the data plus the signed-in session.
const de = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dashPlural = (count, word) => count + ' ' + word + (count === 1 ? '' : 's');
const dashPhonePattern = /^(\+63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/;
/* ---------- Forms ---------- */
const dashRequired = ' <b aria-hidden="true">*</b>';
// A labelled control with an optional hint and an error slot that dashShowErrors fills.
function dashField(name, label, control, hint = '', wide = false) {
    const described = (hint ? 'hint-' + name + ' ' : '') + 'error-' + name;
    return '<div class="form-field' + (wide ? ' wide' : '') + '"><label for="field-' + name + '">' + label + '</label>' + control.replace(/^<(\w+)/, '<$1 id="field-' + name + '" name="' + name + '" aria-describedby="' + described + '"') + (hint ? '<small class="form-hint" id="hint-' + name + '">' + hint + '</small>' : '') + '<small class="field-error" id="error-' + name + '" data-error-for="' + name + '"></small></div>';
}
// Shows each message next to its field, marks the field invalid and focuses the first one. Returns true when there are no errors.
function dashShowErrors(form, errors) {
    const invalid = [];
    form.querySelectorAll('[data-error-for]').forEach(slot => {
        const name = slot.dataset.errorFor;
        const message = errors[name] || '';
        slot.textContent = message;
        form.querySelectorAll('[name="' + name + '"]').forEach(field => { if (message) {
            field.setAttribute('aria-invalid', 'true');
            invalid.push(field);
        }
        else
            field.removeAttribute('aria-invalid'); });
    });
    invalid[0]?.focus();
    return invalid.length === 0;
}
// Clears a field's error as soon as it is edited; forms are validated again on submit.
function dashClearFieldError(input) {
    const form = input.form;
    if (!form || !input.name)
        return;
    const slot = form.querySelector('[data-error-for="' + input.name + '"]');
    if (slot && slot.textContent) {
        slot.textContent = '';
        form.querySelectorAll('[name="' + input.name + '"]').forEach(field => field.removeAttribute('aria-invalid'));
    }
}
/* ---------- Browser storage: one copy of the data shared by all pages ---------- */
const dashStoreKey = 'anibayan-data-v1';
const dashSessionKey = 'anibayan-session-v1';
let dashLastSaved = '';
function dashReplaceList(target, source) { if (Array.isArray(source))
    target.splice(0, target.length, ...source); }
function dashReplaceRecord(target, source) {
    if (!source || typeof source !== 'object')
        return;
    Object.keys(target).forEach(key => delete target[key]);
    Object.assign(target, source);
}
function dashSnapshot() {
    return JSON.stringify({ orders: dashboardOrders, crops: dashboardCrops, organizations: dashboardOrganizations, accounts: dashboardAccounts, feedback: dashboardFeedback, reports: dashboardReports, warnings: dashboardWarnings, activity: dashboardActivity, members: dashboardMembers, saved: dashboardSaved, carts: dashboardCarts, healthLog: dashboardHealthLog });
}
// Replaces the starting data with the copy saved by any AniBayan page, if there is one.
function dashLoadStore() {
    let raw = null;
    try {
        raw = localStorage.getItem(dashStoreKey);
    }
    catch {
        return;
    }
    if (!raw)
        return;
    try {
        const data = JSON.parse(raw);
        dashReplaceList(dashboardOrders, data.orders);
        dashReplaceList(dashboardCrops, data.crops);
        dashReplaceList(dashboardOrganizations, data.organizations);
        dashReplaceList(dashboardAccounts, data.accounts);
        dashReplaceList(dashboardFeedback, data.feedback);
        dashReplaceList(dashboardReports, data.reports);
        dashReplaceList(dashboardWarnings, data.warnings);
        dashReplaceList(dashboardActivity, data.activity);
        dashReplaceList(dashboardMembers, data.members);
        dashReplaceList(dashboardHealthLog, data.healthLog);
        dashReplaceRecord(dashboardSaved, data.saved);
        dashReplaceRecord(dashboardCarts, data.carts);
        dashLastSaved = raw;
    }
    catch { /* unreadable copy: keep the starting data */ }
}
// Saves only when something changed, so pages listening for storage events don't echo each other.
// Returns false when the browser refused to store the data (for example, storage is full).
function dashSaveStore() {
    const json = dashSnapshot();
    if (json === dashLastSaved)
        return true;
    try {
        localStorage.setItem(dashStoreKey, json);
    }
    catch {
        return false;
    }
    dashLastSaved = json;
    return true;
}
// Adds one event to the administrators' activity log, newest first. The caller saves.
function dashLog(type, actor, detail = '', target = '') {
    dashboardActivity.unshift(target ? { time: new Date().toISOString(), actor, type, detail, target } : { time: new Date().toISOString(), actor, type, detail });
    if (dashboardActivity.length > 1000)
        dashboardActivity.length = 1000;
}
function dashResetStore() { try {
    localStorage.removeItem(dashStoreKey);
    localStorage.removeItem(dashSessionKey);
}
catch { /* nothing stored */ } }
function dashSessionEmail() { try {
    return localStorage.getItem(dashSessionKey) || '';
}
catch {
    return '';
} }
function dashSetSession(email) { try {
    localStorage.setItem(dashSessionKey, email);
}
catch { /* the session lasts for this page only */ } }
function dashClearSession() { try {
    localStorage.removeItem(dashSessionKey);
}
catch { /* nothing stored */ } }
const dashAccountByEmail = (email) => dashboardAccounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
const dashHomeFor = (account) => account.role === 'Administrator' ? 'admin.html' : account.role === 'Representative' ? 'organization.html' : 'consumer.html';
// Sign-in and create-account page (login.html). Accounts are part of the browser-stored AniBayan data the dashboards share:
// buyers can sign up and shop right away; organization representatives apply and can sign in once an administrator approves.
dashLoadStore();
const authRoot = document.getElementById('auth-content');
const authParams = new URLSearchParams(location.search);
const authEmailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
let authView = location.hash === '#register' ? 'register' : 'signin';
let authSubmitted;
const authSamples = [['alex@example.com', 'Buyer'], ['ramon@example.com', 'Canubing Vegetable Growers'], ['admin@example.com', 'Platform administrator']];
const authNotices = {
    signin: 'Sign in to continue.',
    buyer: 'Sign in with a buyer account to order, save harvests and rate growers.',
    admin: 'Sign in with an administrator account to open the admin workspace.',
    organization: 'Sign in with your organization representative account to open your workspace.',
    suspended: 'You were signed out because an AniBayan administrator suspended that account.',
    pending: 'That organization application is still being reviewed.',
    declined: 'That organization application was declined.',
};
// Where to go after signing in: back to the page that asked (when it suits the account's role), otherwise the role's home.
function authDestination(account) {
    const next = authParams.get('next') || '';
    const roles = { 'consumer.html': 'Consumer', 'organization.html': 'Representative', 'admin.html': 'Administrator' };
    return roles[next.split(/[?#]/)[0]] === account.role ? next : dashHomeFor(account);
}
const authDocuments = ['CDA or SEC registration', 'Barangay endorsement', 'Representative ID'];
const authAvatarClass = (role) => role === 'Administrator' ? 'admin-avatar' : role === 'Representative' ? 'organization-avatar' : 'consumer-avatar';
const authInitials = (name) => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
const authArrow = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14 m-5-5 5 5-5 5"/></svg>';
function authSignInView() {
    const notice = authNotices[authParams.get('notice') || ''];
    const samples = authSamples.map(([email, label]) => {
        const account = dashAccountByEmail(email);
        if (!account)
            return '';
        return '<button class="demo-account" data-sample="' + de(email) + '"><span class="avatar ' + authAvatarClass(account.role) + '">' + (account.role === 'Administrator' ? 'AD' : authInitials(account.name)) + '</span><span><strong>' + de(account.name) + '</strong><small>' + de(label) + '</small></span>' + authArrow + '</button>';
    }).join('');
    return '<form class="auth-form" id="signin-form" novalidate><h1>Welcome back</h1><p class="auth-lead">Sign in to shop fresh harvests or manage your organization.</p>' + (notice ? '<p class="auth-notice">' + notice + '</p>' : '') + '<div class="form-grid single">'
        + dashField('email', 'Email', '<input type="email" required autocomplete="email" placeholder="name@example.com">')
        + dashField('password', 'Password', '<input type="password" required autocomplete="current-password">')
        + '</div><p class="form-error" id="signin-error" role="alert" hidden></p><button type="submit" class="control primary auth-submit">Sign in</button><p class="auth-switch">New to AniBayan? <button type="button" class="text-button" data-auth-view="register">Create an account</button></p></form>'
        + '<div class="demo-accounts"><h2>Test accounts</h2><p>Each test account uses the password <strong>' + dashDemoPassword + '</strong> until it’s changed. Choose one to sign in.</p><div class="demo-list">' + samples + '</div></div>';
}
function authRegisterView() {
    const organization = authParams.get('type') === 'organization';
    const choice = (value, title, text, checked) => '<label class="choice"><input type="radio" name="type" value="' + value + '"' + (checked ? ' checked' : '') + '><span><strong>' + title + '</strong><small>' + text + '</small></span></label>';
    return '<form class="auth-form" id="register-form" novalidate><h1>Create your account</h1><p class="auth-lead">Buy fresh harvests, or apply to sell for your farmer organization.</p>'
        + '<div class="form-field auth-type"><span class="form-label" id="type-label">I want to</span><div class="choice-list two" role="radiogroup" aria-labelledby="type-label">' + choice('buyer', 'Buy harvests', 'Shop from local growing communities.', !organization) + choice('organization', 'Sell for my organization', 'An administrator reviews new organizations.', organization) + '</div></div>'
        + '<div class="form-grid">'
        + dashField('name', 'Full name' + dashRequired, '<input required maxlength="80" autocomplete="name">', '', true)
        + dashField('email', 'Email' + dashRequired, '<input type="email" required maxlength="120" autocomplete="email" placeholder="name@example.com">')
        + dashField('phone', 'Mobile number' + dashRequired, '<input type="tel" required maxlength="20" autocomplete="tel" placeholder="0917 555 0148">')
        + dashField('password', 'Password' + dashRequired, '<input type="password" required minlength="8" autocomplete="new-password">', 'At least 8 characters. Accounts are stored in this browser, so don’t reuse a password you use elsewhere.', true)
        + '</div><div class="form-grid org-fields"' + (organization ? '' : ' hidden') + '><h2 class="form-section">Your organization</h2>'
        + dashField('orgName', 'Organization name' + dashRequired, '<input required maxlength="80">', '', true)
        + dashField('barangay', 'Barangay, ' + dashCityName + dashRequired, '<select required>' + dashBarangayOptions('') + '</select>')
        + dashField('members', 'Member farmers' + dashRequired, '<input type="number" required min="1" step="1" inputmode="numeric">')
        + dashField('crops', 'Main crops' + dashRequired, '<input required maxlength="80" placeholder="e.g. Rice, calamansi">', '', true)
        + '<div class="form-field wide"><span class="form-label" id="documents-label">Documents you can submit' + dashRequired + '</span><div class="check-group" role="group" aria-labelledby="documents-label" aria-describedby="error-documents">' + authDocuments.map(d => '<label class="check-row"><input type="checkbox" name="documents" value="' + de(d) + '"> ' + de(d) + '</label>').join('') + '</div><small class="field-error" id="error-documents" data-error-for="documents"></small></div>'
        + '</div><button type="submit" class="control primary auth-submit" id="register-submit">' + (organization ? 'Submit application' : 'Create account') + '</button><p class="auth-switch">Already have an account? <button type="button" class="text-button" data-auth-view="signin">Sign in</button></p></form>';
}
function authSubmittedView() {
    const account = authSubmitted;
    return '<div class="auth-done"><svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg><h1>Application submitted</h1><p><strong>' + de(account.organization || '') + '</strong> is waiting for review. An AniBayan administrator checks your documents, then approves or declines the application.</p><p>Once it’s approved, sign in as <strong>' + de(account.email) + '</strong> to add your crop listings.</p><div class="detail-actions"><a class="control" href="index.html">Back to homepage</a><button class="control primary" data-auth-view="signin">Go to sign in</button></div></div>';
}
function authRender() {
    const current = dashAccountByEmail(dashSessionEmail());
    const banner = current && current.status === 'Active' && authView !== 'submitted' ? '<div class="auth-signed-in"><span>Signed in as <strong>' + de(current.name) + '</strong></span><a href="' + dashHomeFor(current) + '">Go to your dashboard</a><button type="button" data-auth-sign-out>Sign out</button></div>' : '';
    const tabs = authView === 'submitted' ? '' : '<div class="auth-tabs" role="tablist" aria-label="Account"><button role="tab" id="tab-signin" aria-selected="' + (authView === 'signin') + '" aria-controls="auth-panel" data-auth-view="signin">Sign in</button><button role="tab" id="tab-register" aria-selected="' + (authView === 'register') + '" aria-controls="auth-panel" data-auth-view="register">Create account</button></div>';
    authRoot.innerHTML = banner + tabs + '<div id="auth-panel" role="tabpanel" aria-labelledby="tab-' + (authView === 'register' ? 'register' : 'signin') + '">' + (authView === 'signin' ? authSignInView() : authView === 'register' ? authRegisterView() : authSubmittedView()) + '</div>';
    document.title = 'AniBayan — ' + (authView === 'signin' ? 'Sign in' : 'Create an account');
}
function authSignIn(form) {
    const data = new FormData(form);
    const email = String(data.get('email') ?? '').trim(), password = String(data.get('password') ?? '');
    const errors = {};
    if (!authEmailPattern.test(email))
        errors.email = 'Enter your email address.';
    if (!password)
        errors.password = 'Enter your password.';
    if (!dashShowErrors(form, errors))
        return;
    const error = document.getElementById('signin-error');
    const fail = (message) => { error.hidden = false; error.textContent = message; };
    const account = dashAccountByEmail(email);
    const refuse = (type, detail, message) => { dashLog(type, account ? account.email : email.toLowerCase(), detail); dashSaveStore(); fail(message); };
    if (!account) {
        refuse('signin-failed', 'No account with this email', 'The email or password is incorrect.');
        return;
    }
    if ((account.password || dashDemoPassword) !== password) {
        refuse('signin-failed', 'Wrong password', 'The email or password is incorrect.');
        return;
    }
    if (account.status === 'Suspended') {
        refuse('signin-blocked', 'Account suspended', 'This account is suspended. Contact AniBayan support if you think this is a mistake.');
        return;
    }
    if (account.status === 'Pending') {
        refuse('signin-waiting', 'Application under review', 'Your organization application is still being reviewed. You can sign in once an administrator approves it.');
        return;
    }
    if (account.status === 'Declined') {
        refuse('signin-blocked', 'Application declined', 'Your organization application was declined, so this account can’t sign in.');
        return;
    }
    if (account.status === 'Terminated') {
        refuse('signin-blocked', 'Organization terminated', 'Your organization was terminated after repeated warnings, so this account can’t sign in.');
        return;
    }
    account.lastActive = dashToday;
    dashLog('signin', account.email);
    dashSaveStore();
    dashSetSession(account.email);
    location.href = authDestination(account);
}
function authRegister(form) {
    const data = new FormData(form);
    const value = (name) => String(data.get(name) ?? '').trim();
    const organization = value('type') === 'organization';
    const errors = {};
    if (value('name').length < 3)
        errors.name = 'Enter your full name.';
    if (!authEmailPattern.test(value('email')))
        errors.email = 'Enter an email address like name@example.com.';
    else if (dashAccountByEmail(value('email')))
        errors.email = 'An account already uses this email. Sign in instead.';
    if (!dashPhonePattern.test(value('phone')))
        errors.phone = 'Enter a mobile number like 0917 555 0148.';
    if (String(data.get('password') ?? '').length < 8)
        errors.password = 'Use at least 8 characters.';
    if (organization) {
        if (value('orgName').length < 3)
            errors.orgName = 'Enter your organization’s name.';
        else if (dashboardOrganizations.some(o => o.name.toLowerCase() === value('orgName').toLowerCase()))
            errors.orgName = 'An organization with this name is already on AniBayan.';
        if (!dashBarangays.includes(value('barangay')))
            errors.barangay = 'Choose your barangay.';
        if (value('crops').length < 3)
            errors.crops = 'Enter your main crops.';
        const members = Number(value('members'));
        if (!Number.isInteger(members) || members < 1)
            errors.members = 'Enter how many farmers are members.';
        if (!data.getAll('documents').length)
            errors.documents = 'Choose at least one document you can submit.';
    }
    if (!dashShowErrors(form, errors))
        return;
    const account = { name: value('name'), email: value('email'), role: organization ? 'Representative' : 'Consumer', joined: dashToday, lastActive: dashToday, status: organization ? 'Pending' : 'Active', phone: value('phone'), password: String(data.get('password')) };
    if (organization) {
        account.organization = value('orgName');
        dashboardOrganizations.push({ name: account.organization, region: value('barangay') + ', ' + dashCityName, crop: value('crops'), image: 'field-detail.jpg', listings: 0, status: 'Pending review', representative: account.name, applied: dashToday, members: Number(value('members')), documents: data.getAll('documents').map(String), phone: account.phone });
    }
    dashboardAccounts.push(account);
    dashLog('register', account.email, organization ? 'Organization application · ' + account.organization : 'Buyer');
    dashSaveStore();
    if (!organization) {
        dashSetSession(account.email);
        const next = authDestination(account);
        location.href = next === 'consumer.html' ? 'consumer.html#shop' : next;
        return;
    }
    authSubmitted = account;
    authView = 'submitted';
    authRender();
    window.scrollTo(0, 0);
}
document.addEventListener('click', event => {
    const el = event.target.closest('button');
    if (!el)
        return;
    if (el.dataset.authView) {
        authView = el.dataset.authView === 'register' ? 'register' : 'signin';
        history.replaceState(null, '', location.pathname + location.search + (authView === 'register' ? '#register' : ''));
        authRender();
        document.querySelector('#auth-panel input')?.focus();
        return;
    }
    if (el.dataset.sample) {
        const form = document.getElementById('signin-form');
        if (!form)
            return;
        form.elements.namedItem('email').value = el.dataset.sample;
        form.elements.namedItem('password').value = dashDemoPassword;
        authSignIn(form);
        return;
    }
    if (el.hasAttribute('data-auth-sign-out')) {
        dashClearSession();
        authRender();
    }
});
document.addEventListener('input', event => {
    const input = event.target;
    dashClearFieldError(input);
    if (input.name === 'type') {
        const organization = input.value === 'organization';
        document.querySelector('.org-fields').hidden = !organization;
        document.getElementById('register-submit').textContent = organization ? 'Submit application' : 'Create account';
    }
});
document.addEventListener('submit', event => {
    const form = event.target;
    event.preventDefault();
    if (form.id === 'signin-form')
        authSignIn(form);
    else if (form.id === 'register-form')
        authRegister(form);
});
window.addEventListener('hashchange', () => { authView = location.hash === '#register' ? 'register' : 'signin'; authRender(); });
authRender();
