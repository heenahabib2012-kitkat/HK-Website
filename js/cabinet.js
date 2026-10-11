/* Industries: a lacquered display cabinet with nine glass-fronted niches. Each niche is
   lit from within and holds a sculpted porcelain object on a marble plinth, with an
   engraved brass plaque beneath. The selected niche warms to gold light and its object
   turns gold and slowly revolves. */
import { Mesh, arc, lathe, sphere, box, extrudeProfile } from './geo.js';
import { mat4, createGL, createProgram, createMesh, bindMesh, fitCanvas, visibleLoop, damp, prefersReducedMotion } from './gl.js';

const W = 1.0, G = 0.3, B = 0.34, DEPTH = 0.72;          // opening, mullion, border, niche depth
const EXT = 1.5 * W + G + B;                               // half-width of the cabinet face
const M_LACQUER = 0, M_GOLD = 1, M_SUEDE = 2, M_LIGHT = 3, M_MARBLE = 4, M_OBJECT = 5, M_PLAQUE = 6;
const PLINTH_H = 0.07, PLINTH_Z = -0.4;

export const NICHES = [];
for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
  const cx = (c - 1) * (W + G), cy = (1 - r) * (W + G);
  NICHES.push({ cx, cy, x0: cx - W / 2, x1: cx + W / 2, y0: cy - W / 2, y1: cy + W / 2 });
}

/* ---------- small geometry helpers ---------- */

function quad(m, a, b, c, d, n) { m.tri(a, b, c, n); m.tri(a, c, d, n); }

/** Vertical prism from a plan polygon in xz (clockwise when seen from above). */
function prism(m, plan, y0, y1) {
  const n = plan.length;
  for (let i = 0; i < n; i++) {
    const a = plan[i], b = plan[(i + 1) % n];
    const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    quad(m, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [-dz / l, 0, dx / l]);
  }
  for (let i = 1; i < n - 1; i++) m.tri([plan[0][0], y1, plan[0][1]], [plan[i + 1][0], y1, plan[i + 1][1]], [plan[i][0], y1, plan[i][1]], [0, 1, 0]);
}
const chamferSq = (w, c) => { const h = w / 2; return [[-h + c, -h], [-h, -h + c], [-h, h - c], [-h + c, h], [h - c, h], [h, h - c], [h, -h + c], [h - c, -h]]; };

/** A round tube swept along a polyline. */
function tube(m, path, r, seg = 10) {
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], tl = Math.hypot(...t);
    const T = t.map((v) => v / tl);
    let u = Math.abs(T[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    let n1 = [T[1] * u[2] - T[2] * u[1], T[2] * u[0] - T[0] * u[2], T[0] * u[1] - T[1] * u[0]];
    const l1 = Math.hypot(...n1); n1 = n1.map((v) => v / l1);
    const n2 = [T[1] * n1[2] - T[2] * n1[1], T[2] * n1[0] - T[0] * n1[2], T[0] * n1[1] - T[1] * n1[0]];
    for (let s = 0; s < seg; s++) {
      const q0 = (s / seg) * Math.PI * 2, q1 = ((s + 1) / seg) * Math.PI * 2;
      const N = (q) => [n1[0] * Math.cos(q) + n2[0] * Math.sin(q), n1[1] * Math.cos(q) + n2[1] * Math.sin(q), n1[2] * Math.cos(q) + n2[2] * Math.sin(q)];
      const Na = N(q0), Nb = N(q1);
      const P = (p, n) => [p[0] + n[0] * r, p[1] + n[1] * r, p[2] + n[2] * r];
      m.tri(P(a, Na), P(b, Na), P(b, Nb), Na, Na, Nb);
      m.tri(P(a, Na), P(b, Nb), P(a, Nb), Na, Nb, Nb);
    }
  }
}

/* ---------- the nine objects (built standing on y = 0, about 0.5 tall) ---------- */

const OBJECTS = [
  function cloche(m) {                       // F&B & Hospitality
    lathe(m, [[0, 0], [0.25, 0], [0.265, 0.012], [0.25, 0.024], [0, 0.024]]);
    lathe(m, [[0.215, 0.024], [0.222, 0.03], ...arc(0, 0.03, 0.205, 0.05, Math.PI / 2, 20)]);
    m.set('mat', M_GOLD);
    lathe(m, [[0, 0.232], [0.018, 0.236], [0.012, 0.25], ...arc(0, 0.272, 0.028, -1.2, Math.PI / 2, 8)], { seg: 28 });
    m.set('mat', M_OBJECT);
    m.transform(0, mat4.scaling(1.15, 1.6, 1.15));
  },
  function compass(m) {                      // Trading
    const from = m.count;
    lathe(m, [[0, 0], [0.2, 0], [0.215, 0.018], [0.215, 0.06], [0.2, 0.072], [0.185, 0.062], [0, 0.058]]);
    const needle = m.count;
    m.set('mat', M_GOLD);
    extrudeProfile(m, [[0, -0.16], [0.032, 0], [0, 0.16], [-0.032, 0]], 0.012, 0.006);
    m.transform(needle, mat4.multiply(mat4.translation(0, 0.068, 0), mat4.multiply(mat4.rotationY(0.5), mat4.rotationX(-Math.PI / 2))));
    sphere(m, 0, 0.074, 0, 0.014);
    m.set('mat', M_OBJECT);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; box(m, Math.cos(a) * 0.17 - 0.008, 0.058, Math.sin(a) * 0.17 - 0.008, Math.cos(a) * 0.17 + 0.008, 0.066, Math.sin(a) * 0.17 + 0.008); }
    m.transform(from, mat4.multiply(mat4.translation(0, 0.24, -0.02), mat4.rotationX(1.15)));
    box(m, -0.17, 0, -0.1, 0.17, 0.035, 0.1);
    box(m, -0.03, 0.035, -0.05, 0.03, 0.08, 0.02);
  },
  function books(m) {                        // Education
    const book = (y, rot, w, d, t) => {
      const f = m.count;
      m.set('mat', M_OBJECT);
      box(m, -w / 2, 0, -d / 2, w / 2, t, d / 2);
      m.set('mat', M_GOLD);                    // gilded page edges
      box(m, -w / 2 + 0.014, 0.012, -d / 2 - 0.003, w / 2 - 0.006, t - 0.012, d / 2 + 0.003);
      box(m, w / 2 - 0.002, 0.012, -d / 2 + 0.014, w / 2 + 0.003, t - 0.012, d / 2 - 0.014);
      m.set('mat', M_OBJECT);
      m.transform(f, mat4.multiply(mat4.translation(0, y, 0), mat4.rotationY(rot)));
    };
    book(0, 0.06, 0.5, 0.34, 0.1);
    book(0.1, -0.14, 0.46, 0.32, 0.085);
    book(0.185, 0.2, 0.42, 0.3, 0.09);
    book(0.275, -0.04, 0.38, 0.27, 0.075);
  },
  function tower(m) {                        // Real Estate
    prism(m, chamferSq(0.3, 0.06), 0, 0.22);
    prism(m, chamferSq(0.24, 0.05), 0.22, 0.4);
    prism(m, chamferSq(0.18, 0.04), 0.4, 0.54);
    prism(m, chamferSq(0.12, 0.03), 0.54, 0.62);
    box(m, -0.008, 0.62, -0.008, 0.008, 0.74, 0.008);
    for (let y = 0.04; y < 0.6; y += 0.045) {
      const w = y < 0.22 ? 0.3 : y < 0.4 ? 0.24 : y < 0.54 ? 0.18 : 0.12;
      box(m, -w / 2 - 0.004, y, -w / 2 - 0.004, w / 2 + 0.004, y + 0.006, w / 2 + 0.004);
    }
  },
  function bag(m) {                          // Retail
    box(m, -0.17, 0, -0.07, 0.17, 0.36, 0.07);
    box(m, -0.17, 0.33, -0.072, 0.17, 0.36, 0.072);
    m.set('mat', M_GOLD);
    for (const z of [-0.045, 0.045]) {
      const pts = arc(0, 0.36, 0.085, 0, Math.PI, 14).map(([x, y]) => [x, y, z]);
      tube(m, pts, 0.008);
    }
    m.set('mat', M_OBJECT);
    m.transform(0, mat4.rotationY(-0.35));
  },
  function perfume(m) {                      // Luxury & Fashion
    const f = m.count;
    extrudeProfile(m, [[-0.1, 0], [0.1, 0], [0.135, 0.04], [0.135, 0.3], [0.1, 0.34], [-0.1, 0.34], [-0.135, 0.3], [-0.135, 0.04]], 0.1, 0.03);
    m.transform(f, mat4.rotationY(0.35));
    m.set('mat', M_GOLD);
    lathe(m, [[0, 0.34], [0.036, 0.34], [0.032, 0.37], [0.046, 0.375], [0.046, 0.395], [0, 0.395]], { seg: 24 });
    m.set('mat', M_OBJECT);
    lathe(m, [[0, 0.395], [0.05, 0.395], [0.066, 0.43], [0.06, 0.5], [0.028, 0.53], [0, 0.535]], { seg: 8 });   // faceted stopper
  },
  function pen(m) {                          // Professional Services
    const f = m.count;
    lathe(m, [[0, 0], [0.012, 0.01], [0.022, 0.06], [0.026, 0.12], [0.03, 0.14], [0.03, 0.17], [0.026, 0.18], [0.028, 0.4], [0.03, 0.44], [0.022, 0.47], [0, 0.48]], { seg: 28 });
    m.set('mat', M_GOLD);
    box(m, 0.026, 0.3, -0.006, 0.038, 0.44, 0.006);       // clip
    extrudeProfile(m, [[0.012, 0.0], [-0.012, 0.0], [0.0, -0.075]], 0.008, 0.003);  // nib
    m.set('mat', M_OBJECT);
    m.transform(f, mat4.multiply(mat4.translation(-0.02, 0.17, 0), mat4.multiply(mat4.rotationZ(-1.25), mat4.translation(0, -0.2, 0))));
    // a small writing stand
    box(m, -0.2, 0, -0.1, 0.2, 0.03, 0.1);
    prism(m, [[-0.04, -0.03], [-0.04, 0.03], [0.04, 0.03], [0.04, -0.03]], 0.03, 0.1);
  },
  function chip(m) {                         // Technology
    const f = m.count;
    box(m, -0.15, -0.018, -0.15, 0.15, 0.018, 0.15);
    m.set('mat', M_GOLD);
    box(m, -0.07, 0.018, -0.07, 0.07, 0.03, 0.07);
    m.set('mat', M_OBJECT);
    for (let i = 0; i < 6; i++) {
      const t = -0.11 + i * 0.044;
      box(m, t - 0.01, -0.006, 0.15, t + 0.01, 0.006, 0.2);
      box(m, t - 0.01, -0.006, -0.2, t + 0.01, 0.006, -0.15);
      box(m, 0.15, -0.006, t - 0.01, 0.2, 0.006, t + 0.01);
      box(m, -0.2, -0.006, t - 0.01, -0.15, 0.006, t + 0.01);
    }
    m.transform(f, mat4.multiply(mat4.translation(0, 0.27, 0), mat4.rotationX(1.2)));
    box(m, -0.16, 0, -0.08, 0.16, 0.03, 0.08);
    box(m, -0.03, 0.03, -0.04, 0.03, 0.1, 0.0);
  },
  function coins(m) {                        // Investment
    const coin = [[0, 0], [0.072, 0], [0.078, 0.004], [0.078, 0.017], [0.072, 0.021], [0, 0.021]];
    const stacks = [[-0.12, 0.02, 7], [0.05, -0.05, 11], [0.16, 0.07, 4]];
    let k = 0;
    for (const [x, z, n] of stacks) for (let i = 0; i < n; i++) {
      const j = Math.sin(++k * 12.9898) * 0.006;
      lathe(m, coin, { seg: 36, ox: x + j, oy: i * 0.021, oz: z - j });
    }
  },
];

/* ---------- the cabinet ---------- */

function buildCabinet() {
  const m = new Mesh(['mat', 'niche', 'u', 'v']);
  const Z = 0, ZB = -0.9;
  m.set('niche', -1).set('mat', M_LACQUER);
  // the face, tiled around the openings
  const xs = [-EXT, ...NICHES.slice(0, 3).flatMap((n) => [n.x0, n.x1]), EXT];
  const ys = [-EXT, ...[6, 3, 0].flatMap((i) => [NICHES[i].y0, NICHES[i].y1]), EXT];
  for (let i = 0; i < xs.length - 1; i += 2) quad(m, [xs[i], -EXT, Z], [xs[i + 1], -EXT, Z], [xs[i + 1], EXT, Z], [xs[i], EXT, Z], [0, 0, 1]);
  for (let i = 1; i < xs.length - 1; i += 2) for (let j = 0; j < ys.length - 1; j += 2)
    quad(m, [xs[i], ys[j], Z], [xs[i + 1], ys[j], Z], [xs[i + 1], ys[j + 1], Z], [xs[i], ys[j + 1], Z], [0, 0, 1]);
  // carcass
  quad(m, [EXT, -EXT, Z], [EXT, -EXT, ZB], [EXT, EXT, ZB], [EXT, EXT, Z], [1, 0, 0]);
  quad(m, [-EXT, -EXT, ZB], [-EXT, -EXT, Z], [-EXT, EXT, Z], [-EXT, EXT, ZB], [-1, 0, 0]);
  // cornice and base, each with a fine gold line
  box(m, -EXT - 0.12, EXT, ZB - 0.06, EXT + 0.12, EXT + 0.2, Z + 0.1);
  box(m, -EXT - 0.06, -EXT - 0.3, ZB, EXT + 0.06, -EXT, Z + 0.05);
  m.set('mat', M_GOLD);
  box(m, -EXT - 0.125, EXT + 0.035, Z + 0.1, EXT + 0.125, EXT + 0.05, Z + 0.105);
  box(m, -EXT - 0.065, -EXT - 0.03, Z + 0.05, EXT + 0.065, -EXT - 0.015, Z + 0.055);

  const L = 1.5 * W + G + 0.13, t = 0.012;     // a fine gold inlay framing the grid of niches
  box(m, -L, L - t, Z, L, L, Z + 0.006); box(m, -L, -L - 0.13, Z, L, -L - 0.13 + t, Z + 0.006);
  box(m, -L, -L - 0.13, Z, -L + t, L, Z + 0.006); box(m, L - t, -L - 0.13, Z, L, L, Z + 0.006);
  NICHES.forEach((n, i) => {
    m.set('niche', i);
    const { x0, x1, y0, y1, cx } = n, zb = -DEPTH;
    m.set('mat', M_SUEDE);
    quad(m, [x0, y0, zb], [x1, y0, zb], [x1, y1, zb], [x0, y1, zb], [0, 0, 1]);
    quad(m, [x0, y0, Z], [x0, y0, zb], [x0, y1, zb], [x0, y1, Z], [1, 0, 0]);
    quad(m, [x1, y0, zb], [x1, y0, Z], [x1, y1, Z], [x1, y1, zb], [-1, 0, 0]);
    quad(m, [x0, y0, Z], [x1, y0, Z], [x1, y0, zb], [x0, y0, zb], [0, 1, 0]);
    quad(m, [x0, y1, zb], [x1, y1, zb], [x1, y1, Z], [x0, y1, Z], [0, -1, 0]);
    m.set('mat', M_LIGHT);
    quad(m, [x0 + 0.06, y1 - 0.002, -0.16], [x1 - 0.06, y1 - 0.002, -0.16], [x1 - 0.06, y1 - 0.002, -0.1], [x0 + 0.06, y1 - 0.002, -0.1], [0, -1, 0]);
    m.set('mat', M_MARBLE);
    box(m, cx - 0.27, y0, PLINTH_Z - 0.19, cx + 0.27, y0 + PLINTH_H, PLINTH_Z + 0.19);
    // gold beading around the opening
    m.set('mat', M_GOLD);
    const b = 0.028, d = 0.03;
    box(m, x0 - b, y1, Z, x1 + b, y1 + b, Z + d);
    box(m, x0 - b, y0 - b, Z, x1 + b, y0, Z + d);
    box(m, x0 - b, y0, Z, x0, y1, Z + d);
    box(m, x1, y0, Z, x1 + b, y1, Z + d);
    // engraved brass plaque
    m.set('mat', M_PLAQUE);
    const px0 = cx - 0.33, px1 = cx + 0.33, py1 = y0 - 0.075, py0 = py1 - 0.12, pz = Z + 0.012;
    const v = (x, y, u, vv) => { m.set('u', u).set('v', vv); m.v([x, y, pz], [0, 0, 1]); };
    const row = i / 9;
    v(px0, py0, 0, row + 1 / 9); v(px1, py0, 1, row + 1 / 9); v(px1, py1, 1, row);
    v(px0, py0, 0, row + 1 / 9); v(px1, py1, 1, row); v(px0, py1, 0, row);
    m.set('mat', M_GOLD);
    box(m, px0 - 0.008, py0 - 0.008, Z, px1 + 0.008, py1 + 0.008, pz - 0.001);
  });
  return m;
}

function buildGlass() {
  const m = new Mesh(['niche']);
  NICHES.forEach((n, i) => {
    m.set('niche', i);
    quad(m, [n.x0, n.y0, 0.012], [n.x1, n.y0, 0.012], [n.x1, n.y1, 0.012], [n.x0, n.y1, 0.012], [0, 0, 1]);
  });
  return m;
}

function plaqueCanvas(names) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 9 * 64;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  names.forEach((name, i) => {
    let size = 26;
    const label = name.toUpperCase();
    g.font = `500 ${size}px Jost, "Helvetica Neue", Arial, sans-serif`;
    if ('letterSpacing' in g) g.letterSpacing = '4px';
    while (g.measureText(label).width > 460 && size > 14) { size -= 1; g.font = `500 ${size}px Jost, "Helvetica Neue", Arial, sans-serif`; }
    g.fillText(label, 256, i * 64 + 33);
  });
  return c;
}

/* ---------- shaders ---------- */

const VS = `
attribute vec3 aPos; attribute vec3 aNormal; attribute float aMat; attribute float aNiche; attribute float aU; attribute float aV;
uniform mat4 uProj, uView, uModel; uniform float uHi[9]; uniform vec3 uCentre[9];
varying vec3 vW, vN, vC; varying float vMat, vHi, vNiche; varying vec2 vUV;
void main(){
  vec4 w = uModel * vec4(aPos, 1.0);
  vW = w.xyz; vN = mat3(uModel) * aNormal; vMat = aMat; vNiche = aNiche; vUV = vec2(aU, aV);
  int i = int(aNiche + 0.5);
  vHi = aNiche < -0.5 ? 0.0 : uHi[i];
  vC = aNiche < -0.5 ? vec3(0.0) : uCentre[i];
  gl_Position = uProj * uView * w;
}`;

const FS = `
precision highp float;
varying vec3 vW, vN, vC; varying float vMat, vHi, vNiche; varying vec2 vUV;
uniform vec3 uEye; uniform float uGold, uAny; uniform sampler2D uPlaque;
vec3 env(vec3 d){
  vec3 c = mix(vec3(0.01,0.02,0.06), vec3(0.05,0.09,0.24), smoothstep(-0.5, 0.9, d.y));
  float sb = dot(d, normalize(vec3(-0.45, 0.6, 0.65)));
  c += vec3(1.0,0.96,0.9) * smoothstep(0.9, 0.97, sb) * 2.0;
  float st = dot(d, normalize(vec3(0.75, 0.15, 0.65)));
  c += vec3(1.0,0.9,0.75) * smoothstep(0.95, 0.99, st) * 1.0;
  return c;
}
vec3 tone(vec3 c){ float m = max(max(c.r, c.g), c.b) + 1e-4; return c * ((1.0 - exp(-1.7 * m)) / m) * 1.08; }
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec3 N = normalize(vN), V = normalize(uEye - vW), R = reflect(-V, N);
  float NV = clamp(dot(N, V), 0.0, 1.0);
  bool inNiche = vNiche > -0.5;
  // each niche's own light, tucked behind the front of its ceiling
  vec3 Lp = vC + vec3(0.0, 0.43, -0.13);
  vec3 Ld = Lp - vW; float dist = length(Ld); vec3 L = Ld / dist;
  float fall = 1.0 / (1.0 + dist * dist * 2.2);
  float dim = 1.0 - uAny * (1.0 - vHi) * 0.35;           // the others dim a little when one is chosen
  vec3 lc = mix(vec3(1.0, 0.95, 0.88) * 1.25, vec3(1.0, 0.76, 0.42) * 2.3, vHi) * dim;
  vec3 K = normalize(vec3(-0.5, 0.6, 0.8));                 // room key light for the cabinet face
  vec3 H = normalize(L + V), HK = normalize(K + V);
  vec3 col;
  if (vMat < 0.5) {
    // deep navy lacquer
    float F = 0.04 + 0.96 * pow(1.0 - NV, 5.0);
    col = vec3(0.012, 0.03, 0.1) * (0.5 + 0.6 * max(dot(N, K), 0.0)) * (0.85 + 0.3 * smoothstep(-2.5, 2.5, vW.y));
    col += env(R) * mix(0.05, 0.9, F) * 0.7;
    col += vec3(1.0, 0.96, 0.9) * pow(max(dot(N, HK), 0.0), 260.0) * 0.7;
  } else if (vMat < 1.5) {
    vec3 F0 = vec3(1.0, 0.8, 0.46), Fg = F0 + (1.0 - F0) * pow(1.0 - NV, 5.0);
    col = (env(R) * 0.9 + vec3(0.3, 0.23, 0.12) + vec3(1.0, 0.95, 0.85) * pow(max(dot(N, HK), 0.0), 90.0) * 2.0) * Fg;
    if (inNiche) col += lc * Fg * pow(max(dot(N, H), 0.0), 40.0) * fall * 0.6;
  } else if (vMat < 2.5) {
    // suede-lined interior; a soft shadow of the object on the back wall and floor
    vec3 alb = mix(vec3(0.035, 0.07, 0.24), vec3(0.2, 0.13, 0.05), vHi * 0.8);
    float d = max(dot(N, L), 0.0) * 0.8 + 0.25;
    float sh = 1.0;
    if (N.z > 0.9) sh -= smoothstep(0.36, 0.06, length((vW.xy - vec2(vC.x + 0.02, vC.y - 0.18)) * vec2(1.5, 0.95))) * 0.55;
    if (N.y > 0.9) sh -= smoothstep(0.42, 0.18, length((vW.xz - vec2(vC.x, ${PLINTH_Z.toFixed(2)})) * vec2(0.9, 1.4))) * 0.4;
    float grain = hash(floor(vW.xy * 400.0) + floor(vW.z * 400.0)) * 0.06 + 0.97;
    col = alb * lc * d * fall * 2.4 * sh * grain;
    col += alb * 0.08;
  } else if (vMat < 3.5) {
    col = lc * 1.8 + vec3(0.3);                            // the light strip itself
  } else if (vMat < 4.5) {
    // dark marble plinth
    vec3 alb = vec3(0.02, 0.03, 0.075) + vec3(0.12, 0.13, 0.18) * pow(abs(sin((vW.x + vW.z * 1.7) * 9.0 + sin(vW.y * 30.0) * 2.0)), 40.0) * 0.5;
    col = alb * lc * (max(dot(N, L), 0.0) + 0.3) * fall * 2.0;
    col += lc * pow(max(dot(N, H), 0.0), 200.0) * fall * 0.9;
    col += env(R) * (0.04 + 0.96 * pow(1.0 - NV, 5.0)) * 0.3;
    if (N.y > 0.9) col *= 1.0 - smoothstep(0.22, 0.04, length(vW.xz - vec2(vC.x, ${PLINTH_Z.toFixed(2)}))) * 0.45;
  } else if (vMat < 5.5) {
    // porcelain object, gilding when chosen
    float d = max(dot(N, L), 0.0), wrap = dot(N, L) * 0.5 + 0.5;
    float F = 0.04 + 0.96 * pow(1.0 - NV, 5.0);
    float ao = mix(0.55, 1.0, smoothstep(0.0, 0.08, vW.y - (vC.y - 0.5 + ${PLINTH_H.toFixed(3)})));
    vec3 ivory = vec3(0.95, 0.93, 0.89) * (0.2 + wrap * 0.4 + d * 0.8) * lc * fall * 2.7 * ao + vec3(0.1, 0.11, 0.14) * ao;
    ivory += lc * pow(max(dot(N, H), 0.0), 180.0) * 0.9 * fall;
    ivory += env(R) * mix(0.03, 0.6, F) * 0.35;
    vec3 F0 = vec3(1.0, 0.8, 0.46), Fg = F0 + (1.0 - F0) * pow(1.0 - NV, 5.0);
    vec3 gold = (env(R) * 0.7 + vec3(0.25, 0.19, 0.09) + lc * (d * 0.6 + pow(max(dot(N, H), 0.0), 70.0) * 2.4) * fall * 1.4) * Fg * ao;
    col = mix(ivory, gold, uGold);
  } else {
    // brass plaque with engraved lettering
    float t = texture2D(uPlaque, vUV).r;
    vec3 brass = vec3(0.6, 0.45, 0.2) * (0.55 + 0.5 * max(dot(N, K), 0.0)) + env(R) * vec3(0.9, 0.7, 0.4) * 0.35;
    col = mix(brass, vec3(0.08, 0.05, 0.02), t * 0.9);
  }
  gl_FragColor = vec4(tone(col), 1.0);
}`;

const GLASS_VS = `
attribute vec3 aPos; attribute float aNiche;
uniform mat4 uProj, uView; uniform float uHi[9];
varying vec3 vW; varying float vHi;
void main(){ vW = aPos; vHi = uHi[int(aNiche + 0.5)]; gl_Position = uProj * uView * vec4(aPos, 1.0); }`;
const GLASS_FS = `
precision highp float;
varying vec3 vW; varying float vHi; uniform vec3 uEye;
void main(){
  vec3 V = normalize(uEye - vW);
  float F = 0.04 + 0.96 * pow(1.0 - V.z, 5.0);
  // two soft diagonal reflections of the room, sliding as the viewer moves
  float k = vW.x * 0.75 + vW.y - uEye.x * 0.35;
  float sheen = smoothstep(0.1, 0.0, abs(fract(k * 0.42) - 0.5) - 0.06) * 0.55 + smoothstep(0.04, 0.0, abs(fract(k * 0.42 + 0.17) - 0.5) - 0.01) * 0.35;
  float a = (0.05 + sheen * 0.14 + F * 0.4) * (1.0 - vHi * 0.55);
  gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * a, a);
}`;

/* ---------- scene ---------- */

export function initCabinet(canvas, { names, onPick } = {}) {
  const gl = createGL(canvas);
  if (!gl) return null;
  let prog, glassProg;
  try { prog = createProgram(gl, VS, FS); glassProg = createProgram(gl, GLASS_VS, GLASS_FS); }
  catch (e) { console.warn(e); return null; }

  const toGL = (m) => createMesh(gl, {
    aPos: { data: m.pos, size: 3 }, aNormal: { data: m.nrm, size: 3 },
    ...(m.attrs.mat ? { aMat: { data: m.attrs.mat, size: 1 } } : {}),
    aNiche: { data: m.attrs.niche, size: 1 },
    ...(m.attrs.u ? { aU: { data: m.attrs.u, size: 1 }, aV: { data: m.attrs.v, size: 1 } } : {}),
  }, m.count);

  const cabinet = toGL(buildCabinet());
  const glass = toGL(buildGlass());
  const objects = OBJECTS.map((build, i) => {
    const m = new Mesh(['mat', 'niche', 'u', 'v']);
    m.set('mat', M_OBJECT).set('niche', i);
    build(m);
    return toGL(m);
  });

  const plaqueTex = gl.createTexture();
  const uploadPlaques = () => {
    gl.bindTexture(gl.TEXTURE_2D, plaqueTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, plaqueCanvas(names));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  uploadPlaques();
  if (document.fonts) document.fonts.ready.then(uploadPlaques);

  const centres = new Float32Array(27);
  NICHES.forEach((n, i) => { centres[i * 3] = n.cx; centres[i * 3 + 1] = n.cy; centres[i * 3 + 2] = 0; });

  const reduced = prefersReducedMotion();
  const hi = new Float32Array(9);
  const spin = new Float32Array(9);
  const gold = new Float32Array(9);
  const st = { active: -1, any: 0, mx: 0, my: 0, tx: 0, ty: 0, screen: [] };

  const host = canvas.parentElement;
  const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; };
  host.addEventListener('pointermove', (e) => {
    const [x, y, r] = local(e);
    st.tx = (x / r.width) * 2 - 1; st.ty = (y / r.height) * 2 - 1;
    const i = pick(x, y);
    canvas.style.cursor = i >= 0 ? 'pointer' : '';
    if (i >= 0 && e.pointerType === 'mouse') onPick && onPick(i);
  });
  host.addEventListener('pointerleave', () => { st.tx = 0; st.ty = 0; });
  canvas.addEventListener('click', (e) => { const [x, y] = local(e); const i = pick(x, y); if (i >= 0) onPick && onPick(i); });
  const pick = (x, y) => st.screen.findIndex((s) => s && x > s.l && x < s.r && y > s.t && y < s.b);

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  const frame = (t, dt) => {
    fitCanvas(canvas, 2);
    const w = canvas.width, h = canvas.height, aspect = w / h;
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    st.mx = damp(st.mx, st.tx, 2.2, dt);
    st.my = damp(st.my, st.ty, 2.2, dt);
    st.any = damp(st.any, st.active >= 0 ? 1 : 0, 3, dt);
    for (let i = 0; i < 9; i++) {
      const on = i === st.active ? 1 : 0;
      hi[i] = damp(hi[i], on, 3.5, dt);
      gold[i] = damp(gold[i], on, 3, dt);
      spin[i] = on && !reduced ? spin[i] + dt * 0.5 : damp(spin[i], Math.round(spin[i] / (Math.PI * 2)) * Math.PI * 2, 1.6, dt);
    }

    const fov = 0.5, tn = Math.tan(fov / 2);
    const halfH = EXT + 0.45, halfW = EXT + 0.35;
    const dist = Math.max(halfH / tn, halfW / (tn * aspect)) + 0.6;
    const eye = [st.mx * 1.6 + (reduced ? 0 : Math.sin(t * 0.15) * 0.25), -st.my * 1.0 + 0.25, dist];
    const target = [0, -0.05, -0.3];
    const view = mat4.lookAt(eye, target, [0, 1, 0]);
    const proj = mat4.perspective(fov, aspect, 0.5, 60);

    gl.useProgram(prog.program);
    const u = prog.uniforms;
    gl.uniformMatrix4fv(u.uProj, false, proj);
    gl.uniformMatrix4fv(u.uView, false, view);
    gl.uniform3fv(u.uEye, eye);
    gl.uniform1fv(u.uHi, hi);
    gl.uniform3fv(u.uCentre, centres);
    gl.uniform1f(u.uAny, st.any);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, plaqueTex);
    gl.uniform1i(u.uPlaque, 0);

    gl.uniformMatrix4fv(u.uModel, false, mat4.identity());
    gl.uniform1f(u.uGold, 0);
    bindMesh(gl, prog, cabinet);
    gl.drawArrays(gl.TRIANGLES, 0, cabinet.count);

    objects.forEach((mesh, i) => {
      const n = NICHES[i];
      const model = mat4.multiply(mat4.translation(n.cx, n.y0 + PLINTH_H, PLINTH_Z), mat4.multiply(mat4.rotationY(spin[i]), mat4.scaling(0.82, 0.82, 0.82)));
      gl.uniformMatrix4fv(u.uModel, false, model);
      gl.uniform1f(u.uGold, gold[i]);
      bindMesh(gl, prog, mesh);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
    });

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.useProgram(glassProg.program);
    gl.uniformMatrix4fv(glassProg.uniforms.uProj, false, proj);
    gl.uniformMatrix4fv(glassProg.uniforms.uView, false, view);
    gl.uniform3fv(glassProg.uniforms.uEye, eye);
    gl.uniform1fv(glassProg.uniforms.uHi, hi);
    bindMesh(gl, glassProg, glass);
    gl.drawArrays(gl.TRIANGLES, 0, glass.count);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    // opening rectangles on screen, for picking
    const vp = mat4.multiply(proj, view), cw = canvas.clientWidth, ch = canvas.clientHeight;
    const px = (p) => { const q = mat4.transformPoint(vp, p); return [(q[0] * 0.5 + 0.5) * cw, (1 - (q[1] * 0.5 + 0.5)) * ch]; };
    NICHES.forEach((n, i) => {
      const a = px([n.x0, n.y1, 0]), b = px([n.x1, n.y0 - 0.22, 0]);
      st.screen[i] = { l: a[0], r: b[0], t: a[1], b: b[1] };
    });
  };

  const loop = visibleLoop(canvas, frame);
  return { select(i) { st.active = i; loop.kick(); } };
}
