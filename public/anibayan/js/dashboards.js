"use strict";
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
    { id: 'CROP-001', name: 'Carabao mangoes', organization: 'Guimaras Mango Farmers', image: 'mango.jpg', price: 130, unit: 'kg', category: 'Fruits', stock: 180, status: 'Active' },
    { id: 'CROP-002', name: 'Fresh carrots', organization: 'Benguet Highland Growers', image: 'carrot.jpg', price: 70, unit: 'kg', category: 'Vegetables', stock: 96, status: 'Active' },
    { id: 'CROP-003', name: 'Dinorado rice', organization: 'Nueva Ecija Rice Growers', image: 'rice.jpg', price: 58, unit: 'kg', category: 'Rice & grains', stock: 850, status: 'Active' },
    { id: 'CROP-004', name: 'Red onions', organization: 'Benguet Highland Growers', image: 'onion.jpg', price: 90, unit: 'kg', category: 'Vegetables', stock: 45, status: 'Active' },
    { id: 'CROP-005', name: 'Purple eggplants', organization: 'Benguet Highland Growers', image: 'eggplant.jpg', price: 65, unit: 'kg', category: 'Vegetables', stock: 0, status: 'Unavailable' },
    { id: 'CROP-006', name: 'Golden bananas', organization: 'Guimaras Mango Farmers', image: 'bananas.jpg', price: 55, unit: 'kg', category: 'Fruits', stock: 74, status: 'Active' },
    { id: 'CROP-007', name: 'Vine-ripened tomatoes', organization: 'Benguet Highland Growers', image: 'tomatoes.jpg', price: 80, unit: 'kg', category: 'Vegetables', stock: 132, status: 'Active' },
    { id: 'CROP-008', name: 'Sweet potatoes', organization: 'Benguet Highland Growers', image: 'sweet-potatoes.jpg', price: 45, unit: 'kg', category: 'Vegetables', stock: 28, status: 'Active' },
];
const dashboardOrganizations = [
    { name: 'Benguet Highland Growers', region: 'Benguet, Cordillera', crop: 'Highland vegetables', image: 'grower.png', listings: 18, status: 'Active' },
    { name: 'Guimaras Mango Farmers', region: 'Guimaras, Western Visayas', crop: 'Mangoes & fruits', image: 'mango.jpg', listings: 12, status: 'Active' },
    { name: 'Nueva Ecija Rice Growers', region: 'Nueva Ecija, Central Luzon', crop: 'Rice & grains', image: 'rice-hero.png', listings: 24, status: 'Active' },
    { name: 'Laguna Harvest Collective', region: 'Laguna, Calabarzon', crop: 'Vegetables & roots', image: 'soil-story.png', listings: 0, status: 'Pending review' },
];
const dashboardPeople = [
    { name: 'Alex Reyes', email: 'alex@example.com', role: 'Consumer', joined: 'Nov 08, 2026', status: 'Active' },
    { name: 'Maria Santos', email: 'maria@example.com', role: 'Consumer', joined: 'Nov 07, 2026', status: 'Active' },
    { name: 'Carlo Mendoza', email: 'carlo@example.com', role: 'Representative', joined: 'Nov 06, 2026', status: 'Active' },
    { name: 'Isabel Cruz', email: 'isabel@example.com', role: 'Consumer', joined: 'Nov 05, 2026', status: 'Active' },
    { name: 'Ramon Dulnuan', email: 'ramon@example.com', role: 'Representative', joined: 'Oct 12, 2026', status: 'Active' },
    { name: 'AniBayan Admin', email: 'admin@example.com', role: 'Administrator', joined: 'Oct 01, 2026', status: 'Active' },
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
const dashboardPeriods = {
    week: { label: 'Nov 02 – Nov 08, 2026', value: 184650, orders: 146, growers: 36, reviews: 7, labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [18.2, 26.8, 21.45, 36.7, 28.3, 29.9, 23.3], orderValues: [14, 21, 17, 29, 22, 24, 19], valueScale: 40, orderScale: 40 },
    month: { label: 'Nov 01 – Nov 30, 2026', value: 692480, orders: 538, growers: 36, reviews: 12, labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], values: [138.48, 182, 165, 207], orderValues: [102, 141, 126, 169], valueScale: 250, orderScale: 200 },
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
const dashState = { view: 'overview', query: '', filter: 'All', nextFilter: '', period: 'week', chart: 'value', bar: 3, saved: new Set(['CROP-001', 'CROP-002', 'CROP-003']), savedOnly: true };
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
};
const di = (name) => '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="' + (dashPaths[name] || dashPaths.grid) + '"/></svg>';
const de = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dp = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
const dd = (date) => new Date(date + 'T12:00:00').toLocaleDateString('en-PH', { month: 'short', day: '2-digit' });
const ds = (status) => '<span class="status ' + status.toLowerCase().replace(/ /g, '-') + '">' + de(status) + '</span>';
const dashHelpTitle = ['Help & support', 'Where to continue in the AniBayan application.'];
const dashRoles = {
    admin: {
        page: 'admin.html', workspace: 'Admin workspace', navLabel: 'Platform',
        nav: [['overview', 'grid', 'Dashboard'], ['orders', 'bag', 'Orders'], ['products', 'box', 'Products'], ['organizations', 'leaf', 'Organizations'], ['users', 'people', 'Users'], ['payments', 'wallet', 'Payments'], ['reports', 'chart', 'Reports']],
        settingsNav: ['settings', 'settings', 'Settings'],
        user: 'AniBayan Admin', userRole: 'Platform administrator', initials: 'AD',
        search: 'Search orders, products, people…',
        cardIcon: 'shield', cardTitle: 'Platform oversight', cardText: 'Review organizations, users and marketplace activity across AniBayan.',
        shortcut: ['Open marketplace', '/products', 'leaf'],
        notifications: [['Laguna Harvest Collective is awaiting review.', 'organizations', 'Review organizations'], ['12 orders are waiting for organization confirmation.', 'orders', 'View orders']],
        titles: { overview: ['Platform overview', 'Marketplace activity across every organization on AniBayan.'], orders: ['All orders', 'Every order placed across the marketplace.'], products: ['Product listings', 'Listings published by all organizations.'], organizations: ['Organizations', 'Review and monitor the farmer organizations selling on AniBayan.'], users: ['Users', 'Consumer, representative and administrator accounts.'], payments: ['Payments', 'Payment status for every marketplace order.'], reports: ['Platform reports', 'Order value and volume for the selected period.'], settings: ['Workspace settings', 'Preferences for this admin preview.'], help: dashHelpTitle },
    },
    organization: {
        page: 'organization.html', workspace: 'Organization workspace', navLabel: 'Your organization',
        nav: [['overview', 'grid', 'Overview'], ['orders', 'bag', 'Incoming orders'], ['listings', 'box', 'My listings'], ['members', 'people', 'Member farmers'], ['payments', 'wallet', 'Payments']],
        settingsNav: ['settings', 'store', 'Organization profile'],
        user: dashboardOrgProfile.representative, userRole: 'Organization representative', initials: 'RD',
        search: 'Search your orders, listings, members…',
        cardIcon: 'leaf', cardTitle: dashOrgName, cardText: dashboardOrgProfile.region + ' · ' + dashboardOrgProfile.crops,
        shortcut: ['View public storefront', '/organizations/benguet-highland-growers', 'store'],
        notifications: [['New order #1041 from Alex Reyes is waiting for confirmation.', 'orders', 'Open incoming orders'], ['Sweet potatoes are running low: 28 kg left.', 'listings', 'Manage listings']],
        titles: { overview: [dashOrgName, 'Orders, listings and members for your organization.'], orders: ['Incoming orders', 'Confirm, prepare and complete orders from your buyers.'], listings: ['My listings', 'The crops your organization offers on the marketplace.'], members: ['Member farmers', 'The growers who supply your organization.'], payments: ['Payments', 'Payment status for your organization’s orders.'], settings: ['Organization profile', 'How your organization appears on AniBayan.'], help: dashHelpTitle },
    },
    consumer: {
        page: 'consumer.html', workspace: 'My AniBayan', navLabel: 'Your account',
        nav: [['overview', 'grid', 'Overview'], ['orders', 'bag', 'My orders'], ['saved', 'heart', 'Saved harvests'], ['growers', 'leaf', 'My growers'], ['payments', 'wallet', 'Payment history']],
        settingsNav: ['settings', 'user', 'My profile'],
        user: dashConsumerName, userRole: 'Consumer account', initials: 'AR',
        search: 'Search your orders and harvests…',
        cardIcon: 'leaf', cardTitle: 'Good food starts here.', cardText: 'Discover fresh harvests and the communities behind them.',
        shortcut: ['Explore marketplace', '/products', 'leaf'],
        notifications: [['Your vegetable basket is being prepared by Benguet Highland Growers.', 'orders', 'See my orders']],
        titles: { overview: ['Your harvest, at a glance.', 'Welcome back, Alex. Good things are on their way.'], orders: ['My orders', 'Follow each order from placement to completion.'], saved: ['Saved harvests', 'Crops you want to come back to.'], growers: ['Your growing communities', 'The organizations behind your food.'], payments: ['Payment history', 'Payments for your orders.'], settings: ['Your profile', 'Your account and preview preferences.'], help: dashHelpTitle },
    },
};
const dashRole = dashRoles[dashboardRole];
// Organization order workflow: current status -> [next status, action label].
const dashNextStep = { Pending: ['Confirmed', 'Confirm order'], Confirmed: ['Processing', 'Start preparing'], Processing: ['Completed', 'Mark completed'] };
function dashShell() {
    const link = (item) => '<a href="#' + item[0] + '" data-nav="' + item[0] + '" title="' + item[2] + '">' + di(item[1]) + '<span>' + item[2] + '</span>' + (item[0] === 'orders' ? '<span class="nav-count" data-nav-count></span>' : '') + '</a>';
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
    let tools = '';
    if (isConsumerDashboard)
        tools = '<span class="control static">' + di('calendar') + 'Sunday, 08 Nov 2026</span><a class="control primary" href="/products">' + di('bag') + 'Shop the harvest</a>';
    else {
        const periodViews = isAdminDashboard ? ['overview', 'orders', 'reports'] : ['overview'];
        const exportViews = isAdminDashboard ? ['overview', 'orders', 'products', 'organizations', 'users', 'payments', 'reports'] : ['overview', 'orders', 'listings', 'members', 'payments'];
        if (periodViews.includes(view))
            tools += '<select class="period-select" id="dashboard-period" aria-label="Reporting period"><option value="week" ' + (dashState.period === 'week' ? 'selected' : '') + '>Nov 02 – Nov 08, 2026</option><option value="month" ' + (dashState.period === 'month' ? 'selected' : '') + '>November 2026</option></select>';
        if (exportViews.includes(view))
            tools += '<button class="control" id="export-dashboard">' + di('download') + 'Export CSV</button>';
        if (isOrgDashboard && (view === 'overview' || view === 'listings'))
            tools += '<a class="control primary" href="/organization/listings/new">' + di('plus') + 'Add listing</a>';
    }
    return '<div class="page-heading"><div><h1>' + de(title) + '</h1><p>' + de(sub) + '</p></div><div class="page-tools">' + tools + '</div></div>';
}
function dashMetric(label, value, icon, caption, trend = '') {
    return '<article class="metric"><div class="metric-top"><span>' + label + '</span>' + di(icon) + '</div><div class="metric-value"><strong>' + value + '</strong>' + (trend ? '<span class="trend">↗ ' + trend + '</span>' : '') + '</div><p class="metric-caption">' + caption + '</p></article>';
}
function dashPanelHead(title, note, action = '') {
    return '<div class="panel-head"><div><h2>' + title + '</h2>' + (note ? '<p>' + note + '</p>' : '') + '</div>' + action + '</div>';
}
function dashChart(period, valueNote, volumeNote) {
    const orderChart = dashState.chart === 'orders';
    const values = orderChart ? period.orderValues : period.values;
    const scale = orderChart ? period.orderScale : period.valueScale;
    const labels = [1, .75, .5, .25, 0].map(part => orderChart ? String(part * scale) : '₱' + (part * scale) + 'k');
    const bars = values.map((value, index) => {
        const caption = orderChart ? String(value) : dp(value * 1000);
        return '<div class="chart-column"><button class="chart-bar ' + (dashState.bar === index ? 'selected' : '') + '" style="--bar-height:' + Math.round(value / scale * 100) + '%" data-bar="' + index + '" aria-pressed="' + (dashState.bar === index) + '" aria-label="' + period.labels[index] + ': ' + caption + (orderChart ? ' orders' : '') + '"><span>' + caption + '</span></button><span class="chart-day">' + period.labels[index] + '</span></div>';
    }).join('');
    return '<section class="panel">' + dashPanelHead(orderChart ? 'Order activity' : 'Order value', orderChart ? volumeNote : valueNote, '<span class="chip">' + (dashState.period === 'week' ? 'This week' : 'This month') + '</span>') + '<div class="chart-tabs"><button data-chart="value" aria-pressed="' + !orderChart + '">Order value</button><button data-chart="orders" aria-pressed="' + orderChart + '">Order volume</button></div><div class="chart-body"><div class="chart-axis">' + labels.map(i => '<span>' + i + '</span>').join('') + '</div><div class="bar-chart">' + bars + '</div></div><div class="chart-foot"><span><i class="legend-dot"></i> ' + (orderChart ? 'Placed orders' : 'Order value') + '</span><span>' + period.label + '</span></div></section>';
}
function dashDonut() {
    return '<section class="panel">' + dashPanelHead('Harvest mix', 'Share of active listings', '<button class="icon-button" data-go="products" aria-label="View product listings">' + di('up') + '</button>') + '<div class="donut-wrap"><svg class="donut" viewBox="0 0 180 180" role="img" aria-label="Vegetables 52 percent, fruits 28 percent, rice and grains 20 percent"><circle class="donut-track" cx="90" cy="90" r="68"/><circle class="donut-part" cx="90" cy="90" r="68" stroke="#2fbc57" stroke-dasharray="214 428"/><circle class="donut-part" cx="90" cy="90" r="68" stroke="#9bcb7c" stroke-dasharray="110 428" stroke-dashoffset="-225"/><circle class="donut-part" cx="90" cy="90" r="68" stroke="#d8e6b7" stroke-dasharray="73 428" stroke-dashoffset="-345"/></svg><div class="donut-center"><strong>240</strong><small>active listings</small></div></div><div class="donut-legend">' + [['Vegetables', '52%', '#2fbc57'], ['Fruits', '28%', '#9bcb7c'], ['Rice & grains', '20%', '#d8e6b7']].map(([label, value, color]) => '<div><i style="--dot:' + color + '"></i>' + label + '<strong>' + value + '</strong></div>').join('') + '</div></section>';
}
function dashMatching(text) { return text.toLowerCase().includes(dashState.query.trim().toLowerCase()); }
function dashEmpty(title, description) { return '<div class="empty-state"><h2>' + title + '</h2><p>' + description + '</p></div>'; }
function dashFilters(options, summary) {
    return '<div class="filters">' + options.map(f => '<button class="filter-chip" data-filter="' + f + '" aria-pressed="' + (dashState.filter === f) + '">' + f + '</button>').join('') + '<span class="filter-summary">' + summary + '</span></div>';
}
// Orders visible to the current role, before search and status filters.
function dashRoleOrders() {
    return dashboardOrders.filter(o => isAdminDashboard || (isOrgDashboard ? o.organization === dashOrgName : o.customer === dashConsumerName));
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
    return isOrgDashboard && crop.stock < 50 ? 'Low stock' : 'Active';
}
function dashOrderTable(mode) {
    const all = dashOrders();
    const orders = mode === 'recent' ? all.slice(0, 5) : all;
    const product = (o) => '<div class="table-product"><img src="assets/' + o.image + '" alt=""><div><strong>' + de(o.crop) + '</strong><small>' + de(o.quantity) + '</small></div></div>';
    const cols = [['Order', o => '<strong>' + o.id.replace('AB-2026-', '#') + '</strong>']];
    if (isAdminDashboard && mode !== 'recent')
        cols.push(['Customer', o => '<strong>' + de(o.customer) + '</strong>'], ['Organization', o => de(o.organization)]);
    else {
        cols.push(['Harvest', product]);
        if (isOrgDashboard)
            cols.push(['Buyer', o => de(o.customer)]);
    }
    cols.push(['Total', o => '<strong>' + dp(o.total) + '</strong>']);
    if (mode === 'payments')
        cols.push(['Payment', o => ds(o.payment)], ['Order status', o => ds(o.status)]);
    else
        cols.push(['Status', o => ds(o.status)]);
    cols.push(['Date', o => dd(o.date)]);
    const actions = (o) => '<div class="row-actions">' + (isOrgDashboard && mode === 'all' && dashNextStep[o.status] ? '<button class="control small" data-advance="' + o.id + '">' + dashNextStep[o.status][1] + '</button>' : '') + '<button class="table-action" data-order="' + o.id + '" aria-label="View order ' + o.id + '">' + di('eye') + '</button></div>';
    const title = mode === 'payments' ? (isAdminDashboard ? 'Payment records' : isOrgDashboard ? 'Payments by order' : 'Your payment history') : mode === 'recent' ? (isConsumerDashboard ? 'Recent purchases' : 'Recent orders') : (isOrgDashboard ? 'Orders from your buyers' : isAdminDashboard ? 'Marketplace orders' : 'Your orders');
    const head = dashPanelHead(title, '', mode === 'recent' ? '<button class="text-button" data-go="orders">View all ' + di('arrow') + '</button>' : '<span class="filter-summary">Fictional sample records</span>');
    const filters = mode === 'all' ? dashFilters(['All', 'Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled'], orders.length + (orders.length === 1 ? ' order' : ' orders')) : '';
    const table = orders.length ? '<table><thead><tr>' + cols.map(c => '<th scope="col">' + c[0] + '</th>').join('') + '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + orders.map(o => '<tr>' + cols.map(c => '<td>' + c[1](o) + '</td>').join('') + '<td>' + actions(o) + '</td></tr>').join('') + '</tbody></table>' : dashEmpty('No matching orders', 'Try another search or order status.');
    return '<section class="panel">' + head + filters + '<div class="table-wrap">' + table + '</div><div class="table-footer"><span>Showing ' + orders.length + ' of ' + dashRoleOrders().length + ' sample ' + (mode === 'payments' ? 'payments' : 'orders') + '</span></div></section>';
}
/* ---------- Admin: platform-wide views ---------- */
function dashAdminMetrics() {
    const p = dashboardPeriods[dashState.period];
    return '<div class="metric-grid">' + dashMetric('Total order value', dp(p.value), 'wallet', 'Across all organization orders', '12.8%') + dashMetric('Orders placed', String(p.orders), 'bag', '<b>18 more</b> than previous period', '14.1%') + dashMetric('Active organizations', String(p.growers), 'leaf', 'Farmer organizations on AniBayan', '3 new') + dashMetric('Awaiting review', String(p.reviews), 'clock', 'Organizations needing your attention') + '</div>';
}
function dashAdminChart() { return dashChart(dashboardPeriods[dashState.period], 'Placed order totals · not paid revenue', 'Orders placed across the marketplace'); }
function dashOrgList() {
    return '<section class="panel">' + dashPanelHead('Organizations', 'Most active this period', '<button class="icon-button" data-go="organizations" aria-label="View organizations">' + di('up') + '</button>') + '<div class="organization-list">' + dashboardOrganizations.slice(0, 3).map(org => '<button class="organization-row" data-organization="' + de(org.name) + '"><img src="assets/' + org.image + '" alt=""><span><strong>' + de(org.name) + '</strong><small>' + org.listings + ' active listings · ' + de(org.region.split(', ')[1]) + '</small></span>' + di('arrow') + '</button>').join('') + '</div><div class="review-prompt">' + di('clock') + '<span><b>' + dashboardPeriods[dashState.period].reviews + ' organizations</b> awaiting review</span><button data-go="organizations" data-go-filter="Pending review">Review →</button></div></section>';
}
function dashAdminOverview() { return dashAdminMetrics() + '<div class="split">' + dashAdminChart() + dashDonut() + '</div><div class="split">' + dashOrderTable('recent') + dashOrgList() + '</div>'; }
function dashOrganizationTable() {
    const statuses = ['All', 'Active', 'Pending review'].concat(dashboardOrganizations.some(o => o.status === 'Declined') ? ['Declined'] : []);
    const orgs = dashboardOrganizations.filter(o => dashMatching(o.name + ' ' + o.region + ' ' + o.crop) && (dashState.filter === 'All' || o.status === dashState.filter));
    const table = orgs.length ? '<table><thead><tr><th scope="col">Organization</th><th scope="col">Main crops</th><th scope="col">Listings</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + orgs.map(o => '<tr><td><div class="table-product"><img class="round" src="assets/' + o.image + '" alt=""><div><strong>' + de(o.name) + '</strong><small>' + de(o.region) + '</small></div></div></td><td>' + de(o.crop) + '</td><td>' + o.listings + '</td><td>' + ds(o.status) + '</td><td><div class="row-actions"><button class="control small' + (o.status === 'Pending review' ? ' primary' : '') + '" data-organization="' + de(o.name) + '">' + (o.status === 'Pending review' ? 'Review application' : 'View') + '</button></div></td></tr>').join('') + '</tbody></table>' : dashEmpty('No matching organizations', 'Try a different name, place or status.');
    return '<section class="panel">' + dashPanelHead('Farmer organizations', '', '<span class="filter-summary">Fictional sample records</span>') + dashFilters(statuses, orgs.length + (orgs.length === 1 ? ' organization' : ' organizations')) + '<div class="table-wrap">' + table + '</div></section>';
}
function dashPeople() {
    const people = dashboardPeople.filter(p => dashMatching(Object.values(p).join(' ')));
    return '<section class="panel">' + dashPanelHead('Registered users', '', '<span class="filter-summary">' + people.length + ' sample accounts</span>') + '<div class="table-wrap">' + (people.length ? '<table><thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Joined</th><th scope="col">Status</th></tr></thead><tbody>' + people.map(p => '<tr><td><strong>' + de(p.name) + '</strong></td><td>' + de(p.email) + '</td><td>' + p.role + '</td><td>' + p.joined + '</td><td>' + ds(p.status) + '</td></tr>').join('') + '</tbody></table>' : dashEmpty('No matching users', 'Try a different name, email or role.')) + '</div></section>';
}
/* ---------- Organization: one farmer organization's own workspace ---------- */
function dashOrgOverview() {
    const p = dashboardOrgPeriods[dashState.period];
    const orders = dashRoleOrders();
    const crops = dashRoleCrops();
    const open = orders.filter(o => dashNextStep[o.status]);
    const metrics = '<div class="metric-grid">' + dashMetric('Order value', dp(p.value), 'wallet', 'Placed with your organization', '9.4%') + dashMetric('Orders received', String(p.orders), 'bag', dashState.period === 'week' ? 'This week' : 'This month', '6.3%') + dashMetric('Orders to fulfil', String(open.length), 'clock', 'Waiting on your next step') + dashMetric('Active listings', String(crops.filter(c => c.status === 'Active' && c.stock > 0).length), 'box', crops.length + ' listings in total') + '</div>';
    const queue = '<section class="panel">' + dashPanelHead('Needs your action', 'Orders waiting on your next step', '<button class="text-button" data-go="orders">All orders ' + di('arrow') + '</button>') + '<div class="queue">' + (open.length ? open.slice(0, 4).map(o => '<div class="queue-row"><img src="assets/' + o.image + '" alt=""><div><strong>' + de(o.crop) + ' · ' + de(o.quantity) + '</strong><small>' + o.id.replace('AB-2026-', '#') + ' · ' + de(o.customer) + ' · ' + dp(o.total) + '</small><div class="queue-actions">' + ds(o.status) + '<button class="control small primary" data-advance="' + o.id + '">' + dashNextStep[o.status][1] + '</button></div></div></div>').join('') : dashEmpty('All caught up', 'No orders are waiting on you.')) + '</div></section>';
    const stock = '<section class="panel">' + dashPanelHead('Stock watch', 'Lowest stock first', '<button class="text-button" data-go="listings">Manage ' + di('arrow') + '</button>') + '<div class="stock-list">' + crops.slice().sort((a, b) => a.stock - b.stock).slice(0, 4).map(c => '<div class="stock-row"><img src="assets/' + c.image + '" alt=""><div><div class="stock-row-top"><strong>' + de(c.name) + '</strong>' + ds(dashCropStatus(c)) + '</div><div class="meter" role="img" aria-label="' + c.stock + ' ' + c.unit + ' available"><i style="width:' + Math.min(100, Math.round(c.stock / 150 * 100)) + '%"></i></div><small>' + c.stock + ' ' + c.unit + ' available</small></div></div>').join('') + '</div></section>';
    return metrics + '<div class="split">' + dashChart(p, 'Placed order totals for your organization', 'Orders placed with your organization') + queue + '</div><div class="split">' + dashOrderTable('recent') + stock + '</div>';
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
/* ---------- Shared product, organization and consumer views ---------- */
function dashProductGrid(savedOnly = false) {
    const crops = dashRoleCrops().filter(c => (!savedOnly || dashState.saved.has(c.id)) && dashMatching(c.name + ' ' + c.organization + ' ' + c.category));
    const tile = (c) => {
        const saved = dashState.saved.has(c.id);
        const badge = isConsumerDashboard ? '<button class="save-button" data-save="' + c.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? 'Unsave ' : 'Save ') + de(c.name) + '">' + di('heart') + '</button>' : ds(dashCropStatus(c));
        const note = isConsumerDashboard ? 'Direct from the growing community' : c.stock + ' ' + c.unit + ' available';
        const action = isAdminDashboard ? '<button class="control small primary" data-product="' + c.id + '">View listing ' + di('arrow') + '</button>' : isOrgDashboard ? '<span class="row-actions"><button class="control small" data-toggle-listing="' + c.id + '"' + (c.stock === 0 ? ' disabled' : '') + '>' + (c.status === 'Active' ? 'Pause' : 'Resume') + '</button><button class="control small primary" data-product="' + c.id + '">Details</button></span>' : '<a class="control small primary" href="/products?q=' + encodeURIComponent(c.name) + '">Find harvest ' + di('up') + '</a>';
        return '<article class="product-tile"><img src="assets/' + c.image + '" alt="' + de(c.name) + '"><div class="product-tile-copy"><div class="product-tile-head"><h2>' + de(c.name) + '</h2>' + badge + '</div><p>' + (isOrgDashboard ? c.category + ' · ' + c.id : de(c.organization) + '<br>' + c.category) + '</p><div class="product-price"><strong>' + dp(c.price) + '</strong> / ' + c.unit + '</div><div class="product-bottom"><small>' + note + '</small>' + action + '</div></div></article>';
    };
    return crops.length ? '<div class="product-grid">' + crops.map(tile).join('') + '</div>' : '<section class="panel">' + dashEmpty(savedOnly ? 'No saved harvests here yet.' : 'No matching listings.', savedOnly ? 'Explore a harvest and save it to see it here.' : 'Try a different search.') + '</section>';
}
function dashOrganizationGrid() {
    const orgs = dashboardOrganizations.filter(o => o.status === 'Active' && dashMatching(o.name + ' ' + o.region));
    return orgs.length ? '<div class="org-grid">' + orgs.map(o => '<article class="org-card"><img src="assets/' + o.image + '" alt="Illustrative ' + de(o.crop) + '"><div><h2>' + de(o.name) + '</h2><p>' + de(o.region) + ' · ' + de(o.crop) + '</p><footer><span class="filter-summary">' + o.listings + ' listings</span><button class="control" data-organization="' + de(o.name) + '">View community ' + di('up') + '</button></footer></div></article>').join('') + '</div>' : '<section class="panel">' + dashEmpty('No matching communities', 'Try a different place or name.') + '</section>';
}
function dashActiveOrder() {
    const order = dashboardOrders[0];
    return '<section class="panel">' + dashPanelHead('Your harvest is coming together.', '', '<span class="filter-summary">#1048</span>') + '<div class="active-order"><div class="active-order-top"><img src="assets/vegetable-cutout.png" alt="Vegetable basket"><div><h3>Highland vegetable basket</h3><p>Benguet Highland Growers · 3 items</p></div>' + ds('Processing') + '</div><div class="order-progress">' + ['Placed', 'Confirmed', 'Preparing', 'Completed'].map((s, i) => '<div class="progress-step ' + (i < 2 ? 'done' : i === 2 ? 'current' : '') + '"><i></i>' + s + '</div>').join('') + '</div><div class="active-order-foot"><p>Good things take a little care.<br>Your grower is preparing your order.</p><button class="control primary" data-order="' + order.id + '">View order ' + di('arrow') + '</button></div></div></section>';
}
function dashConsumerOverview() {
    const own = dashRoleOrders();
    return '<section class="consumer-banner"><div class="eyebrow">Rooted in community. Grown for you.</div><h2>Fresh from their fields.<br>A little closer to your table.</h2><p>Meet the people behind your everyday food.</p><a class="control primary" href="/products">Explore the harvest ' + di('up') + '</a><img class="banner-harvest" src="assets/vegetable-cutout.png" alt=""><img class="banner-leaf" src="assets/mango-branch.png" alt=""></section><div class="metric-grid">' + dashMetric('Active orders', String(own.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length), 'bag', 'Being prepared by your growers') + dashMetric('Completed orders', String(own.filter(o => o.status === 'Completed').length), 'check', 'Local harvests brought home') + dashMetric('Saved harvests', String(dashState.saved.size), 'heart', 'Good things to come back to') + dashMetric('Growing connections', '3', 'leaf', 'Communities you’ve ordered from') + '</div><div class="split">' + dashActiveOrder() + '<section class="panel grower-mini"><img src="assets/grower.png" alt="Illustrative grower in the highlands"><div class="grower-mini-copy"><small>The people behind your harvest</small><h2>Rooted in the<br>Benguet highlands.</h2><a href="#growers">Meet your growing community ' + di('up') + '</a></div></section></div><div class="split">' + dashOrderTable('recent') + '<section class="panel">' + dashPanelHead('Saved for later', '', '<button class="text-button" data-go="saved">View all ' + di('arrow') + '</button>') + '<div class="saved-mini">' + dashboardCrops.filter(c => dashState.saved.has(c.id)).slice(0, 4).map(c => '<div class="saved-row"><img src="assets/' + c.image + '" alt=""><div><strong>' + de(c.name) + '</strong><p>' + dp(c.price) + ' / ' + c.unit + '</p></div><button class="save-button" data-save="' + c.id + '" aria-pressed="true" aria-label="Unsave ' + de(c.name) + '">' + di('heart') + '</button></div>').join('') + (dashState.saved.size ? '' : dashEmpty('Nothing saved yet', 'Your saved harvests will appear here.')) + '</div></section></div>';
}
function dashSettings() {
    const appearance = '<section class="panel settings-panel"><h2>Appearance</h2><p>Adjust this preview to your preferred reading density.</p><div class="settings-row"><label for="density">Compact table rows</label><input type="checkbox" id="density" ' + (document.body.classList.contains('compact-density') ? 'checked' : '') + '></div><div class="settings-row"><label for="contrast">Stronger contrast</label><input type="checkbox" id="contrast" ' + (document.body.classList.contains('contrast-mode') ? 'checked' : '') + '></div><p>Appearance preferences apply only to this open preview.</p></section>';
    const facts = (rows) => '<dl class="detail-facts">' + rows.map(r => '<div><dt>' + r[0] + '</dt><dd>' + de(r[1]) + '</dd></div>').join('') + '</dl>';
    const o = dashboardOrgProfile;
    const account = isAdminDashboard
        ? '<section class="panel settings-panel"><h2>Administrator access</h2><p>This is a visual preview with fictional platform data. Production administrator access remains protected by the application’s existing role checks.</p><div class="detail-actions"><a class="control primary" href="/admin/settings">Open application settings ' + di('up') + '</a></div></section>'
        : isOrgDashboard
            ? '<section class="panel settings-panel"><h2>' + de(o.name) + '</h2><p>' + ds('Active') + ' &nbsp;' + de(o.verified) + '</p>' + facts([['Region', o.region], ['Main crops', o.crops], ['Representative', o.representative], ['Contact email', o.email]]) + '<div class="detail-actions"><a class="control" href="/organizations/benguet-highland-growers">View storefront ' + di('up') + '</a><a class="control primary" href="/organization/profile">Edit in application ' + di('up') + '</a></div></section>'
            : '<section class="panel settings-panel"><h2>Your account</h2>' + facts([['Name', dashConsumerName], ['Email', 'alex@example.com'], ['Account type', 'Consumer'], ['Member since', 'October 2026']]) + '<div class="detail-actions"><a class="control primary" href="/profile">Manage profile in application ' + di('up') + '</a></div></section>';
    return '<div class="settings-grid">' + account + appearance + '</div><p class="sample-callout">The preview does not modify any account, order, payment or organization.</p>';
}
function dashHelp() {
    const rows = isAdminDashboard ? [['Review organization applications', '/admin/organizations', 'Organizations'], ['Manage marketplace orders', '/admin/orders', 'Orders'], ['Manage user accounts', '/admin/users', 'Users']]
        : isOrgDashboard ? [['Manage incoming orders', '/organization/orders', 'Orders'], ['Add or edit crop listings', '/organization/listings', 'Listings'], ['Update your organization profile', '/organization/profile', 'Profile']]
            : [['Browse crops and growing communities', '/products', 'Marketplace'], ['Review your orders and their progress', '/orders', 'Orders'], ['Manage your account', '/profile', 'Your profile']];
    return '<section class="panel settings-panel"><h2>Here to help you grow.</h2><p>Find the right place to continue in the AniBayan application.</p>' + rows.map(r => '<div class="settings-row"><span>' + r[0] + '</span><a class="control" href="' + r[1] + '">' + r[2] + ' ' + di('up') + '</a></div>').join('') + '<p>This design preview uses fictional records. Links above open the existing application.</p></section>';
}
function dashNavCount() {
    if (isAdminDashboard)
        return '12';
    const orders = dashRoleOrders();
    return String(isOrgDashboard ? orders.filter(o => o.status === 'Pending').length : orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length);
}
function dashRender() {
    const search = document.getElementById('dashboard-search');
    if (search.value !== dashState.query)
        search.value = dashState.query;
    document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === dashState.view)
        a.setAttribute('aria-current', 'page');
    else
        a.removeAttribute('aria-current'); });
    const count = dashNavCount();
    document.querySelectorAll('[data-nav-count]').forEach(el => { el.textContent = count; el.hidden = count === '0'; });
    const view = dashState.view;
    let content = '';
    if (view === 'overview')
        content = isAdminDashboard ? dashAdminOverview() : isOrgDashboard ? dashOrgOverview() : dashConsumerOverview();
    else if (view === 'orders')
        content = (isAdminDashboard ? '<div class="metric-grid">' + dashMetric('All orders', String(dashboardPeriods[dashState.period].orders), 'bag', 'This reporting period') + dashMetric('Pending', dashState.period === 'week' ? '12' : '44', 'clock', 'Awaiting organization confirmation') + dashMetric('Processing', dashState.period === 'week' ? '28' : '104', 'box', 'Being prepared by growers') + dashMetric('Completed', dashState.period === 'week' ? '94' : '348', 'check', 'Fulfilled organization orders') + '</div>' : '') + dashOrderTable('all');
    else if (view === 'products' || view === 'listings')
        content = dashProductGrid();
    else if (view === 'saved')
        content = '<div class="filters bare"><button class="filter-chip" data-save-view="saved" aria-pressed="' + dashState.savedOnly + '">Saved harvests (' + dashState.saved.size + ')</button><button class="filter-chip" data-save-view="all" aria-pressed="' + !dashState.savedOnly + '">Explore harvests</button></div>' + dashProductGrid(dashState.savedOnly);
    else if (view === 'organizations')
        content = dashOrganizationTable();
    else if (view === 'growers')
        content = dashOrganizationGrid();
    else if (view === 'users')
        content = dashPeople();
    else if (view === 'members')
        content = dashMembers();
    else if (view === 'payments')
        content = isOrgDashboard ? dashOrgPayments() : dashOrderTable('payments');
    else if (view === 'reports')
        content = dashAdminMetrics() + '<div class="split">' + dashAdminChart() + dashDonut() + '</div><p class="sample-callout">Placed order value is shown separately from payment status. Export CSV downloads the sample orders for review.</p>';
    else if (view === 'settings')
        content = dashSettings();
    else
        content = dashHelp();
    document.getElementById('dashboard-content').innerHTML = dashHeading() + content + '<footer class="design-note"><span>AniBayan · ' + dashRole.workspace + '</span><span>Design preview · fictional sample data</span></footer>';
}
function dashNavigate(view) { location.hash = view; }
function dashOpen(html) { document.getElementById('detail-content').innerHTML = html; if (!dashDialog.open)
    dashDialog.showModal(); }
function dashOrderDetails(id) {
    const order = dashRoleOrders().find(o => o.id === id);
    if (!order)
        return;
    const current = ['Pending', 'Confirmed', 'Processing', 'Completed'].indexOf(order.status);
    const next = isOrgDashboard ? dashNextStep[order.status] : undefined;
    const actions = next ? (order.status === 'Pending' ? '<button class="control danger" data-decline="' + order.id + '">Decline order</button>' : '') + '<button class="control primary" data-advance="' + order.id + '">' + next[1] + '</button>' : '<button class="control primary" data-close-dialog>Close details</button>';
    const timeline = order.status === 'Cancelled' ? '<p class="detail-note">This order was cancelled and will not be fulfilled.</p>' : '<ol class="timeline">' + ['Order placed', 'Confirmed by grower', 'Harvest being prepared', 'Order completed'].map((s, i) => '<li class="' + (i > current ? 'future' : '') + '"><strong>' + s + '</strong><p>' + (i > current ? 'Not reached yet' : i === current ? 'Current status' : 'Completed step') + '</p></li>').join('') + '</ol>';
    dashOpen('<p class="detail-kicker">' + (isAdminDashboard ? 'Marketplace order' : isOrgDashboard ? 'Incoming order' : 'Your order') + '</p><h2 id="detail-title">' + order.id + '</h2><p class="detail-subtitle">' + de(order.organization) + '</p><div class="detail-hero"><img src="assets/' + order.image + '" alt="' + de(order.crop) + '"><div><h3>' + de(order.crop) + '</h3><p>' + de(order.quantity) + ' · ' + dp(order.total) + '</p></div></div><dl class="detail-facts"><div><dt>Order status</dt><dd>' + ds(order.status) + '</dd></div><div><dt>Payment</dt><dd>' + ds(order.payment) + '</dd></div><div><dt>Placed on</dt><dd>' + dd(order.date) + ', 2026</dd></div><div><dt>Buyer</dt><dd>' + de(order.customer) + '</dd></div></dl>' + timeline + '<p class="detail-note">Fictional preview order. ' + (isOrgDashboard ? 'Status changes stay in this open preview only.' : 'No delivery location, payment, cancellation, or fulfillment action is submitted.') + '</p><div class="detail-actions">' + actions + '</div>');
}
function dashProductDetails(id) {
    const crop = dashboardCrops.find(c => c.id === id);
    dashOpen('<p class="detail-kicker">Product listing · ' + crop.id + '</p><h2 id="detail-title">' + de(crop.name) + '</h2><p class="detail-subtitle">' + de(crop.organization) + '</p><div class="detail-hero"><img src="assets/' + crop.image + '" alt="' + de(crop.name) + '"><div><h3>' + dp(crop.price) + ' / ' + crop.unit + '</h3><p>' + crop.category + '</p></div></div><dl class="detail-facts"><div><dt>Available quantity</dt><dd>' + crop.stock + ' ' + crop.unit + '</dd></div><div><dt>Listing status</dt><dd>' + ds(dashCropStatus(crop)) + '</dd></div></dl><p class="detail-note">' + (isOrgDashboard ? 'Illustrative listing. Edit price, stock and photos in the AniBayan application.' : 'Illustrative listing. Administrator review is read-only in this preview.') + '</p>' + (isOrgDashboard ? '<div class="detail-actions"><a class="control primary" href="/organization/listings">Edit in application ' + di('up') + '</a></div>' : ''));
}
function dashOrganizationDetails(name) {
    const org = dashboardOrganizations.find(o => o.name === name);
    const pending = isAdminDashboard && org.status === 'Pending review';
    dashOpen('<p class="detail-kicker">' + (isAdminDashboard ? (pending ? 'Organization application' : 'Farmer organization') : 'Growing community') + '</p><h2 id="detail-title">' + de(org.name) + '</h2><p class="detail-subtitle">' + de(org.region) + '</p><div class="detail-hero"><img src="assets/' + org.image + '" alt="Illustrative community image"><div><h3>' + de(org.crop) + '</h3><p>' + org.listings + ' listings · ' + ds(org.status) + '</p></div></div><p class="detail-note">Fictional organization profile. ' + (isAdminDashboard ? 'Approving or declining here only changes this open preview; real approvals remain in the protected application.' : 'Discover local growing communities in the marketplace.') + '</p><div class="detail-actions">' + (pending ? '<button class="control danger" data-review="Declined" data-review-name="' + de(org.name) + '">Decline</button><button class="control primary" data-review="Active" data-review-name="' + de(org.name) + '">' + di('check') + 'Approve organization</button>' : '<a class="control primary" href="/products">' + (isAdminDashboard ? 'Open storefront ' : 'Explore the marketplace ') + di('up') + '</a>') + '</div>');
}
let dashToastTimeout;
function dashToast(message) { const el = document.getElementById('dashboard-toast'); el.textContent = message; el.classList.add('visible'); window.clearTimeout(dashToastTimeout); dashToastTimeout = window.setTimeout(() => el.classList.remove('visible'), 2600); }
function dashExport() {
    const view = dashState.view;
    let rows = [['Order ID', 'Customer', 'Organization', 'Crop', 'Quantity', 'Total PHP', 'Status', 'Payment', 'Date'], ...dashOrders().map(o => [o.id, o.customer, o.organization, o.crop, o.quantity, o.total, o.status, o.payment, o.date])];
    let recordType = 'orders';
    if (view === 'products' || view === 'listings') {
        recordType = view;
        rows = [['Product ID', 'Name', 'Organization', 'Category', 'Price PHP', 'Unit', 'Available quantity', 'Status'], ...dashRoleCrops().filter(c => dashMatching(c.name + ' ' + c.organization + ' ' + c.category)).map(c => [c.id, c.name, c.organization, c.category, c.price, c.unit, c.stock, dashCropStatus(c)])];
    }
    if (view === 'organizations') {
        recordType = 'organizations';
        rows = [['Organization', 'Region', 'Crops', 'Listings', 'Status'], ...dashboardOrganizations.filter(o => dashMatching(o.name + ' ' + o.region + ' ' + o.crop)).map(o => [o.name, o.region, o.crop, o.listings, o.status])];
    }
    if (view === 'users') {
        recordType = 'users';
        rows = [['Name', 'Email', 'Role', 'Joined', 'Status'], ...dashboardPeople.filter(p => dashMatching(Object.values(p).join(' '))).map(p => [p.name, p.email, p.role, p.joined, p.status])];
    }
    if (view === 'members') {
        recordType = 'members';
        rows = [['Farmer', 'Location', 'Crops', 'Area ha', 'Member since', 'Status'], ...dashboardMembers.filter(m => dashMatching(Object.values(m).join(' '))).map(m => [m.name, m.place, m.crops, m.area, m.joined, m.status])];
    }
    const csv = '﻿' + rows.map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'anibayan-' + dashboardRole + '-sample-' + recordType + '.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    dashToast('Sample ' + recordType + ' exported as CSV.');
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
        dashNavigate(data.go);
        return;
    }
    if (data.advance || data.decline) {
        const order = dashboardOrders.find(o => o.id === (data.advance || data.decline));
        order.status = data.decline ? 'Cancelled' : dashNextStep[order.status][0];
        dashRender();
        if (dashDialog.open)
            dashOrderDetails(order.id);
        dashToast('Order ' + order.id.replace('AB-2026-', '#') + ' marked ' + order.status.toLowerCase() + ' in this preview.');
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
        dashDialog.close();
        dashRender();
        dashToast(org.name + (data.review === 'Active' ? ' approved' : ' declined') + ' in this preview.');
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
        dashOrganizationDetails(data.organization);
        return;
    }
    if (data.filter) {
        dashState.filter = data.filter;
        dashRender();
        return;
    }
    if (data.saveView) {
        dashState.savedOnly = data.saveView === 'saved';
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
});
dashDialog.addEventListener('click', event => { if (event.target === dashDialog) {
    const r = dashDialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)
        dashDialog.close();
} });
