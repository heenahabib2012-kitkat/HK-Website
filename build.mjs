// HK Business Consultancy — static site builder
// Composes src/pages/*.html with shared partials into dist/, copies assets,
// self-hosts fonts, generates the architectural art plates and the world dot map.
// Usage: node build.mjs   (or: npm run build)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { feature } from 'topojson-client';
import { plates, slots } from './src/data/plates.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));

const rm = (p) => fs.rmSync(p, { recursive: true, force: true });
const mkdir = (p) => fs.mkdirSync(p, { recursive: true });
const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => { mkdir(path.dirname(p)); fs.writeFileSync(p, s); };
const copyDir = (from, to) => { if (fs.existsSync(from)) fs.cpSync(from, to, { recursive: true }); };

rm(DIST);
mkdir(DIST);

/* ---------- assets ---------- */
copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
rm(path.join(DIST, 'assets/img/photos/README.md'));

// Fonts (self-hosted, latin + latin-ext variable woff2)
const fontFiles = {
  '@fontsource-variable/cormorant-garamond': [
    'cormorant-garamond-latin-wght-normal.woff2',
    'cormorant-garamond-latin-wght-italic.woff2',
  ],
  '@fontsource-variable/manrope': ['manrope-latin-wght-normal.woff2'],
};
mkdir(path.join(DIST, 'assets/fonts'));
for (const [pkg, files] of Object.entries(fontFiles)) {
  for (const f of files) {
    fs.copyFileSync(path.join(ROOT, 'node_modules', pkg, 'files', f), path.join(DIST, 'assets/fonts', f));
  }
}

/* ---------- art plates ---------- */
const photoFor = (slot) => {
  for (const ext of ['webp', 'jpg', 'jpeg', 'png', 'avif']) {
    const rel = `assets/img/photos/${slot}.${ext}`;
    if (fs.existsSync(path.join(SRC, rel))) return rel;
  }
  return null;
};
for (const [kind, fn] of Object.entries(plates)) {
  write(path.join(DIST, `assets/img/plates/${kind}.svg`), fn());
}
// media token -> inline custom properties (photo overrides plate when supplied)
const media = (slot) => {
  const kind = slots[slot];
  if (!kind) throw new Error(`Unknown media slot: ${slot}`);
  const photo = photoFor(slot);
  // url() inside custom properties resolves against the consuming stylesheet,
  // so the image is set directly on the element (relative to the page).
  const bg = photo ? `url(${photo})` : `url(assets/img/plates/${kind}.svg)`;
  return `style="background-image:${bg}" data-media="${slot}"${photo ? ' data-photo' : ''}`;
};

/* ---------- world dot map ---------- */
function buildDotMap() {
  const topo = JSON.parse(read(path.join(ROOT, 'node_modules/world-atlas/land-110m.json')));
  const land = feature(topo, topo.objects.land);
  const polys = [];
  for (const f of land.features) {
    const g = f.geometry;
    if (g.type === 'Polygon') polys.push(g.coordinates);
    else if (g.type === 'MultiPolygon') polys.push(...g.coordinates);
  }
  const inRing = (x, y, ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const isLand = (lon, lat) => polys.some((p) => inRing(lon, lat, p[0]) && !p.slice(1).some((h) => inRing(lon, lat, h)));
  const W = 1000, H = 470, LAT_TOP = 78, LAT_BOT = -56;
  const px = (lon) => ((lon + 180) / 360) * W;
  const py = (lat) => ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * H;
  const step = 1.9;
  let d = '';
  for (let lat = LAT_TOP; lat >= LAT_BOT; lat -= step) {
    const row = Math.round((LAT_TOP - lat) / step);
    for (let lon = -180 + (row % 2 ? step / 2 : 0); lon < 180; lon += step) {
      if (isLand(lon, lat)) d += `M${px(lon).toFixed(1)} ${py(lat).toFixed(1)}h0`;
    }
  }
  return { d, W, H, px, py };
}
const dotMap = buildDotMap();
const hubs = {
  dubai: [55.27, 25.2],
  riyadh: [46.7, 24.7], kuwait: [47.98, 29.37], doha: [51.53, 25.29],
  london: [-0.13, 51.5], paris: [2.35, 48.86],
  mumbai: [72.88, 19.07], singapore: [103.8, 1.35], hongkong: [114.17, 22.3],
  nairobi: [36.82, -1.29], lagos: [3.38, 6.52],
  newyork: [-74.0, 40.71], saopaulo: [-46.63, -23.55],
};
const regionHubs = {
  gcc: ['riyadh', 'kuwait', 'doha'],
  europe: ['london', 'paris'],
  asia: ['mumbai', 'singapore', 'hongkong'],
  africa: ['nairobi', 'lagos'],
  americas: ['newyork', 'saopaulo'],
};
function mapSvg({ id = 'world-map', interactive = true } = {}) {
  const { d, W, H, px, py } = dotMap;
  const [dx, dy] = [px(hubs.dubai[0]), py(hubs.dubai[1])];
  let arcs = '', nodes = '';
  for (const [region, list] of Object.entries(regionHubs)) {
    for (const h of list) {
      const [x, y] = [px(hubs[h][0]), py(hubs[h][1])];
      const mx = (dx + x) / 2, my = (dy + y) / 2;
      const dist = Math.hypot(x - dx, y - dy);
      const cy = my - Math.min(160, dist * 0.42);
      arcs += `<path class="map-arc" data-region="${region}" pathLength="1" d="M${dx.toFixed(1)} ${dy.toFixed(1)}Q${mx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}"/>`;
      nodes += `<g class="map-node" data-region="${region}"><circle r="7" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" class="map-node__halo"/><circle r="2.6" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}"/></g>`;
    }
  }
  return `<svg class="world-map${interactive ? ' world-map--interactive' : ''}" id="${id}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Map illustrating commercial corridors connecting the UAE with the GCC, Europe, Asia, Africa and the Americas">
  <path class="map-dots" d="${d}"/>
  <g class="map-arcs">${arcs}</g>
  <g class="map-nodes">${nodes}</g>
  <g class="map-hub"><circle class="map-hub__pulse" cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="6"/><circle class="map-hub__ring" cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="9"/><circle class="map-hub__core" cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="3.4"/><text x="${(dx + 14).toFixed(1)}" y="${(dy + 22).toFixed(1)}" class="map-hub__label">DUBAI · UAE</text></g>
</svg>`;
}

/* ---------- pages ---------- */
const partial = (name) => read(path.join(SRC, 'partials', `${name}.html`));
const pagesDir = path.join(SRC, 'pages');
const pages = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.html'));
const year = new Date().getFullYear();

function render(tpl, ctx) {
  return tpl
    .replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => render(partial(n), ctx))
    .replace(/\{\{media\s+([\w-]+)\s*\}\}/g, (_, s) => media(s))
    .replace(/\{\{map(?:\s+([\w-]+))?\s*\}\}/g, (_, id) => mapSvg({ id: id || 'world-map' }))
    .replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, key) => {
      const v = key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);
      return v == null ? m : String(v);
    });
}

const analytics = config.analytics?.ga4
  ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${config.analytics.ga4}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${config.analytics.ga4}',{anonymize_ip:true});</script>`
  : '';

// Optional produced brand film: src/assets/video/hk-brand-film.mp4 (+ -mobile.mp4, .webm)
const vid = (n) => fs.existsSync(path.join(SRC, 'assets/video', n)) ? `assets/video/${n}` : null;
const heroVideo = vid('hk-brand-film.mp4')
  ? `<video class="hero__video" data-video muted loop playsinline preload="metadata"${vid('hk-brand-film-mobile.mp4') ? ` data-mobile-src="${vid('hk-brand-film-mobile.mp4')}"` : ''}>${vid('hk-brand-film.webm') ? `<source src="${vid('hk-brand-film.webm')}" type="video/webm">` : ''}<source src="${vid('hk-brand-film.mp4')}" type="video/mp4"></video>`
  : '';

const sitemap = [];
for (const file of pages) {
  const raw = read(path.join(pagesDir, file));
  const m = raw.match(/^---json\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error(`Missing front matter in ${file}`);
  const meta = JSON.parse(m[1]);
  const body = raw.slice(m[0].length);
  const slug = file.replace(/\.html$/, '');
  const canonical = `${config.siteUrl}/${slug === 'index' ? '' : file}`;
  const nav = Object.fromEntries(['index', 'about', 'expertise', 'industries', 'global-reach', 'network', 'clients', 'contact'].map((k) => [k, k === slug ? ' aria-current="page"' : '']));
  const ctx = {
    ...meta, config, year, canonical, nav, analytics, heroVideo,
    bodyClass: meta.bodyClass || '',
    scripts: (meta.scripts || []).map((s) => `<script src="assets/js/${s}" defer></script>`).join('\n'),
    preload: meta.preload || '',
    ogImage: `${config.siteUrl}/assets/img/og-image.jpg`,
  };
  const html = render(partial('layout'), { ...ctx, content: '{{CONTENT}}' }).replace('{{CONTENT}}', render(body, ctx));
  write(path.join(DIST, file), html);
  if (!meta.noindex) sitemap.push(canonical);
}

write(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${config.siteUrl}/sitemap.xml\n`);

// Report missing brand assets so nothing ships silently with interim art
const pending = [];
if (!photoFor('founder')) pending.push('src/assets/img/photos/founder.jpg  (founder portrait — Habib Koya Marapatta)');
const unsupplied = Object.keys(slots).filter((s) => s !== 'founder' && !photoFor(s));
console.log(`Built ${pages.length} pages → dist/`);
if (pending.length) console.log('Pending brand assets:\n  ' + pending.join('\n  '));
console.log(`Photography slots using architectural art plates: ${unsupplied.length}/${Object.keys(slots).length - 1}`);
