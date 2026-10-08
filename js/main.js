import { initGlobe } from './globe.js';
import { REGIONS } from './world.js';
import { clamp, damp, prefersReducedMotion } from './gl.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = prefersReducedMotion();
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ------------------------------------------------------------------ content */

const SERVICES = [
  { title: 'Business Strategy', summary: 'Market positioning, strategic planning and growth.',
    points: ['Market and competitive positioning', 'Strategic and business planning', 'Growth priorities and roadmaps'] },
  { title: 'Market Entry', summary: 'Helping businesses establish and expand in the UAE and international markets.',
    points: ['Market assessment and route to entry', 'Set-up and structuring considerations', 'Local partnerships and go-to-market'] },
  { title: 'Corporate & Commercial Advisory', short: 'Corporate Advisory', summary: 'Business structuring, commercial strategy and advisory support.',
    points: ['Business structuring', 'Commercial strategy and arrangements', 'Ongoing advisory support for leadership'] },
  { title: 'Franchising', summary: 'Franchise strategy, development and expansion.',
    points: ['Franchise readiness and model design', 'Franchise development and partner criteria', 'Regional and international expansion'] },
  { title: 'F&B & Hospitality', short: 'F&B · Hospitality', summary: 'Strategic support for hospitality, food and beverage ventures.',
    points: ['Concept positioning and strategy', 'Commercial and operational planning', 'Growth and multi-site expansion'] },
  { title: 'Trading & Investment', short: 'Trading · Investment', summary: 'Business opportunities, partnerships and commercial development.',
    points: ['Opportunity identification and assessment', 'Partnerships and introductions', 'Commercial development'] },
];

// Pillar placement on the plan (x, y in px from centre), footprint and height — deliberately unequal.
const PILLARS = [
  { x: -6, y: -228, w: 70, h: 150 },
  { x: 205, y: -110, w: 58, h: 108 },
  { x: 215, y: 120, w: 66, h: 128 },
  { x: 10, y: 236, w: 54, h: 84 },
  { x: -205, y: 125, w: 62, h: 116 },
  { x: -222, y: -112, w: 56, h: 96 },
];

const INDUSTRIES = [
  { name: 'F&B & Hospitality', text: 'Concepts, operators and brands — from positioning to regional expansion.' },
  { name: 'Trading', text: 'Commercial strategy, partnerships and market access for trading businesses.' },
  { name: 'Education', text: 'Bringing structure, planning and market insight to education ventures.' },
  { name: 'Real Estate', text: 'A commercial perspective on real estate ventures and opportunities.' },
  { name: 'Retail', text: 'Positioning, market entry and expansion for retail concepts.' },
  { name: 'Luxury & Fashion', text: 'Discreet, brand-conscious advice for luxury and fashion businesses.' },
  { name: 'Professional Services', text: 'Growth, structuring and positioning for service-led firms.' },
  { name: 'Technology', text: 'Helping technology businesses establish and scale in the region.' },
  { name: 'Investment', text: 'Evaluating opportunities and building the partnerships to realise them.' },
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
const ecoPlane = $('[data-eco-plane]');
const ecoLinks = $('[data-eco-links]');
const ecoTabs = $$('[data-service]');
const ecoDetail = $('[data-eco-detail]');
let ecoIndex = 0, ecoTouched = false;

const pillarEls = PILLARS.map((p, i) => {
  const el = document.createElement('div');
  el.className = 'pillar';
  el.style.cssText = `left:${310 + p.x}px;top:${310 + p.y}px;--w:${p.w}px;--h:${p.h}px`;
  el.innerHTML = `<div class="pillar__shadow"></div><div class="pillar__body">
    <div class="pillar__face f-n"></div><div class="pillar__face f-w"></div><div class="pillar__face f-e"></div><div class="pillar__face f-s"></div>
    <div class="pillar__top"></div></div><div class="pillar__label"><span>${SERVICES[i].short || SERVICES[i].title}</span></div>`;
  el.addEventListener('pointerenter', () => { ecoTouched = true; setService(i); });
  el.addEventListener('click', () => { ecoTouched = true; setService(i); });
  ecoPlane.appendChild(el);
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', 0); line.setAttribute('y1', 0);
  line.setAttribute('x2', p.x * 500 / 310); line.setAttribute('y2', p.y * 500 / 310);
  ecoLinks.appendChild(line);
  return { el, line };
});
// outer ring of faint connections between neighbouring disciplines
PILLARS.forEach((p, i) => {
  const q = PILLARS[(i + 1) % PILLARS.length];
  const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  l.setAttribute('x1', p.x * 500 / 310); l.setAttribute('y1', p.y * 500 / 310);
  l.setAttribute('x2', q.x * 500 / 310); l.setAttribute('y2', q.y * 500 / 310);
  l.style.opacity = '.14';
  ecoLinks.appendChild(l);
});

function setService(i) {
  if (i === ecoIndex && ecoDetail.dataset.init) return;
  ecoDetail.dataset.init = '1';
  ecoIndex = i;
  ecoTabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
  pillarEls.forEach((p, k) => { p.el.classList.toggle('is-active', k === i); p.line.classList.toggle('is-active', k === i); });
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

// tilt with the cursor
const eco = { rx: 58, rz: -28, trx: 58, trz: -28 };
$('.expertise').addEventListener('pointermove', (e) => {
  if (!finePointer || reduced) return;
  const r = ecoStage.getBoundingClientRect();
  const nx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1.5, 1.5);
  const ny = clamp((e.clientY - r.top) / r.height * 2 - 1, -1.5, 1.5);
  eco.trz = -28 + nx * 10; eco.trx = 58 - ny * 6;
});
function fitEco() {
  const s = Math.min(1, ecoStage.clientWidth / 700);
  ecoPlane.style.setProperty('--eco-scale', s.toFixed(3));
}
fitEco();
window.addEventListener('resize', fitEco);

/* ------------------------------------------------------------------ industries orbit */

const orbit = $('[data-orbit]');
const orbitNodesEl = $('[data-orbit-nodes]');
const orbitSvg = $('[data-orbit-lines]');
const orbitInfo = $('.orbit__info');
const svgNS = 'http://www.w3.org/2000/svg';
const ring = document.createElementNS(svgNS, 'ellipse'); ring.setAttribute('class', 'ring');
const ring2 = document.createElementNS(svgNS, 'ellipse'); ring2.setAttribute('class', 'ring'); ring2.style.opacity = '.45';
orbitSvg.append(ring, ring2);
let orbitActive = -1, orbitHover = false;
const orbitNodes = INDUSTRIES.map((ind, i) => {
  const li = document.createElement('li');
  li.className = 'orbit__node';
  li.innerHTML = `<button type="button" aria-pressed="false"><span class="dot"></span><span class="txt">${ind.name}</span></button>`;
  const btn = li.firstElementChild;
  btn.addEventListener('pointerenter', () => { if (finePointer) setIndustry(i); orbitHover = true; });
  btn.addEventListener('pointerleave', () => { orbitHover = false; });
  btn.addEventListener('focus', () => setIndustry(i));
  btn.addEventListener('click', () => setIndustry(i));
  orbitNodesEl.appendChild(li);
  const spoke = document.createElementNS(svgNS, 'line'); spoke.setAttribute('class', 'spoke');
  orbitSvg.append(spoke);
  return { li, btn, spoke, x: 0, y: 0 };
});
function setIndustry(i) {
  if (i === orbitActive) return;
  orbitActive = i;
  orbitNodes.forEach((n, k) => { n.li.classList.toggle('is-active', k === i); n.btn.setAttribute('aria-pressed', String(k === i)); });
  orbitInfo.classList.add('is-swapping');
  setTimeout(() => {
    $('[data-orbit-kicker]').textContent = `Industry ${String(i + 1).padStart(2, '0')} / 09`;
    $('[data-orbit-title]').textContent = INDUSTRIES[i].name;
    $('[data-orbit-text]').textContent = INDUSTRIES[i].text;
    orbitInfo.classList.remove('is-swapping');
  }, reduced ? 0 : 200);
}

let orbitAngle = -Math.PI / 2, orbitOn = false;
new IntersectionObserver(([e]) => { orbitOn = e.isIntersecting; }, { rootMargin: '100px' }).observe(orbit);
function layoutOrbit(dt) {
  const w = orbit.clientWidth, h = orbit.clientHeight, cx = w / 2, cy = h / 2;
  const small = w < 700;
  const rx = small ? w * 0.36 : Math.min(w * 0.33, 470), ry = small ? h * 0.4 : h * 0.38;
  if (!orbitHover && !reduced) orbitAngle += dt * 0.035;
  ring.setAttribute('cx', cx); ring.setAttribute('cy', cy); ring.setAttribute('rx', rx); ring.setAttribute('ry', ry);
  ring2.setAttribute('cx', cx); ring2.setAttribute('cy', cy); ring2.setAttribute('rx', rx * 0.62); ring2.setAttribute('ry', ry * 0.62);
  orbitNodes.forEach((n, i) => {
    const a = orbitAngle + (i / orbitNodes.length) * Math.PI * 2;
    const depth = (Math.sin(a) + 1) / 2; // 0 back, 1 front
    n.x = cx + Math.cos(a) * rx; n.y = cy + Math.sin(a) * ry;
    const s = 0.82 + depth * 0.26;
    n.li.style.transform = `translate3d(${n.x.toFixed(1)}px, ${n.y.toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
    n.li.style.opacity = (0.55 + depth * 0.45).toFixed(2);
    n.li.style.zIndex = String(Math.round(depth * 10));
    n.li.classList.toggle('is-left', n.x < cx);
    const k = 0.42;
    n.spoke.setAttribute('x1', cx + (n.x - cx) * k); n.spoke.setAttribute('y1', cy + (n.y - cy) * k);
    n.spoke.setAttribute('x2', n.x); n.spoke.setAttribute('y2', n.y);
    n.spoke.style.opacity = i === orbitActive ? '0.95' : (0.12 + depth * 0.25).toFixed(2);
  });
}

/* ------------------------------------------------------------------ global reach */

const regionList = $('[data-regions]');
REGIONS.forEach((r, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<button data-region="${i}" aria-pressed="false"><span>${r.name}</span><small>${r.cities.map((c) => c.name).join(' · ')}</small></button>`;
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

/* ------------------------------------------------------------------ cases (horizontal) */

const cases = $('[data-cases]');
const track = $('[data-cases-track]');
const caseEls = $$('.case', track);
const caseVisuals = $$('[data-case-visual] svg', track);
cases.style.setProperty('--panels', caseEls.length);
$('[data-cases-total]').textContent = String(caseEls.length).padStart(2, '0');
const casesBar = $('[data-cases-bar]');
const casesCurrent = $('[data-cases-current]');
function updateCases() {
  const r = cases.getBoundingClientRect(), vh = window.innerHeight, vw = window.innerWidth;
  if (r.bottom < 0 || r.top > vh) return;
  const p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
  const dist = Math.max(0, track.scrollWidth - vw);
  track.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
  casesBar.style.width = `${(p * 100).toFixed(2)}%`;
  let best = 0, bestD = Infinity;
  caseEls.forEach((el, i) => {
    const b = el.getBoundingClientRect();
    const off = (b.left + b.width / 2 - vw / 2) / vw;
    const d = Math.abs(off);
    if (d < bestD) { bestD = d; best = i; }
    if (!reduced) {
      el.style.transform = `scale(${(1 - Math.min(d, 1) * 0.07).toFixed(4)})`;
      caseVisuals[i].style.setProperty('--px', `${(off * -60).toFixed(1)}px`);
      caseVisuals[i].style.setProperty('--ps', (1 + Math.min(d, 1) * 0.12).toFixed(3));
    }
  });
  casesCurrent.textContent = String(best + 1).padStart(2, '0');
}

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
  updateCases();
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
  if (orbitOn) layoutOrbit(dt);
  if (!reduced && window.scrollY < window.innerHeight * 1.2) {
    heroCam.x = damp(heroCam.x, heroCam.tx, 2.5, dt);
    heroCam.y = damp(heroCam.y, heroCam.ty, 2.5, dt);
    const s = window.scrollY / window.innerHeight;
    heroMedia.style.transform = `translate3d(${heroCam.x.toFixed(2)}px, ${(heroCam.y + s * 120).toFixed(2)}px, 0) scale(${(1.08 + s * 0.06).toFixed(4)})`;
  }
  eco.rx = damp(eco.rx, eco.trx, 3, dt);
  eco.rz = damp(eco.rz, eco.trz, 3, dt);
  ecoStage.style.setProperty('--rx', `${eco.rx.toFixed(2)}deg`);
  ecoStage.style.setProperty('--rz', `${eco.rz.toFixed(2)}deg`);
  requestAnimationFrame(frame);
}
layoutOrbit(0);
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
    status.classList.add('is-error');
    status.textContent = 'Online enquiries are not yet connected. Please try again shortly.';
    console.warn('Contact form: set data-endpoint on the form to receive submissions.');
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
