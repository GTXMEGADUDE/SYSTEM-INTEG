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
let dashSessionMe = '';
// Set when the server signed this person out because the account is no longer active ("suspended", "terminated").
let dashBlockedStatus = '';
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
function getElement(id) { const element = document.getElementById(id); if (!element)
    throw new Error('Missing homepage element: ' + id); return element; }
function icon(name) { return '<svg class="icon" aria-hidden="true"><use href="#' + name + '"/></svg>'; }
const video = getElement('hero-film');
const playbackButton = getElement('toggle-video');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied)
        return;
    image.dataset.fallbackApplied = 'true';
    const avatar = image.closest('.header-avatar');
    if (avatar) {
        const initials = avatar.title.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
        if (initials) {
            avatar.replaceChildren(document.createTextNode(initials));
            return;
        }
    }
    image.src = 'assets/field-detail.jpg';
}, true);
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
        if (window.matchMedia('(max-width: 900px)').matches) {
            for (const tile of tiles) {
                tile.style.opacity = '1';
                tile.style.transform = 'none';
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
async function setupAccountLinks() {
    await dashFetchState();
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
void setupAccountLinks();
