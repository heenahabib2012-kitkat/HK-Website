/* Expertise: a real-time 3D chessboard. Turned porcelain pieces (the knight is sculpted)
   on a board of lapis-lazuli and midnight marble, with shadow-mapped light, mirror
   reflections in the polished surface and gold-engraved coordinates. The selected
   piece rises in polished gold. */
import { Mesh, arc, lathe, sphere, box, extrudeProfile } from './geo.js';
import { mat4, createGL, createProgram, createMesh, bindMesh, fitCanvas, visibleLoop, damp, clamp, prefersReducedMotion } from './gl.js';

/* ---------- geometry ---------- */

const BASE = [[0, 0], [0.37, 0], [0.385, 0.03], [0.375, 0.07], [0.33, 0.085], [0.31, 0.11], [0.32, 0.145], [0.27, 0.17], [0.24, 0.205]];

const PROFILES = {
  pawn: [...BASE, [0.175, 0.25], [0.13, 0.42], [0.2, 0.46], [0.205, 0.49], [0.12, 0.52],
    ...arc(0, 0.68, 0.165, -1.3, Math.PI / 2, 16)],
  rook: [...BASE, [0.235, 0.25], [0.2, 0.66], [0.265, 0.7], [0.27, 0.74], [0.255, 0.76], [0.255, 0.94], [0.175, 0.94], [0.175, 0.9], [0, 0.9]],
  bishop: [...BASE, [0.18, 0.25], [0.118, 0.63], [0.205, 0.665], [0.21, 0.695], [0.115, 0.725],
    [0.142, 0.77], [0.165, 0.85], [0.162, 0.93], [0.13, 1.0], [0.08, 1.06], [0.035, 1.095], ...arc(0, 1.14, 0.05, -1.0, Math.PI / 2, 8)],
  queen: [...BASE, [0.2, 0.25], [0.135, 0.8], [0.23, 0.845], [0.235, 0.88], [0.135, 0.91],
    [0.15, 0.98], [0.2, 1.1], [0.245, 1.2], [0.23, 1.215], [0.15, 1.2], [0.1, 1.235], ...arc(0, 1.3, 0.065, -1.0, Math.PI / 2, 10)],
  king: [...BASE, [0.21, 0.25], [0.145, 0.88], [0.24, 0.925], [0.245, 0.96], [0.145, 0.99],
    [0.16, 1.06], [0.215, 1.22], [0.2, 1.255], [0.11, 1.28], [0.06, 1.3], [0, 1.31]],
  knight: [...BASE, [0.25, 0.25], [0.215, 0.3], [0, 0.31]],
};

// side profile of the horse's head and neck, facing +x
const KNIGHT_HEAD = [
  [-0.21, 0.29], [0.22, 0.29], [0.215, 0.36], [0.17, 0.46], [0.1, 0.55], [0.16, 0.57], [0.25, 0.6], [0.33, 0.66],
  [0.36, 0.72], [0.345, 0.78], [0.3, 0.8], [0.23, 0.8], [0.17, 0.86], [0.12, 0.93], [0.09, 1.0], [0.07, 1.1],
  [0.03, 1.04], [-0.02, 1.12], [-0.05, 1.03], [-0.13, 0.98], [-0.2, 0.9], [-0.245, 0.78], [-0.255, 0.62], [-0.235, 0.45],
];
const KNIGHT_MANE = [[-0.255, 0.42], [-0.21, 0.42], [-0.2, 0.62], [-0.15, 0.86], [-0.08, 0.98], [-0.11, 1.0], [-0.22, 0.88], [-0.275, 0.7]];

function buildPiece(type) {
  const m = new Mesh();
  lathe(m, PROFILES[type]);
  if (type === 'king') {
    box(m, -0.038, 1.29, -0.038, 0.038, 1.58, 0.038);
    box(m, -0.12, 1.41, -0.038, 0.12, 1.485, 0.038);
  }
  if (type === 'queen') {
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      sphere(m, Math.cos(a) * 0.235, 1.235, Math.sin(a) * 0.235, 0.033);
    }
  }
  if (type === 'rook') {
    // six crenellations around the crown
    const merlon = [[0.18, 0.94], [0.255, 0.94], [0.255, 1.035], [0.18, 1.035], [0.18, 0.94]];
    for (let k = 0; k < 6; k++) {
      const a0 = (k / 6) * Math.PI * 2, a1 = a0 + (Math.PI * 2) / 6 * 0.62;
      lathe(m, merlon, { seg: 8, a0, a1 });
      for (const a of [a0, a1]) {
        const c = Math.cos(a), s = Math.sin(a), sign = a === a0 ? -1 : 1;
        const n = [-s * sign, 0, c * sign];
        const P = (r, y) => [r * c, y, r * s];
        m.tri(P(0.18, 0.94), P(0.255, 0.94), P(0.255, 1.035), n);
        m.tri(P(0.18, 0.94), P(0.255, 1.035), P(0.18, 1.035), n);
      }
    }
  }
  if (type === 'bishop') {
    // the mitre's slit, as a thin raised ridge catching the light
    box(m, -0.004, 0.86, 0.05, 0.004, 1.0, 0.16);
  }
  if (type === 'knight') {
    extrudeProfile(m, KNIGHT_HEAD, 0.2, 0.05);
    extrudeProfile(m, KNIGHT_MANE, 0.07, 0.025);
    // ears
    extrudeProfile(m, [[0.04, 1.08], [0.08, 1.08], [0.06, 1.18]], 0.05, 0.012, 0.06);
    extrudeProfile(m, [[0.04, 1.08], [0.08, 1.08], [0.06, 1.18]], 0.05, 0.012, -0.06);
  }
  return m;
}

function buildBoard() {
  const m = new Mesh();
  box(m, -4.62, -0.34, -4.62, 4.62, 0, 4.62);
  return m;
}

/* ---------- shaders ---------- */

const PACK = `
vec4 pack(float d){ vec4 e = fract(vec4(1.0, 255.0, 65025.0, 16581375.0) * d); return e - e.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0); }
float unpack(vec4 r){ return dot(r, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0)); }`;

const SHADOW_VS = `
attribute vec3 aPos; uniform mat4 uLightVP, uModel;
void main(){ gl_Position = uLightVP * uModel * vec4(aPos, 1.0); }`;
const SHADOW_FS = `precision highp float; ${PACK}
void main(){ gl_FragColor = pack(gl_FragCoord.z); }`;

const COMMON = `
${PACK}
uniform sampler2D uShadow; uniform mat4 uLightVP; uniform float uTexel;
float shadowAt(vec3 w, vec3 n){
  vec4 l = uLightVP * vec4(w + n * 0.02, 1.0);
  vec3 p = l.xyz / l.w * 0.5 + 0.5;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return 1.0;
  float s = 0.0;
  for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++)
    s += p.z - 0.002 > unpack(texture2D(uShadow, p.xy + vec2(float(i), float(j)) * uTexel * 1.5)) ? 0.0 : 1.0;
  return s / 25.0;
}
vec3 env(vec3 d){
  vec3 c = mix(vec3(0.03,0.08,0.28), vec3(0.02,0.04,0.12), smoothstep(-0.6, 0.15, d.y));
  c = mix(c, vec3(0.05,0.09,0.24), smoothstep(0.1, 0.9, d.y));
  float sb = dot(d, normalize(vec3(-0.4, 0.85, 0.35)));
  c += vec3(1.0,0.97,0.92) * smoothstep(0.85, 0.95, sb) * 2.2;
  float st = dot(d, normalize(vec3(0.9, 0.25, 0.3)));
  c += vec3(1.0,0.9,0.75) * smoothstep(0.93, 0.985, st) * 1.3;
  return c;
}
vec3 tone(vec3 c){ float m = max(max(c.r, c.g), c.b) + 1e-4; return c * ((1.0 - exp(-1.7 * m)) / m) * 1.08; }
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 1.7; a *= 0.5; } return s; }
`;

const PIECE_VS = `
attribute vec3 aPos; attribute vec3 aNormal;
uniform mat4 uProj, uView, uModel; varying vec3 vW, vN; varying float vY;
void main(){ vec4 w = uModel * vec4(aPos, 1.0); vW = w.xyz; vN = mat3(uModel) * aNormal; vY = aPos.y; gl_Position = uProj * uView * w; }`;

const PIECE_FS = `
precision highp float;
varying vec3 vW, vN; varying float vY;
uniform vec3 uEye, uKey, uRim, uSun; uniform float uGold, uHover, uMirror;
${COMMON}
void main(){
  vec3 N = normalize(vN);
  vec3 eye = uEye;
  if (uMirror > 0.5) {
    // only show the reflection where it lies under the polished squares
    float t = eye.y / (eye.y - vW.y);
    vec2 hit = eye.xz + (vW.xz - eye.xz) * t;
    if (abs(hit.x) > 4.0 || abs(hit.y) > 4.0) discard;
  }
  vec3 V = normalize(eye - vW), R = reflect(-V, N);
  float NV = clamp(dot(N, V), 0.0, 1.0);
  vec3 Lk = normalize(uKey - vW), Lr = normalize(uRim - vW);
  vec3 Hk = normalize(Lk + V), Hr = normalize(Lr + V);
  float sh = uMirror > 0.5 ? 1.0 : shadowAt(vW, N);
  float dk = max(dot(N, normalize(uSun)), 0.0) * sh, dr = max(dot(N, Lr), 0.0);
  float wrap = max(dot(N, normalize(uSun)) * 0.5 + 0.5, 0.0);
  float ao = mix(0.5, 1.0, smoothstep(0.0, 0.24, vY));
  // glazed porcelain: soft wrap lighting, a warm subsurface tint and a clear glaze
  vec3 alb = vec3(0.92, 0.9, 0.86);
  float F = 0.04 + 0.96 * pow(1.0 - NV, 5.0);
  vec3 ivory = alb * (0.22 + wrap * 0.35 + dk * 0.55 + dr * 0.18) * ao;
  ivory += vec3(0.95, 0.8, 0.62) * pow(1.0 - NV, 2.0) * 0.08;
  ivory += vec3(1.0,0.97,0.9) * pow(max(dot(N,Hk),0.0), 220.0) * 1.6 * sh;
  ivory += vec3(0.6,0.75,1.0) * pow(max(dot(N,Hr),0.0), 120.0) * 0.6;
  ivory += env(R) * mix(0.04, 0.85, F) * 0.55;
  ivory += vec3(0.25,0.4,0.95) * 0.1 * max(-N.y, 0.0);
  // polished gold
  vec3 F0 = vec3(1.0, 0.80, 0.46);
  vec3 Fg = F0 + (1.0 - F0) * pow(1.0 - NV, 5.0);
  vec3 gold = (env(R) * 0.85 + vec3(0.36,0.28,0.15) + vec3(1.0,0.95,0.85) * pow(max(dot(N,Hk),0.0), 90.0) * 2.6 * sh + dk * 0.5 + dr * 0.22) * Fg * ao;
  vec3 col = mix(ivory, gold, uGold);
  col += vec3(0.9,0.75,0.45) * pow(1.0 - NV, 3.0) * uHover * 0.22;
  if (uMirror > 0.5) col *= 0.6;
  gl_FragColor = vec4(tone(col), 1.0);
}`;

const BOARD_VS = `
attribute vec3 aPos; attribute vec3 aNormal;
uniform mat4 uProj, uView; varying vec3 vW, vN;
void main(){ vW = aPos; vN = aNormal; gl_Position = uProj * uView * vec4(aPos, 1.0); }`;

const BOARD_FS = `
precision highp float;
varying vec3 vW, vN;
uniform vec3 uEye, uKey, uSun; uniform sampler2D uMarks, uEngrave; uniform float uTime;
${COMMON}
void main(){
  vec3 N = normalize(vN), V = normalize(uEye - vW), R = reflect(-V, N);
  float NV = clamp(dot(N, V), 0.0, 1.0);
  vec3 Lk = normalize(uKey - vW), Hk = normalize(Lk + V);
  float sh = shadowAt(vW, N);
  vec3 col; float gloss = 0.6, alpha = 1.0;
  if (N.y > 0.5) {
    vec2 p = vW.xz;
    if (abs(p.x) < 4.0 && abs(p.y) < 4.0) {
      vec2 cell = floor(p + 4.0), f = fract(p + 4.0);
      bool light = mod(cell.x + cell.y, 2.0) < 0.5;
      vec2 q = p * 1.7 + cell * 3.1;
      if (light) {
        // lapis lazuli: deep royal blue, cloudy, with flecks of gold pyrite
        float cloud = fbm(q * 1.3);
        col = mix(vec3(0.05, 0.13, 0.52), vec3(0.11, 0.25, 0.78), cloud);
        col = mix(col, vec3(0.72, 0.78, 0.9), smoothstep(0.72, 0.9, fbm(q * 2.6 + 7.0)) * 0.18);
        float fleck = step(0.992, hash(floor(p * 60.0))) * step(0.55, noise(p * 5.0));
        col = mix(col, vec3(0.85, 0.62, 0.22), fleck * 0.85);
      } else {
        // midnight marble with faint pale veining
        float v = abs(sin((p.x * 1.4 + p.y * 0.9) * 2.0 + fbm(q * 1.1) * 7.0));
        col = vec3(0.012, 0.025, 0.085) + vec3(0.18, 0.22, 0.34) * pow(1.0 - v, 18.0) * 0.6;
        col += vec3(0.02, 0.04, 0.1) * fbm(q * 2.0);
      }
      // fine gold joint between squares
      float joint = 1.0 - smoothstep(0.0, 0.012, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));
      col = mix(col, vec3(0.6, 0.46, 0.22), joint * 0.55);
      float mark = texture2D(uMarks, (cell + 0.5) / 8.0).r;
      float edge = max(abs(f.x - 0.5), abs(f.y - 0.5)) * 2.0;
      if (mark > 0.75) {
        col += vec3(0.95,0.75,0.4) * (smoothstep(0.84, 0.94, edge) * 1.4 + 0.12);
      } else if (mark > 0.25) {
        float d = length(f - 0.5);
        float pulse = 0.85 + 0.15 * sin(uTime * 2.4 + cell.x * 0.7 + cell.y * 0.9);
        col += vec3(1.0,0.82,0.45) * (smoothstep(0.1, 0.075, d) * 1.2 + smoothstep(0.17, 0.15, d) * smoothstep(0.13, 0.15, d) * 0.6) * pulse;
      }
      gloss = 1.0; alpha = light ? 0.9 : 0.86;   // polished stone shows the pieces' reflections
    } else {
      // lacquered frame with gold inlay and engraved coordinates
      vec2 uv = (p + 4.62) / 9.24;
      float b = max(abs(p.x), abs(p.y));
      col = vec3(0.008, 0.02, 0.065) + vec3(0.01, 0.02, 0.05) * fbm(p * 3.0);
      float inlay = smoothstep(0.02, 0.0, abs(b - 4.07)) + smoothstep(0.02, 0.0, abs(b - 4.55));
      float letters = texture2D(uEngrave, uv).r;
      col = mix(col, vec3(0.82, 0.63, 0.3), clamp(inlay + letters, 0.0, 1.0));
    }
    col *= 0.38 + 0.62 * sh;
  } else {
    // brass edge band
    col = mix(vec3(0.35, 0.25, 0.1), vec3(0.85, 0.66, 0.32), smoothstep(-0.34, 0.0, vW.y));
    gloss = 0.8;
  }
  float F = 0.04 + 0.96 * pow(1.0 - NV, 5.0);
  col += env(R) * F * 0.6 * gloss;
  col += vec3(1.0,0.96,0.9) * pow(max(dot(N, Hk), 0.0), 300.0) * 0.8 * gloss;
  gl_FragColor = vec4(tone(col) * alpha, alpha);
}`;

function ortho(l, r, b, t, n, f) {
  const m = new Float32Array(16);
  m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n);
  m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); m[15] = 1;
  return m;
}

function engravingCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 1024);
  g.fillStyle = '#fff';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'italic 500 34px "Cormorant Garamond", Georgia, serif';
  const toPx = (v) => ((v + 4.62) / 9.24) * 1024;
  'abcdefgh'.split('').forEach((ch, i) => {
    g.fillText(ch, toPx(i - 3.5), toPx(4.31));
    g.save(); g.translate(toPx(i - 3.5), toPx(-4.31)); g.rotate(Math.PI); g.fillText(ch, 0, 0); g.restore();
  });
  for (let r = 0; r < 8; r++) {
    g.fillText(String(8 - r), toPx(-4.31), toPx(r - 3.5));
    g.save(); g.translate(toPx(4.31), toPx(r - 3.5)); g.rotate(Math.PI); g.fillText(String(8 - r), 0, 0); g.restore();
  }
  return c;
}

/* ---------- scene ---------- */

const SCALE = 1.3; // pieces read larger than a strict square footprint, as on a real board

export function initChess(canvas, { pieces, labels, labelEl, onPick } = {}) {
  const gl = createGL(canvas);
  if (!gl) return null;
  let pp, bp, sp;
  try {
    pp = createProgram(gl, PIECE_VS, PIECE_FS);
    bp = createProgram(gl, BOARD_VS, BOARD_FS);
    sp = createProgram(gl, SHADOW_VS, SHADOW_FS);
  } catch (e) { console.warn(e); return null; }

  const meshes = {};
  for (const p of pieces) if (!meshes[p.type]) {
    const m = buildPiece(p.type);
    meshes[p.type] = createMesh(gl, { aPos: { data: m.pos, size: 3 }, aNormal: { data: m.nrm, size: 3 } }, m.pos.length / 3);
  }
  const bm = buildBoard();
  const boardMesh = createMesh(gl, { aPos: { data: bm.pos, size: 3 }, aNormal: { data: bm.nrm, size: 3 } }, bm.pos.length / 3);

  const makeTex = (filter) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };

  // squares to highlight
  const marks = new Uint8Array(64);
  const markTex = makeTex(gl.NEAREST);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  const uploadMarks = () => {
    gl.bindTexture(gl.TEXTURE_2D, markTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 8, 8, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, marks);
  };
  uploadMarks();

  // engraved coordinates
  const engraveTex = makeTex(gl.LINEAR);
  const uploadEngraving = () => {
    gl.bindTexture(gl.TEXTURE_2D, engraveTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, engravingCanvas());
  };
  uploadEngraving();
  if (document.fonts) document.fonts.ready.then(uploadEngraving);

  // shadow map
  const SM = 2048;
  const smTex = makeTex(gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SM, SM, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  const smDepth = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, smDepth);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, SM, SM);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, smTex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, smDepth);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const sun = [-0.55, 1.0, 0.5], sl = Math.hypot(...sun), sunN = sun.map((v) => v / sl);
  const lightVP = mat4.multiply(ortho(-7, 7, -7, 7, 2, 40), mat4.lookAt(sunN.map((v) => v * 18), [0, 0, 0], [0, 1, 0]));

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

  const modelOf = (p) => {
    const facing = p.type === 'knight' ? -Math.PI / 2 + 0.55 : 0;
    return mat4.multiply(mat4.translation(p.x, p.lift, p.z), mat4.multiply(mat4.scaling(SCALE, SCALE, SCALE), mat4.rotationY(facing + p.spin)));
  };
  const mirror = mat4.scaling(1, -1, 1);
  const ident = mat4.identity();

  gl.enable(gl.DEPTH_TEST);

  const setCommon = (prog, view, proj, eye) => {
    const u = prog.uniforms;
    gl.uniformMatrix4fv(u.uProj, false, proj);
    gl.uniformMatrix4fv(u.uView, false, view);
    gl.uniform3fv(u.uEye, eye);
    gl.uniform3fv(u.uKey, [-7, 11, 7]);
    gl.uniform3fv(u.uSun, sunN);
    if (u.uRim) gl.uniform3fv(u.uRim, [8, 6, -7]);
    gl.uniformMatrix4fv(u.uLightVP, false, lightVP);
    gl.uniform1f(u.uTexel, 1 / SM);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, smTex);
    gl.uniform1i(u.uShadow, 2);
  };

  const drawPieces = (view, proj, eye, mirrored) => {
    gl.useProgram(pp.program);
    setCommon(pp, view, proj, eye);
    gl.uniform1f(pp.uniforms.uMirror, mirrored ? 1 : 0);
    P.forEach((p) => {
      const m = modelOf(p);
      gl.uniformMatrix4fv(pp.uniforms.uModel, false, mirrored ? mat4.multiply(mirror, m) : m);
      gl.uniform1f(pp.uniforms.uGold, p.gold);
      gl.uniform1f(pp.uniforms.uHover, p.hover);
      const mesh = meshes[p.type];
      bindMesh(gl, pp, mesh);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
    });
  };

  const frame = (t, dt) => {
    state.mx = damp(state.mx, state.tx, 2.2, dt);
    state.my = damp(state.my, state.ty, 2.2, dt);
    P.forEach((p, i) => {
      const on = i === state.active ? 1 : 0;
      p.lift = damp(p.lift, on * 0.34, 4, dt);
      p.gold = damp(p.gold, on, 4, dt);
      p.hover = damp(p.hover, i === state.hover ? 1 : 0, 6, dt);
      p.spin = on && !reduced ? p.spin + dt * 0.45 : damp(p.spin, Math.round(p.spin / (Math.PI * 2)) * Math.PI * 2, 2, dt);
    });

    // 1 · shadow map from the sun
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, SM, SM);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(sp.program);
    gl.uniformMatrix4fv(sp.uniforms.uLightVP, false, lightVP);
    gl.uniformMatrix4fv(sp.uniforms.uModel, false, ident);
    bindMesh(gl, sp, boardMesh);
    gl.drawArrays(gl.TRIANGLES, 0, boardMesh.count);
    P.forEach((p) => {
      gl.uniformMatrix4fv(sp.uniforms.uModel, false, modelOf(p));
      bindMesh(gl, sp, meshes[p.type]);
      gl.drawArrays(gl.TRIANGLES, 0, meshes[p.type].count);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    fitCanvas(canvas, 2);
    const w = canvas.width, h = canvas.height, aspect = w / h;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const az = -0.32 + state.mx * 0.22 + (reduced ? 0 : Math.sin(t * 0.11) * 0.07);
    const el = 0.6 - state.my * 0.08;
    const dist = (canvas.clientWidth < 600 ? 24.5 : 20.5) / Math.min(1, aspect * 0.92);
    const target = [0, -0.7, 0.3];
    const eye = [target[0] + Math.sin(az) * Math.cos(el) * dist, target[1] + Math.sin(el) * dist, target[2] + Math.cos(az) * Math.cos(el) * dist];
    const view = mat4.lookAt(eye, target, [0, 1, 0]);
    const proj = mat4.perspective(0.56, aspect, 0.5, 80);
    const vp = mat4.multiply(proj, view);

    // 2 · reflections beneath the polished surface
    drawPieces(view, proj, eye, true);

    // 3 · the board, partly transparent over its reflections
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(bp.program);
    setCommon(bp, view, proj, eye);
    gl.uniform1f(bp.uniforms.uTime, t);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, markTex);
    gl.uniform1i(bp.uniforms.uMarks, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, engraveTex);
    gl.uniform1i(bp.uniforms.uEngrave, 1);
    bindMesh(gl, bp, boardMesh);
    gl.drawArrays(gl.TRIANGLES, 0, boardMesh.count);
    gl.disable(gl.BLEND);

    // 4 · the pieces
    drawPieces(view, proj, eye, false);

    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const toPx = (q) => [(q[0] * 0.5 + 0.5) * cw, (1 - (q[1] * 0.5 + 0.5)) * ch];
    P.forEach((p, i) => {
      const [tx, ty] = toPx(mat4.transformPoint(vp, [p.x, p.lift + p.h * SCALE, p.z]));
      const [bx, by] = toPx(mat4.transformPoint(vp, [p.x, p.lift, p.z]));
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
