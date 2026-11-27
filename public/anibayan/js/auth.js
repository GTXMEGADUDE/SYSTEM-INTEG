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
// Sign-in and create-account page (login.html). Accounts live on AniBayan's server: buyers can sign up and shop
// right away; organization representatives apply and can sign in once an administrator approves.
const authRoot = document.getElementById('auth-content');
const authParams = new URLSearchParams(location.search);
const authEmailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
let authView = authParams.get('reset') === '1' && location.hash === '#reset' ? 'reset' : location.hash === '#forgot' ? 'forgot' : location.hash === '#register' ? 'register' : 'signin';
let authSubmitted;
let authForgotEmail = '';
let authForgotSent = false;
const authResetToken = authParams.get('token') || '';
const authResetEmail = authParams.get('email') || '';
const authNotices = {
    signin: 'Sign in to continue.',
    buyer: 'Sign in with a buyer account to order, save harvests and rate growers.',
    admin: 'Sign in with an administrator account to open the admin workspace.',
    organization: 'Sign in with your organization representative account to open your workspace.',
    suspended: 'You were signed out because an AniBayan administrator suspended that account.',
    terminated: 'You were signed out because your organization was terminated.',
    pending: 'That organization application is still being reviewed.',
    declined: 'That organization application was declined.',
    'password-reset': 'Your password has been reset. Sign in with your new password.',
};
// Where to go after signing in: back to the page that asked (when it suits the account's role), otherwise the role's home.
function authDestination(role) {
    const next = authParams.get('next') || '';
    const roles = { 'consumer.html': 'Consumer', 'organization.html': 'Representative', 'admin.html': 'Administrator' };
    return roles[next.split(/[?#]/)[0]] === role ? next : dashHomeForRole(role);
}
// The documents an organization attaches (keys match App\Support\Documents::TYPES on the server). Only
// administrators can open them.
const authDocuments = [['registration', 'CDA or SEC registration'], ['endorsement', 'Barangay endorsement'], ['id', 'Representative ID']];
const authDocumentTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const authDocumentMaxBytes = 5 * 1024 * 1024;
const authDocumentHint = 'PDF, JPG, PNG or WebP · up to 5 MB';
const authFileSize = (bytes) => bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + ' KB' : (bytes / 1024 / 1024).toFixed(1) + ' MB';
function authSignInView() {
    const notice = authNotices[authParams.get('notice') || ''];
    const reason = authParams.get('reason');
    return '<form class="auth-form" id="signin-form" novalidate><h1>Welcome back</h1><p class="auth-lead">Sign in to shop fresh harvests or manage your organization.</p>' + (notice ? '<p class="auth-notice">' + de(notice) + (reason ? ' Reason: ' + de(reason) : '') + '</p>' : '') + '<div class="form-grid single">'
        + dashField('email', 'Email', '<input type="email" required autocomplete="email" placeholder="name@example.com">')
        + dashField('password', 'Password', '<input type="password" data-password-toggle-input required autocomplete="current-password">')
        + '</div><p class="auth-forgot"><button type="button" class="text-button" data-auth-view="forgot">Forgot password?</button></p><p class="form-error" id="signin-error" role="alert" hidden></p><button type="submit" class="control primary auth-submit">Sign in</button><p class="auth-switch">New to AniBayan? <button type="button" class="text-button" data-auth-view="register">Create an account</button></p></form>';
}
function authForgotView() {
    return '<form class="auth-form" id="forgot-form" novalidate><h1>Forgot password?</h1><p class="auth-lead">Enter the email address on your account and we’ll send a reset link.</p>' + (authForgotSent ? '<p class="auth-notice" role="status">If an account exists for that email, we sent a password reset link.</p>' : '') + '<div class="form-grid single">' + dashField('email', 'Email', '<input type="email" required maxlength="160" autocomplete="email" placeholder="name@example.com" value="' + de(authForgotEmail) + '">') + '</div><p class="form-error" id="forgot-error" role="alert" hidden></p><button type="submit" class="control primary auth-submit">Send reset link</button><p class="auth-switch"><button type="button" class="text-button" data-auth-view="signin">Back to sign in</button></p></form>';
}
function authResetView() {
    if (!authResetToken || !authResetEmail)
        return '<div class="auth-done"><h1>Reset link unavailable</h1><p>Request a new password reset link to continue.</p><div class="detail-actions"><button type="button" class="control primary" data-auth-view="forgot">Request a new link</button></div></div>';
    return '<form class="auth-form" id="reset-form" novalidate><h1>Choose a new password</h1><p class="auth-lead">Set a new password for ' + de(authResetEmail) + '.</p><div class="form-grid single">' + dashField('password', 'New password', '<input type="password" data-password-toggle-input required minlength="8" maxlength="200" autocomplete="new-password">', 'At least 8 characters.') + dashField('password_confirmation', 'Confirm new password', '<input type="password" data-password-toggle-input required minlength="8" maxlength="200" autocomplete="new-password">') + '</div><p class="form-error" id="reset-error" role="alert" hidden></p><button type="submit" class="control primary auth-submit">Reset password</button><p class="auth-switch"><button type="button" class="text-button" data-auth-view="signin">Back to sign in</button></p></form>';
}
function authRegisterView() {
    const organization = authParams.get('type') === 'organization';
    const choice = (value, title, text, checked) => '<label class="choice"><input type="radio" name="type" value="' + value + '"' + (checked ? ' checked' : '') + '><span><strong>' + title + '</strong><small>' + text + '</small></span></label>';
    const barangayOther = dashField('barangayOther', 'Barangay name' + dashRequired, '<input required minlength="2" maxlength="80" autocomplete="address-level3">', 'An administrator will check it with your application.', true).replace('<div class="form-field wide">', '<div class="form-field wide" id="barangay-other-wrap" hidden>');
    return '<form class="auth-form" id="register-form" novalidate><h1>Create your account</h1><p class="auth-lead">Buy fresh harvests, or apply to sell for your farmer organization.</p>'
        + '<div class="form-field auth-type"><span class="form-label" id="type-label">I want to</span><div class="choice-list two" role="radiogroup" aria-labelledby="type-label">' + choice('buyer', 'Buy harvests', 'Shop from local growing communities.', !organization) + choice('organization', 'Sell for my organization', 'An administrator reviews new organizations.', organization) + '</div></div>'
        + '<div class="form-grid">'
        + dashField('name', 'Full name' + dashRequired, '<input required maxlength="80" autocomplete="name">', '', true)
        + dashField('email', 'Email' + dashRequired, '<input type="email" required maxlength="120" autocomplete="email" placeholder="name@example.com">')
        + dashField('phone', 'Mobile number' + dashRequired, '<input ' + dashPhoneInput + ' placeholder="0917 555 0148">')
        + dashField('password', 'Password' + dashRequired, '<input type="password" data-password-toggle-input required minlength="8" maxlength="200" autocomplete="new-password">', 'At least 8 characters.')
        + dashField('password_confirmation', 'Confirm password' + dashRequired, '<input type="password" data-password-toggle-input required minlength="8" maxlength="200" autocomplete="new-password">')
        + '</div><div class="form-grid org-fields"' + (organization ? '' : ' hidden') + '><h2 class="form-section">Your organization</h2>'
        + dashField('orgName', 'Organization name' + dashRequired, '<input required maxlength="80">', '', true)
        + dashField('barangayChoice', 'Barangay, ' + dashCityName + dashRequired, '<select required>' + dashBarangayOptions('') + '<option value="__other__">My barangay is not listed</option></select>', 'If it is missing, choose the last option to request it.')
        + barangayOther
        + dashField('crops', 'Main crops' + dashRequired, '<input required maxlength="80" placeholder="e.g. Rice, calamansi">', '', true)
        + '<div class="form-field wide"><span class="form-label" id="documents-label">Documents' + dashRequired + '</span><div class="choice-list" role="group" aria-labelledby="documents-label" aria-describedby="error-documents">' + authDocuments.map(([key, label]) => '<div class="choice doc-upload" data-doc="' + key + '"><span><strong>' + de(label) + '</strong><small data-doc-file>' + authDocumentHint + '</small></span><label class="control small file-button"><span data-doc-action>Attach</span><input type="file" name="documents[' + key + ']" accept="' + authDocumentTypes.join(',') + '" aria-label="Attach ' + de(label) + '"></label><button type="button" class="control small" data-doc-remove="' + key + '" aria-label="Remove ' + de(label) + '" hidden>Remove</button></div>').join('') + '</div><small class="field-error" id="error-documents" data-error-for="documents"></small></div>'
        + '</div><p class="form-error" id="register-error" role="alert" hidden></p><button type="submit" class="control primary auth-submit" id="register-submit">' + (organization ? 'Submit application' : 'Create account') + '</button><p class="auth-switch">Already have an account? <button type="button" class="text-button" data-auth-view="signin">Sign in</button></p></form>';
}
function authSubmittedView() {
    const account = authSubmitted;
    return '<div class="auth-done"><svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg><h1>Application submitted</h1><p><strong>' + de(account.organization) + '</strong> is waiting for review. An AniBayan administrator checks your documents, then approves or declines the application.</p>' + (account.requestedBarangay ? '<p class="auth-notice">Your barangay was not in the list. It will be added to AniBayan’s options if your application is approved.</p>' : '') + '<p>Once it’s approved, sign in as <strong>' + de(account.email) + '</strong> to add your crop listings.</p><div class="detail-actions"><a class="control" href="index.html">Back to homepage</a><button class="control primary" data-auth-view="signin">Go to sign in</button></div></div>';
}
function authRender() {
    const current = dashAccountByEmail(dashSessionEmail());
    const banner = current && current.status === 'Active' && authView !== 'submitted' ? '<div class="auth-signed-in"><span>Signed in as <strong>' + de(current.name) + '</strong></span><a href="' + dashHomeFor(current) + '">Go to your dashboard</a><button type="button" data-auth-sign-out>Sign out</button></div>' : '';
    const tabs = authView === 'signin' || authView === 'register' ? '<div class="auth-tabs" role="tablist" aria-label="Account"><button role="tab" id="tab-signin" aria-selected="' + (authView === 'signin') + '" aria-controls="auth-panel" data-auth-view="signin">Sign in</button><button role="tab" id="tab-register" aria-selected="' + (authView === 'register') + '" aria-controls="auth-panel" data-auth-view="register">Create account</button></div>' : '';
    const panel = authView === 'signin' ? authSignInView() : authView === 'register' ? authRegisterView() : authView === 'forgot' ? authForgotView() : authView === 'reset' ? authResetView() : authSubmittedView();
    authRoot.innerHTML = banner + tabs + '<div id="auth-panel"' + (tabs ? ' role="tabpanel" aria-labelledby="tab-' + (authView === 'register' ? 'register' : 'signin') + '"' : '') + '>' + panel + '</div>';
    dashSetupPasswordToggles(authRoot);
    document.title = 'AniBayan — ' + (authView === 'register' ? 'Create an account' : authView === 'forgot' ? 'Forgot password' : authView === 'reset' ? 'Reset password' : 'Sign in');
}
function authSetView(view) {
    authView = view;
    const url = new URL(location.href);
    if (view !== 'reset' && authResetToken) {
        url.searchParams.delete('reset');
        url.searchParams.delete('token');
        url.searchParams.delete('email');
    }
    url.hash = view === 'register' ? '#register' : view === 'forgot' ? '#forgot' : view === 'reset' ? '#reset' : '';
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    authRender();
    document.querySelector('#auth-panel input')?.focus();
}
// The server checks the password (stored only as a hash), logs the attempt and starts the session.
async function authSignIn(form) {
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
    error.hidden = true;
    const r = await dashApi('login', { email, password });
    if (r.ok) {
        location.href = authDestination(String(r.data.role));
        return;
    }
    const fields = dashFieldErrors(r.data.errors);
    if (Object.keys(fields).length)
        dashShowErrors(form, fields);
    else {
        error.hidden = false;
        error.textContent = dashMessage(r);
    }
}
async function authForgotPassword(form) {
    const email = String(new FormData(form).get('email') ?? '').trim();
    if (!authEmailPattern.test(email)) {
        dashShowErrors(form, { email: 'Enter your email address.' });
        return;
    }
    const submit = form.querySelector('button[type="submit"]');
    const error = document.getElementById('forgot-error');
    submit.disabled = true;
    error.hidden = true;
    const r = await dashApi('password/forgot', { email });
    submit.disabled = false;
    if (!r.ok) {
        error.hidden = false;
        error.textContent = dashMessage(r);
        return;
    }
    authForgotEmail = email;
    authForgotSent = true;
    authRender();
}
async function authResetPassword(form) {
    const data = new FormData(form), password = String(data.get('password') ?? ''), confirm = String(data.get('password_confirmation') ?? '');
    const errors = {};
    if (password.length < 8)
        errors.password = 'Use at least 8 characters.';
    if (!confirm)
        errors.password_confirmation = 'Enter your password again.';
    else if (confirm !== password)
        errors.password_confirmation = 'The passwords do not match.';
    if (!dashShowErrors(form, errors))
        return;
    const submit = form.querySelector('button[type="submit"]');
    const error = document.getElementById('reset-error');
    submit.disabled = true;
    error.hidden = true;
    const r = await dashApi('password/reset', { email: authResetEmail, token: authResetToken, password, password_confirmation: confirm });
    submit.disabled = false;
    if (!r.ok) {
        const fields = dashFieldErrors(r.data.errors);
        if (Object.keys(fields).length)
            dashShowErrors(form, fields);
        else {
            error.hidden = false;
            error.textContent = dashMessage(r);
        }
        return;
    }
    location.href = location.pathname + '?notice=password-reset';
}
// The file inputs of the document slots.
function authDocumentInputs(form) { return Array.from(form.querySelectorAll('.doc-upload input[type=file]')); }
// Shows the chosen file in its slot, or turns it away (wrong kind of file, too big) with a message under the list.
function authDocumentChosen(input) {
    const slot = input.closest('.doc-upload');
    const file = input.files?.[0];
    if (file && (!authDocumentTypes.includes(file.type) || file.size > authDocumentMaxBytes || file.size === 0)) {
        input.value = '';
        dashShowErrors(input.form, { documents: 'Choose a PDF, JPG, PNG or WebP file of up to 5 MB.' });
    }
    const kept = input.files?.[0];
    slot.classList.toggle('is-attached', !!kept);
    slot.querySelector('[data-doc-file]').textContent = kept ? kept.name + ' · ' + authFileSize(kept.size) : authDocumentHint;
    slot.querySelector('[data-doc-action]').textContent = kept ? 'Replace' : 'Attach';
    slot.querySelector('[data-doc-remove]').hidden = !kept;
}
async function authRegister(form) {
    const data = new FormData(form);
    const value = (name) => String(data.get(name) ?? '').trim();
    const organization = value('type') === 'organization';
    const barangayChoice = value('barangayChoice');
    const barangay = barangayChoice === '__other__' ? value('barangayOther').replace(/\s+/g, ' ') : barangayChoice;
    const password = String(data.get('password') ?? ''), confirm = String(data.get('password_confirmation') ?? '');
    const files = organization ? authDocumentInputs(form).filter(input => input.files?.length) : [];
    const errors = {};
    if (value('name').length < 3)
        errors.name = 'Enter your full name.';
    if (!authEmailPattern.test(value('email')))
        errors.email = 'Enter an email address like name@example.com.';
    if (!dashPhonePattern.test(value('phone')))
        errors.phone = 'Enter a mobile number like 0917 555 0148.';
    if (password.length < 8)
        errors.password = 'Use at least 8 characters.';
    if (!confirm)
        errors.password_confirmation = 'Enter your password again.';
    else if (confirm !== password)
        errors.password_confirmation = 'The passwords don’t match.';
    if (organization) {
        if (value('orgName').length < 3)
            errors.orgName = 'Enter your organization’s name.';
        if (barangayChoice === '__other__') {
            if (barangay.length < 2)
                errors.barangayOther = 'Enter your barangay name.';
            else if (dashBarangays.some(name => name.toLocaleLowerCase() === barangay.toLocaleLowerCase()))
                errors.barangayOther = 'This barangay is already listed. Choose it from the list.';
        }
        else if (!dashBarangays.includes(barangayChoice))
            errors.barangayChoice = 'Choose your barangay.';
        if (value('crops').length < 3)
            errors.crops = 'Enter your main crops.';
        if (!files.length)
            errors.documents = 'Attach at least one document.';
    }
    const error = document.getElementById('register-error');
    error.hidden = true;
    // The documents list has no single field to mark, so its first slot gets the focus when it's the only problem.
    if (!dashShowErrors(form, errors) || errors.documents) {
        if (errors.documents && Object.keys(errors).length === 1)
            authDocumentInputs(form)[0]?.focus();
        return;
    }
    const body = new FormData();
    (organization ? ['type', 'name', 'email', 'phone', 'orgName', 'crops'] : ['type', 'name', 'email', 'phone']).forEach(name => body.append(name, value(name)));
    if (organization)
        body.append('barangay', barangay);
    body.append('password', password);
    body.append('password_confirmation', confirm);
    files.forEach(input => body.append(input.name, input.files[0]));
    const submit = document.getElementById('register-submit');
    submit.disabled = true;
    // The server checks everything again; whatever it turns down gets one generic message (AuthController::register).
    const r = await dashApi('register', body);
    submit.disabled = false;
    if (!r.ok) {
        error.hidden = false;
        error.textContent = dashMessage(r);
        return;
    }
    if (!organization) {
        const next = authDestination('Consumer');
        location.href = next === 'consumer.html' ? 'consumer.html#shop' : next;
        return;
    }
    authSubmitted = { organization: String(r.data.organization), email: String(r.data.email), requestedBarangay: barangayChoice === '__other__' };
    authView = 'submitted';
    authRender();
    window.scrollTo(0, 0);
}
document.addEventListener('click', event => {
    const el = event.target.closest('button');
    if (!el)
        return;
    if (el.dataset.authView) {
        const next = el.dataset.authView;
        if (!['signin', 'register', 'forgot', 'reset'].includes(next))
            return;
        if (next === 'forgot') {
            const email = document.querySelector('#signin-form [name="email"]');
            authForgotEmail = email?.value.trim() || '';
            authForgotSent = false;
        }
        authSetView(next);
        return;
    }
    if (el.dataset.docRemove) {
        const input = el.closest('.doc-upload').querySelector('input[type=file]');
        input.value = '';
        authDocumentChosen(input);
        input.focus();
        return;
    }
    if (el.hasAttribute('data-auth-sign-out'))
        void dashApi('logout', {}).then(() => dashFetchState()).then(() => authRender());
});
document.addEventListener('input', event => {
    const input = event.target;
    if (input.type === 'tel')
        dashLimitPhone(input);
    dashClearFieldError(input);
    if (input.name === 'type') {
        const organization = input.value === 'organization';
        document.querySelector('.org-fields').hidden = !organization;
        document.getElementById('register-submit').textContent = organization ? 'Submit application' : 'Create account';
    }
});
document.addEventListener('change', event => {
    const input = event.target;
    if (input.name === 'barangayChoice') {
        const other = document.getElementById('barangay-other-wrap');
        const show = input.value === '__other__';
        if (other)
            other.hidden = !show;
        const field = document.getElementById('field-barangayOther');
        if (field) {
            field.required = show;
            if (show)
                field.focus();
        }
    }
    if (input.type === 'file' && input.closest('.doc-upload')) {
        const slot = input.form?.querySelector('[data-error-for="documents"]');
        if (slot)
            slot.textContent = '';
        authDocumentChosen(input);
    }
});
document.addEventListener('submit', event => {
    const form = event.target;
    event.preventDefault();
    if (form.id === 'signin-form')
        void authSignIn(form);
    else if (form.id === 'register-form')
        void authRegister(form);
    else if (form.id === 'forgot-form')
        void authForgotPassword(form);
    else if (form.id === 'reset-form')
        void authResetPassword(form);
});
window.addEventListener('hashchange', () => { authView = location.hash === '#register' ? 'register' : location.hash === '#forgot' ? 'forgot' : location.hash === '#reset' && authResetToken ? 'reset' : 'signin'; authRender(); });
// Asking the server who is signed in also gives the page its anti-forgery cookie for signing in.
void dashFetchState().then(() => authRender());
