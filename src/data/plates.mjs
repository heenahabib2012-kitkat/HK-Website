// Architectural art plates — the site's default visual language.
// Each plate is a generated SVG (royal blue field, champagne-gold line work).
// Supplying a photograph at src/assets/img/photos/<slot>.jpg replaces the plate
// for that slot automatically at build time (see build.mjs → media()).

const G = '#C6A45C';
const W = 1600, H = 1200;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Math.round(n * 10) / 10;
const line = (x1, y1, x2, y2, o = 0.6, w = 1.2) => `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke-opacity="${o}" stroke-width="${w}"/>`;

function wrap(inner, { glow = [0.72, 0.22], tone = 'deep' } = {}) {
  const light = tone === 'light';
  const [c1, c2] = light ? ['#FBFAF7', '#EDEBE4'] : ['#0F2A5E', '#061430'];
  const glowCol = light ? '#FFFFFF' : '#21468F';
  const stroke = light ? '#102B63' : G;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<radialGradient id="glow" cx="${glow[0]}" cy="${glow[1]}" r=".75"><stop offset="0" stop-color="${glowCol}" stop-opacity="${light ? 1 : 0.85}"/><stop offset="1" stop-color="${glowCol}" stop-opacity="0"/></radialGradient>
<linearGradient id="fadeY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${stroke}" stop-opacity="1"/><stop offset="1" stop-color="${stroke}" stop-opacity=".05"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#glow)"/>
<g fill="none" stroke="${stroke}" stroke-linecap="round" stroke-linejoin="round">${inner}</g>
${light ? '' : `<g fill="none" stroke="${G}" stroke-opacity=".5"><path d="M60 60h80M60 60v80M${W - 60} ${H - 60}h-80M${W - 60} ${H - 60}v-80" stroke-width="1.2"/></g>`}
</svg>`;
}

/* ---------- compositions ---------- */
function skyline(seed = 7) {
  const r = rng(seed); let s = '';
  const hz = 860;
  s += line(0, hz, W, hz, 0.7, 1.4);
  let x = 40;
  while (x < W - 40) {
    const w = 60 + r() * 110;
    const centre = 1 - Math.abs(x + w / 2 - W * 0.56) / (W * 0.6);
    const h = 120 + r() * 260 + centre * 380;
    const top = hz - h;
    s += `<path d="M${f(x)} ${hz}V${f(top)}H${f(x + w)}V${hz}" stroke-opacity="${(0.35 + centre * 0.5).toFixed(2)}" stroke-width="1.3"/>`;
    for (let y = top + 22; y < hz - 10; y += 18 + r() * 10) s += line(x + 6, y, x + w - 6, y, 0.12 + centre * 0.12, 0.8);
    const fins = Math.floor(w / 26);
    for (let i = 1; i < fins; i++) s += line(x + (w / fins) * i, top + 8, x + (w / fins) * i, hz, 0.1, 0.8);
    // reflection
    s += `<path d="M${f(x)} ${hz + 6}V${f(hz + h * 0.25)}M${f(x + w)} ${hz + 6}V${f(hz + h * 0.25)}" stroke-opacity=".12" stroke-width="1"/>`;
    x += w + 8 + r() * 26;
  }
  // spire
  const sx = W * 0.56;
  s += `<path d="M${sx - 40} ${hz}L${sx - 14} 250L${sx} 90L${sx + 14} 250L${sx + 40} ${hz}" stroke-opacity=".95" stroke-width="1.6"/>`;
  for (let y = 300; y < hz; y += 34) s += line(sx - 14 - ((y - 250) / (hz - 250)) * 26, y, sx + 14 + ((y - 250) / (hz - 250)) * 26, y, 0.3, 0.8);
  for (let i = 0; i < 16; i++) s += line(0, hz + 40 + i * i * 1.6, W, hz + 40 + i * i * 1.6, 0.06, 0.8);
  return wrap(s, { glow: [0.56, 0.3] });
}

function facade() {
  // worm's-eye view up a tower: verticals converging to a vanishing point
  let s = ''; const vx = W * 0.5, vy = -900;
  for (let i = -18; i <= 18; i++) {
    const bx = vx + i * 120;
    s += line(bx, H + 20, vx + (bx - vx) * 0.12, vy * 0.0 + 40, 0.18 + (18 - Math.abs(i)) / 50, 1.1);
  }
  let y = H; let gap = 150;
  while (y > 60 && gap > 4) {
    const k = (y - vy) / (H - vy);
    s += line(vx - 2160 * k, y, vx + 2160 * k, y, 0.22 + (1 - k) * 0.3, 1);
    y -= gap; gap *= 0.86;
  }
  s += `<path d="M${vx - 520} ${H}L${vx - 70} 40M${vx + 520} ${H}L${vx + 70} 40" stroke-opacity=".95" stroke-width="1.8"/>`;
  return wrap(s, { glow: [0.5, 0.0] });
}

function arches() {
  let s = ''; const vx = W * 0.5, vy = 560;
  for (let i = 0; i < 9; i++) {
    const k = Math.pow(0.78, i);
    const w = 1100 * k, h = 1000 * k;
    const x = vx - w / 2, yb = vy + h * 0.55, yt = yb - h;
    const r = w / 2;
    s += `<path d="M${f(x)} ${f(yb)}V${f(yt + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(yt + r)}V${f(yb)}" stroke-opacity="${(0.95 - i * 0.09).toFixed(2)}" stroke-width="${(1.8 - i * 0.12).toFixed(2)}"/>`;
  }
  for (let i = -10; i <= 10; i++) s += line(vx + i * 30, vy + 40, vx + i * 260, H, 0.14, 1);
  for (let i = 1; i < 10; i++) { const y = vy + 40 + Math.pow(i, 2) * 6.4; s += line(0, y, W, y, 0.08 + i * 0.012, 1); }
  return wrap(s, { glow: [0.5, 0.45] });
}

function columns() {
  let s = ''; const base = 1000, top = 300;
  s += `<path d="M120 ${top - 40}H${W - 120}M150 ${top - 70}H${W - 150}M120 ${top - 40}L${W / 2} 90L${W - 120} ${top - 40}" stroke-opacity=".8" stroke-width="1.5"/>`;
  s += `<path d="M110 ${base + 30}H${W - 110}M80 ${base + 70}H${W - 80}M50 ${base + 110}H${W - 50}" stroke-opacity=".55" stroke-width="1.3"/>`;
  for (let c = 0; c < 6; c++) {
    const cx = 260 + c * 216, w = 90;
    s += `<path d="M${cx - w / 2 - 14} ${top}H${cx + w / 2 + 14}M${cx - w / 2 - 14} ${base + 30}H${cx + w / 2 + 14}" stroke-opacity=".7" stroke-width="1.3"/>`;
    for (let k = 0; k <= 6; k++) s += line(cx - w / 2 + (w / 6) * k, top + 14, cx - w / 2 + (w / 6) * k + (k - 3) * 0.6, base + 18, k === 0 || k === 6 ? 0.85 : 0.22, k === 0 || k === 6 ? 1.4 : 0.9);
  }
  return wrap(s, { glow: [0.5, 0.15] });
}

function stairs() {
  let s = ''; let x = 120, y = 1080;
  const steps = 11;
  for (let i = 0; i < steps; i++) {
    const nx = x + 120, ny = y - 82;
    s += `<path d="M${x} ${y}V${ny}H${nx}" stroke-opacity="${(0.35 + i * 0.06).toFixed(2)}" stroke-width="1.5"/>`;
    s += line(x + 60, y, x + 60 + 160, y - 120, 0.1, 0.9);
    x = nx; y = ny;
  }
  s += `<circle cx="${x + 40}" cy="${y - 70}" r="44" stroke-opacity=".9" stroke-width="1.4"/><circle cx="${x + 40}" cy="${y - 70}" r="90" stroke-opacity=".25"/>`;
  for (let i = 0; i < 14; i++) s += line(0, 1120 - i * 4, W, 1120 - i * 4 - 900, 0.03, 1);
  return wrap(s, { glow: [0.85, 0.15] });
}

function containers() {
  let s = ''; const r = rng(11);
  const ax = 70, ay = 40; // isometric unit
  const iso = (i, j, k) => [W * 0.5 + (i - j) * ax, 760 + (i + j) * ay - k * 70];
  for (let k = 0; k < 4; k++) for (let i = -4; i < 5; i++) for (let j = -4; j < 5; j++) {
    if (r() > 0.7 - k * 0.15 || Math.abs(i) + Math.abs(j) > 7 - k) continue;
    const p = [iso(i, j, k + 1), iso(i + 1, j, k + 1), iso(i + 1, j + 1, k + 1), iso(i, j + 1, k + 1), iso(i + 1, j + 1, k), iso(i, j + 1, k), iso(i + 1, j, k)];
    const o = (0.2 + k * 0.18).toFixed(2);
    s += `<path d="M${p[0]}L${p[1]}L${p[2]}L${p[3]}ZM${p[2]}L${p[4]}M${p[3]}L${p[5]}L${p[4]}L${p[6]}L${p[1]}" stroke-opacity="${o}" stroke-width="1.1"/>`;
  }
  return wrap(s.replace(/(\d+\.\d{2,})/g, (m) => f(+m)), { glow: [0.5, 0.35] });
}

function diamond() {
  // A brilliant-cut diamond turning on its vertical axis. The crown repeats every
  // 1/10 of a turn, so animating the facets through 36 degrees loops seamlessly.
  const cx = W / 2, cy = 600, n = 10, FR = 12, DUR = 6;
  const frame = (theta) => {
    const top = [], tbl = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + theta;
      top.push([cx + Math.cos(a) * 340, cy - 150 + Math.sin(a) * 60]);
      tbl.push([cx + Math.cos(a + Math.PI / n) * 187, cy - 220 + Math.sin(a + Math.PI / n) * 33]);
    }
    let pav = '', crown = '', table = '';
    for (let i = 0; i < n; i++) {
      const a = top[i], b = top[(i + 1) % n], c = tbl[i];
      pav += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${cx} ${cy + 330}Z`;
      crown += `M${f(a[0])} ${f(a[1])}L${f(c[0])} ${f(c[1])}L${f(b[0])} ${f(b[1])}`;
      table += `${i ? 'L' : 'M'}${f(c[0])} ${f(c[1])}`;
    }
    return [pav, crown, table + 'Z'];
  };
  const frames = Array.from({ length: FR + 1 }, (_, k) => frame((k / FR) * ((Math.PI * 2) / n)));
  const anim = (idx) => `<animate attributeName="d" dur="${DUR}s" repeatCount="indefinite" calcMode="linear" values="${frames.map((fr) => fr[idx]).join(';')}"/>`;
  let s = '';
  s += `<path d="${frames[0][0]}" stroke-opacity=".5" stroke-width="1.2">${anim(0)}</path>`;
  s += `<path d="${frames[0][1]}" stroke-opacity=".8" stroke-width="1.2">${anim(1)}</path>`;
  s += `<path d="${frames[0][2]}" stroke-opacity=".9" stroke-width="1.4">${anim(2)}</path>`;
  s += `<ellipse cx="${cx}" cy="${cy - 150}" rx="340" ry="60" stroke-opacity=".35"/>`;
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; s += line(cx + Math.cos(a) * 420, cy + Math.sin(a) * 420, cx + Math.cos(a) * 780, cy + Math.sin(a) * 780, 0.08, 1); }
  s += `<circle cx="${cx}" cy="${cy}" r="520" stroke-opacity=".12"/>`;
  // a small display stand beneath the stone
  s += `<path d="M${cx - 120} ${cy + 380} H${cx + 120} M${cx - 70} ${cy + 380} L${cx - 40} ${cy + 340} H${cx + 40} L${cx + 70} ${cy + 380}" stroke-opacity=".5"/>`;
  return wrap(s, { glow: [0.5, 0.45] });
}

function circuit() {
  let s = ''; const r = rng(23);
  for (let i = 0; i < 46; i++) {
    let x = Math.round(r() * 16) * 100, y = Math.round(r() * 12) * 100;
    let d = `M${x} ${y}`;
    for (let k = 0; k < 4; k++) {
      if (r() > 0.5) x += (r() > 0.5 ? 1 : -1) * 100 * (1 + Math.floor(r() * 3));
      else y += (r() > 0.5 ? 1 : -1) * 100 * (1 + Math.floor(r() * 2));
      d += `L${x} ${y}`;
    }
    const o = (0.15 + r() * 0.55).toFixed(2);
    s += `<path d="${d}" stroke-opacity="${o}" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="5" stroke-opacity="${o}"/>`;
  }
  for (let x = 0; x <= W; x += 100) for (let y = 0; y <= H; y += 100) s += `<path d="M${x} ${y}h0" stroke-opacity=".25" stroke-width="3"/>`;
  return wrap(s, { glow: [0.3, 0.3] });
}

function rings() {
  let s = ''; const cx = W * 0.62, cy = 560;
  for (let i = 1; i < 16; i++) s += `<circle cx="${cx}" cy="${cy}" r="${i * 44}" stroke-opacity="${(0.7 - i * 0.042).toFixed(2)}" stroke-width="${i % 4 === 0 ? 1.6 : 0.9}"/>`;
  s += `<path d="M${cx - 60} ${cy}H${cx + 60}M${cx} ${cy - 60}V${cy + 60}" stroke-opacity=".95" stroke-width="1.8"/>`;
  s += `<path d="M0 ${cy}H${cx - 300}l40 -90l50 180l40 -90H${W}" stroke-opacity=".35" stroke-width="1.2"/>`;
  return wrap(s, { glow: [0.62, 0.45] });
}

function ascent() {
  let s = ''; const base = 1040; const r = rng(5);
  let prev = null; let d = '';
  for (let i = 0; i < 12; i++) {
    const x = 160 + i * 116, h = 120 + i * 55 + r() * 70;
    s += `<path d="M${x - 30} ${base}V${f(base - h)}H${x + 30}V${base}" stroke-opacity="${(0.2 + i * 0.05).toFixed(2)}" stroke-width="1.2"/>`;
    for (let y = base - 30; y > base - h; y -= 30) s += line(x - 22, y, x + 22, y, 0.1, 0.8);
    d += `${prev ? 'L' : 'M'}${x} ${f(base - h - 50)}`; prev = 1;
  }
  s += `<path class="trend" pathLength="1" d="${d}" stroke-opacity=".95" stroke-width="1.8"/>`;
  s += line(80, base, W - 80, base, 0.7, 1.4);
  return wrap(s, { glow: [0.85, 0.2] });
}

function plan() {
  let s = '';
  const R = (x, y, w, h, o = 0.7) => `<path d="M${x} ${y}h${w}v${h}h${-w}Z" stroke-opacity="${o}" stroke-width="1.4"/>`;
  s += R(260, 200, 1080, 800, 0.9);
  s += R(260, 200, 420, 360) + R(680, 200, 660, 260) + R(260, 560, 300, 440) + R(560, 760, 380, 240) + R(940, 460, 400, 540);
  s += `<path d="M680 460h120M1000 460v60M560 760v-80M940 860h-40" stroke-opacity=".9" stroke-width="5" stroke="#061430"/>`;
  s += `<path d="M800 460a120 120 0 0 1 -120 120M1000 520a60 60 0 0 0 60 -60" stroke-opacity=".4"/>`;
  for (let x = 0; x <= W; x += 40) s += line(x, 0, x, H, x % 200 === 0 ? 0.09 : 0.035, 1);
  for (let y = 0; y <= H; y += 40) s += line(0, y, W, y, y % 200 === 0 ? 0.09 : 0.035, 1);
  s += `<path d="M260 1060h1080M260 1048v24M1340 1048v24" stroke-opacity=".5"/>`;
  return wrap(s, { glow: [0.5, 0.5] });
}

function vitrine() {
  let s = ''; const vx = W * 0.5, vy = 520;
  for (let i = 0; i < 7; i++) {
    const k = Math.pow(0.8, i), w = 260 * k, h = 640 * k;
    const xl = vx - 700 * k, xr = vx + 700 * k - w, y = vy - h * 0.45;
    for (const x of [xl, xr]) {
      s += `<path d="M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z" stroke-opacity="${(0.85 - i * 0.1).toFixed(2)}" stroke-width="1.3"/>`;
      s += line(x + w * 0.5, y, x + w * 0.5, y + h * 0.18, 0.4, 1);
      s += line(x, y + h * 0.18, x + w, y + h * 0.18, 0.4, 1);
    }
  }
  for (let i = -8; i <= 8; i++) s += line(vx + i * 20, vy + 120, vx + i * 220, H, 0.12, 1);
  s += line(0, vy - 360, W, vy - 360, 0.15, 1);
  return wrap(s, { glow: [0.5, 0.4] });
}

function flow() {
  let s = '';
  for (let i = 0; i < 34; i++) {
    const y = 180 + i * 26;
    s += `<path d="M-20 ${y}C420 ${y - 160 + i * 4} 900 ${y + 220 - i * 8} 1620 ${y - 40}" stroke-opacity="${(0.12 + (i % 6 === 0 ? 0.6 : 0.12)).toFixed(2)}" stroke-width="${i % 6 === 0 ? 1.5 : 1}"/>`;
  }
  return wrap(s, { glow: [0.2, 0.3] });
}

function monolith() {
  let s = ''; const cx = W * 0.5;
  s += `<path d="M${cx - 170} 1000V220L${cx - 70} 160V940ZM${cx - 70} 160H${cx + 210}V940H${cx - 70}M${cx + 210} 160L${cx + 110} 220H${cx - 170}" stroke-opacity=".9" stroke-width="1.5"/>`;
  for (let y = 220; y < 1000; y += 30) s += line(cx - 170, y, cx - 70, y - 60, 0.12, 0.9);
  s += line(cx - 170, 1000, cx + 210, 940, 0.5, 1.2);
  for (let i = 0; i < 30; i++) s += line(cx + 210, 160 + i * 26, W, 160 + i * 52, 0.05 + (i % 5 === 0 ? 0.1 : 0), 1);
  s += line(0, 1000, W, 1000 - 60 * 0, 0.4, 1.2);
  return wrap(s, { glow: [0.75, 0.15] });
}

function blueprint() {
  let s = '';
  for (let x = 0; x <= W; x += 50) s += line(x, 0, x, H, x % 250 === 0 ? 0.1 : 0.04, 1);
  for (let y = 0; y <= H; y += 50) s += line(0, y, W, y, y % 250 === 0 ? 0.1 : 0.04, 1);
  const docs = [[420, 230, -6], [620, 270, 3], [820, 230, 9]];
  docs.forEach(([x, y, a], i) => {
    s += `<g transform="rotate(${a} ${x + 180} ${y + 330})"><path d="M${x} ${y}h300l60 60v540h-360Z" stroke-opacity="${0.5 + i * 0.2}" stroke-width="1.4"/><path d="M${x + 300} ${y}v60h60" stroke-opacity=".6"/>`;
    for (let k = 0; k < 12; k++) s += line(x + 40, y + 120 + k * 34, x + (k % 4 === 3 ? 200 : 320), y + 120 + k * 34, 0.25, 1);
    s += `</g>`;
  });
  s += `<circle cx="1180" cy="860" r="70" stroke-opacity=".9" stroke-width="1.4"/><circle cx="1180" cy="860" r="54" stroke-opacity=".5"/>`;
  return wrap(s, { glow: [0.5, 0.3] });
}

function replica() {
  // franchise: one unit, faithfully repeated into the distance
  let s = ''; const vx = W * 0.5, vy = 470;
  const unit = (x, y, k, o) => `<path d="M${f(x)} ${f(y)}h${f(220 * k)}v${f(260 * k)}h${f(-220 * k)}ZM${f(x)} ${f(y + 70 * k)}h${f(220 * k)}M${f(x + 80 * k)} ${f(y + 260 * k)}v${f(-120 * k)}h${f(60 * k)}v${f(120 * k)}" stroke-opacity="${o}" stroke-width="${f(0.6 + 1.0 * k)}"/>`;
  for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
    const k = Math.pow(0.74, i) * (1 - row * 0.12);
    const spread = (row - 1) * 640;
    const x = vx + spread * k - 110 * k, y = vy + 300 * k - 130 * k + row * 0;
    s += unit(x, y, k, (row === 1 ? 0.95 : 0.45) * (1 - i * 0.09));
  }
  for (let i = -8; i <= 8; i++) s += line(vx, vy, vx + i * 260, H, 0.07, 1);
  return wrap(s, { glow: [0.5, 0.35] });
}

function dunes() {
  let s = '';
  for (let i = 0; i < 26; i++) {
    const y = 420 + i * 30;
    s += `<path d="M-20 ${y}C300 ${y - 90 + (i % 3) * 20} 620 ${y + 60} 900 ${y - 30}S1400 ${y - 120 + i * 3} 1620 ${y - 10}" stroke-opacity="${(0.08 + i * 0.025).toFixed(2)}" stroke-width="1.1"/>`;
  }
  s += `<circle cx="1180" cy="260" r="90" stroke-opacity=".9" stroke-width="1.4"/><circle cx="1180" cy="260" r="130" stroke-opacity=".2"/>`;
  return wrap(s, { glow: [0.74, 0.22] });
}

function bridge() {
  let s = ''; const deck = 760;
  s += line(0, deck, W, deck, 0.9, 1.8);
  s += line(0, deck + 18, W, deck + 18, 0.4, 1.1);
  for (const px of [520, 1080]) {
    s += `<path d="M${px - 26} ${deck + 200}L${px} 200L${px + 26} ${deck + 200}" stroke-opacity=".95" stroke-width="1.6"/>`;
    for (let i = 1; i <= 12; i++) {
      s += line(px, 240 + i * 20, px - i * 24, deck, 0.45, 0.9);
      s += line(px, 240 + i * 20, px + i * 24, deck, 0.45, 0.9);
    }
  }
  for (let i = 0; i < 12; i++) s += line(0, deck + 80 + i * i * 2.4, W, deck + 80 + i * i * 2.4, 0.06, 1);
  return wrap(s, { glow: [0.5, 0.2] });
}

function globe() {
  let s = ''; const cx = W * 0.5, cy = 620, R = 430;
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" stroke-opacity=".9" stroke-width="1.5"/>`;
  for (let i = 1; i < 9; i++) { const rx = R * Math.cos((i / 9) * (Math.PI / 2)); s += `<ellipse cx="${cx}" cy="${cy}" rx="${f(rx)}" ry="${R}" stroke-opacity=".22"/>`; }
  for (let i = -3; i <= 3; i++) { const y = cy + (i / 4) * R; const rx = Math.sqrt(R * R - (y - cy) ** 2); s += `<ellipse cx="${cx}" cy="${f(y)}" rx="${f(rx)}" ry="${f(rx * 0.16)}" stroke-opacity=".2"/>`; }
  s += `<path d="M${cx - 120} ${cy - 120}Q${cx - 300} ${cy - 420} ${cx - 520} ${cy - 160}M${cx - 120} ${cy - 120}Q${cx + 200} ${cy - 460} ${cx + 560} ${cy - 220}M${cx - 120} ${cy - 120}Q${cx + 160} ${cy + 40} ${cx + 380} ${cy + 260}" stroke-opacity=".8" stroke-width="1.3" stroke-dasharray="2 8"/>`;
  s += `<circle cx="${cx - 120}" cy="${cy - 120}" r="8" fill="${G}" stroke="none"/>`;
  return wrap(s, { glow: [0.5, 0.4] });
}

function horizon() {
  let s = ''; const hz = 760;
  s += line(0, hz, W, hz, 0.8, 1.4);
  for (let i = 1; i < 18; i++) s += line(0, hz + i * i * 1.8, W, hz + i * i * 1.8, 0.05 + i * 0.004, 1);
  for (let i = -14; i <= 14; i++) s += line(W / 2, hz, W / 2 + i * 180, H, 0.06, 1);
  s += `<circle cx="${W / 2}" cy="${hz}" r="180" stroke-opacity=".7" stroke-width="1.3"/><circle cx="${W / 2}" cy="${hz}" r="300" stroke-opacity=".2"/><circle cx="${W / 2}" cy="${hz}" r="460" stroke-opacity=".08"/>`;
  return wrap(s, { glow: [0.5, 0.62] });
}

function contour() {
  let s = ''; const r = rng(3);
  for (let i = 0; i < 18; i++) {
    const cx = 1150, cy = 520, rx = 60 + i * 52, ry = 40 + i * 34;
    let d = '';
    for (let a = 0; a <= 64; a++) {
      const t = (a / 64) * Math.PI * 2;
      const n = 1 + 0.08 * Math.sin(t * 3 + i * 0.4) + 0.05 * Math.cos(t * 5 + r());
      d += `${a ? 'L' : 'M'}${f(cx + Math.cos(t) * rx * n)} ${f(cy + Math.sin(t) * ry * n)}`;
    }
    s += `<path d="${d}Z" stroke-opacity="${(0.55 - i * 0.026).toFixed(2)}" stroke-width="${i % 5 === 0 ? 1.5 : 0.9}"/>`;
  }
  return wrap(s, { glow: [0.7, 0.4] });
}

function link() {
  let s = ''; const cx = W / 2, cy = 600;
  for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i / 4) * Math.PI * 2 + Math.PI / 4; const x = cx + Math.cos(a) * 330, y = cy + Math.sin(a) * 330; s += `<circle cx="${f(x)}" cy="${f(y)}" r="150" stroke-opacity=".55" stroke-width="1.2"/>` + line(cx, cy, x, y, 0.5, 1); }
  s += `<circle cx="${cx}" cy="${cy}" r="170" stroke-opacity=".95" stroke-width="1.6"/><circle cx="${cx}" cy="${cy}" r="500" stroke-opacity=".12"/>`;
  return wrap(s, { glow: [0.5, 0.5] });
}

function facadeLight() {
  let s = '';
  for (let x = 120; x < W; x += 90) s += line(x, 0, x, H, x % 360 === 120 ? 0.35 : 0.12, 1);
  for (let y = 90; y < H; y += 140) s += line(0, y, W, y, 0.1, 1);
  s += `<path d="M120 ${H}V300Q120 120 300 120H${W}" stroke="${G}" stroke-opacity=".9" stroke-width="1.6"/>`;
  return wrap(s, { tone: 'light', glow: [0.3, 0.2] });
}


/* ---------- industry scenes (v2) ---------- */
const boost = (svg) => svg.replace(/stroke-opacity="([\d.]+)"/g, (m, v) => `stroke-opacity="${Math.min(1, v * 1.3).toFixed(2)}"`);
function dining() {
  // F&B & Hospitality: a set table in perspective under pendant lamps
  let s = '';
  s += line(0, 110, W, 110, 0.35, 1.2);
  for (const [x, len] of [[520, 250], [800, 300], [1080, 250]]) {
    const y = 110 + len;
    s += line(x, 110, x, y - 70, 0.55, 1);
    s += `<path d="M${x - 95} ${y} Q${x - 92} ${y - 88} ${x} ${y - 90} Q${x + 92} ${y - 88} ${x + 95} ${y} Z" stroke-opacity=".95" stroke-width="1.5"/>`;
    s += `<path d="M${x - 70} ${y} Q${x} ${y + 26} ${x + 70} ${y}" stroke-opacity=".7"/>`;
    s += `<circle cx="${x}" cy="${y + 12}" r="9" stroke-opacity=".9"/>`;
    for (let k = -2; k <= 2; k++) s += line(x + k * 18, y + 30, x + k * 70, y + 330, 0.07, 1); // light falling
  }
  // table (one-point perspective)
  const fy = 900, by = 700;
  s += `<path d="M300 ${fy} L560 ${by} H1040 L1300 ${fy} Z" stroke-opacity=".95" stroke-width="1.6"/>`;
  s += `<path d="M300 ${fy} V${fy + 22} H1300 V${fy}" stroke-opacity=".7"/>`;
  s += `<path d="M330 ${fy + 22} V1110M1270 ${fy + 22} V1110M590 ${by + 10} V${by + 140}M1010 ${by + 10} V${by + 140}" stroke-opacity=".55"/>`;
  // chairs beyond the table
  for (const x of [610, 760, 910]) s += `<path d="M${x} ${by} V${by - 120} Q${x + 40} ${by - 136} ${x + 80} ${by - 120} V${by}" stroke-opacity=".5"/>`;
  // plates, cutlery, glasses
  const plate = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${f(rx * 0.24)}" stroke-opacity=".9"/><ellipse cx="${cx}" cy="${cy}" rx="${f(rx * 0.62)}" ry="${f(rx * 0.15)}" stroke-opacity=".5"/>`;
  [[520, 850, 74], [800, 850, 74], [1080, 850, 74], [660, 740, 46], [940, 740, 46]].forEach(([x, y, r]) => {
    s += plate(x, y, r);
    s += line(x - r - 18, y - 10, x - r - 18, y + 14, 0.6, 1.2) + line(x + r + 18, y - 10, x + r + 18, y + 14, 0.6, 1.2);
    const gx = x + r * 0.9, gy = y - r * 0.55, gs = r / 74;
    s += `<path d="M${f(gx - 16 * gs)} ${f(gy - 46 * gs)} Q${f(gx - 18 * gs)} ${f(gy - 10 * gs)} ${f(gx)} ${f(gy - 6 * gs)} Q${f(gx + 18 * gs)} ${f(gy - 10 * gs)} ${f(gx + 16 * gs)} ${f(gy - 46 * gs)} Z M${f(gx)} ${f(gy - 6 * gs)} V${f(gy + 20 * gs)} M${f(gx - 12 * gs)} ${f(gy + 20 * gs)} H${f(gx + 12 * gs)}" stroke-opacity=".75"/>`;
  });
  for (let i = 1; i < 9; i++) s += line(0, 1110 + i * i * 1.4, W, 1110 + i * i * 1.4, 0.05, 1);
  return wrap(boost(s), { glow: [0.5, 0.35] });
}

function port() {
  // Trading: a container ship at the quay, a gantry crane lifting a box aboard
  let s = ''; const r = rng(31);
  const wl = 830;
  s += line(0, wl, W, wl, 0.6, 1.3);
  for (let i = 1; i < 12; i++) s += line(60 + (i % 3) * 40, wl + i * i * 2.6, W - 60 - (i % 2) * 80, wl + i * i * 2.6, 0.05 + 0.01 * (i % 3), 1);
  // hull
  s += `<path d="M180 770 H1180 L1150 ${wl + 40} H230 Z" stroke-opacity=".95" stroke-width="1.6"/>`;
  s += line(200, 800, 1165, 800, 0.35, 1);
  // bridge at the stern
  s += `<path d="M200 770 V560 H320 V770M200 600 H320M200 640 H320M215 560 V520 H300 V560" stroke-opacity=".8" stroke-width="1.3"/>`;
  s += line(260, 520, 260, 470, 0.6, 1);
  // stacked containers
  const cw = 92, ch = 50;
  for (let x = 350; x + cw <= 1150; x += cw + 6) {
    const stacks = 2 + Math.floor(r() * 3);
    for (let k = 0; k < stacks; k++) {
      const y = 770 - (k + 1) * (ch + 4);
      s += `<path d="M${x} ${y}h${cw}v${ch}h${-cw}Z" stroke-opacity="${(0.55 + r() * 0.35).toFixed(2)}" stroke-width="1.2"/>`;
      for (let c = 1; c < 6; c++) s += line(x + (cw / 6) * c, y + 6, x + (cw / 6) * c, y + ch - 6, 0.16, 0.8);
    }
  }
  // quay and gantry crane
  s += `<path d="M1180 ${wl} H${W} M1180 ${wl} V${wl + 60}" stroke-opacity=".7"/>`;
  s += `<path d="M1300 ${wl} V330 M1460 ${wl} V330 M1300 330 H1460 M1090 300 H1580 M1300 330 L1380 300 L1460 330" stroke-opacity=".95" stroke-width="1.6"/>`;
  for (let y = 380; y < wl; y += 90) s += `<path d="M1300 ${y} L1460 ${y + 90} M1460 ${y} L1300 ${y + 90}" stroke-opacity=".22"/>`;
  s += `<path d="M1090 300 L1300 230 L1580 300 M1300 230 V300" stroke-opacity=".6"/>`;
  // trolley, cables and the box being lifted
  s += '<g class="lift">';
  s += `<path d="M1150 300 h44 v16 h-44Z M1160 316 V520 M1184 316 V520" stroke-opacity=".8"/>`;
  s += `<path d="M1126 520h92v50h-92Z" stroke-opacity="1" stroke-width="1.6"/>`;
  for (let c = 1; c < 6; c++) s += line(1126 + (92 / 6) * c, 526, 1126 + (92 / 6) * c, 564, 0.3, 0.8);
  s += '</g>';
  return wrap(boost(s), { glow: [0.55, 0.3] });
}

function boardroom() {
  // Professional services: a boardroom table before a window wall
  let s = '';
  // window wall with a skyline beyond
  s += `<path d="M260 140 H1340 V580 H260 Z" stroke-opacity=".7" stroke-width="1.3"/>`;
  for (let x = 380; x < 1340; x += 120) s += line(x, 140, x, 580, 0.3, 1);
  s += line(260, 360, 1340, 360, 0.25, 1);
  const r = rng(8); let sk = 'M260 580';
  for (let x = 260; x < 1340;) { const w = 40 + r() * 70, h = 60 + r() * 200; sk += `V${f(580 - h)}H${f(Math.min(1340, x + w))}`; x += w; }
  s += `<path d="${sk}V580" stroke-opacity=".28"/>`;
  // table in perspective
  const bl = 680, br = 920, by = 620, fl = 400, fr = 1200, fy = 1010;
  s += `<path d="M${fl} ${fy} L${bl} ${by} H${br} L${fr} ${fy} Z" stroke-opacity=".95" stroke-width="1.6"/>`;
  s += `<path d="M${fl} ${fy} V${fy + 26} H${fr} V${fy}" stroke-opacity=".6"/>`;
  // chairs along both sides: a rounded back above a seat, scaled with depth
  const chair = (cx, cy, sc) => {
    const w = 52 * sc, h = 78 * sc, sh = 14 * sc, x0 = cx - w / 2;
    return `<path d="M${f(x0)} ${f(cy)} V${f(cy - h + 8 * sc)} Q${f(x0)} ${f(cy - h)} ${f(x0 + 8 * sc)} ${f(cy - h)} H${f(x0 + w - 8 * sc)} Q${f(x0 + w)} ${f(cy - h)} ${f(x0 + w)} ${f(cy - h + 8 * sc)} V${f(cy)}" stroke-opacity="${(0.55 + sc * 0.3).toFixed(2)}" stroke-width="1.4"/>`
      + `<path d="M${f(x0 - 4 * sc)} ${f(cy + sh)} H${f(x0 + w + 4 * sc)} M${f(x0 + 4 * sc)} ${f(cy + sh)} V${f(cy + sh + 46 * sc)} M${f(x0 + w - 4 * sc)} ${f(cy + sh)} V${f(cy + sh + 46 * sc)}" stroke-opacity="${(0.45 + sc * 0.3).toFixed(2)}" stroke-width="1.2"/>`;
  };
  for (let i = 0; i < 4; i++) {
    const t = 0.1 + i * 0.26, sc = 0.55 + t * 0.55;
    const yl = by + (fy - by) * t;
    const xl = bl + (fl - bl) * t, xr = br + (fr - br) * t;
    s += chair(xl - 46 * sc, yl - 6 * sc, sc);
    s += chair(xr + 46 * sc, yl - 6 * sc, sc);
  }
  s += chair(800, by - 18, 0.6); // head of the table
  // papers and a pen on the table
  s += `<path d="M720 900 L760 820 H850 L830 900 Z M870 930 L900 860 H980 L966 930 Z" stroke-opacity=".75"/>`;
  for (let i = 1; i < 8; i++) s += line(0, 1050 + i * i * 2, W, 1050 + i * i * 2, 0.05, 1);
  return wrap(boost(s), { glow: [0.5, 0.25] });
}

function tech() {
  // Technology: a laptop with code, linked to a network of nodes, circuit traces below
  let s = '';
  const nodes = [[330, 300], [540, 170], [800, 120], [1060, 170], [1270, 300], [430, 470], [1170, 470]];
  const links = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [4, 6], [1, 5], [3, 6], [2, 5], [2, 6]];
  links.forEach(([a, b]) => { s += line(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1], 0.35, 1); });
  nodes.forEach(([x, y], i) => { s += `<circle cx="${x}" cy="${y}" r="${i === 2 ? 14 : 9}" stroke-opacity=".95" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="3" fill="${G}" stroke="none"/>`; });
  s += line(800, 134, 800, 360, 0.5, 1.2);
  s += line(430, 479, 580, 380, 0.35, 1) + line(1170, 479, 1020, 380, 0.35, 1);
  // laptop
  s += `<path d="M560 360 H1040 V690 H560 Z" stroke-opacity=".95" stroke-width="1.6"/><path d="M580 380 H1020 V670 H580 Z" stroke-opacity=".5"/>`;
  s += `<path d="M500 700 H1100 L1150 748 H450 Z" stroke-opacity=".9" stroke-width="1.5"/><path d="M760 712 H840 L846 728 H754 Z" stroke-opacity=".5"/>`;
  const code = [[0, 210], [1, 160], [1, 250], [2, 120], [2, 200], [1, 90], [0, 140], [1, 230], [2, 170], [0, 100]];
  code.forEach(([ind, len], i) => { const y = 410 + i * 25; s += line(610 + ind * 28, y, 610 + ind * 28 + len, y, i % 3 === 1 ? 0.95 : 0.55, 1.4); });
  s += line(1000, 410, 1000, 640, 0.15, 6);
  // circuit traces
  const traces = ['M450 748 V800 H300 V900', 'M600 748 V830 H520 V980', 'M1000 748 V830 H1080 V980', 'M1150 748 V800 H1300 V900', 'M800 748 V1020'];
  traces.forEach((d) => { s += `<path d="${d}" stroke-opacity=".38" stroke-width="1.1"/>`; const m = d.match(/(\d+) (\d+)$/) || d.match(/H(\d+) V(\d+)$/); });
  [[300, 900], [520, 980], [1080, 980], [1300, 900], [800, 1020]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="6" stroke-opacity=".6"/>`; });
  return wrap(boost(s), { glow: [0.5, 0.42] });
}

function shopfront() {
  // Retail: a boutique shopfront — awning, sign band, display windows with mannequins
  let s = '';
  const L = 250, Rr = 1350, top = 150, ground = 990;
  // facade and cornice
  s += `<path d="M${L} ${ground} V${top} H${Rr} V${ground}" stroke-opacity=".9" stroke-width="1.6"/>`;
  s += line(L - 20, top, Rr + 20, top, 0.9, 1.6) + line(L - 10, top + 24, Rr + 10, top + 24, 0.5, 1);
  // sign band with suggested lettering
  s += `<path d="M560 212 H1040 V282 H560 Z" stroke-opacity=".8" stroke-width="1.3"/>`;
  [[640, 120], [780, 90], [890, 70]].forEach(([x, w]) => { s += line(x, 247, x + w, 247, 0.85, 2.2); });
  // scalloped, striped awning
  const at = 320, ab = 420, ax0 = 290, ax1 = 1310, n = 10, sw = (ax1 - ax0) / n;
  let edge = `M${ax0} ${ab}`;
  for (let i = 0; i < n; i++) edge += ` Q${f(ax0 + sw * (i + 0.5))} ${ab + 34} ${f(ax0 + sw * (i + 1))} ${ab}`;
  s += `<path d="M${ax0 + 20} ${at} H${ax1 - 20} L${ax1} ${ab} ${edge.replace(/^M[\d.]+ [\d.]+/, '')} L${ax0} ${ab} Z" stroke-opacity=".95" stroke-width="1.5"/>`;
  s += `<path d="${edge}" stroke-opacity=".95" stroke-width="1.5"/>`;
  for (let i = 1; i < n; i++) { const xb = ax0 + sw * i, xt = ax0 + 20 + ((ax1 - ax0 - 40) / n) * i; s += line(xt, at, xb, ab, i % 2 ? 0.55 : 0.3, 1.1); }
  // display windows and door
  const wy0 = 470, wy1 = 900;
  s += `<path d="M320 ${wy0} H700 V${wy1} H320 Z M900 ${wy0} H1280 V${wy1} H900 Z" stroke-opacity=".95" stroke-width="1.5"/>`;
  s += `<path d="M300 ${wy1} H720 M880 ${wy1} H1300" stroke-opacity=".7" stroke-width="1.3"/>`;
  s += `<path d="M740 ${ground} V490 H860 V${ground} M756 ${ground} V506 H844 V${ground}" stroke-opacity=".85" stroke-width="1.3"/>`;
  s += line(834, 700, 834, 770, 0.95, 2.4);
  // window reflections
  [[360, 520], [960, 520]].forEach(([x, y]) => { s += line(x, y + 120, x + 120, y, 0.16, 1.2) + line(x + 30, y + 150, x + 150, y + 30, 0.1, 1); });
  // mannequins on stands
  const mannequin = (cx, base, sc) => {
    const y = base - 300 * sc;
    return `<circle cx="${cx}" cy="${f(y)}" r="${f(18 * sc)}" stroke-opacity=".9"/>`
      + `<path d="M${cx} ${f(y + 18 * sc)} V${f(y + 30 * sc)} M${f(cx - 40 * sc)} ${f(y + 44 * sc)} Q${cx} ${f(y + 26 * sc)} ${f(cx + 40 * sc)} ${f(y + 44 * sc)} L${f(cx + 22 * sc)} ${f(y + 120 * sc)} L${f(cx + 56 * sc)} ${f(y + 210 * sc)} H${f(cx - 56 * sc)} L${f(cx - 22 * sc)} ${f(y + 120 * sc)} Z" stroke-opacity=".95" stroke-width="1.4"/>`
      + `<path d="M${f(cx - 22 * sc)} ${f(y + 120 * sc)} Q${cx} ${f(y + 130 * sc)} ${f(cx + 22 * sc)} ${f(y + 120 * sc)}" stroke-opacity=".6"/>`
      + `<path d="M${cx} ${f(y + 210 * sc)} V${base} M${f(cx - 34 * sc)} ${base} H${f(cx + 34 * sc)}" stroke-opacity=".75" stroke-width="1.2"/>`;
  };
  s += mannequin(430, wy1 - 6, 1) + mannequin(585, wy1 - 6, 0.92) + mannequin(1180, wy1 - 6, 1);
  // handbag on a plinth in the right window
  s += `<path d="M960 ${wy1} V790 H1080 V${wy1}" stroke-opacity=".75" stroke-width="1.3"/>`;
  s += `<path d="M980 790 L990 735 H1050 L1060 790 Z M1002 735 Q1020 690 1038 735" stroke-opacity=".95" stroke-width="1.4"/>`;
  // spotlights in the window heads
  [420, 600, 1000, 1180].forEach((x) => { s += `<path d="M${x - 12} ${wy0} h24 l-6 14 h-12 Z" stroke-opacity=".7"/>` + line(x, wy0 + 16, x - 40, wy0 + 180, 0.08, 1) + line(x, wy0 + 16, x + 40, wy0 + 180, 0.08, 1); });
  // planters by the door
  [[705, 'l'], [895, 'r']].forEach(([x]) => { s += `<path d="M${x - 22} ${ground} L${x - 28} ${ground - 46} H${x + 28} L${x + 22} ${ground} Z" stroke-opacity=".7"/><path d="M${x} ${ground - 46} Q${x - 26} ${ground - 96} ${x - 10} ${ground - 120} M${x} ${ground - 46} Q${x + 24} ${ground - 92} ${x + 12} ${ground - 126} M${x} ${ground - 46} V${ground - 130}" stroke-opacity=".6"/>`; });
  // pavement
  s += line(0, ground, W, ground, 0.8, 1.4);
  for (let i = 1; i < 9; i++) s += line(0, ground + i * i * 2.4, W, ground + i * i * 2.4, 0.06, 1);
  for (let i = -6; i <= 6; i++) s += line(800 + i * 120, ground, 800 + i * 300, H, 0.05, 1);
  return wrap(boost(s), { glow: [0.5, 0.45] });
}

/* ---------- discreet motion for the industry scenes ----------
   Each scene gets a short looping animation inside its own SVG (CSS + SMIL),
   so it plays even though the drawing is used as a background image. */
const REDUCED = '@media (prefers-reduced-motion: reduce){*{animation:none!important}}';
const COMMON = `
@keyframes breathe { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
@keyframes twinkle { 0%,100% { opacity: 0; transform: scale(.4) } 45%,55% { opacity: 1; transform: scale(1) } }
@keyframes pulse { 0% { transform: scale(1); opacity: .7 } 100% { transform: scale(6); opacity: 0 } }
@keyframes sweep { 0% { transform: translateX(-700px) } 60%,100% { transform: translateX(1900px) } }
@keyframes blink { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
.tw, .pl { transform-box: fill-box; transform-origin: center; }
`;
const sparkle = (x, y, s, d, dur = 3.6) => `<path class="tw" style="animation: twinkle ${dur}s ease-in-out ${d}s infinite" transform="translate(${x} ${y}) scale(${s})" d="M0 -14 L3 -3 L14 0 L3 3 L0 14 L-3 3 L-14 0 L-3 -3 Z" fill="#F3E2B5" stroke="none"/>`;
const glowDefs = `<defs><radialGradient id="lg"><stop offset="0" stop-color="#E9C77E" stop-opacity=".55"/><stop offset="1" stop-color="#E9C77E" stop-opacity="0"/></radialGradient>
<linearGradient id="sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
const band = (cls, dur, delay = 0) => `<rect class="${cls}" style="animation: sweep ${dur}s ease-in-out ${delay}s infinite" x="0" y="-200" width="260" height="1600" fill="url(#sw)" stroke="none" transform="skewX(-22)"/>`;

const MOTION = {
  dining: {
    svg: glowDefs + [[520, 372, 0], [800, 422, 1.6], [1080, 372, 3.1]].map(([x, y, d]) =>
      `<ellipse style="animation: breathe 6.5s ease-in-out ${d}s infinite" cx="${x}" cy="${y + 120}" rx="150" ry="170" fill="url(#lg)" stroke="none" opacity=".26"/>`
      + `<circle style="animation: breathe 6.5s ease-in-out ${d}s infinite" cx="${x}" cy="${y}" r="26" fill="url(#lg)" stroke="none"/>`).join('')
      + sparkle(586, 806, 0.7, 0.4) + sparkle(866, 806, 0.7, 2.1) + sparkle(1146, 806, 0.7, 3.4),
  },
  port: {
    css: `.lift { animation: trolley 10s ease-in-out infinite } @keyframes trolley { 0%,100% { transform: translateX(0) } 45%,55% { transform: translateX(-150px) } }
      .wave { stroke-dasharray: 30 70; animation: drift 6s linear infinite } @keyframes drift { to { stroke-dashoffset: -200 } }`,
    svg: [[0, 852, 0.35], [80, 878, 0.25], [0, 912, 0.18]].map(([x, y, o]) => `<path class="wave" d="M${x} ${y} H1600" stroke-opacity="${o}" stroke-width="1.4"/>`).join(''),
  },
  plan: {
    css: '.room { animation: breathe 7s ease-in-out infinite }',
    svg: `<rect class="room" x="940" y="460" width="400" height="540" fill="#C6A45C" fill-opacity=".07" stroke="none"/>
      <circle r="6" fill="#F3E2B5" stroke="none"><animateMotion dur="16s" repeatCount="indefinite" path="M260 200 H1340 V1000 H260 Z"/></circle>
      <circle r="14" fill="url(#lg)" stroke="none"><animateMotion dur="16s" repeatCount="indefinite" path="M260 200 H1340 V1000 H260 Z"/></circle>` + glowDefs,
  },
  shopfront: {
    css: '.win1 { clip-path: url(#w1) } .win2 { clip-path: url(#w2) }',
    svg: glowDefs + `<clipPath id="w1"><rect x="320" y="470" width="380" height="430"/></clipPath><clipPath id="w2"><rect x="900" y="470" width="380" height="430"/></clipPath>`
      + [420, 600, 1000, 1180].map((x, i) => `<path style="animation: breathe 5.5s ease-in-out ${i * 1.1}s infinite" d="M${x - 8} 486 L${x - 70} 880 H${x + 70} L${x + 8} 486 Z" fill="#E9C77E" fill-opacity=".09" stroke="none"/>`).join('')
      + `<g class="win1">${band('sw1', 9)}</g><g class="win2">${band('sw2', 9, 1.2)}</g>`,
  },
  diamond: {
    svg: glowDefs + `<clipPath id="gem"><circle cx="800" cy="560" r="380"/></clipPath><g clip-path="url(#gem)">${band('gs', 8)}</g>`
      + sparkle(1000, 452, 1.1, 0) + sparkle(640, 470, 0.8, 1.3) + sparkle(830, 392, 0.9, 2.2) + sparkle(1080, 470, 0.7, 3) + sparkle(780, 760, 0.8, 1.8),
  },
  boardroom: {
    svg: glowDefs + (() => {
      let s = '';
      const pts = [[300, 520], [345, 470], [420, 540], [470, 455], [540, 500], [610, 545], [690, 430], [745, 515], [820, 470], [880, 540], [950, 505], [1010, 450], [1080, 530], [1150, 480], [1220, 520], [1290, 470]];
      pts.forEach(([x, y], i) => { s += `<rect style="animation: breathe ${4 + (i % 4)}s ease-in-out ${(i * 0.37) % 3}s infinite" x="${x}" y="${y}" width="7" height="7" fill="#E9C77E" stroke="none"/>`; });
      s += `<clipPath id="win"><rect x="260" y="140" width="1080" height="440"/></clipPath><g clip-path="url(#win)">${band('ws', 11, 2)}</g>`;
      // soft light over the table
      s += `<ellipse style="animation: breathe 7s ease-in-out infinite" cx="800" cy="850" rx="300" ry="110" fill="url(#lg)" stroke="none" opacity=".14"/>`;
      // the signature writes itself; the pen follows the line
      const SIG = 'M884 912 C892 896 900 892 904 904 C906 914 912 916 918 902 C922 892 928 892 930 904 C932 914 940 914 946 900 C950 892 956 894 958 904 L972 898';
      const T = 'keyTimes="0;.45;.85;1" dur="7s" repeatCount="indefinite"';
      s += `<path d="${SIG}" pathLength="1" stroke="#F3E2B5" stroke-width="2" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0;0;0" ${T}/><animate attributeName="opacity" values="1;1;1;0" ${T}/></path>`;
      s += `<g><path d="M0 0 L54 -46 M54 -46 L62 -40 L10 6 Z" stroke="#E9C77E" stroke-width="1.6" fill="#0B2149"/><animateMotion path="${SIG}" keyPoints="0;1;1;1" keyTimes="0;.45;.85;1" calcMode="linear" dur="7s" repeatCount="indefinite"/></g>`;
      return s;
    })(),
  },
  tech: {
    css: '.node { animation: pulse 3.4s ease-out infinite }',
    svg: glowDefs + [[330, 300, 0], [540, 170, 0.6], [800, 120, 1.2], [1060, 170, 1.8], [1270, 300, 2.4]].map(([x, y, d]) => `<circle class="pl node" style="animation-delay:${d}s" cx="${x}" cy="${y}" r="9" stroke-width="1.2"/>`).join('')
      + [['M800 120 L540 170 L330 300 L430 470 L580 380', 0], ['M800 120 L1060 170 L1270 300 L1170 470 L1020 380', 1.4], ['M800 134 V360', 0.7], ['M800 120 L430 470', 2.2], ['M800 120 L1170 470', 2.9]]
        .map(([p, d]) => `<circle r="4.5" fill="#F3E2B5" stroke="none"><animateMotion dur="3.6s" begin="${d}s" repeatCount="indefinite" path="${p}"/></circle>`).join('')
      + `<rect style="animation: blink 1.1s steps(1) infinite" x="806" y="425" width="10" height="20" fill="#E9C77E" stroke="none"/>`,
  },
  ascent: {
    css: '.trend { stroke-dasharray: 1; animation: grow 8s ease-in-out infinite } @keyframes grow { 0% { stroke-dashoffset: 1; opacity: 1 } 55%,85% { stroke-dashoffset: 0; opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }',
    svg: '',
  },
  rings: {
    css: '.ecg { stroke-dasharray: .14 .86; animation: beat 4.5s linear infinite } @keyframes beat { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }',
    svg: `<path class="ecg" pathLength="1" d="M0 560H692l40 -90l50 180l40 -90H1600" stroke="#F3E2B5" stroke-width="2.2" stroke-opacity=".9"/>`
      + [0, 1.7, 3.4].map((d) => `<circle class="pl" style="animation: pulse 5.1s ease-out ${d}s infinite" cx="992" cy="560" r="60" stroke-width="1.4"/>`).join(''),
  },
};

function withMotion(svg, kind) {
  const m = MOTION[kind];
  if (!m) return svg;
  return svg
    .replace('<defs>', `<style>${COMMON}${m.css || ''}${REDUCED}</style>\n<defs>`)
    .replace(/\n<\/svg>$/, `\n<g fill="none" stroke="${G}" stroke-linecap="round">${m.svg}</g>\n</svg>`);
}

export const plates = {
  dining, port, boardroom, tech, shopfront,
  skyline: () => skyline(7), skyline2: () => skyline(19), facade, arches, columns, stairs, containers, diamond,
  circuit, rings, ascent, plan, vitrine, flow, monolith, blueprint, replica, dunes, bridge,
  globe, horizon, contour, link, 'facade-light': facadeLight,
};

for (const k of ['dining', 'port', 'plan', 'shopfront', 'diamond', 'boardroom', 'tech', 'ascent', 'rings']) {
  const base = plates[k];
  plates[k] = () => withMotion(base(), k);
}

// slot → plate. Add a photo at src/assets/img/photos/<slot>.(jpg|webp) to override.
export const slots = {
  'hero-poster': 'skyline',
  'home-prologue': 'facade',
  'about-hero': 'horizon',
  'svc-franchise': 'replica', 'svc-setup': 'blueprint', 'svc-ops': 'flow', 'svc-brand': 'monolith', 'svc-startup': 'stairs',
  'ind-fnb': 'dining', 'ind-trading': 'port', 'ind-realestate': 'plan', 'ind-retail': 'shopfront', 'ind-luxury': 'diamond',
  'ind-professional': 'boardroom', 'ind-technology': 'tech', 'ind-investment': 'ascent', 'ind-healthcare': 'rings',
  'tl-2015': 'dunes', 'tl-2017': 'bridge', 'tl-2021': 'skyline2', 'tl-today': 'globe',
  'network': 'link', 'cta': 'contour', 'contact': 'horizon', 'vision': 'facade-light',
  'founder': 'facade',
};
