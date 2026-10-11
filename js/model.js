/* Expertise: an architect's presentation model. Matte white card buildings on a lacquered
   site plinth with etched roads, a water channel and model trees, lit by a low sun with
   real (shadow-mapped) shadows. The selected building turns brushed brass. */
import { mat4, createGL, createProgram, createMesh, bindMesh, fitCanvas, visibleLoop, damp, clamp, prefersReducedMotion } from './gl.js';

const K_CONTEXT = 0, K_FACADE = 1, K_SITE = 2, K_PLINTH = 3, K_TREE = 4;
const SITE = { x0: -7.6, x1: 7.6, z0: -5.1, z1: 5.1, depth: 0.5 };
const ROADS_X = [-1.5, 3.7], ROADS_Z = [-1.7], ROAD_W = 0.42;
const shoreZ = (x) => 2.75 + 0.55 * Math.sin(x * 0.45 + 0.6);

/* ---------- geometry ---------- */

class Geo {
  constructor() { this.pos = []; this.nrm = []; this.kind = []; this.bld = []; }
  tri(a, b, c, n, kind, bld) {
    for (const v of [a, b, c]) { this.pos.push(v[0], v[1], v[2]); this.nrm.push(n[0], n[1], n[2]); this.kind.push(kind); this.bld.push(bld); }
  }
  quad(a, b, c, d, n, k, id) { this.tri(a, b, c, n, k, id); this.tri(a, c, d, n, k, id); }
  /** Vertical prism from a CCW plan polygon (xz), optionally rotated about its own centre. */
  prism(plan, y0, y1, k, id, { cx = 0, cz = 0, rot = 0, top = true } = {}) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const P = plan.map(([x, z]) => [cx + x * c - z * s, cz + x * s + z * c]);
    const n = P.length;
    for (let i = 0; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n];
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
      const nn = [-dz / l, 0, dx / l];
      this.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], nn, k, id);
    }
    if (top) for (let i = 1; i < n - 1; i++) this.tri([P[0][0], y1, P[0][1]], [P[i + 1][0], y1, P[i + 1][1]], [P[i][0], y1, P[i][1]], [0, 1, 0], k, id);
  }
  box(cx, cz, w, d, y0, y1, k, id, rot = 0) {
    this.prism([[-w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2], [w / 2, -d / 2]], y0, y1, k, id, { cx, cz, rot });
  }
}

// plan helpers (CCW when viewed from above with +x right, +z toward viewer → listed clockwise in x/z)
const rect = (w, d) => [[-w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2], [w / 2, -d / 2]];
const chamfered = (w, c) => {
  const h = w / 2;
  return [[-h + c, -h], [-h, -h + c], [-h, h - c], [-h + c, h], [h - c, h], [h, h - c], [h, -h + c], [h - c, -h]];
};
const ellipse = (rx, rz, n = 40) => Array.from({ length: n }, (_, i) => {
  const a = -(i / n) * Math.PI * 2;
  return [Math.cos(a) * rx, Math.sin(a) * rz];
});

/* The six disciplines, each its own piece of architecture. */
const BUILDINGS = [
  { // 0 Business Strategy — a slender stepped tower, the district's landmark
    x: 1.1, z: 0.1, h: 5.6,
    build(g, id, x, z) {
      const tiers = [[1.25, 0, 1.7], [1.02, 1.7, 3.1], [0.8, 3.1, 4.2], [0.58, 4.2, 4.95]];
      for (const [w, y0, y1] of tiers) g.prism(chamfered(w, w * 0.22), y0, y1, K_FACADE, id, { cx: x, cz: z });
      g.box(x, z, 0.07, 0.07, 4.95, 5.6, K_FACADE, id);
    },
  },
  { // 1 Market Entry — a gateway: twin towers joined by a sky bridge
    x: -4.2, z: -3.25, h: 2.75,
    build(g, id, x, z) {
      g.box(x, z, 2.5, 1.05, 0, 0.32, K_FACADE, id);
      g.box(x - 0.82, z, 0.62, 0.72, 0.32, 2.75, K_FACADE, id);
      g.box(x + 0.82, z, 0.62, 0.72, 0.32, 2.75, K_FACADE, id);
      g.box(x, z, 1.04, 0.6, 2.2, 2.62, K_FACADE, id);
    },
  },
  { // 2 Corporate & Commercial Advisory — a disciplined block with vertical fins
    x: 5.65, z: -3.3, h: 3.1,
    build(g, id, x, z) {
      g.box(x, z, 2.1, 1.45, 0, 0.55, K_FACADE, id);
      g.box(x, z - 0.1, 1.25, 0.82, 0.55, 3.1, K_FACADE, id);
      for (let i = 0; i <= 8; i++) {
        const fx = x - 0.6 + i * 0.15;
        g.box(fx, z + 0.33, 0.028, 0.08, 0.55, 3.1, K_FACADE, id);
        g.box(fx, z - 0.53, 0.028, 0.08, 0.55, 3.1, K_FACADE, id);
      }
    },
  },
  { // 3 Franchising — one pavilion, repeated: the same proven form, four times
    x: -4.55, z: 0.25, h: 0.95,
    build(g, id, x, z) {
      for (let i = 0; i < 4; i++) {
        const px = x - 1.2 + i * 0.8, w = 0.56, d = 0.72, eave = 0.62, ridge = 0.95;
        g.box(px, z, w, d, 0, eave, K_FACADE, id);
        // pitched roof
        const a = [px - w / 2, eave, z - d / 2], b = [px + w / 2, eave, z - d / 2], c = [px + w / 2, eave, z + d / 2], e = [px - w / 2, eave, z + d / 2];
        const r0 = [px, ridge, z - d / 2], r1 = [px, ridge, z + d / 2];
        const sl = Math.hypot(w / 2, ridge - eave), nx = (ridge - eave) / sl, ny = (w / 2) / sl;
        g.quad(e, a, r0, r1, [-nx, ny, 0], K_FACADE, id);
        g.quad(b, c, r1, r0, [nx, ny, 0], K_FACADE, id);
        g.tri(a, b, r0, [0, 0, -1], K_FACADE, id);
        g.tri(c, e, r1, [0, 0, 1], K_FACADE, id);
      }
    },
  },
  { // 4 F&B & Hospitality — an elliptical hotel tower with a crown
    x: 5.2, z: 0.0, h: 3.65,
    build(g, id, x, z) {
      g.prism(ellipse(1.15, 0.8), 0, 0.42, K_FACADE, id, { cx: x, cz: z });
      g.prism(ellipse(0.82, 0.5), 0.42, 3.4, K_FACADE, id, { cx: x, cz: z, rot: 0.35 });
      g.prism(ellipse(0.9, 0.57), 3.4, 3.48, K_FACADE, id, { cx: x, cz: z, rot: 0.35 });
      g.prism(ellipse(0.62, 0.36), 3.48, 3.65, K_FACADE, id, { cx: x, cz: z, rot: 0.35 });
    },
  },
  { // 5 Trading & Investment — a tower that turns as it rises
    x: 1.1, z: -3.35, h: 4.0,
    build(g, id, x, z) {
      g.box(x, z, 1.6, 1.3, 0, 0.3, K_FACADE, id);
      const n = 24;
      for (let i = 0; i < n; i++) {
        const y0 = 0.3 + i * 0.155, y1 = y0 + 0.14;
        g.prism(rect(0.82, 0.82), y0, y1, K_FACADE, id, { cx: x, cz: z, rot: i * 0.045 });
        g.prism(rect(0.7, 0.7), y1, y1 + 0.015, K_FACADE, id, { cx: x, cz: z, rot: i * 0.045 });
      }
    },
  },
];

function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

function buildWorld() {
  const g = new Geo();
  // plinth
  const { x0, x1, z0, z1, depth } = SITE;
  g.quad([x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], [0, 1, 0], K_SITE, -1);
  g.quad([x0, -depth, z1], [x1, -depth, z1], [x1, 0, z1], [x0, 0, z1], [0, 0, 1], K_PLINTH, -1);
  g.quad([x1, -depth, z1], [x1, -depth, z0], [x1, 0, z0], [x1, 0, z1], [1, 0, 0], K_PLINTH, -1);
  g.quad([x0, -depth, z0], [x0, -depth, z1], [x0, 0, z1], [x0, 0, z0], [-1, 0, 0], K_PLINTH, -1);
  g.quad([x1, -depth, z0], [x0, -depth, z0], [x0, 0, z0], [x1, 0, z0], [0, 0, -1], K_PLINTH, -1);

  const foot = BUILDINGS.map((b, i) => {
    const r = [2.0, 2.0, 1.8, 1.8, 1.85, 1.4][i];
    return { x: b.x, z: b.z, r };
  });
  BUILDINGS.forEach((b, i) => b.build(g, i, b.x, b.z));

  // surrounding context — lower, plainer massing so the six read clearly
  const rand = rng(7);
  const free = (x, z, m) => {
    if (x < x0 + 0.5 || x > x1 - 0.5 || z < z0 + 0.5) return false;
    if (z > shoreZ(x) - 0.55 - m) return false;
    if (ROADS_X.some((rx) => Math.abs(x - rx) < ROAD_W / 2 + m + 0.08)) return false;
    if (ROADS_Z.some((rz) => Math.abs(z - rz) < ROAD_W / 2 + m + 0.08)) return false;
    return foot.every((f) => Math.abs(x - f.x) > f.r / 2 + m + 0.25 || Math.abs(z - f.z) > f.r / 2 + m + 0.25);
  };
  for (let gx = x0 + 0.7; gx < x1 - 0.4; gx += 0.95) {
    for (let gz = z0 + 0.7; gz < z1; gz += 0.95) {
      const w = 0.42 + rand() * 0.3, d = 0.42 + rand() * 0.3, x = gx + (rand() - 0.5) * 0.12, z = gz + (rand() - 0.5) * 0.12;
      if (!free(x, z, Math.max(w, d) / 2) || rand() < 0.4) continue;
      const h = 0.18 + Math.pow(rand(), 2.2) * 0.75;
      g.box(x, z, w, d, 0, h, K_CONTEXT, 6);
    }
  }

  // model trees: tiny spheres on stems, lining the roads and the waterfront
  const tree = (x, z, s) => {
    g.box(x, z, 0.03, 0.03, 0, 0.12 * s, K_TREE, 7);
    const segs = 12, rings = 7, r = 0.13 * s, cy = 0.2 * s;
    for (let j = 0; j < rings; j++) for (let i = 0; i < segs; i++) {
      const p = (jj, ii) => {
        const th = (jj / rings) * Math.PI, ph = (ii / segs) * Math.PI * 2;
        return [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
      };
      const a = p(j, i), b = p(j + 1, i), c = p(j + 1, i + 1), d = p(j, i + 1);
      const at = (v) => [x + v[0] * r, cy + v[1] * r, z + v[2] * r];
      const n = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2];
      g.quad(at(a), at(d), at(c), at(b), n, K_TREE, 7);
    }
  };
  const treeOk = (x, z) => free(x, z, 0.02) || (z < shoreZ(x) - 0.25 && z > shoreZ(x) - 0.6);
  for (const rz of ROADS_Z) for (let x = x0 + 0.6; x < x1 - 0.3; x += 1.05) for (const side of [1]) {
    const z = rz + side * (ROAD_W / 2 + 0.16);
    if (!ROADS_X.some((rx) => Math.abs(x - rx) < 0.5) && foot.every((f) => Math.hypot(x - f.x, z - f.z) > f.r * 0.62)) tree(x, z, 0.75 + rand() * 0.2);
  }
  for (let x = x0 + 0.5; x < x1 - 0.3; x += 0.85) {
    const z = shoreZ(x) - 0.4;
    if (treeOk(x, z) && foot.every((f) => Math.hypot(x - f.x, z - f.z) > f.r * 0.62)) tree(x, z, 0.8 + rand() * 0.25);
  }
  return g;
}

/* ---------- shaders ---------- */

const SHADOW_VS = `
attribute vec3 aPos; uniform mat4 uLightVP;
void main(){ gl_Position = uLightVP * vec4(aPos, 1.0); }`;
const SHADOW_FS = `
precision highp float;
vec4 pack(float d){ vec4 e = fract(vec4(1.0, 255.0, 65025.0, 16581375.0) * d); return e - e.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0); }
void main(){ gl_FragColor = pack(gl_FragCoord.z); }`;

const VS = `
attribute vec3 aPos; attribute vec3 aNormal; attribute float aKind; attribute float aBld;
uniform mat4 uProj, uView, uLightVP; uniform float uHi[8];
varying vec3 vW, vN; varying vec4 vL; varying float vKind, vHi;
void main(){
  vW = aPos; vN = aNormal; vKind = aKind;
  vHi = aBld < -0.5 ? 0.0 : uHi[int(aBld + 0.5)];
  vL = uLightVP * vec4(aPos + aNormal * 0.012, 1.0);
  gl_Position = uProj * uView * vec4(aPos, 1.0);
}`;

const FS = `
precision highp float;
varying vec3 vW, vN; varying vec4 vL; varying float vKind, vHi;
uniform vec3 uEye, uSun; uniform sampler2D uShadow; uniform float uTexel, uTime;
float unpack(vec4 r){ return dot(r, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0)); }
float shadow(){
  vec3 p = vL.xyz / vL.w * 0.5 + 0.5;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return 1.0;
  float s = 0.0;
  for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) {
    float d = unpack(texture2D(uShadow, p.xy + vec2(float(i), float(j)) * uTexel));
    s += p.z - 0.0015 > d ? 0.0 : 1.0;
  }
  return s / 25.0;
}
float shoreZ(float x){ return 2.75 + 0.55 * sin(x * 0.45 + 0.6); }
float line(float v, float w){ return 1.0 - smoothstep(0.0, w, abs(v)); }
void main(){
  vec3 N = normalize(vN), V = normalize(uEye - vW), L = normalize(uSun);
  float sh = shadow();
  float dif = max(dot(N, L), 0.0) * sh;
  float hemi = 0.5 + 0.5 * N.y;
  vec3 col;
  if (vKind < 1.5) {
    // matte white card, with floor lines and mullions scored into the facades
    vec3 card = vec3(0.90, 0.89, 0.86);
    float vert = 1.0 - abs(N.y);
    float fl = 0.0, mu = 0.0;
    if (vKind > 0.5) {
      fl = step(fract(vW.y / 0.155), 0.07);
      float h = abs(N.x) > abs(N.z) ? vW.z : vW.x;
      mu = step(fract(h / 0.13), 0.05);
    }
    vec3 brass = vec3(0.74, 0.56, 0.27);
    vec3 alb = mix(card, brass, vHi);
    alb *= 1.0 - vert * (fl * 0.13 + mu * 0.05) * (1.0 - vHi * 0.4);
    float ao = mix(0.62, 1.0, smoothstep(0.0, 0.45, vW.y));
    col = alb * (0.42 * hemi + 0.8 * dif) * ao;
    // brushed-brass sheen and warm interior light along the floor lines when selected
    vec3 H = normalize(L + V);
    col += vec3(1.0, 0.86, 0.6) * pow(max(dot(N, H), 0.0), 36.0) * 0.55 * vHi * sh;
    col += vec3(1.0, 0.78, 0.42) * vert * fl * vHi * 0.55;
    col += vec3(0.25, 0.35, 0.8) * (1.0 - hemi) * 0.06;
  } else if (vKind < 2.5) {
    // the site: lacquered midnight ground, etched roads, a water channel
    vec2 p = vW.xz;
    vec3 ground = vec3(0.028, 0.055, 0.17);
    float road = 0.0, centre = 0.0;
    ${ROADS_X.map((x) => `road = max(road, 1.0 - step(${(ROAD_W / 2).toFixed(3)}, abs(p.x - (${x.toFixed(2)})))); centre = max(centre, line(p.x - (${x.toFixed(2)}), 0.012));`).join('\n    ')}
    ${ROADS_Z.map((z) => `road = max(road, 1.0 - step(${(ROAD_W / 2).toFixed(3)}, abs(p.y - (${z.toFixed(2)})))); centre = max(centre, line(p.y - (${z.toFixed(2)}), 0.012));`).join('\n    ')}
    col = mix(ground, vec3(0.05, 0.085, 0.22), road);
    col = mix(col, vec3(0.80, 0.62, 0.30), centre * 0.7 * road);
    // fine survey grid
    vec2 gr = abs(fract(p / 0.475) - 0.5);
    col += vec3(0.06, 0.09, 0.2) * (1.0 - smoothstep(0.0, 0.02, min(gr.x, gr.y))) * (1.0 - road) * 0.5;
    float sz = shoreZ(p.x);
    float water = smoothstep(sz - 0.01, sz + 0.01, p.y);
    vec3 R = reflect(-V, N);
    vec3 wcol = vec3(0.05, 0.16, 0.55) * (0.75 + 0.25 * sin(p.x * 3.0 + p.y * 7.0 + uTime * 0.6) * 0.15);
    wcol += vec3(1.0, 0.95, 0.85) * pow(max(dot(R, L), 0.0), 60.0) * 0.8;
    wcol += vec3(0.4, 0.55, 1.0) * pow(1.0 - max(dot(N, V), 0.0), 4.0) * 0.4;
    col = mix(col, wcol, water);
    col = mix(col, vec3(0.85, 0.66, 0.32), line(p.y - sz, 0.02) * 0.9);   // brass promenade edge
    col *= 0.45 + 0.55 * sh;
  } else if (vKind < 3.5) {
    // plinth sides: dark lacquer with a brass top edge
    col = vec3(0.012, 0.025, 0.08) * (0.6 + 0.4 * dif);
    col = mix(col, vec3(0.78, 0.6, 0.3), step(-0.035, vW.y));
    col += vec3(0.4, 0.5, 0.9) * pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.08;
  } else {
    vec3 alb = vec3(0.80, 0.82, 0.77);
    col = alb * (0.42 * hemi + 0.75 * dif);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

function ortho(l, r, b, t, n, f) {
  const m = new Float32Array(16);
  m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n);
  m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); m[15] = 1;
  return m;
}

/* ---------- scene ---------- */

export function initModel(canvas, { labels, labelEl, onPick } = {}) {
  const gl = createGL(canvas);
  if (!gl) return null;
  let prog, sprog;
  try { prog = createProgram(gl, VS, FS); sprog = createProgram(gl, SHADOW_VS, SHADOW_FS); }
  catch (e) { console.warn(e); return null; }

  const geo = buildWorld();
  const mesh = createMesh(gl, {
    aPos: { data: geo.pos, size: 3 }, aNormal: { data: geo.nrm, size: 3 },
    aKind: { data: geo.kind, size: 1 }, aBld: { data: geo.bld, size: 1 },
  }, geo.pos.length / 3);

  // shadow map
  const SM = 2048;
  const smTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, smTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SM, SM, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const smDepth = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, smDepth);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, SM, SM);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, smTex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, smDepth);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const sun = [-0.62, 0.95, 0.42];
  const sl = Math.hypot(...sun), sunN = sun.map((v) => v / sl);
  const lightView = mat4.lookAt(sunN.map((v) => v * 22), [0, 0, 0], [0, 1, 0]);
  const lightVP = mat4.multiply(ortho(-11, 11, -9, 9, 2, 45), lightView);
  let shadowDirty = true;

  const reduced = prefersReducedMotion();
  const hi = new Float32Array(8);
  const st = {
    active: 0, hover: -1, mx: 0, my: 0, tx: 0, ty: 0, screen: [],
    target: [0, 1.0, 0.5], az: -0.45, dist: 1,
  };

  const host = canvas.parentElement;
  const toLocal = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; };
  host.addEventListener('pointermove', (e) => {
    const [x, y, r] = toLocal(e);
    st.tx = (x / r.width) * 2 - 1; st.ty = (y / r.height) * 2 - 1;
    st.hover = pick(x, y);
    canvas.style.cursor = st.hover >= 0 ? 'pointer' : '';
    if (st.hover >= 0 && e.pointerType === 'mouse') onPick && onPick(st.hover);
  });
  host.addEventListener('pointerleave', () => { st.tx = 0; st.ty = 0; st.hover = -1; });
  canvas.addEventListener('click', (e) => { const [x, y] = toLocal(e); const i = pick(x, y); if (i >= 0) onPick && onPick(i); });
  function pick(x, y) {
    let best = -1, bd = Infinity;
    st.screen.forEach((s, i) => {
      if (!s) return;
      const inside = x > s.l && x < s.r && y > s.t && y < s.b;
      const d = Math.hypot(x - (s.l + s.r) / 2, y - (s.t + s.b) / 2);
      if (inside && d < bd) { bd = d; best = i; }
    });
    return best;
  }

  gl.enable(gl.DEPTH_TEST);

  const frame = (t, dt) => {
    if (shadowDirty) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, SM, SM);
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(sprog.program);
      gl.uniformMatrix4fv(sprog.uniforms.uLightVP, false, lightVP);
      bindMesh(gl, sprog, mesh);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      shadowDirty = false;
    }

    fitCanvas(canvas, 2);
    const w = canvas.width, h = canvas.height, aspect = w / h;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    st.mx = damp(st.mx, st.tx, 2, dt);
    st.my = damp(st.my, st.ty, 2, dt);
    const b = BUILDINGS[st.active];
    // glide toward the selected building, keeping the whole district in view
    const goal = [b.x * 0.18, Math.min(b.h * 0.25, 1.1), b.z * 0.18 + 0.5];
    for (let k = 0; k < 3; k++) st.target[k] = damp(st.target[k], goal[k], 1.6, dt);
    const goalAz = -0.45 + clamp(b.x / 7, -1, 1) * 0.18;
    st.az = damp(st.az, goalAz, 1.2, dt);
    for (let i = 0; i < 8; i++) {
      const g = i === st.active ? 1 : i === st.hover ? 0.3 : 0;
      hi[i] = damp(hi[i], g, 4, dt);
    }

    const az = st.az + st.mx * 0.2 + (reduced ? 0 : Math.sin(t * 0.1) * 0.05);
    const el = 0.56 - st.my * 0.08;
    const dist = (canvas.clientWidth < 600 ? 35 : 33) / Math.min(1, aspect * 0.85);
    const T = st.target;
    const eye = [T[0] + Math.sin(az) * Math.cos(el) * dist, T[1] + Math.sin(el) * dist, T[2] + Math.cos(az) * Math.cos(el) * dist];
    const view = mat4.lookAt(eye, T, [0, 1, 0]);
    const proj = mat4.perspective(0.5, aspect, 1, 120);

    gl.useProgram(prog.program);
    const u = prog.uniforms;
    gl.uniformMatrix4fv(u.uProj, false, proj);
    gl.uniformMatrix4fv(u.uView, false, view);
    gl.uniformMatrix4fv(u.uLightVP, false, lightVP);
    gl.uniform3fv(u.uEye, eye);
    gl.uniform3fv(u.uSun, sunN);
    gl.uniform1fv(u.uHi, hi);
    gl.uniform1f(u.uTexel, 1 / SM);
    gl.uniform1f(u.uTime, reduced ? 0 : t);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, smTex);
    gl.uniform1i(u.uShadow, 0);
    bindMesh(gl, prog, mesh);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);

    // screen boxes for picking and the label
    const vp = mat4.multiply(proj, view);
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const px = (p) => { const q = mat4.transformPoint(vp, p); return [(q[0] * 0.5 + 0.5) * cw, (1 - (q[1] * 0.5 + 0.5)) * ch]; };
    BUILDINGS.forEach((bd, i) => {
      const top = px([bd.x, bd.h, bd.z]), base = px([bd.x, 0, bd.z]);
      const half = Math.max(26, Math.abs(base[1] - top[1]) * 0.3 + 18);
      st.screen[i] = { l: top[0] - half, r: top[0] + half, t: top[1] - 8, b: base[1] + 14, tx: top[0], ty: top[1] };
    });
    if (labelEl && st.screen[st.active]) {
      const s = st.screen[st.active];
      labelEl.style.transform = `translate3d(${s.tx.toFixed(1)}px, ${(s.ty - 12).toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
  };

  const loop = visibleLoop(canvas, frame);
  return {
    select(i) {
      st.active = i;
      if (labelEl) {
        labelEl.classList.remove('is-visible');
        labelEl.textContent = labels[i];
        setTimeout(() => labelEl.classList.add('is-visible'), 250);
      }
      loop.kick();
    },
  };
}
