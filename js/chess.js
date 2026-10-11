/* Expertise: a real-time 3D chessboard. Pieces are turned (lathe) solids — the knight
   is a sculpted, bevelled profile — in ivory lacquer that turns to gold when selected. */
import { mat4, createGL, createProgram, createMesh, bindMesh, fitCanvas, visibleLoop, damp, clamp, prefersReducedMotion } from './gl.js';

/* ---------- geometry ---------- */

const BASE = [[0, 0], [0.36, 0], [0.375, 0.035], [0.36, 0.075], [0.3, 0.1], [0.31, 0.14], [0.26, 0.17], [0.235, 0.2]];

function arc(cx, cy, r, a0, a1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

const PROFILES = {
  pawn: [...BASE, [0.17, 0.24], [0.125, 0.44], [0.19, 0.48], [0.19, 0.515], [0.11, 0.545],
    ...arc(0, 0.7, 0.165, -1.25, Math.PI / 2, 12)],
  rook: [...BASE, [0.23, 0.24], [0.19, 0.68], [0.255, 0.72], [0.255, 0.94], [0.19, 0.94], [0.19, 0.86], [0, 0.86]],
  bishop: [...BASE, [0.175, 0.24], [0.115, 0.64], [0.2, 0.68], [0.2, 0.71], [0.11, 0.74],
    [0.15, 0.8], [0.165, 0.89], [0.14, 0.98], [0.085, 1.06], [0.03, 1.1], ...arc(0, 1.15, 0.05, -1.0, Math.PI / 2, 6)],
  queen: [...BASE, [0.195, 0.24], [0.13, 0.82], [0.225, 0.87], [0.225, 0.9], [0.13, 0.93],
    [0.15, 1.0], [0.235, 1.2], [0.2, 1.23], [0.09, 1.25], ...arc(0, 1.31, 0.065, -1.0, Math.PI / 2, 7)],
  king: [...BASE, [0.205, 0.24], [0.14, 0.9], [0.235, 0.95], [0.235, 0.98], [0.14, 1.01],
    [0.16, 1.08], [0.22, 1.26], [0.12, 1.31], [0, 1.31]],
  knight: [...BASE, [0.24, 0.24], [0.2, 0.3], [0, 0.3]],
};

class Mesh {
  constructor() { this.pos = []; this.nrm = []; }
  v(p, n) { this.pos.push(p[0], p[1], p[2]); this.nrm.push(n[0], n[1], n[2]); }
  tri(a, b, c, na, nb, nc) { this.v(a, na); this.v(b, nb || na); this.v(c, nc || na); }
}

function lathe(m, prof, seg = 44) {
  // per-segment normals in the (r, y) plane, smoothed across gentle bends only
  const sn = [];
  for (let i = 0; i < prof.length - 1; i++) {
    const dr = prof[i + 1][0] - prof[i][0], dy = prof[i + 1][1] - prof[i][1], l = Math.hypot(dr, dy) || 1;
    sn.push([dy / l, -dr / l]);
  }
  const endN = (i, k) => {
    const own = sn[i], j = k === 0 ? i - 1 : i + 1, other = sn[j];
    if (!other || own[0] * other[0] + own[1] * other[1] < 0.8) return own;
    const r = own[0] + other[0], y = own[1] + other[1], l = Math.hypot(r, y);
    return [r / l, y / l];
  };
  for (let i = 0; i < prof.length - 1; i++) {
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1], n0 = endN(i, 0), n1 = endN(i, 1);
    for (let s = 0; s < seg; s++) {
      const a = (s / seg) * Math.PI * 2, b = ((s + 1) / seg) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      const p00 = [r0 * ca, y0, r0 * sa], p01 = [r0 * cb, y0, r0 * sb], p10 = [r1 * ca, y1, r1 * sa], p11 = [r1 * cb, y1, r1 * sb];
      const q00 = [n0[0] * ca, n0[1], n0[0] * sa], q01 = [n0[0] * cb, n0[1], n0[0] * sb];
      const q10 = [n1[0] * ca, n1[1], n1[0] * sa], q11 = [n1[0] * cb, n1[1], n1[0] * sb];
      m.tri(p00, p10, p11, q00, q10, q11);
      m.tri(p00, p11, p01, q00, q11, q01);
    }
  }
}

function box(m, x0, y0, z0, x1, y1, z1) {
  const f = (a, b, c, d, n) => { m.tri(a, b, c, n); m.tri(a, c, d, n); };
  f([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0]);
  f([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
  f([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
  f([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
  f([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
}

function earClip(poly) {
  const idx = poly.map((_, i) => i), tris = [];
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const inside = (p, a, b, c) => cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0;
  let guard = 0;
  while (idx.length > 3 && guard++ < 500) {
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k - 1 + idx.length) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length];
      const a = poly[i0], b = poly[i1], c = poly[i2];
      if (cross(a, b, c) <= 0) continue;
      if (idx.some((j) => j !== i0 && j !== i1 && j !== i2 && inside(poly[j], a, b, c))) continue;
      tris.push([i0, i1, i2]); idx.splice(k, 1); break;
    }
  }
  tris.push(idx);
  return tris;
}

/** Bevelled extrusion of a (possibly concave) CCW profile in the xy plane. */
function extrudeProfile(m, poly, depth, bevel) {
  const zf = depth / 2, zb = -depth / 2;
  // shrink the cap slightly toward the centroid to form a soft chamfer
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  const inner = poly.map(([x, y]) => { const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1; const k = Math.max(0, l - bevel) / l; return [cx + dx * k, cy + dy * k]; });
  for (const [a, b, c] of earClip(inner)) {
    m.tri([inner[a][0], inner[a][1], zf + bevel], [inner[b][0], inner[b][1], zf + bevel], [inner[c][0], inner[c][1], zf + bevel], [0, 0, 1]);
    m.tri([inner[a][0], inner[a][1], zb - bevel], [inner[c][0], inner[c][1], zb - bevel], [inner[b][0], inner[b][1], zb - bevel], [0, 0, -1]);
  }
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], ia = inner[i], ib = inner[(i + 1) % poly.length];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const n = [dy / l, -dx / l, 0], s = Math.SQRT1_2;
    m.tri([a[0], a[1], zb], [b[0], b[1], zb], [b[0], b[1], zf], n);
    m.tri([a[0], a[1], zb], [b[0], b[1], zf], [a[0], a[1], zf], n);
    const nf = [n[0] * s, n[1] * s, s], nb = [n[0] * s, n[1] * s, -s];
    m.tri([a[0], a[1], zf], [b[0], b[1], zf], [ib[0], ib[1], zf + bevel], nf);
    m.tri([a[0], a[1], zf], [ib[0], ib[1], zf + bevel], [ia[0], ia[1], zf + bevel], nf);
    m.tri([b[0], b[1], zb], [a[0], a[1], zb], [ia[0], ia[1], zb - bevel], nb);
    m.tri([b[0], b[1], zb], [ia[0], ia[1], zb - bevel], [ib[0], ib[1], zb - bevel], nb);
  }
}

const KNIGHT_HEAD = [
  [-0.2, 0.28], [0.2, 0.28], [0.19, 0.42], [0.1, 0.56], [0.25, 0.62], [0.33, 0.7], [0.32, 0.79], [0.22, 0.83],
  [0.14, 0.92], [0.07, 1.0], [0.04, 1.1], [-0.02, 1.02], [-0.12, 0.98], [-0.21, 0.88], [-0.25, 0.68], [-0.22, 0.46],
];

function buildPiece(type) {
  const m = new Mesh();
  lathe(m, PROFILES[type]);
  if (type === 'king') { box(m, -0.035, 1.3, -0.035, 0.035, 1.56, 0.035); box(m, -0.11, 1.4, -0.035, 0.11, 1.47, 0.035); }
  if (type === 'rook') for (let k = 0; k < 4; k++) {
    // carve the battlement look with four raised merlons
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
    const x = c * 0.2, z = s * 0.2;
    box(m, x - 0.06, 0.94, z - 0.06, x + 0.06, 1.02, z + 0.06);
  }
  if (type === 'knight') extrudeProfile(m, KNIGHT_HEAD, 0.2, 0.035);
  return m;
}

function buildBoard() {
  const m = new Mesh();
  box(m, -4.62, -0.32, -4.62, 4.62, 0, 4.62);
  return m;
}

/* ---------- shaders ---------- */

const PIECE_VS = `
attribute vec3 aPos; attribute vec3 aNormal;
uniform mat4 uProj, uView, uModel; varying vec3 vW, vN; varying float vY;
void main(){ vec4 w = uModel * vec4(aPos, 1.0); vW = w.xyz; vN = mat3(uModel) * aNormal; vY = aPos.y; gl_Position = uProj * uView * w; }`;

const COMMON = `
vec3 env(vec3 d){
  vec3 c = mix(vec3(0.03,0.08,0.28), vec3(0.02,0.04,0.12), smoothstep(-0.6, 0.15, d.y));   // royal board below
  c = mix(c, vec3(0.05,0.09,0.24), smoothstep(0.1, 0.9, d.y));
  float sb = dot(d, normalize(vec3(-0.4, 0.85, 0.35)));
  c += vec3(1.0,0.97,0.92) * smoothstep(0.85, 0.95, sb) * 2.2;
  float st = dot(d, normalize(vec3(0.9, 0.25, 0.3)));
  c += vec3(1.0,0.9,0.75) * smoothstep(0.93, 0.985, st) * 1.3;
  return c;
}
vec3 tone(vec3 c){ float m = max(max(c.r, c.g), c.b) + 1e-4; return c * ((1.0 - exp(-1.7 * m)) / m) * 1.08; }   // keeps hue (gold stays gold)
`;

const PIECE_FS = `
precision highp float;
varying vec3 vW, vN; varying float vY;
uniform vec3 uEye, uKey, uRim; uniform float uGold, uHover;
${COMMON}
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(uEye - vW), R = reflect(-V, N);
  float NV = clamp(dot(N, V), 0.0, 1.0);
  vec3 Lk = normalize(uKey - vW), Lr = normalize(uRim - vW);
  vec3 Hk = normalize(Lk + V), Hr = normalize(Lr + V);
  float dk = max(dot(N, Lk), 0.0), dr = max(dot(N, Lr), 0.0);
  float ao = mix(0.55, 1.0, smoothstep(0.0, 0.22, vY));
  // ivory porcelain lacquer
  vec3 alb = vec3(0.86, 0.88, 0.94);
  float F = 0.04 + 0.96 * pow(1.0 - NV, 5.0);
  vec3 ivory = alb * (0.30 + dk * 0.75 + dr * 0.3 + max(N.y, 0.0) * 0.15) * ao;
  ivory += vec3(1.0,0.97,0.9) * pow(max(dot(N,Hk),0.0), 140.0) * 1.4;
  ivory += vec3(0.6,0.75,1.0) * pow(max(dot(N,Hr),0.0), 90.0) * 0.6;
  ivory += env(R) * mix(0.05, 0.9, F) * 0.6;
  ivory += vec3(0.30,0.40,0.85) * 0.08 * (1.0 - max(N.y, 0.0));   // bounce from the blue board
  // polished gold
  vec3 F0 = vec3(1.0, 0.80, 0.46);
  vec3 Fg = F0 + (1.0 - F0) * pow(1.0 - NV, 5.0);
  vec3 gold = (env(R) * 0.8 + vec3(0.42,0.34,0.2) + vec3(1.0,0.95,0.85) * pow(max(dot(N,Hk),0.0), 80.0) * 2.4 + dk * 0.55 + dr * 0.2) * Fg * ao;
  vec3 col = mix(ivory, gold, uGold);
  col += vec3(0.9,0.75,0.45) * pow(1.0 - NV, 3.0) * uHover * 0.25;
  gl_FragColor = vec4(tone(col), 1.0);
}`;

const BOARD_VS = `
attribute vec3 aPos; attribute vec3 aNormal;
uniform mat4 uProj, uView; varying vec3 vW, vN;
void main(){ vW = aPos; vN = aNormal; gl_Position = uProj * uView * vec4(aPos, 1.0); }`;

const BOARD_FS = `
precision highp float;
varying vec3 vW, vN;
uniform vec3 uEye, uKey; uniform sampler2D uMarks; uniform vec4 uP[6]; uniform float uTime;
${COMMON}
void main(){
  vec3 N = normalize(vN), V = normalize(uEye - vW), R = reflect(-V, N);
  float NV = clamp(dot(N, V), 0.0, 1.0);
  vec3 Lk = normalize(uKey - vW), Hk = normalize(Lk + V);
  vec3 col; float gloss = 0.5;
  if (N.y > 0.5) {
    vec2 p = vW.xz;
    if (abs(p.x) < 4.0 && abs(p.y) < 4.0) {
      vec2 cell = floor(p + 4.0), f = fract(p + 4.0);
      bool light = mod(cell.x + cell.y, 2.0) < 0.5;
      col = light ? vec3(0.07, 0.18, 0.62) : vec3(0.012, 0.035, 0.15);
      col *= 0.85 + 0.25 * (1.0 - f.y);
      float mark = texture2D(uMarks, (cell + 0.5) / 8.0).r;
      float edge = max(abs(f.x - 0.5), abs(f.y - 0.5)) * 2.0;
      if (mark > 0.75) {                       // selected piece's square
        col += vec3(0.95,0.75,0.4) * (smoothstep(0.86, 0.95, edge) * 1.6 + 0.18);
      } else if (mark > 0.25) {               // a legal move
        float d = length(f - 0.5);
        float pulse = 0.85 + 0.15 * sin(uTime * 3.0 + cell.x + cell.y);
        col += vec3(1.0,0.82,0.45) * (smoothstep(0.13, 0.1, d) * 1.4 + exp(-d * d * 40.0) * 0.35) * pulse;
      }
      gloss = 1.0;
    } else {
      // lacquered frame with a gold inlay
      float b = max(abs(p.x), abs(p.y));
      col = vec3(0.01, 0.022, 0.07);
      col = mix(col, vec3(0.75, 0.56, 0.24), smoothstep(0.03, 0.0, abs(b - 4.06)) + smoothstep(0.03, 0.0, abs(b - 4.56)));
    }
    // soft contact shadows beneath the pieces
    float sh = 0.0;
    for (int i = 0; i < 6; i++) {
      float d = length(p - uP[i].xz);
      sh = max(sh, smoothstep(0.75 + uP[i].w * 0.6, 0.15, d) * (0.6 - uP[i].w * 0.9));
    }
    col *= 1.0 - sh;
  } else {
    col = mix(vec3(0.45, 0.32, 0.12), vec3(0.85, 0.66, 0.32), smoothstep(-0.32, 0.0, vW.y));
    gloss = 0.7;
  }
  float F = 0.04 + 0.96 * pow(1.0 - NV, 5.0);
  col += env(R) * F * 0.7 * gloss;
  col += vec3(1.0,0.96,0.9) * pow(max(dot(N, Hk), 0.0), 260.0) * 0.9 * gloss;
  gl_FragColor = vec4(tone(col), 1.0);
}`;

/* ---------- scene ---------- */

const SCALE = 1.3; // pieces read larger than a strict square footprint, as on a real board

export function initChess(canvas, { pieces, labels, labelEl, onPick } = {}) {
  const gl = createGL(canvas);
  if (!gl) return null;
  let pp, bp;
  try { pp = createProgram(gl, PIECE_VS, PIECE_FS); bp = createProgram(gl, BOARD_VS, BOARD_FS); }
  catch (e) { console.warn(e); return null; }

  const meshes = {};
  for (const p of pieces) if (!meshes[p.type]) {
    const m = buildPiece(p.type);
    meshes[p.type] = createMesh(gl, { aPos: { data: m.pos, size: 3 }, aNormal: { data: m.nrm, size: 3 } }, m.pos.length / 3);
  }
  const bm = buildBoard();
  const boardMesh = createMesh(gl, { aPos: { data: bm.pos, size: 3 }, aNormal: { data: bm.nrm, size: 3 } }, bm.pos.length / 3);

  const marks = new Uint8Array(64);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const uploadMarks = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 8, 8, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, marks);
  };
  uploadMarks();

  const reduced = prefersReducedMotion();
  const P = pieces.map((p) => ({ ...p, x: p.c - 3.5, z: p.r - 3.5, lift: 0, gold: 0, spin: 0, hover: 0 }));
  const state = { active: 0, hover: -1, mx: 0, my: 0, tx: 0, ty: 0, screen: [] };

  const host = canvas.parentElement;
  host.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    state.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    state.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    state.hover = pick(e.clientX - r.left, e.clientY - r.top);
    canvas.style.cursor = state.hover >= 0 ? 'pointer' : '';
    if (state.hover >= 0 && e.pointerType === 'mouse') onPick && onPick(state.hover);
  });
  host.addEventListener('pointerleave', () => { state.tx = 0; state.ty = 0; state.hover = -1; });
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const i = pick(e.clientX - r.left, e.clientY - r.top);
    if (i >= 0) onPick && onPick(i);
  });
  function pick(x, y) {
    let best = -1, bd = Infinity;
    state.screen.forEach((s, i) => {
      if (!s) return;
      const dx = (x - s.x) / s.w, dy = (y - s.y) / s.h;
      const d = dx * dx + dy * dy;
      if (d < 1 && d < bd) { bd = d; best = i; }
    });
    return best;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  const frame = (t, dt) => {
    fitCanvas(canvas, 2);
    const w = canvas.width, h = canvas.height, aspect = w / h;
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    state.mx = damp(state.mx, state.tx, 2.2, dt);
    state.my = damp(state.my, state.ty, 2.2, dt);

    const az = -0.3 + state.mx * 0.22 + (reduced ? 0 : Math.sin(t * 0.12) * 0.08);
    const el = 0.72 - state.my * 0.1;
    const dist = (canvas.clientWidth < 600 ? 20.5 : 17.5) / Math.min(1, aspect * 0.92);
    const target = [0, -0.6, 0.4];
    const eye = [target[0] + Math.sin(az) * Math.cos(el) * dist, target[1] + Math.sin(el) * dist, target[2] + Math.cos(az) * Math.cos(el) * dist];
    const view = mat4.lookAt(eye, target, [0, 1, 0]);
    const proj = mat4.perspective(0.62, aspect, 0.5, 80);
    const vp = mat4.multiply(proj, view);
    const key = [-7, 11, 7], rim = [8, 6, -7];

    P.forEach((p, i) => {
      const on = i === state.active ? 1 : 0;
      p.lift = damp(p.lift, on * 0.32, 4, dt);
      p.gold = damp(p.gold, on, 4, dt);
      p.hover = damp(p.hover, i === state.hover ? 1 : 0, 6, dt);
      p.spin = on && !reduced ? p.spin + dt * 0.5 : damp(p.spin, Math.round(p.spin / (Math.PI * 2)) * Math.PI * 2, 2, dt);
    });

    // board
    gl.useProgram(bp.program);
    gl.uniformMatrix4fv(bp.uniforms.uProj, false, proj);
    gl.uniformMatrix4fv(bp.uniforms.uView, false, view);
    gl.uniform3fv(bp.uniforms.uEye, eye);
    gl.uniform3fv(bp.uniforms.uKey, key);
    gl.uniform1f(bp.uniforms.uTime, t);
    const pu = new Float32Array(24);
    P.forEach((p, i) => { pu[i * 4] = p.x; pu[i * 4 + 2] = p.z; pu[i * 4 + 3] = p.lift; });
    gl.uniform4fv(bp.uniforms.uP, pu);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(bp.uniforms.uMarks, 0);
    bindMesh(gl, bp, boardMesh);
    gl.drawArrays(gl.TRIANGLES, 0, boardMesh.count);

    // pieces
    gl.useProgram(pp.program);
    gl.uniformMatrix4fv(pp.uniforms.uProj, false, proj);
    gl.uniformMatrix4fv(pp.uniforms.uView, false, view);
    gl.uniform3fv(pp.uniforms.uEye, eye);
    gl.uniform3fv(pp.uniforms.uKey, key);
    gl.uniform3fv(pp.uniforms.uRim, rim);
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    P.forEach((p, i) => {
      const facing = p.type === 'knight' ? -Math.PI / 2 + 0.5 : 0;
      const model = mat4.multiply(mat4.translation(p.x, p.lift, p.z), mat4.multiply(mat4.scaling(SCALE, SCALE, SCALE), mat4.rotationY(facing + p.spin)));
      gl.uniformMatrix4fv(pp.uniforms.uModel, false, model);
      gl.uniform1f(pp.uniforms.uGold, p.gold);
      gl.uniform1f(pp.uniforms.uHover, p.hover);
      const mesh = meshes[p.type];
      bindMesh(gl, pp, mesh);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
      // screen-space footprint for picking and the label
      const top = mat4.transformPoint(vp, [p.x, p.lift + p.h * SCALE, p.z]);
      const bot = mat4.transformPoint(vp, [p.x, p.lift, p.z]);
      const toPx = (q) => [(q[0] * 0.5 + 0.5) * cw, (1 - (q[1] * 0.5 + 0.5)) * ch];
      const [tx, ty] = toPx(top), [bx, by] = toPx(bot);
      state.screen[i] = { x: (tx + bx) / 2, y: (ty + by) / 2, w: Math.max(22, Math.abs(by - ty) * 0.35), h: Math.max(30, Math.abs(by - ty) * 0.62), tx, ty };
    });

    if (labelEl && state.screen[state.active]) {
      const s = state.screen[state.active];
      labelEl.style.transform = `translate3d(${s.tx.toFixed(1)}px, ${(s.ty - 14).toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
  };

  const loop = visibleLoop(canvas, frame);
  return {
    select(i, moves) {
      state.active = i;
      marks.fill(0);
      for (const [x, y] of moves) marks[y * 8 + x] = 128;
      marks[pieces[i].r * 8 + pieces[i].c] = 255;
      uploadMarks();
      if (labelEl) {
        labelEl.classList.remove('is-visible');
        labelEl.textContent = labels[i];
        requestAnimationFrame(() => labelEl.classList.add('is-visible'));
      }
      loop.kick();
    },
  };
}
