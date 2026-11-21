"use strict";
// Homepage community stories, separate from the live marketplace data. Every community is in Calapan City;
// longitude/latitude is the centre of its barangay (Philippines JSON Maps), where its map pin goes.
const previewGrowers = [
    {
        id: 'bucayao', name: 'Bucayao Rice Farmers', region: 'Bucayao',
        art: 'rice-foliage.png', artAlt: 'Rice stalks with golden grain', cropLabel: 'Rice & grains', photo: 'rice-hero.png', photoAlt: 'A rice-field scene',
        landscape: 'Rice fields', storyTitle: 'Rooted in rice-growing country.',
        story: 'Get to know the families behind a familiar part of the Filipino table. Bucayao’s rice fields connect a local harvest with everyday meals across Calapan.',
        longitude: 121.1868, latitude: 13.3079,
    },
    {
        id: 'managpi', name: 'Managpi Fruit Growers', region: 'Managpi',
        art: 'mango-cutout.png', artAlt: 'Golden mangoes with fresh green leaves', cropLabel: 'Mangoes & fruits', photo: 'mango.jpg', photoAlt: 'Golden carabao mangoes',
        landscape: 'Island harvests', storyTitle: 'An island chapter in every harvest.',
        story: 'Discover the mango and banana harvests of Managpi and the growers behind them—a little Mindoro sunshine in the story of local food.',
        longitude: 121.2005, latitude: 13.3269,
    },
    {
        id: 'canubing', name: 'Canubing Vegetable Growers', region: 'Canubing I',
        art: 'vegetable-cutout.png', artAlt: 'A woven basket of fresh vegetables', cropLabel: 'Vegetables & root crops', photo: 'grower.png', photoAlt: 'A vegetable grower at work',
        landscape: 'Vegetable gardens', storyTitle: 'Good things grow close to home.',
        story: 'Meet the growers behind familiar vegetables, from fields a short trip from the city centre. Every harvest carries a connection to the barangay it comes from.',
        longitude: 121.1346, latitude: 13.3600,
    },
];
// The edges of assets/calapan-home.svg, so a pin's longitude/latitude becomes a position on the map.
const previewMapEdges = { west: 121.0966, east: 121.293, north: 13.4388, south: 13.2935 };
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
function getElement(id) { const element = document.getElementById(id); if (!element)
    throw new Error('Missing homepage element: ' + id); return element; }
function icon(name) { return '<svg class="icon" aria-hidden="true"><use href="#' + name + '"/></svg>'; }
const video = getElement('hero-film');
const playbackButton = getElement('toggle-video');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function updatePlayback() {
    playbackButton.setAttribute('aria-label', video.paused ? 'Play background video' : 'Pause background video');
    playbackButton.setAttribute('aria-pressed', String(video.paused));
    playbackButton.innerHTML = icon(video.paused ? 'play' : 'pause');
}
video.addEventListener('play', updatePlayback);
video.addEventListener('pause', updatePlayback);
video.addEventListener('error', () => { video.removeAttribute('autoplay'); updatePlayback(); playbackButton.disabled = true; playbackButton.setAttribute('aria-label', 'Background video unavailable'); });
playbackButton.addEventListener('click', () => { if (video.paused)
    void video.play().catch(updatePlayback);
else
    video.pause(); });
if (reducedMotion.matches) {
    video.autoplay = false;
    video.pause();
}
else {
    video.autoplay = true;
    void video.play().catch(updatePlayback);
}
reducedMotion.addEventListener('change', event => { if (event.matches)
    video.pause(); });
updatePlayback();
function setupCommunityCarousel() {
    const carousel = getElement('community-carousel');
    const viewport = getElement('community-viewport');
    const track = getElement('community-track');
    const slides = Array.from(track.children);
    const count = slides.length;
    // The duplicate set follows the original at exactly one loop's distance.
    function duplicate(slide) {
        const copy = slide.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        copy.inert = true;
        return copy;
    }
    track.append(...slides.map(duplicate));
    let animation, hovered = false, focused = false, inView = false;
    function updatePlayback() {
        if (!animation)
            return;
        if (reducedMotion.matches) {
            animation.pause();
            animation.currentTime = 0;
            return;
        }
        if (hovered || focused || !inView || document.hidden)
            animation.pause();
        else
            animation.play();
    }
    function measure() {
        const oldDuration = Number(animation?.effect?.getTiming().duration) || 1;
        const phase = (Number(animation?.currentTime) || 0) % oldDuration / oldDuration;
        animation?.cancel();
        const distance = (slides[0].getBoundingClientRect().width + 24) * count;
        const duration = distance / 42 * 1000;
        animation = track.animate([{ transform: 'translate3d(0,0,0)' }, { transform: `translate3d(${-distance}px,0,0)` }], { duration, iterations: Infinity, easing: 'linear' });
        animation.currentTime = phase * duration;
        updatePlayback();
    }
    carousel.addEventListener('pointerenter', () => { hovered = true; updatePlayback(); });
    carousel.addEventListener('pointerleave', () => { hovered = false; updatePlayback(); });
    carousel.addEventListener('focusin', () => { focused = true; updatePlayback(); });
    carousel.addEventListener('focusout', event => { if (!carousel.contains(event.relatedTarget)) {
        focused = false;
        updatePlayback();
    } });
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; updatePlayback(); }, { threshold: .25 }).observe(carousel);
    document.addEventListener('visibilitychange', updatePlayback);
    reducedMotion.addEventListener('change', measure);
    new ResizeObserver(measure).observe(viewport);
    measure();
}
setupCommunityCarousel();
function setupHarvestGallery() {
    const gallery = getElement('harvest-gallery');
    const stage = gallery.querySelector('.harvest-stage');
    const tiles = Array.from(gallery.querySelectorAll('[data-gallery-tile]'));
    const copy = gallery.querySelector('.gallery-copy');
    const next = gallery.querySelector('.gallery-next');
    const storyIntro = document.querySelector('.home-intro');
    const incoming = getElement('homepage-stories').parentElement;
    const poses = [{ x: -180, y: 145, rotation: -9 }, { x: 180, y: 160, rotation: 8 }, { x: -150, y: 155, rotation: 6 }, { x: 0, y: 210, rotation: -2 }, { x: 170, y: 150, rotation: -7 }];
    let scheduled = false;
    const clamp = (value) => Math.min(1, Math.max(0, value));
    function smooth(start, end, value) {
        const progress = clamp((value - start) / (end - start));
        return progress * progress * (3 - 2 * progress);
    }
    function render() {
        scheduled = false;
        if (reducedMotion.matches) {
            for (let i = 0; i < tiles.length; i++) {
                tiles[i].style.opacity = '1';
                tiles[i].style.transform = `rotate(${poses[i].rotation}deg)`;
            }
            copy.style.opacity = '1';
            copy.style.translate = '0 0';
            next.style.opacity = '1';
            incoming.style.setProperty('--story-shift', '0px');
            incoming.style.setProperty('--gallery-stage-height', '0px');
            gallery.inert = false;
            incoming.inert = false;
            storyIntro.style.opacity = '1';
            storyIntro.style.transform = 'none';
            gallery.dataset.scrollProgress = 'static';
            return;
        }
        const bounds = gallery.getBoundingClientRect();
        const lead = innerHeight * .45;
        const travel = Math.max(1, gallery.offsetHeight - stage.offsetHeight);
        const progress = clamp((lead - bounds.top) / (travel + lead));
        const handoff = smooth(.62, 1, progress);
        gallery.dataset.scrollProgress = progress.toFixed(3);
        incoming.dataset.slideProgress = handoff.toFixed(4);
        incoming.style.setProperty('--gallery-stage-height', `${stage.offsetHeight}px`);
        // Compensate for normal document scrolling instead of adding another full
        // downward movement. The incoming edge crosses the pinned collage once.
        const flowTop = gallery.offsetTop + gallery.offsetHeight - stage.offsetHeight - window.scrollY;
        const desiredTop = (1 - handoff) * stage.offsetHeight;
        const slideOffset = progress >= 1 ? 0 : progress < .62 ? Math.max(0, desiredTop - flowTop) : desiredTop - flowTop;
        incoming.style.setProperty('--story-shift', `${slideOffset.toFixed(2)}px`);
        gallery.inert = handoff > .98;
        incoming.inert = handoff < .02;
        tiles.forEach((tile, index) => {
            const pose = poses[index];
            const enter = smooth(.025 + index * .025, .355 + index * .025, progress);
            const x = pose.x * (1 - enter);
            const y = pose.y * (1 - enter) - 65 * handoff;
            const rotation = pose.rotation + (1 - enter) * (index % 2 ? 9 : -9);
            const scale = .86 + .14 * enter - .04 * handoff;
            tile.style.opacity = enter.toFixed(4);
            tile.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        });
        const copyIn = smooth(.10, .35, progress);
        copy.style.opacity = copyIn.toFixed(4);
        copy.style.translate = `0 ${((1 - copyIn) * 34 - handoff * 55).toFixed(2)}px`;
        next.style.opacity = (smooth(.35, .48, progress) * (1 - smooth(.58, .75, progress))).toFixed(4);
        storyIntro.style.opacity = '1';
        storyIntro.style.transform = 'none';
    }
    function schedule() { if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(render);
    } }
    // Use the section's flow position: its animated visual position is moving.
    document.querySelectorAll('a[href="#homepage-stories"]').forEach(link => link.addEventListener('click', event => {
        event.preventDefault();
        window.scrollTo({ top: incoming.offsetTop, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reducedMotion.addEventListener('change', schedule);
    // Decoded local images prevent an empty tile flashing during its entrance.
    void Promise.all(Array.from(gallery.querySelectorAll('img')).map(img => img.decode().catch(() => { }))).then(schedule);
    render();
}
setupHarvestGallery();
function setupGrowingRegions() {
    const cards = getElement('region-cards'), markers = getElement('region-markers');
    cards.innerHTML = previewGrowers.map((grower, index) => '<article class="region-card"><div class="region-photo region-photo-' + index + '"><img src="assets/' + grower.art + '" alt="' + grower.artAlt + '"></div><div class="region-card-copy"><p class="eyebrow">' + grower.region + '</p><h3>' + grower.name + '</h3><p>' + grower.cropLabel + '</p><button class="text-link" data-region="' + grower.id + '" aria-pressed="' + (index === 0) + '" aria-controls="origins">Discover the community ' + icon('arrow-up') + '</button></div></article>').join('');
    const edges = previewMapEdges;
    markers.innerHTML = previewGrowers.map(grower => { const x = (grower.longitude - edges.west) / (edges.east - edges.west) * 100, y = (edges.north - grower.latitude) / (edges.north - edges.south) * 100; return '<button class="region-dot" data-region="' + grower.id + '" aria-label="Discover ' + grower.region + '" style="left:' + x + '%;top:' + y + '%"></button>'; }).join('');
    function selectRegion(id, scroll = false) {
        const grower = previewGrowers.find(item => item.id === id);
        getElement('region-kicker').textContent = grower.region + ' · ' + grower.landscape;
        getElement('region-title').textContent = grower.storyTitle;
        const harvest = getElement('origin-harvest');
        harvest.src = 'assets/' + grower.art;
        harvest.alt = grower.artAlt;
        harvest.dataset.cropRegion = grower.id;
        getElement('region-description').textContent = grower.story;
        getElement('region-organization').textContent = grower.name;
        document.querySelectorAll('[data-region]').forEach(button => { const active = button.dataset.region === id; button.setAttribute('aria-pressed', String(active)); button.classList.toggle('selected', active); });
        if (scroll)
            getElement('origins').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
    }
    document.querySelectorAll('[data-region]').forEach(button => button.addEventListener('click', () => selectRegion(button.dataset.region, true)));
    selectRegion(previewGrowers[1].id);
}
setupGrowingRegions();
const landDialog = getElement('land-story');
getElement('open-land-story').addEventListener('click', () => landDialog.showModal());
getElement('open-care-story').addEventListener('click', () => landDialog.showModal());
getElement('close-land-story').addEventListener('click', () => landDialog.close());
landDialog.addEventListener('click', event => { if (event.target === landDialog) {
    const box = landDialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)
        landDialog.close();
} });
// The header follows the account signed in on login.html: its profile picture (a representative shows the
// organization's, as in the dashboard) or initials, linking to its dashboard. The cart count is that buyer's cart.
function setupAccountLinks() {
    dashLoadStore();
    const account = dashAccountByEmail(dashSessionEmail());
    const active = account && account.status === 'Active' ? account : undefined;
    const signIn = document.querySelector('.header-actions .sign-in');
    if (signIn && active) {
        const look = active.role === 'Representative' ? dashboardOrganizations.find(o => o.name === active.organization) : active;
        const initials = active.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
        signIn.href = dashHomeFor(active);
        signIn.className = 'header-avatar';
        signIn.title = active.name;
        signIn.setAttribute('aria-label', active.name + '’s account');
        signIn.innerHTML = look?.avatar ? '<img src="' + de(look.avatar) + '" alt="">' : de(initials);
    }
    const lines = active && active.role === 'Consumer' ? (dashboardCarts[active.email] || []).length : 0;
    getElement('cart-count').textContent = String(lines);
    getElement('open-cart').setAttribute('aria-label', 'Open your cart, ' + dashPlural(lines, 'item'));
}
setupAccountLinks();
