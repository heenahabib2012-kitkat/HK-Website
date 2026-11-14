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
  let s = ''; const cx = W / 2, cy = 600;
  const top = [];
  const n = 10;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; top.push([cx + Math.cos(a) * 340, cy - 150 + Math.sin(a) * 60]); }
  const tbl = top.map(([x, y]) => [cx + (x - cx) * 0.55, y - 70 + (y - (cy - 150)) * 0.4]);
  for (let i = 0; i < n; i++) {
    const a = top[i], b = top[(i + 1) % n], c = tbl[i], d = tbl[(i + 1) % n];
    s += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${cx} ${cy + 330}Z" stroke-opacity=".5" stroke-width="1.2"/>`;
    s += `<path d="M${f(a[0])} ${f(a[1])}L${f(c[0])} ${f(c[1])}L${f(d[0])} ${f(d[1])}" stroke-opacity=".75" stroke-width="1.2"/>`;
  }
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; s += line(cx + Math.cos(a) * 420, cy + Math.sin(a) * 420, cx + Math.cos(a) * 780, cy + Math.sin(a) * 780, 0.08, 1); }
  s += `<circle cx="${cx}" cy="${cy}" r="520" stroke-opacity=".12"/>`;
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
  s += `<path d="${d}" stroke-opacity=".95" stroke-width="1.8"/>`;
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

export const plates = {
  skyline: () => skyline(7), skyline2: () => skyline(19), facade, arches, columns, stairs, containers, diamond,
  circuit, rings, ascent, plan, vitrine, flow, monolith, blueprint, replica, dunes, bridge,
  globe, horizon, contour, link, 'facade-light': facadeLight,
};

// slot → plate. Add a photo at src/assets/img/photos/<slot>.(jpg|webp) to override.
export const slots = {
  'hero-poster': 'skyline',
  'home-prologue': 'facade',
  'about-hero': 'horizon',
  'svc-franchise': 'replica', 'svc-setup': 'blueprint', 'svc-ops': 'flow', 'svc-brand': 'monolith', 'svc-startup': 'stairs',
  'ind-fnb': 'arches', 'ind-trading': 'containers', 'ind-realestate': 'plan', 'ind-retail': 'vitrine', 'ind-luxury': 'diamond',
  'ind-professional': 'columns', 'ind-technology': 'circuit', 'ind-investment': 'ascent', 'ind-healthcare': 'rings',
  'tl-2015': 'dunes', 'tl-2017': 'bridge', 'tl-2021': 'skyline2', 'tl-today': 'globe',
  'network': 'link', 'cta': 'contour', 'contact': 'horizon', 'vision': 'facade-light',
  'founder': 'facade',
};
