/* HK — "Building Possibilities" hero film
   A real-time, code-rendered brand film (no video download required):
   1. Gold architectural lines draw across royal blue and converge into the HK mark.
   2. A wireframe city — the avenue of a modern skyline — glides past, with
      gold connections forming between towers.
   3. The city dissolves into a turning globe, Dubai at its centre, corridors
      reaching out to the GCC, Europe, Asia, Africa and the Americas.
   If a produced brand film is supplied (src/assets/video/hk-brand-film.mp4)
   the video plays instead and this renderer stands down. */
(() => {
  'use strict';
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  const canvas = hero.querySelector('[data-film]');
  const intro = hero.querySelector('[data-intro]');
  const video = hero.querySelector('[data-video]');
  const toggle = hero.querySelector('[data-film-toggle]');
  const chapterEl = hero.querySelector('[data-chapter]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GOLD = [198, 164, 92];

  /* ---------------- intro choreography ---------------- */
  let introSeen = false;
  try { introSeen = sessionStorage.getItem('hk-intro') === '1'; } catch (e) { /* ignore */ }
  let introTimers = [];
  const ready = () => {
    introTimers.forEach(clearTimeout);
    intro.classList.add('is-done');
    hero.classList.add('is-ready');
    try { sessionStorage.setItem('hk-intro', '1'); } catch (e) { /* ignore */ }
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => window.removeEventListener(ev, ready));
  };
  if (reduce || introSeen) {
    intro.classList.add('is-done');
    requestAnimationFrame(() => hero.classList.add('is-ready'));
  } else {
    intro.classList.add('is-playing');
    introTimers.push(setTimeout(() => intro.classList.add('is-converging'), 1300));
    introTimers.push(setTimeout(ready, 3900));
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => window.addEventListener(ev, ready, { passive: true, once: true }));
  }

  /* ---------------- chapters caption ---------------- */
  const chapters = ['Kuwait · 2015', 'Across Borders · 2017', 'Dubai · 2021', 'UAE & International · Today'];
  let chapterIdx = 0, chapterTimer = null;
  const nextChapter = () => {
    chapterIdx = (chapterIdx + 1) % chapters.length;
    chapterEl.classList.add('is-swapping');
    setTimeout(() => { chapterEl.textContent = chapters[chapterIdx]; chapterEl.classList.remove('is-swapping'); }, 600);
  };

  /* ---------------- produced video (optional) ---------------- */
  let usingVideo = false;
  if (video && !reduce) {
    const mobileSrc = video.dataset.mobileSrc;
    if (mobileSrc && window.matchMedia('(max-width: 700px)').matches) video.src = mobileSrc;
    video.addEventListener('playing', () => { usingVideo = true; video.classList.add('is-playing'); hero.classList.add('has-film'); stop(); canvas.classList.remove('is-running'); }, { once: true });
    video.play().catch(() => { /* autoplay blocked: canvas film continues */ });
  }

  /* ---------------- canvas film ---------------- */
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, mobile = false;
  let towers = [], arcsCity = [], sphere = [];
  const rand = (() => { let s = 20210521; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9 | 0) >>> 0) / 4294967296; })();

  const D = 260;            // city depth (world units)
  const LANE = 6.5;         // half-width of the central avenue
  const SPEED = 7;          // units per second

  function buildCity() {
    towers = [];
    const cols = mobile ? 3 : 5;
    for (const side of [-1, 1]) {
      for (let c = 0; c < cols; c++) {
        for (let z = 0; z < D; z += 13 + rand() * 8) {
          const w = 4 + rand() * 4.5, d = 4 + rand() * 6;
          const x0 = side * (LANE + c * 11 + rand() * 3);
          const landmark = rand() > 0.93;
          const h = landmark ? 48 + rand() * 40 : 8 + rand() * (14 + c * 9);
          towers.push({ x0: side < 0 ? x0 - w : x0, x1: side < 0 ? x0 : x0 + w, z, d, h, side, spire: landmark && rand() > 0.4 });
        }
      }
    }
    arcsCity = [];
    for (let i = 0; i < (mobile ? 5 : 9); i++) arcsCity.push({ a: (rand() * towers.length) | 0, b: (rand() * towers.length) | 0, phase: rand() * 10 });
  }

  function buildSphere() {
    sphere = [];
    const N = mobile ? 420 : 760;
    const g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = g * i;
      sphere.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
  }
  const ll = (lat, lon) => { const p = (lat * Math.PI) / 180, l = (lon * Math.PI) / 180; return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)]; };
  const DUBAI = ll(25.2, 55.27);
  const CITIES = [[24.7, 46.7], [29.37, 47.98], [51.5, -0.13], [48.86, 2.35], [19.07, 72.88], [1.35, 103.8], [22.3, 114.17], [-1.29, 36.82], [6.52, 3.38], [40.71, -74.0], [31.2, 29.9], [41.0, 28.98]].map(([a, b]) => ll(a, b));

  function resize() {
    const r = hero.getBoundingClientRect();
    mobile = r.width < 700;
    dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!towers.length || towers.mobile !== mobile) { buildCity(); towers.mobile = mobile; buildSphere(); }
  }

  /* batched line drawing by alpha bucket */
  const BUCKETS = 8;
  let buckets = [];
  const resetBuckets = () => { buckets = Array.from({ length: BUCKETS }, () => []); };
  const pushLine = (a, x1, y1, x2, y2) => {
    if (a <= 0.01) return;
    const b = Math.min(BUCKETS - 1, (a * BUCKETS) | 0);
    buckets[b].push(x1, y1, x2, y2);
  };
  const flush = (master, width, color = GOLD) => {
    ctx.lineWidth = width;
    ctx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    for (let b = 0; b < BUCKETS; b++) {
      const L = buckets[b]; if (!L.length) continue;
      ctx.globalAlpha = ((b + 0.5) / BUCKETS) * master;
      ctx.beginPath();
      for (let i = 0; i < L.length; i += 4) { ctx.moveTo(L[i], L[i + 1]); ctx.lineTo(L[i + 2], L[i + 3]); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  function drawCity(t, weight) {
    if (weight <= 0.001) return;
    const f = Math.min(W, H * 1.3) * 0.95;
    const hz = H * 0.56;
    const camZ = t * SPEED;
    const camX = Math.sin(t * 0.12) * 2.2;
    const camY = 6 + Math.sin(t * 0.09) * 1.4;
    const cx = W * 0.5 + Math.sin(t * 0.07) * W * 0.02;
    const proj = (x, y, zr) => [cx + ((x - camX) / zr) * f, hz - ((y - camY) / zr) * f];
    const depthAlpha = (zr) => { if (zr < 2) return 0; const far = 1 - zr / D; const near = Math.min(1, (zr - 2) / 14); return Math.pow(Math.max(0, far), 1.3) * near; };

    // ground grid
    resetBuckets();
    for (let k = -6; k <= 6; k++) {
      const x = k * 11 + (k > 0 ? LANE - 5.5 : k < 0 ? -LANE + 5.5 : 0);
      const [x1, y1] = proj(x, 0, 3), [x2, y2] = proj(x, 0, D);
      pushLine(0.35, x1, y1, x2, y2);
    }
    const step = 18;
    for (let z = step - (camZ % step); z < D; z += step) {
      const [x1, y1] = proj(-70, 0, z), [x2, y2] = proj(70, 0, z);
      pushLine(depthAlpha(z) * 0.6, x1, y1, x2, y2);
    }
    flush(weight * 0.45, 1);

    // towers
    resetBuckets();
    const floors = [];
    const tops = new Map();
    for (let i = 0; i < towers.length; i++) {
      const T = towers[i];
      let zr = ((T.z - camZ) % D + D) % D;
      const a = depthAlpha(zr);
      if (a <= 0.01) continue;
      const z0 = zr, z1 = zr + T.d;
      const p = [
        proj(T.x0, 0, z0), proj(T.x1, 0, z0), proj(T.x0, T.h, z0), proj(T.x1, T.h, z0),
        proj(T.x0, 0, z1), proj(T.x1, 0, z1), proj(T.x0, T.h, z1), proj(T.x1, T.h, z1),
      ];
      // verticals
      pushLine(a, p[0][0], p[0][1], p[2][0], p[2][1]); pushLine(a, p[1][0], p[1][1], p[3][0], p[3][1]);
      pushLine(a * 0.6, p[4][0], p[4][1], p[6][0], p[6][1]); pushLine(a * 0.6, p[5][0], p[5][1], p[7][0], p[7][1]);
      // roof
      pushLine(a, p[2][0], p[2][1], p[3][0], p[3][1]); pushLine(a * 0.7, p[6][0], p[6][1], p[7][0], p[7][1]);
      pushLine(a * 0.8, p[2][0], p[2][1], p[6][0], p[6][1]); pushLine(a * 0.8, p[3][0], p[3][1], p[7][0], p[7][1]);
      // spire
      if (T.spire) { const mx = (T.x0 + T.x1) / 2; const s0 = proj(mx, T.h, z0 + T.d / 2), s1 = proj(mx, T.h + T.h * 0.45, z0 + T.d / 2); pushLine(a, s0[0], s0[1], s1[0], s1[1]); }
      // floor lines on the avenue-facing facade
      const fx = T.side < 0 ? T.x1 : T.x0;
      const fa = a * 0.32;
      if (fa > 0.02) for (let y = 3; y < T.h; y += 3) { const q0 = proj(fx, y, z0), q1 = proj(fx, y, z1); floors.push(fa, q0[0], q0[1], q1[0], q1[1]); }
      tops.set(i, { x: (p[2][0] + p[7][0]) / 2, y: (p[2][1] + p[7][1]) / 2, a });
    }
    flush(weight * 0.95, 1);
    resetBuckets();
    for (let i = 0; i < floors.length; i += 5) pushLine(floors[i], floors[i + 1], floors[i + 2], floors[i + 3], floors[i + 4]);
    flush(weight * 0.8, 0.7);

    // connections forming between towers
    ctx.lineWidth = 1.1;
    for (const c of arcsCity) {
      const A = tops.get(c.a), B = tops.get(c.b);
      if (!A || !B || c.a === c.b) continue;
      const cyc = ((t + c.phase) % 6) / 6; // 0..1 draw, hold, fade
      const prog = Math.min(1, cyc / 0.45);
      const fade = cyc > 0.75 ? 1 - (cyc - 0.75) / 0.25 : 1;
      const alpha = Math.min(A.a, B.a) * fade * weight;
      if (alpha < 0.02) continue;
      const mx = (A.x + B.x) / 2, my = Math.min(A.y, B.y) - Math.abs(A.x - B.x) * 0.35 - 30;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgb(220,194,138)';
      ctx.beginPath();
      const n = 24, m = Math.max(1, Math.round(n * prog));
      for (let k = 0; k <= m; k++) {
        const s = k / n, x = (1 - s) * (1 - s) * A.x + 2 * (1 - s) * s * mx + s * s * B.x, y = (1 - s) * (1 - s) * A.y + 2 * (1 - s) * s * my + s * s * B.y;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }

    // light pulses travelling along the avenue
    ctx.fillStyle = 'rgb(235,214,165)';
    for (let k = 0; k < 14; k++) {
      const lane = (k % 4) - 1.5;
      const zr = ((D - ((t * (SPEED * 2.4) + k * 37) % D)) + D) % D;
      const a = depthAlpha(zr);
      if (a < 0.02) continue;
      const [x, y] = proj(lane * 2.2, 0.05, zr);
      const [x2, y2] = proj(lane * 2.2, 0.05, zr + 6);
      ctx.globalAlpha = a * weight * 0.9;
      ctx.lineWidth = Math.max(0.6, 2.2 * (1 - zr / D));
      ctx.strokeStyle = 'rgb(235,214,165)';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawGlobe(t, weight) {
    if (weight <= 0.001) return;
    const R = Math.min(W, H) * (mobile ? 0.42 : 0.36) * (0.94 + weight * 0.06);
    const cx = mobile ? W * 0.5 : W * 0.66, cy = H * 0.46;
    const rotY = -0.95 + t * 0.09, tilt = -0.38;
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY), cosX = Math.cos(tilt), sinX = Math.sin(tilt);
    const rot = ([x, y, z]) => { const x1 = x * cosY + z * sinY, z1 = -x * sinY + z * cosY; const y1 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX; return [x1, y1, z2]; };
    const P = (v) => { const r = rot(v); return [cx + r[0] * R, cy - r[1] * R, r[2]]; };

    // halo
    const g = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.5);
    g.addColorStop(0, 'rgba(33,70,143,0.35)'); g.addColorStop(1, 'rgba(33,70,143,0)');
    ctx.globalAlpha = weight; ctx.fillStyle = g; ctx.fillRect(cx - R * 1.6, cy - R * 1.6, R * 3.2, R * 3.2);
    // outline
    ctx.strokeStyle = 'rgb(198,164,92)'; ctx.lineWidth = 1; ctx.globalAlpha = weight * 0.55;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    // lattice points
    for (const v of sphere) {
      const [x, y, z] = P(v);
      const a = z > 0 ? 0.25 + z * 0.65 : 0.06;
      ctx.globalAlpha = a * weight;
      ctx.fillStyle = z > 0 ? 'rgb(255,255,255)' : 'rgb(198,164,92)';
      const s = z > 0 ? 1.4 : 1;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }

    // corridors from Dubai
    const [dx, dy, dz] = P(DUBAI);
    CITIES.forEach((c, i) => {
      const cyc = ((t * 0.55 + i * 0.37) % 4) / 4;
      const prog = Math.min(1, cyc / 0.55);
      const fade = cyc > 0.8 ? 1 - (cyc - 0.8) / 0.2 : 1;
      const dot = DUBAI[0] * c[0] + DUBAI[1] * c[1] + DUBAI[2] * c[2];
      const om = Math.acos(Math.max(-1, Math.min(1, dot)));
      const so = Math.sin(om) || 1;
      const n = 40, m = Math.round(n * prog);
      ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgb(220,194,138)';
      let prev = null;
      for (let k = 0; k <= m; k++) {
        const s = k / n;
        const a1 = Math.sin((1 - s) * om) / so, a2 = Math.sin(s * om) / so;
        const lift = 1 + Math.sin(s * Math.PI) * 0.18 * (om / 1.5);
        const v = [(DUBAI[0] * a1 + c[0] * a2) * lift, (DUBAI[1] * a1 + c[1] * a2) * lift, (DUBAI[2] * a1 + c[2] * a2) * lift];
        const p = P(v);
        if (prev) { ctx.globalAlpha = (p[2] > -0.15 ? 0.9 : 0.15) * fade * weight; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
        prev = p;
      }
      if (prog >= 1 && prev && prev[2] > 0) { ctx.globalAlpha = fade * weight; ctx.fillStyle = 'rgb(220,194,138)'; ctx.beginPath(); ctx.arc(prev[0], prev[1], 2.4, 0, Math.PI * 2); ctx.fill(); }
    });
    // Dubai hub
    if (dz > -0.2) {
      const pulse = (t % 2.6) / 2.6;
      ctx.globalAlpha = weight; ctx.fillStyle = 'rgb(198,164,92)';
      ctx.beginPath(); ctx.arc(dx, dy, 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = (1 - pulse) * weight; ctx.strokeStyle = 'rgb(198,164,92)';
      ctx.beginPath(); ctx.arc(dx, dy, 4 + pulse * 26, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // scene weights over a 28s loop: city → globe → city
  const LOOP = 28;
  const smooth = (x) => x * x * (3 - 2 * x);
  const weights = (t) => {
    const u = t % LOOP;
    let city;
    if (u < 11) city = 1; else if (u < 14) city = 1 - smooth((u - 11) / 3); else if (u < 25) city = 0; else city = smooth((u - 25) / 3);
    return [city, 1 - city];
  };

  let running = false, raf = null, last = 0, clock = 0, paused = false, visible = true;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    clock += dt;
    render(clock);
    raf = requestAnimationFrame(frame);
  }
  function render(t) {
    ctx.clearRect(0, 0, W, H);
    const [wc, wg] = weights(t);
    drawCity(t, wc);
    drawGlobe(t, wg);
  }
  function start() {
    if (running || usingVideo || paused || !visible || document.hidden) return;
    running = true; last = performance.now();
    raf = requestAnimationFrame(frame);
    if (!chapterTimer && !reduce) chapterTimer = setInterval(nextChapter, 7000);
  }
  function stop() { running = false; cancelAnimationFrame(raf); clearInterval(chapterTimer); chapterTimer = null; }

  resize();
  canvas.classList.add('is-running');
  hero.classList.add('has-film');
  if (reduce) { render(4.2); }
  else {
    start();
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }, { threshold: 0.02 }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }
  let rt = null;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (!running) render(clock || 4.2); }, 120); });

  toggle?.addEventListener('click', () => {
    paused = !paused;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.querySelector('.film-toggle__label').textContent = paused ? 'Play film' : 'Pause film';
    if (usingVideo) { paused ? video.pause() : video.play(); return; }
    paused ? stop() : start();
  });
  if (reduce && toggle) toggle.hidden = true;
})();
