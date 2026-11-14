import { initGlobe } from './globe.js';
import { initChess } from './chess.js';
import { initWheel } from './wheel.js';
import { REGIONS } from './world.js';
import { clamp, damp, prefersReducedMotion } from './gl.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = prefersReducedMotion();
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ------------------------------------------------------------------ content */

const SERVICES = [
  { title: 'Franchise Development & Expansion', short: 'Franchising', summary: 'Franchise creation, documentation, brand adaptation and international rollout support.',
    points: ['Franchise creation and documentation', 'Brand adaptation for new markets', 'International rollout support'] },
  { title: 'Business Setup', summary: 'End-to-end company formation support, including licensing, documentation, compliance and strategic launch.',
    points: ['Company formation and licensing', 'Documentation and compliance', 'Strategic launch'] },
  { title: 'Operational Optimisation', short: 'Operations', summary: 'Streamline business systems, SOPs and team training for improved efficiency and scalability.',
    points: ['Business systems and SOPs', 'Team training', 'Efficiency and scalability'] },
  { title: 'Brand Strategy & Expansion', short: 'Brand Strategy', summary: 'Build a brand that speaks and sells — identity design, market positioning, storytelling and digital presence.',
    points: ['Identity design', 'Market positioning and storytelling', 'Digital presence'] },
  { title: 'Startup Consulting', short: 'Startups', summary: 'Without the right planning, even the best products and services won\u2019t conquer the market. Establish your venture the right way with our startup consulting services.',
    points: ['Planning before launch', 'Positioning for the market', 'Setting the venture up the right way'] },
];

// Each service is a chess piece: file c (a–h → 0–7), row r from the far side, height in world units.
const PIECES = [
  { type: 'queen', c: 4, r: 4, h: 1.38 },  // Franchise Development — the widest reach
  { type: 'king', c: 2, r: 5, h: 1.56 },   // Business Setup — the piece everything is built around
  { type: 'rook', c: 6, r: 2, h: 1.02 },   // Operational Optimisation — structure
  { type: 'bishop', c: 1, r: 2, h: 1.2 },  // Brand Strategy — reaches across the board
  { type: 'pawn', c: 5, r: 6, h: 0.87 },   // Startup Consulting — small steps that grow
];

const INDUSTRIES = [
  { name: 'F&B & Hospitality', text: 'Concepts, operators and brands — from positioning to regional expansion.' },
  { name: 'Trading', text: 'Commercial strategy, partnerships and market access for trading businesses.' },
  { name: 'Real Estate', text: 'A commercial perspective on real estate ventures and opportunities.' },
  { name: 'Retail', text: 'Positioning, market entry and expansion for retail concepts.' },
  { name: 'Luxury & Fashion', text: 'Discreet, brand-conscious advice for luxury and fashion businesses.' },
  { name: 'Professional Services', text: 'Growth, structuring and positioning for service-led firms.' },
  { name: 'Technology', text: 'Helping technology businesses establish and scale in the region.' },
  { name: 'Investment', text: 'Evaluating opportunities and building the partnerships to realise them.' },
  { name: 'Healthcare', text: 'Strategic support for healthcare providers, innovation and investment.' },
];

/* ------------------------------------------------------------------ intro + hero */

const heroEl = $('.hero');
const heroMedia = $('.hero__media');
const heroVideo = $('.hero__video');
if (reduced) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
// pause the video while the hero is off screen
new IntersectionObserver(([e]) => {
  if (reduced) return;
  if (e.isIntersecting) heroVideo.play().catch(() => {}); else heroVideo.pause();
}).observe(heroEl);
// subtle depth: the footage drifts against the cursor and eases back as you scroll
const heroCam = { x: 0, y: 0, tx: 0, ty: 0 };
heroEl.addEventListener('pointermove', (e) => {
  const r = heroEl.getBoundingClientRect();
  heroCam.tx = ((e.clientX - r.left) / r.width - 0.5) * -18;
  heroCam.ty = ((e.clientY - r.top) / r.height - 0.5) * -12;
});
heroEl.addEventListener('pointerleave', () => { heroCam.tx = 0; heroCam.ty = 0; });

function ready() {
  document.body.classList.remove('is-loading');
  document.body.classList.add('is-ready');
}
const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
if (reduced) ready();
else fontsReady.then(() => setTimeout(ready, 1150));

/* ------------------------------------------------------------------ navigation */

const nav = $('[data-nav]');
const toggle = $('[data-menu-toggle]');
const mobile = $('#mobile-menu');
const setMenu = (open) => {
  toggle.setAttribute('aria-expanded', String(open));
  mobile.hidden = !open;
  nav.classList.toggle('is-open', open);
};
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
$$('a', mobile).forEach((a) => a.addEventListener('click', () => setMenu(false)));

const navLinks = $$('.nav__links a');
const sectionsForNav = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sectionsForNav.forEach((s) => navObserver.observe(s));

/* ------------------------------------------------------------------ reveals */

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 4) * 0.09}s`;
    el.classList.add('is-in');
    revealObserver.unobserve(el);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
$$('[data-reveal]').forEach((el) => revealObserver.observe(el));

const chapters = $('.chapters');
new IntersectionObserver(([e]) => { if (e.isIntersecting) chapters.style.setProperty('--progress', '100%'); }, { threshold: 0.4 }).observe(chapters);

/* ------------------------------------------------------------------ expertise ecosystem */

const ecoStage = $('[data-eco-stage]');
const ecoTabs = $$('[data-service]');
const ecoDetail = $('[data-eco-detail]');
let ecoIndex = 0, ecoTouched = false;

const occupied = new Set(PIECES.map((p) => p.c + ',' + p.r));
function legalMoves({ type, c, r }) {
  const out = [], on = (x, y) => x >= 0 && x < 8 && y >= 0 && y < 8;
  const ray = (dx, dy, max = 8) => {
    for (let k = 1, x = c + dx, y = r + dy; k <= max && on(x, y) && !occupied.has(x + ',' + y); k++, x += dx, y += dy) out.push([x, y]);
  };
  const orth = [[1, 0], [-1, 0], [0, 1], [0, -1]], diag = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  if (type === 'rook') orth.forEach(([x, y]) => ray(x, y));
  if (type === 'bishop') diag.forEach(([x, y]) => ray(x, y));
  if (type === 'queen') [...orth, ...diag].forEach(([x, y]) => ray(x, y));
  if (type === 'king') [...orth, ...diag].forEach(([x, y]) => ray(x, y, 1));
  if (type === 'pawn') ray(0, -1, 2);
  if (type === 'knight') [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]
    .forEach(([x, y]) => { if (on(c + x, r + y) && !occupied.has(c + x + ',' + (r + y))) out.push([c + x, r + y]); });
  return out;
}

const chess = initChess($('[data-chess]'), {
  pieces: PIECES,
  labels: SERVICES.map((s) => s.short || s.title),
  labelEl: $('[data-chess-label]'),
  onPick(i) { ecoTouched = true; setService(i); },
});
if (!chess) ecoStage.hidden = true;

function setService(i) {
  if (i === ecoIndex && ecoDetail.dataset.init) return;
  ecoDetail.dataset.init = '1';
  ecoIndex = i;
  ecoTabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
  if (chess) chess.select(i, legalMoves(PIECES[i]));
  const s = SERVICES[i];
  ecoDetail.classList.add('is-swapping');
  setTimeout(() => {
    $('[data-eco-title]').textContent = s.title;
    $('[data-eco-summary]').textContent = s.summary;
    $('[data-eco-points]').innerHTML = s.points.map((t) => `<li>${t}</li>`).join('');
    ecoDetail.classList.remove('is-swapping');
  }, reduced ? 0 : 220);
}
ecoTabs.forEach((t, i) => {
  t.addEventListener('click', () => { ecoTouched = true; setService(i); });
  t.addEventListener('pointerenter', () => { if (finePointer) { ecoTouched = true; setService(i); } });
  t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const n = (i + (e.key === 'ArrowDown' ? 1 : -1) + ecoTabs.length) % ecoTabs.length;
    ecoTabs[n].focus(); ecoTouched = true; setService(n);
  });
});
setService(0);

// gentle auto-advance until the visitor engages
let ecoVisible = false;
new IntersectionObserver(([e]) => { ecoVisible = e.isIntersecting; }, { threshold: 0.4 }).observe(ecoStage);
if (!reduced) setInterval(() => { if (ecoVisible && !ecoTouched) setService((ecoIndex + 1) % SERVICES.length); }, 5200);

/* ------------------------------------------------------------------ industries dial-wheel */

const indList = $('[data-ind-list]');
const indDetail = $('[data-ind-detail]');
let indIndex = -1, indTouched = false;
const indButtons = INDUSTRIES.map((ind, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<button type="button" aria-pressed="false"><span>${String(i + 1).padStart(2, '0')}</span>${ind.name}</button>`;
  const b = li.firstElementChild;
  b.addEventListener('click', () => { indTouched = true; setIndustry(i); });
  b.addEventListener('pointerenter', () => { if (finePointer) { indTouched = true; setIndustry(i); } });
  b.addEventListener('focus', () => setIndustry(i));
  indList.appendChild(li);
  return b;
});
const wheel = initWheel($('[data-wheel]'), {
  names: INDUSTRIES.map((d) => d.name),
  onPick(i) { indTouched = true; setIndustry(i); },
});
if (!wheel) $('.wheel__stage').hidden = true;
function setIndustry(i) {
  if (i === indIndex) return;
  indIndex = i;
  indButtons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  if (wheel) wheel.select(i);
  indDetail.classList.add('is-swapping');
  setTimeout(() => {
    $('[data-ind-kicker]').textContent = `Industry ${String(i + 1).padStart(2, '0')} / 09`;
    $('[data-ind-title]').textContent = INDUSTRIES[i].name;
    $('[data-ind-text]').textContent = INDUSTRIES[i].text;
    indDetail.classList.remove('is-swapping');
  }, reduced ? 0 : 200);
}
setIndustry(0);
let indVisible = false;
new IntersectionObserver(([e]) => { indVisible = e.isIntersecting; }, { threshold: 0.4 }).observe($('.wheel'));
if (!reduced) setInterval(() => { if (indVisible && !indTouched) setIndustry((indIndex + 1) % INDUSTRIES.length); }, 4200);

/* ------------------------------------------------------------------ global reach */

const regionList = $('[data-regions]');
REGIONS.forEach((r, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<button data-region="${i}" aria-pressed="false"><span>${r.name}</span></button>`;
  regionList.appendChild(li);
});
const regionText = $('[data-region-text]');
const hubText = regionText.textContent;
const globe = initGlobe($('.globe'), {
  labelsEl: $('[data-globe-labels]'),
  onRegion(i) {
    $$('button', regionList).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.region) === (i == null ? -1 : i))));
    regionText.style.opacity = 0;
    setTimeout(() => { regionText.textContent = i >= 0 ? REGIONS[i].text : hubText; regionText.style.opacity = 1; }, 200);
  },
});
if (!globe) $('.reach').classList.add('no-webgl');
$$('button', regionList).forEach((b) => {
  const i = Number(b.dataset.region);
  b.addEventListener('click', () => globe && globe.focus(i));
  b.addEventListener('pointerenter', () => { if (finePointer && globe) globe.focus(i); });
});

/* ------------------------------------------------------------------ why HK */

const principles = $$('[data-principle]');
function updateWhy() {
  const vh = window.innerHeight;
  let best = -1, bestD = Infinity;
  principles.forEach((el, i) => {
    const b = el.getBoundingClientRect();
    const off = (b.top + b.height / 2 - vh * 0.5) / vh;
    if (!reduced) el.querySelector('.principle__word').style.setProperty('--rx', `${clamp(off * 38, -30, 30).toFixed(2)}deg`);
    const d = Math.abs(off);
    if (d < bestD && d < 0.42) { bestD = d; best = i; }
  });
  principles.forEach((el, i) => { if (i <= best) el.classList.add('is-active'); else el.classList.remove('is-active'); });
}

/* ------------------------------------------------------------------ parallax depth */

const depthEls = $$('[data-depth]');
function updateDepth() {
  const vh = window.innerHeight;
  depthEls.forEach((el) => {
    const host = el.parentElement.getBoundingClientRect();
    if (host.bottom < -200 || host.top > vh + 200) return;
    const off = host.top + host.height / 2 - vh / 2;
    el.style.transform = `translate3d(0, ${(off * parseFloat(el.dataset.depth)).toFixed(1)}px, 0)`;
  });
}

/* ------------------------------------------------------------------ scroll + frame loop */

let lastY = -1;
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 40);
  if (y === lastY) return;
  lastY = y;
  updateWhy();
  if (!reduced) updateDepth();
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => { lastY = -1; onScroll(); });
onScroll();

let prev = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - prev) / 1000);
  prev = now;
  if (!reduced && window.scrollY < window.innerHeight * 1.2) {
    heroCam.x = damp(heroCam.x, heroCam.tx, 2.5, dt);
    heroCam.y = damp(heroCam.y, heroCam.ty, 2.5, dt);
    const s = window.scrollY / window.innerHeight;
    heroMedia.style.transform = `translate3d(${heroCam.x.toFixed(2)}px, ${(heroCam.y + s * 120).toFixed(2)}px, 0) scale(${(1.08 + s * 0.06).toFixed(4)})`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ------------------------------------------------------------------ gold light trail */

(function trail() {
  if (reduced || !finePointer) return;
  const canvas = $('.trail');
  const ctx = canvas.getContext('2d');
  const pts = [];
  let raf = 0;
  const LIFE = 520;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);
  const draw = () => {
    raf = 0;
    const now = performance.now();
    while (pts.length && now - pts[0].t > LIFE) pts.shift();
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (pts.length > 1) {
      ctx.lineCap = 'round';
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const life = 1 - (now - b.t) / LIFE;
        const k = i / pts.length;
        ctx.strokeStyle = `rgba(231, 207, 152, ${(life * k * 0.85).toFixed(3)})`;
        ctx.lineWidth = 0.6 + k * life * 2.2;
        ctx.shadowColor = 'rgba(201, 164, 92, 0.9)';
        ctx.shadowBlur = 10 * life;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    if (pts.length) raf = requestAnimationFrame(draw);
  };
  $$('[data-trail]').forEach((sec) => sec.addEventListener('pointermove', (e) => {
    if (e.target.closest('input, textarea, select, button, a')) return;
    pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (pts.length > 40) pts.shift();
    if (!raf) raf = requestAnimationFrame(draw);
  }));
})();

/* ------------------------------------------------------------------ insights filter */

const filterBtns = $$('[data-filter]');
const stories = $$('[data-insights] .story');
filterBtns.forEach((btn) => btn.addEventListener('click', () => {
  const f = btn.dataset.filter;
  filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  stories.forEach((s) => s.classList.toggle('is-hidden', f !== 'all' && s.dataset.cat !== f));
}));

/* ------------------------------------------------------------------ contact form */

const form = $('[data-contact-form]');
const status = $('[data-form-status]');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  let ok = true;
  $$('input, select, textarea', form).forEach((f) => {
    const valid = f.checkValidity();
    f.closest('.field').classList.toggle('is-invalid', !valid);
    if (!valid) ok = false;
  });
  status.classList.remove('is-error');
  if (!ok) {
    status.classList.add('is-error');
    status.textContent = 'Please complete the highlighted fields.';
    $('.is-invalid input, .is-invalid select, .is-invalid textarea', form)?.focus();
    return;
  }
  const endpoint = form.dataset.endpoint;
  if (!endpoint) {
    const d = Object.fromEntries(new FormData(form));
    const body = `Name: ${d.name}\nCompany: ${d.company || '-'}\nEmail: ${d.email}\nPhone: ${d.phone || '-'}\nArea of interest: ${d.interest}\n\n${d.message}`;
    window.location.href = `mailto:info@honestandkeen.com?subject=${encodeURIComponent('Enquiry: ' + d.interest)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Your email app is opening with your message — just press send.';
    return;
  }
  const btn = $('button[type="submit"]', form);
  btn.disabled = true;
  status.textContent = 'Sending…';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    if (!res.ok) throw new Error(res.statusText);
    form.reset();
    status.textContent = 'Thank you. A member of the HK team will be in touch.';
  } catch {
    status.classList.add('is-error');
    status.textContent = 'Something went wrong sending your message. Please try again.';
  } finally {
    btn.disabled = false;
  }
});
$$('input, select, textarea', form).forEach((f) => f.addEventListener('input', () => f.closest('.field').classList.remove('is-invalid')));

$('[data-year]').textContent = new Date().getFullYear();
