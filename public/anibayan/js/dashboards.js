"use strict";
// The fixed "today" of the preview data; harvest age, freshness and "new this week" are measured from this date.
const dashToday = '2026-11-08';
const dashboardOrders = [
    { id: 'AB-2026-1048', customer: 'Alex Reyes', organization: 'Benguet Highland Growers', crop: 'Highland vegetable basket', image: 'vegetable-cutout.png', quantity: '3 items', total: 485, date: '2026-11-08', status: 'Processing', payment: 'Paid' },
    { id: 'AB-2026-1047', customer: 'Maria Santos', organization: 'Guimaras Mango Farmers', crop: 'Carabao mangoes', image: 'mango.jpg', quantity: '5 kg', total: 650, date: '2026-11-08', status: 'Pending', payment: 'Unpaid' },
    { id: 'AB-2026-1046', customer: 'Carlo Mendoza', organization: 'Nueva Ecija Rice Growers', crop: 'Dinorado rice', image: 'rice.jpg', quantity: '25 kg', total: 1450, date: '2026-11-07', status: 'Confirmed', payment: 'Paid' },
    { id: 'AB-2026-1045', customer: 'Alex Reyes', organization: 'Guimaras Mango Farmers', crop: 'Carabao mangoes', image: 'mango.jpg', quantity: '2 kg', total: 260, date: '2026-11-06', status: 'Completed', payment: 'Paid' },
    { id: 'AB-2026-1044', customer: 'Isabel Cruz', organization: 'Benguet Highland Growers', crop: 'Fresh carrots', image: 'carrot.jpg', quantity: '4 kg', total: 280, date: '2026-11-06', status: 'Completed', payment: 'Paid' },
    { id: 'AB-2026-1043', customer: 'Alex Reyes', organization: 'Nueva Ecija Rice Growers', crop: 'Dinorado rice', image: 'rice.jpg', quantity: '10 kg', total: 580, date: '2026-11-04', status: 'Completed', payment: 'Paid' },
    { id: 'AB-2026-1042', customer: 'Daniel Tan', organization: 'Benguet Highland Growers', crop: 'Red onions', image: 'onion.jpg', quantity: '2 kg', total: 180, date: '2026-11-03', status: 'Cancelled', payment: 'Unpaid' },
    { id: 'AB-2026-1041', customer: 'Alex Reyes', organization: 'Benguet Highland Growers', crop: 'Fresh carrots', image: 'carrot.jpg', quantity: '2 kg', total: 140, date: '2026-11-02', status: 'Pending', payment: 'Unpaid' },
    { id: 'AB-2026-1040', customer: 'Maria Santos', organization: 'Benguet Highland Growers', crop: 'Vine-ripened tomatoes', image: 'tomatoes.jpg', quantity: '6 kg', total: 480, date: '2026-11-02', status: 'Confirmed', payment: 'Paid' },
    { id: 'AB-2026-1039', customer: 'Isabel Cruz', organization: 'Benguet Highland Growers', crop: 'Sweet potatoes', image: 'sweet-potatoes.jpg', quantity: '8 kg', total: 360, date: '2026-11-01', status: 'Completed', payment: 'Paid' },
    { id: 'AB-2026-1038', customer: 'Carlo Mendoza', organization: 'Benguet Highland Growers', crop: 'Red onions', image: 'onion.jpg', quantity: '5 kg', total: 450, date: '2026-11-01', status: 'Completed', payment: 'Paid' },
];
const dashboardCrops = [
    { id: 'CROP-001', name: 'Carabao mangoes', organization: 'Guimaras Mango Farmers', image: 'mango.jpg', price: 130, unit: 'kg', category: 'Fruits', stock: 180, status: 'Active', harvested: '2026-11-05', shelfLife: 7 },
    { id: 'CROP-002', name: 'Fresh carrots', organization: 'Benguet Highland Growers', image: 'carrot.jpg', price: 70, unit: 'kg', category: 'Vegetables', stock: 96, status: 'Active', harvested: '2026-11-06', shelfLife: 21 },
    { id: 'CROP-003', name: 'Dinorado rice', organization: 'Nueva Ecija Rice Growers', image: 'rice.jpg', price: 58, unit: 'kg', category: 'Rice & grains', stock: 850, status: 'Active', harvested: '2026-10-20', shelfLife: 180 },
    { id: 'CROP-004', name: 'Red onions', organization: 'Benguet Highland Growers', image: 'onion.jpg', price: 90, unit: 'kg', category: 'Vegetables', stock: 45, status: 'Active', harvested: '2026-10-28', shelfLife: 30 },
    { id: 'CROP-005', name: 'Purple eggplants', organization: 'Benguet Highland Growers', image: 'eggplant.jpg', price: 65, unit: 'kg', category: 'Vegetables', stock: 0, status: 'Unavailable', harvested: '2026-10-30', shelfLife: 7 },
    { id: 'CROP-006', name: 'Golden bananas', organization: 'Guimaras Mango Farmers', image: 'bananas.jpg', price: 55, unit: 'kg', category: 'Fruits', stock: 74, status: 'Active', harvested: '2026-11-04', shelfLife: 6 },
    { id: 'CROP-007', name: 'Vine-ripened tomatoes', organization: 'Benguet Highland Growers', image: 'tomatoes.jpg', price: 80, unit: 'kg', category: 'Vegetables', stock: 132, status: 'Active', harvested: '2026-11-07', shelfLife: 7 },
    { id: 'CROP-008', name: 'Sweet potatoes', organization: 'Benguet Highland Growers', image: 'sweet-potatoes.jpg', price: 45, unit: 'kg', category: 'Vegetables', stock: 28, status: 'Active', harvested: '2026-10-25', shelfLife: 28 },
];
const dashboardOrganizations = [
    { name: 'Benguet Highland Growers', region: 'Benguet, Cordillera', crop: 'Highland vegetables', image: 'grower.png', listings: 18, status: 'Active', representative: 'Ramon Dulnuan', applied: '2026-10-09', members: 6, documents: ['CDA registration', 'Barangay endorsement', 'Representative ID'] },
    { name: 'Guimaras Mango Farmers', region: 'Guimaras, Western Visayas', crop: 'Mangoes & fruits', image: 'mango.jpg', listings: 12, status: 'Active', representative: 'Carlo Mendoza', applied: '2026-10-06', members: 14, documents: ['CDA registration', 'Barangay endorsement', 'Representative ID'] },
    { name: 'Nueva Ecija Rice Growers', region: 'Nueva Ecija, Central Luzon', crop: 'Rice & grains', image: 'rice-hero.png', listings: 24, status: 'Active', representative: 'Teodoro Pascual', applied: '2026-10-02', members: 31, documents: ['CDA registration', 'Barangay endorsement', 'Representative ID'] },
    { name: 'Laguna Harvest Collective', region: 'Laguna, Calabarzon', crop: 'Vegetables & roots', image: 'soil-story.png', listings: 0, status: 'Pending review', representative: 'Joel Malabanan', applied: '2026-11-06', members: 9, documents: ['CDA registration', 'Barangay endorsement'] },
    { name: 'Quezon Coconut Farmers Association', region: 'Quezon, Calabarzon', crop: 'Coconuts & root crops', image: 'seedlings-story.png', listings: 0, status: 'Pending review', representative: 'Edna Villareal', applied: '2026-11-07', members: 22, documents: ['SEC registration', 'Barangay endorsement', 'Representative ID'] },
    { name: 'Tarlac Vegetable Growers', region: 'Tarlac, Central Luzon', crop: 'Lowland vegetables', image: 'field-detail.jpg', listings: 0, status: 'Declined', representative: 'Ben Soriano', applied: '2026-10-24', members: 4, documents: ['Representative ID'] },
];
const dashboardAccounts = [
    { name: 'Alex Reyes', email: 'alex@example.com', role: 'Consumer', joined: '2026-10-03', lastActive: '2026-11-08', status: 'Active' },
    { name: 'Maria Santos', email: 'maria@example.com', role: 'Consumer', joined: '2026-10-05', lastActive: '2026-11-08', status: 'Active' },
    { name: 'Isabel Cruz', email: 'isabel@example.com', role: 'Consumer', joined: '2026-10-07', lastActive: '2026-11-07', status: 'Active' },
    { name: 'Daniel Tan', email: 'daniel@example.com', role: 'Consumer', joined: '2026-10-12', lastActive: '2026-11-03', status: 'Active' },
    { name: 'Jessa Bautista', email: 'jessa@example.com', role: 'Consumer', joined: '2026-10-20', lastActive: '2026-10-22', status: 'Suspended', note: 'Suspended Oct 22, 2026 after repeated abusive messages to growers.' },
    { name: 'Ramon Dulnuan', email: 'ramon@example.com', role: 'Representative', organization: 'Benguet Highland Growers', joined: '2026-10-09', lastActive: '2026-11-08', status: 'Active' },
    { name: 'Carlo Mendoza', email: 'carlo@example.com', role: 'Representative', organization: 'Guimaras Mango Farmers', joined: '2026-10-06', lastActive: '2026-11-07', status: 'Active' },
    { name: 'Teodoro Pascual', email: 'teodoro@example.com', role: 'Representative', organization: 'Nueva Ecija Rice Growers', joined: '2026-10-02', lastActive: '2026-11-06', status: 'Active' },
    { name: 'Joel Malabanan', email: 'joel@example.com', role: 'Representative', organization: 'Laguna Harvest Collective', joined: '2026-11-06', lastActive: '2026-11-06', status: 'Pending' },
    { name: 'Edna Villareal', email: 'edna@example.com', role: 'Representative', organization: 'Quezon Coconut Farmers Association', joined: '2026-11-07', lastActive: '2026-11-07', status: 'Pending' },
    { name: 'AniBayan Admin', email: 'admin@example.com', role: 'Administrator', joined: '2026-10-01', lastActive: '2026-11-08', status: 'Active' },
];
const dashboardFeedback = [
    { id: 'FB-118', organization: 'Guimaras Mango Farmers', customer: 'Alex Reyes', rating: 5, comment: 'Sweet, ripe mangoes and very well packed.', date: '2026-11-07', order: 'AB-2026-1045' },
    { id: 'FB-117', organization: 'Nueva Ecija Rice Growers', customer: 'Daniel Tan', rating: 5, comment: 'Clean grains, exactly as described.', date: '2026-11-05' },
    { id: 'FB-116', organization: 'Benguet Highland Growers', customer: 'Isabel Cruz', rating: 5, comment: 'Carrots were crisp and arrived quickly.', date: '2026-11-07', order: 'AB-2026-1044' },
    { id: 'FB-115', organization: 'Benguet Highland Growers', customer: 'Carlo Mendoza', rating: 4, comment: 'Good onions; one bag was slightly bruised.', date: '2026-11-02', order: 'AB-2026-1038' },
    { id: 'FB-114', organization: 'Benguet Highland Growers', customer: 'Isabel Cruz', rating: 5, comment: 'Sweet potatoes were fresh and well sorted.', date: '2026-11-02', order: 'AB-2026-1039' },
    { id: 'FB-113', organization: 'Nueva Ecija Rice Growers', customer: 'Maria Santos', rating: 4, comment: 'Good rice. Delivery took one day longer than expected.', date: '2026-10-30' },
    { id: 'FB-112', organization: 'Guimaras Mango Farmers', customer: 'Daniel Tan', rating: 3, comment: 'Tasty, but a few mangoes were overripe.', date: '2026-10-28' },
    { id: 'FB-111', organization: 'Benguet Highland Growers', customer: 'Maria Santos', rating: 5, comment: 'Tomatoes were vine-ripe as promised.', date: '2026-10-26' },
    { id: 'FB-110', organization: 'Guimaras Mango Farmers', customer: 'Isabel Cruz', rating: 4, comment: 'Lovely fruit; the order was confirmed late.', date: '2026-10-21' },
    { id: 'FB-109', organization: 'Nueva Ecija Rice Growers', customer: 'Carlo Mendoza', rating: 5, comment: 'Will order again.', date: '2026-10-18' },
    { id: 'FB-108', organization: 'Benguet Highland Growers', customer: 'Daniel Tan', rating: 4, comment: 'Fresh vegetables, fair prices.', date: '2026-10-15' },
    { id: 'FB-107', organization: 'Guimaras Mango Farmers', customer: 'Maria Santos', rating: 2, comment: 'Received fewer kilos than ordered.', date: '2026-10-11' },
];
const dashboardReports = [
    { id: 'RP-031', organization: 'Guimaras Mango Farmers', customer: 'Maria Santos', reason: 'Short or wrong quantity', details: 'The order weighed 4.2 kg instead of the 5 kg I paid for.', date: '2026-10-11', status: 'Upheld' },
    { id: 'RP-032', organization: 'Guimaras Mango Farmers', customer: 'Daniel Tan', reason: 'Poor quality or spoiled', details: 'Several mangoes were overripe and bruised on arrival.', date: '2026-10-28', status: 'Open' },
    { id: 'RP-033', organization: 'Benguet Highland Growers', customer: 'Carlo Mendoza', reason: 'Late or no fulfillment', details: 'The organization took more than two days to confirm my order.', date: '2026-11-01', status: 'Dismissed', order: 'AB-2026-1038' },
];
// Site health for the admin preview: the last 7 days from a (fictional) uptime monitor.
const dashboardHealth = {
    checked: 'Nov 08, 2026 · 9:42 AM', uptime: '99.94%', uptimeNote: 'Last 30 days · 26 min of downtime', errorRate: '0.08%',
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], responseTimes: [198, 205, 187, 236, 412, 224, 212], errorCounts: [3, 2, 1, 4, 19, 5, 2],
};
const dashboardServices = [
    { name: 'Web application', detail: 'Pages and dashboards', status: 'Operational', latency: '184 ms', uptime: '99.98%' },
    { name: 'Database', detail: 'Accounts, listings and orders', status: 'Operational', latency: '12 ms', uptime: '100%' },
    { name: 'Authentication', detail: 'Sign-in and sessions', status: 'Operational', latency: '96 ms', uptime: '99.99%' },
    { name: 'File storage', detail: 'Product and organization photos', status: 'Operational', latency: '143 ms', uptime: '99.95%' },
    { name: 'PayMongo payments', detail: 'Payment confirmations (webhooks)', status: 'Degraded', latency: '1.8 s', uptime: '99.71%' },
    { name: 'Tawk.to live chat', detail: 'Customer support widget', status: 'Operational', latency: '', uptime: '99.90%' },
    { name: 'Email notifications', detail: 'Order and account emails', status: 'Operational', latency: '', uptime: '99.96%' },
];
const dashboardIncidents = [
    { date: '2026-11-08', title: 'Slow payment confirmations', detail: 'PayMongo webhooks are arriving up to 3 minutes late. Affected orders stay Unpaid until the confirmation arrives.', status: 'Monitoring' },
    { date: '2026-11-06', title: 'Error spike during photo uploads', detail: 'Uploads larger than 5 MB failed for 22 minutes on Friday. The size limit is now checked before upload, and uploads recovered.', status: 'Resolved' },
    { date: '2026-10-29', title: 'Scheduled database maintenance', detail: 'Planned 20-minute maintenance window. Dashboards were read-only during the update.', status: 'Resolved' },
];
// Organization dashboard preview: the signed-in representative's organization and its members.
const dashboardOrgProfile = { name: 'Benguet Highland Growers', region: 'Benguet, Cordillera', crops: 'Highland vegetables', representative: 'Ramon Dulnuan', email: 'ramon@example.com', verified: 'Verified by AniBayan · Oct 14, 2026' };
const dashboardMembers = [
    { name: 'Ramon Dulnuan', place: 'La Trinidad', crops: 'Carrots, cabbage', area: 1.2, joined: '2021', status: 'Active' },
    { name: 'Josefa Baniwas', place: 'Atok', crops: 'Potatoes, carrots', area: 0.8, joined: '2021', status: 'Active' },
    { name: 'Marlon Pocding', place: 'Buguias', crops: 'Onions, tomatoes', area: 1.5, joined: '2022', status: 'Active' },
    { name: 'Teresita Lumbag', place: 'Kibungan', crops: 'Sweet potatoes', area: 0.6, joined: '2023', status: 'Active' },
    { name: 'Norma Calatan', place: 'La Trinidad', crops: 'Lettuce, carrots', area: 0.7, joined: '2024', status: 'Active' },
    { name: 'Alfredo Sagayo', place: 'Tublay', crops: 'Eggplants, tomatoes', area: 0.9, joined: '2026', status: 'Pending' },
];
const dashboardOrgPeriods = {
    week: { label: 'Nov 02 – Nov 08, 2026', value: 28450, orders: 34, labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [3.2, 4.6, 3.1, 5.4, 4.2, 4.9, 3.05], orderValues: [4, 5, 4, 7, 5, 6, 3], valueScale: 8, orderScale: 8 },
    month: { label: 'Nov 01 – Nov 30, 2026', value: 109800, orders: 131, labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], values: [22.4, 29.1, 26.3, 32], orderValues: [27, 35, 31, 38], valueScale: 40, orderScale: 40 },
};
const dashRoleAttr = document.body.dataset.dashboard;
const dashboardRole = dashRoleAttr === 'admin' || dashRoleAttr === 'organization' ? dashRoleAttr : 'consumer';
const isAdminDashboard = dashboardRole === 'admin';
const isOrgDashboard = dashboardRole === 'organization';
const isConsumerDashboard = dashboardRole === 'consumer';
const dashOrgName = dashboardOrgProfile.name;
const dashConsumerName = 'Alex Reyes';
const dashRoot = document.getElementById('dashboard-app');
const dashDialog = document.getElementById('detail-dialog');
const dashShopDefaults = { type: 'All', min: '', max: '', harvest: 'any', location: 'All', sort: 'fresh' };
const dashState = { view: 'overview', query: '', filter: 'All', nextFilter: '', period: 'week', chart: 'value', bar: isAdminDashboard ? 4 : 3, saved: new Set(['CROP-001', 'CROP-002', 'CROP-003']), shop: { ...dashShopDefaults }, healthChecked: dashboardHealth.checked };
const dashPaths = {
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    bag: 'M5 7h14l2 14H3L5 7Z M8 8V6a4 4 0 0 1 8 0v2',
    box: 'm3 7 9-4 9 4-9 4-9-4Z M3 7v10l9 4 9-4V7 M12 11v10 M8 5l9 4',
    leaf: 'M20 3C9 2 3 7 5 14c3 7 15 4 15-11Z M5 20 16 8',
    people: 'M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M16 4a4 4 0 0 1 0 8 M23 21v-2a4 4 0 0 0-3-3.9 M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    wallet: 'M3 6h17v15H3V4h15 M15 11h6v5h-6z',
    chart: 'M4 20h17 M7 16V9 M12 16V4 M17 16v-5',
    settings: 'M9 3h6l1 3 3 1 2 5-2 2v4l-5 3-2-2-3 1-4-3v-4l-2-2 2-5 3-1 1-2Z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    help: 'M9.2 9a3 3 0 0 1 5.6 1c0 2-3 2-3 4 M12 17h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    arrow: 'M5 12h14 m-5-5 5 5-5 5', up: 'M7 17 17 7 M7 7h10v10',
    search: 'M21 21l-6-6 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
    chevron: 'm8 10 4 4 4-4', calendar: 'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16',
    download: 'M12 3v12 m-4-4 4 4 4-4 M4 17v4h16v-4',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
    pin: 'M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Z M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    check: 'm5 12 4 4L19 6', menu: 'M9 4H3v16h18V4H9v16 M5 8h1 M5 12h1',
    plus: 'M12 5v14 M5 12h14',
    store: 'M3 9l1.5-5h15L21 9 M4 9v11h16V9 M9 20v-6h6v6 M3 9h18',
    shield: 'm12 2 8 3v6c0 6-8 11-8 11S4 17 4 11V5l8-3Z m-4 9 3 3 5-6',
    clock: 'M12 7v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    home: 'm3 10 9-7 9 7 M5 9v12h14V9 M9 21v-7h6v7',
    star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3Z',
    flag: 'M5 21V4 M5 4h12l-2.5 4.5L17 13H5',
    pulse: 'M3 12h4l3-7 4 14 3-7h4',
    clipboard: 'M9 3h6v4H9z M7 5H5v16h14V5h-2 M9 13l2 2 4-4',
    lock: 'M6 11h12v10H6z M8 11V7a4 4 0 0 1 8 0v4',
};
const di = (name) => '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="' + (dashPaths[name] || dashPaths.grid) + '"/></svg>';
const de = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dp = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
const dd = (date) => new Date(date + 'T12:00:00').toLocaleDateString('en-PH', { month: 'short', day: '2-digit' });
const dfull = (date) => new Date(date + 'T12:00:00').toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric' });
const ds = (status) => '<span class="status ' + status.toLowerCase().replace(/ /g, '-') + '">' + de(status) + '</span>';
const dashPlural = (count, word) => count + ' ' + word + (count === 1 ? '' : 's');
const dashOrderNo = (id) => id.replace('AB-2026-', '#');
/* ---------- Harvest date & shelf life ---------- */
const dashDayNumber = (date) => Math.round(new Date(date + 'T12:00:00').getTime() / 864e5);
const dashAge = (date) => dashDayNumber(dashToday) - dashDayNumber(date);
function dashAddDays(date, days) {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
// age: days since harvest. left: days of shelf life remaining.
function dashFreshness(crop) {
    const age = dashAge(crop.harvested), left = crop.shelfLife - age;
    const label = left < 0 ? 'Past shelf life' : left === 0 ? 'Use today' : left <= 2 ? 'Use within ' + dashPlural(left, 'day') : left >= 60 ? 'Keeps about ' + Math.round(left / 30) + ' months' : 'Keeps ' + left + ' more days';
    return { age, left, label, tone: left < 0 ? 'past-shelf-life' : left <= 2 ? 'use-soon' : 'fresh' };
}
const dashAgeText = (age) => age <= 0 ? 'today' : age === 1 ? 'yesterday' : age + ' days ago';
const dashFreshBadge = (crop) => { const f = dashFreshness(crop); return '<span class="status ' + f.tone + '">' + f.label + '</span>'; };
const dashHarvestLine = (crop, withShelfLife = false) => { const f = dashFreshness(crop); return '<p class="harvest-line">' + di('calendar') + '<span>Harvested ' + dd(crop.harvested) + ' · ' + dashAgeText(f.age) + (withShelfLife ? ' · ' + f.label.toLowerCase() : '') + '</span></p>'; };
const dashShelfDefaults = { Vegetables: 7, Fruits: 7, 'Rice & grains': 180 };
/* ---------- Organization credit score ---------- */
// Credit score (0–100) = average buyer rating × 20, minus 10 points for every report an administrator upheld.
// Open reports don't count until they are reviewed and dismissed reports never count. Organizations without ratings are "New".
const dashReportPenalty = 10;
function dashCredit(org) {
    const ratings = dashboardFeedback.filter(f => f.organization === org).map(f => f.rating);
    const reports = dashboardReports.filter(r => r.organization === org);
    const upheld = reports.filter(r => r.status === 'Upheld').length;
    const rating = ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    const base = Math.round(rating * 20);
    const score = ratings.length ? Math.max(0, Math.min(100, base - upheld * dashReportPenalty)) : null;
    const band = score === null ? 'New' : score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'At risk';
    return { score, base, rating, reviews: ratings.length, upheld, open: reports.filter(r => r.status === 'Open').length, band, tone: band.toLowerCase().replace(/ /g, '-') };
}
function dashScoreBadge(org) {
    const c = dashCredit(org);
    return '<span class="score-badge ' + c.tone + '" title="AniBayan credit score">' + (c.score === null ? 'New · no ratings yet' : '<strong>' + c.score + '</strong>/100 · ' + c.band) + '</span>';
}
function dashRatingText(org) {
    const c = dashCredit(org);
    return c.reviews ? '<span class="rating"><b aria-hidden="true">★</b> ' + c.rating.toFixed(1) + ' <small>(' + dashPlural(c.reviews, 'review') + ')</small></span>' : '<span class="rating">No reviews yet</span>';
}
const dashStars = (rating) => '<span class="stars" role="img" aria-label="Rated ' + rating + ' out of 5">' + '★'.repeat(rating) + '<span class="stars-off">' + '★'.repeat(5 - rating) + '</span></span>';
function dashScoreExplainer(org) {
    const c = dashCredit(org);
    const ring = '<div class="score-ring ' + c.tone + '" style="--score:' + (c.score ?? 0) + '"><span><strong>' + (c.score ?? '–') + '</strong><small>' + (c.score === null ? 'New' : 'of 100') + '</small></span></div>';
    if (c.score === null)
        return '<div class="score-explainer">' + ring + '<p class="score-empty">No buyer ratings yet. The credit score appears after the first rating.</p></div>';
    return '<div class="score-explainer">' + ring + '<dl class="score-lines"><div><dt>Average rating ' + c.rating.toFixed(1) + ' ★ × 20</dt><dd>' + c.base + '</dd></div><div><dt>Upheld reports (' + c.upheld + ' × −' + dashReportPenalty + ')</dt><dd>' + (c.upheld ? '−' + c.upheld * dashReportPenalty : '0') + '</dd></div><div class="score-total"><dt>Credit score</dt><dd>' + c.score + ' · ' + c.band + '</dd></div></dl></div>';
}
const dashRated = (orderId) => dashboardFeedback.some(f => f.order === orderId);
const dashMyReport = (orderId) => dashboardReports.find(r => r.order === orderId && r.customer === dashConsumerName);
const dashRegion = (org) => dashboardOrganizations.find(o => o.name === org)?.region || '';
const dashOpenReports = () => dashboardReports.filter(r => r.status === 'Open').length;
const dashPendingApplications = () => dashboardOrganizations.filter(o => o.status === 'Pending review').length;
const dashHelpTitle = ['Help & support', 'Where to continue in the AniBayan application.'];
const dashRoles = {
    admin: {
        page: 'admin.html', workspace: 'Admin workspace', navLabel: 'Administration',
        nav: [['overview', 'grid', 'Overview'], ['accounts', 'people', 'Accounts'], ['reports', 'flag', 'User reports'], ['applications', 'clipboard', 'Applications'], ['health', 'pulse', 'Site health']],
        settingsNav: ['settings', 'settings', 'Settings'],
        user: 'AniBayan Admin', userRole: 'Platform administrator', initials: 'AD',
        search: 'Search accounts, reports, applications…',
        cardIcon: 'shield', cardTitle: 'Platform oversight', cardText: 'Accounts, user reports, organization applications and site health.',
        shortcut: ['Public homepage', 'index.html', 'home'],
        notifications: [[dashPlural(dashPendingApplications(), 'organization application') + ' awaiting review.', 'applications', 'Review applications'], [dashPlural(dashOpenReports(), 'user report') + ' waiting for your decision.', 'reports', 'Review user reports'], ['PayMongo payment confirmations are degraded.', 'health', 'View site health']],
        titles: { overview: ['Admin overview', 'Accounts, user reports, organization applications and site health.'], accounts: ['Account management', 'Consumer, representative and administrator accounts.'], reports: ['User reports', 'Reports buyers filed about organizations. Upheld reports lower the organization’s credit score.'], applications: ['Organization applications', 'Farmer organizations asking to sell on AniBayan.'], health: ['Site health', 'Uptime, response times and the status of each AniBayan service.'], settings: ['Workspace settings', 'Preferences for this admin preview.'], help: dashHelpTitle },
    },
    organization: {
        page: 'organization.html', workspace: 'Organization workspace', navLabel: 'Your organization',
        nav: [['overview', 'grid', 'Overview'], ['orders', 'bag', 'Incoming orders'], ['listings', 'box', 'My listings'], ['feedback', 'star', 'Ratings & feedback'], ['members', 'people', 'Member farmers'], ['payments', 'wallet', 'Payments']],
        settingsNav: ['settings', 'store', 'Organization profile'],
        user: dashboardOrgProfile.representative, userRole: 'Organization representative', initials: 'RD',
        search: 'Search your orders, listings, feedback…',
        cardIcon: 'leaf', cardTitle: dashOrgName, cardText: dashboardOrgProfile.region + ' · ' + dashboardOrgProfile.crops,
        shortcut: ['View public storefront', '/organizations/benguet-highland-growers', 'store'],
        notifications: [['New order #1041 from Alex Reyes is waiting for confirmation.', 'orders', 'Open incoming orders'], ['Sweet potatoes are running low: 28 kg left.', 'listings', 'Manage listings'], ['Isabel Cruz rated your carrots 5 stars.', 'feedback', 'See ratings & feedback']],
        titles: { overview: [dashOrgName, 'Orders, listings and members for your organization.'], orders: ['Incoming orders', 'Confirm, prepare and complete orders from your buyers.'], listings: ['My listings', 'The crops your organization offers. Buyers see each harvest date and shelf life.'], feedback: ['Ratings & feedback', 'What buyers say about your organization, and how your credit score is calculated.'], members: ['Member farmers', 'The growers who supply your organization.'], payments: ['Payments', 'Payment status for your organization’s orders.'], settings: ['Organization profile', 'How your organization appears on AniBayan.'], help: dashHelpTitle },
    },
    consumer: {
        page: 'consumer.html', workspace: 'My AniBayan', navLabel: 'Your account',
        nav: [['overview', 'grid', 'Overview'], ['shop', 'store', 'Shop'], ['orders', 'bag', 'My orders'], ['saved', 'heart', 'Saved harvests'], ['growers', 'leaf', 'My growers'], ['payments', 'wallet', 'Payment history']],
        settingsNav: ['settings', 'user', 'My profile'],
        user: dashConsumerName, userRole: 'Consumer account', initials: 'AR',
        search: 'Search harvests, orders and growers…',
        cardIcon: 'leaf', cardTitle: 'Good food starts here.', cardText: 'Discover fresh harvests and the communities behind them.',
        shortcut: ['Shop the harvest', '#shop', 'store'],
        notifications: [['Your vegetable basket is being prepared by Benguet Highland Growers.', 'orders', 'See my orders'], ['How was your rice from Nueva Ecija Rice Growers?', 'orders', 'Rate your order']],
        titles: { overview: ['Your harvest, at a glance.', 'Welcome back, Alex. Good things are on their way.'], shop: ['Shop the harvest', 'Filter by price, crop type, harvest time and location.'], orders: ['My orders', 'Follow each order, then rate it or report a problem.'], saved: ['Saved harvests', 'Crops you want to come back to.'], growers: ['Your growing communities', 'The organizations behind your food, with their buyer ratings and credit scores.'], payments: ['Payment history', 'Payments for your orders.'], settings: ['Your profile', 'Your account and preview preferences.'], help: dashHelpTitle },
    },
};
const dashRole = dashRoles[dashboardRole];
// Organization order workflow: current status -> [next status, action label].
const dashNextStep = { Pending: ['Confirmed', 'Confirm order'], Confirmed: ['Processing', 'Start preparing'], Processing: ['Completed', 'Mark completed'] };
function dashShell() {
    const link = (item) => '<a href="#' + item[0] + '" data-nav="' + item[0] + '" title="' + de(item[2]) + '">' + di(item[1]) + '<span>' + de(item[2]) + '</span><span class="nav-count" data-nav-count="' + item[0] + '" hidden></span></a>';
    const switcher = ['admin', 'organization', 'consumer'].map(key => {
        const r = dashRoles[key];
        const current = key === dashboardRole;
        return '<a href="' + r.page + '"' + (current ? ' aria-current="true"' : '') + '><span class="avatar ' + key + '-avatar">' + r.initials + '</span><span><strong>' + (key === 'consumer' ? 'Consumer account' : r.workspace) + '</strong><small>' + de(r.user) + '</small></span>' + (current ? di('check') : '') + '</a>';
    }).join('');
    const avatar = '<span class="avatar ' + dashboardRole + '-avatar">' + dashRole.initials + '</span>';
    const notes = dashRole.notifications.map(n => '<li><p>' + de(n[0]) + '</p><a href="#' + n[1] + '">' + n[2] + ' →</a></li>').join('');
    dashRoot.innerHTML = `<aside class="sidebar" id="sidebar"><a class="dash-brand" href="index.html" aria-label="AniBayan homepage"><svg viewBox="0 0 34 32" aria-hidden="true"><path d="M16 32V17C6 19 0 12 0 3c10 0 17 4 17 14C17 5 25 0 34 0c0 11-6 18-17 18v14Z"/></svg><strong>AniBayan.</strong></a><p class="sidebar-role"><span class="role-badge">${dashRole.workspace}</span></p><p class="nav-label">${dashRole.navLabel}</p><nav class="side-nav" aria-label="${dashRole.workspace} navigation">${dashRole.nav.map(link).join('')}</nav><p class="nav-label">General</p><nav class="side-nav" aria-label="Account and help">${link(dashRole.settingsNav) + link(['help', 'help', 'Help & support'])}</nav><div class="sidebar-foot"><div class="sidebar-card">${di(dashRole.cardIcon)}<strong>${de(dashRole.cardTitle)}</strong>${de(dashRole.cardText)}<span class="preview-label">Design preview · fictional data</span></div><div class="workspace-switch"><div class="workspace-menu" id="workspace-menu" hidden><p>Switch dashboard preview</p>${switcher}<a class="workspace-home" href="index.html">${di('home')}<span>Back to homepage</span></a></div><button class="sidebar-user" id="workspace-toggle" aria-expanded="false" aria-controls="workspace-menu" aria-label="Switch dashboard preview">${avatar}<span class="sidebar-user-copy"><strong>${de(dashRole.user)}</strong><small>${dashRole.userRole}</small></span>${di('chevron')}</button></div></div></aside><div class="sidebar-backdrop" id="sidebar-backdrop"></div><div class="workspace"><header class="topbar"><button class="icon-button collapse-button" id="collapse-sidebar" aria-label="Toggle navigation" aria-controls="sidebar">${di('menu')}</button><label class="global-search">${di('search')}<input id="dashboard-search" type="search" placeholder="${dashRole.search}" aria-label="Search current dashboard section"><kbd>/</kbd></label><span class="topbar-spacer"></span><a class="market-shortcut" href="${dashRole.shortcut[1]}">${di(dashRole.shortcut[2])}<span>${dashRole.shortcut[0]}</span>${di('up')}</a><div class="notification-wrap"><button class="icon-button notification-button" id="show-notifications" aria-label="Show notifications" aria-expanded="false" aria-controls="notification-panel">${di('bell')}<span class="notification-dot"></span></button><div class="notification-panel" id="notification-panel" hidden><h2>Notifications</h2><ul>${notes}</ul><small>Illustrative preview notifications.</small></div></div><button class="header-user" data-go="settings" aria-label="${dashRole.settingsNav[2]}">${avatar}<span><strong>${de(dashRole.user)}</strong><small>${dashRole.userRole}</small></span></button></header><main class="main-content" id="dashboard-content" tabindex="-1"></main></div>`;
}
function dashHeading() {
    const view = dashState.view;
    const [title, sub] = dashRole.titles[view];
    const exportButton = '<button class="control" id="export-dashboard">' + di('download') + 'Export CSV</button>';
    let tools = '';
    if (isConsumerDashboard)
        tools = '<span class="control static">' + di('calendar') + 'Sunday, 08 Nov 2026</span>' + (view === 'shop' ? '' : '<button class="control primary" data-go="shop">' + di('bag') + 'Shop the harvest</button>');
    else if (isAdminDashboard) {
        if (view === 'health')
            tools += '<span class="control static">' + di('clock') + 'Last checked ' + de(dashState.healthChecked) + '</span><button class="control" data-health-check>' + di('pulse') + 'Run checks</button>';
        if (['accounts', 'reports', 'applications', 'health'].includes(view))
            tools += exportButton;
    }
    else {
        if (view === 'overview')
            tools += '<select class="period-select" id="dashboard-period" aria-label="Reporting period"><option value="week" ' + (dashState.period === 'week' ? 'selected' : '') + '>Nov 02 – Nov 08, 2026</option><option value="month" ' + (dashState.period === 'month' ? 'selected' : '') + '>November 2026</option></select>';
        if (['overview', 'orders', 'listings', 'feedback', 'members', 'payments'].includes(view))
            tools += exportButton;
        if (view === 'overview' || view === 'listings')
            tools += '<button class="control primary" data-add-listing>' + di('plus') + 'Add listing</button>';
    }
    return '<div class="page-heading"><div><h1>' + de(title) + '</h1><p>' + de(sub) + '</p></div><div class="page-tools">' + tools + '</div></div>';
}
function dashMetric(label, value, icon, caption, trend = '') {
    return '<article class="metric"><div class="metric-top"><span>' + label + '</span>' + di(icon) + '</div><div class="metric-value"><strong>' + value + '</strong>' + (trend ? '<span class="trend">↗ ' + trend + '</span>' : '') + '</div><p class="metric-caption">' + caption + '</p></article>';
}
function dashPanelHead(title, note, action = '') {
    return '<div class="panel-head"><div><h2>' + title + '</h2>' + (note ? '<p>' + note + '</p>' : '') + '</div>' + action + '</div>';
}
function dashBarChart(series, labels, chip, foot) {
    const s = series.find(item => item.key === dashState.chart) || series[0];
    const bars = s.values.map((value, index) => {
        const caption = s.caption(value);
        return '<div class="chart-column"><button class="chart-bar ' + (dashState.bar === index ? 'selected' : '') + '" style="--bar-height:' + Math.min(100, Math.round(value / s.scale * 100)) + '%" data-bar="' + index + '" aria-pressed="' + (dashState.bar === index) + '" aria-label="' + labels[index] + ': ' + caption + s.suffix + '"><span>' + caption + '</span></button><span class="chart-day">' + labels[index] + '</span></div>';
    }).join('');
    return '<section class="panel">' + dashPanelHead(s.title, s.note, '<span class="chip">' + chip + '</span>') + '<div class="chart-tabs">' + series.map(item => '<button data-chart="' + item.key + '" aria-pressed="' + (item === s) + '">' + item.tab + '</button>').join('') + '</div><div class="chart-body"><div class="chart-axis">' + [1, .75, .5, .25, 0].map(part => '<span>' + s.axis(part * s.scale) + '</span>').join('') + '</div><div class="bar-chart">' + bars + '</div></div><div class="chart-foot"><span><i class="legend-dot"></i> ' + s.legend + '</span><span>' + foot + '</span></div></section>';
}
function dashChart(period, valueNote, volumeNote) {
    return dashBarChart([
        { key: 'value', tab: 'Order value', title: 'Order value', note: valueNote, legend: 'Order value', values: period.values, scale: period.valueScale, axis: value => '₱' + value + 'k', caption: value => dp(value * 1000), suffix: '' },
        { key: 'orders', tab: 'Order volume', title: 'Order activity', note: volumeNote, legend: 'Placed orders', values: period.orderValues, scale: period.orderScale, axis: value => String(value), caption: value => String(value), suffix: ' orders' },
    ], period.labels, dashState.period === 'week' ? 'This week' : 'This month', period.label);
}
function dashMatching(text) { return text.toLowerCase().includes(dashState.query.trim().toLowerCase()); }
function dashEmpty(title, description) { return '<div class="empty-state"><h2>' + title + '</h2><p>' + description + '</p></div>'; }
function dashFilters(options, summary) {
    return '<div class="filters">' + options.map(f => '<button class="filter-chip" data-filter="' + f + '" aria-pressed="' + (dashState.filter === f) + '">' + f + '</button>').join('') + '<span class="filter-summary">' + summary + '</span></div>';
}
// Orders visible to the current role, before search and status filters. Administrators don't handle orders.
function dashRoleOrders() {
    if (isAdminDashboard)
        return [];
    return dashboardOrders.filter(o => isOrgDashboard ? o.organization === dashOrgName : o.customer === dashConsumerName);
}
function dashOrders() {
    return dashRoleOrders().filter(o => dashMatching(Object.values(o).join(' ')) && (dashState.filter === 'All' || o.status === dashState.filter));
}
function dashRoleCrops() {
    return dashboardCrops.filter(c => !isOrgDashboard || c.organization === dashOrgName);
}
function dashCropStatus(crop) {
    if (crop.stock === 0)
        return 'Out of stock';
    if (crop.status !== 'Active')
        return 'Paused';
    if (dashFreshness(crop).left < 0)
        return 'Past shelf life';
    return isOrgDashboard && crop.stock < 50 ? 'Low stock' : 'Active';
}
function dashOrderTable(mode) {
    const all = dashOrders();
    const orders = mode === 'recent' ? all.slice(0, 5) : all;
    const product = (o) => '<div class="table-product"><img src="assets/' + o.image + '" alt=""><div><strong>' + de(o.crop) + '</strong><small>' + de(o.quantity) + '</small></div></div>';
    const cols = [['Order', o => '<strong>' + dashOrderNo(o.id) + '</strong>'], ['Harvest', product]];
    if (isOrgDashboard)
        cols.push(['Buyer', o => de(o.customer)]);
    cols.push(['Total', o => '<strong>' + dp(o.total) + '</strong>']);
    if (mode === 'payments')
        cols.push(['Payment', o => ds(o.payment)], ['Order status', o => ds(o.status)]);
    else
        cols.push(['Status', o => ds(o.status)]);
    cols.push(['Date', o => dd(o.date)]);
    const actions = (o) => '<div class="row-actions">' + (isOrgDashboard && mode === 'all' && dashNextStep[o.status] ? '<button class="control small" data-advance="' + o.id + '">' + dashNextStep[o.status][1] + '</button>' : '') + (isConsumerDashboard && mode === 'all' && o.status === 'Completed' && !dashRated(o.id) ? '<button class="control small" data-rate="' + o.id + '">' + di('star') + 'Rate</button>' : '') + '<button class="table-action" data-order="' + o.id + '" aria-label="View order ' + o.id + '">' + di('eye') + '</button></div>';
    const title = mode === 'payments' ? (isOrgDashboard ? 'Payments by order' : 'Your payment history') : mode === 'recent' ? (isConsumerDashboard ? 'Recent purchases' : 'Recent orders') : (isOrgDashboard ? 'Orders from your buyers' : 'Your orders');
    const head = dashPanelHead(title, '', mode === 'recent' ? '<button class="text-button" data-go="orders">View all ' + di('arrow') + '</button>' : '<span class="filter-summary">Fictional sample records</span>');
    const filters = mode === 'all' ? dashFilters(['All', 'Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled'], orders.length + (orders.length === 1 ? ' order' : ' orders')) : '';
    const table = orders.length ? '<table><thead><tr>' + cols.map(c => '<th scope="col">' + c[0] + '</th>').join('') + '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + orders.map(o => '<tr>' + cols.map(c => '<td>' + c[1](o) + '</td>').join('') + '<td>' + actions(o) + '</td></tr>').join('') + '</tbody></table>' : dashEmpty('No matching orders', 'Try another search or order status.');
    return '<section class="panel">' + head + filters + '<div class="table-wrap">' + table + '</div><div class="table-footer"><span>Showing ' + orders.length + ' of ' + dashRoleOrders().length + ' sample ' + (mode === 'payments' ? 'payments' : 'orders') + '</span></div></section>';
}
/* ---------- Admin: accounts, user reports, organization applications and site health ---------- */
const dashInitials = (name) => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
const dashAvatarClass = (role) => role === 'Administrator' ? 'admin-avatar' : role === 'Representative' ? 'organization-avatar' : 'consumer-avatar';
const dashAppStatus = (org) => org.status === 'Active' ? 'Approved' : org.status;
function dashAccountList() {
    const f = dashState.filter;
    return dashboardAccounts.filter(a => dashMatching(Object.values(a).join(' ')) && (f === 'All' || a.role === f || a.status === f));
}
function dashReportList() {
    return dashboardReports.filter(r => dashMatching(Object.values(r).join(' ')) && (dashState.filter === 'All' || r.status === dashState.filter)).sort((a, b) => b.date.localeCompare(a.date));
}
function dashApplicationList() {
    return dashboardOrganizations.filter(o => dashMatching(o.name + ' ' + o.region + ' ' + o.crop + ' ' + o.representative) && (dashState.filter === 'All' || dashAppStatus(o) === dashState.filter)).sort((a, b) => b.applied.localeCompare(a.applied));
}
function dashServiceList() { return dashboardServices.filter(s => dashMatching(s.name + ' ' + s.detail + ' ' + s.status)); }
function dashHealthChart() {
    const h = dashboardHealth;
    return dashBarChart([
        { key: 'response', tab: 'Response time', title: 'Response time', note: 'Daily average for pages and API requests, in milliseconds', legend: 'Average response time (ms)', values: h.responseTimes, scale: 500, axis: value => String(value), caption: value => value + ' ms', suffix: '' },
        { key: 'errors', tab: 'Server errors', title: 'Server errors', note: 'Failed requests (5xx) per day', legend: 'Server errors', values: h.errorCounts, scale: 20, axis: value => String(value), caption: value => String(value), suffix: ' errors' },
    ], h.labels, 'This week', 'Nov 02 – Nov 08, 2026');
}
function dashServicesPanel() {
    const services = dashServiceList();
    const ok = dashboardServices.filter(s => s.status === 'Operational').length;
    return '<section class="panel">' + dashPanelHead('Services', ok + ' of ' + dashboardServices.length + ' operational', dashState.view === 'overview' ? '<button class="icon-button" data-go="health" aria-label="View site health">' + di('up') + '</button>' : '') + '<div class="service-list">' + (services.length ? services.map(s => '<div class="service-row"><div><strong>' + de(s.name) + '</strong><small>' + [s.detail, s.latency, s.uptime + ' uptime'].filter(Boolean).map(de).join(' · ') + '</small></div>' + ds(s.status) + '</div>').join('') : dashEmpty('No matching services', 'Try another search.')) + '</div></section>';
}
function dashReportTable(limit) {
    const all = dashReportList();
    const reports = limit ? all.slice(0, limit) : all;
    const table = reports.length ? '<table><thead><tr><th scope="col">Report</th><th scope="col">Organization</th><th scope="col">Reported by</th><th scope="col">Reason</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + reports.map(r => '<tr><td><strong>' + r.id + '</strong><small class="cell-note">' + dfull(r.date) + '</small></td><td>' + de(r.organization) + '</td><td>' + de(r.customer) + '</td><td>' + de(r.reason) + '</td><td>' + ds(r.status) + '</td><td><div class="row-actions"><button class="control small' + (r.status === 'Open' ? ' primary' : '') + '" data-report-id="' + r.id + '">' + (r.status === 'Open' ? 'Review' : 'View') + '</button></div></td></tr>').join('') + '</tbody></table>' : dashEmpty('No matching reports', 'Try another search or report status.');
    const head = limit ? dashPanelHead('Latest user reports', 'Newest first', '<button class="text-button" data-go="reports">View all ' + di('arrow') + '</button>') : dashPanelHead('Reports from buyers', '', '<span class="filter-summary">Fictional sample reports</span>');
    return '<section class="panel">' + head + (limit ? '' : dashFilters(['All', 'Open', 'Upheld', 'Dismissed'], dashPlural(reports.length, 'report'))) + '<div class="table-wrap">' + table + '</div></section>';
}
function dashAdminOverview() {
    const pending = dashboardOrganizations.filter(o => o.status === 'Pending review').sort((a, b) => b.applied.localeCompare(a.applied));
    const newAccounts = dashboardAccounts.filter(a => dashAge(a.joined) < 7).length;
    const suspended = dashboardAccounts.filter(a => a.status === 'Suspended').length;
    const metrics = '<div class="metric-grid">' + dashMetric('Accounts', String(dashboardAccounts.length), 'people', '<b>' + newAccounts + ' new</b> this week · ' + suspended + ' suspended') + dashMetric('Open user reports', String(dashOpenReports()), 'flag', 'Waiting for your decision') + dashMetric('Applications to review', String(pending.length), 'clipboard', 'Organizations asking to sell') + dashMetric('Site uptime', dashboardHealth.uptime, 'pulse', dashboardHealth.uptimeNote) + '</div>';
    const applications = '<section class="panel">' + dashPanelHead('Organization applications', 'Newest first', '<button class="icon-button" data-go="applications" aria-label="View all applications">' + di('up') + '</button>') + '<div class="organization-list">' + (pending.length ? pending.map(o => '<button class="organization-row" data-organization="' + de(o.name) + '"><img src="assets/' + o.image + '" alt=""><span><strong>' + de(o.name) + '</strong><small>' + de(o.region) + ' · submitted ' + dd(o.applied) + '</small></span>' + di('arrow') + '</button>').join('') : dashEmpty('All caught up', 'No applications are waiting.')) + '</div>' + (pending.length ? '<div class="review-prompt">' + di('clock') + '<span><b>' + dashPlural(pending.length, 'application') + '</b> awaiting review</span><button data-go="applications" data-go-filter="Pending review">Review →</button></div>' : '') + '</section>';
    return metrics + '<div class="split">' + dashHealthChart() + dashServicesPanel() + '</div><div class="split">' + dashReportTable(4) + applications + '</div>';
}
function dashAccountsView() {
    const count = (test) => dashboardAccounts.filter(test).length;
    const accounts = dashAccountList();
    const metrics = '<div class="metric-grid">' + dashMetric('Total accounts', String(dashboardAccounts.length), 'people', '<b>' + count(a => dashAge(a.joined) < 7) + ' new</b> this week') + dashMetric('Consumers', String(count(a => a.role === 'Consumer')), 'user', 'Buyer accounts') + dashMetric('Representatives', String(count(a => a.role === 'Representative')), 'leaf', count(a => a.status === 'Pending') + ' waiting on an application') + dashMetric('Suspended', String(count(a => a.status === 'Suspended')), 'lock', 'Can’t sign in, order or sell') + '</div>';
    const rows = accounts.map(a => '<tr><td><div class="table-product"><span class="avatar ' + dashAvatarClass(a.role) + '">' + dashInitials(a.name) + '</span><div><strong>' + de(a.name) + '</strong><small>' + de(a.email) + '</small></div></div></td><td>' + a.role + (a.organization ? '<small class="cell-note">' + de(a.organization) + '</small>' : '') + '</td><td>' + dfull(a.joined) + '</td><td>' + dd(a.lastActive) + '</td><td>' + ds(a.status) + '</td><td><div class="row-actions"><button class="control small" data-account="' + de(a.email) + '">Manage</button></div></td></tr>').join('');
    const table = accounts.length ? '<table><thead><tr><th scope="col">Account</th><th scope="col">Role</th><th scope="col">Joined</th><th scope="col">Last active</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table>' : dashEmpty('No matching accounts', 'Try a different name, email, role or status.');
    return metrics + '<section class="panel">' + dashPanelHead('Accounts', '', '<span class="filter-summary">Fictional sample accounts</span>') + dashFilters(['All', 'Consumer', 'Representative', 'Administrator', 'Pending', 'Suspended'], dashPlural(accounts.length, 'account')) + '<div class="table-wrap">' + table + '</div></section>';
}
function dashReportsView() {
    const n = (status) => dashboardReports.filter(r => r.status === status).length;
    return '<div class="metric-grid three">' + dashMetric('Open reports', String(n('Open')), 'flag', 'Waiting for your decision') + dashMetric('Upheld', String(n('Upheld')), 'check', 'Each lowers the credit score by ' + dashReportPenalty) + dashMetric('Dismissed', String(n('Dismissed')), 'clock', 'No effect on the credit score') + '</div><p class="sample-callout">Credit score = average buyer rating × 20, minus ' + dashReportPenalty + ' points for every upheld report. Open reports don’t count until you decide.</p>' + dashReportTable(0);
}
function dashApplicationsView() {
    const n = (status) => dashboardOrganizations.filter(o => dashAppStatus(o) === status).length;
    const apps = dashApplicationList();
    const table = apps.length ? '<table><thead><tr><th scope="col">Organization</th><th scope="col">Representative</th><th scope="col">Members</th><th scope="col">Documents</th><th scope="col">Submitted</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + apps.map(o => {
        const pending = o.status === 'Pending review';
        return '<tr><td><div class="table-product"><img class="round" src="assets/' + o.image + '" alt=""><div><strong>' + de(o.name) + '</strong><small>' + de(o.region) + '</small></div></div></td><td>' + de(o.representative) + '</td><td>' + o.members + '</td><td>' + dashPlural(o.documents.length, 'file') + '</td><td>' + dfull(o.applied) + '</td><td>' + ds(dashAppStatus(o)) + '</td><td><div class="row-actions"><button class="control small' + (pending ? ' primary' : '') + '" data-organization="' + de(o.name) + '">' + (pending ? 'Review application' : 'View') + '</button></div></td></tr>';
    }).join('') + '</tbody></table>' : dashEmpty('No matching applications', 'Try a different name, place or status.');
    return '<div class="metric-grid three">' + dashMetric('Awaiting review', String(n('Pending review')), 'clock', 'Organizations asking to sell') + dashMetric('Approved', String(n('Approved')), 'check', 'Selling on AniBayan') + dashMetric('Declined', String(n('Declined')), 'flag', 'Can apply again with complete documents') + '</div><section class="panel">' + dashPanelHead('Applications', '', '<span class="filter-summary">Fictional sample applications</span>') + dashFilters(['All', 'Pending review', 'Approved', 'Declined'], dashPlural(apps.length, 'application')) + '<div class="table-wrap">' + table + '</div></section>';
}
function dashHealthView() {
    const h = dashboardHealth;
    const average = Math.round(h.responseTimes.reduce((sum, v) => sum + v, 0) / h.responseTimes.length);
    const errors = h.errorCounts.reduce((sum, v) => sum + v, 0);
    const open = dashboardIncidents.filter(i => i.status !== 'Resolved').length;
    const incidents = dashboardIncidents.filter(i => dashMatching(i.title + ' ' + i.detail + ' ' + i.status));
    const incidentPanel = '<section class="panel">' + dashPanelHead('Incidents', 'Most recent first', '<span class="filter-summary">Fictional sample incidents</span>') + '<div class="incident-list">' + (incidents.length ? incidents.map(i => '<article class="incident-row"><div class="incident-top"><strong>' + de(i.title) + '</strong>' + ds(i.status) + '</div><small>' + dfull(i.date) + '</small><p>' + de(i.detail) + '</p></article>').join('') : dashEmpty('No matching incidents', 'Try another search.')) + '</div></section>';
    return '<div class="metric-grid">' + dashMetric('Uptime', h.uptime, 'pulse', h.uptimeNote) + dashMetric('Average response', average + ' ms', 'clock', 'This week · target under 300 ms') + dashMetric('Error rate', h.errorRate, 'flag', errors + ' server errors this week') + dashMetric('Open incidents', String(open), 'bell', open ? 'Being monitored' : 'All clear') + '</div><div class="split">' + dashHealthChart() + dashServicesPanel() + '</div>' + incidentPanel;
}
/* ---------- Organization: one farmer organization's own workspace ---------- */
function dashOrgOverview() {
    const p = dashboardOrgPeriods[dashState.period];
    const orders = dashRoleOrders();
    const crops = dashRoleCrops();
    const open = orders.filter(o => dashNextStep[o.status]);
    const metrics = '<div class="metric-grid">' + dashMetric('Order value', dp(p.value), 'wallet', 'Placed with your organization', '9.4%') + dashMetric('Orders received', String(p.orders), 'bag', dashState.period === 'week' ? 'This week' : 'This month', '6.3%') + dashMetric('Orders to fulfil', String(open.length), 'clock', 'Waiting on your next step') + dashMetric('Active listings', String(crops.filter(c => c.status === 'Active' && c.stock > 0).length), 'box', crops.length + ' listings in total') + '</div>';
    const queue = '<section class="panel">' + dashPanelHead('Needs your action', 'Orders waiting on your next step', '<button class="text-button" data-go="orders">All orders ' + di('arrow') + '</button>') + '<div class="queue">' + (open.length ? open.slice(0, 4).map(o => '<div class="queue-row"><img src="assets/' + o.image + '" alt=""><div><strong>' + de(o.crop) + ' · ' + de(o.quantity) + '</strong><small>' + dashOrderNo(o.id) + ' · ' + de(o.customer) + ' · ' + dp(o.total) + '</small><div class="queue-actions">' + ds(o.status) + '<button class="control small primary" data-advance="' + o.id + '">' + dashNextStep[o.status][1] + '</button></div></div></div>').join('') : dashEmpty('All caught up', 'No orders are waiting on you.')) + '</div></section>';
    const stock = '<section class="panel">' + dashPanelHead('Stock watch', 'Lowest stock first', '<button class="text-button" data-go="listings">Manage ' + di('arrow') + '</button>') + '<div class="stock-list">' + crops.slice().sort((a, b) => a.stock - b.stock).slice(0, 4).map(c => '<div class="stock-row"><img src="assets/' + c.image + '" alt=""><div><div class="stock-row-top"><strong>' + de(c.name) + '</strong>' + ds(dashCropStatus(c)) + '</div><div class="meter" role="img" aria-label="' + c.stock + ' ' + c.unit + ' available"><i style="width:' + Math.min(100, Math.round(c.stock / 150 * 100)) + '%"></i></div><small>' + c.stock + ' ' + c.unit + ' available</small></div></div>').join('') + '</div></section>';
    return metrics + '<div class="split">' + dashChart(p, 'Placed order totals for your organization', 'Orders placed with your organization') + queue + '</div><div class="split">' + dashOrderTable('recent') + stock + '</div>';
}
function dashListingCrops() { return dashRoleCrops().filter(c => dashMatching(c.name + ' ' + c.organization + ' ' + c.category)); }
function dashListingTile(c) {
    return '<article class="product-tile"><img src="assets/' + c.image + '" alt="' + de(c.name) + '"><div class="product-tile-copy"><div class="product-tile-head"><h2>' + de(c.name) + '</h2>' + ds(dashCropStatus(c)) + '</div><p>' + de(c.category) + ' · ' + c.id + '</p><div class="product-price"><strong>' + dp(c.price) + '</strong> / ' + de(c.unit) + '</div>' + dashHarvestLine(c, true) + '<div class="product-bottom"><small>' + c.stock + ' ' + de(c.unit) + ' available</small><span class="row-actions"><button class="control small" data-toggle-listing="' + c.id + '"' + (c.stock === 0 ? ' disabled' : '') + '>' + (c.status === 'Active' ? 'Pause' : 'Resume') + '</button><button class="control small primary" data-product="' + c.id + '">Details</button></span></div></div></article>';
}
function dashListingGrid() {
    const crops = dashListingCrops();
    return crops.length ? '<div class="product-grid">' + crops.map(dashListingTile).join('') + '</div>' : '<section class="panel">' + dashEmpty('No matching listings.', 'Try a different search.') + '</section>';
}
function dashOrgFeedbackList() {
    return dashboardFeedback.filter(f => f.organization === dashOrgName && dashMatching(f.customer + ' ' + f.comment + ' ' + f.rating)).sort((a, b) => b.date.localeCompare(a.date));
}
function dashFeedbackRow(f) {
    return '<article class="feedback-row"><header>' + dashStars(f.rating) + '<small>' + dd(f.date) + '</small></header><p>' + (f.comment ? '“' + de(f.comment) + '”' : 'No comment left.') + '</p><small>' + de(f.customer) + (f.order ? ' · order ' + dashOrderNo(f.order) : '') + '</small></article>';
}
function dashOrgFeedback() {
    const c = dashCredit(dashOrgName);
    const feedback = dashOrgFeedbackList();
    const reports = dashboardReports.filter(r => r.organization === dashOrgName).sort((a, b) => b.date.localeCompare(a.date));
    const metrics = '<div class="metric-grid">' + dashMetric('Credit score', c.score === null ? 'New' : c.score + '<small class="metric-unit">/100</small>', 'shield', c.score === null ? 'Appears after your first rating' : c.band + ' standing with buyers') + dashMetric('Average rating', c.reviews ? c.rating.toFixed(1) + ' ★' : '–', 'star', 'From ' + dashPlural(c.reviews, 'buyer review')) + dashMetric('Reports under review', String(c.open), 'clock', 'Not counted until an administrator decides') + dashMetric('Upheld reports', String(c.upheld), 'flag', '−' + dashReportPenalty + ' points each') + '</div>';
    const list = '<section class="panel">' + dashPanelHead('Buyer feedback', 'Newest first', '<span class="filter-summary">' + dashPlural(feedback.length, 'review') + '</span>') + '<div class="feedback-list">' + (feedback.length ? feedback.map(dashFeedbackRow).join('') : dashEmpty('No matching feedback', 'Try a different search.')) + '</div></section>';
    const explainer = '<section class="panel">' + dashPanelHead('How your credit score works', '') + dashScoreExplainer(dashOrgName) + '<p class="score-help">Buyers rate completed orders from 1 to 5 stars. Reports go to AniBayan administrators first: only upheld reports lower your score, and dismissed reports never count.</p></section>';
    const table = reports.length ? '<table><thead><tr><th scope="col">Report</th><th scope="col">Reason</th><th scope="col">Details</th><th scope="col">Status</th></tr></thead><tbody>' + reports.map(r => '<tr><td><strong>' + r.id + '</strong><small class="cell-note">' + dfull(r.date) + '</small></td><td>' + de(r.reason) + '</td><td class="wrap">' + de(r.details) + '</td><td>' + ds(r.status) + '</td></tr>').join('') + '</tbody></table>' : dashEmpty('No reports', 'Buyers haven’t reported a problem with your organization.');
    return metrics + '<div class="split">' + list + explainer + '</div><section class="panel">' + dashPanelHead('Reports about your organization', 'Reviewed by AniBayan administrators') + '<div class="table-wrap">' + table + '</div></section>';
}
function dashMembers() {
    const members = dashboardMembers.filter(m => dashMatching(Object.values(m).join(' ')));
    const area = dashboardMembers.reduce((sum, m) => sum + m.area, 0);
    return '<div class="metric-grid three">' + dashMetric('Member farmers', String(dashboardMembers.length), 'people', 'Growers supplying your organization') + dashMetric('Farmed area', area.toFixed(1) + ' ha', 'pin', 'Across all member farms') + dashMetric('Pending membership', String(dashboardMembers.filter(m => m.status === 'Pending').length), 'clock', 'Awaiting your confirmation') + '</div><section class="panel">' + dashPanelHead('Members', '', '<span class="filter-summary">' + members.length + ' sample members</span>') + '<div class="table-wrap">' + (members.length ? '<table><thead><tr><th scope="col">Farmer</th><th scope="col">Location</th><th scope="col">Crops</th><th scope="col">Area</th><th scope="col">Member since</th><th scope="col">Status</th></tr></thead><tbody>' + members.map(m => '<tr><td><div class="table-product"><span class="avatar organization-avatar">' + m.name.split(' ').map(n => n[0]).join('') + '</span><strong>' + de(m.name) + '</strong></div></td><td>' + de(m.place) + ', Benguet</td><td>' + de(m.crops) + '</td><td>' + m.area.toFixed(1) + ' ha</td><td>' + m.joined + '</td><td>' + ds(m.status) + '</td></tr>').join('') + '</tbody></table>' : dashEmpty('No matching members', 'Try a different name, place or crop.')) + '</div></section>';
}
function dashOrgPayments() {
    const orders = dashRoleOrders().filter(o => o.status !== 'Cancelled');
    const sum = (payment) => orders.filter(o => o.payment === payment).reduce((total, o) => total + o.total, 0);
    return '<div class="metric-grid three">' + dashMetric('Paid orders', dp(sum('Paid')), 'check', orders.filter(o => o.payment === 'Paid').length + ' sample orders paid') + dashMetric('Awaiting payment', dp(sum('Unpaid')), 'clock', orders.filter(o => o.payment === 'Unpaid').length + ' sample orders unpaid') + dashMetric('Open orders', String(orders.filter(o => o.status !== 'Completed').length), 'bag', 'Not yet completed') + '</div>' + dashOrderTable('payments');
}
/* ---------- Consumer: shop with filters, saved harvests and growers ---------- */
const dashIsBuyable = (crop) => crop.status === 'Active' && crop.stock > 0 && dashFreshness(crop).left >= 0;
const dashShopCrops = () => dashboardCrops.filter(dashIsBuyable);
const dashShopSorts = {
    fresh: ['Freshest harvest first', (a, b) => dashFreshness(a).age - dashFreshness(b).age],
    'price-asc': ['Price: low to high', (a, b) => a.price - b.price],
    'price-desc': ['Price: high to low', (a, b) => b.price - a.price],
    score: ['Highest credit score', (a, b) => (dashCredit(b.organization).score ?? -1) - (dashCredit(a.organization).score ?? -1)],
    shelf: ['Longest shelf life left', (a, b) => dashFreshness(b).left - dashFreshness(a).left],
};
const dashHarvestWindows = [['any', 'Any harvest date'], ['3', 'Harvested in the last 3 days'], ['7', 'Harvested in the last 7 days'], ['30', 'Harvested in the last 30 days']];
function dashPriceBounds() {
    const read = (value) => value.trim() === '' || !Number.isFinite(Number(value)) ? null : Number(value);
    return [read(dashState.shop.min), read(dashState.shop.max)];
}
function dashShopList() {
    const s = dashState.shop;
    const [min, max] = dashPriceBounds();
    return dashShopCrops().filter(c => dashMatching(c.name + ' ' + c.organization + ' ' + c.category + ' ' + dashRegion(c.organization))
        && (s.type === 'All' || c.category === s.type)
        && (min === null || c.price >= min) && (max === null || c.price <= max)
        && (s.harvest === 'any' || dashFreshness(c).age <= Number(s.harvest))
        && (s.location === 'All' || dashRegion(c.organization) === s.location))
        .sort((dashShopSorts[s.sort] || dashShopSorts.fresh)[1]);
}
function dashConsumerTile(c) {
    const saved = dashState.saved.has(c.id);
    const badge = dashIsBuyable(c) ? dashFreshBadge(c) : ds(c.stock === 0 ? 'Out of stock' : c.status !== 'Active' ? 'Paused' : 'Past shelf life');
    return '<article class="product-tile"><img src="assets/' + c.image + '" alt="' + de(c.name) + '"><div class="product-tile-copy"><div class="product-tile-head"><h2>' + de(c.name) + '</h2><button class="save-button" data-save="' + c.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? 'Unsave ' : 'Save ') + de(c.name) + '">' + di('heart') + '</button></div><p>' + de(c.organization) + ' · ' + dashRatingText(c.organization) + '<br>' + de(c.category) + ' · ' + de(dashRegion(c.organization)) + '</p><div class="product-price"><strong>' + dp(c.price) + '</strong> / ' + de(c.unit) + '</div>' + dashHarvestLine(c) + '<div class="product-bottom">' + badge + '<button class="control small primary" data-product="' + c.id + '">View harvest ' + di('arrow') + '</button></div></div></article>';
}
const dashShopSummary = (shown) => shown + ' of ' + dashPlural(dashShopCrops().length, 'harvest');
function dashShopGrid(crops) {
    if (crops.length)
        return '<div class="product-grid">' + crops.map(dashConsumerTile).join('') + '</div>';
    const [min, max] = dashPriceBounds();
    const reversed = min !== null && max !== null && min > max;
    return '<section class="panel">' + dashEmpty(reversed ? 'The minimum price is higher than the maximum.' : 'No harvests match these filters.', reversed ? 'Swap the two prices or clear one of them.' : 'Try a wider price range, another crop type, harvest time or location.') + '<div class="empty-action"><button class="control" data-shop-reset>Clear filters</button></div></section>';
}
function dashShop() {
    const s = dashState.shop;
    const crops = dashShopList();
    const prices = dashShopCrops().map(c => c.price);
    const opt = (value, label, current) => '<option value="' + de(value) + '"' + (value === current ? ' selected' : '') + '>' + de(label) + '</option>';
    const types = [...new Set(dashboardCrops.map(c => c.category))].sort();
    const regions = [...new Set(dashboardOrganizations.filter(o => o.status === 'Active').map(o => o.region))].sort();
    const price = (key, label, bound) => '<input type="number" min="0" step="1" inputmode="numeric" data-shop="' + key + '" value="' + de(s[key]) + '" placeholder="' + label + ' ' + bound + '" aria-label="' + (key === 'min' ? 'Minimum' : 'Maximum') + ' price in pesos">';
    return '<section class="panel shop-filters" aria-label="Filter harvests"><div class="shop-filter-grid">'
        + '<label class="shop-field"><span>Crop type</span><select data-shop="type">' + opt('All', 'All crop types', s.type) + types.map(t => opt(t, t, s.type)).join('') + '</select></label>'
        + '<div class="shop-field" role="group" aria-labelledby="shop-price-label"><span id="shop-price-label">Price per unit (₱)</span><div class="price-inputs">' + price('min', 'Min', prices.length ? Math.min(...prices) : 0) + '<span aria-hidden="true">–</span>' + price('max', 'Max', prices.length ? Math.max(...prices) : 0) + '</div></div>'
        + '<label class="shop-field"><span>Harvest time</span><select data-shop="harvest">' + dashHarvestWindows.map(w => opt(w[0], w[1], s.harvest)).join('') + '</select></label>'
        + '<label class="shop-field"><span>Location</span><select data-shop="location">' + opt('All', 'All locations', s.location) + regions.map(r => opt(r, r, s.location)).join('') + '</select></label>'
        + '<label class="shop-field"><span>Sort by</span><select data-shop="sort">' + Object.keys(dashShopSorts).map(k => opt(k, dashShopSorts[k][0], s.sort)).join('') + '</select></label>'
        + '</div><div class="shop-filter-foot"><span class="filter-summary" id="shop-summary" aria-live="polite">' + dashShopSummary(crops.length) + '</span><button class="text-button" data-shop-reset>Clear filters</button></div></section><div id="shop-results">' + dashShopGrid(crops) + '</div>';
}
// Typing in a price box re-renders only the results, so the field keeps focus.
function dashRefreshShop() {
    const results = document.getElementById('shop-results');
    if (!results)
        return;
    const crops = dashShopList();
    results.innerHTML = dashShopGrid(crops);
    document.getElementById('shop-summary').textContent = dashShopSummary(crops.length);
}
function dashSavedView() {
    const crops = dashboardCrops.filter(c => dashState.saved.has(c.id) && dashMatching(c.name + ' ' + c.organization + ' ' + c.category));
    return '<div class="filters bare"><button class="text-button" data-go="shop">Browse the shop ' + di('arrow') + '</button><span class="filter-summary">' + dashPlural(dashState.saved.size, 'saved harvest') + '</span></div>' + (crops.length ? '<div class="product-grid">' + crops.map(dashConsumerTile).join('') + '</div>' : '<section class="panel">' + dashEmpty('No saved harvests here yet.', 'Save a harvest from the shop to see it here.') + '</section>');
}
function dashOrganizationGrid() {
    const orgs = dashboardOrganizations.filter(o => o.status === 'Active' && dashMatching(o.name + ' ' + o.region));
    return orgs.length ? '<div class="org-grid">' + orgs.map(o => '<article class="org-card"><img src="assets/' + o.image + '" alt="Illustrative ' + de(o.crop) + '"><div><h2>' + de(o.name) + '</h2><p>' + de(o.region) + ' · ' + de(o.crop) + '</p><p class="org-score">' + dashScoreBadge(o.name) + dashRatingText(o.name) + '</p><footer><span class="filter-summary">' + o.listings + ' listings</span><button class="control" data-organization="' + de(o.name) + '">View community ' + di('up') + '</button></footer></div></article>').join('') + '</div>' : '<section class="panel">' + dashEmpty('No matching communities', 'Try a different place or name.') + '</section>';
}
function dashActiveOrder() {
    const order = dashboardOrders[0];
    return '<section class="panel">' + dashPanelHead('Your harvest is coming together.', '', '<span class="filter-summary">#1048</span>') + '<div class="active-order"><div class="active-order-top"><img src="assets/vegetable-cutout.png" alt="Vegetable basket"><div><h3>Highland vegetable basket</h3><p>Benguet Highland Growers · 3 items</p></div>' + ds('Processing') + '</div><div class="order-progress">' + ['Placed', 'Confirmed', 'Preparing', 'Completed'].map((s, i) => '<div class="progress-step ' + (i < 2 ? 'done' : i === 2 ? 'current' : '') + '"><i></i>' + s + '</div>').join('') + '</div><div class="active-order-foot"><p>Good things take a little care.<br>Your grower is preparing your order.</p><button class="control primary" data-order="' + order.id + '">View order ' + di('arrow') + '</button></div></div></section>';
}
function dashConsumerOverview() {
    const own = dashRoleOrders();
    return '<section class="consumer-banner"><div class="eyebrow">Rooted in community. Grown for you.</div><h2>Fresh from their fields.<br>A little closer to your table.</h2><p>Meet the people behind your everyday food.</p><button class="control primary" data-go="shop">Explore the harvest ' + di('arrow') + '</button><img class="banner-harvest" src="assets/vegetable-cutout.png" alt=""><img class="banner-leaf" src="assets/mango-branch.png" alt=""></section><div class="metric-grid">' + dashMetric('Active orders', String(own.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length), 'bag', 'Being prepared by your growers') + dashMetric('Completed orders', String(own.filter(o => o.status === 'Completed').length), 'check', 'Local harvests brought home') + dashMetric('Saved harvests', String(dashState.saved.size), 'heart', 'Good things to come back to') + dashMetric('Growing connections', '3', 'leaf', 'Communities you’ve ordered from') + '</div><div class="split">' + dashActiveOrder() + '<section class="panel grower-mini"><img src="assets/grower.png" alt="Illustrative grower in the highlands"><div class="grower-mini-copy"><small>The people behind your harvest</small><h2>Rooted in the<br>Benguet highlands.</h2><a href="#growers">Meet your growing community ' + di('up') + '</a></div></section></div><div class="split">' + dashOrderTable('recent') + '<section class="panel">' + dashPanelHead('Saved for later', '', '<button class="text-button" data-go="saved">View all ' + di('arrow') + '</button>') + '<div class="saved-mini">' + dashboardCrops.filter(c => dashState.saved.has(c.id)).slice(0, 4).map(c => '<div class="saved-row"><img src="assets/' + c.image + '" alt=""><div><strong>' + de(c.name) + '</strong><p>' + dp(c.price) + ' / ' + c.unit + ' · harvested ' + dd(c.harvested) + '</p></div><button class="save-button" data-save="' + c.id + '" aria-pressed="true" aria-label="Unsave ' + de(c.name) + '">' + di('heart') + '</button></div>').join('') + (dashState.saved.size ? '' : dashEmpty('Nothing saved yet', 'Your saved harvests will appear here.')) + '</div></section></div>';
}
function dashSettings() {
    const appearance = '<section class="panel settings-panel"><h2>Appearance</h2><p>Adjust this preview to your preferred reading density.</p><div class="settings-row"><label for="density">Compact table rows</label><input type="checkbox" id="density" ' + (document.body.classList.contains('compact-density') ? 'checked' : '') + '></div><div class="settings-row"><label for="contrast">Stronger contrast</label><input type="checkbox" id="contrast" ' + (document.body.classList.contains('contrast-mode') ? 'checked' : '') + '></div><p>Appearance preferences apply only to this open preview.</p></section>';
    const facts = (rows) => '<dl class="detail-facts">' + rows.map(r => '<div><dt>' + r[0] + '</dt><dd>' + de(r[1]) + '</dd></div>').join('') + '</dl>';
    const o = dashboardOrgProfile;
    const credit = dashCredit(o.name);
    const account = isAdminDashboard
        ? '<section class="panel settings-panel"><h2>Administrator access</h2><p>This is a visual preview with fictional platform data. Production administrator access remains protected by the application’s existing role checks.</p><div class="detail-actions"><a class="control primary" href="/admin/settings">Open application settings ' + di('up') + '</a></div></section>'
        : isOrgDashboard
            ? '<section class="panel settings-panel"><h2>' + de(o.name) + '</h2><p>' + ds('Active') + ' &nbsp;' + de(o.verified) + '</p>' + facts([['Region', o.region], ['Main crops', o.crops], ['Representative', o.representative], ['Contact email', o.email], ['Credit score', credit.score === null ? 'New · no ratings yet' : credit.score + '/100 · ' + credit.band], ['Buyer rating', credit.reviews ? credit.rating.toFixed(1) + ' ★ from ' + dashPlural(credit.reviews, 'review') : 'No reviews yet']]) + '<div class="detail-actions"><a class="control" href="/organizations/benguet-highland-growers">View storefront ' + di('up') + '</a><a class="control primary" href="/organization/profile">Edit in application ' + di('up') + '</a></div></section>'
            : '<section class="panel settings-panel"><h2>Your account</h2>' + facts([['Name', dashConsumerName], ['Email', 'alex@example.com'], ['Account type', 'Consumer'], ['Member since', 'October 2026']]) + '<div class="detail-actions"><a class="control primary" href="/profile">Manage profile in application ' + di('up') + '</a></div></section>';
    return '<div class="settings-grid">' + account + appearance + '</div><p class="sample-callout">The preview does not modify any account, order, payment or organization.</p>';
}
function dashHelp() {
    const rows = isAdminDashboard ? [['Manage user accounts', '/admin/accounts', 'Accounts'], ['Review user reports', '/admin/reports', 'User reports'], ['Review organization applications', '/admin/applications', 'Applications'], ['Check site health', '/admin/health', 'Site health']]
        : isOrgDashboard ? [['Manage incoming orders', '/organization/orders', 'Orders'], ['Add or edit crop listings', '/organization/listings', 'Listings'], ['Update your organization profile', '/organization/profile', 'Profile']]
            : [['Browse crops and growing communities', '/products', 'Marketplace'], ['Review your orders and their progress', '/orders', 'Orders'], ['Manage your account', '/profile', 'Your profile']];
    return '<section class="panel settings-panel"><h2>Here to help you grow.</h2><p>Find the right place to continue in the AniBayan application.</p>' + rows.map(r => '<div class="settings-row"><span>' + r[0] + '</span><a class="control" href="' + r[1] + '">' + r[2] + ' ' + di('up') + '</a></div>').join('') + '<p>This design preview uses fictional records. Links above open the existing application.</p></section>';
}
// Sidebar badges: open reports and pending applications for admins, orders needing attention otherwise.
function dashNavCounts() {
    if (isAdminDashboard)
        return { reports: dashOpenReports(), applications: dashPendingApplications() };
    const orders = dashRoleOrders();
    return { orders: isOrgDashboard ? orders.filter(o => o.status === 'Pending').length : orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length };
}
function dashRender() {
    const search = document.getElementById('dashboard-search');
    if (search.value !== dashState.query)
        search.value = dashState.query;
    document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === dashState.view)
        a.setAttribute('aria-current', 'page');
    else
        a.removeAttribute('aria-current'); });
    const counts = dashNavCounts();
    document.querySelectorAll('[data-nav-count]').forEach(el => { const count = counts[el.dataset.navCount] || 0; el.textContent = String(count); el.hidden = count === 0; });
    const view = dashState.view;
    let content = '';
    if (view === 'overview')
        content = isAdminDashboard ? dashAdminOverview() : isOrgDashboard ? dashOrgOverview() : dashConsumerOverview();
    else if (view === 'accounts')
        content = dashAccountsView();
    else if (view === 'reports')
        content = dashReportsView();
    else if (view === 'applications')
        content = dashApplicationsView();
    else if (view === 'health')
        content = dashHealthView();
    else if (view === 'orders')
        content = dashOrderTable('all');
    else if (view === 'listings')
        content = dashListingGrid();
    else if (view === 'feedback')
        content = dashOrgFeedback();
    else if (view === 'shop')
        content = dashShop();
    else if (view === 'saved')
        content = dashSavedView();
    else if (view === 'growers')
        content = dashOrganizationGrid();
    else if (view === 'members')
        content = dashMembers();
    else if (view === 'payments')
        content = isOrgDashboard ? dashOrgPayments() : dashOrderTable('payments');
    else if (view === 'settings')
        content = dashSettings();
    else
        content = dashHelp();
    document.getElementById('dashboard-content').innerHTML = dashHeading() + content + '<footer class="design-note"><span>AniBayan · ' + dashRole.workspace + '</span><span>Design preview · fictional sample data</span></footer>';
}
function dashNavigate(view) { location.hash = view; }
function dashOpen(html) { document.getElementById('detail-content').innerHTML = html; if (!dashDialog.open)
    dashDialog.showModal(); }
function dashFocusField(selector) { document.querySelector('#detail-content ' + selector)?.focus(); }
/* ---------- Detail dialogs ---------- */
function dashOrderDetails(id) {
    const order = dashRoleOrders().find(o => o.id === id);
    if (!order)
        return;
    const current = ['Pending', 'Confirmed', 'Processing', 'Completed'].indexOf(order.status);
    const next = isOrgDashboard ? dashNextStep[order.status] : undefined;
    let actions = '<button class="control primary" data-close-dialog>Close details</button>';
    let notes = '';
    if (next)
        actions = (order.status === 'Pending' ? '<button class="control danger" data-decline="' + order.id + '">Decline order</button>' : '') + '<button class="control primary" data-advance="' + order.id + '">' + next[1] + '</button>';
    if (isConsumerDashboard) {
        const feedback = dashboardFeedback.find(f => f.order === order.id);
        const report = dashMyReport(order.id);
        const canRate = order.status === 'Completed' && !feedback;
        if (feedback)
            notes += '<p class="detail-note">You rated this order ' + dashStars(feedback.rating) + (feedback.comment ? ' · “' + de(feedback.comment) + '”' : '') + '</p>';
        if (report)
            notes += '<p class="detail-note">Your report ' + report.id + ' (' + de(report.reason.toLowerCase()) + ') is ' + (report.status === 'Open' ? 'under review' : report.status.toLowerCase()) + '.</p>';
        actions = (report ? '' : '<button class="control" data-report-order="' + order.id + '">' + di('flag') + 'Report a problem</button>') + (canRate ? '<button class="control primary" data-rate="' + order.id + '">' + di('star') + 'Rate this order</button>' : actions);
    }
    const timeline = order.status === 'Cancelled' ? '<p class="detail-note">This order was cancelled and will not be fulfilled.</p>' : '<ol class="timeline">' + ['Order placed', 'Confirmed by grower', 'Harvest being prepared', 'Order completed'].map((s, i) => '<li class="' + (i > current ? 'future' : '') + '"><strong>' + s + '</strong><p>' + (i > current ? 'Not reached yet' : i === current ? 'Current status' : 'Completed step') + '</p></li>').join('') + '</ol>';
    dashOpen('<p class="detail-kicker">' + (isOrgDashboard ? 'Incoming order' : 'Your order') + '</p><h2 id="detail-title">' + order.id + '</h2><p class="detail-subtitle">' + de(order.organization) + '</p><div class="detail-hero"><img src="assets/' + order.image + '" alt="' + de(order.crop) + '"><div><h3>' + de(order.crop) + '</h3><p>' + de(order.quantity) + ' · ' + dp(order.total) + '</p></div></div><dl class="detail-facts"><div><dt>Order status</dt><dd>' + ds(order.status) + '</dd></div><div><dt>Payment</dt><dd>' + ds(order.payment) + '</dd></div><div><dt>Placed on</dt><dd>' + dd(order.date) + ', 2026</dd></div><div><dt>Buyer</dt><dd>' + de(order.customer) + '</dd></div></dl>' + timeline + notes + '<p class="detail-note">Fictional preview order. ' + (isOrgDashboard ? 'Status changes stay in this open preview only.' : 'No delivery location, payment, cancellation, or fulfillment action is submitted.') + '</p><div class="detail-actions">' + actions + '</div>');
}
function dashProductDetails(id) {
    const crop = dashboardCrops.find(c => c.id === id);
    if (!crop)
        return;
    const f = dashFreshness(crop);
    const fact = (label, value) => '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>';
    const harvest = fact('Harvested', dfull(crop.harvested) + ' · ' + dashAgeText(f.age)) + fact('Shelf life', dashPlural(crop.shelfLife, 'day') + ' after harvest') + fact('Best before', dfull(dashAddDays(crop.harvested, crop.shelfLife))) + fact('Freshness', dashFreshBadge(crop));
    const hero = (note) => '<div class="detail-hero"><img src="assets/' + crop.image + '" alt="' + de(crop.name) + '"><div><h3>' + dp(crop.price) + ' / ' + de(crop.unit) + '</h3><p>' + note + '</p></div></div>';
    if (isOrgDashboard) {
        dashOpen('<p class="detail-kicker">Product listing · ' + crop.id + '</p><h2 id="detail-title">' + de(crop.name) + '</h2><p class="detail-subtitle">' + de(crop.organization) + '</p>' + hero(de(crop.category)) + '<dl class="detail-facts">' + fact('Available quantity', crop.stock + ' ' + de(crop.unit)) + fact('Listing status', ds(dashCropStatus(crop))) + harvest + '</dl><p class="detail-note">Illustrative listing. Buyers see the harvest date, shelf life and best-before date. Edit price, stock and photos in the AniBayan application.</p><div class="detail-actions"><a class="control primary" href="/organization/listings">Edit in application ' + di('up') + '</a></div>');
        return;
    }
    const saved = dashState.saved.has(crop.id);
    dashOpen('<p class="detail-kicker">Harvest listing</p><h2 id="detail-title">' + de(crop.name) + '</h2><p class="detail-subtitle">' + de(crop.organization) + ' · ' + de(dashRegion(crop.organization)) + '</p>' + hero(de(crop.category) + ' · ' + (dashIsBuyable(crop) ? crop.stock + ' ' + de(crop.unit) + ' available' : 'Not available right now')) + '<dl class="detail-facts">' + harvest + fact('Grower credit score', dashScoreBadge(crop.organization)) + fact('Buyer rating', dashRatingText(crop.organization)) + '</dl><p class="detail-note">The organization enters the harvest date when it lists a crop. Shelf life is its estimate for produce stored as recommended, so plan to use it before the best-before date.</p><div class="detail-actions"><button class="control" data-organization="' + de(crop.organization) + '">About the grower</button><button class="control" data-save="' + crop.id + '" aria-pressed="' + saved + '">' + di('heart') + (saved ? 'Saved' : 'Save harvest') + '</button><a class="control primary" href="/products?q=' + encodeURIComponent(crop.name) + '">Order in the marketplace ' + di('up') + '</a></div>');
}
function dashGrowerDetails(name) {
    const org = dashboardOrganizations.find(o => o.name === name);
    if (!org)
        return;
    const orders = dashRoleOrders().filter(o => o.organization === org.name);
    const toRate = orders.find(o => o.status === 'Completed' && !dashRated(o.id));
    const toReport = orders.find(o => !dashMyReport(o.id));
    const feedback = dashboardFeedback.filter(f => f.organization === org.name).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    dashOpen('<p class="detail-kicker">Growing community</p><h2 id="detail-title">' + de(org.name) + '</h2><p class="detail-subtitle">' + de(org.region) + ' · ' + de(org.crop) + '</p>' + dashScoreExplainer(org.name) + (feedback.length ? '<h3 class="detail-section">Recent buyer feedback</h3><div class="feedback-list compact">' + feedback.map(dashFeedbackRow).join('') + '</div>' : '') + '<p class="detail-note">Credit score = average buyer rating × 20, minus ' + dashReportPenalty + ' points for each report upheld by AniBayan administrators.' + (orders.length ? '' : ' You can rate or report a community after ordering from it.') + '</p><div class="detail-actions">' + (toReport ? '<button class="control" data-report-order="' + toReport.id + '">' + di('flag') + 'Report a problem</button>' : '') + (toRate ? '<button class="control" data-rate="' + toRate.id + '">' + di('star') + 'Rate your order</button>' : '') + '<button class="control primary" data-shop-region="' + de(org.region) + '">Shop this community ' + di('arrow') + '</button></div>');
}
function dashAccountDetails(email) {
    const a = dashboardAccounts.find(x => x.email === email);
    if (!a)
        return;
    const admin = a.role === 'Administrator';
    const org = a.organization ? dashboardOrganizations.find(o => o.name === a.organization) : undefined;
    const toggle = !admin && (a.status === 'Active' || a.status === 'Suspended') ? (a.status === 'Suspended' ? '<button class="control primary" data-suspend="' + de(a.email) + '">' + di('check') + 'Reactivate account</button>' : '<button class="control danger" data-suspend="' + de(a.email) + '">' + di('lock') + 'Suspend account</button>') : '';
    const review = a.status === 'Pending' && org ? '<button class="control primary" data-organization="' + de(org.name) + '">Review application</button>' : '';
    const note = a.status === 'Pending' ? 'This representative account activates when the organization application is approved.' : admin ? 'Administrator accounts are managed by the platform owner.' : 'Suspended accounts can’t sign in, order or sell. Changes here stay in this open preview.';
    dashOpen('<p class="detail-kicker">' + a.role + ' account</p><h2 id="detail-title">' + de(a.name) + '</h2><p class="detail-subtitle">' + de(a.email) + '</p><dl class="detail-facts"><div><dt>Role</dt><dd>' + a.role + '</dd></div><div><dt>Status</dt><dd>' + ds(a.status) + '</dd></div><div><dt>Joined</dt><dd>' + dfull(a.joined) + '</dd></div><div><dt>Last active</dt><dd>' + dfull(a.lastActive) + '</dd></div>' + (a.organization ? '<div><dt>Organization</dt><dd>' + de(a.organization) + '</dd></div>' : '') + '</dl>' + (a.note ? '<p class="detail-note">' + de(a.note) + '</p>' : '') + '<p class="detail-note">' + note + '</p><div class="detail-actions"><button class="control" data-reset-password="' + de(a.email) + '">Send password reset</button>' + toggle + review + '</div>');
}
function dashReportDetails(id) {
    const r = dashboardReports.find(x => x.id === id);
    if (!r)
        return;
    const c = dashCredit(r.organization);
    const open = r.status === 'Open';
    const reporter = dashboardAccounts.find(a => a.name === r.customer);
    const effect = open ? (c.score === null ? 'Applies after the first rating' : Math.max(0, c.score - dashReportPenalty) + '/100 (−' + dashReportPenalty + ')') : r.status === 'Upheld' ? '−' + dashReportPenalty + ' points' : 'None';
    const actions = open ? '<button class="control" data-decide="Dismissed" data-report-id="' + r.id + '">Dismiss report</button><button class="control danger" data-decide="Upheld" data-report-id="' + r.id + '">' + di('flag') + 'Uphold report</button>' : '<button class="control" data-decide="Open" data-report-id="' + r.id + '">Reopen report</button><button class="control primary" data-close-dialog>Close</button>';
    dashOpen('<p class="detail-kicker">User report · ' + r.id + '</p><h2 id="detail-title">' + de(r.reason) + '</h2><p class="detail-subtitle">' + de(r.customer) + ' about ' + de(r.organization) + ' · ' + dfull(r.date) + '</p><blockquote class="report-quote">' + de(r.details) + '</blockquote><dl class="detail-facts"><div><dt>Status</dt><dd>' + ds(r.status) + '</dd></div><div><dt>Related order</dt><dd>' + (r.order ? dashOrderNo(r.order) : 'Not specified') + '</dd></div><div><dt>Credit score now</dt><dd>' + dashScoreBadge(r.organization) + '</dd></div><div><dt>' + (open ? 'If upheld' : 'Effect on score') + '</dt><dd>' + effect + '</dd></div>' + (reporter ? '<div><dt>Reporter account</dt><dd>' + ds(reporter.status) + '</dd></div>' : '') + '</dl><p class="detail-note">' + (open ? 'Uphold the report when the evidence supports it, or dismiss it. Your decision stays in this open preview.' : 'This report was ' + r.status.toLowerCase() + '. Reopen it to change the decision.') + '</p><div class="detail-actions">' + actions + '</div>');
}
function dashApplicationDetails(name) {
    const o = dashboardOrganizations.find(x => x.name === name);
    if (!o)
        return;
    const pending = o.status === 'Pending review';
    dashOpen('<p class="detail-kicker">Organization application</p><h2 id="detail-title">' + de(o.name) + '</h2><p class="detail-subtitle">' + de(o.region) + ' · submitted ' + dfull(o.applied) + '</p><div class="detail-hero"><img src="assets/' + o.image + '" alt="Illustrative community image"><div><h3>' + de(o.crop) + '</h3><p>' + dashPlural(o.members, 'member farmer') + ' · ' + ds(dashAppStatus(o)) + '</p></div></div><dl class="detail-facts"><div><dt>Representative</dt><dd>' + de(o.representative) + '</dd></div><div><dt>Submitted documents</dt><dd>' + o.documents.map(de).join(', ') + '</dd></div></dl><p class="detail-note">' + (pending ? 'Approving opens the organization’s storefront and activates its representative account. Declining keeps both closed. Your decision stays in this open preview.' : 'Fictional application record.') + '</p><div class="detail-actions">' + (pending ? '<button class="control danger" data-review="Declined" data-review-name="' + de(o.name) + '">Decline</button><button class="control primary" data-review="Active" data-review-name="' + de(o.name) + '">' + di('check') + 'Approve organization</button>' : '<button class="control primary" data-close-dialog>Close</button>') + '</div>');
}
/* ---------- Dialog forms: new listing, rating and report ---------- */
// Builds a labelled form control with its hint and an error slot that dashShowErrors fills.
function dashField(name, label, control, hint = '', wide = false) {
    const described = (hint ? 'hint-' + name + ' ' : '') + 'error-' + name;
    return '<div class="form-field' + (wide ? ' wide' : '') + '"><label for="field-' + name + '">' + label + '</label>' + control.replace(/^<(\w+)/, '<$1 id="field-' + name + '" name="' + name + '" aria-describedby="' + described + '"') + (hint ? '<small class="form-hint" id="hint-' + name + '">' + hint + '</small>' : '') + '<small class="field-error" id="error-' + name + '" data-error-for="' + name + '"></small></div>';
}
const dashRequired = ' <b aria-hidden="true">*</b>';
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
function dashListingForm() {
    const photos = [['vegetable-cutout.png', 'Vegetable basket'], ['carrot.jpg', 'Carrots'], ['tomatoes.jpg', 'Tomatoes'], ['onion.jpg', 'Onions'], ['eggplant.jpg', 'Eggplants'], ['sweet-potatoes.jpg', 'Sweet potatoes'], ['mango.jpg', 'Mangoes'], ['bananas.jpg', 'Bananas'], ['rice.jpg', 'Rice']];
    dashOpen('<p class="detail-kicker">New listing · ' + de(dashOrgName) + '</p><h2 id="detail-title">Add a crop listing</h2><p class="detail-subtitle">Buyers see the harvest date and shelf life on every listing.</p><form class="dash-form" id="listing-form" novalidate><div class="form-grid">'
        + dashField('name', 'Crop name' + dashRequired, '<input required maxlength="80" autocomplete="off" placeholder="e.g. Highland cabbage">', '', true)
        + dashField('category', 'Crop type' + dashRequired, '<select required><option value="">Choose a type…</option>' + Object.keys(dashShelfDefaults).map(c => '<option>' + de(c) + '</option>').join('') + '</select>')
        + dashField('image', 'Photo', '<select>' + photos.map(p => '<option value="' + p[0] + '">' + p[1] + '</option>').join('') + '</select>', 'Sample photos in this preview.')
        + dashField('price', 'Price per unit (₱)' + dashRequired, '<input type="number" required min="1" step="1" inputmode="numeric">')
        + dashField('unit', 'Unit' + dashRequired, '<select required><option value="kg">kg</option><option value="piece">piece</option><option value="bundle">bundle</option><option value="sack">sack</option></select>')
        + dashField('stock', 'Available quantity' + dashRequired, '<input type="number" required min="1" step="1" inputmode="numeric">')
        + dashField('harvested', 'Harvest date' + dashRequired, '<input type="date" required max="' + dashToday + '">', 'When this batch was harvested. Shown to buyers.')
        + dashField('shelfLife', 'Shelf life (days)' + dashRequired, '<input type="number" required min="1" max="365" step="1" inputmode="numeric">', 'How long the produce keeps after harvest. Filled in from the crop type; adjust it if needed.', true)
        + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">' + di('plus') + 'Publish listing</button></div></form>');
    dashFocusField('#field-name');
}
function dashSubmitListing(form) {
    const data = new FormData(form);
    const value = (name) => String(data.get(name) ?? '').trim();
    const name = value('name'), category = value('category'), harvested = value('harvested');
    const price = Number(value('price')), stock = Number(value('stock')), shelfLife = Number(value('shelfLife'));
    const errors = {};
    if (name.length < 2)
        errors.name = 'Enter the crop name.';
    if (!category)
        errors.category = 'Choose a crop type.';
    if (!value('price') || !Number.isInteger(price) || price < 1)
        errors.price = 'Enter a whole peso amount of at least ₱1.';
    if (!value('stock') || !Number.isInteger(stock) || stock < 1)
        errors.stock = 'Enter a whole number of at least 1.';
    if (!value('shelfLife') || !Number.isInteger(shelfLife) || shelfLife < 1 || shelfLife > 365)
        errors.shelfLife = 'Enter a shelf life between 1 and 365 days.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(harvested))
        errors.harvested = 'Enter the harvest date. Buyers use it to judge freshness.';
    else if (harvested > dashToday)
        errors.harvested = 'The harvest date can’t be in the future.';
    else if (!errors.shelfLife && dashAge(harvested) > shelfLife)
        errors.harvested = 'This harvest is already past its ' + shelfLife + '-day shelf life, so it can’t be listed.';
    if (!dashShowErrors(form, errors))
        return;
    const crop = { id: 'CROP-' + String(dashboardCrops.length + 1).padStart(3, '0'), name, organization: dashOrgName, image: value('image') || 'vegetable-cutout.png', price, unit: value('unit') || 'kg', category, stock, status: 'Active', harvested, shelfLife };
    dashboardCrops.unshift(crop);
    dashDialog.close();
    if (dashState.view === 'listings')
        dashRender();
    else
        dashNavigate('listings');
    dashToast(crop.name + ' is listed in this preview. Buyers see it was harvested ' + dd(harvested) + '.');
}
const dashRatingWords = ['', 'Very poor', 'Poor', 'Okay', 'Good', 'Excellent'];
function dashFeedbackForm(orderId) {
    const o = dashRoleOrders().find(x => x.id === orderId);
    if (!o || dashRated(o.id))
        return;
    const stars = [1, 2, 3, 4, 5].map(n => '<input type="radio" name="rating" id="rating-' + n + '" value="' + n + '"><label for="rating-' + n + '" title="' + n + ' – ' + dashRatingWords[n] + '">★<span class="sr-only">' + dashPlural(n, 'star') + ', ' + dashRatingWords[n] + '</span></label>').join('');
    dashOpen('<p class="detail-kicker">Rate your order · ' + dashOrderNo(o.id) + '</p><h2 id="detail-title">How was your order?</h2><p class="detail-subtitle">' + de(o.crop) + ' · ' + de(o.quantity) + ' from ' + de(o.organization) + '</p><form class="dash-form" id="feedback-form" data-order="' + o.id + '" novalidate><div class="form-grid single"><div class="form-field"><span class="form-label" id="rating-label">Your rating' + dashRequired + '</span><div class="star-input" role="radiogroup" aria-labelledby="rating-label" aria-describedby="rating-caption error-rating">' + stars + '</div><small class="form-hint" id="rating-caption">Choose 1 to 5 stars.</small><small class="field-error" id="error-rating" data-error-for="rating"></small></div>' + dashField('comment', 'Comment (optional)', '<textarea rows="3" maxlength="300" placeholder="What did you like? What could be better?"></textarea>') + '</div><p class="detail-note">Your rating becomes part of ' + de(o.organization) + '’s credit score.</p><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">' + di('star') + 'Submit rating</button></div></form>');
    dashFocusField('#rating-1');
}
function dashSubmitFeedback(form) {
    const data = new FormData(form);
    const rating = Number(data.get('rating'));
    if (!dashShowErrors(form, rating >= 1 && rating <= 5 ? {} : { rating: 'Choose a rating from 1 to 5 stars.' }))
        return;
    const order = dashboardOrders.find(o => o.id === form.dataset.order);
    if (!order)
        return;
    dashboardFeedback.unshift({ id: 'FB-' + (107 + dashboardFeedback.length), organization: order.organization, customer: dashConsumerName, rating, comment: String(data.get('comment') ?? '').trim(), date: dashToday, order: order.id });
    dashDialog.close();
    dashRender();
    dashToast('Thanks for rating! ' + order.organization + '’s credit score is now ' + dashCredit(order.organization).score + '.');
}
const dashReportReasons = ['Short or wrong quantity', 'Poor quality or spoiled', 'Harvest date not as listed', 'Late or no fulfillment', 'Payment or refund problem', 'Other'];
function dashReportForm(orderId) {
    const o = dashRoleOrders().find(x => x.id === orderId);
    if (!o || dashMyReport(o.id))
        return;
    dashOpen('<p class="detail-kicker">Report a problem · ' + dashOrderNo(o.id) + '</p><h2 id="detail-title">What went wrong?</h2><p class="detail-subtitle">' + de(o.crop) + ' · ' + de(o.quantity) + ' from ' + de(o.organization) + '</p><form class="dash-form" id="report-form" data-order="' + o.id + '" novalidate><div class="form-grid single">'
        + dashField('reason', 'Reason' + dashRequired, '<select required><option value="">Choose a reason…</option>' + dashReportReasons.map(r => '<option>' + de(r) + '</option>').join('') + '</select>')
        + dashField('details', 'Details' + dashRequired, '<textarea rows="4" required maxlength="500" placeholder="What did you receive, and when?"></textarea>', 'At least 20 characters.')
        + '</div><p class="detail-note">AniBayan administrators review every report. Only upheld reports lower the organization’s credit score.</p><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">' + di('flag') + 'Send report</button></div></form>');
    dashFocusField('#field-reason');
}
function dashSubmitReport(form) {
    const data = new FormData(form);
    const reason = String(data.get('reason') ?? '').trim(), details = String(data.get('details') ?? '').trim();
    const errors = {};
    if (!reason)
        errors.reason = 'Choose a reason.';
    if (details.length < 20)
        errors.details = 'Describe the problem in at least 20 characters.';
    if (!dashShowErrors(form, errors))
        return;
    const order = dashboardOrders.find(o => o.id === form.dataset.order);
    if (!order)
        return;
    dashboardReports.push({ id: 'RP-' + String(31 + dashboardReports.length).padStart(3, '0'), organization: order.organization, customer: dashConsumerName, reason, details, date: dashToday, status: 'Open', order: order.id });
    dashDialog.close();
    dashRender();
    dashToast('Report sent. Administrators review it before it affects ' + order.organization + '’s credit score.');
}
let dashToastTimeout;
function dashToast(message) { const el = document.getElementById('dashboard-toast'); el.textContent = message; el.classList.add('visible'); window.clearTimeout(dashToastTimeout); dashToastTimeout = window.setTimeout(() => el.classList.remove('visible'), 2600); }
function dashExportRows() {
    const view = dashState.view;
    if (isAdminDashboard) {
        if (view === 'reports')
            return ['user-reports', [['Report ID', 'Organization', 'Reported by', 'Reason', 'Details', 'Order', 'Filed', 'Status'], ...dashReportList().map(r => [r.id, r.organization, r.customer, r.reason, r.details, r.order || '', r.date, r.status])]];
        if (view === 'applications')
            return ['organization-applications', [['Organization', 'Region', 'Main crops', 'Representative', 'Members', 'Documents', 'Submitted', 'Status'], ...dashApplicationList().map(o => [o.name, o.region, o.crop, o.representative, o.members, o.documents.join('; '), o.applied, dashAppStatus(o)])]];
        if (view === 'health')
            return ['site-health', [['Service', 'Purpose', 'Status', 'Response time', 'Uptime (30 days)'], ...dashServiceList().map(s => [s.name, s.detail, s.status, s.latency, s.uptime])]];
        return ['accounts', [['Name', 'Email', 'Role', 'Organization', 'Joined', 'Last active', 'Status'], ...dashAccountList().map(a => [a.name, a.email, a.role, a.organization || '', a.joined, a.lastActive, a.status])]];
    }
    if (view === 'listings')
        return ['listings', [['Product ID', 'Name', 'Category', 'Price PHP', 'Unit', 'Available quantity', 'Harvest date', 'Shelf life (days)', 'Best before', 'Status'], ...dashListingCrops().map(c => [c.id, c.name, c.category, c.price, c.unit, c.stock, c.harvested, c.shelfLife, dashAddDays(c.harvested, c.shelfLife), dashCropStatus(c)])]];
    if (view === 'members')
        return ['members', [['Farmer', 'Location', 'Crops', 'Area ha', 'Member since', 'Status'], ...dashboardMembers.filter(m => dashMatching(Object.values(m).join(' '))).map(m => [m.name, m.place, m.crops, m.area, m.joined, m.status])]];
    if (view === 'feedback')
        return ['feedback', [['Feedback ID', 'Date', 'Buyer', 'Rating', 'Comment', 'Order'], ...dashOrgFeedbackList().map(f => [f.id, f.date, f.customer, f.rating, f.comment, f.order || ''])]];
    return ['orders', [['Order ID', 'Customer', 'Organization', 'Crop', 'Quantity', 'Total PHP', 'Status', 'Payment', 'Date'], ...dashOrders().map(o => [o.id, o.customer, o.organization, o.crop, o.quantity, o.total, o.status, o.payment, o.date])]];
}
function dashExport() {
    const [recordType, rows] = dashExportRows();
    // Prefix cells that start like a spreadsheet formula so they open as plain text.
    const cell = (value) => { const text = String(value); return '"' + (/^[=+\-@]/.test(text) ? "'" + text : text).replace(/"/g, '""') + '"'; };
    const csv = '﻿' + rows.map(row => row.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'anibayan-' + dashboardRole + '-sample-' + recordType + '.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    dashToast('Sample ' + recordType.replace(/-/g, ' ') + ' exported as CSV.');
}
function dashSetPopover(panelId, buttonId, open) {
    document.getElementById(panelId).hidden = !open;
    document.getElementById(buttonId).setAttribute('aria-expanded', String(open));
}
function dashClosePopovers() { dashSetPopover('notification-panel', 'show-notifications', false); dashSetPopover('workspace-menu', 'workspace-toggle', false); }
const dashNarrow = window.matchMedia('(max-width:900px)');
dashShell();
function dashReadHash() {
    const view = location.hash.slice(1) || 'overview';
    const allowed = dashRole.nav.map(n => n[0]).concat(['settings', 'help']);
    dashState.view = allowed.includes(view) ? view : 'overview';
    dashState.filter = dashState.nextFilter || 'All';
    dashState.nextFilter = '';
    dashState.query = '';
    dashClosePopovers();
    document.body.classList.remove('sidebar-open');
    dashRender();
    window.scrollTo(0, 0);
}
window.addEventListener('hashchange', dashReadHash);
dashReadHash();
document.getElementById('dashboard-search').addEventListener('input', event => { dashState.query = event.target.value; dashRender(); });
document.addEventListener('keydown', event => {
    const el = event.target;
    if (event.key === 'Escape') {
        dashClosePopovers();
        document.body.classList.remove('sidebar-open');
        return;
    }
    if (event.key === '/' && !el.closest('input,select,textarea') && !dashDialog.open) {
        event.preventDefault();
        document.getElementById('dashboard-search').focus();
    }
});
document.addEventListener('click', event => {
    const el = event.target;
    if (!el.closest('.notification-wrap'))
        dashSetPopover('notification-panel', 'show-notifications', false);
    if (!el.closest('.workspace-switch'))
        dashSetPopover('workspace-menu', 'workspace-toggle', false);
    if (el.closest('#sidebar-backdrop'))
        document.body.classList.remove('sidebar-open');
    const target = el.closest('button,[data-go]');
    if (!target)
        return;
    const data = target.dataset;
    if (data.go) {
        dashState.nextFilter = data.goFilter || '';
        if (dashDialog.open)
            dashDialog.close();
        dashNavigate(data.go);
        return;
    }
    if (data.advance || data.decline) {
        const order = dashboardOrders.find(o => o.id === (data.advance || data.decline));
        order.status = data.decline ? 'Cancelled' : dashNextStep[order.status][0];
        dashRender();
        if (dashDialog.open)
            dashOrderDetails(order.id);
        dashToast('Order ' + dashOrderNo(order.id) + ' marked ' + order.status.toLowerCase() + ' in this preview.');
        return;
    }
    if (data.toggleListing) {
        const crop = dashboardCrops.find(c => c.id === data.toggleListing);
        crop.status = crop.status === 'Active' ? 'Unavailable' : 'Active';
        dashRender();
        dashToast(crop.name + (crop.status === 'Active' ? ' is visible to buyers again.' : ' is paused in this preview.'));
        return;
    }
    if (data.review && data.reviewName) {
        const org = dashboardOrganizations.find(o => o.name === data.reviewName);
        org.status = data.review;
        const representative = dashboardAccounts.find(a => a.organization === org.name && a.status === 'Pending');
        if (representative)
            representative.status = data.review === 'Active' ? 'Active' : 'Declined';
        dashDialog.close();
        dashRender();
        dashToast(org.name + (data.review === 'Active' ? ' approved' : ' declined') + ' in this preview.');
        return;
    }
    if (data.decide && data.reportId) {
        const report = dashboardReports.find(r => r.id === data.reportId);
        report.status = data.decide;
        dashRender();
        dashReportDetails(report.id);
        const score = dashCredit(report.organization).score;
        dashToast(report.id + (report.status === 'Open' ? ' reopened. ' : ' ' + report.status.toLowerCase() + '. ') + report.organization + (score === null ? ' has no credit score yet.' : '’s credit score is now ' + score + '.'));
        return;
    }
    if (data.reportId) {
        dashReportDetails(data.reportId);
        return;
    }
    if (data.suspend) {
        const account = dashboardAccounts.find(a => a.email === data.suspend);
        account.status = account.status === 'Suspended' ? 'Active' : 'Suspended';
        account.note = account.status === 'Suspended' ? 'Suspended by AniBayan Admin on Nov 08, 2026.' : undefined;
        dashRender();
        dashAccountDetails(account.email);
        dashToast(account.name + (account.status === 'Suspended' ? ' suspended' : ' reactivated') + ' in this preview.');
        return;
    }
    if (data.resetPassword) {
        dashToast('Password reset email for ' + data.resetPassword + ' queued in this preview.');
        return;
    }
    if (data.account) {
        dashAccountDetails(data.account);
        return;
    }
    if (data.rate) {
        dashFeedbackForm(data.rate);
        return;
    }
    if (data.reportOrder) {
        dashReportForm(data.reportOrder);
        return;
    }
    if (data.addListing !== undefined) {
        dashListingForm();
        return;
    }
    if (data.shopReset !== undefined) {
        dashState.shop = { ...dashShopDefaults };
        dashRender();
        return;
    }
    if (data.shopRegion) {
        dashState.shop = { ...dashShopDefaults, location: data.shopRegion };
        if (dashDialog.open)
            dashDialog.close();
        if (dashState.view === 'shop')
            dashRender();
        else
            dashNavigate('shop');
        return;
    }
    if (data.healthCheck !== undefined) {
        dashState.healthChecked = 'just now';
        dashRender();
        dashToast('Health checks finished: ' + dashboardServices.filter(s => s.status === 'Operational').length + ' of ' + dashboardServices.length + ' services operational.');
        return;
    }
    if (data.order) {
        dashOrderDetails(data.order);
        return;
    }
    if (data.product) {
        dashProductDetails(data.product);
        return;
    }
    if (data.organization) {
        if (isAdminDashboard)
            dashApplicationDetails(data.organization);
        else
            dashGrowerDetails(data.organization);
        return;
    }
    if (data.filter) {
        dashState.filter = data.filter;
        dashRender();
        return;
    }
    if (data.chart) {
        dashState.chart = data.chart;
        dashRender();
        return;
    }
    if (data.bar !== undefined) {
        dashState.bar = Number(data.bar);
        dashRender();
        return;
    }
    if (data.save) {
        const id = data.save;
        dashState.saved.has(id) ? dashState.saved.delete(id) : dashState.saved.add(id);
        dashRender();
        if (target.closest('#detail-dialog'))
            dashProductDetails(id);
        dashToast(dashState.saved.has(id) ? 'Harvest saved in this preview.' : 'Harvest removed from saved items.');
        return;
    }
    if (target.hasAttribute('data-close-dialog')) {
        dashDialog.close();
        return;
    }
    if (target.id === 'export-dashboard') {
        dashExport();
        return;
    }
    if (target.id === 'collapse-sidebar') {
        if (dashNarrow.matches)
            document.body.classList.toggle('sidebar-open');
        else
            document.body.classList.toggle('sidebar-collapsed');
        return;
    }
    if (target.id === 'show-notifications') {
        dashSetPopover('notification-panel', 'show-notifications', document.getElementById('notification-panel').hidden);
        return;
    }
    if (target.id === 'workspace-toggle') {
        dashSetPopover('workspace-menu', 'workspace-toggle', document.getElementById('workspace-menu').hidden);
    }
});
document.addEventListener('input', event => {
    const input = event.target;
    const key = input.dataset.shop;
    if (key) {
        dashState.shop[key] = input.value;
        dashRefreshShop();
        return;
    }
    const form = input.form;
    if (!form || !form.closest('#detail-dialog'))
        return;
    // Clear a field's error as soon as it is edited; the form is validated again on submit.
    const slot = form.querySelector('[data-error-for="' + input.name + '"]');
    if (slot && slot.textContent) {
        slot.textContent = '';
        form.querySelectorAll('[name="' + input.name + '"]').forEach(field => field.removeAttribute('aria-invalid'));
    }
    if (form.id !== 'listing-form')
        return;
    if (input.name === 'shelfLife')
        input.dataset.edited = 'true';
    if (input.name === 'category') {
        const shelfLife = form.elements.namedItem('shelfLife');
        const days = dashShelfDefaults[input.value];
        if (days && !shelfLife.dataset.edited)
            shelfLife.value = String(days);
    }
});
document.addEventListener('change', event => {
    const input = event.target;
    if (input.id === 'dashboard-period') {
        dashState.period = input.value === 'month' ? 'month' : 'week';
        dashState.bar = 3;
        dashRender();
    }
    if (input.id === 'density')
        document.body.classList.toggle('compact-density', input.checked);
    if (input.id === 'contrast')
        document.body.classList.toggle('contrast-mode', input.checked);
    if (input.name === 'rating') {
        const caption = document.getElementById('rating-caption');
        if (caption)
            caption.textContent = dashPlural(Number(input.value), 'star') + ' · ' + dashRatingWords[Number(input.value)];
    }
});
document.addEventListener('submit', event => {
    const form = event.target;
    if (!form.closest('#detail-dialog'))
        return;
    event.preventDefault();
    if (form.id === 'listing-form')
        dashSubmitListing(form);
    else if (form.id === 'feedback-form')
        dashSubmitFeedback(form);
    else if (form.id === 'report-form')
        dashSubmitReport(form);
});
dashDialog.addEventListener('click', event => { if (event.target === dashDialog) {
    const r = dashDialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)
        dashDialog.close();
} });
