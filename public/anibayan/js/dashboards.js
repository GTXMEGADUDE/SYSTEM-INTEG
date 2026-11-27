"use strict";
const dashTodayDate = new Date();
const dashIsoDate = (date) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
const dashToday = dashIsoDate(dashTodayDate);
const dashDaysAgo = (days) => { const date = new Date(dashTodayDate); date.setDate(date.getDate() - days); return dashIsoDate(date); };
// The data itself comes from AniBayan's server (see shared.ts); these lists hold the signed-in person's copy.
// The starting data is in database/seeders/DatabaseSeeder.php.
const dashboardOrders = [];
const dashboardCrops = [];
const dashboardOrganizations = [];
const dashboardAccounts = [];
const dashboardFeedback = [];
const dashboardReports = [];
const dashboardWarnings = [];
const dashboardActivity = [];
const dashboardMembers = [];
// Saved harvests and shopping carts, keyed by buyer email (only the signed-in buyer's).
const dashboardSaved = {};
const dashboardCarts = {};
// Results of the admin site-health checks, oldest first; the server keeps the newest 30 runs.
const dashboardHealthLog = [];
// AniBayan serves Calapan City, Oriental Mindoro only. Organizations and delivery addresses pick one of its
// 62 barangays (names from Philippines JSON Maps, PSGC 2026-3q). An organization's region is "<barangay>, Calapan City".
const dashCityName = 'Calapan City';
let dashBarangays = ['Balingayan', 'Balite', 'Baruyan', 'Batino', 'Bayanan I', 'Bayanan II', 'Biga', 'Bondoc', 'Bucayao', 'Buhuan', 'Bulusan', 'Calero', 'Camansihan', 'Camilmil', 'Canubing I', 'Canubing II', 'Comunal', 'Guinobatan', 'Gulod', 'Gutad', 'Ibaba East', 'Ibaba West', 'Ilaya', 'Lalud', 'Lazareto', 'Libis', 'Lumangbayan', 'Mahal Na Pangalan', 'Maidlang', 'Malad', 'Malamig', 'Managpi', 'Masipit', 'Nag-Iba I', 'Nag-Iba II', 'Navotas', 'Pachoca', 'Palhi', 'Panggalaan', 'Parang', 'Patas', 'Personas', 'Puting Tubig', 'Salong', 'San Antonio', 'San Vicente Central', 'San Vicente East', 'San Vicente North', 'San Vicente South', 'San Vicente West', 'Sapul', 'Silonay', 'Sta. Cruz', 'Sta. Isabel', 'Sta. Maria Village', 'Sta. Rita', 'Sto. Niño', 'Suqui', 'Tawagan', 'Tawiran', 'Tibag', 'Wawa'];
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
// and talking to AniBayan's server, which holds the data.
const de = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dashPlural = (count, word) => count + ' ' + word + (count === 1 ? '' : 's');
const dashPhonePattern = /^(\+63[\s-]?|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/;
// Phone fields take digits, spaces, dashes and a leading +, and stop at 12 digits (+63 917 555 0148).
const dashPhoneMaxDigits = 12;
const dashPhoneInput = 'type="tel" required maxlength="16" autocomplete="tel"';
function dashLimitPhone(input) {
    let digits = 0;
    const kept = input.value.replace(/[^\d+\s-]/g, '').replace(/(?!^)\+/g, '').split('').filter(c => !/\d/.test(c) || ++digits <= dashPhoneMaxDigits).join('');
    if (kept !== input.value)
        input.value = kept;
}
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
const dashPasswordEye = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
const dashPasswordEyeOff = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a16.2 16.2 0 0 1-3.2 3.9"/><path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.1-.9"/></svg>';
function dashSetupPasswordToggles(root) {
    root.querySelectorAll('input[type="password"][data-password-toggle-input]').forEach(input => {
        if (input.closest('.password-control'))
            return;
        const parent = input.parentElement;
        if (!parent)
            return;
        const wrapper = document.createElement('span');
        wrapper.className = 'password-control';
        parent.insertBefore(wrapper, input);
        wrapper.append(input);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'password-toggle';
        button.dataset.passwordToggle = 'true';
        button.setAttribute('aria-label', 'Show password');
        button.setAttribute('aria-pressed', 'false');
        if (input.id)
            button.setAttribute('aria-controls', input.id);
        button.title = 'Show password';
        button.innerHTML = dashPasswordEye;
        wrapper.append(button);
    });
}
dashSetupPasswordToggles(document);
document.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element))
        return;
    const button = target.closest('button[data-password-toggle]');
    const input = button?.parentElement?.querySelector('input[data-password-toggle-input]');
    if (!button || !input)
        return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(show));
    button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    button.title = show ? 'Hide password' : 'Show password';
    button.innerHTML = show ? dashPasswordEyeOff : dashPasswordEye;
});
let dashSessionMe = '';
// Set when the server signed this person out because the account is no longer active ("suspended", "terminated").
let dashBlockedStatus = '';
let dashBlockedReason = '';
// True when the server couldn't be reached when the page loaded.
let dashOffline = false;
let dashPrefs = {};
function dashReplaceList(target, source) { target.splice(0, target.length, ...(Array.isArray(source) ? source : [])); }
function dashReplaceRecord(target, source) {
    Object.keys(target).forEach(key => delete target[key]);
    if (source && typeof source === 'object')
        Object.assign(target, source);
}
function dashApplyState(s) {
    dashReplaceList(dashboardOrders, s.orders);
    dashReplaceList(dashboardCrops, s.crops);
    dashReplaceList(dashboardOrganizations, s.organizations);
    dashReplaceList(dashboardAccounts, (s.accounts || []).map(a => ({ ...a, email: a.email || '', joined: a.joined || '', lastActive: a.lastActive || '' })));
    dashReplaceList(dashboardFeedback, s.feedback);
    dashReplaceList(dashboardReports, s.reports);
    dashReplaceList(dashboardWarnings, s.warnings);
    dashReplaceList(dashboardActivity, s.activity);
    dashReplaceList(dashboardMembers, s.members);
    dashReplaceList(dashboardHealthLog, s.healthLog);
    dashReplaceRecord(dashboardSaved, s.saved);
    dashReplaceRecord(dashboardCarts, s.carts);
    dashSessionMe = s.me || '';
    dashBlockedStatus = s.blocked || '';
    dashBlockedReason = s.blockedReason || '';
    if (Array.isArray(s.barangays) && s.barangays.length)
        dashReplaceList(dashBarangays, s.barangays);
    dashPrefs = s.preferences || {};
}
// The dashboards' loader (in their HTML) fetches the data before the script runs; this applies it.
function dashLoadStore() {
    const state = window.anibayanState;
    if (state && Array.isArray(state.orders))
        dashApplyState(state);
    else
        dashOffline = true;
}
// What the pages say when something goes wrong that isn't about what the person typed. Server errors never reach the
// page as they are: the server only sends messages AniBayan wrote (bootstrap/app.php), and the page shows a generic
// one for anything else.
const dashGenericError = 'Something went wrong. Try again in a moment.';
const dashOfflineError = 'AniBayan can’t be reached right now. Check your connection and try again.';
function dashMessage(r, fallback = dashGenericError) {
    const message = typeof r.data.message === 'string' ? r.data.message : '';
    return message && (r.status === 0 || (r.status >= 400 && r.status < 500)) ? message : fallback;
}
function dashCookie(name) { const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)')); return match ? decodeURIComponent(match[1]) : ''; }
// GET when there is no body, otherwise a POST with the anti-forgery token Laravel set as the XSRF-TOKEN cookie.
// A FormData body (files) goes as multipart; anything else as JSON.
async function dashApi(path, body, retried = false) {
    const headers = { Accept: 'application/json' };
    const multipart = body instanceof FormData;
    if (body !== undefined) {
        if (!multipart)
            headers['Content-Type'] = 'application/json';
        headers['X-XSRF-TOKEN'] = dashCookie('XSRF-TOKEN');
    }
    try {
        const response = await fetch('../api/' + path, { method: body === undefined ? 'GET' : 'POST', headers, credentials: 'same-origin', cache: 'no-store', body: body === undefined ? undefined : multipart ? body : JSON.stringify(body) });
        // 419: the anti-forgery token expired; fetching the data renews it.
        if (response.status === 419 && !retried) {
            await dashApi('state');
            return dashApi(path, body, true);
        }
        const data = await response.json().catch(() => ({}));
        return { ok: response.ok, status: response.status, data };
    }
    catch {
        return { ok: false, status: 0, data: { message: dashOfflineError } };
    }
}
async function dashFetchState() {
    const r = await dashApi('state');
    if (r.ok && Array.isArray(r.data.orders)) {
        dashOffline = false;
        dashApplyState(r.data);
        return true;
    }
    dashOffline = true;
    return false;
}
const dashSessionEmail = () => dashSessionMe;
// Laravel's field errors ({field:["message"]}) as one message per field, for dashShowErrors.
function dashFieldErrors(errors) {
    const out = {};
    if (errors && typeof errors === 'object')
        Object.entries(errors).forEach(([key, value]) => { out[key.replace(/\.\d+$/, '')] = Array.isArray(value) ? String(value[0]) : String(value); });
    return out;
}
// Public profiles carry no email, so an empty email never matches.
const dashAccountByEmail = (email) => email.trim() ? dashboardAccounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase()) : undefined;
const dashHomeForRole = (role) => role === 'Administrator' ? 'admin.html' : role === 'Representative' ? 'organization.html' : 'consumer.html';
const dashHomeFor = (account) => dashHomeForRole(account.role);
const dashRoleAttr = document.body.dataset.dashboard;
const dashboardRole = dashRoleAttr === 'admin' || dashRoleAttr === 'organization' ? dashRoleAttr : 'consumer';
const isAdminDashboard = dashboardRole === 'admin';
const isOrgDashboard = dashboardRole === 'organization';
const isConsumerDashboard = dashboardRole === 'consumer';
dashLoadStore();
/* ---------- Display preferences (saved with the signed-in account) ---------- */
function dashApplyPreferences() {
    document.body.classList.toggle('compact-density', !!dashPrefs.compact);
    document.body.classList.toggle('contrast-mode', !!dashPrefs.contrast);
}
function dashSavePreferences() {
    if (dashSessionEmail())
        void dashDo('preferences', { compact: document.body.classList.contains('compact-density'), contrast: document.body.classList.contains('contrast-mode') });
}
dashApplyPreferences();
/* ---------- Who is signed in ---------- */
const dashSignedIn = dashAccountByEmail(dashSessionEmail());
const dashActive = dashSignedIn && dashSignedIn.status === 'Active' ? dashSignedIn : undefined;
const dashPageRole = isAdminDashboard ? 'Administrator' : isOrgDashboard ? 'Representative' : 'Consumer';
const dashNeedsSignIn = !isConsumerDashboard && (!dashActive || dashActive.role !== dashPageRole);
const dashBuyer = isConsumerDashboard && dashActive && dashActive.role === 'Consumer' ? dashActive : undefined;
const isGuest = isConsumerDashboard && !dashBuyer;
const dashMeEmail = isConsumerDashboard ? (dashBuyer ? dashBuyer.email : '') : (dashNeedsSignIn || !dashActive ? '' : dashActive.email);
const dashMe = () => dashAccountByEmail(dashMeEmail);
const dashAccount = () => dashMe();
const dashOrgName = isOrgDashboard && dashActive ? dashActive.organization || '' : '';
const dashConsumerName = dashBuyer ? dashBuyer.name : '';
const dashBuyerViews = ['overview', 'cart', 'orders', 'saved', 'payments', 'settings'];
const dashPageFile = () => location.pathname.split('/').pop() || dashboardRole + '.html';
function dashGoToSignIn(notice) { location.href = 'login.html?next=' + encodeURIComponent(dashPageFile() + location.search + location.hash) + '&notice=' + notice; }
// Buyer-only actions send guests to sign in, then back here.
function dashRequireBuyer() { if (!isGuest)
    return true; dashGoToSignIn('buyer'); return false; }
const dashRoot = document.getElementById('dashboard-app');
const dashDialog = document.getElementById('detail-dialog');
const dashShopDefaults = { type: 'All', min: '', max: '', harvest: 'any', location: 'All', sort: 'fresh' };
// bar: the highlighted chart bar; anything past the end selects the newest one.
// profile: the organization or person shown by the profile view (#org=… or #user=…).
const dashState = { view: 'overview', query: '', filter: 'All', nextFilter: '', period: 'week', chart: 'value', hardwareChart: 'cpu', bar: 99, shop: { ...dashShopDefaults }, profile: { kind: 'org', slug: '' } };
const dashCartSelection = new Set();
const dashCartKnown = new Set();
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
    cart: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6 M10 21h.01 M18 21h.01',
    edit: 'M4 20h4L19 9l-4-4L4 16v4Z M13 7l4 4',
    logout: 'M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10',
    key: 'M15 7a4 4 0 1 1-3.9 5H3v4h3v-2h2v2h3.1A4 4 0 0 1 15 7Z',
    image: 'M4 5h16v14H4z M4 15l4-4 4 4 3-3 5 5 M15 9h.01',
    camera: 'M4 8h3l2-3h6l2 3h3v11H4z M15.5 13a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z',
    move: 'M12 3v18 M3 12h18 M9 6l3-3 3 3 M9 18l3 3 3-3 M6 9l-3 3 3 3 M18 9l3 3-3 3',
    close: 'M6 6l12 12 M18 6 6 18',
    verified: 'm12 2 2.4 2.2 3.2-.4.8 3.1 2.8 1.6-1.3 3 1.3 3-2.8 1.6-.8 3.1-3.2-.4L12 22l-2.4-2.2-3.2.4-.8-3.1L2.8 15.5l1.3-3-1.3-3 2.8-1.6.8-3.1 3.2.4L12 2Z m-3.5 10 2.5 2.5 4.5-5',
};
const di = (name) => '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="' + (dashPaths[name] || dashPaths.grid) + '"/></svg>';
const dp = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
const dd = (date) => new Date(date + 'T12:00:00').toLocaleDateString('en-PH', { month: 'short', day: '2-digit' });
const dfull = (date) => new Date(date + 'T12:00:00').toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric' });
const dmonth = (date) => new Date(date + 'T12:00:00').toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
const dtime = (iso) => new Date(iso).toLocaleString('en-PH', { month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' });
const ds = (status) => '<span class="status ' + status.toLowerCase().replace(/ /g, '-') + '">' + de(status) + '</span>';
const dashOrderNo = (id) => id.replace('AB-2026-', '#');
const dashInitials = (name) => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
// Stock photos live in assets/; uploaded photos are saved by the server under uploads/.
const dashImg = (src) => /^(data:|blob:|https?:|uploads\/)/.test(src) ? src : 'assets/' + src;
// A missing upload should never leave a broken-image icon in the marketplace or account pages.
const dashFallbackPhotos = [
    [/sweet[ -]potato/i, 'sweet-potatoes.jpg'], [/\brice\b|\bgrain/i, 'rice.jpg'], [/\bmango/i, 'mango.jpg'], [/\bbanana/i, 'bananas.jpg'],
    [/\bonion/i, 'onion.jpg'], [/\bcarrot/i, 'carrot.jpg'], [/\btomato/i, 'tomatoes.jpg'], [/\beggplant/i, 'eggplant.jpg'], [/\bfruit/i, 'mango.jpg'],
];
function dashInstallImageFallbacks() {
    document.addEventListener('error', event => {
        const image = event.target;
        if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied)
            return;
        image.dataset.fallbackApplied = 'true';
        const context = [image.alt, image.parentElement?.textContent, image.closest('article,section,.panel')?.textContent].filter(Boolean).join(' ').toLowerCase();
        const avatar = image.closest('.avatar');
        if (avatar) {
            const label = avatar.closest('.profile-id')?.querySelector('.profile-name h1,.profile-name h2')?.textContent
                || avatar.closest('.table-product,.organization-row,.sidebar-user,.workspace-account')?.querySelector('strong')?.textContent
                || avatar.parentElement?.querySelector('strong')?.textContent || '';
            if (label.trim()) {
                avatar.replaceChildren(document.createTextNode(dashInitials(label.trim())));
                return;
            }
        }
        const fallback = dashFallbackPhotos.find(([pattern]) => pattern.test(context))?.[1] || 'field-detail.jpg';
        image.src = 'assets/' + fallback;
    }, true);
}
dashInstallImageFallbacks();
/* ---------- Changing data: every change goes to the server ---------- */
const dashInFlight = new Set();
// Sends one action to the server, which checks it, saves it and answers with this person's fresh data; the page
// then redraws. Returns the action's result, or null when it didn't go through (the reason is shown: under the
// form's fields when a form is given, otherwise as a toast). An action already on its way isn't sent again, so a
// double click can't repeat it.
async function dashDo(action, payload = {}, form) {
    if (dashInFlight.has(action))
        return null;
    dashInFlight.add(action);
    document.body.classList.add('is-saving');
    const r = await dashApi('actions/' + action, payload);
    dashInFlight.delete(action);
    if (!dashInFlight.size)
        document.body.classList.remove('is-saving');
    if (r.data.state)
        dashApplyState(r.data.state);
    if (r.status === 401) {
        location.href = 'login.html?notice=signin';
        return null;
    }
    if (r.data.state)
        dashRender();
    if (!r.ok) {
        const errors = dashFieldErrors(r.data.errors);
        const shown = form && Object.keys(errors).some(key => form.querySelector('[data-error-for="' + key + '"]'));
        if (form && shown)
            dashShowErrors(form, errors);
        else
            dashToast(dashMessage(r, 'That didn’t go through. Try again.'));
        return null;
    }
    if (!r.data.state)
        dashRender();
    return (r.data.result || {});
}
/* ---------- Harvest date & shelf life ---------- */
const dashDayNumber = (date) => Math.round(new Date(date + 'T12:00:00').getTime() / 864e5);
const dashAge = (date) => dashDayNumber(dashToday) - dashDayNumber(date);
function dashAddDays(date, days) { const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() + days); return dashIsoDate(d); }
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
// A terminated organization's listings leave the shop.
const dashIsBuyable = (crop) => { const org = dashboardOrganizations.find(o => o.name === crop.organization); return crop.status === 'Active' && crop.stock > 0 && dashFreshness(crop).left >= 0 && org?.status !== 'Terminated' && !org?.stopped; };
function dashRatingOf(org) {
    const ratings = dashboardFeedback.filter(f => f.organization === org).map(f => f.rating);
    return { rating: ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0, reviews: ratings.length };
}
function dashRatingText(org) {
    const r = dashRatingOf(org);
    return r.reviews ? '<span class="rating"><b aria-hidden="true">★</b> ' + r.rating.toFixed(1) + ' <small>(' + dashPlural(r.reviews, 'review') + ')</small></span>' : '<span class="rating">No reviews yet</span>';
}
const dashStars = (rating) => '<span class="stars" role="img" aria-label="Rated ' + rating + ' out of 5">' + '★'.repeat(rating) + '<span class="stars-off">' + '★'.repeat(5 - rating) + '</span></span>';
/* ---------- Organization warnings ---------- */
// Every report an administrator upholds is a warning, and administrators can also warn an organization directly
// for breaking AniBayan's rules. The last of dashWarningLimit warnings is the final warning; the next offence
// terminates the organization: its listings leave the shop and its representative can no longer sign in.
const dashWarningLimit = 3;
function dashWarningsFor(org) {
    const fromReports = dashboardReports.filter(r => r.organization === org && r.status === 'Upheld').map(r => ({ id: r.id, reason: r.reason, details: r.details, date: r.decided || r.date, report: r.id, decisionNote: r.decisionNote }));
    const direct = dashboardWarnings.filter(w => w.organization === org).map(w => ({ id: w.id, reason: w.reason, details: w.details, date: w.date, by: w.by }));
    return fromReports.concat(direct).sort((a, b) => b.date.localeCompare(a.date));
}
function dashStanding(org) {
    const count = dashWarningsFor(org).length;
    const terminated = dashboardOrganizations.find(o => o.name === org)?.status === 'Terminated';
    const final = !terminated && count >= dashWarningLimit;
    const label = terminated ? 'Terminated' : final ? 'Final warning' : count ? count + ' of ' + dashWarningLimit + ' warnings' : 'No warnings';
    return { count, final, terminated, label, tone: terminated ? 'terminated' : final ? 'final-warning' : count ? 'warned' : 'no-warnings' };
}
const dashStandingBadge = (org) => { const s = dashStanding(org); return '<span class="status ' + s.tone + '">' + s.label + '</span>'; };
function dashStandingSentence(org) {
    const s = dashStanding(org);
    return org + (s.terminated ? ' is terminated.' : s.final ? ' is on its final warning.' : s.count ? ' has ' + s.label + '.' : ' has no warnings.');
}
// What the next upheld report or warning does to the organization.
function dashNextOffence(org) {
    const s = dashStanding(org);
    return s.terminated ? 'Nothing more: it is terminated' : s.final ? 'Terminates the organization' : s.count + 1 >= dashWarningLimit ? 'Final warning (' + dashWarningLimit + ' of ' + dashWarningLimit + ')' : 'Warning ' + (s.count + 1) + ' of ' + dashWarningLimit;
}
// One segment per warning before termination.
function dashWarningMeter(org) {
    const s = dashStanding(org);
    return '<div class="warning-meter' + (s.final || s.terminated ? ' final' : '') + '" role="img" aria-label="' + s.label + '">' + Array.from({ length: dashWarningLimit }, (_, i) => '<i' + (i < s.count ? ' class="on"' : '') + '></i>').join('') + '</div>';
}
// Administrators can withdraw a warning they gave; a report's warning goes when the report is reopened.
function dashWarningRows(org, listClass, canWithdraw) {
    return '<div class="' + listClass + '">' + dashWarningsFor(org).map(w => '<article class="feedback-row"><header><strong>' + de(w.reason) + '</strong><small>' + dd(w.date) + '</small></header>' + (w.details ? '<p>' + de(w.details) + '</p>' : '') + (w.decisionNote ? '<p class="detail-note">AniBayan’s explanation: ' + de(w.decisionNote) + '</p>' : '') + '<small>' + (w.report ? 'Upheld report ' + w.report : 'Given by ' + de(w.by || 'AniBayan')) + '</small>' + (canWithdraw && !w.report ? ' <button class="text-button" data-withdraw-warning="' + w.id + '">Withdraw</button>' : '') + '</article>').join('') + '</div>';
}
function dashWarningCallout() {
    const s = dashStanding(dashOrgName);
    if (!s.count)
        return '';
    const latest = dashWarningsFor(dashOrgName)[0];
    return '<div class="warning-callout' + (s.final ? ' final' : '') + '">' + di('flag') + '<span><b>' + s.label + '</b> · ' + de(latest.reason) + '</span><button data-go="feedback">See warnings →</button></div>';
}
const dashRated = (orderId) => dashboardFeedback.some(f => f.order === orderId);
const dashMyReport = (orderId) => dashboardReports.find(r => r.order === orderId && r.customer === dashConsumerName);
const dashRegion = (org) => dashboardOrganizations.find(o => o.name === org)?.region || '';
const dashOpenReports = () => dashboardReports.filter(r => r.status === 'Open').length;
const dashPendingApplications = () => dashboardOrganizations.filter(o => o.status === 'Pending review').length;
const dashListingCount = (org) => dashboardCrops.filter(c => c.organization === org && dashIsBuyable(c)).length;
/* ---------- Profiles: pictures, banners, links and buyer privacy ---------- */
// Profile addresses use the name: #org=canubing-vegetable-growers, #user=alex-reyes.
const dashSlug = (name) => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const dashAccountByName = (name) => dashboardAccounts.find(a => a.name === name);
const dashLookKind = (role) => role === 'Administrator' ? 'admin' : role === 'Representative' ? 'organization' : 'consumer';
// Approved and terminated organizations are public; pending and declined ones only to administrators and their own representative.
const dashOrgVisible = (o) => o.status === 'Active' || o.status === 'Terminated' || isAdminDashboard || o.name === dashOrgName;
function dashOrgLink(name) {
    const o = dashboardOrganizations.find(x => x.name === name);
    return o && dashOrgVisible(o) ? '<a class="profile-link" href="#org=' + dashSlug(name) + '" data-profile-link>' + de(name) + '</a>' : de(name);
}
// Buyers and representatives have profiles; administrators don't.
function dashUserLink(name) {
    const a = dashAccountByName(name);
    return a && a.role !== 'Administrator' ? '<a class="profile-link" href="#user=' + dashSlug(name) + '" data-profile-link>' + de(name) + '</a>' : de(name);
}
// The round picture: the uploaded photo, otherwise initials.
function dashAvatar(look, name, kind, size = '') {
    return '<span class="avatar ' + kind + '-avatar' + (size ? ' ' + size : '') + '">' + (look?.avatar ? '<img src="' + de(look.avatar) + '" alt="">' : de(dashInitials(name))) + '</span>';
}
const dashPrivacyDefaults = { profile: true, reviews: true, city: true, growers: true };
const dashPrivacy = (a) => ({ ...dashPrivacyDefaults, ...(a.privacy || {}) });
// "12 J.P. Rizal Street, Barangay Lalud, Calapan City, Oriental Mindoro" → "Calapan City, Oriental Mindoro".
function dashCity(address) { const parts = (address || '').split(',').map(p => p.trim()).filter(Boolean); return parts.length >= 3 ? parts.slice(-2).join(', ') : ''; }
// A banner without an uploaded photo: the organization's own photo, or a green gradient picked from the buyer's name.
function dashBannerStyle(look, fallback) {
    return look.banner
        ? 'background-image:linear-gradient(135deg,#183f2d20,#183f2d65),url(&quot;' + de(look.banner) + '&quot;),url(&quot;assets/field-detail.jpg&quot;);background-position:center,' + (look.bannerX ?? 50) + '% ' + (look.bannerY ?? 50) + '%,center;background-size:cover,cover,cover'
        : 'background-image:' + fallback + ',url(&quot;assets/field-detail.jpg&quot;);background-position:center,center;background-size:cover,cover';
}
function dashUserBanner(name) {
    const hue = 95 + [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 60;
    return 'linear-gradient(125deg,hsl(' + hue + ' 42% 24%),hsl(' + (hue + 25) + ' 45% 36%) 55%,hsl(' + (hue - 30) + ' 60% 62%))';
}
// target: "org:<name>" or "user:<email>"; data-look carries it to the photo buttons.
function dashLookOf(target) {
    const at = target.indexOf(':');
    const kind = target.slice(0, at), key = target.slice(at + 1);
    return kind === 'org' ? dashboardOrganizations.find(o => o.name === key) : kind === 'user' ? dashAccountByEmail(key) : undefined;
}
// Only the owner changes a profile's photos: the buyer on their own page, or the organization's representative.
function dashCanEdit(target) {
    const at = target.indexOf(':');
    const kind = target.slice(0, at), key = target.slice(at + 1);
    if (kind === 'org')
        return isOrgDashboard && key === dashOrgName && !dashBlocked().length;
    return isConsumerDashboard && !!dashMeEmail && key.toLowerCase() === dashMeEmail.toLowerCase();
}
// The banner, picture and name at the top of a profile. The owner gets the photo buttons.
function dashProfileCard(p) {
    const editable = dashCanEdit(p.target);
    const picker = (kind, content, cls, label) => '<label class="' + cls + '" tabindex="0" role="button"' + (label ? ' aria-label="' + label + '"' : '') + '>' + content + '<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-upload="' + kind + '" data-look="' + de(p.target) + '" hidden></label>';
    const tools = editable ? '<div class="banner-tools">' + picker('banner', di('image') + '<span>' + (p.look.banner ? 'Change banner' : 'Add banner') + '</span>', 'banner-button', '') + (p.look.banner ? '<button class="banner-button" data-reposition="' + de(p.target) + '">' + di('move') + '<span>Reposition</span></button><button class="banner-button" data-remove-photo="banner" data-look="' + de(p.target) + '">' + di('close') + '<span>Remove</span></button>' : '') + '</div><div class="banner-actions" hidden><button class="banner-button" data-reposition-cancel>Cancel</button><button class="banner-button primary" data-reposition-save>' + di('check') + 'Save position</button></div>' : '';
    const photo = editable ? picker('avatar', di('camera'), 'avatar-button', 'Change picture') + (p.look.avatar ? '<button class="avatar-button remove" data-remove-photo="avatar" data-look="' + de(p.target) + '" aria-label="Remove picture">' + di('close') + '</button>' : '') : '';
    return '<section class="panel profile-card"><div class="profile-banner" data-banner="' + de(p.target) + '" style="' + dashBannerStyle(p.look, p.fallback) + '">' + tools + '</div><div class="profile-id"><div class="profile-avatar">' + dashAvatar(p.look, p.name, p.kind, 'avatar-xl') + photo + '</div><div class="profile-name"><' + p.heading + '>' + de(p.name) + '</' + p.heading + '><p>' + p.line + '</p>' + (p.badges ? '<div class="profile-badges">' + p.badges + '</div>' : '') + '</div>' + (p.actions ? '<div class="profile-actions">' + p.actions + '</div>' : '') + '</div>' + (p.about ? '<p class="profile-about">' + p.about + '</p>' : '') + '</section>';
}
function dashOrgCard(o, heading, actions) {
    const r = dashRatingOf(o.name);
    const badges = (o.status === 'Active' ? '<span class="status verified">' + di('verified') + 'Verified</span>' : ds(o.status)) + (r.reviews ? dashRatingText(o.name) : '');
    return dashProfileCard({ look: o, target: 'org:' + o.name, name: o.name, kind: 'organization', fallback: 'url(&quot;' + de(dashImg(o.image)) + '&quot;)', line: de(o.region) + ' · ' + de(o.crop) + (o.approved ? ' · Since ' + dmonth(o.approved) : ''), badges, actions, about: o.description ? de(o.description) : '', heading });
}
function dashUserCard(a, heading, actions, showCity) {
    const p = dashPrivacy(a);
    const city = showCity ? a.city || dashCity(a.address) : '';
    const line = (a.role === 'Consumer' ? 'Buyer' : 'Representative · ' + dashOrgLink(a.organization || '')) + (a.joined ? ' · Joined ' + dmonth(a.joined) : '') + (city ? ' · ' + de(city) : '');
    const badges = (a.role === 'Consumer' && !p.profile ? '<span class="status private">' + di('lock') + 'Private</span>' : '') + (a.status !== 'Active' && isAdminDashboard ? ds(a.status) : '');
    return dashProfileCard({ look: a, target: 'user:' + (a.email || ''), name: a.name, kind: dashLookKind(a.role), fallback: dashUserBanner(a.name), line, badges, actions, about: '', heading });
}
const dashProfileMissing = () => '<section class="panel">' + dashEmpty('This profile isn’t available.', '') + '<div class="empty-action"><button class="control" data-go="' + dashRole.nav[0][0] + '">' + di('arrow') + 'Back</button></div></section>';
function dashReviewRow(f, by) {
    const a = by === 'customer' ? dashAccountByName(f.customer) : undefined;
    const o = by === 'organization' ? dashboardOrganizations.find(x => x.name === f.organization) : undefined;
    const who = by === 'customer' ? dashAvatar(a, f.customer, dashLookKind(a?.role || 'Consumer'), 'avatar-sm') + dashUserLink(f.customer) : dashAvatar(o, f.organization, 'organization', 'avatar-sm') + dashOrgLink(f.organization);
    return '<article class="feedback-row review-row"><header><span class="review-who">' + who + '</span><span class="review-meta">' + dashStars(f.rating) + '<small>' + dd(f.date) + '</small></span></header><p>' + (f.comment ? '“' + de(f.comment) + '”' : 'No comment left.') + '</p></article>';
}
function dashOrgProfileView(slug) {
    const o = dashboardOrganizations.find(x => dashSlug(x.name) === slug && dashOrgVisible(x));
    if (!o)
        return dashProfileMissing();
    const own = isOrgDashboard && o.name === dashOrgName;
    const r = dashRatingOf(o.name);
    const crops = dashboardCrops.filter(c => c.organization === o.name && dashIsBuyable(c));
    const members = dashboardMembers.filter(m => m.organization === o.name).length || o.members;
    const completed = o.completedOrders ?? 0;
    const mine = dashRoleOrders().filter(x => x.organization === o.name);
    const toRate = isConsumerDashboard ? mine.find(x => x.status === 'Completed' && !dashRated(x.id)) : undefined;
    const toReport = isConsumerDashboard ? mine.find(x => !dashMyReport(x.id)) : undefined;
    const actions = own ? '<button class="control" data-edit-org-profile>' + di('edit') + 'Edit profile</button>'
        : isAdminDashboard ? '<button class="control" data-organization="' + de(o.name) + '">' + di('shield') + 'Review organization</button>'
            : (toReport ? '<button class="control" data-report-order="' + toReport.id + '">' + di('flag') + 'Report a problem</button>' : '') + (toRate ? '<button class="control primary" data-rate="' + toRate.id + '">' + di('star') + 'Rate your order</button>' : '');
    const reviews = dashboardFeedback.filter(f => f.organization === o.name).sort((a, b) => b.date.localeCompare(a.date));
    const metrics = '<div class="metric-grid">' + dashMetric('Harvests listed', String(crops.length), 'box', '') + dashMetric('Buyer rating', r.reviews ? r.rating.toFixed(1) + ' ★' : '–', 'star', '') + dashMetric('Orders completed', String(completed), 'check', '') + dashMetric('Member farmers', String(members), 'people', '') + '</div>';
    const harvests = crops.length ? '<div class="product-grid">' + crops.sort(dashShopSorts.fresh[1]).map(c => dashConsumerTile(c, isConsumerDashboard)).join('') + '</div>' : '<section class="panel">' + dashEmpty('No harvests listed right now.', '') + '</section>';
    const feedback = '<section class="panel">' + dashPanelHead('Buyer reviews', '', '<span class="filter-summary">' + dashPlural(reviews.length, 'review') + '</span>') + '<div class="feedback-list">' + (reviews.length ? reviews.map(f => dashReviewRow(f, 'customer')).join('') : dashEmpty('No reviews yet.', '')) + '</div></section>';
    const farmers = o.farmers || [];
    const farmerList = '<section class="panel">' + dashPanelHead('Member farmers', '', '<span class="filter-summary">' + dashPlural(farmers.length, 'farmer') + '</span>') + '<div class="table-wrap">' + (farmers.length ? '<table><thead><tr><th scope="col">Farmer</th><th scope="col">Crops</th><th scope="col">Farm area</th><th scope="col">Member since</th></tr></thead><tbody>' + farmers.map(f => '<tr><td><strong>' + de(f.name) + '</strong></td><td>' + de(f.crops) + '</td><td>' + f.area.toFixed(1) + ' ha</td><td>' + de(f.joined) + '</td></tr>').join('') + '</tbody></table>' : dashEmpty('No member farmers listed yet.', '')) + '</div></section>';
    return dashOrgCard(o, 'h1', actions) + metrics + '<h2 class="section-title">Harvests</h2>' + harvests + '<div class="split two">' + farmerList + feedback + '</div>';
}
function dashUserProfileView(slug) {
    const a = dashboardAccounts.find(x => dashSlug(x.name) === slug && x.role !== 'Administrator');
    if (!a)
        return dashProfileMissing();
    const own = !!dashMeEmail && !!a.email && a.email.toLowerCase() === dashMeEmail.toLowerCase();
    const p = dashPrivacy(a);
    // The buyer and administrators see everything; others see what the buyer's privacy settings allow.
    const shows = (key) => a.role !== 'Consumer' || own || isAdminDashboard || (p.profile && p[key]);
    const actions = own ? '<button class="control" data-go="settings">' + di('settings') + 'Edit profile</button>' : isAdminDashboard ? '<button class="control" data-account="' + de(a.email || '') + '">' + di('shield') + 'Manage account</button>' : '';
    const card = dashUserCard(a, 'h1', actions, shows('city'));
    if (a.role !== 'Consumer')
        return card;
    if (!shows('profile'))
        return card + '<section class="panel private-panel">' + di('lock') + '<h2>Private profile</h2></section>';
    // The server works out a buyer's completed orders and growers, since other people's orders aren't sent here.
    const reviews = dashboardFeedback.filter(f => f.customer === a.name).sort((x, y) => y.date.localeCompare(x.date));
    const growers = (a.growers || []).map(name => dashboardOrganizations.find(o => o.name === name)).filter((o) => !!o && dashOrgVisible(o));
    const metrics = '<div class="metric-grid three">' + dashMetric('Orders completed', String(a.completedOrders ?? 0), 'check', '') + (shows('reviews') ? dashMetric('Reviews', String(reviews.length), 'star', '') : '') + (shows('growers') ? dashMetric('Growers', String(growers.length), 'leaf', '') : '') + '</div>';
    const reviewPanel = shows('reviews') ? '<section class="panel">' + dashPanelHead('Reviews', '', '<span class="filter-summary">' + dashPlural(reviews.length, 'review') + '</span>') + '<div class="feedback-list">' + (reviews.length ? reviews.map(f => dashReviewRow(f, 'organization')).join('') : dashEmpty('No reviews yet.', '')) + '</div></section>' : '';
    const growerPanel = shows('growers') ? '<section class="panel">' + dashPanelHead('Growers', '') + '<div class="grower-list">' + (growers.length ? growers.map(o => '<a class="grower-chip" href="#org=' + dashSlug(o.name) + '" data-profile-link>' + dashAvatar(o, o.name, 'organization') + '<span><strong>' + de(o.name) + '</strong><small>' + de(o.region) + '</small></span></a>').join('') : dashEmpty('No growers yet.', '')) + '</div></section>' : '';
    return card + metrics + (reviewPanel && growerPanel ? '<div class="split">' + reviewPanel + growerPanel + '</div>' : reviewPanel + growerPanel);
}
/* ---------- Uploading, removing and repositioning profile photos ---------- */
async function dashUploadLook(input) {
    const file = input.files?.[0];
    const kind = input.dataset.upload === 'banner' ? 'banner' : 'avatar';
    const target = input.dataset.look || '';
    input.value = '';
    const look = dashLookOf(target);
    if (!file || !look || !dashCanEdit(target))
        return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
        dashToast('Choose a JPG, PNG, WebP or GIF picture.');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        dashToast('Choose a picture smaller than 10 MB.');
        return;
    }
    let photo = '';
    try {
        photo = await dashReadPhoto(file, kind === 'avatar' ? 320 : 1600, kind === 'avatar');
    }
    catch {
        dashToast('This picture couldn’t be read. Try another one.');
        return;
    }
    if (!await dashDo('look.upload', { target, kind, photo }))
        return;
    if (kind === 'banner')
        void dashStartReposition(target);
    else
        dashToast('Profile picture updated.');
}
let dashRepositioning = null;
const dashBannerEl = (target) => document.querySelector('.profile-banner[data-banner="' + CSS.escape(target) + '"]');
async function dashStartReposition(target) {
    const look = dashLookOf(target);
    if (!look?.banner || !dashCanEdit(target))
        return;
    const image = new Image();
    image.src = look.banner;
    try {
        await image.decode();
    }
    catch {
        dashToast('The banner couldn’t be loaded.');
        return;
    }
    dashRepositioning = { target, x: look.bannerX ?? 50, y: look.bannerY ?? 50, width: image.naturalWidth, height: image.naturalHeight };
    dashShowReposition();
    dashBannerEl(target)?.focus({ preventScroll: true });
}
// Puts the banner in repositioning mode again after a redraw.
function dashShowReposition() {
    const r = dashRepositioning;
    const el = r ? dashBannerEl(r.target) : null;
    if (!r || !el)
        return;
    el.classList.add('is-positioning');
    el.tabIndex = 0;
    el.setAttribute('aria-label', 'Banner position');
    el.style.backgroundPosition = r.x + '% ' + r.y + '%';
    el.querySelector('.banner-tools').hidden = true;
    el.querySelector('.banner-actions').hidden = false;
}
// Dragging moves the photo with the pointer: CSS percentages are a share of the part of the photo that doesn't fit.
function dashMoveBanner(dx, dy, from) {
    const r = dashRepositioning;
    const el = r ? dashBannerEl(r.target) : null;
    if (!r || !el)
        return;
    const box = el.getBoundingClientRect();
    const scale = Math.max(box.width / r.width, box.height / r.height);
    const extraX = r.width * scale - box.width, extraY = r.height * scale - box.height;
    const clamp = (v) => Math.round(Math.max(0, Math.min(100, v)) * 10) / 10;
    r.x = extraX > 0.5 ? clamp(from.x - dx / extraX * 100) : from.x;
    r.y = extraY > 0.5 ? clamp(from.y - dy / extraY * 100) : from.y;
    el.style.backgroundPosition = r.x + '% ' + r.y + '%';
}
function dashFinishReposition(save) {
    const r = dashRepositioning;
    dashRepositioning = null;
    if (!r || !save || !dashCanEdit(r.target)) {
        dashRender();
        return;
    }
    void dashDo('look.position', { target: r.target, x: r.x, y: r.y }).then(done => { if (done)
        dashToast('Banner position saved.'); });
}
/* ---------- The signed-in buyer's saved harvests and cart ---------- */
const dashSavedList = () => dashMeEmail ? dashboardSaved[dashMeEmail] || (dashboardSaved[dashMeEmail] = []) : [];
const dashIsSaved = (id) => dashSavedList().includes(id);
const dashCart = () => dashMeEmail ? dashboardCarts[dashMeEmail] || (dashboardCarts[dashMeEmail] = []) : [];
function dashCartEntries() {
    const entries = [];
    dashCart().forEach(line => { const crop = dashboardCrops.find(c => c.id === line.crop); if (crop)
        entries.push({ line, crop }); });
    return entries;
}
// Why a cart line can't be checked out as it is, or '' when it can.
function dashCartProblem(entry) {
    if (!dashIsBuyable(entry.crop))
        return 'No longer available';
    if (entry.line.quantity > entry.crop.stock)
        return 'Only ' + entry.crop.stock + ' ' + entry.crop.unit + ' left';
    return '';
}
/* ---------- The signed-in representative's organization ---------- */
const dashMyOrg = () => dashboardOrganizations.find(o => o.name === dashOrgName);
function dashOrgProfile() {
    const org = dashMyOrg();
    const rep = dashAccount();
    return { name: dashOrgName, region: org ? org.region : '', crops: org ? org.crop : '', representative: rep.name, email: rep.email, phone: (org && org.phone) || rep.phone || '', description: (org && org.description) || '', verified: org && org.approved ? 'Verified by AniBayan · ' + dfull(org.approved) : 'Waiting for verification' };
}
// Order value and volume for the last 7 days (daily) or last 4 weeks (weekly), from the organization's orders.
function dashOrgPeriod() {
    const week = dashState.period === 'week';
    const size = week ? 1 : 7, buckets = week ? 7 : 4, span = size * buckets;
    const labels = Array.from({ length: buckets }, (_, i) => { const start = dashDaysAgo(span - 1 - i * size); return week ? new Date(start + 'T12:00:00').toLocaleDateString('en-PH', { weekday: 'short' }) : dd(start); });
    const values = labels.map(() => 0), orders = labels.map(() => 0);
    let previousValue = 0, previousOrders = 0;
    dashRoleOrders().filter(o => o.status !== 'Cancelled').forEach(o => {
        const age = dashAge(o.date);
        if (age >= 0 && age < span) {
            const index = buckets - 1 - Math.floor(age / size);
            values[index] += o.total / 1000;
            orders[index] += 1;
        }
        else if (age >= span && age < span * 2) {
            previousValue += o.total;
            previousOrders += 1;
        }
    });
    return { label: dd(dashDaysAgo(span - 1)) + ' – ' + dfull(dashToday), value: Math.round(values.reduce((s, v) => s + v, 0) * 1000), orders: orders.reduce((s, v) => s + v, 0), labels, values: values.map(v => Math.round(v * 100) / 100), orderValues: orders, valueScale: Math.max(1, Math.ceil(Math.max(...values) * 1.25)), orderScale: Math.max(4, Math.ceil(Math.max(...orders) * 1.25)), previousValue, previousOrders };
}
// Change against the previous period, as [percentage, went down].
const dashTrend = (now, before) => before > 0 ? [Math.abs(Math.round((now - before) / before * 1000) / 10) + '%', now < before] : ['', false];
/* ---------- Site health: real checks run from the admin page ---------- */
let dashChecking = false;
async function dashTimedFetch(path) {
    if (location.protocol === 'file:')
        throw new Error('Open AniBayan through the web server to check this.');
    const start = performance.now();
    const response = await fetch(path + '?check=' + Date.now(), { cache: 'no-store' });
    if (!response.ok)
        throw new Error('Not answering');
    const elapsed = performance.now() - start;
    response.body?.cancel().catch(() => undefined);
    return elapsed;
}
const dashHealthChecks = [
    ['Web application', 'Homepage and dashboards', () => dashTimedFetch('index.html')],
    ['Application code', 'Dashboard and sign-in scripts', () => dashTimedFetch('js/dashboards.js')],
    ['File storage', 'Product and organization photos', () => dashTimedFetch('assets/carrot.jpg')],
    ['Database', 'Accounts, listings and orders (MySQL)', () => dashTimedFetch('../api/health/database')],
];
// CPU, memory and storage of the machine serving AniBayan, read by the Laravel app (routes/web.php).
async function dashReadHardware() {
    if (location.protocol === 'file:')
        throw new Error('Open AniBayan through the web server to read the hardware.');
    const response = await fetch('../server-health', { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok)
        throw new Error('The hardware couldn’t be read.');
    return await response.json();
}
// Services AniBayan will connect to, with their current state.
const dashIntegrations = [['PayMongo payments', 'Card, GCash and QR Ph checkout', 'Test mode', 'No money is charged'], ['Tawk.to live chat', 'Customer support chat', 'Connected', 'Chat widget is installed on AniBayan pages.'], ['Email notifications', 'Order and account emails', 'Not connected', 'Email sending is not set up yet.']];
async function dashRunHealthChecks() {
    if (dashChecking)
        return;
    dashChecking = true;
    dashRender();
    const results = [];
    for (const [service, , run] of dashHealthChecks) {
        try {
            results.push({ service, ok: true, latency: Math.round(await run()) });
        }
        catch {
            results.push({ service, ok: false, latency: 0, error: 'Not answering' });
        }
    }
    let hardware, hardwareError;
    try {
        hardware = await dashReadHardware();
    }
    catch {
        hardwareError = 'The hardware couldn’t be read.';
    }
    dashChecking = false;
    // The server keeps the history (the newest 30 runs) and sends it back with the fresh data.
    if (!await dashDo('health.record', { results, hardware: hardware ?? null, hardwareError: hardwareError ?? null }))
        dashRender();
}
function dashHealthSummary() {
    const log = dashboardHealthLog;
    const results = log.flatMap(run => run.results);
    const passed = results.filter(r => r.ok).length;
    const latest = log.length ? log[log.length - 1] : undefined;
    const web = log.map(run => run.results.find(r => r.service === 'Web application')).filter((r) => !!r && r.ok);
    const percent = (part) => results.length ? Math.round(part / results.length * 1000) / 10 + '%' : '–';
    return { latest, runs: log.length, uptime: percent(passed), errorRate: percent(results.length - passed), failures: results.length - passed, average: web.length ? Math.round(web.reduce((s, r) => s + r.latency, 0) / web.length) : null, down: latest ? latest.results.filter(r => !r.ok) : [] };
}
const dashLatency = (ms) => ms < 1 ? 'under 1 ms' : ms + ' ms';
const dashHelpTitle = ['Help & support', 'Where to go for each task in AniBayan.'];
const dashOrgAtLoad = isOrgDashboard && !dashNeedsSignIn ? dashOrgProfile() : undefined;
const dashUserName = dashMe()?.name || 'Guest';
const dashRoles = {
    admin: {
        page: 'admin.html', workspace: 'Admin workspace', navLabel: 'Administration',
        nav: [['overview', 'grid', 'Overview'], ['accounts', 'people', 'Accounts'], ['listings', 'box', 'Listings'], ['barangays', 'pin', 'Barangays'], ['activity', 'eye', 'Activity log'], ['reports', 'flag', 'User reports'], ['refunds', 'wallet', 'Refunds'], ['applications', 'clipboard', 'Applications'], ['health', 'pulse', 'Site health']],
        settingsNav: ['settings', 'settings', 'Settings'],
        user: dashUserName, userRole: 'Platform administrator', initials: 'AD',
        search: 'Search accounts, reports, applications…',
        cardIcon: 'shield', cardTitle: 'Platform oversight', cardText: 'Accounts, listings, barangays, reports, applications and site health.',
        shortcut: ['Public homepage', 'index.html', 'home'],
        titles: { overview: ['Admin overview', 'Accounts, listings, barangays, reports, organization applications and site health.'], refunds: ['Refunds', 'Buyers’ refund requests, and disputes waiting for your decision.'], accounts: ['Account management', 'Consumer, representative and administrator accounts.'], listings: ['All listings', 'Review harvest listings and remove items that break AniBayan rules.'], barangays: ['Barangays', 'Manage the barangays available in AniBayan location selectors.'], activity: ['Activity log', 'Sign-ins, orders, listings and administrator actions, newest first.'], reports: ['User reports', 'Reports buyers filed about organizations.'], applications: ['Organization applications', 'Farmer organizations asking to sell on AniBayan.'], health: ['Site health', 'Live checks of AniBayan’s services, plus the history of recent checks.'], settings: ['Workspace settings', 'Your administrator account and preferences.'], help: dashHelpTitle },
    },
    organization: {
        page: 'organization.html', workspace: 'Organization workspace', navLabel: 'Your organization',
        nav: [['overview', 'grid', 'Overview'], ['orders', 'bag', 'Incoming orders'], ['listings', 'box', 'My listings'], ['feedback', 'star', 'Ratings & feedback'], ['members', 'people', 'Member farmers'], ['payments', 'wallet', 'Payments']],
        settingsNav: ['settings', 'store', 'Organization profile'],
        user: dashUserName, userRole: 'Organization representative', initials: dashInitials(dashUserName),
        search: 'Search your orders, listings, feedback…',
        cardIcon: 'leaf', cardTitle: dashOrgName, cardText: dashOrgAtLoad ? dashOrgAtLoad.region + ' · ' + dashOrgAtLoad.crops : '',
        shortcut: ['View public storefront', 'consumer.html#org=' + dashSlug(dashOrgName), 'store'],
        titles: { overview: [dashOrgName, 'Orders, listings and members for your organization.'], orders: ['Incoming orders', 'Confirm, prepare and complete orders from your buyers.'], listings: ['My listings', 'The crops your organization offers. Buyers see each harvest date and shelf life.'], feedback: ['Ratings & feedback', 'What buyers say about your organization, and any warnings from AniBayan.'], members: ['Member farmers', 'The growers who supply your organization.'], payments: ['Payments', 'Payment status for your organization’s orders.'], settings: ['Organization profile', 'How your organization appears on AniBayan.'], help: dashHelpTitle },
    },
    consumer: {
        page: 'consumer.html', workspace: isGuest ? 'AniBayan market' : 'My AniBayan', navLabel: isGuest ? 'Browse' : 'Your account',
        nav: isGuest ? [['shop', 'store', 'Shop'], ['growers', 'leaf', 'Growers']] : [['overview', 'grid', 'Overview'], ['shop', 'store', 'Shop'], ['cart', 'cart', 'Cart'], ['orders', 'bag', 'My orders'], ['saved', 'heart', 'Saved harvests'], ['growers', 'leaf', 'My growers'], ['payments', 'wallet', 'Payment history']],
        settingsNav: isGuest ? null : ['settings', 'user', 'My profile'],
        user: dashUserName, userRole: isGuest ? 'Not signed in' : 'Buyer account', initials: isGuest ? '?' : dashInitials(dashUserName),
        search: 'Search harvests, orders and growers…',
        cardIcon: 'leaf', cardTitle: 'Good food starts here.', cardText: 'Discover fresh harvests and the communities behind them.',
        shortcut: ['Shop the harvest', '#shop', 'store'],
        titles: { overview: ['Your harvest, at a glance.', 'Welcome back, ' + dashUserName.split(' ')[0] + '. Good things are on their way.'], shop: ['Shop the harvest', isGuest ? 'Fresh harvests from local growing communities. Sign in to order.' : 'Filter by price, crop type, harvest time and location.'], cart: ['Your cart', 'Each organization fulfils its own order.'], orders: ['My orders', 'Follow each order, then rate it or report a problem.'], saved: ['Saved harvests', 'Crops you want to come back to.'], growers: [isGuest ? 'Growing communities' : 'Your growing communities', 'The organizations behind your food, with their buyer ratings.'], payments: ['Payment history', 'Payments for your orders.'], settings: ['Your profile', 'Your account, delivery details and preferences.'], help: dashHelpTitle },
    },
};
const dashRole = dashRoles[dashboardRole];
// Organization order workflow: current status -> [next status, action label].
const dashNextStep = { Pending: ['Confirmed', 'Confirm order'], Confirmed: ['Processing', 'Start preparing'], Processing: ['Delivered', 'Mark delivered'] };
const dashOnline = (order) => !!order.method && order.method !== 'Cash on delivery';
const ddate = (iso) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric' });
// An order's place on its way: placed, confirmed, preparing, delivered (by the organization), received (by the buyer).
const dashOrderStep = (status) => ({ Pending: 0, Confirmed: 1, Processing: 2, Delivered: 3, 'Refund requested': 3, Refunded: 3, Completed: 4 }[status] ?? -1);
// A refund request the organization still has to accept or dispute.
const dashRefundOpen = (o) => o.refund?.status === 'Requested';
// Online payments are held for 7 days after delivery; a refund can be asked for in that time.
const dashCanRefund = (o) => o.status === 'Delivered' && o.funds === 'Held' && !o.refund && !!o.releaseOn && new Date(o.releaseOn).getTime() > Date.now();
const dashHasReceipt = (o) => o.status !== 'Cancelled' && (o.payment === 'Paid' || o.method === 'Cash on delivery');
// Where an online payment is: held by AniBayan, released to the organization, or refunded to the buyer.
function dashFundsText(o) {
    if (o.funds === 'Held')
        return ds('Held') + (o.releaseOn ? '<small class="fact-note">To ' + de(o.organization) + ' on ' + ddate(o.releaseOn) + '</small>' : '');
    if (o.funds === 'Refund due')
        return ds('Refunding') + '<small class="fact-note">Back to ' + de(o.customer) + '</small>';
    if (o.funds === 'Released')
        return ds('Released') + (o.fundsSettledAt ? '<small class="fact-note">To ' + de(o.organization) + ' on ' + ddate(o.fundsSettledAt) + '</small>' : '');
    return ds('Refunded') + (o.fundsSettledAt ? '<small class="fact-note">To ' + de(o.customer) + ' on ' + ddate(o.fundsSettledAt) + '</small>' : '');
}
// [title, message] when the signed-in account can no longer use this page, otherwise [].
function dashBlocked() {
    if (dashOffline)
        return ['AniBayan’s server isn’t answering', 'Start the server (php artisan serve) and its database, then reload this page.'];
    const me = dashMe();
    if (!me)
        return [];
    if (me.status === 'Suspended')
        return ['This account is suspended', (dashBlockedReason || me.suspensionReason ? 'Reason: ' + (dashBlockedReason || me.suspensionReason) : 'An AniBayan administrator suspended ' + (me.email || 'this account') + '. Contact AniBayan support if you think this is a mistake.')];
    if (me.status === 'Terminated' || (isOrgDashboard && dashMyOrg()?.status === 'Terminated'))
        return ['Your organization was terminated', (dashBlockedReason || dashMyOrg()?.terminatedFor ? 'Reason: ' + (dashBlockedReason || dashMyOrg()?.terminatedFor) : (me.organization || 'Your organization') + ' was removed from AniBayan after repeated warnings. Contact AniBayan support if you think this is a mistake.')];
    if (isOrgDashboard) {
        const org = dashMyOrg();
        if (me.status === 'Pending' || org?.status === 'Pending review')
            return ['Your application is being reviewed', 'An AniBayan administrator is reviewing ' + dashOrgName + '. You can manage listings and orders once it is approved.'];
        if (me.status === 'Declined' || org?.status === 'Declined')
            return ['Your application was declined', (dashBlockedReason || org?.applicationDeclineReason ? 'Reason: ' + (dashBlockedReason || org?.applicationDeclineReason) : dashOrgName + ' was not approved.') + ' Contact AniBayan support for next steps.'];
    }
    return [];
}
function dashNotifications() {
    if (isAdminDashboard) {
        const notes = [];
        if (dashPendingApplications())
            notes.push([dashPlural(dashPendingApplications(), 'organization application') + ' awaiting review.', 'applications', 'Review applications']);
        if (dashFlaggedToday())
            notes.push([dashPlural(dashFlaggedToday(), 'flagged sign-in') + ' today.', 'activity', 'Open the activity log']);
        if (dashOpenReports())
            notes.push([dashPlural(dashOpenReports(), 'user report') + ' waiting for your decision.', 'reports', 'Review user reports']);
        dashHealthSummary().down.forEach(r => notes.push([r.service + ' failed its last check.', 'health', 'View site health']));
        return notes;
    }
    if (isGuest)
        return [['Sign in to order fresh harvests and follow your deliveries.', 'shop', 'Shop the harvest']];
    const orders = dashRoleOrders();
    if (isOrgDashboard) {
        const notes = [];
        const warning = dashWarningsFor(dashOrgName)[0];
        if (warning)
            notes.push(['AniBayan warning: ' + warning.reason + '. ' + dashStandingSentence(dashOrgName), 'feedback', 'See warnings']);
        const pending = orders.filter(o => o.status === 'Pending');
        if (pending.length)
            notes.push([pending.length === 1 ? 'New order ' + dashOrderNo(pending[0].id) + ' from ' + pending[0].customer + ' is waiting for confirmation.' : pending.length + ' new orders are waiting for confirmation.', 'orders', 'Open incoming orders']);
        dashRoleCrops().filter(c => c.status === 'Active' && c.stock > 0 && c.stock < 50).slice(0, 2).forEach(c => notes.push([c.name + ' is running low: ' + c.stock + ' ' + c.unit + ' left.', 'listings', 'Manage listings']));
        dashRoleCrops().filter(c => c.status === 'Active' && c.stock > 0 && dashFreshness(c).left < 0).slice(0, 2).forEach(c => notes.push([c.name + ' is past its shelf life and hidden from buyers.', 'listings', 'Update the listing']));
        const latest = dashboardFeedback.filter(f => f.organization === dashOrgName).sort((a, b) => b.date.localeCompare(a.date))[0];
        if (latest)
            notes.push([latest.customer + ' rated your organization ' + dashPlural(latest.rating, 'star') + '.', 'feedback', 'See ratings & feedback']);
        return notes;
    }
    const notes = [];
    orders.filter(o => o.status === 'Delivered').slice(0, 2).forEach(o => notes.push(['Your ' + o.crop.toLowerCase() + ' from ' + o.organization + ' was delivered.', 'orders', 'Confirm receipt']));
    orders.filter(o => ['Confirmed', 'Processing'].includes(o.status)).slice(0, 2).forEach(o => notes.push(['Your ' + o.crop.toLowerCase() + ' is being prepared by ' + o.organization + '.', 'orders', 'See my orders']));
    orders.filter(o => o.payment === 'Unpaid' && dashOnline(o) && o.status !== 'Cancelled').slice(0, 1).forEach(o => notes.push(['Order ' + dashOrderNo(o.id) + ' is waiting for payment.', 'orders', 'Pay now']));
    const unrated = orders.find(o => o.status === 'Completed' && !dashRated(o.id));
    if (unrated)
        notes.push(['How was your ' + unrated.crop.toLowerCase() + ' from ' + unrated.organization + '?', 'orders', 'Rate your order']);
    if (dashCart().length)
        notes.push(['You have ' + dashPlural(dashCart().length, 'harvest') + ' in your cart.', 'cart', 'Go to checkout']);
    return notes;
}
// The signed-in person's picture in the sidebar, header and account menu; representatives show their organization's.
function dashShellAvatar() {
    const look = isOrgDashboard ? dashMyOrg() : dashMe();
    return '<span class="avatar ' + dashboardRole + '-avatar" data-me-avatar>' + (look?.avatar ? '<img src="' + de(look.avatar) + '" alt="">' : dashRole.initials) + '</span>';
}
function dashShell() {
    const link = (item) => '<a href="#' + item[0] + '" data-nav="' + item[0] + '" title="' + de(item[2]) + '">' + di(item[1]) + '<span>' + de(item[2]) + '</span><span class="nav-count" data-nav-count="' + item[0] + '" hidden></span></a>';
    const me = dashMe();
    const avatar = dashShellAvatar();
    const menu = me
        ? '<p>Signed in as</p><div class="workspace-account">' + avatar + '<span><strong>' + de(me.name) + '</strong><small>' + de(me.email) + '</small></span></div>' + (dashRole.settingsNav ? '<a href="#' + dashRole.settingsNav[0] + '">' + di(dashRole.settingsNav[1]) + '<span>' + dashRole.settingsNav[2] + '</span></a>' : '') + '<a href="index.html">' + di('home') + '<span>Homepage</span></a><a class="workspace-home" href="login.html" data-sign-out>' + di('logout') + '<span>Sign out</span></a>'
        : '<p>Browsing as a guest</p><a href="login.html" data-sign-in>' + di('user') + '<span>Sign in</span></a><a href="login.html#register">' + di('plus') + '<span>Create an account</span></a><a class="workspace-home" href="index.html">' + di('home') + '<span>Homepage</span></a>';
    const headerUser = me ? '<button class="header-user" data-go="' + (dashRole.settingsNav ? dashRole.settingsNav[0] : 'help') + '" aria-label="' + (dashRole.settingsNav ? dashRole.settingsNav[2] : 'Help') + '">' + avatar + '<span><strong>' + de(me.name) + '</strong><small>' + dashRole.userRole + '</small></span></button>' : '<a class="control" href="login.html#register">Create account</a><a class="control primary" href="login.html" data-sign-in>Sign in</a>';
    dashRoot.innerHTML = `<aside class="sidebar" id="sidebar"><a class="dash-brand" href="index.html" aria-label="AniBayan homepage"><img src="assets/anibayan-logo.png" alt=""></a><p class="sidebar-role"><span class="role-badge">${dashRole.workspace}</span></p><p class="nav-label">${dashRole.navLabel}</p><nav class="side-nav" aria-label="${dashRole.workspace} navigation">${dashRole.nav.map(link).join('')}</nav><p class="nav-label">General</p><nav class="side-nav" aria-label="Account and help">${(dashRole.settingsNav ? link(dashRole.settingsNav) : '') + link(['help', 'help', 'Help & support'])}</nav><div class="sidebar-foot"><div class="sidebar-card">${di(dashRole.cardIcon)}<strong>${de(dashRole.cardTitle)}</strong>${de(dashRole.cardText)}</div><div class="workspace-switch"><div class="workspace-menu" id="workspace-menu" hidden>${menu}</div><button class="sidebar-user" id="workspace-toggle" aria-expanded="false" aria-controls="workspace-menu" aria-label="Account menu">${avatar}<span class="sidebar-user-copy"><strong>${de(dashRole.user)}</strong><small>${dashRole.userRole}</small></span>${di('chevron')}</button></div></div></aside><div class="sidebar-backdrop" id="sidebar-backdrop"></div><div class="workspace"><header class="topbar"><button class="icon-button collapse-button" id="collapse-sidebar" aria-label="Toggle navigation" aria-controls="sidebar">${di('menu')}</button><label class="global-search">${di('search')}<input id="dashboard-search" type="search" placeholder="${dashState.view === 'cart' ? 'Search items in your cart' : dashRole.search}" aria-label="Search current section"><kbd>/</kbd></label><span class="topbar-spacer"></span><a class="market-shortcut" href="${dashRole.shortcut[1]}">${di(dashRole.shortcut[2])}<span>${dashRole.shortcut[0]}</span>${di('up')}</a><div class="notification-wrap"><button class="icon-button notification-button" id="show-notifications" aria-label="Show notifications" aria-expanded="false" aria-controls="notification-panel">${di('bell')}<span class="notification-dot" id="notification-dot"></span></button><div class="notification-panel" id="notification-panel" hidden><h2>Notifications</h2><ul id="notification-list"></ul></div></div><div class="header-account">${headerUser}</div></header><main class="main-content" id="dashboard-content" tabindex="-1"></main></div>`;
}
function dashRenderNotifications() {
    const legal = dashRoot.querySelector('.sidebar-foot');
    if (legal && !legal.querySelector('.sidebar-legal'))
        legal.insertAdjacentHTML('afterbegin', '<nav class="sidebar-legal" aria-label="Legal"><a href="terms.html">Terms &amp; Conditions</a><a href="privacy.html">Privacy Notice</a></nav>');
    const notes = dashBlocked().length ? [] : dashNotifications();
    document.getElementById('notification-list').innerHTML = notes.length ? notes.map(n => '<li><p>' + de(n[0]) + '</p><a href="#' + n[1] + '">' + n[2] + ' →</a></li>').join('') : '<li><p>You’re all caught up.</p></li>';
    document.getElementById('notification-dot').hidden = !notes.length;
}
function dashHeading() {
    const view = dashState.view;
    const [title, sub] = dashRole.titles[view];
    const exportButton = '<button class="control" id="export-dashboard">' + di('download') + 'Export Excel</button><button class="control" id="export-pdf">' + di('download') + 'Export PDF</button>';
    let tools = '';
    if (isConsumerDashboard)
        tools = '<span class="control static">' + di('calendar') + dashTodayDate.toLocaleDateString('en-PH', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }) + '</span>' + (view === 'shop' || view === 'cart' ? '' : '<button class="control primary" data-go="shop">' + di('bag') + 'Shop the harvest</button>');
    else if (isAdminDashboard) {
        if (view === 'health') {
            const latest = dashHealthSummary().latest;
            tools += '<span class="control static">' + di('clock') + (dashChecking ? 'Checking now…' : latest ? 'Last checked ' + dtime(latest.time) : 'Not checked yet') + '</span><button class="control" data-health-check' + (dashChecking ? ' disabled' : '') + '>' + di('pulse') + 'Run checks</button>';
        }
        if (['accounts', 'listings', 'reports', 'refunds', 'applications', 'health'].includes(view))
            tools += exportButton;
        if (view === 'barangays')
            tools += '<button class="control primary" data-add-barangay>' + di('plus') + 'Add barangay</button>';
    }
    else {
        if (view === 'overview')
            tools += '<select class="period-select" id="dashboard-period" aria-label="Reporting period"><option value="week" ' + (dashState.period === 'week' ? 'selected' : '') + '>Last 7 days</option><option value="month" ' + (dashState.period === 'month' ? 'selected' : '') + '>Last 4 weeks</option></select>';
        if (['overview', 'orders', 'listings', 'feedback', 'members', 'payments'].includes(view))
            tools += exportButton;
        if (view === 'overview' || view === 'listings')
            tools += '<button class="control primary" data-add-listing>' + di('plus') + 'Add listing</button>';
        if (view === 'members')
            tools += '<button class="control primary" data-add-member>' + di('plus') + 'Add member</button>';
    }
    return '<div class="page-heading"><div><h1>' + de(title) + '</h1><p>' + de(sub) + '</p></div><div class="page-tools">' + tools + '</div></div>';
}
function dashMetric(label, value, icon, caption, trend = '', down = false) {
    return '<article class="metric"><div class="metric-top"><span>' + label + '</span>' + di(icon) + '</div><div class="metric-value"><strong>' + value + '</strong>' + (trend ? '<span class="trend' + (down ? ' down' : '') + '">' + (down ? '↘ ' : '↗ ') + trend + '</span>' : '') + '</div>' + (caption ? '<p class="metric-caption">' + caption + '</p>' : '') + '</article>';
}
function dashPanelHead(title, note, action = '') {
    return '<div class="panel-head"><div><h2>' + title + '</h2>' + (note ? '<p>' + note + '</p>' : '') + '</div>' + action + '</div>';
}
// group 'hardware' keeps its own tab, so the hardware chart and the response chart can sit on one page.
function dashBarChart(series, labels, chip, foot, group = '') {
    const chosen = group === 'hardware' ? dashState.hardwareChart : dashState.chart;
    const s = series.find(item => item.key === chosen) || series[0];
    const selected = Math.min(dashState.bar, s.values.length - 1);
    const bars = s.values.map((value, index) => {
        const caption = s.caption(value);
        return '<div class="chart-column"><button class="chart-bar ' + (selected === index ? 'selected' : '') + '" style="--bar-height:' + Math.min(100, Math.round(value / s.scale * 100)) + '%" data-bar="' + index + '" aria-pressed="' + (selected === index) + '" aria-label="' + labels[index] + ': ' + caption + s.suffix + '"><span>' + caption + '</span></button><span class="chart-day">' + labels[index] + '</span></div>';
    }).join('');
    return '<section class="panel">' + dashPanelHead(s.title, s.note, '<span class="chip">' + chip + '</span>') + '<div class="chart-tabs">' + series.map(item => '<button data-chart="' + item.key + '"' + (group ? ' data-chart-group="' + group + '"' : '') + ' aria-pressed="' + (item === s) + '">' + item.tab + '</button>').join('') + '</div><div class="chart-body"><div class="chart-axis">' + [1, .75, .5, .25, 0].map(part => '<span>' + s.axis(Math.round(part * s.scale * 100) / 100) + '</span>').join('') + '</div><div class="bar-chart">' + bars + '</div></div><div class="chart-foot"><span><i class="legend-dot"></i> ' + s.legend + '</span><span>' + foot + '</span></div></section>';
}
function dashChart(period, valueNote, volumeNote) {
    return dashBarChart([
        { key: 'value', tab: 'Order value', title: 'Order value', note: valueNote, legend: 'Order value', values: period.values, scale: period.valueScale, axis: value => '₱' + value + 'k', caption: value => dp(value * 1000), suffix: '' },
        { key: 'orders', tab: 'Order volume', title: 'Order activity', note: volumeNote, legend: 'Placed orders', values: period.orderValues, scale: period.orderScale, axis: value => String(value), caption: value => String(value), suffix: ' orders' },
    ], period.labels, dashState.period === 'week' ? 'Last 7 days' : 'Last 4 weeks', period.label);
}
function dashMatching(text) { return text.toLowerCase().includes(dashState.query.trim().toLowerCase()); }
function dashEmpty(title, description) { return '<div class="empty-state"><h2>' + title + '</h2><p>' + description + '</p></div>'; }
// search: the placeholder of a search box for this table; it shares the header search's query.
function dashFilters(options, summary, search = '') {
    const box = search ? '<label class="global-search table-search">' + di('search') + '<input type="search" data-table-search value="' + de(dashState.query) + '" placeholder="' + search + '" aria-label="' + search + '"></label>' : '';
    return '<div class="filters">' + options.map(f => '<button class="filter-chip" data-filter="' + f + '" aria-pressed="' + (dashState.filter === f) + '">' + f + '</button>').join('') + box + '<span class="filter-summary">' + summary + '</span></div>';
}
// Orders visible to the current role, before search and status filters. Administrators and guests see none.
function dashRoleOrders() {
    if (isAdminDashboard || isGuest)
        return [];
    return dashboardOrders.filter(o => isOrgDashboard ? o.organization === dashOrgName : o.customer === dashConsumerName);
}
function dashOrders() {
    return dashRoleOrders().filter(o => dashMatching([o.id, o.customer, o.organization, o.crop, o.quantity, o.status, o.payment, o.date].join(' ')) && (dashState.filter === 'All' || o.status === dashState.filter));
}
function dashRoleCrops() {
    return dashboardCrops.filter(c => !isOrgDashboard || c.organization === dashOrgName);
}
function dashCropStatus(crop) {
    if (crop.status === 'Removed')
        return 'Removed by AniBayan';
    if (crop.stock === 0)
        return 'Out of stock';
    if (crop.status !== 'Active')
        return 'Unpublished';
    if (dashFreshness(crop).left < 0)
        return 'Past shelf life';
    return isOrgDashboard && crop.stock < 50 ? 'Low stock' : 'Active';
}
function dashOrderTable(mode) {
    const all = dashOrders();
    const orders = mode === 'recent' ? all.slice(0, 5) : all;
    const product = (o) => '<div class="table-product"><img src="' + dashImg(o.image) + '" alt=""><div><strong>' + de(o.crop) + '</strong><small>' + de(o.quantity) + '</small></div></div>';
    const cols = [['Order', o => '<strong>' + dashOrderNo(o.id) + '</strong>'], ['Harvest', product]];
    if (isOrgDashboard)
        cols.push(['Buyer', o => de(o.customer)]);
    cols.push(['Total', o => '<strong>' + dp(o.total) + '</strong>']);
    const statusCell = (o) => ds(o.status) + (o.status === 'Cancelled' && o.cancelReason ? '<small class="cell-note">' + de(o.cancelReason) + '</small>' : '');
    if (mode === 'payments')
        cols.push(['Payment', o => ds(o.payment) + (o.method ? '<small class="cell-note">' + de(o.method) + '</small>' : '')], ['Funds', o => o.funds ? ds(o.funds) : '<small class="cell-note">' + (o.payment === 'Paid' ? 'Cash' : '–') + '</small>'], ['Order status', statusCell]);
    else
        cols.push(['Status', statusCell]);
    cols.push(['Date', o => dd(o.date)]);
    const actions = (o) => '<div class="row-actions">' + (isOrgDashboard && mode === 'all' && dashNextStep[o.status] ? '<button class="control small" data-advance="' + o.id + '">' + dashNextStep[o.status][1] + '</button>' : '') + (isOrgDashboard && mode !== 'recent' && dashRefundOpen(o) ? '<button class="control small primary" data-order="' + o.id + '">Answer refund</button>' : '') + (isConsumerDashboard && mode !== 'recent' && o.status === 'Delivered' ? '<button class="control small primary" data-order-received="' + o.id + '">Order received</button>' : '') + (isConsumerDashboard && mode !== 'recent' && o.payment === 'Unpaid' && dashOnline(o) && o.status !== 'Cancelled' ? '<button class="control small primary" data-pay-order="' + o.id + '">Pay now</button>' : '') + (isConsumerDashboard && mode === 'all' && o.status === 'Completed' && !dashRated(o.id) ? '<button class="control small" data-rate="' + o.id + '">' + di('star') + 'Rate</button>' : '') + '<button class="table-action" data-order="' + o.id + '" aria-label="View order ' + o.id + '">' + di('eye') + '</button></div>';
    const title = mode === 'payments' ? (isOrgDashboard ? 'Payments by order' : 'Your payment history') : mode === 'recent' ? (isConsumerDashboard ? 'Recent purchases' : 'Recent orders') : (isOrgDashboard ? 'Orders from your buyers' : 'Your orders');
    const head = dashPanelHead(title, '', mode === 'recent' ? '<button class="text-button" data-go="orders">View all ' + di('arrow') + '</button>' : '');
    const filters = mode === 'all' ? dashFilters(['All', 'Pending', 'Confirmed', 'Processing', 'Delivered', 'Refund requested', 'Completed', 'Refunded', 'Cancelled'], dashPlural(orders.length, 'order')) : '';
    const empty = !dashRoleOrders().length ? dashEmpty('No orders yet', isConsumerDashboard ? 'Orders you place from your cart appear here.' : 'Orders from buyers appear here.') : dashEmpty('No matching orders', 'Try another search or order status.');
    const table = orders.length ? '<table><thead><tr>' + cols.map(c => '<th scope="col">' + c[0] + '</th>').join('') + '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + orders.map(o => '<tr>' + cols.map(c => '<td>' + c[1](o) + '</td>').join('') + '<td>' + actions(o) + '</td></tr>').join('') + '</tbody></table>' : empty;
    return '<section class="panel">' + head + filters + '<div class="table-wrap">' + table + '</div>' + (mode === 'recent' ? '' : '<div class="table-footer"><span>Showing ' + orders.length + ' of ' + dashPlural(dashRoleOrders().length, 'order') + '</span></div>') + '</section>';
}
/* ---------- Admin: accounts, user reports, organization applications and site health ---------- */
const dashAppStatus = (org) => org.status === 'Active' ? 'Approved' : org.status;
function dashAccountList() {
    const f = dashState.filter === 'Buyer' ? 'Consumer' : dashState.filter;
    return dashboardAccounts.filter(a => dashMatching([a.name, a.email, a.role === 'Consumer' ? 'Buyer' : a.role, a.organization || '', a.status].join(' ')) && (f === 'All' || a.role === f || a.status === f));
}
function dashReportList() {
    return dashboardReports.filter(r => dashMatching(Object.values(r).join(' ')) && (dashState.filter === 'All' || r.status === dashState.filter)).sort((a, b) => b.date.localeCompare(a.date));
}
function dashApplicationList() {
    return dashboardOrganizations.filter(o => dashMatching(o.name + ' ' + o.region + ' ' + o.crop + ' ' + o.representative) && (dashState.filter === 'All' || dashAppStatus(o) === dashState.filter)).sort((a, b) => b.applied.localeCompare(a.applied));
}
function dashHealthChart() {
    const runs = dashboardHealthLog.slice(-7);
    if (!runs.length)
        return '<section class="panel">' + dashPanelHead('Response time', 'Time for the web application to answer') + dashEmpty(dashChecking ? 'Running the first checks…' : 'No checks yet', 'Run the checks to measure response times.') + '</section>';
    const labels = runs.map(run => new Date(run.time).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }));
    const latency = runs.map(run => run.results.find(r => r.service === 'Web application')?.latency || 0);
    const failures = runs.map(run => run.results.filter(r => !r.ok).length);
    return dashBarChart([
        { key: 'response', tab: 'Response time', title: 'Response time', note: 'Time for the web application to answer, per check', legend: 'Response time (ms)', values: latency, scale: Math.max(50, Math.ceil(Math.max(...latency) * 1.25 / 10) * 10), axis: value => String(Math.round(value)), caption: value => dashLatency(value), suffix: '' },
        { key: 'errors', tab: 'Failed checks', title: 'Failed checks', note: 'Services that failed, per check', legend: 'Failed checks', values: failures, scale: Math.max(2, dashHealthChecks.length), axis: value => String(Math.round(value)), caption: value => String(value), suffix: ' failed' },
    ], labels, 'Last ' + dashPlural(runs.length, 'check'), 'Times are when each check ran');
}
function dashServicesPanel() {
    const summary = dashHealthSummary();
    const rows = dashHealthChecks.map(([name, detail]) => {
        const result = summary.latest?.results.find(r => r.service === name);
        const history = dashboardHealthLog.flatMap(run => run.results.filter(r => r.service === name));
        const rate = history.length ? Math.round(history.filter(r => r.ok).length / history.length * 1000) / 10 + '% of checks passed' : '';
        const status = dashChecking && !result ? 'Checking' : result ? (result.ok ? 'Operational' : 'Down') : 'Not checked';
        const info = result && !result.ok ? result.error || 'Check failed' : [detail, result ? dashLatency(result.latency) : '', rate].filter(Boolean).join(' · ');
        return [name, info, status];
    }).concat(dashIntegrations.map(([name, detail, status, note]) => [name, detail + ' · ' + note, status])).filter(row => dashMatching(row.join(' ')));
    const ok = summary.latest ? summary.latest.results.filter(r => r.ok).length : 0;
    return '<section class="panel">' + dashPanelHead('Services', summary.latest ? ok + ' of ' + dashHealthChecks.length + ' checked services up' : 'Waiting for the first check', dashState.view === 'overview' ? '<button class="icon-button" data-go="health" aria-label="View site health">' + di('up') + '</button>' : '') + '<div class="service-list">' + (rows.length ? rows.map(([name, info, status]) => '<div class="service-row"><div><strong>' + de(name) + '</strong><small>' + de(info) + '</small></div>' + ds(status) + '</div>').join('') : dashEmpty('No matching services', 'Try another search.')) + '</div></section>';
}
function dashReportTable(limit) {
    const all = dashReportList();
    const reports = limit ? all.slice(0, limit) : all;
    const table = reports.length ? '<table><thead><tr><th scope="col">Report</th><th scope="col">Organization</th><th scope="col">Reported by</th><th scope="col">Reason</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + reports.map(r => '<tr><td><strong>' + r.id + '</strong><small class="cell-note">' + dfull(r.date) + '</small></td><td>' + de(r.organization) + '</td><td>' + de(r.customer) + '</td><td>' + de(r.reason) + '</td><td>' + ds(r.status) + '</td><td><div class="row-actions"><button class="control small' + (r.status === 'Open' ? ' primary' : '') + '" data-report-id="' + r.id + '">' + (r.status === 'Open' ? 'Review' : 'View') + '</button></div></td></tr>').join('') + '</tbody></table>' : dashEmpty(dashboardReports.length ? 'No matching reports' : 'No reports yet', dashboardReports.length ? 'Try another search or report status.' : 'Reports that buyers file appear here.');
    const head = limit ? dashPanelHead('Latest user reports', 'Newest first', '<button class="text-button" data-go="reports">View all ' + di('arrow') + '</button>') : dashPanelHead('Reports from buyers', '');
    return '<section class="panel">' + head + (limit ? '' : dashFilters(['All', 'Open', 'Upheld', 'Dismissed'], dashPlural(reports.length, 'report'), 'Search reports')) + '<div class="table-wrap">' + table + '</div></section>';
}
function dashAdminOverview() {
    const pending = dashboardOrganizations.filter(o => o.status === 'Pending review').sort((a, b) => b.applied.localeCompare(a.applied));
    const newAccounts = dashboardAccounts.filter(a => dashAge(a.joined) < 7).length;
    const suspended = dashboardAccounts.filter(a => a.status === 'Suspended').length;
    const health = dashHealthSummary();
    const metrics = '<div class="metric-grid">' + dashMetric('Accounts', String(dashboardAccounts.length), 'people', '<b>' + newAccounts + ' new</b> this week · ' + suspended + ' suspended') + dashMetric('Open user reports', String(dashOpenReports()), 'flag', 'Waiting for your decision') + dashMetric('Applications to review', String(pending.length), 'clipboard', 'Organizations asking to sell') + dashMetric('Checks passed', health.uptime, 'pulse', health.runs ? 'Across the last ' + dashPlural(health.runs, 'health check') : 'Running the first health check') + '</div>';
    const applications = '<section class="panel">' + dashPanelHead('Organization applications', 'Newest first', '<button class="icon-button" data-go="applications" aria-label="View all applications">' + di('up') + '</button>') + '<div class="organization-list">' + (pending.length ? pending.map(o => '<button class="organization-row" data-organization="' + de(o.name) + '"><img src="' + dashImg(o.image) + '" alt=""><span><strong>' + de(o.name) + '</strong><small>' + de(o.region) + ' · submitted ' + dd(o.applied) + '</small></span>' + di('arrow') + '</button>').join('') : dashEmpty('All caught up', 'No applications are waiting.')) + '</div>' + (pending.length ? '<div class="review-prompt">' + di('clock') + '<span><b>' + dashPlural(pending.length, 'application') + '</b> awaiting review</span><button data-go="applications" data-go-filter="Pending review">Review →</button></div>' : '') + '</section>';
    return metrics + '<div class="split">' + dashHealthChart() + dashServicesPanel() + '</div><div class="split">' + dashReportTable(4) + applications + '</div>';
}
function dashAccountsView() {
    const count = (test) => dashboardAccounts.filter(test).length;
    const accounts = dashAccountList();
    const metrics = '<div class="metric-grid">' + dashMetric('Total accounts', String(dashboardAccounts.length), 'people', '<b>' + count(a => dashAge(a.joined) < 7) + ' new</b> this week') + dashMetric('Buyers', String(count(a => a.role === 'Consumer')), 'user', 'Buyer accounts') + dashMetric('Representatives', String(count(a => a.role === 'Representative')), 'leaf', count(a => a.status === 'Pending') + ' waiting on an application') + dashMetric('Suspended', String(count(a => a.status === 'Suspended')), 'lock', 'Can’t sign in, order or sell') + '</div>';
    const rows = accounts.map(a => '<tr><td><div class="table-product">' + dashAvatar(a, a.name, dashLookKind(a.role)) + '<div><strong>' + de(a.name) + '</strong><small>' + de(a.email) + '</small></div></div></td><td>' + (a.role === 'Consumer' ? 'Buyer' : a.role) + (a.organization ? '<small class="cell-note">' + de(a.organization) + '</small>' : '') + '</td><td>' + dfull(a.joined) + '</td><td>' + dd(a.lastActive) + '</td><td>' + ds(a.status) + '</td><td><div class="row-actions"><button class="control small" data-account="' + de(a.email) + '">Manage</button></div></td></tr>').join('');
    const table = accounts.length ? '<table><thead><tr><th scope="col">Account</th><th scope="col">Role</th><th scope="col">Joined</th><th scope="col">Last active</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table>' : dashEmpty('No matching accounts', 'Try a different name, email, role or status.');
    return metrics + '<section class="panel">' + dashPanelHead('Accounts', '') + dashFilters(['All', 'Buyer', 'Representative', 'Administrator', 'Pending', 'Suspended'], dashPlural(accounts.length, 'account'), 'Search accounts') + '<div class="table-wrap">' + table + '</div></section>';
}
function dashAdminListings() {
    const filter = dashState.filter;
    return dashboardCrops.filter(c => dashMatching([c.name, c.organization, c.category, c.id, c.removalReason || ''].join(' '))
        && (filter === 'All' || (filter === 'Removed' ? c.status === 'Removed' : filter === 'Active' ? c.status === 'Active' : c.status !== 'Removed')));
}
function dashAdminListingsView() {
    const crops = dashAdminListings();
    const rows = crops.map(c => '<tr><td><div class="table-product"><img src="' + dashImg(c.image) + '" alt=""><div><strong>' + de(c.name) + '</strong><small>' + c.id + ' · ' + de(c.category) + '</small></div></div></td><td>' + de(c.organization) + '</td><td>' + dp(c.price) + ' / ' + de(c.unit) + '</td><td>' + c.stock + ' ' + de(c.unit) + '</td><td>' + ds(c.status === 'Removed' ? 'Removed' : dashCropStatus(c)) + '</td><td>' + (c.removalReason ? '<small class="cell-note">Reason: ' + de(c.removalReason) + '</small>' : '—') + '</td><td>' + (c.status === 'Removed' ? '<span class="filter-summary">Removed</span>' : '<button class="control small danger" data-admin-remove-listing="' + c.id + '">Remove listing</button>') + '</td></tr>').join('');
    const table = crops.length ? '<table><thead><tr><th scope="col">Listing</th><th scope="col">Organization</th><th scope="col">Price</th><th scope="col">Stock</th><th scope="col">Status</th><th scope="col">Removal reason</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table>' : dashEmpty(dashboardCrops.length ? 'No matching listings' : 'No listings yet', 'Try another search or filter.');
    return '<section class="panel">' + dashPanelHead('Harvest listings', 'A removed listing stays in the organization’s record with its reason.') + dashFilters(['All', 'Active', 'Removed'], dashPlural(crops.length, 'listing'), 'Search listings') + '<div class="table-wrap">' + table + '</div></section>';
}
function dashBarangaysAdminView() {
    const rows = dashBarangays.filter(name => dashMatching(name)).map(name => '<tr><td><strong>' + de(name) + '</strong></td><td>' + de(dashCityName) + '</td><td><div class="row-actions"><button class="control small" data-barangay-edit="' + de(name) + '">Edit</button><button class="control small danger" data-barangay-remove="' + de(name) + '">Remove</button></div></td></tr>').join('');
    const add = '<button class="control small primary" data-add-barangay>' + di('plus') + 'Add barangay</button>';
    return '<section class="panel">' + dashPanelHead('Barangays', 'Rename, add or remove locations. Existing records can be moved when a barangay is removed.', add) + dashFilters(['All'], dashPlural(dashBarangays.length, 'barangay'), 'Search barangays') + '<div class="table-wrap">' + (rows ? '<table><thead><tr><th scope="col">Barangay</th><th scope="col">Municipality</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table>' : dashEmpty('No matching barangays', 'Try another search.')) + '</div></section>';
}
function dashReportsView() {
    const n = (status) => dashboardReports.filter(r => r.status === status).length;
    return '<div class="metric-grid three">' + dashMetric('Open reports', String(n('Open')), 'flag', '') + dashMetric('Upheld', String(n('Upheld')), 'check', '') + dashMetric('Dismissed', String(n('Dismissed')), 'clock', '') + '</div>' + dashReportTable(0) + dashWarningPanel();
}
// Every approved or terminated organization, those closest to termination first.
function dashWarningPanel() {
    const rank = (o) => { const s = dashStanding(o.name); return s.terminated ? -1 : s.count; };
    const orgs = dashboardOrganizations.filter(o => (o.status === 'Active' || o.status === 'Terminated') && dashMatching(o.name + ' ' + o.region)).sort((a, b) => rank(b) - rank(a) || a.name.localeCompare(b.name));
    const row = (o) => { const latest = dashWarningsFor(o.name)[0]; return '<button class="organization-row" data-organization="' + de(o.name) + '"><img src="' + dashImg(o.image) + '" alt=""><span><strong>' + de(o.name) + '</strong><small>' + (latest ? 'Latest: ' + de(latest.reason) + ' · ' + dd(latest.date) : de(o.region)) + '</small></span>' + dashStandingBadge(o.name) + di('arrow') + '</button>'; };
    return '<section class="panel">' + dashPanelHead('Organization warnings', '') + '<div class="organization-list">' + (orgs.length ? orgs.map(row).join('') : dashEmpty('No matching organizations', 'Try another search.')) + '</div></section>';
}
function dashApplicationsView() {
    const n = (status) => dashboardOrganizations.filter(o => dashAppStatus(o) === status).length;
    const apps = dashApplicationList();
    const table = apps.length ? '<table><thead><tr><th scope="col">Organization</th><th scope="col">Representative</th><th scope="col">Members</th><th scope="col">Documents</th><th scope="col">Submitted</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + apps.map(o => {
        const pending = o.status === 'Pending review';
        return '<tr><td><div class="table-product"><img class="round" src="' + dashImg(o.image) + '" alt=""><div><strong>' + de(o.name) + '</strong><small>' + de(o.region) + '</small></div></div></td><td>' + de(o.representative) + '</td><td>' + o.members + '</td><td>' + dashPlural(o.documents.length, 'file') + '</td><td>' + dfull(o.applied) + '</td><td>' + ds(dashAppStatus(o)) + '</td><td><div class="row-actions"><button class="control small' + (pending ? ' primary' : '') + '" data-organization="' + de(o.name) + '">' + (pending ? 'Review application' : 'View') + '</button></div></td></tr>';
    }).join('') + '</tbody></table>' : dashEmpty('No matching applications', 'Try a different name, place or status.');
    return '<div class="metric-grid three">' + dashMetric('Awaiting review', String(n('Pending review')), 'clock', 'Organizations asking to sell') + dashMetric('Approved', String(n('Approved')), 'check', 'Selling on AniBayan') + dashMetric('Declined', String(n('Declined')), 'flag', 'Can apply again with complete documents') + '</div><section class="panel">' + dashPanelHead('Applications', '') + dashFilters(['All', 'Pending review', 'Approved', 'Declined', 'Terminated'], dashPlural(apps.length, 'application'), 'Search applications') + '<div class="table-wrap">' + table + '</div></section>';
}
const dashGB = (bytes) => bytes / 1073741824;
const dashGBText = (gb) => (gb >= 100 ? Math.round(gb) : Math.round(gb * 10) / 10) + ' GB';
const dashHardwareRuns = () => dashboardHealthLog.filter(run => run.hardware);
function dashHardwareChart() {
    const runs = dashHardwareRuns().slice(-7);
    const last = dashboardHealthLog[dashboardHealthLog.length - 1];
    if (!runs.length)
        return '<section class="panel">' + dashPanelHead('Hardware', '') + dashEmpty(dashChecking ? 'Reading the hardware…' : 'No readings yet', last?.hardwareError || 'Run the checks to read CPU, memory and storage.') + '</section>';
    const hw = runs.map(run => run.hardware);
    const latest = hw[hw.length - 1];
    const labels = runs.map(run => new Date(run.time).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }));
    const memory = hw.map(h => h.memoryUsed === null ? 0 : Math.round(dashGB(h.memoryUsed) * 10) / 10);
    const storage = hw.map(h => h.storageUsed === null ? 0 : Math.round(dashGB(h.storageUsed)));
    const scale = (total, values) => Math.max(1, Math.ceil(total ? dashGB(total) : Math.max(...values) * 1.25));
    return dashBarChart([
        { key: 'cpu', tab: 'CPU', title: 'CPU', note: latest.cores ? dashPlural(latest.cores, 'core') : '', legend: 'CPU in use (%)', values: hw.map(h => h.cpu ?? 0), scale: 100, axis: value => String(Math.round(value)), caption: value => value + '%', suffix: ' CPU' },
        { key: 'memory', tab: 'Memory', title: 'Memory', note: latest.memoryTotal ? dashGBText(dashGB(latest.memoryTotal)) + ' installed' : '', legend: 'Memory in use (GB)', values: memory, scale: scale(latest.memoryTotal, memory), axis: value => String(Math.round(value)), caption: value => dashGBText(value), suffix: ' in use' },
        { key: 'storage', tab: 'Storage', title: 'Storage', note: latest.storageTotal ? dashGBText(dashGB(latest.storageTotal)) + ' drive' : '', legend: 'Storage used (GB)', values: storage, scale: scale(latest.storageTotal, storage), axis: value => String(Math.round(value)), caption: value => dashGBText(value), suffix: ' used' },
    ], labels, 'Last ' + dashPlural(runs.length, 'reading'), 'Times are when each check ran', 'hardware');
}
// The latest reading of each part, as a meter.
function dashServerPanel() {
    const latest = dashHardwareRuns().pop()?.hardware;
    const row = (name, share, value, detail) => '<div class="stock-row"><div><div class="stock-row-top"><strong>' + name + '</strong><strong>' + value + '</strong></div><div class="meter' + (share !== null && share >= 90 ? ' high' : '') + '" role="img" aria-label="' + name + ': ' + value + '"><i style="width:' + (share ?? 0) + '%"></i></div><small>' + detail + '</small></div></div>';
    const part = (name, used, total) => { const share = used !== null && total ? Math.round(used / total * 100) : null; return row(name, share, share === null ? '–' : share + '%', used !== null && total ? dashGBText(dashGB(used)) + ' of ' + dashGBText(dashGB(total)) : 'Not available'); };
    const body = latest ? row('CPU', latest.cpu, latest.cpu === null ? '–' : latest.cpu + '%', latest.cores ? dashPlural(latest.cores, 'core') : 'Not available') + part('Memory', latest.memoryUsed, latest.memoryTotal) + part('Storage', latest.storageUsed, latest.storageTotal) : dashEmpty(dashChecking ? 'Reading the hardware…' : 'No readings yet', '');
    return '<section class="panel">' + dashPanelHead('Server', '') + '<div class="stock-list">' + body + '</div></section>';
}
function dashHealthView() {
    const summary = dashHealthSummary();
    const failures = [];
    dashboardHealthLog.slice().reverse().forEach(run => run.results.filter(r => !r.ok).forEach(result => failures.push({ time: run.time, result })));
    const shown = failures.filter(f => dashMatching(f.result.service + ' ' + (f.result.error || ''))).slice(0, 10);
    const incidents = '<section class="panel">' + dashPanelHead('Failed checks', 'Most recent first') + '<div class="incident-list">' + (shown.length ? shown.map(f => '<article class="incident-row"><div class="incident-top"><strong>' + de(f.result.service) + ' check failed</strong>' + ds('Down') + '</div><small>' + dtime(f.time) + '</small><p>' + de(f.result.error || 'No details were recorded.') + '</p></article>').join('') : dashEmpty('No failed checks', 'Every recorded check passed.')) + '</div></section>';
    return '<div class="metric-grid">' + dashMetric('Checks passed', summary.uptime, 'pulse', summary.runs ? 'Across the last ' + dashPlural(summary.runs, 'run') : 'No checks yet') + dashMetric('Average response', summary.average === null ? '–' : dashLatency(summary.average), 'clock', 'Web application, across recorded checks') + dashMetric('Failure rate', summary.errorRate, 'flag', dashPlural(summary.failures, 'failed check') + ' recorded') + dashMetric('Services down', String(summary.down.length), 'bell', summary.down.length ? summary.down.map(r => r.service).join(', ') : 'All checked services are up') + '</div><div class="split">' + dashHealthChart() + dashServicesPanel() + '</div><div class="split">' + dashHardwareChart() + dashServerPanel() + '</div>' + incidents;
}
/* ---------- Admin: activity log ---------- */
// type: [label, tone, filter]. Red ('flag') marks what may be suspicious; admin actions are dark.
const dashActivityTypes = {
    'signin': ['Signed in', 'ok', 'Sign-ins'],
    'signin-failed': ['Failed sign-in', 'flag', 'Sign-ins'],
    'signin-blocked': ['Blocked sign-in', 'flag', 'Sign-ins'],
    'signin-waiting': ['Sign-in before approval', 'muted', 'Sign-ins'],
    'signout': ['Signed out', 'muted', 'Sign-ins'],
    'register': ['Account created', 'ok', 'Accounts'],
    'register-refused': ['Sign-up refused', 'flag', 'Accounts'],
    'order-received': ['Order received', 'ok', 'Orders'],
    'refund-requested': ['Refund requested', 'watch', 'Orders'],
    'refund-accepted': ['Refund accepted', 'watch', 'Orders'],
    'refund-disputed': ['Refund disputed', 'flag', 'Orders'],
    'refund-paid': ['Refund paid', 'watch', 'Orders'],
    'refund-decided': ['Refund decided', 'admin', 'Admin'],
    'password-changed': ['Password changed', 'watch', 'Accounts'],
    'profile-updated': ['Profile updated', 'muted', 'Accounts'],
    'order-placed': ['Order placed', 'info', 'Orders'],
    'order-paid': ['Payment completed', 'ok', 'Orders'],
    'order-updated': ['Order updated', 'muted', 'Orders'],
    'order-cancelled': ['Order cancelled', 'watch', 'Orders'],
    'listing-added': ['Listing added', 'info', 'Listings'],
    'listing-edited': ['Listing edited', 'muted', 'Listings'],
    'price-changed': ['Price changed', 'watch', 'Listings'],
    'listing-paused': ['Listing unpublished', 'muted', 'Listings'],
    'listing-resumed': ['Listing published', 'muted', 'Listings'],
    'listing-removed': ['Listing removed', 'watch', 'Listings'],
    'member-removed': ['Member removed', 'watch', 'Accounts'],
    'rating': ['Order rated', 'muted', 'Reports'],
    'report-filed': ['Report filed', 'watch', 'Reports'],
    'account-suspended': ['Account suspended', 'admin', 'Admin'],
    'account-reactivated': ['Account reactivated', 'admin', 'Admin'],
    'password-reset': ['Password reset', 'admin', 'Admin'],
    'report-upheld': ['Report upheld', 'admin', 'Admin'],
    'report-dismissed': ['Report dismissed', 'admin', 'Admin'],
    'report-reopened': ['Report reopened', 'admin', 'Admin'],
    'warning-given': ['Warning given', 'admin', 'Admin'],
    'warning-withdrawn': ['Warning withdrawn', 'admin', 'Admin'],
    'org-terminated': ['Organization terminated', 'admin', 'Admin'],
    'application-approved': ['Application approved', 'admin', 'Admin'],
    'application-declined': ['Application declined', 'admin', 'Admin'],
    'barangay-added': ['Barangay added', 'admin', 'Admin'],
    'barangay-updated': ['Barangay renamed', 'admin', 'Admin'],
    'barangay-removed': ['Barangay removed', 'admin', 'Admin'],
};
const dashActivityInfo = (type) => dashActivityTypes[type] || [type, 'muted', 'Other'];
const dashFlagged = (e) => dashActivityInfo(e.type)[1] === 'flag';
const dashActivityPill = (type) => { const [label, tone] = dashActivityInfo(type); return '<span class="status act-' + tone + '">' + label + '</span>'; };
const dashLocalDate = (iso) => dashIsoDate(new Date(iso));
const dashTimeOnly = (iso) => new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
const dashFlaggedToday = () => dashboardActivity.filter(e => dashFlagged(e) && dashLocalDate(e.time) === dashToday).length;
const dashRepeat = (count) => count > 1 ? '<span class="repeat-count">×' + count + '</span>' : '';
// Back-to-back repeats of one event by one account show as a single row with a count.
function dashGroupActivity(events) {
    const groups = [];
    events.forEach(e => { const g = groups[groups.length - 1]; if (g && g.first.actor === e.actor && g.first.type === e.type && g.first.detail === e.detail) {
        g.count++;
        g.last = e;
    }
    else
        groups.push({ first: e, last: e, count: 1 }); });
    return groups;
}
const dashActivitySorted = () => dashboardActivity.slice().sort((a, b) => b.time.localeCompare(a.time));
function dashActivityList() {
    const f = dashState.filter;
    return dashActivitySorted().filter(e => {
        const [label, , group] = dashActivityInfo(e.type);
        return dashMatching([e.actor, dashAccountByEmail(e.actor)?.name || '', label, e.detail].join(' ')) && (f === 'All' || (f === 'Flagged' ? dashFlagged(e) : group === f));
    });
}
function dashActivityView() {
    const today = dashboardActivity.filter(e => dashLocalDate(e.time) === dashToday);
    const n = (test) => String(today.filter(test).length);
    const metrics = '<div class="metric-grid">' + dashMetric('Events today', String(today.length), 'eye', '') + dashMetric('Failed sign-ins today', n(e => e.type === 'signin-failed'), 'lock', '') + dashMetric('Blocked sign-ins today', n(e => e.type === 'signin-blocked'), 'flag', '') + dashMetric('Admin actions today', n(e => dashActivityInfo(e.type)[2] === 'Admin'), 'shield', '') + '</div>';
    const events = dashActivityList();
    const rows = dashGroupActivity(events).map(g => {
        const e = g.first;
        const who = dashAccountByEmail(e.actor);
        const when = g.count > 1 ? dashTimeOnly(g.last.time) + ' – ' + dashTimeOnly(e.time) : dashTimeOnly(e.time);
        const person = who ? '<div class="table-product">' + dashAvatar(who, who.name, dashLookKind(who.role)) + '<div><strong>' + de(who.name) + '</strong><small>' + de(who.email) + '</small></div></div>' : '<div class="table-product"><span class="avatar unknown-avatar">?</span><div><strong>' + de(e.actor) + '</strong><small>No account</small></div></div>';
        return '<tr' + (dashFlagged(e) ? ' class="flagged-row"' : '') + '><td><strong>' + when + '</strong><small class="cell-note">' + dd(dashLocalDate(e.time)) + '</small></td><td>' + person + '</td><td>' + dashActivityPill(e.type) + dashRepeat(g.count) + '</td><td class="wrap">' + de(e.detail) + '</td><td><div class="row-actions">' + (who ? '<button class="control small" data-account="' + de(who.email) + '">View</button>' : '') + '</div></td></tr>';
    }).join('');
    const table = events.length ? '<table class="activity-table"><thead><tr><th scope="col">Time</th><th scope="col">Account</th><th scope="col">Activity</th><th scope="col">Details</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table>' : dashEmpty(dashboardActivity.length ? 'No matching activity' : 'No activity yet', dashboardActivity.length ? 'Try another search or filter.' : 'Sign-ins, orders and changes appear here.');
    return metrics + '<section class="panel">' + dashPanelHead('Activity', '') + dashFilters(['All', 'Flagged', 'Sign-ins', 'Accounts', 'Orders', 'Listings', 'Reports', 'Admin'], dashPlural(events.length, 'event'), 'Search activity') + '<div class="table-wrap">' + table + '</div></section>';
}
// The latest events by or about one account, for its pop-up.
function dashAccountActivity(email) {
    const groups = dashGroupActivity(dashActivitySorted().filter(e => e.actor === email || e.target === email)).slice(0, 6);
    if (!groups.length)
        return '';
    return '<h3 class="detail-section">Recent activity</h3><div class="activity-list">' + groups.map(g => '<div class="activity-row' + (dashFlagged(g.first) ? ' flagged' : '') + '">' + dashActivityPill(g.first.type) + dashRepeat(g.count) + '<span class="activity-detail">' + de(g.first.detail) + '</span><small>' + dtime(g.first.time) + '</small></div>').join('') + '</div>';
}
/* ---------- Organization: one farmer organization's own workspace ---------- */
function dashOrgOverview() {
    const p = dashOrgPeriod();
    const orders = dashRoleOrders();
    const crops = dashRoleCrops();
    const open = orders.filter(o => dashNextStep[o.status] || dashRefundOpen(o));
    const [valueTrend, valueDown] = dashTrend(p.value, p.previousValue);
    const [orderTrend, orderDown] = dashTrend(p.orders, p.previousOrders);
    const span = dashState.period === 'week' ? 'previous 7 days' : 'previous 4 weeks';
    const metrics = '<div class="metric-grid">' + dashMetric('Order value', dp(p.value), 'wallet', p.previousValue ? 'Compared with the ' + span : 'Placed with your organization', valueTrend, valueDown) + dashMetric('Orders received', String(p.orders), 'bag', p.previousOrders ? 'Compared with the ' + span : dashState.period === 'week' ? 'Last 7 days' : 'Last 4 weeks', orderTrend, orderDown) + dashMetric('Orders to fulfil', String(open.length), 'clock', 'Waiting on your next step') + dashMetric('Active listings', String(crops.filter(c => dashIsBuyable(c)).length), 'box', dashPlural(crops.length, 'listing') + ' in total') + '</div>';
    const queue = '<section class="panel">' + dashPanelHead('Needs your action', 'Orders waiting on your next step', '<button class="text-button" data-go="orders">All orders ' + di('arrow') + '</button>') + '<div class="queue">' + (open.length ? open.slice(0, 4).map(o => '<div class="queue-row"><img src="' + dashImg(o.image) + '" alt=""><div><strong>' + de(o.crop) + ' · ' + de(o.quantity) + '</strong><small>' + dashOrderNo(o.id) + ' · ' + de(o.customer) + ' · ' + dp(o.total) + '</small><div class="queue-actions">' + ds(o.status) + (dashRefundOpen(o) ? '<button class="control small primary" data-order="' + o.id + '">Answer refund</button>' : '<button class="control small primary" data-advance="' + o.id + '">' + dashNextStep[o.status][1] + '</button>') + '</div></div></div>').join('') : dashEmpty('All caught up', 'No orders are waiting on you.')) + '</div></section>';
    const stock = '<section class="panel">' + dashPanelHead('Stock watch', 'Lowest stock first', '<button class="text-button" data-go="listings">Manage ' + di('arrow') + '</button>') + '<div class="stock-list">' + (crops.length ? crops.slice().sort((a, b) => a.stock - b.stock).slice(0, 4).map(c => '<div class="stock-row"><img src="' + dashImg(c.image) + '" alt=""><div><div class="stock-row-top"><strong>' + de(c.name) + '</strong>' + ds(dashCropStatus(c)) + '</div><div class="meter" role="img" aria-label="' + c.stock + ' ' + de(c.unit) + ' available"><i style="width:' + Math.min(100, Math.round(c.stock / 150 * 100)) + '%"></i></div><small>' + c.stock + ' ' + de(c.unit) + ' available</small></div></div>').join('') : dashEmpty('No listings yet', 'Add your first crop listing.')) + '</div></section>';
    const soon = crops.filter(dashSpoilingSoon).sort((a, b) => dashFreshness(a).left - dashFreshness(b).left);
    const spoiling = '<section class="panel">' + dashPanelHead('Close to spoiling', 'Soonest first', '<button class="text-button" data-go="listings" data-go-filter="Close to spoiling">See all ' + di('arrow') + '</button>') + '<div class="stock-list">' + (soon.length ? soon.slice(0, 4).map(c => '<div class="stock-row"><img src="' + dashImg(c.image) + '" alt=""><div><div class="stock-row-top"><strong>' + de(c.name) + '</strong>' + dashFreshBadge(c) + '</div><small>' + c.stock + ' ' + de(c.unit) + ' left · best before ' + dd(dashAddDays(c.harvested, c.shelfLife)) + '</small></div></div>').join('') : dashEmpty('Nothing close to spoiling', '')) + '</div></section>';
    return dashWarningCallout() + metrics + '<div class="split">' + dashChart(p, 'Placed order totals for your organization', 'Orders placed with your organization') + queue + '</div><div class="split three">' + dashOrderTable('recent') + spoiling + stock + '</div>';
}
// Listings with 0–2 days of shelf life left and stock still on hand (the shop's "Use soon" badge).
const dashSpoilingSoon = (c) => { const left = dashFreshness(c).left; return c.stock > 0 && left >= 0 && left <= 2; };
const dashListingFilters = ['All', 'Active', 'Low stock', 'Close to spoiling', 'Unpublished', 'Out of stock', 'Past shelf life'];
function dashListingCrops() {
    const f = dashState.filter;
    return dashRoleCrops().filter(c => dashMatching(c.name + ' ' + c.organization + ' ' + c.category) && (f === 'All' || !dashListingFilters.includes(f) || (f === 'Close to spoiling' ? dashSpoilingSoon(c) : dashCropStatus(c) === f)));
}
function dashListingTile(c) {
    return '<article class="product-tile"><img src="' + dashImg(c.image) + '" alt="' + de(c.name) + '"><div class="product-tile-copy"><div class="product-tile-head"><h2>' + de(c.name) + '</h2>' + ds(dashCropStatus(c)) + '</div><p>' + de(c.category) + ' · ' + c.id + '</p><div class="product-price"><strong>' + dp(c.price) + '</strong> / ' + de(c.unit) + '</div>' + dashHarvestLine(c, true) + '<div class="product-bottom"><small>' + c.stock + ' ' + de(c.unit) + ' available</small><span class="row-actions">' + (c.status === 'Removed' ? '<button class="control small primary" data-product="' + c.id + '">Details</button>' : '<button class="control small" data-toggle-listing="' + c.id + '"' + (c.stock === 0 ? ' disabled' : '') + '>' + (c.status === 'Active' ? 'Unpublish' : 'Publish') + '</button><button class="control small" data-edit-listing="' + c.id + '">' + di('edit') + 'Edit</button><button class="control small primary" data-product="' + c.id + '">Details</button>') + '</span></div></div></article>';
}
function dashListingGrid() {
    const crops = dashListingCrops();
    const filters = '<div class="filters bare">' + dashListingFilters.map(f => '<button class="filter-chip" data-filter="' + f + '" aria-pressed="' + (dashState.filter === f) + '">' + f + '</button>').join('') + '<span class="filter-summary">' + dashPlural(crops.length, 'listing') + '</span></div>';
    if (crops.length)
        return filters + '<div class="product-grid">' + crops.map(dashListingTile).join('') + '</div>';
    if (dashRoleCrops().length)
        return filters + '<section class="panel">' + dashEmpty('No matching listings.', 'Try another filter or search.') + '</section>';
    return '<section class="panel">' + (dashRoleCrops().length ? dashEmpty('No matching listings.', 'Try a different search.') : dashEmpty('No listings yet', 'Add a crop listing so buyers can find your harvest.') + '<div class="empty-action"><button class="control primary" data-add-listing>' + di('plus') + 'Add listing</button></div>') + '</section>';
}
function dashActiveCropOrders(id) {
    return dashboardOrders.filter(o => !['Completed', 'Cancelled', 'Refunded'].includes(o.status) && o.items?.some(item => item.crop === id));
}
function dashToggleListing(id, confirmActiveOrders = false) {
    const crop = dashboardCrops.find(c => c.id === id);
    if (!crop)
        return;
    const active = dashActiveCropOrders(id);
    if (crop.status === 'Active' && active.length && !confirmActiveOrders) {
        dashOpen('<p class="detail-kicker">Unpublish listing</p><h2 id="detail-title">Unpublish ' + de(crop.name) + '?</h2><p class="detail-subtitle">There ' + (active.length === 1 ? 'is 1 active order' : 'are ' + active.length + ' active orders') + ' for this harvest. New buyers will not be able to order it; existing orders will stay active.</p><div class="detail-actions"><button class="control" data-close-dialog>Keep published</button><button class="control danger" data-toggle-confirm="' + id + '">Unpublish listing</button></div>');
        return;
    }
    void dashDo('listing.toggle', { id, confirmActiveOrders }).then(r => {
        if (!r || !crop)
            return;
        if (dashDialog.open)
            dashProductDetails(id);
        dashToast(crop.name + (crop.status === 'Active' ? ' is published. Buyers can see and order it.' : ' is unpublished. Existing orders stay active.'));
    });
}
function dashOrgFeedbackList() {
    return dashboardFeedback.filter(f => f.organization === dashOrgName && dashMatching(f.customer + ' ' + f.comment + ' ' + f.rating)).sort((a, b) => b.date.localeCompare(a.date));
}
function dashFeedbackRow(f) {
    return '<article class="feedback-row"><header>' + dashStars(f.rating) + '<small>' + dd(f.date) + '</small></header><p>' + (f.comment ? '“' + de(f.comment) + '”' : 'No comment left.') + '</p><small>' + dashUserLink(f.customer) + (f.order ? ' · order ' + dashOrderNo(f.order) : '') + '</small></article>';
}
function dashOrgFeedback() {
    const r = dashRatingOf(dashOrgName);
    const s = dashStanding(dashOrgName);
    const feedback = dashOrgFeedbackList();
    const reports = dashboardReports.filter(x => x.organization === dashOrgName).sort((a, b) => b.date.localeCompare(a.date));
    const count = (status) => reports.filter(x => x.status === status).length;
    const metrics = '<div class="metric-grid">' + dashMetric('Average rating', r.reviews ? r.rating.toFixed(1) + ' ★' : '–', 'star', 'From ' + dashPlural(r.reviews, 'buyer review')) + dashMetric('Reports under review', String(count('Open')), 'clock', '') + dashMetric('Upheld reports', String(count('Upheld')), 'flag', '') + dashMetric('Warnings', s.terminated ? 'Terminated' : s.count + '<small class="metric-unit">/' + dashWarningLimit + '</small>', 'shield', '') + '</div>';
    const list = '<section class="panel">' + dashPanelHead('Buyer feedback', 'Newest first', '<span class="filter-summary">' + dashPlural(feedback.length, 'review') + '</span>') + '<div class="feedback-list">' + (feedback.length ? feedback.map(dashFeedbackRow).join('') : dashEmpty(r.reviews ? 'No matching feedback' : 'No ratings yet', r.reviews ? 'Try a different search.' : 'Buyers can rate their orders once you complete them.')) + '</div></section>';
    const warnings = '<section class="panel">' + dashPanelHead('Warnings from AniBayan', s.label) + '<div class="warning-box">' + dashWarningMeter(dashOrgName) + '</div>' + (s.count ? dashWarningRows(dashOrgName, 'feedback-list', false) : '') + '</section>';
    const table = reports.length ? '<table><thead><tr><th scope="col">Report</th><th scope="col">Reason</th><th scope="col">Details</th><th scope="col">Status</th></tr></thead><tbody>' + reports.map(x => '<tr><td><strong>' + x.id + '</strong><small class="cell-note">' + dfull(x.date) + '</small></td><td>' + de(x.reason) + '</td><td class="wrap">' + de(x.details) + '</td><td>' + ds(x.status) + '</td></tr>').join('') + '</tbody></table>' : dashEmpty('No reports', 'Buyers haven’t reported a problem with your organization.');
    return metrics + '<div class="split">' + list + warnings + '</div><section class="panel">' + dashPanelHead('Reports about your organization', 'Reviewed by AniBayan administrators') + '<div class="table-wrap">' + table + '</div></section>';
}
const dashMyMembers = () => dashboardMembers.filter(m => m.organization === dashOrgName);
function dashMembers() {
    const all = dashMyMembers();
    const members = all.filter(m => dashMatching([m.name, m.place, m.crops, m.status].join(' ')));
    const area = all.reduce((sum, m) => sum + m.area, 0);
    const actions = (m) => '<div class="row-actions">' + (m.status === 'Pending' ? '<button class="control small primary" data-member-confirm="' + m.id + '">' + di('check') + 'Confirm</button>' : '') + '<button class="control small" data-member-remove="' + m.id + '">Remove</button></div>';
    return '<div class="metric-grid three">' + dashMetric('Member farmers', String(all.length), 'people', 'Growers supplying your organization') + dashMetric('Farmed area', area.toFixed(1) + ' ha', 'pin', 'Across all member farms') + dashMetric('Pending membership', String(all.filter(m => m.status === 'Pending').length), 'clock', 'Awaiting your confirmation') + '</div><section class="panel">' + dashPanelHead('Members', '', '<span class="filter-summary">' + dashPlural(members.length, 'member') + '</span>') + '<div class="table-wrap">' + (members.length ? '<table><thead><tr><th scope="col">Farmer</th><th scope="col">Barangay</th><th scope="col">Crops</th><th scope="col">Area</th><th scope="col">Member since</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + members.map(m => '<tr><td><div class="table-product"><span class="avatar organization-avatar">' + dashInitials(m.name) + '</span><div><strong>' + de(m.name) + '</strong>' + (m.applicationMessage ? '<small class="cell-note">Message: ' + de(m.applicationMessage) + '</small>' : '') + '</div></div></td><td>' + de(m.place) + '</td><td>' + de(m.crops) + '</td><td>' + m.area.toFixed(1) + ' ha</td><td>' + de(m.joined) + '</td><td>' + ds(m.status) + '</td><td>' + actions(m) + '</td></tr>').join('') + '</tbody></table>' : dashEmpty(all.length ? 'No matching members' : 'No member farmers yet', all.length ? 'Try a different name, place or crop.' : 'Add the farmers who supply your organization.')) + '</div></section>';
}
function dashOrgPayments() {
    const orders = dashRoleOrders().filter(o => o.status !== 'Cancelled');
    const sum = (list) => list.reduce((total, o) => total + o.total, 0);
    const received = orders.filter(o => o.funds === 'Released' || (o.payment === 'Paid' && !dashOnline(o)));
    const held = orders.filter(o => o.funds === 'Held'), refunded = orders.filter(o => o.funds === 'Refunded'), unpaid = orders.filter(o => o.payment === 'Unpaid');
    return '<div class="metric-grid">' + dashMetric('Received', dp(sum(received)), 'check', dashPlural(received.length, 'order')) + dashMetric('Held by AniBayan', dp(sum(held)), 'clock', dashPlural(held.length, 'order')) + dashMetric('Refunded', dp(sum(refunded)), 'flag', dashPlural(refunded.length, 'order')) + dashMetric('Awaiting payment', dp(sum(unpaid)), 'wallet', dashPlural(unpaid.length, 'order')) + '</div>' + dashOrderTable('payments');
}
/* ---------- Consumer: shop, cart, saved harvests and growers ---------- */
const dashShopCrops = () => dashboardCrops.filter(dashIsBuyable);
const dashShopSorts = {
    fresh: ['Freshest harvest first', (a, b) => dashFreshness(a).age - dashFreshness(b).age],
    'price-asc': ['Price: low to high', (a, b) => a.price - b.price],
    'price-desc': ['Price: high to low', (a, b) => b.price - a.price],
    rating: ['Highest rated', (a, b) => dashRatingOf(b.organization).rating - dashRatingOf(a.organization).rating],
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
// actions: the save, details and cart buttons, for the buyer pages only (profiles also show tiles to organizations and admins).
function dashConsumerTile(c, actions = true) {
    const saved = dashIsSaved(c.id);
    const buyable = dashIsBuyable(c);
    const badge = buyable ? dashFreshBadge(c) : ds(c.stock === 0 ? 'Out of stock' : c.status !== 'Active' ? 'Unpublished' : 'Past shelf life');
    return '<article class="product-tile"><div class="product-media"><img src="' + dashImg(c.image) + '" alt="' + de(c.name) + '">' + badge + '</div><div class="product-tile-copy"><div class="product-tile-head"><h2>' + de(c.name) + '</h2>' + (actions ? '<button class="save-button" data-save="' + c.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? 'Unsave ' : 'Save ') + de(c.name) + '">' + di('heart') + '</button>' : '') + '</div><p>' + de(c.organization) + ' · ' + dashRatingText(c.organization) + '<br>' + de(c.category) + ' · ' + de(dashRegion(c.organization)) + '</p><div class="product-price"><strong>' + dp(c.price) + '</strong> / ' + de(c.unit) + '</div>' + dashHarvestLine(c) + (actions ? '<div class="product-bottom"><span class="row-actions"><button class="control small" data-product="' + c.id + '">Details</button>' + (buyable ? '<button class="control small primary" data-add-cart="' + c.id + '">' + di('cart') + 'Add to cart</button>' : '') + '</span></div>' : '') + '</div></article>';
}
const dashShopSummary = (shown) => shown + ' of ' + dashPlural(dashShopCrops().length, 'harvest');
function dashShopGrid(crops) {
    if (crops.length)
        return '<div class="product-grid">' + crops.map(c => dashConsumerTile(c)).join('') + '</div>';
    const [min, max] = dashPriceBounds();
    const reversed = min !== null && max !== null && min > max;
    const unavailable = dashState.query.trim() ? dashboardCrops.filter(c => !dashIsBuyable(c) && dashMatching(c.name + ' ' + c.organization + ' ' + c.category)) : [];
    const description = reversed ? 'Swap the two prices or clear one of them.' : unavailable.length ? unavailable.map(c => c.name + ' is ' + (c.stock === 0 ? 'out of stock' : c.status !== 'Active' ? 'unpublished by its grower' : 'past its shelf life')).join('. ') + ' right now.' : 'Try a wider price range, another crop type, harvest time or location.';
    return '<section class="panel">' + dashEmpty(reversed ? 'The minimum price is higher than the maximum.' : 'No harvests match these filters.', de(description)) + '<div class="empty-action"><button class="control" data-shop-reset>Clear filters</button></div></section>';
}
// The banner over the shop: what's on offer and quick crop-type buttons.
function dashShopHero() {
    const crops = dashShopCrops();
    if (!crops.length)
        return '';
    const types = [...new Set(crops.map(c => c.category))].sort();
    return '<section class="shop-hero"><div class="shop-hero-copy"><h2>Fresh from the field this week.</h2><p class="shop-hero-stats"><span><b>' + crops.length + '</b> harvests</span><span><b>' + new Set(crops.map(c => c.organization)).size + '</b> growing communities</span><span>from <b>' + dp(Math.min(...crops.map(c => c.price))) + '</b></span></p><div class="shop-hero-chips">' + types.map(t => '<button class="hero-chip" data-shop-type="' + de(t) + '" aria-pressed="' + (dashState.shop.type === t) + '">' + de(t) + '</button>').join('') + '</div></div></section>';
}
function dashShop() {
    const s = dashState.shop;
    const crops = dashShopList();
    const prices = dashShopCrops().map(c => c.price);
    const opt = (value, label, current) => '<option value="' + de(value) + '"' + (value === current ? ' selected' : '') + '>' + de(label) + '</option>';
    const types = [...new Set(dashboardCrops.map(c => c.category))].sort();
    const regions = [...new Set(dashboardOrganizations.filter(o => o.status === 'Active').map(o => o.region))].sort();
    const price = (key, label, bound) => '<input type="number" min="0" step="1" inputmode="numeric" data-shop="' + key + '" value="' + de(s[key]) + '" placeholder="' + label + ' ' + bound + '" aria-label="' + (key === 'min' ? 'Minimum' : 'Maximum') + ' price in pesos">';
    return dashShopHero() + '<section class="panel shop-filters" aria-label="Filter harvests"><div class="shop-filter-grid">'
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
// The server checks the stock and how much is already in the cart, and adds what's left.
async function dashAddToCart(id, quantity, form) {
    if (!dashRequireBuyer())
        return false;
    const crop = dashboardCrops.find(c => c.id === id);
    if (!crop)
        return false;
    const left = crop.stock - (dashCart().find(l => l.crop === id)?.quantity || 0);
    const errors = {};
    if (!Number.isInteger(quantity) || quantity < 1)
        errors.quantity = 'Enter a whole quantity of at least 1.';
    else if (quantity > left)
        errors.quantity = 'Only ' + Math.max(0, left) + ' ' + crop.unit + ' available in stock.';
    if (form && !dashShowErrors(form, errors))
        return false;
    if (!form && Object.keys(errors).length) {
        dashToast(errors.quantity);
        return false;
    }
    const r = await dashDo('cart.add', { crop: id, quantity }, form);
    if (r)
        dashToast(r.added + ' ' + crop.unit + ' of ' + crop.name + ' added to your cart.');
    return !!r;
}
function dashCartView() {
    const allEntries = dashCartEntries();
    const ids = new Set(allEntries.map(e => e.crop.id));
    dashCartKnown.forEach(id => { if (!ids.has(id)) {
        dashCartKnown.delete(id);
        dashCartSelection.delete(id);
    } });
    allEntries.forEach(e => { if (!dashCartKnown.has(e.crop.id))
        dashCartSelection.add(e.crop.id); dashCartKnown.add(e.crop.id); });
    if (!allEntries.length)
        return '<section class="panel">' + dashEmpty('Your cart is empty.', 'Add harvests from the shop to order them.') + '<div class="empty-action"><button class="control primary" data-go="shop">' + di('store') + 'Shop the harvest</button></div></section>';
    const entries = allEntries.filter(e => dashMatching(e.crop.name + ' ' + e.crop.organization + ' ' + e.crop.category));
    if (!entries.length)
        return '<section class="panel">' + dashEmpty('No cart items match your search.', 'Try another crop or organization name.') + '</section>';
    const selected = allEntries.filter(e => dashCartSelection.has(e.crop.id));
    const orgs = [...new Set(entries.map(e => e.crop.organization))];
    const selectedOrgs = [...new Set(selected.map(e => e.crop.organization))];
    const row = (e) => {
        const problem = dashCartProblem(e);
        return '<div class="cart-row"><label class="cart-select"><input type="checkbox" data-cart-select="' + e.crop.id + '" aria-label="Select ' + de(e.crop.name) + ' for checkout"' + (dashCartSelection.has(e.crop.id) ? ' checked' : '') + '></label><img src="' + dashImg(e.crop.image) + '" alt=""><div class="cart-row-copy"><strong>' + de(e.crop.name) + '</strong><small>' + dp(e.crop.price) + ' / ' + de(e.crop.unit) + ' · harvested ' + dd(e.crop.harvested) + '</small>' + (problem ? '<small class="cart-problem">' + de(problem) + '</small>' : '') + '</div><div class="qty-stepper" role="group" aria-label="Quantity of ' + de(e.crop.name) + '"><button class="qty-button" data-cart-step="' + e.crop.id + '" data-step="-1" aria-label="One less"' + (e.line.quantity <= 1 ? ' disabled' : '') + '>−</button><span>' + e.line.quantity + ' ' + de(e.crop.unit) + '</span><button class="qty-button" data-cart-step="' + e.crop.id + '" data-step="1" aria-label="One more"' + (e.line.quantity >= e.crop.stock ? ' disabled' : '') + '>+</button></div><strong class="cart-line-total">' + dp(e.line.quantity * e.crop.price) + '</strong><button class="table-action" data-cart-remove="' + e.crop.id + '" aria-label="Remove ' + de(e.crop.name) + ' from your cart">×</button></div>';
    };
    const selectAll = entries.length > 0 && entries.every(e => dashCartSelection.has(e.crop.id));
    const subtotal = (org) => selected.filter(e => e.crop.organization === org).reduce((sum, e) => sum + e.line.quantity * e.crop.price, 0);
    const total = selected.reduce((sum, e) => sum + e.line.quantity * e.crop.price, 0);
    const problems = selected.filter(e => dashCartProblem(e)).length;
    const list = '<section class="panel">' + dashPanelHead('Items', dashPlural(allEntries.length, 'harvest') + ' in your cart', '<label class="check-row cart-select-all"><input type="checkbox" data-cart-select-all aria-label="Select all visible cart items"' + (selectAll ? ' checked' : '') + '>Select all</label><button class="text-button" data-cart-clear>Clear cart</button>') + '<div class="cart-list">' + orgs.map(org => '<div class="cart-group"><div class="cart-group-head"><strong>' + de(org) + '</strong></div>' + entries.filter(e => e.crop.organization === org).map(row).join('') + '</div>').join('') + '</div></section>';
    const summary = '<section class="panel cart-summary">' + dashPanelHead('Order summary', dashPlural(selected.length, 'selected harvest')) + '<dl class="summary-lines">' + selectedOrgs.map(org => '<div><dt>' + de(org) + '</dt><dd>' + dp(subtotal(org)) + '</dd></div>').join('') + '<div class="summary-total"><dt>Total</dt><dd>' + dp(total) + '</dd></div></dl><p class="summary-note">' + (!selected.length ? 'Select at least one harvest to continue.' : selectedOrgs.length > 1 ? 'You’ll place ' + selectedOrgs.length + ' orders, one with each organization.' : 'Your order goes straight to ' + de(selectedOrgs[0]) + '.') + ' Delivery is arranged with each organization. Items you leave unselected stay in your cart.</p>' + (problems ? '<p class="cart-problem summary-problem">Remove or update ' + dashPlural(problems, 'selected item') + ' before checking out.</p>' : '') + '<div class="summary-actions"><button class="control primary" data-checkout' + (!selected.length || problems ? ' disabled' : '') + '>Check out ' + di('arrow') + '</button></div></section>';
    return '<div class="split cart-split">' + list + summary + '</div>';
}
function dashSavedView() {
    const crops = dashboardCrops.filter(c => dashIsSaved(c.id) && dashMatching(c.name + ' ' + c.organization + ' ' + c.category));
    return '<div class="filters bare"><button class="text-button" data-go="shop">Browse the shop ' + di('arrow') + '</button><span class="filter-summary">' + dashPlural(dashSavedList().length, 'saved harvest') + '</span></div>' + (crops.length ? '<div class="product-grid">' + crops.map(c => dashConsumerTile(c)).join('') + '</div>' : '<section class="panel">' + dashEmpty('No saved harvests here yet.', 'Save a harvest from the shop to see it here.') + '</section>');
}
function dashOrganizationGrid() {
    const orgs = dashboardOrganizations.filter(o => o.status === 'Active' && dashMatching(o.name + ' ' + o.region + ' ' + o.crop));
    return orgs.length ? '<div class="org-grid">' + orgs.map(o => '<article class="org-card"><img src="' + dashImg(o.image) + '" alt="' + de(o.name) + '"><div><h2>' + de(o.name) + '</h2><p>' + de(o.region) + ' · ' + de(o.crop) + '</p><p class="org-rating">' + dashRatingText(o.name) + '</p><footer><span class="filter-summary">' + dashPlural(dashListingCount(o.name), 'listing') + '</span><a class="control" href="#org=' + dashSlug(o.name) + '" data-profile-link>View community ' + di('up') + '</a></footer></div></article>').join('') + '</div>' : '<section class="panel">' + dashEmpty('No matching communities', 'Try a different place or name.') + '</section>';
}
function dashActiveOrder() {
    const order = dashRoleOrders().find(o => !['Completed', 'Cancelled', 'Refunded'].includes(o.status));
    if (!order)
        return '<section class="panel">' + dashPanelHead('Nothing on its way right now.', '') + '<div class="active-order"><div class="active-order-foot"><p>Fresh harvests are waiting in the shop.<br>Your next order will show up here.</p><button class="control primary" data-go="shop">Shop the harvest ' + di('arrow') + '</button></div></div></section>';
    const step = dashOrderStep(order.status);
    const message = order.status === 'Pending' ? 'Waiting for your grower to confirm your order.' : order.status === 'Confirmed' ? 'Your grower confirmed your order.' : order.status === 'Delivered' ? 'Your order was delivered. Did it arrive?' : order.status === 'Refund requested' ? 'Your refund request is with your grower.' : 'Your grower is preparing your order.';
    return '<section class="panel">' + dashPanelHead('Your harvest is coming together.', '', '<span class="filter-summary">' + dashOrderNo(order.id) + '</span>') + '<div class="active-order"><div class="active-order-top"><img src="' + dashImg(order.image) + '" alt="' + de(order.crop) + '"><div><h3>' + de(order.crop) + '</h3><p>' + de(order.organization) + ' · ' + de(order.quantity) + '</p></div>' + ds(order.status) + '</div><div class="order-progress">' + ['Placed', 'Confirmed', 'Preparing', 'Delivered', 'Received'].map((s, i) => '<div class="progress-step ' + (i < step ? 'done' : i === step ? 'current' : '') + '"><i></i>' + s + '</div>').join('') + '</div><div class="active-order-foot"><p>Good things take a little care.<br>' + message + '</p><button class="control primary" data-order="' + order.id + '">View order ' + di('arrow') + '</button></div></div></section>';
}
function dashConsumerOverview() {
    const own = dashRoleOrders();
    const saved = dashboardCrops.filter(c => dashIsSaved(c.id));
    return '<section class="consumer-banner"><div class="eyebrow">Rooted in community. Grown for you.</div><h2>Fresh from their fields.<br>A little closer to your table.</h2><p>Meet the people behind your everyday food.</p><button class="control primary" data-go="shop">Explore the harvest ' + di('arrow') + '</button><img class="banner-harvest" src="assets/vegetable-cutout.png" alt=""><img class="banner-leaf" src="assets/mango-branch.png" alt=""></section><div class="metric-grid">' + dashMetric('Active orders', String(own.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length), 'bag', 'Being prepared by your growers') + dashMetric('Completed orders', String(own.filter(o => o.status === 'Completed').length), 'check', 'Local harvests brought home') + dashMetric('Saved harvests', String(saved.length), 'heart', 'Good things to come back to') + dashMetric('Growing connections', String(new Set(own.map(o => o.organization)).size), 'leaf', 'Communities you’ve ordered from') + '</div><div class="split">' + dashActiveOrder() + '<section class="panel grower-mini"><img src="assets/grower.png" alt="A vegetable grower at work"><div class="grower-mini-copy"><small>The people behind your harvest</small><h2>Rooted in<br>Calapan City.</h2><a href="#growers">Meet your growing community ' + di('up') + '</a></div></section></div><div class="split">' + dashOrderTable('recent') + '<section class="panel">' + dashPanelHead('Saved for later', '', '<button class="text-button" data-go="saved">View all ' + di('arrow') + '</button>') + '<div class="saved-mini">' + saved.slice(0, 4).map(c => '<div class="saved-row"><img src="' + dashImg(c.image) + '" alt=""><div><strong>' + de(c.name) + '</strong><p>' + dp(c.price) + ' / ' + de(c.unit) + ' · harvested ' + dd(c.harvested) + '</p></div><button class="save-button" data-save="' + c.id + '" aria-pressed="true" aria-label="Unsave ' + de(c.name) + '">' + di('heart') + '</button></div>').join('') + (saved.length ? '' : dashEmpty('Nothing saved yet', 'Your saved harvests will appear here.')) + '</div></section></div>';
}
function dashSettings() {
    // Resetting puts the shared database back to the starting data for everyone, so only administrators have it.
    const appearance = '<section class="panel settings-panel"><h2>Appearance</h2><p>Adjust the dashboard to your preferred reading density.</p><div class="settings-row"><label for="density">Compact table rows</label><input type="checkbox" id="density" ' + (document.body.classList.contains('compact-density') ? 'checked' : '') + '></div><div class="settings-row"><label for="contrast">Stronger contrast</label><input type="checkbox" id="contrast" ' + (document.body.classList.contains('contrast-mode') ? 'checked' : '') + '></div>' + (isAdminDashboard ? '<h2 class="settings-subhead">Data</h2><div class="detail-actions"><button class="control danger" data-reset-data>Reset all data</button></div>' : '') + '</section>';
    const facts = (rows) => '<dl class="detail-facts">' + rows.map(r => '<div><dt>' + r[0] + '</dt><dd>' + de(r[1]) + '</dd></div>').join('') + '</dl>';
    const me = dashAccount();
    const common = '<a class="control" href="login.html" data-sign-out>' + di('logout') + 'Sign out</a><button class="control" data-change-password>' + di('key') + 'Change password</button>';
    let account = '';
    if (isAdminDashboard)
        account = '<section class="panel settings-panel"><h2>Administrator account</h2>' + facts([['Name', me.name], ['Email', me.email], ['Role', 'Platform administrator'], ['Administrator since', dmonth(me.joined)]]) + '<div class="detail-actions">' + common + '</div></section>';
    else if (isOrgDashboard) {
        const o = dashOrgProfile();
        account = '<section class="panel settings-panel"><h2>' + de(o.name) + '</h2><p>' + ds('Active') + ' &nbsp;' + de(o.verified) + '</p>' + (o.description ? '<p>' + de(o.description) + '</p>' : '') + facts([['Location', o.region], ['Main crops', o.crops], ['Representative', o.representative], ['Contact email', o.email], ['Contact number', o.phone || 'Not added yet'], ['Warnings', dashStanding(o.name).label]]) + '<div class="detail-actions">' + common + '<a class="control" href="consumer.html#org=' + dashSlug(o.name) + '">View storefront ' + di('up') + '</a><button class="control primary" data-edit-org-profile>' + di('edit') + 'Edit profile</button></div></section>';
        const org = dashMyOrg();
        if (org)
            return dashOrgCard(org, 'h2', '<a class="control" href="#org=' + dashSlug(org.name) + '" data-profile-link>' + di('user') + 'View profile</a>') + '<div class="settings-grid">' + account + appearance + '</div>';
    }
    else {
        account = '<section class="panel settings-panel"><h2>Your account</h2>' + facts([['Name', me.name], ['Email', me.email], ['Mobile number', me.phone || 'Not added yet'], ['Member since', dmonth(me.joined)]]) + '<div class="detail-actions">' + common + '<button class="control" data-edit-profile>' + di('edit') + 'Edit mobile number</button></div></section>' + dashAddressBook(me);
        const p = dashPrivacy(me);
        const toggle = (key, label) => '<div class="settings-row"><label for="privacy-' + key + '">' + label + '</label><input type="checkbox" id="privacy-' + key + '" data-privacy="' + key + '"' + (p[key] ? ' checked' : '') + (key !== 'profile' && !p.profile ? ' disabled' : '') + '></div>';
        const privacy = '<section class="panel settings-panel"><h2>Privacy</h2>' + toggle('profile', 'Public profile') + toggle('reviews', 'Show my reviews') + toggle('city', 'Show my city') + toggle('growers', 'Show the growers I buy from') + '</section>';
        return dashUserCard(me, 'h2', '<a class="control" href="#user=' + dashSlug(me.name) + '" data-profile-link>' + di('user') + 'View profile</a>', true) + '<div class="settings-grid">' + account + privacy + appearance + '</div>';
    }
    return '<div class="settings-grid">' + account + appearance + '</div>';
}
function dashHelp() {
    const rows = isAdminDashboard ? [['Suspend, reactivate or reset accounts', 'accounts', 'Accounts'], ['Watch sign-ins and other activity', 'activity', 'Activity log'], ['Uphold or dismiss buyer reports, and warn organizations', 'reports', 'User reports'], ['Approve or decline organization applications', 'applications', 'Applications'], ['Check that AniBayan’s services are up', 'health', 'Site health']]
        : isOrgDashboard ? [['Confirm and prepare incoming orders', 'orders', 'Incoming orders'], ['Add, edit, publish or unpublish crop listings', 'listings', 'My listings'], ['See your ratings and any warnings', 'feedback', 'Ratings & feedback'], ['Add or confirm member farmers', 'members', 'Member farmers'], ['Update your organization profile', 'settings', 'Organization profile']]
            : isGuest ? [['Browse and filter harvests', 'shop', 'Shop'], ['Meet the growing communities', 'growers', 'Growers']]
                : [['Browse and filter harvests', 'shop', 'Shop'], ['Check out your cart', 'cart', 'Cart'], ['Follow, pay, rate or report your orders', 'orders', 'My orders'], ['Update your delivery details', 'settings', 'My profile']];
    return '<section class="panel settings-panel"><h2>Here to help you grow.</h2><p>Where to go for each task.</p>' + rows.map(r => '<div class="settings-row"><span>' + r[0] + '</span><button class="control" data-go="' + r[1] + '">' + r[2] + ' ' + di('arrow') + '</button></div>').join('') + (isGuest ? '<div class="settings-row"><span>Order harvests, save favourites and rate growers</span><a class="control primary" href="login.html" data-sign-in>Sign in ' + di('arrow') + '</a></div>' : '') + '</section>';
}
// Sidebar badges: open reports and pending applications for admins, orders needing attention otherwise, cart lines for buyers.
function dashNavCounts() {
    if (isAdminDashboard)
        return { activity: dashFlaggedToday(), reports: dashOpenReports(), refunds: dashboardOrders.filter(o => o.refund?.status === 'Disputed').length, applications: dashPendingApplications() };
    const orders = dashRoleOrders();
    if (isOrgDashboard)
        return { orders: orders.filter(o => o.status === 'Pending').length, members: dashMyMembers().filter(m => m.status === 'Pending').length };
    return { orders: orders.filter(o => !['Completed', 'Cancelled', 'Refunded'].includes(o.status)).length, cart: dashCart().length };
}
function dashRender() {
    // A table's search box is redrawn with the table; keep the cursor in it, even when a health check finishes mid-typing.
    const typing = document.activeElement instanceof HTMLInputElement && document.activeElement.dataset.tableSearch !== undefined ? [document.activeElement.selectionStart ?? 0, document.activeElement.selectionEnd ?? 0] : null;
    const search = document.getElementById('dashboard-search');
    if (search.value !== dashState.query)
        search.value = dashState.query;
    // A grower's profile belongs under Growers; your own profile under your profile settings.
    const p = dashState.profile;
    const navView = dashState.view !== 'profile' ? dashState.view : p.kind === 'org' ? (isOrgDashboard && dashMyOrg() && dashSlug(dashOrgName) === p.slug ? 'settings' : 'growers') : (dashMe() && dashSlug(dashMe().name) === p.slug ? 'settings' : '');
    document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === navView)
        a.setAttribute('aria-current', 'page');
    else
        a.removeAttribute('aria-current'); });
    document.querySelectorAll('[data-me-avatar]').forEach(el => { el.outerHTML = dashShellAvatar(); });
    const counts = dashNavCounts();
    document.querySelectorAll('[data-nav-count]').forEach(el => { const count = counts[el.dataset.navCount] || 0; el.textContent = String(count); el.hidden = count === 0; });
    dashRenderNotifications();
    const blocked = dashBlocked();
    const view = dashState.view;
    let content = '';
    if (blocked.length)
        content = '<section class="panel blocked-panel">' + di('lock') + '<h1>' + de(blocked[0]) + '</h1><p>' + de(blocked[1]) + '</p><div class="detail-actions"><a class="control" href="index.html">Back to homepage</a><a class="control primary" href="login.html" data-sign-out>Sign in with another account</a></div></section>';
    else if (view === 'overview')
        content = isAdminDashboard ? dashAdminOverview() : isOrgDashboard ? dashOrgOverview() : dashConsumerOverview();
    else if (view === 'accounts')
        content = dashAccountsView();
    else if (view === 'reports')
        content = dashReportsView();
    else if (view === 'refunds')
        content = dashRefundsView();
    else if (view === 'applications')
        content = dashApplicationsView();
    else if (view === 'health')
        content = dashHealthView();
    else if (view === 'activity')
        content = dashActivityView();
    else if (view === 'orders')
        content = dashOrderTable('all');
    else if (view === 'listings')
        content = isAdminDashboard ? dashAdminListingsView() : dashListingGrid();
    else if (view === 'barangays')
        content = dashBarangaysAdminView();
    else if (view === 'feedback')
        content = dashOrgFeedback();
    else if (view === 'shop')
        content = dashShop();
    else if (view === 'cart')
        content = dashCartView();
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
    else if (view === 'profile')
        content = p.kind === 'org' ? dashOrgProfileView(p.slug) : dashUserProfileView(p.slug);
    else
        content = dashHelp();
    document.getElementById('dashboard-content').innerHTML = (blocked.length || view === 'profile' ? '' : dashHeading()) + content + '<footer class="design-note"><span>AniBayan · ' + dashRole.workspace + '</span><span>' + (dashMe() ? 'Signed in as ' + de(dashMe().email) : 'Browsing as a guest') + '</span></footer>';
    const box = typing ? document.querySelector('[data-table-search]') : null;
    if (box && typing) {
        box.focus({ preventScroll: true });
        box.setSelectionRange(typing[0], typing[1]);
    }
    dashShowReposition();
}
function dashNavigate(view) { if (location.hash.slice(1) === view)
    dashReadHash();
else
    location.hash = view; }
function dashOpen(html) { const content = document.getElementById('detail-content'); content.innerHTML = html; dashSetupPasswordToggles(content); if (!dashDialog.open)
    dashDialog.showModal(); }
function dashFocusField(selector) { document.querySelector('#detail-content ' + selector)?.focus(); }
const dashFact = (label, value) => '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>';
const dashFileSize = (bytes) => bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + ' KB' : (bytes / 1024 / 1024).toFixed(1) + ' MB';
// Each file an organization attached to its application, opened in a new tab from the server (administrators only).
const dashDocumentLinks = (documents) => documents.length ? documents.map(d => '<a class="profile-link" href="../api/documents/' + d.id + '" target="_blank" rel="noopener">' + de(d.type) + '</a><small class="fact-note">' + de(d.name) + ' · ' + dashFileSize(d.size) + '</small>').join('') : 'None';
/* ---------- Detail dialogs ---------- */
function dashOrderDetails(id) {
    const order = dashRoleOrders().find(o => o.id === id);
    if (!order)
        return;
    const current = dashOrderStep(order.status);
    const next = isOrgDashboard ? dashNextStep[order.status] : undefined;
    const receipt = dashHasReceipt(order) ? '<button class="control" data-receipt="' + order.id + '">' + di('clipboard') + 'Receipt</button>' : '';
    let actions = receipt + '<button class="control primary" data-close-dialog>Close</button>';
    let notes = '';
    if (next)
        actions = receipt + (order.status === 'Pending' ? '<button class="control danger" data-decline="' + order.id + '">Decline order</button>' : order.buyerSuspended && ['Confirmed', 'Processing'].includes(order.status) ? '<button class="control danger" data-decline="' + order.id + '">Cancel order</button>' : '') + '<button class="control primary" data-advance="' + order.id + '">' + next[1] + '</button>';
    if (isOrgDashboard && dashRefundOpen(order))
        actions = receipt + '<button class="control danger" data-dispute-refund="' + order.id + '">Dispute</button><button class="control primary" data-accept-refund-ask="' + order.id + '">Accept refund</button>';
    if (isConsumerDashboard) {
        const feedback = dashboardFeedback.find(f => f.order === order.id);
        const report = dashMyReport(order.id);
        const canRate = order.status === 'Completed' && !feedback;
        const canPay = order.payment === 'Unpaid' && dashOnline(order) && order.status !== 'Cancelled';
        if (feedback)
            notes += '<p class="detail-note">You rated this order ' + dashStars(feedback.rating) + (feedback.comment ? ' · “' + de(feedback.comment) + '”' : '') + '</p>';
        if (report)
            notes += '<p class="detail-note">Your report ' + report.id + ' (' + de(report.reason.toLowerCase()) + ') is ' + (report.status === 'Open' ? 'under review' : report.status.toLowerCase()) + '.' + (report.decisionNote ? ' AniBayan’s note: ' + de(report.decisionNote) : '') + '</p>';
        const main = canPay ? '<button class="control primary" data-pay-order="' + order.id + '">Pay ' + dp(order.total) + '</button>' : order.status === 'Delivered' ? '<button class="control primary" data-order-received="' + order.id + '">' + di('check') + 'Order received</button>' : canRate ? '<button class="control primary" data-rate="' + order.id + '">' + di('star') + 'Rate this order</button>' : '<button class="control primary" data-close-dialog>Close</button>';
        actions = (order.status === 'Pending' ? '<button class="control danger" data-cancel-order="' + order.id + '">Cancel order</button>' : '') + (report ? '' : '<button class="control" data-report-order="' + order.id + '">' + di('flag') + 'Report a problem</button>') + receipt + (dashCanRefund(order) ? '<button class="control" data-request-refund="' + order.id + '">Request refund</button>' : '') + main;
    }
    const items = order.items ? '<h3 class="detail-section">Items</h3><dl class="summary-lines">' + order.items.map(i => '<div><dt>' + de(i.name) + ' · ' + i.quantity + ' ' + de(i.unit) + '</dt><dd>' + dp(i.quantity * i.price) + '</dd></div>').join('') + '<div class="summary-total"><dt>Total</dt><dd>' + dp(order.total) + '</dd></div></dl>' : '';
    const pin = order.lat !== undefined && order.lng !== undefined ? '<a class="profile-link fact-note" href="https://www.google.com/maps?q=' + order.lat + ',' + order.lng + '" target="_blank" rel="noopener">' + di('pin') + 'Open the pin in Google Maps</a>' : '';
    const delivery = order.address ? dashFact('Deliver to', de(order.address) + pin) + dashFact('Contact number', de(order.phone || '')) + dashFact('Payment method', de(order.method || '')) + (order.note ? dashFact('Note', de(order.note)) : '') : '';
    const dates = (order.deliveredAt ? dashFact('Delivered', dtime(order.deliveredAt)) : '') + (order.receivedAt ? dashFact('Received', dtime(order.receivedAt)) : '');
    const r = order.refund;
    const refund = r ? '<h3 class="detail-section">Refund request · ' + r.id + '</h3><dl class="detail-facts">' + dashFact('Status', ds(dashRefundStage(r))) + dashFact('Reason', de(r.reason)) + dashFact('Requested', dtime(r.requestedAt)) + (r.status === 'Requested' ? dashFact(isOrgDashboard ? 'Answer by' : 'Answer due', ddate(r.respondBy)) : r.status === 'Disputed' && r.disputedAt ? dashFact('Disputed', ddate(r.disputedAt)) : r.decidedAt ? dashFact('Settled', ddate(r.decidedAt) + (r.decidedBy === 'automatic' ? '<small class="fact-note">No answer in time</small>' : r.decidedBy === 'admin' ? '<small class="fact-note">By AniBayan</small>' : '')) : '') + '</dl><p class="detail-lead">' + de(r.details) + '</p>' + dashRefundMedia(r) + (r.disputeReason ? '<p class="detail-note">' + de(order.organization) + ': “' + de(r.disputeReason) + '”</p>' : '') + (r.adminNote ? '<p class="detail-note">AniBayan: “' + de(r.adminNote) + '”</p>' : '') : '';
    const steps = ['Order placed', 'Confirmed by grower', 'Harvest being prepared', 'Delivered', 'Order received'];
    const timeline = order.status === 'Cancelled' ? '<p class="detail-note">' + (order.cancelReason ? de(order.cancelReason) + ' ' : '') + 'This order was cancelled and will not be fulfilled.</p>' : '<ol class="timeline">' + steps.map((s, i) => '<li class="' + (i > current ? 'future' : '') + '"><strong>' + s + '</strong><p>' + (i > current ? 'Not reached yet' : i === current ? 'Current status' : 'Completed step') + '</p></li>').join('') + '</ol>';
    dashOpen('<p class="detail-kicker">' + (isOrgDashboard ? 'Incoming order' : 'Your order') + '</p><h2 id="detail-title">' + order.id + '</h2><p class="detail-subtitle">' + dashOrgLink(order.organization) + '</p><div class="detail-hero"><img src="' + dashImg(order.image) + '" alt="' + de(order.crop) + '"><div><h3>' + de(order.crop) + '</h3><p>' + de(order.quantity) + ' · ' + dp(order.total) + '</p></div></div><dl class="detail-facts">' + dashFact('Order status', ds(order.status)) + dashFact('Payment', ds(order.payment)) + (order.funds ? dashFact('Funds', dashFundsText(order)) : '') + dashFact('Placed on', dfull(order.date)) + dashFact('Buyer', dashUserLink(order.customer) + (order.buyerSuspended ? ' ' + ds('Suspended') : '')) + dates + delivery + '</dl>' + items + refund + timeline + notes + '<div class="detail-actions">' + actions + '</div>');
}
function dashOrderDeclineForm(id) {
    const order = dashboardOrders.find(o => o.id === id);
    if (!order)
        return;
    dashOpen('<p class="detail-kicker">Decline order · ' + dashOrderNo(id) + '</p><h2 id="detail-title">Explain the decision to ' + de(order.customer) + '</h2><p class="detail-subtitle">The buyer will see this note in the order status and order details.</p><form class="dash-form" id="order-decline-form" data-order="' + de(id) + '" novalidate><div class="form-grid single">' + dashField('reason', 'Reason for declining' + dashRequired, '<textarea required minlength="10" maxlength="300" rows="4" placeholder="For example, the requested harvest is no longer available."></textarea>', 'Give a clear reason with at least 10 characters.', true) + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Keep order</button><button type="submit" class="control danger">Decline order</button></div></form>');
    dashFocusField('#field-reason');
}
function dashSubmitOrderDecline(form) {
    const id = form.dataset.order || '';
    const reason = String(new FormData(form).get('reason') ?? '').trim();
    if (!dashShowErrors(form, reason.length >= 10 ? {} : { reason: 'Explain why the order was declined in at least 10 characters.' }))
        return;
    void dashDo('order.decline', { order: id, reason }, form).then(r => {
        if (r) {
            dashOrderDetails(id);
            dashToast('Order declined. The buyer can see your reason in the order details.');
        }
    });
}
function dashProductDetails(id) {
    const crop = dashboardCrops.find(c => c.id === id);
    if (!crop)
        return;
    const f = dashFreshness(crop);
    const harvest = dashFact('Harvested', dfull(crop.harvested) + ' · ' + dashAgeText(f.age)) + dashFact('Shelf life', dashPlural(crop.shelfLife, 'day') + ' after harvest') + dashFact('Best before', dfull(dashAddDays(crop.harvested, crop.shelfLife))) + dashFact('Freshness', dashFreshBadge(crop));
    const hero = (note) => '<div class="detail-hero"><img src="' + dashImg(crop.image) + '" alt="' + de(crop.name) + '"><div><h3>' + dp(crop.price) + ' / ' + de(crop.unit) + '</h3><p>' + note + '</p></div></div>';
    if (isOrgDashboard) {
        dashOpen('<p class="detail-kicker">Product listing · ' + crop.id + '</p><h2 id="detail-title">' + de(crop.name) + '</h2><p class="detail-subtitle">' + dashOrgLink(crop.organization) + '</p>' + hero(de(crop.category)) + '<dl class="detail-facts">' + dashFact('Available quantity', crop.stock + ' ' + de(crop.unit)) + dashFact('Listing status', ds(dashCropStatus(crop))) + harvest + '</dl><p class="detail-note">' + (crop.status === 'Removed' ? 'AniBayan removed this listing. Reason: ' + de(crop.removalReason || 'Contact AniBayan support for details.') : 'Buyers see the harvest date, shelf life and best-before date on this listing.') + '</p>' + (crop.status === 'Removed' ? '' : '<div class="detail-actions"><button class="control" data-toggle-listing="' + crop.id + '"' + (crop.stock === 0 ? ' disabled' : '') + '>' + (crop.status === 'Active' ? 'Unpublish listing' : 'Publish listing') + '</button><button class="control primary" data-edit-listing="' + crop.id + '">' + di('edit') + 'Edit listing</button></div>'));
        return;
    }
    const saved = dashIsSaved(crop.id);
    const buyable = dashIsBuyable(crop);
    const inCart = dashCart().find(l => l.crop === crop.id);
    const left = crop.stock - (inCart?.quantity || 0);
    const buy = !buyable ? '' : !isGuest && left <= 0 ? '<div class="qty-add"><p>Your cart has all ' + crop.stock + ' ' + de(crop.unit) + ' available.</p></div>' : isGuest ? '<div class="qty-add"><p>Sign in with a buyer account to order this harvest.</p><a class="control primary" href="login.html" data-sign-in-buyer>Sign in to order ' + di('arrow') + '</a></div>' : '<form class="qty-add" id="quantity-form" novalidate>' + dashField('quantity', 'Quantity (' + de(crop.unit) + ')', '<input type="number" required min="1" max="' + left + '" step="1" value="1" inputmode="numeric">') + '<button type="button" class="control primary" data-add-cart="' + crop.id + '" data-qty-from="field-quantity">' + di('cart') + 'Add to cart</button></form>';
    dashOpen('<p class="detail-kicker">Harvest listing</p><h2 id="detail-title">' + de(crop.name) + '</h2><p class="detail-subtitle">' + dashOrgLink(crop.organization) + ' · ' + de(dashRegion(crop.organization)) + '</p>' + hero(de(crop.category) + ' · ' + (buyable ? crop.stock + ' ' + de(crop.unit) + ' available' : 'Not available right now')) + '<dl class="detail-facts">' + harvest + dashFact('Buyer rating', dashRatingText(crop.organization)) + '</dl><p class="detail-note">The organization enters the harvest date when it lists a crop. Shelf life is its estimate for produce stored as recommended, so plan to use it before the best-before date.' + (inCart ? ' Your cart has ' + inCart.quantity + ' ' + de(crop.unit) + '.' : '') + '</p>' + buy + '<div class="detail-actions"><a class="control" href="#org=' + dashSlug(crop.organization) + '" data-profile-link>About the grower</a>' + (isGuest ? '' : '<button class="control" data-save="' + crop.id + '" aria-pressed="' + saved + '">' + di('heart') + (saved ? 'Saved' : 'Save harvest') + '</button>') + (inCart ? '<button class="control" data-go="cart">View cart ' + di('arrow') + '</button>' : '') + '</div>');
}
// Opens an organization's profile page, closing any open pop-up first.
function dashOpenOrgProfile(name) {
    if (dashDialog.open)
        dashDialog.close();
    location.hash = 'org=' + dashSlug(name);
}
// Orders still open for an account (as buyer, or its organization's), shown before an administrator suspends it.
function dashOpenOrdersFact(a) {
    const open = dashboardOrders.filter(o => !['Completed', 'Cancelled', 'Refunded'].includes(o.status) && (a.role === 'Consumer' ? o.customer === a.name : a.role === 'Representative' && o.organization === a.organization));
    if (!open.length || a.status !== 'Active')
        return '';
    const count = (statuses) => open.filter(o => statuses.includes(o.status)).length;
    const cancel = a.role === 'Consumer' ? count(['Pending']) : count(['Pending', 'Confirmed', 'Processing']);
    return dashFact('Open orders', String(open.length) + (cancel ? '<small class="fact-note">' + cancel + ' would be cancelled' + (open.some(o => ['Pending', 'Confirmed', 'Processing'].includes(o.status) && o.funds === 'Held') ? ' and refunded' : '') + '</small>' : ''));
}
function dashSuspendForm(email) {
    const account = dashAccountByEmail(email);
    if (!account)
        return;
    dashOpen('<p class="detail-kicker">Account suspension</p><h2 id="detail-title">Suspend ' + de(account.name) + '?</h2><p class="detail-subtitle">They will be signed out. The reason you enter will appear in their account status and sign-in notice.</p><form class="dash-form" id="suspend-form" data-email="' + de(email) + '" novalidate><div class="form-grid single">' + dashField('reason', 'Suspension reason' + dashRequired, '<textarea required minlength="10" maxlength="500" rows="4"></textarea>', 'Give a clear reason with at least 10 characters.', true) + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control danger">' + di('lock') + 'Suspend account</button></div></form>');
    dashFocusField('#field-reason');
}
function dashSubmitSuspend(form) {
    const reason = String(new FormData(form).get('reason') ?? '').trim();
    if (!dashShowErrors(form, reason.length >= 10 ? {} : { reason: 'Give a reason of at least 10 characters.' }))
        return;
    dashRunAccountSuspend(form.dataset.email, reason);
}
function dashRunAccountSuspend(email, reason) {
    const payload = { email };
    if (reason)
        payload.reason = reason;
    void dashDo('account.suspend', payload).then(r => {
        const account = dashAccountByEmail(email);
        if (!r || !account)
            return;
        dashAccountDetails(email);
        dashToast(account.name + (r.status === 'Suspended' ? ' is suspended and signed out of AniBayan.' + (r.cancelled ? ' ' + dashPlural(r.cancelled, 'open order') + ' cancelled.' : '') : ' is reactivated.'));
    });
}
function dashAccountDetails(email) {
    const a = dashAccountByEmail(email);
    if (!a)
        return;
    const self = a.email === dashMeEmail;
    const org = a.organization ? dashboardOrganizations.find(o => o.name === a.organization) : undefined;
    const toggle = !self && a.role !== 'Administrator' && (a.status === 'Active' || a.status === 'Suspended') ? (a.status === 'Suspended' ? '<button class="control primary" data-suspend="' + de(email) + '">' + di('check') + 'Reactivate account</button>' : '<button class="control danger" data-suspend="' + de(email) + '">' + di('lock') + 'Suspend account</button>') : '';
    const review = a.status === 'Pending' && org ? '<button class="control primary" data-organization="' + de(org.name) + '">Review application</button>' : '';
    dashOpen('<p class="detail-kicker">' + (a.role === 'Consumer' ? 'Buyer' : a.role) + ' account</p><h2 id="detail-title">' + de(a.name) + '</h2><p class="detail-subtitle">' + de(email) + '</p><dl class="detail-facts">' + dashFact('Role', a.role === 'Consumer' ? 'Buyer' : a.role) + dashFact('Status', ds(a.status)) + (a.suspensionReason ? dashFact('Suspension reason', de(a.suspensionReason)) : '') + (a.joined ? dashFact('Joined', dfull(a.joined)) : '') + (a.lastActive ? dashFact('Last active', dfull(a.lastActive)) : '') + (a.organization ? dashFact('Organization', de(a.organization)) : '') + (a.phone ? dashFact('Mobile number', de(a.phone)) : '') + (a.note ? dashFact('Note', de(a.note)) : '') + dashOpenOrdersFact(a) + '</dl>' + dashAccountActivity(email) + '<div class="detail-actions">' + (a.role === 'Administrator' ? '' : '<a class="control" href="#user=' + dashSlug(a.name) + '" data-profile-link>' + di('user') + 'View profile</a>') + (self ? '' : '<button class="control" data-reset-password="' + de(email) + '">' + di('key') + 'Reset password</button>') + toggle + review + '</div>');
}
// The server sets a new temporary password; it's shown once so the administrator can pass it on.
async function dashResetPassword(email) {
    const a = dashAccountByEmail(email);
    if (!a)
        return;
    const r = await dashDo('account.reset-password', { email });
    if (!r)
        return;
    dashOpen('<p class="detail-kicker">Password reset</p><h2 id="detail-title">Temporary password for ' + de(a.name) + '</h2><div class="temp-password"><code id="temp-password">' + de(String(r.password)) + '</code><button class="control small" data-copy="temp-password">Copy</button></div><div class="detail-actions"><button class="control" data-account="' + de(email) + '">Back to account</button><button class="control primary" data-close-dialog>Done</button></div>');
}
function dashReportDetails(id) {
    const r = dashboardReports.find(x => x.id === id);
    if (!r)
        return;
    const open = r.status === 'Open';
    const s = dashStanding(r.organization);
    const reporter = dashboardAccounts.find(a => a.name === r.customer);
    const effect = open ? dashNextOffence(r.organization) : r.status === 'Upheld' ? 'Counts as one of its warnings' : 'No warning';
    const uphold = s.final ? '<button class="control danger" data-terminate="' + de(r.organization) + '" data-terminate-report="' + r.id + '">' + di('lock') + 'Uphold and terminate</button>' : '<button class="control danger" data-decide="Upheld" data-report-id="' + r.id + '">' + di('flag') + 'Uphold report</button>';
    const actions = isAdminDashboard ? (open ? '<button class="control" data-decide="Dismissed" data-report-id="' + r.id + '">Dismiss report</button>' + uphold : '<button class="control" data-decide="Open" data-report-id="' + r.id + '">Reopen report</button><button class="control primary" data-close-dialog>Close</button>') : '<button class="control primary" data-close-dialog>Close</button>';
    dashOpen('<p class="detail-kicker">User report · ' + r.id + '</p><h2 id="detail-title">' + de(r.reason) + '</h2><p class="detail-subtitle">' + de(r.customer) + ' about ' + de(r.organization) + ' · ' + dfull(r.date) + '</p><blockquote class="report-quote">' + de(r.details) + '</blockquote>' + (r.decisionNote ? '<p class="detail-note">AniBayan’s explanation: ' + de(r.decisionNote) + '</p>' : '') + '<dl class="detail-facts">' + dashFact('Status', ds(r.status)) + dashFact('Related order', r.order ? dashOrderNo(r.order) : 'Not specified') + dashFact('Organization warnings', dashStandingBadge(r.organization) + ' <button class="text-button" data-organization="' + de(r.organization) + '">View</button>') + dashFact(open ? 'If upheld' : 'Effect', effect) + (reporter ? dashFact('Reporter account', ds(reporter.status)) : '') + '</dl><div class="detail-actions">' + actions + '</div>');
}
function dashReportDecisionForm(id, decision) {
    const report = dashboardReports.find(r => r.id === id);
    if (!report)
        return;
    dashOpen('<p class="detail-kicker">Dismiss report · ' + id + '</p><h2 id="detail-title">Explain why this report was dismissed</h2><p class="detail-subtitle">The person who filed it and ' + de(report.organization) + ' will be able to read this explanation in AniBayan.</p><form class="dash-form" id="report-decision-form" data-report="' + de(id) + '" data-decision="' + de(decision) + '" novalidate><div class="form-grid single">' + dashField('note', 'Decision explanation' + dashRequired, '<textarea required minlength="10" maxlength="500" rows="4"></textarea>', 'Give a clear explanation with at least 10 characters.', true) + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Keep report open</button><button type="submit" class="control">Dismiss report</button></div></form>');
    dashFocusField('#field-note');
}
function dashApplicationDetails(name) {
    const o = dashboardOrganizations.find(x => x.name === name);
    if (!o)
        return;
    const pending = o.status === 'Pending review';
    const selling = o.status === 'Active' || o.status === 'Terminated';
    const s = dashStanding(o.name);
    const rep = dashboardAccounts.find(a => a.organization === o.name);
    const requestedBarangay = pending && !dashBarangays.some(name => name.toLocaleLowerCase() === o.region.split(',')[0].trim().toLocaleLowerCase()) ? '<p class="warning-callout"><span>Barangay request: this name is not in the current list. Approving the application will add it to AniBayan’s barangay options.</span></p>' : '';
    const warnings = selling ? '<h3 class="detail-section">Warnings</h3><div class="warning-summary">' + dashStandingBadge(o.name) + dashWarningMeter(o.name) + '</div>' + (s.count ? dashWarningRows(o.name, 'feedback-list compact', !s.terminated) : '') : '';
    const actions = pending ? '<button class="control danger" data-review="Declined" data-review-name="' + de(o.name) + '">Decline</button><button class="control primary" data-review="Active" data-review-name="' + de(o.name) + '">' + di('check') + 'Approve organization</button>'
        : (o.status === 'Active' ? (s.final ? '<button class="control danger" data-terminate="' + de(o.name) + '">' + di('lock') + 'Terminate organization</button>' : '<button class="control danger" data-warn="' + de(o.name) + '">' + di('flag') + 'Give a warning</button>') : '') + '<button class="control primary" data-close-dialog>Close</button>';
    dashOpen('<p class="detail-kicker">' + (selling ? 'Organization' : 'Organization application') + '</p><h2 id="detail-title">' + de(o.name) + '</h2><p class="detail-subtitle">' + de(o.region) + ' · submitted ' + dfull(o.applied) + '</p><div class="detail-hero"><img src="' + dashImg(o.image) + '" alt="' + de(o.name) + '"><div><h3>' + de(o.crop) + '</h3><p>' + dashPlural(o.members, 'member farmer') + ' · ' + ds(dashAppStatus(o)) + '</p></div></div>' + requestedBarangay + '<dl class="detail-facts">' + dashFact('Representative', de(o.representative) + (rep ? '<small class="fact-note">' + de(rep.email) + '</small>' : '')) + dashFact('Documents', dashDocumentLinks(o.documents)) + (o.phone ? dashFact('Contact number', de(o.phone)) : '') + (o.approved ? dashFact('Approved on', dfull(o.approved)) : '') + (o.applicationDeclineReason ? dashFact('Decline reason', de(o.applicationDeclineReason)) : '') + (o.terminated ? dashFact('Terminated on', dfull(o.terminated)) : '') + (o.terminatedFor ? dashFact('Final offence', de(o.terminatedFor)) : '') + '</dl>' + warnings + '<div class="detail-actions">' + actions + '</div>');
}
function dashApplicationDeclineForm(name) {
    dashOpen('<p class="detail-kicker">Decline application</p><h2 id="detail-title">Explain the decision to ' + de(name) + '</h2><p class="detail-subtitle">The representative will see this note when they sign in and know what to correct before contacting support.</p><form class="dash-form" id="application-decline-form" data-organization-name="' + de(name) + '" novalidate><div class="form-grid single">' + dashField('reason', 'Reason for declining' + dashRequired, '<textarea required minlength="10" maxlength="500" rows="4"></textarea>', 'Give a clear reason with at least 10 characters.', true) + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Keep application pending</button><button type="submit" class="control danger">Decline application</button></div></form>');
    dashFocusField('#field-reason');
}
function dashSubmitApplicationDecline(form) {
    const name = form.dataset.organizationName || '';
    const reason = String(new FormData(form).get('reason') ?? '').trim();
    if (!dashShowErrors(form, reason.length >= 10 ? {} : { reason: 'Give a reason of at least 10 characters.' }))
        return;
    void dashDo('application.review', { name, decision: 'Declined', reason }, form).then(r => {
        if (r) {
            dashApplicationDetails(name);
            dashToast(name + ' declined. The representative can see your reason when they sign in.');
        }
    });
}
function dashConfirmReset() {
    dashOpen('<p class="detail-kicker">Data</p><h2 id="detail-title">Reset all AniBayan data?</h2><p class="detail-subtitle">Every account, listing, order, rating, report and uploaded photo in the database goes back to the starting data, for everyone. Everyone is signed out. This can’t be undone.</p><div class="detail-actions"><button class="control" data-close-dialog>Cancel</button><button class="control danger" data-confirm-reset>Reset data</button></div>');
}
// AniBayan renders the PayMongo Payment Intent flow in its own payment dialog.
function dashPaymentDialog(ids) {
    const selected = ids.map(id => dashboardOrders.find(o => o.id === id)).filter((o) => !!o && o.payment === 'Unpaid' && o.status !== 'Cancelled');
    const expanded = new Map();
    selected.forEach(order => {
        const group = order.checkout ? dashboardOrders.filter(o => o.checkout === order.checkout && o.payment === 'Unpaid' && o.status !== 'Cancelled') : [order];
        group.forEach(o => expanded.set(o.id, o));
    });
    const orders = [...expanded.values()];
    if (!orders.length)
        return;
    const total = orders.reduce((sum, o) => sum + o.total, 0);
    const method = orders[0].method || 'GCash';
    const selectedMethod = method === 'Credit or debit card' ? 'card' : 'qrph';
    const paymentNote = selectedMethod === 'card' ? 'Card details go directly to PayMongo and are not stored by AniBayan.' : 'Scan a single-use QR Ph code with GCash or a supported bank app. The limit may depend on your bank.';
    const cardFields = '<form id="payment-card-form" class="dash-form"' + (selectedMethod === 'card' ? '' : ' hidden') + ' novalidate><div class="form-grid">'
        + dashField('cardNumber', 'Card number' + dashRequired, '<input type="text" inputmode="numeric" autocomplete="cc-number" maxlength="23" placeholder="Card number" required>', 'Card details go directly to PayMongo and are not stored by AniBayan.', true)
        + dashField('cardExpiryMonth', 'Expiry month' + dashRequired, '<input type="text" inputmode="numeric" autocomplete="cc-exp-month" maxlength="2" placeholder="MM" required>')
        + dashField('cardExpiryYear', 'Expiry year' + dashRequired, '<input type="text" inputmode="numeric" autocomplete="cc-exp-year" maxlength="4" placeholder="YYYY" required>')
        + dashField('cardCvc', 'Security code' + dashRequired, '<input type="password" inputmode="numeric" autocomplete="cc-csc" maxlength="4" required>')
        + '</div></form>';
    dashOpen('<p class="detail-kicker">AniBayan secure payment</p><h2 id="payment-title" data-total="' + total + '">Pay ' + dp(total) + ' with ' + (selectedMethod === 'card' ? 'card' : 'GCash / QR Ph') + '</h2><p class="detail-subtitle">' + orders.map(o => dashOrderNo(o.id) + ' &middot; ' + de(o.organization)).join('<br>') + '</p><p class="detail-note">' + paymentNote + '</p>' + cardFields + '<div class="detail-actions"><button class="control" data-pay-later>Pay later</button><button type="button" class="control primary" data-pay="' + orders.map(o => o.id).join(',') + '">' + di('wallet') + 'Pay ' + dp(total) + '</button></div>');
    const detail = document.getElementById('detail-content');
    const progress = document.createElement('p');
    progress.id = 'payment-progress';
    progress.className = 'payment-status';
    progress.setAttribute('role', 'status');
    progress.hidden = true;
    const error = document.createElement('p');
    error.id = 'payment-error';
    error.className = 'form-error';
    error.setAttribute('role', 'alert');
    error.hidden = true;
    detail.querySelector('.detail-actions')?.before(progress, error);
}
// Creates an intent on AniBayan's server, tokenizes payment details with PayMongo's public key, then attaches it.
async function dashStartPayment(ids, button) {
    const order = dashboardOrders.find(o => o.id === ids[0]);
    const method = order?.method === 'Credit or debit card' ? 'Credit or debit card' : 'GCash or QR Ph';
    const progress = document.getElementById('payment-progress'), error = document.getElementById('payment-error');
    if (progress) {
        progress.hidden = false;
        progress.textContent = 'Preparing secure payment...';
    }
    if (error)
        error.hidden = true;
    const label = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Preparing payment...';
    let paymentAttributes = {};
    const account = dashAccount();
    const billing = { name: account.name, email: account.email, phone: order?.phone || account.phone || '' };
    if (method === 'Credit or debit card') {
        const form = document.getElementById('payment-card-form');
        if (!form) {
            button.disabled = false;
            button.innerHTML = label;
            return;
        }
        const value = (name) => String(new FormData(form).get(name) || '').trim();
        const cardNumber = value('cardNumber').replace(/\D/g, '');
        const expMonth = value('cardExpiryMonth');
        const expYear = value('cardExpiryYear');
        const cvc = value('cardCvc');
        const errors = {};
        if (!/^\d{12,19}$/.test(cardNumber))
            errors.cardNumber = 'Enter a valid card number.';
        if (!/^(0?[1-9]|1[0-2])$/.test(expMonth))
            errors.cardExpiryMonth = 'Enter a month from 1 to 12.';
        if (!/^\d{4}$/.test(expYear) || Number(expYear) < new Date().getFullYear() || Number(expYear) === new Date().getFullYear() && Number(expMonth) < new Date().getMonth() + 1)
            errors.cardExpiryYear = 'Enter a valid future expiry year.';
        if (!/^\d{3,4}$/.test(cvc))
            errors.cardCvc = 'Enter the 3 or 4 digit security code.';
        if (!dashShowErrors(form, errors)) {
            button.disabled = false;
            button.innerHTML = label;
            if (progress)
                progress.hidden = true;
            return;
        }
        paymentAttributes = { type: 'card', details: { card_number: cardNumber, exp_month: Number(expMonth), exp_year: Number(expYear), cvc }, billing };
    }
    const r = await dashApi('payments', { orders: ids, method });
    if (!r.ok || !r.data.intentId || !r.data.publicKey) {
        dashPaymentError(button, label, progress, error, dashPaymentMessage(r));
        return;
    }
    const publicKey = String(r.data.publicKey), intentId = String(r.data.intentId), intentMethod = String(r.data.method || (method === 'Credit or debit card' ? 'card' : 'qrph'));
    const isTestMode = publicKey.startsWith('pk_test_');
    if (!r.data.existing)
        ids.forEach(id => { const item = dashboardOrders.find(o => o.id === id); if (item) {
            item.method = method;
            item.checkout = intentId;
        } });
    if (isTestMode) {
        const kicker = document.querySelector('#detail-content .detail-kicker');
        if (kicker)
            kicker.textContent = 'AniBayan secure payment - test mode';
    }
    if (r.data.existing) {
        if (r.data.status === 'succeeded') {
            if (progress)
                progress.textContent = 'Payment received. Updating your order...';
            await dashRefreshPaymentStatus(false);
            return;
        }
        if (r.data.status === 'processing') {
            if (progress) {
                progress.hidden = false;
                progress.textContent = 'Payment is still processing. AniBayan will update your order when it is confirmed.';
            }
            button.disabled = false;
            button.innerHTML = label;
            dashWatchPayments();
            return;
        }
        const nextAction = r.data.nextAction;
        if (r.data.status === 'awaiting_next_action' && intentMethod === 'qrph') {
            if (isTestMode) {
                const code = nextAction?.code;
                const testUrl = code?.test_url;
                const image = code?.image_url;
                if (typeof testUrl === 'string' && typeof image === 'string' && image.startsWith('data:image/') && dashShowTestQrPh(testUrl, image, ids)) {
                    dashWatchPayments();
                    return;
                }
                dashPaymentError(button, label, progress, error, 'PayMongo did not return its test QR and simulator. Please try again.');
                return;
            }
            if (typeof nextAction?.code?.image_url === 'string' && nextAction.code.image_url.startsWith('data:image/')) {
                dashShowQrPh(nextAction.code.image_url, ids);
                dashWatchPayments();
                return;
            }
        }
        const resumeUrl = nextAction?.redirect?.url;
        if (r.data.status === 'awaiting_next_action' && intentMethod === 'card' && typeof resumeUrl === 'string')
            try {
                if (new URL(resumeUrl).protocol === 'https:') {
                    if (progress)
                        progress.textContent = 'Returning to bank verification...';
                    location.assign(resumeUrl);
                    return;
                }
            }
            catch { }
        dashPaymentError(button, label, progress, error, 'The earlier payment needs another moment to update. Check your orders shortly, then try again.');
        return;
    }
    if (!r.data.clientKey) {
        dashPaymentError(button, label, progress, error, 'AniBayan could not prepare the secure payment. Please try again.');
        return;
    }
    const clientKey = String(r.data.clientKey);
    if (method !== 'Credit or debit card')
        paymentAttributes = { type: intentMethod };
    const paymentMethod = await dashPayMongoPost(publicKey, 'payment_methods', { data: { attributes: paymentAttributes } });
    const paymentMethodId = paymentMethod.data?.data?.id;
    if (!paymentMethod.ok || !paymentMethodId) {
        dashPaymentError(button, label, progress, error, paymentMethod.message || 'PayMongo could not prepare that payment method. Check the details and try again.');
        return;
    }
    const attached = await dashPayMongoPost(publicKey, 'payment_intents/' + encodeURIComponent(intentId) + '/attach', { data: { attributes: { payment_method: paymentMethodId, client_key: clientKey, return_url: String(r.data.returnUrl) } } });
    if (!attached.ok) {
        dashPaymentError(button, label, progress, error, attached.message || 'PayMongo could not start the payment. Check the details and try again.');
        return;
    }
    const attributes = attached.data?.data?.attributes || {};
    if (attributes.status === 'succeeded') {
        if (progress)
            progress.textContent = 'Payment received. Updating your order...';
        await dashRefreshPaymentStatus(false);
        return;
    }
    if (attributes.status === 'processing') {
        if (progress) {
            progress.hidden = false;
            progress.textContent = 'PayMongo is processing your payment. AniBayan will update when it is confirmed.';
        }
        button.disabled = false;
        button.innerHTML = label;
        dashWatchPayments();
        return;
    }
    if (attributes.status === 'awaiting_next_action' && intentMethod === 'qrph') {
        if (isTestMode) {
            const code = attributes.next_action?.code;
            const testUrl = code?.test_url;
            const image = code?.image_url;
            if (typeof testUrl === 'string' && typeof image === 'string' && image.startsWith('data:image/') && dashShowTestQrPh(testUrl, image, ids)) {
                dashWatchPayments();
                return;
            }
            dashPaymentError(button, label, progress, error, 'PayMongo did not return its test QR and simulator. Please try again.');
            return;
        }
        const image = attributes.next_action?.code?.image_url;
        if (typeof image !== 'string' || !image.startsWith('data:image/')) {
            dashPaymentError(button, label, progress, error, 'PayMongo did not return a QR image. Please try again.');
            return;
        }
        dashShowQrPh(image, ids);
        dashWatchPayments();
        return;
    }
    if (attributes.status === 'awaiting_next_action' && intentMethod === 'card') {
        const redirect = attributes.next_action?.redirect?.url;
        if (typeof redirect === 'string')
            try {
                if (new URL(redirect).protocol === 'https:') {
                    if (progress)
                        progress.textContent = 'Opening your bank verification...';
                    location.assign(redirect);
                    return;
                }
            }
            catch { }
    }
    const detail = attributes.last_payment_error?.message;
    dashPaymentError(button, label, progress, error, typeof detail === 'string' && detail ? detail : 'Payment could not be completed. Check the details and try again.');
}
function dashPaymentError(button, label, progress, error, message) {
    if (progress)
        progress.hidden = true;
    button.disabled = false;
    button.innerHTML = label;
    if (error) {
        error.hidden = false;
        error.textContent = message;
    }
    else
        dashToast(message);
}
function dashPaymentMessage(r) {
    const message = typeof r.data.message === 'string' ? r.data.message : '';
    if ((r.status === 502 || r.status === 503) && /^(PayMongo|Online payment)/.test(message))
        return message;
    return dashMessage(r, 'Online payment isn’t available right now. Try again in a moment.');
}
async function dashPayMongoPost(publicKey, path, body) {
    try {
        const response = await fetch('https://api.paymongo.com/v1/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: 'Basic ' + btoa(publicKey + ':') }, body: JSON.stringify(body) });
        const data = await response.json().catch(() => ({}));
        const code = String(data?.errors?.[0]?.code || '').toLowerCase();
        const message = {
            parameter_below_minimum: 'The minimum online payment is ₱1.00.',
            parameter_above_maximum: 'PayMongo accepts up to ₱9,999,999.99 per transaction. This total needs to be split into smaller orders before payment.',
            amount_exceed_limit: 'This amount is over the limit set by your QR Ph bank or wallet. Contact them or choose card payment.',
            payment_method_not_allowed: 'The selected payment method is not enabled for the PayMongo account. Enable it in PayMongo or choose another method.',
            account_not_activated: 'The PayMongo account is not activated for the selected payment method.',
            card_declined: 'Your card was declined. Check the details or try another card.',
        }[code] || (!response.ok ? 'PayMongo could not start this payment. Please try again.' : '');
        return { ok: response.ok, data, message };
    }
    catch {
        return { ok: false, data: {}, message: 'PayMongo could not be reached. Check your connection and try again.' };
    }
}
function dashShowQrPh(image, ids) {
    dashOpen('<p class="detail-kicker">AniBayan · GCash / QR Ph</p><h2 id="detail-title">Scan to pay</h2><p class="detail-subtitle">' + ids.map(dashOrderNo).join(', ') + ' · this single-use code expires in about 30 minutes.</p><div class="qrph-payment"><div id="qrph-image-slot" class="qrph-image-slot"></div><p>Open GCash, your bank, or another QR Ph-enabled wallet, scan this code, and approve the amount shown.</p></div><p id="qrph-status" class="payment-status" role="status">Waiting for payment confirmation…</p><div class="detail-actions"><button class="control" data-close-dialog>Close</button><button class="control primary" data-payment-check>Check payment status</button></div>');
    const img = document.createElement('img');
    img.src = image;
    img.alt = 'Single-use QR Ph payment code';
    img.width = 250;
    img.height = 250;
    document.getElementById('qrph-image-slot')?.append(img);
}
function dashShowTestQrPh(testUrl, image, ids) {
    let simulatorUrl = '';
    try {
        const parsed = new URL(testUrl);
        if (parsed.protocol === 'https:')
            simulatorUrl = parsed.href;
    }
    catch { }
    if (!simulatorUrl)
        return false;
    const total = Number(document.getElementById('payment-title')?.getAttribute('data-total') || 0);
    dashOpen('<p class="detail-kicker">AniBayan &middot; PayMongo test mode</p><h2 id="detail-title">QR Ph test payment</h2><p class="detail-subtitle">' + ids.map(dashOrderNo).join(', ') + ' &middot; test amount ' + dp(total) + '</p><div class="qrph-payment"><div id="qrph-image-slot" class="qrph-image-slot"></div><p>This QR is shown for testing. Do not scan it with a wallet; use the PayMongo simulator to complete the test.</p></div><p id="qrph-status" class="payment-status" role="status">Waiting for test payment confirmation&hellip;</p><div class="detail-actions"><a class="control primary" href="' + de(simulatorUrl) + '" target="_blank" rel="noopener noreferrer">Open PayMongo test simulator</a><button class="control" data-close-dialog>Close</button><button class="control" data-payment-check>Check payment status</button></div>');
    const img = document.createElement('img');
    img.src = image;
    img.alt = 'QR Ph test payment preview';
    img.width = 250;
    img.height = 250;
    document.getElementById('qrph-image-slot')?.append(img);
    return true;
}
let dashPaymentPoll = 0;
let dashPaymentChecking = false;
function dashWatchPayments() {
    if (dashPaymentPoll)
        window.clearInterval(dashPaymentPoll);
    dashPaymentPoll = window.setInterval(() => { void dashRefreshPaymentStatus(false); }, 5000);
}
async function dashRefreshPaymentStatus(manual, button) {
    if (dashPaymentChecking) {
        if (manual) {
            const status = document.getElementById('qrph-status');
            if (status)
                status.textContent = 'Payment status is already being checked. Please wait.';
        }
        return;
    }
    dashPaymentChecking = true;
    const oldLabel = button?.textContent || '';
    if (button) {
        button.disabled = true;
        button.textContent = 'Checking…';
    }
    const initialStatus = document.getElementById('qrph-status');
    if (manual && initialStatus)
        initialStatus.textContent = 'Checking with PayMongo…';
    try {
        const r = await dashApi('payments/check', {});
        if (r.data.state) {
            dashApplyState(r.data.state);
            dashRender();
        }
        if (!r.ok) {
            if (manual) {
                const message = typeof r.data.message === 'string' ? r.data.message : 'AniBayan could not verify this payment right now. Please try again.';
                const status = document.getElementById('qrph-status');
                if (status)
                    status.textContent = message;
                else
                    dashToast(message);
            }
            return;
        }
        const result = r.data.result || {};
        const paid = (result.paid || []);
        if (paid.length) {
            if (dashPaymentPoll)
                window.clearInterval(dashPaymentPoll);
            dashPaymentPoll = 0;
            dashDialog.close();
            dashReceiptDialog(paid.map(n => 'AB-2026-' + n.replace('#', '')), 'Payment received');
            dashToast('Payment received for ' + paid.join(', ') + '.');
            return;
        }
        const stillOpen = dashRoleOrders().some(o => o.checkout && o.payment === 'Unpaid');
        if (result.unverified) {
            if (manual) {
                const message = 'AniBayan could not reach PayMongo to verify this payment. Please try again in a moment.';
                const status = document.getElementById('qrph-status');
                if (status)
                    status.textContent = message;
                else
                    dashToast(message);
            }
            return;
        }
        if (!stillOpen) {
            if (dashPaymentPoll) {
                window.clearInterval(dashPaymentPoll);
                dashPaymentPoll = 0;
            }
            const status = document.getElementById('qrph-status');
            if (status)
                status.textContent = 'This payment attempt is no longer open. You can try again from My orders.';
            return;
        }
        if (manual) {
            const message = (result.pending || []).length ? 'PayMongo has not confirmed this payment yet. Complete the payment in the simulator or wallet, then check again.' : 'Payment is still processing or has not been confirmed yet.';
            const status = document.getElementById('qrph-status');
            if (status)
                status.textContent = message;
            else
                dashToast(message);
        }
    }
    finally {
        dashPaymentChecking = false;
        if (button) {
            button.disabled = false;
            button.textContent = oldLabel;
        }
    }
}
// Reconciles in-app Payment Intents after a provider return and whenever the buyer reopens the orders page.
async function dashCheckPayments() {
    const params = new URLSearchParams(location.search);
    const outcome = params.get('payment');
    const returnedIntent = params.get('payment_intent_id');
    if (outcome || returnedIntent) {
        params.delete('payment');
        params.delete('payment_intent_id');
        history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash);
    }
    if (!dashRoleOrders().some(o => o.checkout && o.payment === 'Unpaid')) {
        if (outcome === 'cancelled')
            dashToast('Payment cancelled.');
        return;
    }
    await dashRefreshPaymentStatus(false);
    if (dashRoleOrders().some(o => o.checkout && o.payment === 'Unpaid'))
        dashWatchPayments();
}
/* ---------- Dialog forms ---------- */
const dashSelected = (value, current) => value === current ? ' selected' : '';
const dashStockPhotos = [['vegetable-cutout.png', 'Vegetable basket'], ['carrot.jpg', 'Carrots'], ['tomatoes.jpg', 'Tomatoes'], ['onion.jpg', 'Onions'], ['eggplant.jpg', 'Eggplants'], ['sweet-potatoes.jpg', 'Sweet potatoes'], ['mango.jpg', 'Mangoes'], ['bananas.jpg', 'Bananas'], ['rice.jpg', 'Rice']];
function dashListingForm(editId = '') {
    const crop = editId ? dashboardCrops.find(c => c.id === editId) : undefined;
    if (editId && !crop)
        return;
    const value = (v) => v === undefined ? '' : ' value="' + de(v) + '"';
    const image = crop ? crop.image : 'vegetable-cutout.png';
    const uploaded = /^uploads\//.test(image);
    const photo = '<div class="form-field wide"><span class="form-label" id="photo-label">Photo</span><div class="photo-field"><img class="photo-preview" id="photo-preview" src="' + dashImg(image) + '" alt="Listing photo"><div class="photo-inputs"><label class="control small file-button">' + di('plus') + 'Upload a photo<input type="file" name="photo" id="field-photo" accept="image/jpeg,image/png,image/webp" aria-describedby="hint-photo error-photo"></label><select name="image" id="field-image" aria-label="Or choose a stock photo">' + (uploaded ? '<option value="">Keep the uploaded photo</option>' : '') + dashStockPhotos.map(p => '<option value="' + p[0] + '"' + dashSelected(p[0], image) + '>Stock photo: ' + p[1] + '</option>').join('') + '</select><small class="form-hint" id="hint-photo">Upload a JPG, PNG or WebP photo, or choose a stock photo.</small><small class="field-error" id="error-photo" data-error-for="photo"></small></div></div></div>';
    dashOpen('<p class="detail-kicker">' + (crop ? 'Edit listing · ' + crop.id : 'New listing · ' + de(dashOrgName)) + '</p><h2 id="detail-title">' + (crop ? de(crop.name) : 'Add a crop listing') + '</h2><p class="detail-subtitle">Buyers see the harvest date and shelf life on every listing.</p><form class="dash-form" id="listing-form"' + (crop ? ' data-edit="' + crop.id + '"' : '') + ' novalidate><div class="form-grid">'
        + dashField('name', 'Crop name' + dashRequired, '<input required maxlength="80" autocomplete="off" placeholder="e.g. Calamansi"' + value(crop?.name) + '>', '', true)
        + dashField('category', 'Crop type' + dashRequired, '<select required><option value="">Choose a type…</option>' + Object.keys(dashShelfDefaults).map(c => '<option' + dashSelected(c, crop ? crop.category : '') + '>' + de(c) + '</option>').join('') + '</select>')
        + dashField('unit', 'Unit' + dashRequired, '<select required>' + ['kg', 'piece', 'bundle', 'sack'].map(u => '<option value="' + u + '"' + dashSelected(u, crop ? crop.unit : 'kg') + '>' + u + '</option>').join('') + '</select>')
        + dashField('price', 'Price per unit (₱)' + dashRequired, '<input type="number" required min="1" step="1" inputmode="numeric"' + value(crop?.price) + '>')
        + dashField('stock', 'Available quantity' + dashRequired, '<input type="number" required min="' + (crop ? 0 : 1) + '" step="1" inputmode="numeric"' + value(crop?.stock) + '>')
        + dashField('harvested', 'Harvest date' + dashRequired, '<input type="date" required max="' + dashToday + '"' + value(crop?.harvested) + '>', 'When this batch was harvested. Shown to buyers.')
        + dashField('shelfLife', 'Shelf life (days)' + dashRequired, '<input type="number" required min="1" max="365" step="1" inputmode="numeric"' + value(crop?.shelfLife) + (crop ? ' data-edited="true"' : '') + '>', 'How long the produce keeps after harvest. Filled in from the crop type.')
        + photo
        + '</div><p class="form-error" id="listing-error" role="alert" hidden></p><div class="detail-actions">' + (crop ? '<button type="button" class="control danger push-left" data-remove-listing="' + crop.id + '">Remove listing</button>' : '') + '<button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">' + (crop ? di('check') + 'Save changes' : di('plus') + 'Publish listing') + '</button></div></form>');
    dashFocusField('#field-name');
}
// Shrinks an uploaded photo to at most max px (listings 640, banners 1600) before it is sent to the server.
// square: crops the middle square first (profile pictures). Transparent parts become white.
async function dashReadPhoto(file, max = 640, square = false) {
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const w = image.naturalWidth, h = image.naturalHeight, side = Math.min(w, h);
        const [sx, sy, sw, sh] = square ? [(w - side) / 2, (h - side) / 2, side, side] : [0, 0, w, h];
        const scale = Math.min(1, max / Math.max(sw, sh));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(sw * scale));
        canvas.height = Math.max(1, Math.round(sh * scale));
        const context = canvas.getContext('2d');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.82);
    }
    finally {
        URL.revokeObjectURL(url);
    }
}
async function dashSubmitListing(form) {
    const data = new FormData(form);
    const value = (name) => String(data.get(name) ?? '').trim();
    const editing = form.dataset.edit ? dashboardCrops.find(c => c.id === form.dataset.edit) : undefined;
    const name = value('name'), category = value('category'), harvested = value('harvested');
    const price = Number(value('price')), stock = Number(value('stock')), shelfLife = Number(value('shelfLife'));
    const minimumStock = editing ? 0 : 1;
    const file = form.elements.namedItem('photo').files?.[0];
    const errors = {};
    if (name.length < 2)
        errors.name = 'Enter the crop name.';
    if (!category)
        errors.category = 'Choose a crop type.';
    if (!value('price') || !Number.isInteger(price) || price < 1)
        errors.price = 'Enter a whole peso amount of at least ₱1.';
    if (!value('stock') || !Number.isInteger(stock) || stock < minimumStock)
        errors.stock = 'Enter a whole number of at least ' + minimumStock + '.';
    if (!value('shelfLife') || !Number.isInteger(shelfLife) || shelfLife < 1 || shelfLife > 365)
        errors.shelfLife = 'Enter a shelf life between 1 and 365 days.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(harvested))
        errors.harvested = 'Enter the harvest date. Buyers use it to judge freshness.';
    else if (harvested > dashToday)
        errors.harvested = 'The harvest date can’t be in the future.';
    else if (!errors.shelfLife && dashAge(harvested) > shelfLife)
        errors.harvested = 'This harvest is already past its ' + shelfLife + '-day shelf life, so it can’t be listed.';
    if (file && !/^image\/(jpeg|png|webp)$/.test(file.type))
        errors.photo = 'Choose a JPG, PNG or WebP photo.';
    else if (file && file.size > 10 * 1024 * 1024)
        errors.photo = 'Choose a photo smaller than 10 MB.';
    if (!dashShowErrors(form, errors))
        return;
    // An uploaded photo is shrunk here and saved by the server; otherwise the chosen stock photo, or the current one.
    let photo = '';
    if (file) {
        try {
            photo = await dashReadPhoto(file);
        }
        catch {
            dashShowErrors(form, { photo: 'This photo couldn’t be read. Try another JPG or PNG.' });
            return;
        }
    }
    const r = await dashDo('listing.save', { id: editing?.id || '', name, category, unit: value('unit') || 'kg', price, stock, harvested, shelfLife, image: value('image'), photo }, form);
    if (!r)
        return;
    dashDialog.close();
    if (editing) {
        dashToast('Changes to ' + name + ' saved.');
        return;
    }
    dashNavigate('listings');
    dashToast(name + ' is listed. Buyers see it was harvested ' + dd(harvested) + '.');
}
function dashConfirmRemoveListing(id) {
    const crop = dashboardCrops.find(c => c.id === id);
    if (!crop)
        return;
    dashOpen('<p class="detail-kicker">Remove listing · ' + crop.id + '</p><h2 id="detail-title">Remove ' + de(crop.name) + '?</h2><p class="detail-subtitle">Buyers will no longer see this listing and it is taken out of their carts. Orders already placed aren’t affected.</p><div class="detail-actions"><button class="control" data-edit-listing="' + crop.id + '">Keep listing</button><button class="control danger" data-confirm-remove="' + crop.id + '">Remove listing</button></div>');
}
function dashAdminListingRemoveForm(id) {
    const crop = dashboardCrops.find(c => c.id === id);
    if (!crop || crop.status === 'Removed')
        return;
    dashOpen('<p class="detail-kicker">Admin listing review · ' + crop.id + '</p><h2 id="detail-title">Remove ' + de(crop.name) + '?</h2><p class="detail-subtitle">The listing will leave the shop. Existing orders remain active, and the seller will see the reason you provide.</p><form class="dash-form" id="admin-listing-remove-form" data-crop="' + crop.id + '" novalidate><div class="form-grid single">' + dashField('reason', 'Reason for removal' + dashRequired, '<textarea rows="4" required minlength="10" maxlength="500"></textarea>', 'This message will appear in the seller’s listing details.', true) + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control danger">Remove listing</button></div></form>');
    dashFocusField('#field-reason');
}
function dashSubmitAdminListingRemove(form) {
    const reason = String(new FormData(form).get('reason') ?? '').trim();
    if (!dashShowErrors(form, reason.length >= 10 ? {} : { reason: 'Give a reason of at least 10 characters.' }))
        return;
    const crop = dashboardCrops.find(c => c.id === form.dataset.crop);
    void dashDo('admin.listing.remove', { id: form.dataset.crop, reason }, form).then(r => {
        if (r) {
            dashDialog.close();
            dashToast((crop?.name || 'Listing') + ' was removed. The seller can see your reason.');
        }
    });
}
function dashBarangayForm() {
    dashOpen('<p class="detail-kicker">Location settings</p><h2 id="detail-title">Add a barangay</h2><p class="detail-subtitle">The new name will appear in organization and delivery address selectors.</p><form class="dash-form" id="barangay-form" novalidate><div class="form-grid single">' + dashField('municipality', 'Municipality' + dashRequired, '<select required><option>' + de(dashCityName) + '</option></select>') + dashField('name', 'Barangay name' + dashRequired, '<input required minlength="2" maxlength="80" autocomplete="off">', 'Duplicates are checked without regard to capitalization.') + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">Add barangay</button></div></form>');
    dashFocusField('#field-name');
}
function dashSubmitBarangay(form) {
    const data = new FormData(form), name = String(data.get('name') ?? '').trim().replace(/\s+/g, ' '), municipality = String(data.get('municipality') ?? '');
    const errors = {};
    if (name.length < 2)
        errors.name = 'Enter the barangay name.';
    if (!dashShowErrors(form, errors))
        return;
    void dashDo('barangay.add', { municipality, name }, form).then(r => {
        if (r) {
            dashDialog.close();
            dashToast(name + ' was added under ' + municipality + '.');
        }
    });
}
function dashBarangayEditForm(current) {
    dashOpen('<p class="detail-kicker">Location settings · ' + de(dashCityName) + '</p><h2 id="detail-title">Rename ' + de(current) + '</h2><p class="detail-subtitle">Organizations, member records and saved addresses will follow the new name.</p><form class="dash-form" id="barangay-edit-form" data-current="' + de(current) + '" novalidate><div class="form-grid single">' + dashField('name', 'Barangay name' + dashRequired, '<input required minlength="2" maxlength="80" value="' + de(current) + '" autocomplete="off">') + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">Save name</button></div></form>');
    dashFocusField('#field-name');
}
function dashSubmitBarangayEdit(form) {
    const current = form.dataset.current || '', name = String(new FormData(form).get('name') ?? '').trim().replace(/\s+/g, ' ');
    if (!dashShowErrors(form, name.length >= 2 ? {} : { name: 'Enter a barangay name.' }))
        return;
    void dashDo('barangay.update', { municipality: dashCityName, current, name }, form).then(r => {
        if (r) {
            dashDialog.close();
            dashToast(current === name ? name + ' is unchanged.' : current + ' was renamed to ' + name + '. Existing records were updated.');
        }
    });
}
function dashBarangayRemoveForm(name) {
    const replacements = dashBarangays.filter(item => item !== name).map(item => '<option value="' + de(item) + '">' + de(item) + '</option>').join('');
    dashOpen('<p class="detail-kicker">Location settings · ' + de(dashCityName) + '</p><h2 id="detail-title">Remove ' + de(name) + '?</h2><p class="detail-subtitle">If organizations, member records or saved addresses still use it, choose a barangay to move them to. Leave this blank only when it is unused.</p><form class="dash-form" id="barangay-remove-form" data-name="' + de(name) + '" novalidate><div class="form-grid single">' + dashField('replacement', 'Move existing records to', '<select><option value="">Remove only if unused</option>' + replacements + '</select>') + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control danger">Remove barangay</button></div></form>');
}
function dashSubmitBarangayRemove(form) {
    const name = form.dataset.name || '', replacement = String(new FormData(form).get('replacement') ?? '');
    void dashDo('barangay.remove', { municipality: dashCityName, name, replacement }, form).then(r => {
        if (r) {
            dashDialog.close();
            const moved = Number(r.organizations || 0) + Number(r.members || 0) + Number(r.addresses || 0);
            dashToast(name + ' was removed.' + (moved ? ' ' + moved + ' existing records moved to ' + replacement + '.' : ''));
        }
    });
}
function dashMemberForm() {
    dashOpen('<p class="detail-kicker">Member farmers · ' + de(dashOrgName) + '</p><h2 id="detail-title">Add a member farmer</h2><p class="detail-subtitle">Members are the growers who supply your organization’s listings.</p><form class="dash-form" id="member-form" novalidate><div class="form-grid">'
        + dashField('name', 'Full name' + dashRequired, '<input required maxlength="80" autocomplete="off">', '', true)
        + dashField('place', 'Barangay', '<input readonly value="' + de(dashMyOrg()?.region || '') + '">')
        + dashField('area', 'Farm area (hectares)' + dashRequired, '<input type="number" required min="0.1" max="500" step="0.1" inputmode="decimal">')
        + dashField('crops', 'Crops grown' + dashRequired, '<input required maxlength="80" placeholder="e.g. Rice, calamansi">', '', true)
        + dashField('applicationMessage', 'Application message' + dashRequired, '<textarea rows="3" required minlength="10" maxlength="500" placeholder="Why would this farmer like to join your organization?"></textarea>', 'Shown while you review this membership application.', true)
        + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">' + di('plus') + 'Add member</button></div></form>');
    dashFocusField('#field-name');
}
function dashSubmitMember(form) {
    const data = new FormData(form);
    const value = (name) => String(data.get(name) ?? '').trim();
    const area = Number(value('area'));
    const errors = {};
    if (value('name').length < 3)
        errors.name = 'Enter the farmer’s full name.';
    if (!value('area') || !(area >= 0.1 && area <= 500))
        errors.area = 'Enter the farm area in hectares, from 0.1 to 500.';
    if (value('crops').length < 3)
        errors.crops = 'Enter the crops they grow.';
    if (value('applicationMessage').length < 10)
        errors.applicationMessage = 'Enter a message of at least 10 characters.';
    if (!dashShowErrors(form, errors))
        return;
    void dashDo('member.add', { name: value('name'), crops: value('crops'), area, applicationMessage: value('applicationMessage') }, form).then(r => {
        if (!r)
            return;
        dashDialog.close();
        dashToast(value('name') + ' membership application is waiting for your confirmation.');
    });
}
function dashSubmitMemberRemove(form) {
    const member = dashboardMembers.find(m => m.id === form.dataset.member);
    if (!member) {
        dashDialog.close();
        dashToast('That member could not be found.');
        return;
    }
    const note = String(new FormData(form).get('note') ?? '').trim();
    if (!dashShowErrors(form, note.length >= 5 ? {} : { note: 'Write at least 5 characters in the removal note.' }))
        return;
    void dashDo('member.remove', { id: member.id, note }, form).then(r => {
        if (r) {
            dashDialog.close();
            dashToast(member.name + ' was removed from your members.');
        }
    });
}
function dashOrgProfileForm() {
    const org = dashMyOrg();
    if (!org)
        return;
    const barangay = org.region.split(', ')[0];
    dashOpen('<p class="detail-kicker">Organization profile</p><h2 id="detail-title">' + de(org.name) + '</h2><p class="detail-subtitle">Buyers see this on your storefront and listings.</p><form class="dash-form" id="org-profile-form" novalidate><div class="form-grid">'
        + dashField('crop', 'Main crops' + dashRequired, '<input required maxlength="80" value="' + de(org.crop) + '">', '', true)
        + dashField('barangay', 'Barangay, ' + dashCityName + dashRequired, '<select required>' + dashBarangayOptions(dashBarangays.includes(barangay) ? barangay : '') + '</select>')
        + dashField('phone', 'Contact number' + dashRequired, '<input ' + dashPhoneInput + ' value="' + de(org.phone || '') + '">')
        + dashField('description', 'About your organization', '<textarea rows="3" maxlength="240">' + de(org.description || '') + '</textarea>', '', true)
        + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">' + di('check') + 'Save profile</button></div></form>');
    dashFocusField('#field-crop');
}
function dashSubmitOrgProfile(form) {
    const data = new FormData(form);
    const value = (name) => String(data.get(name) ?? '').trim();
    const errors = {};
    if (value('crop').length < 3)
        errors.crop = 'Enter your main crops.';
    if (!dashBarangays.includes(value('barangay')))
        errors.barangay = 'Choose your barangay.';
    if (!dashPhonePattern.test(value('phone')))
        errors.phone = 'Enter a mobile number like 0917 555 0148.';
    if (!dashShowErrors(form, errors))
        return;
    void dashDo('org.profile', { crop: value('crop'), barangay: value('barangay'), phone: value('phone'), description: value('description') }, form).then(r => {
        if (r) {
            dashDialog.close();
            dashToast('Organization profile saved.');
        }
    });
}
function dashProfileForm() {
    const me = dashAccount();
    dashOpen('<p class="detail-kicker">Your account</p><h2 id="detail-title">Mobile number</h2><form class="dash-form" id="profile-form" novalidate><div class="form-grid single">'
        + dashField('phone', 'Mobile number' + dashRequired, '<input ' + dashPhoneInput + ' value="' + de(me.phone || '') + '">')
        + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">' + di('check') + 'Save</button></div></form>');
    dashFocusField('#field-phone');
}
function dashSubmitProfile(form) {
    const phone = String(new FormData(form).get('phone') ?? '').trim();
    if (!dashShowErrors(form, dashPhonePattern.test(phone) ? {} : { phone: 'Enter a mobile number like 0917 555 0148.' }))
        return;
    void dashDo('profile.contact', { phone }, form).then(r => {
        if (r) {
            dashDialog.close();
            dashToast('Mobile number saved.');
        }
    });
}
function dashPasswordForm() {
    dashOpen('<p class="detail-kicker">Security</p><h2 id="detail-title">Change your password</h2><p class="detail-subtitle">You’ll use the new password the next time you sign in.</p><form class="dash-form" id="password-form" novalidate><div class="form-grid single">'
        + dashField('current', 'Current password' + dashRequired, '<input type="password" data-password-toggle-input required autocomplete="current-password">')
        + dashField('password', 'New password' + dashRequired, '<input type="password" data-password-toggle-input required minlength="8" autocomplete="new-password">', 'At least 8 characters.')
        + dashField('confirm', 'Confirm new password' + dashRequired, '<input type="password" data-password-toggle-input required autocomplete="new-password">')
        + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">' + di('key') + 'Change password</button></div></form>');
    dashFocusField('#field-current');
}
function dashSubmitPassword(form) {
    const data = new FormData(form);
    const current = String(data.get('current') ?? ''), password = String(data.get('password') ?? ''), confirm = String(data.get('confirm') ?? '');
    const errors = {};
    if (!current)
        errors.current = 'Enter your current password.';
    if (password.length < 8)
        errors.password = 'Use at least 8 characters.';
    else if (password === current)
        errors.password = 'Choose a password different from the current one.';
    if (confirm !== password)
        errors.confirm = 'The two new passwords don’t match.';
    if (!dashShowErrors(form, errors))
        return;
    // The server checks the current password; passwords are stored there only as hashes.
    void dashDo('password.change', { current, password, confirm }, form).then(r => {
        if (r) {
            dashDialog.close();
            dashToast('Password changed.');
        }
    });
}
const dashPaymentMethods = [['Cash on delivery', 'Pay the organization when your order arrives.'], ['GCash or QR Ph', 'Scan a single-use QR Ph code in AniBayan with GCash or another supported wallet.'], ['Credit or debit card', 'Enter card details securely in AniBayan; bank verification may be needed.']];
const dashTermsVersion = '2026-11-27';
function dashCheckoutForm() {
    const entries = dashCartEntries().filter(e => dashCartSelection.has(e.crop.id));
    if (!entries.length || entries.some(e => dashCartProblem(e)))
        return;
    const me = dashAccount();
    const saved = me.addresses || [];
    const total = entries.reduce((sum, e) => sum + e.line.quantity * e.crop.price, 0);
    const orgs = [...new Set(entries.map(e => e.crop.organization))];
    const choices = saved.length ? '<div class="form-field"><span class="form-label" id="address-label">Deliver to' + dashRequired + '</span><div class="choice-list" role="radiogroup" aria-labelledby="address-label">' + saved.map((a, i) => '<label class="choice"><input type="radio" name="address" value="' + a.id + '"' + (i === 0 ? ' checked' : '') + '><span><strong>' + de(a.label) + (a.lat !== undefined ? ' ' + ds('Pinned') : '') + '</strong><small>' + de(a.text) + '</small></span></label>').join('') + '<label class="choice"><input type="radio" name="address" value="new"><span><strong>New address</strong></span></label></div></div>' : '';
    const fresh = '<div class="new-address form-grid single"' + (saved.length ? ' hidden' : '') + '>' + (saved.length ? '' : '<span class="form-label">Deliver to' + dashRequired + '</span>') + dashAddressBlock() + dashField('label', 'Label', '<input maxlength="40" placeholder="Home, Work…">') + '<label class="check-row"><input type="checkbox" name="save" checked> Save to my addresses</label></div>';
    dashOpen('<p class="detail-kicker">Checkout</p><h2 id="detail-title">Place your order' + (orgs.length > 1 ? 's' : '') + '</h2><p class="detail-subtitle">' + dashPlural(entries.length, 'harvest') + ' · ' + dp(total) + (orgs.length > 1 ? ' · ' + orgs.length + ' orders, one per organization' : '') + '</p><form class="dash-form" id="checkout-form" novalidate><div class="form-grid single">'
        + choices + fresh
        + dashField('phone', 'Mobile number' + dashRequired, '<input ' + dashPhoneInput + ' value="' + de(me.phone || '') + '">', 'The organization calls this number to arrange delivery.')
        + '<div class="form-field"><span class="form-label" id="method-label">Payment method' + dashRequired + '</span><div class="choice-list" role="radiogroup" aria-labelledby="method-label">' + dashPaymentMethods.map((m, i) => '<label class="choice"><input type="radio" name="method" value="' + m[0] + '"' + (i === 0 ? ' checked' : '') + '><span><strong>' + m[0] + '</strong><small>' + m[1] + '</small></span></label>').join('') + '</div></div>'
        + '</div><label class="policy-accept checkout-policy"><input type="checkbox" name="accept_terms" value="' + dashTermsVersion + '" required><span>I agree to the <a href="terms.html" target="_blank" rel="noopener">Terms &amp; Conditions</a> for this order and have read the <a href="privacy.html" target="_blank" rel="noopener">Privacy Notice</a>.</span></label><small class="field-error policy-error" data-error-for="accept_terms"></small><p class="form-error" id="checkout-error" role="alert" hidden></p><div class="detail-actions"><button type="button" class="control" data-close-dialog>Back to cart</button><button type="submit" class="control primary">Place order' + (orgs.length > 1 ? 's' : '') + ' · ' + dp(total) + '</button></div></form>');
    if (!saved.length)
        void dashMountMap();
    dashFocusField(saved.length ? '[type=submit]' : '#field-barangay');
}
function dashSubmitCheckout(form) {
    const entries = dashCartEntries().filter(e => dashCartSelection.has(e.crop.id));
    if (!entries.length) {
        dashDialog.close();
        dashToast('Select at least one harvest in your cart before checking out.');
        return;
    }
    const data = new FormData(form);
    const phone = String(data.get('phone') ?? '').trim();
    const method = String(data.get('method') || 'Cash on delivery');
    const acceptedTerms = String(data.get('accept_terms') || '');
    const choice = String(data.get('address') || 'new');
    const errors = {};
    const place = choice !== 'new' ? { address: Number(choice) } : { ...dashReadAddressBlock(data, errors), label: String(data.get('label') ?? '').trim(), save: !!data.get('save') };
    if (!dashPhonePattern.test(phone))
        errors.phone = 'Enter a mobile number like 0917 555 0148.';
    if (acceptedTerms !== dashTermsVersion)
        errors.accept_terms = 'Agree to the order terms before placing your order.';
    if (!dashShowErrors(form, errors))
        return;
    const error = document.getElementById('checkout-error');
    // The server checks stock again, places one order per organization and empties the cart.
    void dashApi('actions/checkout', { ...place, phone, method, crops: entries.map(e => e.crop.id), terms_version: acceptedTerms }).then(r => {
        if (r.data.state)
            dashApplyState(r.data.state);
        dashRender();
        if (!r.ok) {
            const fields = dashFieldErrors(r.data.errors);
            if (Object.keys(fields).length && Object.keys(fields).some(key => form.querySelector('[data-error-for="' + key + '"]')))
                dashShowErrors(form, fields);
            else {
                error.hidden = false;
                error.textContent = dashMessage(r, 'Your order couldn’t be placed. Try again.');
            }
            return;
        }
        const placed = (r.data.result.orders || []);
        const numbers = placed.map(o => dashOrderNo(o.id)).join(', ');
        if (method !== 'Cash on delivery') {
            dashPaymentDialog(placed.map(o => o.id));
            return;
        }
        dashNavigate('orders');
        dashReceiptDialog(placed.map(o => o.id), 'Order placed');
        dashToast(placed.length === 1 ? 'Order ' + numbers + ' placed with ' + placed[0].organization + '.' : placed.length + ' orders placed: ' + numbers + '.');
    });
}
/* ---------- Electronic receipts ---------- */
// The receipt page is made by the server (ReceiptController) and shown here in a frame; it has its own print button.
function dashReceiptDialog(ids, kicker = 'Electronic receipt') {
    const url = '../receipt?orders=' + ids.map(encodeURIComponent).join(',');
    dashOpen('<p class="detail-kicker">' + de(kicker) + '</p><h2 id="detail-title">Receipt ' + ids.map(dashOrderNo).join(', ') + '</h2><iframe class="receipt-frame" src="' + url + '" title="Receipt for order ' + ids.map(dashOrderNo).join(', ') + '"></iframe><div class="detail-actions"><a class="control" href="' + url + '" target="_blank" rel="noopener">' + di('up') + 'Open in a new tab</a><button class="control primary" data-close-dialog>Done</button></div>');
    const frame = document.querySelector('#detail-content .receipt-frame');
    frame?.addEventListener('load', () => { const height = frame.contentDocument?.documentElement.scrollHeight; if (height)
        frame.style.height = height + 'px'; });
}
/* ---------- Order received, refunds and disputes ---------- */
function dashConfirmReceived(id) {
    const o = dashRoleOrders().find(x => x.id === id);
    if (!o || o.status !== 'Delivered')
        return;
    dashOpen('<p class="detail-kicker">Order ' + dashOrderNo(o.id) + '</p><h2 id="detail-title">Did your order arrive?</h2><p class="detail-subtitle">' + de(o.crop) + ' · ' + de(o.quantity) + ' from ' + de(o.organization) + (o.funds === 'Held' ? '<br>' + dp(o.total) + ' goes to ' + de(o.organization) + ' now.' : '') + '</p><div class="detail-actions"><button class="control" data-order="' + o.id + '">Not yet</button><button class="control primary" data-confirm-received="' + o.id + '">' + di('check') + 'Order received</button></div>');
}
const dashRefundReasons = ['Damaged items', 'Spoiled or poor quality', 'Wrong items', 'Missing items', 'Not delivered', 'Other'];
const dashRefundTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
const dashRefundMaxFiles = 5, dashRefundMaxBytes = 50 * 1024 * 1024;
let dashRefundFiles = [];
let dashRefundPreviews = [];
function dashRefundForm(id) {
    const o = dashRoleOrders().find(x => x.id === id);
    if (!o || !dashCanRefund(o))
        return;
    dashRefundFiles = [];
    dashOpen('<p class="detail-kicker">Request a refund · ' + dashOrderNo(o.id) + '</p><h2 id="detail-title">What went wrong?</h2><p class="detail-subtitle">' + de(o.crop) + ' · ' + dp(o.total) + ' · ' + de(o.organization) + '</p><form class="dash-form" id="refund-form" data-order="' + o.id + '" novalidate><div class="form-grid single">'
        + dashField('reason', 'Reason' + dashRequired, '<select required><option value="">Choose a reason…</option>' + dashRefundReasons.map(r => '<option>' + r + '</option>').join('') + '</select>')
        + dashField('details', 'Nature of the complaint' + dashRequired, '<textarea rows="4" required minlength="20" maxlength="1000" placeholder="What was wrong with the order when it arrived?"></textarea>')
        + '<div class="form-field"><span class="form-label" id="media-label">Photo or video proof' + dashRequired + '</span><div class="refund-media" id="media-preview"></div><label class="control small file-button">' + di('camera') + 'Add photos or videos<input type="file" name="media" id="field-media" multiple accept="' + dashRefundTypes.join(',') + '" aria-labelledby="media-label" aria-describedby="error-media"></label><small class="field-error" id="error-media" data-error-for="media"></small></div>'
        + '</div><div class="detail-actions"><button type="button" class="control" data-order="' + o.id + '">Back</button><button type="submit" class="control primary">Request refund</button></div></form>');
    dashFocusField('#field-reason');
}
function dashRenderRefundFiles() {
    dashRefundPreviews.forEach(url => URL.revokeObjectURL(url));
    dashRefundPreviews = dashRefundFiles.map(f => URL.createObjectURL(f));
    const box = document.getElementById('media-preview');
    if (box)
        box.innerHTML = dashRefundFiles.map((f, i) => '<figure class="media-tile">' + (f.type.startsWith('video/') ? '<video src="' + dashRefundPreviews[i] + '" muted preload="metadata"></video>' : '<img src="' + dashRefundPreviews[i] + '" alt="">') + '<figcaption>' + de(f.name) + '</figcaption><button type="button" class="media-remove" data-media-remove="' + i + '" aria-label="Remove ' + de(f.name) + '">' + di('close') + '</button></figure>').join('');
}
function dashAddRefundFiles(input) {
    let problem = '';
    Array.from(input.files || []).forEach(f => {
        if (!dashRefundTypes.includes(f.type) || !f.size || f.size > dashRefundMaxBytes)
            problem = 'Choose JPG, PNG or WebP photos, or MP4, WebM or MOV videos, up to 50 MB each.';
        else if (dashRefundFiles.length >= dashRefundMaxFiles)
            problem = 'Attach up to ' + dashRefundMaxFiles + ' files.';
        else
            dashRefundFiles.push(f);
    });
    input.value = '';
    dashRenderRefundFiles();
    const slot = input.form?.querySelector('[data-error-for="media"]');
    if (slot)
        slot.textContent = problem;
}
function dashSubmitRefund(form) {
    const data = new FormData(form);
    const reason = String(data.get('reason') ?? ''), details = String(data.get('details') ?? '').trim();
    const errors = {};
    if (!dashRefundReasons.includes(reason))
        errors.reason = 'Choose a reason.';
    if (details.length < 20)
        errors.details = 'Describe what went wrong in at least 20 characters.';
    if (!dashRefundFiles.length)
        errors.media = 'Attach at least one photo or video.';
    if (!dashShowErrors(form, errors))
        return;
    const id = form.dataset.order;
    const body = new FormData();
    body.append('order', id);
    body.append('reason', reason);
    body.append('details', details);
    dashRefundFiles.forEach(f => body.append('media[]', f));
    void dashDo('refund.request', body, form).then(r => {
        if (!r)
            return;
        dashRefundFiles = [];
        dashOrderDetails(id);
        const o = dashRoleOrders().find(x => x.id === id);
        dashToast('Refund requested.' + (o?.refund ? ' ' + o.organization + ' has until ' + ddate(o.refund.respondBy) + ' to answer.' : ''));
    });
}
function dashRefundMedia(r) {
    return '<div class="refund-media">' + r.media.map(m => '<figure class="media-tile">' + (m.mime.startsWith('video/') ? '<video src="../api/refund-media/' + m.id + '" controls preload="metadata"></video>' : '<a href="../api/refund-media/' + m.id + '" target="_blank" rel="noopener"><img src="../api/refund-media/' + m.id + '" alt="' + de(m.name) + '" loading="lazy"></a>') + '<figcaption>' + de(m.name) + '</figcaption></figure>').join('') + '</div>';
}
function dashDisputeForm(id) {
    const o = dashRoleOrders().find(x => x.id === id);
    if (!o?.refund || !dashRefundOpen(o))
        return;
    dashOpen('<p class="detail-kicker">Dispute refund · ' + o.refund.id + '</p><h2 id="detail-title">Keep the payment for ' + dashOrderNo(o.id) + '?</h2><p class="detail-subtitle">' + de(o.customer) + ' · ' + dp(o.total) + ' · ' + de(o.refund.reason) + '</p><form class="dash-form" id="dispute-form" data-refund="' + o.refund.id + '" data-order="' + o.id + '" novalidate><div class="form-grid single">'
        + dashField('reason', 'Why you’re disputing it' + dashRequired, '<textarea rows="3" required minlength="10" maxlength="300"></textarea>')
        + '</div><div class="detail-actions"><button type="button" class="control" data-order="' + o.id + '">Back</button><button type="submit" class="control danger">Dispute refund</button></div></form>');
    dashFocusField('#field-reason');
}
function dashSubmitDispute(form) {
    const reason = String(new FormData(form).get('reason') ?? '').trim();
    if (!dashShowErrors(form, reason.length >= 10 ? {} : { reason: 'Explain why in at least 10 characters.' }))
        return;
    const id = form.dataset.order;
    void dashDo('refund.dispute', { id: form.dataset.refund, reason }, form).then(r => {
        if (r) {
            dashOrderDetails(id);
            dashToast('Refund disputed. An AniBayan administrator will decide; the payment stays held until then.');
        }
    });
}
function dashConfirmAcceptRefund(id) {
    const o = dashRoleOrders().find(x => x.id === id);
    if (!o?.refund || !dashRefundOpen(o))
        return;
    dashOpen('<p class="detail-kicker">Accept refund · ' + o.refund.id + '</p><h2 id="detail-title">Refund ' + dp(o.total) + ' to ' + de(o.customer) + '?</h2><p class="detail-subtitle">' + dashOrderNo(o.id) + ' · ' + de(o.crop) + ' · ' + de(o.method || '') + '</p><div class="detail-actions"><button class="control" data-order="' + o.id + '">Back</button><button class="control primary" data-accept-refund="' + o.refund.id + '" data-for-order="' + o.id + '">' + di('check') + 'Refund ' + dp(o.total) + '</button></div>');
}
/* ---------- Admin: refunds ---------- */
// Where a refund request stands, in words: the organization has to answer, an administrator has to decide, or it's settled.
function dashRefundStage(r) {
    return { Requested: 'Waiting for organization', Disputed: 'Disputed', Refunding: 'Refunding', Refunded: 'Refunded', Denied: 'Released to organization' }[r.status] || r.status;
}
function dashRefundList() {
    return dashboardOrders.filter(o => o.refund).map(o => ({ o, r: o.refund }))
        .filter(({ o, r }) => dashMatching([r.id, o.id, o.customer, o.organization, r.reason, dashRefundStage(r)].join(' ')) && (dashState.filter === 'All' || dashRefundStage(r) === dashState.filter))
        .sort((a, b) => Number(b.r.status === 'Disputed') - Number(a.r.status === 'Disputed') || b.r.requestedAt.localeCompare(a.r.requestedAt));
}
function dashRefundsView() {
    const all = dashboardOrders.filter(o => o.refund);
    const of = (status) => all.filter(o => status.includes(o.refund.status));
    const sum = (list) => list.reduce((t, o) => t + o.total, 0);
    const list = dashRefundList();
    const metrics = '<div class="metric-grid">' + dashMetric('Disputed', String(of(['Disputed']).length), 'flag', dp(sum(of(['Disputed']))) + ' held') + dashMetric('Waiting for organization', String(of(['Requested']).length), 'clock', dp(sum(of(['Requested']))) + ' held') + dashMetric('Refunded', dp(sum(of(['Refunded', 'Refunding']))), 'check', dashPlural(of(['Refunded', 'Refunding']).length, 'request')) + dashMetric('Released to organization', dp(sum(of(['Denied']))), 'wallet', dashPlural(of(['Denied']).length, 'request')) + '</div>';
    const table = list.length ? '<table><thead><tr><th scope="col">Refund</th><th scope="col">Order</th><th scope="col">Buyer</th><th scope="col">Organization</th><th scope="col">Amount</th><th scope="col">Reason</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + list.map(({ o, r }) => '<tr><td><strong>' + r.id + '</strong><small class="cell-note">' + dd(r.requestedAt.slice(0, 10)) + '</small></td><td>' + dashOrderNo(o.id) + '</td><td>' + de(o.customer) + '</td><td>' + de(o.organization) + '</td><td><strong>' + dp(o.total) + '</strong></td><td>' + de(r.reason) + '</td><td>' + ds(dashRefundStage(r)) + '</td><td><div class="row-actions"><button class="control small' + (r.status === 'Disputed' ? ' primary' : '') + '" data-refund-review="' + o.id + '">' + (r.status === 'Disputed' ? 'Decide' : 'View') + '</button></div></td></tr>').join('') + '</tbody></table>' : dashEmpty(all.length ? 'No matching refund requests' : 'No refund requests yet', '');
    return metrics + '<section class="panel">' + dashPanelHead('Refund requests', 'Disputes first') + dashFilters(['All', 'Disputed', 'Waiting for organization', 'Refunded', 'Released to organization'], dashPlural(list.length, 'request'), 'Search refunds') + '<div class="table-wrap">' + table + '</div></section>';
}
function dashRefundReview(orderId) {
    const o = dashboardOrders.find(x => x.id === orderId);
    const r = o?.refund;
    if (!o || !r)
        return;
    const open = r.status === 'Requested' || r.status === 'Disputed';
    const decide = open ? '<form class="dash-form" id="refund-decide-form" data-refund="' + r.id + '" data-order="' + o.id + '" novalidate><div class="form-grid single">' + dashField('note', 'Decision note', '<textarea rows="2" maxlength="300"></textarea>', 'Required when denying the refund. The buyer and organization can read it.') + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Close</button><button type="submit" class="control" value="release">Release ' + dp(o.total) + ' to ' + de(o.organization) + '</button><button type="submit" class="control primary" value="refund">' + di('check') + 'Refund ' + dp(o.total) + ' to ' + de(o.customer) + '</button></div></form>' : '<div class="detail-actions"><button class="control primary" data-close-dialog>Close</button></div>';
    dashOpen('<p class="detail-kicker">Refund request · ' + r.id + '</p><h2 id="detail-title">' + dp(o.total) + ' · ' + de(o.crop) + '</h2><p class="detail-subtitle">' + dashUserLink(o.customer) + ' → ' + dashOrgLink(o.organization) + ' · order ' + dashOrderNo(o.id) + '</p>'
        + '<dl class="detail-facts">' + dashFact('Status', ds(dashRefundStage(r))) + dashFact('Reason', de(r.reason)) + dashFact('Requested', dtime(r.requestedAt)) + (r.status === 'Requested' ? dashFact('Organization answers by', ddate(r.respondBy)) : '') + (r.disputedAt ? dashFact('Disputed', dtime(r.disputedAt)) : '') + (r.decidedAt ? dashFact('Settled', ddate(r.decidedAt) + (r.decidedBy ? '<small class="fact-note">' + { admin: 'By an administrator', organization: 'By the organization', automatic: 'No answer in time' }[r.decidedBy] + '</small>' : '')) : '') + dashFact('Payment', de(o.method || '') + (o.paymentRef ? '<small class="fact-note">' + de(o.paymentRef) + '</small>' : '')) + (o.deliveredAt ? dashFact('Delivered', dtime(o.deliveredAt)) : '') + '</dl>'
        + '<h3 class="detail-section">What the buyer says</h3><p class="detail-lead">' + de(r.details) + '</p>' + dashRefundMedia(r)
        + (r.disputeReason ? '<h3 class="detail-section">What ' + de(o.organization) + ' says</h3><p class="detail-lead">' + de(r.disputeReason) + '</p>' : '')
        + (r.adminNote ? '<p class="detail-note">AniBayan: “' + de(r.adminNote) + '”</p>' : '') + decide);
}
/* ---------- Saved delivery addresses and the map ---------- */
function dashAddressBook(me) {
    const list = me.addresses || [];
    const row = (a) => '<div class="address-row"><div><strong>' + de(a.label) + '</strong> ' + (a.isDefault ? ds('Default') : '') + (a.lat !== undefined ? ' ' + ds('Pinned') : '') + '<p>' + de(a.text) + '</p></div><div class="row-actions">' + (a.isDefault ? '' : '<button class="control small" data-default-address="' + a.id + '">Make default</button>') + '<button class="control small" data-edit-address="' + a.id + '">' + di('edit') + 'Edit</button><button class="control small" data-remove-address="' + a.id + '" aria-label="Remove ' + de(a.label) + '">Remove</button></div></div>';
    return '<section class="panel settings-panel"><h2>Delivery addresses</h2>' + (list.length ? '<div class="address-list">' + list.map(row).join('') + '</div>' : dashEmpty('No saved addresses yet.', '')) + '<div class="detail-actions"><button class="control primary" data-add-address>' + di('plus') + 'Add address</button></div></section>';
}
// A map to pin the place (it fills in the barangay, and the street when OpenStreetMap knows it), plus the barangay
// and house/street fields. Either a pin or typed details is enough.
function dashAddressBlock(a) {
    const pinned = a?.lat !== undefined && a?.lng !== undefined;
    return '<div class="form-field"><span class="form-label" id="pin-label">Pin on the map</span><div class="map-picker" id="map-picker" aria-labelledby="pin-label"' + (pinned ? ' data-lat="' + a.lat + '" data-lng="' + a.lng + '"' : '') + '></div><div class="map-tools"><button type="button" class="control small" data-locate>' + di('pin') + 'Use my location</button><button type="button" class="control small" data-clear-pin' + (pinned ? '' : ' hidden') + '>Remove pin</button></div><input type="hidden" name="lat" value="' + (pinned ? a.lat : '') + '"><input type="hidden" name="lng" value="' + (pinned ? a.lng : '') + '"><small class="field-error" id="error-pin" data-error-for="pin"></small></div>'
        + dashField('barangay', 'Barangay, ' + dashCityName + dashRequired, '<select required>' + dashBarangayOptions(a?.barangay || '') + '</select>')
        + dashField('details', 'House number, street or landmark', '<input maxlength="120" autocomplete="address-line1" placeholder="e.g. 12 J.P. Rizal Street" value="' + de(a?.details || '') + '">');
}
function dashReadAddressBlock(data, errors) {
    const lat = String(data.get('lat') ?? ''), lng = String(data.get('lng') ?? ''), details = String(data.get('details') ?? '').trim(), barangay = String(data.get('barangay') ?? '');
    const pinned = lat !== '' && lng !== '';
    if (!dashBarangays.includes(barangay))
        errors.barangay = 'Choose a barangay in Calapan City.';
    if (!pinned && details.length < 4)
        errors.details = 'Enter the house number and street, or pin the place on the map.';
    return pinned ? { details, barangay, lat: Number(lat), lng: Number(lng) } : { details, barangay };
}
function dashAddressForm(id) {
    const list = dashAccount().addresses || [];
    const a = id ? list.find(x => x.id === id) : undefined;
    if (id && !a)
        return;
    dashOpen('<p class="detail-kicker">Delivery address</p><h2 id="detail-title">' + (a ? 'Edit ' + de(a.label) : 'Add an address') + '</h2><form class="dash-form" id="address-form"' + (a ? ' data-id="' + a.id + '"' : '') + ' novalidate><div class="form-grid single">' + dashAddressBlock(a)
        + dashField('label', 'Label', '<input maxlength="40" placeholder="Home, Work…" value="' + de(a?.label || '') + '">')
        + (a?.isDefault || !list.length ? '' : '<label class="check-row"><input type="checkbox" name="default"> Use as my default address</label>')
        + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">' + di('check') + 'Save address</button></div></form>');
    void dashMountMap();
}
function dashSubmitAddress(form) {
    const data = new FormData(form);
    const errors = {};
    const place = dashReadAddressBlock(data, errors);
    if (!dashShowErrors(form, errors))
        return;
    void dashDo('address.save', { ...place, id: form.dataset.id ? Number(form.dataset.id) : undefined, label: String(data.get('label') ?? '').trim(), default: !!data.get('default') }, form).then(r => {
        if (r) {
            dashDialog.close();
            dashToast('Address saved.');
        }
    });
}
let dashLeaflet = null;
let dashCalapan = null;
let dashMapView = null;
let dashMapControls = null;
function dashLoadMap() {
    if (!dashLeaflet)
        dashLeaflet = new Promise(resolve => {
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            css.crossOrigin = '';
            document.head.appendChild(css);
            const js = document.createElement('script');
            js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            js.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            js.crossOrigin = '';
            js.onload = () => resolve(true);
            js.onerror = () => { dashLeaflet = null; resolve(false); };
            document.head.appendChild(js);
        });
    const shapes = dashCalapan ? Promise.resolve(true) : fetch('assets/calapan-barangays.json').then(r => r.json()).then(d => { dashCalapan = d.barangays; return true; }).catch(() => false);
    return Promise.all([dashLeaflet, shapes, dashLoadStreets()]).then(([map, outlines]) => map && outlines);
}
function dashInRing(x, y, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi)
            inside = !inside;
    }
    return inside;
}
function dashBarangayAt(lat, lng) {
    for (const b of dashCalapan || [])
        for (const poly of b.polygons)
            if (dashInRing(lng, lat, poly[0]) && !poly.slice(1).some(hole => dashInRing(lng, lat, hole)))
                return b.name;
    return '';
}
// Calapan's named streets and places from OpenStreetMap, shipped with AniBayan (assets/calapan-streets.json), so naming
// a pin needs no outside service. The street/landmark field follows every pin: the nearest named street within 60 m,
// else "Near <school, church, sitio…>" within 400 m, else a street within 200 m, else empty for the buyer to type.
let dashStreets = null;
function dashLoadStreets() {
    return dashStreets ? Promise.resolve(true) : fetch('assets/calapan-streets.json').then(r => r.json()).then(d => { dashStreets = d; return true; }).catch(() => false);
}
function dashNameAt(lat, lng) {
    if (!dashStreets)
        return '';
    const kx = 111320 * Math.cos(lat * Math.PI / 180), ky = 110540;
    const xy = (p) => [(p[0] - lng) * kx, (p[1] - lat) * ky];
    let street = Infinity, streetName = '';
    for (const s of dashStreets.streets)
        for (let i = 1; i < s.c.length; i++) {
            const [ax, ay] = xy(s.c[i - 1]), [bx, by] = xy(s.c[i]);
            const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
            const t = len ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len)) : 0;
            const d = Math.hypot(ax + t * dx, ay + t * dy);
            if (d < street) {
                street = d;
                streetName = s.n;
            }
        }
    if (street <= 60)
        return streetName;
    let place = Infinity, placeName = '';
    for (const p of dashStreets.places || []) {
        const [x, y] = xy(p.p);
        const d = Math.hypot(x, y);
        if (d < place) {
            place = d;
            placeName = p.n;
        }
    }
    if (place <= 400)
        return 'Near ' + placeName;
    return street <= 200 ? streetName : '';
}
function dashFillStreet(form, lat, lng) {
    const details = form.elements.namedItem('details');
    if (!details)
        return;
    details.value = dashNameAt(lat, lng).slice(0, 120);
    dashClearFieldError(details);
}
async function dashMountMap() {
    const box = document.getElementById('map-picker');
    if (!box || box.dataset.mounted)
        return;
    if (dashMapView) {
        dashMapView.remove();
        dashMapView = null;
        dashMapControls = null;
    }
    box.dataset.mounted = '1';
    if (!await dashLoadMap() || !document.body.contains(box)) {
        box.closest('.form-field')?.setAttribute('hidden', '');
        return;
    }
    const form = box.closest('form');
    const field = (name) => form.elements.namedItem(name);
    const slot = form.querySelector('[data-error-for="pin"]');
    const clearButton = form.querySelector('[data-clear-pin]');
    const cityRings = (dashCalapan || []).flatMap(b => b.polygons.map(poly => poly[0]));
    const cityBounds = L.latLngBounds(cityRings.flatMap(ring => ring.map(([lng, lat]) => [lat, lng])));
    const map = L.map(box, { scrollWheelZoom: false, maxBounds: cityBounds.pad(.025), maxBoundsViscosity: 1, minZoom: 12 }).setView([13.401, 121.180], 13);
    dashMapView = map;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    const outlines = {};
    for (const b of dashCalapan || [])
        outlines[b.name] = L.polygon(b.polygons.map(p => p.map(r => r.map(([x, y]) => [y, x]))), { color: '#1c8540', weight: 1, opacity: .45, fillColor: '#2eb957', fillOpacity: 0, interactive: false }).addTo(map);
    const highlight = (name) => Object.entries(outlines).forEach(([n, shape]) => shape.setStyle({ fillOpacity: n === name ? .14 : 0, weight: n === name ? 2 : 1 }));
    let marker = null;
    let last = null;
    const setPin = (lat, lng, lookup) => {
        const barangay = dashBarangayAt(lat, lng);
        if (!barangay) {
            slot.textContent = 'AniBayan delivers only within Calapan City. Pin a place inside the city.';
            if (marker && last) {
                marker.setLatLng(last);
                map.panTo(last, { animate: false });
            }
            else
                map.fitBounds(cityBounds, { padding: [12, 12], animate: false });
            return;
        }
        slot.textContent = '';
        last = [lat, lng];
        if (!marker) {
            marker = L.marker([lat, lng], { draggable: true, title: 'Delivery pin' }).addTo(map);
            marker.on('dragend', () => { const p = marker.getLatLng(); setPin(p.lat, p.lng, true); });
        }
        else
            marker.setLatLng([lat, lng]);
        field('lat').value = lat.toFixed(6);
        field('lng').value = lng.toFixed(6);
        field('barangay').value = barangay;
        dashClearFieldError(field('barangay'));
        dashClearFieldError(field('details'));
        highlight(barangay);
        clearButton.hidden = false;
        if (lookup)
            dashFillStreet(form, lat, lng);
    };
    const fly = (name) => { if (outlines[name]) {
        map.fitBounds(outlines[name].getBounds(), { maxZoom: 16 });
        highlight(name);
    } };
    map.on('click', (e) => setPin(e.latlng.lat, e.latlng.lng, true));
    dashMapControls = {
        locate: () => {
            if (!navigator.geolocation) {
                slot.textContent = 'This browser can’t share your location. Tap the map instead.';
                return;
            }
            navigator.geolocation.getCurrentPosition(p => { map.setView([p.coords.latitude, p.coords.longitude], 17); setPin(p.coords.latitude, p.coords.longitude, true); }, () => { slot.textContent = 'Your location couldn’t be read. Tap the map instead.'; }, { enableHighAccuracy: true, timeout: 10000 });
        },
        clear: () => { if (marker) {
            map.removeLayer(marker);
            marker = null;
            last = null;
        } field('lat').value = ''; field('lng').value = ''; clearButton.hidden = true; slot.textContent = ''; highlight(field('barangay').value); },
        fly: (name) => { if (last && dashBarangayAt(last[0], last[1]) !== name)
            dashMapControls.clear(); fly(name); },
    };
    if (box.dataset.lat) {
        const lat = Number(box.dataset.lat), lng = Number(box.dataset.lng);
        map.setView([lat, lng], 16);
        setPin(lat, lng, false);
    }
    else if (field('barangay').value)
        fly(field('barangay').value);
    window.setTimeout(() => map.invalidateSize(), 50);
}
const dashRatingWords = ['', 'Very poor', 'Poor', 'Okay', 'Good', 'Excellent'];
function dashFeedbackForm(orderId) {
    const o = dashRoleOrders().find(x => x.id === orderId);
    if (!o || dashRated(o.id))
        return;
    const stars = [1, 2, 3, 4, 5].map(n => '<input type="radio" name="rating" id="rating-' + n + '" value="' + n + '"><label for="rating-' + n + '" title="' + n + ' – ' + dashRatingWords[n] + '">★<span class="sr-only">' + dashPlural(n, 'star') + ', ' + dashRatingWords[n] + '</span></label>').join('');
    dashOpen('<p class="detail-kicker">Rate your order · ' + dashOrderNo(o.id) + '</p><h2 id="detail-title">How was your order?</h2><p class="detail-subtitle">' + de(o.crop) + ' · ' + de(o.quantity) + ' from ' + de(o.organization) + '</p><form class="dash-form" id="feedback-form" data-order="' + o.id + '" novalidate><div class="form-grid single"><div class="form-field"><span class="form-label" id="rating-label">Your rating' + dashRequired + '</span><div class="star-input" role="radiogroup" aria-labelledby="rating-label" aria-describedby="rating-caption error-rating">' + stars + '</div><small class="form-hint" id="rating-caption">Choose 1 to 5 stars.</small><small class="field-error" id="error-rating" data-error-for="rating"></small></div>' + dashField('comment', 'Comment (optional)', '<textarea rows="3" maxlength="300" placeholder="What did you like? What could be better?"></textarea>') + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">' + di('star') + 'Submit rating</button></div></form>');
    dashFocusField('#rating-1');
}
function dashSubmitFeedback(form) {
    const data = new FormData(form);
    const rating = Number(data.get('rating'));
    if (!dashShowErrors(form, rating >= 1 && rating <= 5 ? {} : { rating: 'Choose a rating from 1 to 5 stars.' }))
        return;
    void dashDo('feedback.create', { order: form.dataset.order, rating, comment: String(data.get('comment') ?? '').trim() }, form).then(r => {
        if (r) {
            dashDialog.close();
            dashToast('Thanks for rating ' + r.organization + '!');
        }
    });
}
const dashReportReasons = ['Short or wrong quantity', 'Poor quality or spoiled', 'Harvest date not as listed', 'Late or no fulfillment', 'Payment or refund problem', 'Other'];
function dashReportForm(orderId) {
    const o = dashRoleOrders().find(x => x.id === orderId);
    if (!o || dashMyReport(o.id))
        return;
    dashOpen('<p class="detail-kicker">Report a problem · ' + dashOrderNo(o.id) + '</p><h2 id="detail-title">What went wrong?</h2><p class="detail-subtitle">' + de(o.crop) + ' · ' + de(o.quantity) + ' from ' + de(o.organization) + '</p><form class="dash-form" id="report-form" data-order="' + o.id + '" novalidate><div class="form-grid single">'
        + dashField('reason', 'Reason' + dashRequired, '<select required><option value="">Choose a reason…</option>' + dashReportReasons.map(r => '<option>' + de(r) + '</option>').join('') + '</select>')
        + dashField('details', 'Details' + dashRequired, '<textarea rows="4" required maxlength="500" placeholder="What did you receive, and when?"></textarea>', 'At least 20 characters.')
        + '</div><p class="detail-note">AniBayan administrators review every report.</p><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">' + di('flag') + 'Send report</button></div></form>');
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
    void dashDo('report.create', { order: form.dataset.order, reason, details }, form).then(r => {
        if (r) {
            dashDialog.close();
            dashToast('Report sent. An AniBayan administrator will review it.');
        }
    });
}
// Administrators warn an organization directly; at its final warning the next step is termination.
function dashWarningForm(name) {
    const s = dashStanding(name);
    if (s.terminated)
        return;
    if (s.final) {
        dashTerminateDialog(name);
        return;
    }
    const last = s.count + 1 >= dashWarningLimit;
    dashOpen('<p class="detail-kicker">Warn organization · ' + dashNextOffence(name) + '</p><h2 id="detail-title">Give ' + de(name) + ' a warning</h2><form class="dash-form" id="warning-form" data-organization-name="' + de(name) + '" novalidate><div class="form-grid single">'
        + dashField('reason', 'Reason' + dashRequired, '<input required maxlength="120" placeholder="For example: abusive messages to a buyer">')
        + dashField('details', 'Details (optional)', '<textarea rows="3" maxlength="500" placeholder="What happened, and when?"></textarea>')
        + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control danger">' + di('flag') + (last ? 'Give final warning' : 'Give warning') + '</button></div></form>');
    dashFocusField('#field-reason');
}
function dashSubmitWarning(form) {
    const data = new FormData(form);
    const reason = String(data.get('reason') ?? '').trim(), details = String(data.get('details') ?? '').trim();
    if (!dashShowErrors(form, reason.length >= 5 ? {} : { reason: 'Give a reason of at least 5 characters.' }))
        return;
    const name = form.dataset.organizationName || '';
    void dashDo('warning.create', { organization: name, reason, details }, form).then(r => {
        if (r) {
            dashApplicationDetails(name);
            dashToast('Warning given. ' + dashStandingSentence(name));
        }
    });
}
// Asks before terminating. With a report, upholding that report is the offence that ends it.
function dashTerminateDialog(name, reportId = '') {
    const s = dashStanding(name);
    if (s.terminated)
        return;
    dashOpen('<p class="detail-kicker">Terminate organization</p><h2 id="detail-title">Terminate ' + de(name) + '?</h2><p class="detail-subtitle">This can’t be undone.</p><form class="dash-form" id="terminate-form" data-organization-name="' + de(name) + '" data-report="' + reportId + '" novalidate>'
        + (reportId ? '' : '<div class="form-grid single">' + dashField('reason', 'Reason' + dashRequired, '<input required maxlength="120" placeholder="What did the organization do this time?">') + '</div>')
        + '<div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control danger">' + di('lock') + (reportId ? 'Uphold and terminate' : 'Terminate organization') + '</button></div></form>');
    if (!reportId)
        dashFocusField('#field-reason');
}
function dashSubmitTerminate(form) {
    const name = form.dataset.organizationName || '';
    const report = form.dataset.report || '';
    const reason = report ? '' : String(new FormData(form).get('reason') ?? '').trim();
    if (!report && !dashShowErrors(form, reason.length >= 5 ? {} : { reason: 'Give a reason of at least 5 characters.' }))
        return;
    void dashDo('organization.terminate', { organization: name, report, reason }, form).then(r => {
        if (r) {
            dashApplicationDetails(name);
            dashToast(name + ' is terminated. Its listings left the shop and its representative is signed out.');
        }
    });
}
let dashToastTimeout;
function dashToast(message) {
    if (dashDialog.open) {
        const host = document.getElementById('detail-content');
        if (host) {
            host.querySelector('.detail-toast')?.remove();
            const notice = document.createElement('p');
            notice.className = 'detail-toast';
            notice.setAttribute('role', 'status');
            notice.textContent = message;
            host.prepend(notice);
            window.setTimeout(() => notice.remove(), 3600);
            return;
        }
    }
    const el = document.getElementById('dashboard-toast');
    el.textContent = message;
    el.classList.add('visible');
    window.clearTimeout(dashToastTimeout);
    dashToastTimeout = window.setTimeout(() => el.classList.remove('visible'), 3600);
}
function dashExportRows() {
    const view = dashState.view;
    if (isAdminDashboard) {
        if (view === 'activity')
            return ['activity-log', [['Time', 'Email', 'Name', 'Activity', 'Details'], ...dashActivityList().map(e => [e.time, e.actor, dashAccountByEmail(e.actor)?.name || '', dashActivityInfo(e.type)[0], e.detail])]];
        if (view === 'refunds')
            return ['refunds', [['Refund ID', 'Order', 'Buyer', 'Organization', 'Amount PHP', 'Reason', 'Status', 'Requested', 'Organization’s answer', 'Administrator’s note'], ...dashRefundList().map(({ o, r }) => [r.id, o.id, o.customer, o.organization, o.total, r.reason, dashRefundStage(r), r.requestedAt.slice(0, 10), r.disputeReason || '', r.adminNote || ''])]];
        if (view === 'reports')
            return ['user-reports', [['Report ID', 'Organization', 'Reported by', 'Reason', 'Details', 'Order', 'Filed', 'Status'], ...dashReportList().map(r => [r.id, r.organization, r.customer, r.reason, r.details, r.order || '', r.date, r.status])]];
        if (view === 'applications')
            return ['organization-applications', [['Organization', 'Region', 'Main crops', 'Representative', 'Members', 'Documents', 'Submitted', 'Status'], ...dashApplicationList().map(o => [o.name, o.region, o.crop, o.representative, o.members, o.documents.map(d => d.type).join('; '), o.applied, dashAppStatus(o)])]];
        if (view === 'health')
            return ['health-checks', [['Checked at', 'Service', 'Result', 'Response time (ms)', 'Error'], ...dashboardHealthLog.slice().reverse().flatMap(run => run.results.map(r => [run.time, r.service, r.ok ? 'Passed' : 'Failed', r.latency, r.error || '']))]];
        if (view === 'listings')
            return ['listings', [['Product ID', 'Name', 'Organization', 'Category', 'Price PHP', 'Unit', 'Available quantity', 'Status', 'Removal reason'], ...dashAdminListings().map(c => [c.id, c.name, c.organization, c.category, c.price, c.unit, c.stock, dashCropStatus(c), c.removalReason || ''])]];
        if (view === 'barangays')
            return ['barangays', [['Barangay', 'Municipality'], ...dashBarangays.filter(name => dashMatching(name)).map(name => [name, dashCityName])]];
        return ['accounts', [['Name', 'Email', 'Role', 'Organization', 'Joined', 'Last active', 'Status'], ...dashAccountList().map(a => [a.name, a.email, a.role === 'Consumer' ? 'Buyer' : a.role, a.organization || '', a.joined, a.lastActive, a.status])]];
    }
    if (view === 'listings')
        return ['listings', [['Product ID', 'Name', 'Category', 'Price PHP', 'Unit', 'Available quantity', 'Harvest date', 'Shelf life (days)', 'Best before', 'Status'], ...dashListingCrops().map(c => [c.id, c.name, c.category, c.price, c.unit, c.stock, c.harvested, c.shelfLife, dashAddDays(c.harvested, c.shelfLife), dashCropStatus(c)])]];
    if (view === 'members')
        return ['members', [['Farmer', 'Barangay', 'Crops', 'Area ha', 'Member since', 'Status'], ...dashMyMembers().filter(m => dashMatching([m.name, m.place, m.crops, m.status].join(' '))).map(m => [m.name, m.place, m.crops, m.area, m.joined, m.status])]];
    if (view === 'feedback')
        return ['feedback', [['Feedback ID', 'Date', 'Buyer', 'Rating', 'Comment', 'Order'], ...dashOrgFeedbackList().map(f => [f.id, f.date, f.customer, f.rating, f.comment, f.order || ''])]];
    // The overview follows its reporting period (last 7 days or last 4 weeks).
    const span = dashState.period === 'week' ? 7 : 28;
    const orders = isOrgDashboard && view === 'overview' ? dashOrders().filter(o => { const age = dashAge(o.date); return age >= 0 && age < span; }) : dashOrders();
    return ['orders', [['Order ID', 'Buyer', 'Organization', 'Harvest', 'Quantity', 'Total PHP', 'Status', 'Payment', 'Date', 'Delivery address', 'Contact number', 'Payment method'], ...orders.map(o => [o.id, o.customer, o.organization, o.crop, o.quantity, o.total, o.status, o.payment, o.date, o.address || '', o.phone || '', o.method || ''])]];
}
// What an export says above its table: the page it came from, who exported it and when, and the filters in use.
function dashExportMeta(recordType) {
    const titles = { 'activity-log': 'Activity log', 'user-reports': 'User reports', refunds: 'Refunds', 'organization-applications': 'Organization applications', 'health-checks': 'Site health checks', accounts: 'Accounts', listings: 'Listings', barangays: 'Barangays', members: 'Member farmers', feedback: 'Ratings and feedback', orders: dashState.view === 'payments' ? 'Payments' : isConsumerDashboard ? 'My orders' : 'Orders' };
    const filters = [];
    if (isOrgDashboard && dashState.view === 'overview')
        filters.push('Period: ' + (dashState.period === 'week' ? 'last 7 days' : 'last 4 weeks'));
    if (dashState.filter && dashState.filter !== 'All')
        filters.push((dashState.view === 'listings' ? 'Show: ' : 'Status: ') + dashState.filter);
    if (dashState.query.trim())
        filters.push('Search: “' + dashState.query.trim() + '”');
    const me = dashMe();
    return { title: titles[recordType] || recordType, scope: isOrgDashboard ? dashOrgName : isAdminDashboard ? 'Administrator workspace' : me?.name || '', by: me?.name || '', when: new Date().toLocaleString('en-PH', { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' }), filters: filters.join(' · ') };
}
const dashExportFooter = 'AniBayan · ' + dashCityName + ', Oriental Mindoro';
// The totals row under an export's table: sums where adding up makes sense (order totals, farm area, stock in one
// unit, application members), the average rating for feedback, and the number of rows everywhere.
function dashExportTotals(recordType, table) {
    const head = table[0].map(String), body = table.slice(1);
    const nouns = { refunds: 'refund request', orders: 'order', listings: 'listing', barangays: 'barangay', members: 'member farmer', feedback: 'review', accounts: 'account', 'user-reports': 'report', 'organization-applications': 'application', 'activity-log': 'event', 'health-checks': 'check' };
    const sum = (column) => body.reduce((total, row) => total + Number(row[head.indexOf(column)] || 0), 0);
    const values = {};
    let label = 'Total';
    if (recordType === 'orders')
        values['Total PHP'] = sum('Total PHP');
    if (recordType === 'refunds')
        values['Amount PHP'] = sum('Amount PHP');
    if (recordType === 'members')
        values['Area ha'] = Math.round(sum('Area ha') * 10) / 10;
    if (recordType === 'organization-applications')
        values.Members = sum('Members');
    if (recordType === 'listings') {
        const units = [...new Set(body.map(row => String(row[head.indexOf('Unit')])))];
        if (units.length === 1) {
            values['Available quantity'] = sum('Available quantity');
            values.Unit = units[0];
        }
    }
    if (recordType === 'feedback') {
        label = 'Average';
        if (body.length)
            values.Rating = Math.round(sum('Rating') / body.length * 10) / 10;
    }
    return head.map((column, i) => i === 0 ? label + ' · ' + dashPlural(body.length, nouns[recordType] || 'row') : column in values ? values[column] : '');
}
let dashExcelLib = null;
async function dashExport(button) {
    button.disabled = true;
    try {
        if (!dashExcelLib)
            dashExcelLib = dashLoadScript('https://unpkg.com/exceljs@4.4.0/dist/exceljs.min.js', 'sha384-Pqp51FUN2/qzfxZxBCtF0stpc9ONI6MYZpVqmo8m20SoaQCzf+arZvACkLkirlPz').then(ok => { if (!ok)
                dashExcelLib = null; return ok; });
        const assets = await dashExportAssets();
        if (!await dashExcelLib || !assets) {
            dashToast('The Excel file couldn’t be made right now. Check your connection and try again.');
            return;
        }
        const [recordType, table] = dashExportRows();
        const meta = dashExportMeta(recordType);
        const totals = dashExportTotals(recordType, table);
        const cols = table[0].length, last = Math.max(cols, 4), top = 7;
        const color = { deep: 'FF214C35', green: 'FF1C8540', lime: 'FFB5E655', tint: 'FFEEF6EA', stripe: 'FFF5F7F3', ink: 'FF1C2A21', muted: 'FF5D695F', line: 'FFE3E8E1', white: 'FFFFFFFF' };
        const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
        const thin = { style: 'thin', color: { argb: color.line } };
        const wb = new ExcelJS.Workbook();
        wb.creator = 'AniBayan';
        wb.created = new Date();
        const ws = wb.addWorksheet(meta.title.slice(0, 31), {
            views: [{ state: 'frozen', ySplit: top, showGridLines: false }],
            pageSetup: { paperSize: 9, orientation: cols > 6 ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: .4, right: .4, top: .5, bottom: .6, header: .2, footer: .3 } },
            headerFooter: { oddFooter: '&L&8' + dashExportFooter + '&R&8Page &P of &N' },
        });
        ws.columns = table[0].map((_, i) => ({ width: Math.min(46, Math.max(i === 0 ? 16 : 10, ...[...table, totals].map(r => String(r[i] ?? '').length + 3))) }));
        // Header band: rows 1–5 tinted, the logo over the first column, the text beside it.
        [30, 20, 18, 18, 8].forEach((h, i) => { ws.getRow(i + 1).height = h; for (let c = 1; c <= last; c++)
            ws.getCell(i + 1, c).fill = fill(color.tint); });
        const line = (row, text, font) => { ws.mergeCells(row, 2, row, last); const cell = ws.getCell(row, 2); cell.value = text; cell.font = { name: 'Calibri', ...font }; cell.alignment = { vertical: 'middle', indent: 1 }; };
        line(1, 'AniBayan', { size: 22, bold: true, color: { argb: color.deep } });
        line(2, meta.title + ' · ' + meta.scope, { size: 12, bold: true, color: { argb: color.green } });
        line(3, 'Exported ' + meta.when + ' by ' + meta.by, { size: 10, color: { argb: color.muted } });
        line(4, 'Filters: ' + (meta.filters || 'none'), { size: 10, color: { argb: color.muted } });
        ws.addImage(wb.addImage({ base64: assets.logo, extension: 'png' }), { tl: { col: 0.15, row: 0.12 }, ext: { width: 96, height: 84 }, editAs: 'oneCell' });
        ws.getRow(6).height = 5;
        for (let c = 1; c <= last; c++)
            ws.getCell(6, c).fill = fill(color.deep);
        // The table.
        const money = table[0].map(String).indexOf('Total PHP');
        const head = ws.getRow(top);
        head.values = table[0];
        head.height = 24;
        head.eachCell((cell) => { cell.fill = fill(color.deep); cell.font = { name: 'Calibri', bold: true, color: { argb: color.white } }; cell.alignment = { vertical: 'middle', wrapText: true }; cell.border = { bottom: { style: 'medium', color: { argb: color.lime } } }; });
        table.slice(1).forEach((values, i) => {
            const row = ws.getRow(top + 1 + i);
            row.values = values;
            for (let c = 1; c <= cols; c++) {
                const cell = row.getCell(c);
                cell.font = { name: 'Calibri', color: { argb: color.ink } };
                cell.alignment = { vertical: 'top', wrapText: true };
                cell.border = { bottom: thin };
                if (i % 2)
                    cell.fill = fill(color.stripe);
                if (c - 1 === money)
                    cell.numFmt = '"₱"#,##0';
            }
        });
        const sum = ws.getRow(top + table.length);
        sum.values = totals;
        sum.height = 22;
        for (let c = 1; c <= cols; c++) {
            const cell = sum.getCell(c);
            cell.fill = fill(color.tint);
            cell.font = { name: 'Calibri', bold: true, color: { argb: color.deep } };
            cell.alignment = { vertical: 'middle' };
            cell.border = { top: { style: 'medium', color: { argb: color.deep } } };
            if (c - 1 === money)
                cell.numFmt = '"₱"#,##0';
        }
        ws.autoFilter = { from: { row: top, column: 1 }, to: { row: top, column: cols } };
        // Footer band.
        const foot = top + table.length + 2;
        ws.mergeCells(foot, 1, foot, last);
        ws.getRow(foot).height = 24;
        const end = ws.getCell(foot, 1);
        end.value = dashExportFooter + ' · Exported ' + meta.when + ' by ' + meta.by;
        end.fill = fill(color.deep);
        end.font = { name: 'Calibri', bold: true, size: 10, color: { argb: color.white } };
        end.alignment = { vertical: 'middle', indent: 1 };
        ws.mergeCells(foot + 1, 1, foot + 1, last);
        ws.getRow(foot + 1).height = 4;
        ws.getCell(foot + 1, 1).fill = fill(color.lime);
        const blob = new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'anibayan-' + recordType + '-' + dashToday + '.xlsx';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        dashToast(meta.title + ' exported as Excel.');
    }
    finally {
        button.disabled = false;
    }
}
let dashPdfLib = null;
let dashPdfAssets = null;
function dashExportAssets() {
    if (!dashPdfAssets)
        dashPdfAssets = Promise.all(['assets/jakarta-400.ttf', 'assets/jakarta-700.ttf', 'assets/anibayan-logo.png'].map(url => fetch(url).then(r => { if (!r.ok)
            throw new Error(url); return r.arrayBuffer(); })))
            .then(([regular, bold, logo]) => ({ regular: dashBase64(regular), bold: dashBase64(bold), logo: 'data:image/png;base64,' + dashBase64(logo) }))
            .catch(() => { dashPdfAssets = null; return null; });
    return dashPdfAssets;
}
function dashLoadScript(src, integrity) {
    return new Promise(resolve => { const js = document.createElement('script'); js.src = src; js.integrity = integrity; js.crossOrigin = 'anonymous'; js.onload = () => resolve(true); js.onerror = () => resolve(false); document.head.appendChild(js); });
}
function dashBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let text = '';
    for (let i = 0; i < bytes.length; i += 0x8000)
        text += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    return btoa(text);
}
function dashLoadPdf() {
    if (!dashPdfLib)
        dashPdfLib = dashLoadScript('https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js', 'sha384-en/ztfPSRkGfME4KIm05joYXynqzUgbsG5nMrj/xEFAHXkeZfO3yMK8QQ+mP7p1/')
            .then(ok => ok && dashLoadScript('https://unpkg.com/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js', 'sha384-Xl/CUCfJbzsngMp0CFxkmF0VW/8C160IsGujqeQlIhaGxKz2+JsIGORFqtCPeldF'))
            .then(ok => { if (!ok)
            dashPdfLib = null; return ok; });
    return Promise.all([dashPdfLib, dashExportAssets()]).then(([lib, assets]) => lib && !!assets);
}
async function dashExportPdf(button) {
    button.disabled = true;
    try {
        if (!await dashLoadPdf()) {
            dashToast('The PDF couldn’t be made right now. Check your connection and try again.');
            return;
        }
        const assets = (await dashPdfAssets);
        const [recordType, table] = dashExportRows();
        const meta = dashExportMeta(recordType);
        const doc = new jspdf.jsPDF({ orientation: table[0].length > 6 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
        doc.addFileToVFS('Jakarta-400.ttf', assets.regular);
        doc.addFont('Jakarta-400.ttf', 'Jakarta', 'normal');
        doc.addFileToVFS('Jakarta-700.ttf', assets.bold);
        doc.addFont('Jakarta-700.ttf', 'Jakarta', 'bold');
        const width = doc.internal.pageSize.getWidth(), height = doc.internal.pageSize.getHeight(), margin = 36, top = 112;
        doc.autoTable({
            head: [table[0].map(String)], body: table.slice(1).map(row => row.map(String)), foot: [dashExportTotals(recordType, table).map(v => typeof v === 'number' ? v.toLocaleString('en-PH') : String(v))], showFoot: 'lastPage', startY: top, margin: { top, bottom: 56, left: margin, right: margin },
            styles: { font: 'Jakarta', fontSize: 8, cellPadding: 4, textColor: [28, 42, 33], lineColor: [227, 232, 225], lineWidth: .5, overflow: 'linebreak' },
            headStyles: { fillColor: [33, 76, 53], textColor: 255, fontStyle: 'bold' }, footStyles: { fillColor: [238, 246, 234], textColor: [33, 76, 53], fontStyle: 'bold' }, alternateRowStyles: { fillColor: [245, 247, 243] },
        });
        const pages = doc.getNumberOfPages();
        for (let page = 1; page <= pages; page++) {
            doc.setPage(page);
            // Header: a light green band with the logo, a dark green rule and a lime accent under it.
            doc.setFillColor(238, 246, 234);
            doc.rect(0, 0, width, 88, 'F');
            doc.setFillColor(33, 76, 53);
            doc.rect(0, 88, width, 5, 'F');
            doc.setFillColor(181, 230, 85);
            doc.rect(0, 93, width, 2, 'F');
            doc.addImage(assets.logo, 'PNG', margin, 10, 78, 69);
            doc.setFont('Jakarta', 'bold');
            doc.setFontSize(24);
            doc.setTextColor(33, 76, 53);
            doc.text('AniBayan', margin + 90, 42);
            doc.setFontSize(11);
            doc.setTextColor(28, 133, 64);
            doc.text(meta.title + ' · ' + meta.scope, margin + 90, 62);
            doc.setFont('Jakarta', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(93, 105, 95);
            doc.text('Exported ' + meta.when, width - margin, 36, { align: 'right' });
            doc.text('by ' + meta.by, width - margin, 50, { align: 'right' });
            doc.text(meta.filters ? 'Filters: ' + meta.filters : 'No filters', width - margin, 64, { align: 'right' });
            // Footer: a lime line over a dark green band.
            doc.setFillColor(181, 230, 85);
            doc.rect(0, height - 34, width, 2, 'F');
            doc.setFillColor(33, 76, 53);
            doc.rect(0, height - 32, width, 32, 'F');
            doc.setFont('Jakarta', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(255, 255, 255);
            doc.text(dashExportFooter + ' · ' + dashPlural(table.length - 1, 'row'), margin, height - 13);
            doc.text('Page ' + page + ' of ' + pages, width - margin, height - 13, { align: 'right' });
        }
        doc.save('anibayan-' + recordType + '-' + dashToday + '.pdf');
        dashToast(meta.title + ' exported as PDF.');
    }
    finally {
        button.disabled = false;
    }
}
function dashSetPopover(panelId, buttonId, open) {
    document.getElementById(panelId).hidden = !open;
    document.getElementById(buttonId).setAttribute('aria-expanded', String(open));
}
function dashClosePopovers() { dashSetPopover('notification-panel', 'show-notifications', false); dashSetPopover('workspace-menu', 'workspace-toggle', false); }
const dashNarrow = window.matchMedia('(max-width:900px)');
function dashReadHash() {
    const requested = location.hash.slice(1);
    if (isGuest && dashBuyerViews.includes(requested)) {
        dashGoToSignIn('buyer');
        return;
    }
    const allowed = dashRole.nav.map(n => n[0]).concat(dashRole.settingsNav ? [dashRole.settingsNav[0]] : [], ['help']);
    const profile = /^(org|user)=([a-z0-9-]+)$/.exec(requested);
    if (profile)
        dashState.profile = { kind: profile[1] === 'user' ? 'user' : 'org', slug: profile[2] };
    dashState.view = profile ? 'profile' : allowed.includes(requested) ? requested : dashRole.nav[0][0];
    const search = document.getElementById('dashboard-search');
    if (search)
        search.setAttribute('placeholder', dashState.view === 'cart' ? 'Search items in your cart' : isAdminDashboard && dashState.view === 'listings' ? 'Search listings' : isAdminDashboard && dashState.view === 'barangays' ? 'Search barangays' : dashRole.search);
    dashRepositioning = null;
    dashState.filter = dashState.nextFilter || 'All';
    dashState.nextFilter = '';
    dashState.query = '';
    dashClosePopovers();
    document.body.classList.remove('sidebar-open');
    dashRender();
    window.scrollTo(0, 0);
}
/* ---------- Start: sign-in check, events ---------- */
function dashStart() {
    dashShell();
    // Links from the homepage: consumer.html?q=rice#shop searches the shop; ?grower=Name opens that community's profile.
    const params = new URLSearchParams(location.search);
    const grower = isConsumerDashboard ? params.get('grower') : null;
    if (grower) {
        params.delete('grower');
        history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + '#org=' + dashSlug(grower));
    }
    window.addEventListener('hashchange', dashReadHash);
    dashReadHash();
    if (isConsumerDashboard && params.get('q')) {
        dashState.query = params.get('q').replace(/-/g, ' ');
        dashRender();
    }
    if (isAdminDashboard)
        void dashRunHealthChecks();
    if (dashBuyer)
        void dashCheckPayments();
    // Coming back to this tab fetches the latest data, so changes made elsewhere (another tab, another person) show.
    // A different person signed in meanwhile, or this one was signed out: start the page again.
    window.addEventListener('focus', () => {
        const before = dashSessionMe;
        void dashFetchState().then(ok => {
            if (!ok)
                return;
            if (dashSessionMe !== before || dashBlockedStatus) {
                location.reload();
                return;
            }
            dashApplyPreferences();
            dashRender();
        });
    });
    document.getElementById('dashboard-search').addEventListener('input', event => { dashState.query = event.target.value; dashRender(); });
    document.addEventListener('keydown', event => {
        const el = event.target;
        // Repositioning a banner: arrow keys move it (Shift for bigger steps), Enter saves, Escape cancels.
        const r = dashRepositioning;
        if (r && el instanceof HTMLElement && el.classList.contains('is-positioning')) {
            if (event.key === 'Enter') {
                event.preventDefault();
                dashFinishReposition(true);
                return;
            }
            const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
            const d = step[event.key];
            const size = event.shiftKey ? 30 : 10;
            if (d) {
                event.preventDefault();
                dashMoveBanner(d[0] * size, d[1] * size, { x: r.x, y: r.y });
                return;
            }
        }
        if (r && event.key === 'Escape') {
            event.preventDefault();
            dashFinishReposition(false);
            return;
        }
        // Photo pickers are labels acting as buttons.
        if ((event.key === 'Enter' || event.key === ' ') && el instanceof HTMLLabelElement && el.getAttribute('role') === 'button') {
            event.preventDefault();
            el.querySelector('input')?.click();
            return;
        }
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
    document.addEventListener('click', dashHandleClick);
    document.addEventListener('input', event => {
        const input = event.target;
        if (input.type === 'tel')
            dashLimitPhone(input);
        if (input.dataset.tableSearch !== undefined) {
            dashState.query = input.value;
            dashRender();
            return;
        }
        const key = input.dataset.shop;
        if (key) {
            dashState.shop[key] = input.value;
            dashRefreshShop();
            return;
        }
        const form = input.form;
        if (!form || !form.closest('#detail-dialog'))
            return;
        dashClearFieldError(input);
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
    // Dragging a banner that is being repositioned.
    document.addEventListener('pointerdown', event => {
        const el = event.target;
        const banner = el.closest('.profile-banner.is-positioning');
        const r = dashRepositioning;
        if (!banner || !r || event.button !== 0 || el.closest('button,label,input'))
            return;
        r.drag = { id: event.pointerId, cx: event.clientX, cy: event.clientY, x: r.x, y: r.y };
        banner.setPointerCapture(event.pointerId);
        banner.classList.add('is-dragging');
        event.preventDefault();
    });
    document.addEventListener('pointermove', event => { const r = dashRepositioning; if (r?.drag && event.pointerId === r.drag.id)
        dashMoveBanner(event.clientX - r.drag.cx, event.clientY - r.drag.cy, r.drag); });
    const endDrag = (event) => { const r = dashRepositioning; if (!r?.drag || event.pointerId !== r.drag.id)
        return; r.drag = undefined; dashBannerEl(r.target)?.classList.remove('is-dragging'); };
    document.addEventListener('pointerup', endDrag);
    document.addEventListener('pointercancel', endDrag);
    document.addEventListener('change', event => {
        const input = event.target;
        if (input.dataset.cartSelect !== undefined) {
            if (input.checked)
                dashCartSelection.add(input.dataset.cartSelect);
            else
                dashCartSelection.delete(input.dataset.cartSelect);
            dashRender();
            return;
        }
        if (input.dataset.cartSelectAll !== undefined) {
            dashCartEntries().filter(e => dashMatching(e.crop.name + ' ' + e.crop.organization + ' ' + e.crop.category)).forEach(e => input.checked ? dashCartSelection.add(e.crop.id) : dashCartSelection.delete(e.crop.id));
            dashRender();
            return;
        }
        if (input.dataset.upload) {
            void dashUploadLook(input);
            return;
        }
        if (input.id === 'field-media') {
            dashAddRefundFiles(input);
            return;
        }
        if (input.name === 'barangay' && input.form?.querySelector('#map-picker')) {
            dashMapControls?.fly(input.value);
        }
        if (input.name === 'address' && input.form?.id === 'checkout-form') {
            const block = input.form.querySelector('.new-address');
            block.hidden = input.value !== 'new';
            if (!block.hidden)
                void dashMountMap();
            return;
        }
        if (input.dataset.privacy) {
            const key = input.dataset.privacy;
            if (!dashMe() || !isConsumerDashboard || !(key in dashPrivacyDefaults))
                return;
            void dashDo('privacy', { key, value: input.checked }).then(() => document.getElementById('privacy-' + key)?.focus());
            return;
        }
        if (input.id === 'dashboard-period') {
            dashState.period = input.value === 'month' ? 'month' : 'week';
            dashState.bar = 99;
            dashRender();
        }
        if (input.id === 'density') {
            document.body.classList.toggle('compact-density', input.checked);
            dashSavePreferences();
        }
        if (input.id === 'contrast') {
            document.body.classList.toggle('contrast-mode', input.checked);
            dashSavePreferences();
        }
        if (input.name === 'rating') {
            const caption = document.getElementById('rating-caption');
            if (caption)
                caption.textContent = dashPlural(Number(input.value), 'star') + ' · ' + dashRatingWords[Number(input.value)];
        }
        const preview = document.getElementById('photo-preview');
        if (preview && input.id === 'field-photo' && input.files && input.files[0])
            preview.src = URL.createObjectURL(input.files[0]);
        if (preview && input.id === 'field-image' && input.value) {
            preview.src = dashImg(input.value);
            const file = document.getElementById('field-photo');
            file.value = '';
        }
    });
    document.addEventListener('submit', event => {
        const form = event.target;
        if (!form.closest('#detail-dialog'))
            return;
        event.preventDefault();
        if (form.id === 'listing-form')
            void dashSubmitListing(form);
        else if (form.id === 'feedback-form')
            dashSubmitFeedback(form);
        else if (form.id === 'report-form')
            dashSubmitReport(form);
        else if (form.id === 'order-decline-form')
            dashSubmitOrderDecline(form);
        else if (form.id === 'application-decline-form')
            dashSubmitApplicationDecline(form);
        else if (form.id === 'report-decision-form') {
            const id = form.dataset.report || '', decision = form.dataset.decision || '';
            const note = String(new FormData(form).get('note') ?? '').trim();
            if (!dashShowErrors(form, note.length >= 10 ? {} : { note: 'Give an explanation of at least 10 characters.' }))
                return;
            void dashDo('report.decide', { id, decision, note }, form).then(r => {
                if (!r)
                    return;
                dashReportDetails(id);
                dashToast('Report dismissed. The reporter can see your explanation in AniBayan.');
            });
        }
        else if (form.id === 'warning-form')
            dashSubmitWarning(form);
        else if (form.id === 'terminate-form')
            dashSubmitTerminate(form);
        else if (form.id === 'checkout-form')
            dashSubmitCheckout(form);
        else if (form.id === 'profile-form')
            dashSubmitProfile(form);
        else if (form.id === 'org-profile-form')
            dashSubmitOrgProfile(form);
        else if (form.id === 'member-form')
            dashSubmitMember(form);
        else if (form.id === 'member-remove-form')
            dashSubmitMemberRemove(form);
        else if (form.id === 'admin-listing-remove-form')
            dashSubmitAdminListingRemove(form);
        else if (form.id === 'barangay-form')
            dashSubmitBarangay(form);
        else if (form.id === 'barangay-edit-form')
            dashSubmitBarangayEdit(form);
        else if (form.id === 'barangay-remove-form')
            dashSubmitBarangayRemove(form);
        else if (form.id === 'suspend-form')
            dashSubmitSuspend(form);
        else if (form.id === 'password-form')
            dashSubmitPassword(form);
        else if (form.id === 'address-form')
            dashSubmitAddress(form);
        else if (form.id === 'refund-form')
            dashSubmitRefund(form);
        else if (form.id === 'dispute-form')
            dashSubmitDispute(form);
        else if (form.id === 'refund-decide-form') {
            const decision = event.submitter?.value === 'release' ? 'release' : 'refund';
            const order = form.dataset.order;
            const note = String(new FormData(form).get('note') ?? '').trim();
            if (decision === 'release' && !dashShowErrors(form, note.length >= 10 ? {} : { note: 'Explain why the refund was denied in at least 10 characters.' }))
                return;
            void dashDo('refund.decide', { id: form.dataset.refund, decision, note }, form).then(r => {
                if (r) {
                    dashRefundReview(order);
                    dashToast(decision === 'refund' ? (r.status === 'Refunded' ? 'Refund sent to the buyer.' : 'Refund approved. PayMongo is still processing it.') : 'Refund denied with your note. Payment released to the organization.');
                }
            });
        }
    });
    dashDialog.addEventListener('click', event => { if (event.target === dashDialog) {
        const r = dashDialog.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)
            dashDialog.close();
    } });
}
function dashHandleClick(event) {
    const el = event.target;
    if (!el.closest('.notification-wrap'))
        dashSetPopover('notification-panel', 'show-notifications', false);
    if (!el.closest('.workspace-switch'))
        dashSetPopover('workspace-menu', 'workspace-toggle', false);
    if (el.closest('#sidebar-backdrop'))
        document.body.classList.remove('sidebar-open');
    if (el.closest('[data-sign-out]')) {
        event.preventDefault();
        void dashApi('logout', {}).then(() => { location.href = 'login.html'; });
        return;
    }
    if (el.closest('[data-sign-in]')) {
        event.preventDefault();
        dashGoToSignIn('signin');
        return;
    }
    if (el.closest('[data-sign-in-buyer]')) {
        event.preventDefault();
        dashGoToSignIn('buyer');
        return;
    }
    // Profile links are plain links; a pop-up they sit in closes as the profile opens.
    if (el.closest('[data-profile-link]') && dashDialog.open)
        dashDialog.close();
    const target = el.closest('button,[data-go]');
    if (!target)
        return;
    const data = target.dataset;
    if (data.reposition) {
        void dashStartReposition(data.reposition);
        return;
    }
    if (data.repositionSave !== undefined) {
        dashFinishReposition(true);
        return;
    }
    if (data.repositionCancel !== undefined) {
        dashFinishReposition(false);
        return;
    }
    if (data.removePhoto && data.look) {
        if (!dashCanEdit(data.look))
            return;
        const avatar = data.removePhoto === 'avatar';
        dashRepositioning = null;
        void dashDo('look.remove', { target: data.look, kind: avatar ? 'avatar' : 'banner' }).then(r => { if (r)
            dashToast(avatar ? 'Picture removed.' : 'Banner removed.'); });
        return;
    }
    if (data.shopType) {
        dashState.shop.type = dashState.shop.type === data.shopType ? 'All' : data.shopType;
        dashRender();
        return;
    }
    if (data.go) {
        dashState.nextFilter = data.goFilter || '';
        if (dashDialog.open)
            dashDialog.close();
        dashNavigate(data.go);
        return;
    }
    if (data.decline) {
        const id = data.decline;
        const order = dashboardOrders.find(o => o.id === id);
        if (order?.status === 'Pending' && !order.buyerSuspended) {
            dashOrderDeclineForm(id);
            return;
        }
        void dashDo('order.decline', { order: id }).then(r => {
            if (!r)
                return;
            if (dashDialog.open && order)
                dashOrderDetails(id);
            dashToast('Order ' + dashOrderNo(id) + ' cancelled. AniBayan recorded why it was blocked.');
        });
        return;
    }
    if (data.advance || data.cancelOrder) {
        const id = (data.advance || data.cancelOrder);
        const action = data.advance ? 'order.advance' : 'order.cancel';
        void dashDo(action, { order: id }).then(r => {
            if (!r)
                return;
            const order = dashboardOrders.find(o => o.id === id);
            if (dashDialog.open && order)
                dashOrderDetails(id);
            dashToast(data.cancelOrder ? 'Order ' + dashOrderNo(id) + ' cancelled at your request.' : 'Order ' + dashOrderNo(id) + ' marked ' + (order?.status || 'updated').toLowerCase() + '.');
        });
        return;
    }
    if (data.toggleConfirm) {
        dashToggleListing(data.toggleConfirm, true);
        return;
    }
    if (data.toggleListing) {
        dashToggleListing(data.toggleListing);
        return;
    }
    if (data.editListing) {
        dashListingForm(data.editListing);
        return;
    }
    if (data.removeListing) {
        dashConfirmRemoveListing(data.removeListing);
        return;
    }
    if (data.confirmRemove) {
        void dashDo('listing.remove', { id: data.confirmRemove }).then(r => {
            if (r) {
                dashDialog.close();
                dashToast(r.name + ' was removed from your listings.');
            }
        });
        return;
    }
    if (data.addMember !== undefined) {
        dashMemberForm();
        return;
    }
    if (data.adminRemoveListing) {
        dashAdminListingRemoveForm(data.adminRemoveListing);
        return;
    }
    if (data.addBarangay !== undefined) {
        dashBarangayForm();
        return;
    }
    if (data.barangayEdit) {
        dashBarangayEditForm(data.barangayEdit);
        return;
    }
    if (data.barangayRemove) {
        dashBarangayRemoveForm(data.barangayRemove);
        return;
    }
    if (data.memberConfirm) {
        const member = dashboardMembers.find(m => m.id === data.memberConfirm);
        if (member)
            void dashDo('member.confirm', { id: member.id }).then(r => { if (r)
                dashToast(member.name + ' is now an active member.'); });
        return;
    }
    if (data.memberRemove) {
        const member = dashboardMembers.find(m => m.id === data.memberRemove);
        if (member)
            dashOpen('<p class="detail-kicker">Member farmers · ' + de(dashOrgName) + '</p><h2 id="detail-title">Remove ' + de(member.name) + '?</h2><p class="detail-subtitle">They will no longer be listed as a member of ' + de(dashOrgName) + '. Add a note explaining this removal before continuing.</p><form class="dash-form" id="member-remove-form" data-member="' + member.id + '" novalidate><div class="form-grid single">' + dashField('note', 'Note for removal' + dashRequired, '<textarea rows="3" required minlength="5" maxlength="200" placeholder="Reason for removing this member..."></textarea>', 'This note is saved in the activity log.', true) + '</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control danger">Remove member</button></div></form>');
        return;
    }
    if (data.review && data.reviewName) {
        const name = data.reviewName, approve = data.review === 'Active';
        if (!approve) {
            dashApplicationDeclineForm(name);
            return;
        }
        void dashDo('application.review', { name, decision: data.review }).then(r => {
            if (!r)
                return;
            dashDialog.close();
            dashToast(name + (approve ? ' approved. ' + (r.representative ? r.representative + ' can now sign in.' : '') : ' declined.'));
        });
        return;
    }
    if (data.decide && data.reportId) {
        const id = data.reportId, decision = data.decide;
        if (decision === 'Dismissed') {
            dashReportDecisionForm(id, decision);
            return;
        }
        void dashDo('report.decide', { id, decision }).then(r => {
            const report = dashboardReports.find(x => x.id === id);
            if (!r || !report)
                return;
            dashReportDetails(id);
            dashToast(id + (decision === 'Open' ? ' reopened. ' : ' ' + decision.toLowerCase() + '. ') + dashStandingSentence(report.organization));
        });
        return;
    }
    if (data.warn) {
        dashWarningForm(data.warn);
        return;
    }
    if (data.terminate) {
        dashTerminateDialog(data.terminate, data.terminateReport || '');
        return;
    }
    if (data.withdrawWarning) {
        void dashDo('warning.withdraw', { id: data.withdrawWarning }).then(r => {
            if (!r)
                return;
            dashApplicationDetails(String(r.organization));
            dashToast('Warning withdrawn. ' + dashStandingSentence(String(r.organization)));
        });
        return;
    }
    if (data.reportId) {
        dashReportDetails(data.reportId);
        return;
    }
    if (data.suspend) {
        const account = dashAccountByEmail(data.suspend);
        if (account?.status === 'Active')
            dashSuspendForm(data.suspend);
        else
            dashRunAccountSuspend(data.suspend);
        return;
    }
    if (data.resetPassword) {
        void dashResetPassword(data.resetPassword);
        return;
    }
    if (data.copy) {
        const text = document.getElementById(data.copy)?.textContent || '';
        navigator.clipboard?.writeText(text).then(() => dashToast('Copied.'), () => dashToast('Copy didn’t work here; select the password and copy it.'));
        return;
    }
    if (data.account) {
        dashAccountDetails(data.account);
        return;
    }
    if (data.rate) {
        if (dashRequireBuyer())
            dashFeedbackForm(data.rate);
        return;
    }
    if (data.reportOrder) {
        if (dashRequireBuyer())
            dashReportForm(data.reportOrder);
        return;
    }
    if (data.payOrder) {
        dashPaymentDialog([data.payOrder]);
        return;
    }
    if (data.receipt) {
        dashReceiptDialog([data.receipt]);
        return;
    }
    if (data.refundReview) {
        dashRefundReview(data.refundReview);
        return;
    }
    if (data.orderReceived) {
        dashConfirmReceived(data.orderReceived);
        return;
    }
    if (data.confirmReceived) {
        const id = data.confirmReceived;
        void dashDo('order.received', { order: id }).then(r => { if (r) {
            dashOrderDetails(id);
            dashToast('Order ' + dashOrderNo(id) + ' received.');
        } });
        return;
    }
    if (data.requestRefund) {
        if (dashRequireBuyer())
            dashRefundForm(data.requestRefund);
        return;
    }
    if (data.mediaRemove !== undefined) {
        dashRefundFiles.splice(Number(data.mediaRemove), 1);
        dashRenderRefundFiles();
        return;
    }
    if (data.disputeRefund) {
        dashDisputeForm(data.disputeRefund);
        return;
    }
    if (data.acceptRefundAsk) {
        dashConfirmAcceptRefund(data.acceptRefundAsk);
        return;
    }
    if (data.acceptRefund) {
        const order = data.forOrder;
        void dashDo('refund.accept', { id: data.acceptRefund }).then(r => { if (r) {
            dashOrderDetails(order);
            dashToast(r.status === 'Refunded' ? 'Refund sent.' : 'Refund accepted. PayMongo is still processing it.');
        } });
        return;
    }
    if (data.addAddress !== undefined) {
        dashAddressForm();
        return;
    }
    if (data.editAddress) {
        dashAddressForm(Number(data.editAddress));
        return;
    }
    if (data.removeAddress) {
        void dashDo('address.remove', { id: Number(data.removeAddress) }).then(r => { if (r)
            dashToast('Address removed.'); });
        return;
    }
    if (data.defaultAddress) {
        void dashDo('address.default', { id: Number(data.defaultAddress) }).then(r => { if (r)
            dashToast('Default address changed.'); });
        return;
    }
    if (data.locate !== undefined) {
        dashMapControls?.locate();
        return;
    }
    if (data.clearPin !== undefined) {
        dashMapControls?.clear();
        return;
    }
    if (data.pay) {
        void dashStartPayment(data.pay.split(','), target);
        return;
    }
    if (data.paymentCheck !== undefined) {
        void dashRefreshPaymentStatus(true, target);
        return;
    }
    if (data.payLater !== undefined) {
        dashDialog.close();
        dashNavigate('orders');
        dashToast('Your order is waiting for payment. Use Pay now in My orders when you’re ready.');
        return;
    }
    if (data.addListing !== undefined) {
        dashListingForm();
        return;
    }
    if (data.editOrgProfile !== undefined) {
        dashOrgProfileForm();
        return;
    }
    if (data.editProfile !== undefined) {
        dashProfileForm();
        return;
    }
    if (data.changePassword !== undefined) {
        dashPasswordForm();
        return;
    }
    if (data.resetData !== undefined) {
        dashConfirmReset();
        return;
    }
    if (data.confirmReset !== undefined) {
        void dashDo('data.reset').then(r => { if (r)
            location.href = 'login.html'; });
        return;
    }
    if (data.addCart) {
        const id = data.addCart;
        const input = data.qtyFrom ? document.getElementById(data.qtyFrom) : null;
        void dashAddToCart(id, input ? Number(input.value) : 1, input?.form || undefined).then(added => { if (added && dashDialog.open && !isGuest)
            dashProductDetails(id); });
        return;
    }
    if (data.cartStep) {
        void dashDo('cart.step', { crop: data.cartStep, step: Number(data.step) });
        return;
    }
    if (data.cartRemove) {
        void dashDo('cart.remove', { crop: data.cartRemove }).then(r => { if (r)
            dashToast('Removed from your cart.'); });
        return;
    }
    if (data.cartClear !== undefined) {
        void dashDo('cart.clear').then(r => { if (r)
            dashToast('Your cart is empty.'); });
        return;
    }
    if (data.checkout !== undefined) {
        dashCheckoutForm();
        return;
    }
    if (data.shopReset !== undefined) {
        dashState.shop = { ...dashShopDefaults };
        dashState.query = '';
        dashRender();
        return;
    }
    if (data.shopRegion) {
        dashState.shop = { ...dashShopDefaults, location: data.shopRegion };
        if (dashDialog.open)
            dashDialog.close();
        dashNavigate('shop');
        return;
    }
    if (data.healthCheck !== undefined) {
        void dashRunHealthChecks().then(() => dashToast('Health checks finished: ' + (dashHealthSummary().down.length ? dashPlural(dashHealthSummary().down.length, 'service') + ' down.' : 'every checked service is up.')));
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
            dashOpenOrgProfile(data.organization);
        return;
    }
    if (data.filter) {
        dashState.filter = data.filter;
        dashRender();
        return;
    }
    if (data.chart) {
        if (data.chartGroup === 'hardware')
            dashState.hardwareChart = data.chart;
        else
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
        if (!dashRequireBuyer())
            return;
        const id = data.save;
        const inDialog = !!target.closest('#detail-dialog');
        void dashDo('save.toggle', { crop: id }).then(r => {
            if (!r)
                return;
            if (inDialog)
                dashProductDetails(id);
            dashToast(r.saved ? 'Harvest saved.' : 'Harvest removed from saved items.');
        });
        return;
    }
    if (target.hasAttribute('data-close-dialog')) {
        dashDialog.close();
        return;
    }
    if (target.id === 'export-dashboard') {
        void dashExport(target);
        return;
    }
    if (target.id === 'export-pdf') {
        void dashExportPdf(target);
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
}
// Admin and organization pages need a matching account. The server signs out an account that was suspended or
// terminated since it signed in, and says so (dashBlockedStatus). Without the server, the page says it isn't answering.
if (dashOffline)
    dashStart();
else if (dashBlockedStatus)
    location.replace('login.html?notice=' + dashBlockedStatus + (dashBlockedReason ? '&reason=' + encodeURIComponent(dashBlockedReason) : ''));
else if (dashNeedsSignIn)
    location.replace('login.html?next=' + encodeURIComponent(dashPageFile() + location.search + location.hash) + '&notice=' + (isAdminDashboard ? 'admin' : 'organization'));
else
    dashStart();
