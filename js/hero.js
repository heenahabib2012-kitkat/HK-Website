/* Hero: the HK monogram staged like a studio product photograph — royal-blue lacquer,
   gilded edges and crossbar, a polished plinth, soft spotlights and a seamless backdrop. */
import { mat4, createGL, createProgram, createMesh, bindMesh, fitCanvas, visibleLoop, damp, clamp, prefersReducedMotion } from './gl.js';

const MAT_BLUE = 0, MAT_GOLD = 1, MAT_STONE = 2;

/* ---------- geometry ---------- */

function intersect(p1, d1, p2, d2) {
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / den;
  return [p1[0] + d1[0] * t, p1[1] + d1[1] * t];
}

function insetConvex(poly, b) {
  const n = poly.length, lines = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i], c = poly[(i + 1) % n];
    const dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy);
    const nx = -dy / l, ny = dx / l; // inward for CCW
    lines.push({ p: [a[0] + nx * b, a[1] + ny * b], d: [dx, dy] });
  }
  return poly.map((_, i) => {
    const prev = lines[(i - 1 + n) % n], cur = lines[i];
    return intersect(prev.p, prev.d, cur.p, cur.d);
  });
}

class Builder {
  constructor() { this.pos = []; this.nrm = []; this.mat = []; this.loc = []; this.piece = []; }
  tri(a, b, c, n, m, piece) {
    for (const v of [a, b, c]) {
      this.pos.push(v[0], v[1], v[2]);
      this.nrm.push(n[0], n[1], n[2]);
      this.loc.push(v[0], v[1], v[2]);
      this.mat.push(m);
      this.piece.push(piece);
    }
  }
  quad(a, b, c, d, n, m, piece) { this.tri(a, b, c, n, m, piece); this.tri(a, c, d, n, m, piece); }

  /** Extrude a convex CCW polygon with a 45° chamfer around the front face. */
  extrude(poly, zf, zb, bevel, { front = MAT_BLUE, chamfer = MAT_GOLD, side = MAT_BLUE, piece = 0 } = {}) {
    const n = poly.length, inner = insetConvex(poly, bevel);
    const zc = zf - bevel;
    for (let i = 1; i < n - 1; i++)
      this.tri([inner[0][0], inner[0][1], zf], [inner[i][0], inner[i][1], zf], [inner[i + 1][0], inner[i + 1][1], zf], [0, 0, 1], front, piece);
    for (let i = 1; i < n - 1; i++)
      this.tri([poly[0][0], poly[0][1], zb], [poly[i + 1][0], poly[i + 1][1], zb], [poly[i][0], poly[i][1], zb], [0, 0, -1], side, piece);
    for (let i = 0; i < n; i++) {
      const a = poly[i], c = poly[(i + 1) % n], ia = inner[i], ic = inner[(i + 1) % n];
      const dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy);
      const ox = dy / l, oy = -dx / l; // outward
      const s = Math.SQRT1_2;
      this.quad([a[0], a[1], zc], [c[0], c[1], zc], [ic[0], ic[1], zf], [ia[0], ia[1], zf], [ox * s, oy * s, s], chamfer, piece);
      this.quad([a[0], a[1], zb], [c[0], c[1], zb], [c[0], c[1], zc], [a[0], a[1], zc], [ox, oy, 0], side, piece);
    }
  }
  rect(x0, y0, x1, y1, zf, zb, bevel, opts) {
    this.extrude([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], zf, zb, bevel, opts);
  }
}

function buildScene() {
  const b = new Builder();
  const T = 2, B = -2, W = 0.56, bev = 0.045;
  // H — left stem, shared stem (H right / K stem), gilded crossbar set slightly back
  b.rect(-2.0, B, -2.0 + W, T, 0.5, -0.5, bev, { piece: 0 });
  b.rect(-0.28, B, 0.28, T, 0.5, -0.5, bev, { piece: 1 });
  b.rect(-2.0 + W - 0.04, -0.15, -0.24, 0.15, 0.34, -0.34, 0.035, { front: MAT_GOLD, chamfer: MAT_GOLD, side: MAT_GOLD, piece: 2 });
  // K upper arm — a parallelogram rising from the stem
  const armDir = [1.86, 2.3];
  const a0 = [0.22, -0.3];
  const tr = [a0[0] + armDir[0], 2.0], tlX = 1.46;
  const a3y = 2.0 - (tlX - 0.22) * (armDir[1] / armDir[0]);
  b.extrude([a0, tr, [tlX, 2.0], [0.22, a3y]], 0.48, -0.48, bev, { piece: 3 });
  // K lower leg — emerges from beneath the arm, one plane further back
  const legDir = [-1.0, 2.4];
  const l0 = [1.42, B], l1 = [2.12, B];
  const armLine = { p: [a0[0] - 0.1, a0[1] + 0.12], d: armDir };
  b.extrude([l0, l1, intersect(l1, legDir, armLine.p, armLine.d), intersect(l0, legDir, armLine.p, armLine.d)], 0.38, -0.42, bev, { piece: 4 });
  // polished stone plinth with a gilded top edge
  b.rect(-2.75, -2.72, 2.85, -2.0, 1.15, -1.15, 0.03, { front: MAT_STONE, chamfer: MAT_GOLD, side: MAT_STONE, piece: 9 });
  return b;
}

function toMesh(gl, b) {
  return createMesh(gl, {
    aPos: { data: b.pos, size: 3 },
    aNormal: { data: b.nrm, size: 3 },
    aMat: { data: b.mat, size: 1 },
    aLocal: { data: b.loc, size: 3 },
    aPiece: { data: b.piece, size: 1 },
  }, b.pos.length / 3);
}

/* ---------- shaders ---------- */

const VS = `
attribute vec3 aPos; attribute vec3 aNormal; attribute float aMat; attribute vec3 aLocal; attribute float aPiece;
uniform mat4 uProj, uView, uModel; uniform float uAssemble;
varying vec3 vN, vW, vL; varying float vMat;
void main(){
  vec3 p = aPos;
  if (aPiece < 8.5) {
    float t = clamp(uAssemble * 1.8 - aPiece * 0.16, 0.0, 1.0);
    t = 1.0 - pow(1.0 - t, 4.0);
    p.y += (1.0 - t) * 5.0;
    p.z -= (1.0 - t) * (2.0 + aPiece);
  }
  vec4 w = uModel * vec4(p, 1.0);
  vW = w.xyz; vL = aLocal; vMat = aMat;
  vN = mat3(uModel) * aNormal;
  gl_Position = uProj * uView * w;
}`;

const FS = `
precision highp float;
varying vec3 vN, vW, vL; varying float vMat;
uniform vec3 uEye, uKey, uRim; uniform float uReflect, uFloorY, uSweep, uAssemble;
vec3 env(vec3 d){
  vec3 c = mix(vec3(0.004,0.008,0.03), vec3(0.03,0.07,0.22), smoothstep(-0.3, 1.0, d.y));
  // large overhead softbox, slightly left
  vec3 sbDir = normalize(vec3(-0.35, 0.85, 0.4));
  float sb = dot(d, sbDir);
  c += vec3(1.0,0.96,0.9) * smoothstep(0.86, 0.95, sb) * 2.4;
  c += vec3(0.6,0.7,1.0) * smoothstep(0.4, 0.9, sb) * 0.12;
  // tall strip light camera-right
  vec3 st = normalize(vec3(0.85, 0.15, 0.5));
  float sx = dot(d, st);
  c += vec3(1.0,0.88,0.7) * smoothstep(0.93, 0.98, sx) * smoothstep(0.7, 0.2, abs(d.y)) * 1.6;
  return c;
}
float hash(float n){ return fract(sin(n) * 43758.5453); }
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
void main(){
  if (uReflect > 0.5 && vW.y > uFloorY + 0.001) discard;
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uEye - vW), R = reflect(-V, N);
  float NV = clamp(dot(N, V), 0.0, 1.0);
  vec3 Lk = normalize(uKey - vW), Lr = normalize(uRim - vW);
  vec3 Hk = normalize(Lk + V), Hr = normalize(Lr + V);
  float dk = max(dot(N, Lk), 0.0), dr = max(dot(N, Lr), 0.0);
  vec3 keyC = vec3(1.0, 0.95, 0.88), rimC = vec3(0.65, 0.78, 1.0);
  float ao = vMat < 1.5 ? mix(0.42, 1.0, smoothstep(-2.0, -1.35, vL.y)) : 1.0;
  vec3 col;
  if (vMat < 0.5) {
    // deep royal-blue lacquer with a clear coat
    vec3 alb = vec3(0.010, 0.040, 0.27);
    float fall = mix(0.6, 1.15, smoothstep(-2.0, 2.0, vL.y));
    float F = 0.04 + 0.96 * pow(1.0 - NV, 5.0);
    col = alb * (0.07 + dk * 1.05 * keyC + dr * 0.35 * rimC) * fall;
    col += keyC * (pow(max(dot(N,Hk),0.0), 220.0) * 2.2 + pow(max(dot(N,Hk),0.0), 26.0) * 0.06);
    col += rimC * pow(max(dot(N,Hr),0.0), 160.0) * 1.4;
    col += env(R) * mix(0.06, 1.0, F) * 0.85;
    col *= ao;
  } else if (vMat < 1.5) {
    // brushed gold
    vec3 F0 = vec3(1.0, 0.74, 0.34);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - NV, 5.0);
    float streak = hash(floor((vL.x * 0.6 + vL.y + vL.z * 0.4) * 300.0)) * 0.18 + 0.91;
    float sweep = exp(-pow((vW.x - uSweep) * 1.2, 2.0)) * 0.9;
    col = env(R) * 0.9 + vec3(0.18, 0.13, 0.06);
    col += keyC * (pow(max(dot(N,Hk),0.0), 70.0) * 3.0 + dk * 0.25);
    col += rimC * pow(max(dot(N,Hr),0.0), 50.0) * 1.3;
    col = col * F * streak + F0 * sweep * 0.35;
    col *= ao;
  } else {
    // polished midnight stone
    vec3 alb = vec3(0.006, 0.012, 0.038);
    float F = 0.03 + 0.97 * pow(1.0 - NV, 5.0);
    col = alb * (0.3 + dk * 0.8);
    col += keyC * pow(max(dot(N,Hk),0.0), 320.0) * 1.2;
    col += env(R) * F * 0.5;
    if (N.y > 0.9) {
      // contact shadow beneath the letters, fading in as they land
      float inside = smoothstep(2.35, 1.9, abs(vL.x - 0.05)) * smoothstep(0.9, 0.35, abs(vL.z));
      col *= 1.0 - 0.7 * inside * smoothstep(0.6, 1.0, uAssemble);
      col += vec3(0.05, 0.10, 0.30) * 0.25 * (1.0 - inside);
    }
  }
  col = aces(col * 1.1);
  col = pow(col, vec3(1.0/2.2));
  if (uReflect > 0.5) {
    float fade = smoothstep(2.6, 0.0, uFloorY - vW.y) * 0.55;
    gl_FragColor = vec4(col * fade, fade);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}`;

const BG_VS = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const BG_FS = `
precision highp float;
uniform vec2 uRes, uGlow; uniform float uTime;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - uGlow) / uRes.y;
  vec3 c = mix(vec3(0.008,0.016,0.05), vec3(0.020,0.040,0.115), smoothstep(0.0, 1.0, uv.y));
  float g = exp(-dot(p * vec2(0.75, 1.0), p * vec2(0.75, 1.0)) * 2.6);
  c += vec3(0.06, 0.15, 0.46) * g * 0.95;
  // soft beam from the overhead light
  float beam = exp(-pow(p.x * 3.2 + p.y * 0.35, 2.0)) * smoothstep(-0.1, 0.7, p.y);
  c += vec3(0.55, 0.62, 0.85) * beam * 0.045;
  float v = length((uv - 0.5) * vec2(1.0, 1.25));
  c *= 1.0 - 0.6 * smoothstep(0.35, 0.95, v);
  c += (h(gl_FragCoord.xy + fract(uTime)) - 0.5) / 180.0;
  gl_FragColor = vec4(c, 1.0);
}`;

const FLOOR_VS = `
attribute vec3 aPos; uniform mat4 uProj, uView; varying vec3 vW;
void main(){ vW = aPos; gl_Position = uProj * uView * vec4(aPos, 1.0); }`;
const FLOOR_FS = `
precision highp float; varying vec3 vW; uniform vec3 uCenter;
void main(){
  vec2 d = vW.xz - uCenter.xz;
  float dist = length(d * vec2(0.55, 1.0));
  float pool = exp(-dist * dist * 0.09);
  // soft contact shadow hugging the plinth footprint
  vec2 q = abs(d) - vec2(2.8, 1.15);
  float box = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  float contact = smoothstep(1.4, 0.0, box);
  vec3 col = vec3(0.006, 0.013, 0.042) + vec3(0.05, 0.11, 0.34) * pool * 0.35;
  col *= 1.0 - contact * 0.75;
  float a = (0.5 + contact * 0.4) * smoothstep(22.0, 6.0, length(d));
  gl_FragColor = vec4(col * a, a);
}`;

/* ---------- scene ---------- */

export function initHero(canvas, { onReady } = {}) {
  const gl = createGL(canvas);
  if (!gl) return null;
  let prog, floorProg, bgProg;
  try {
    prog = createProgram(gl, VS, FS);
    floorProg = createProgram(gl, FLOOR_VS, FLOOR_FS);
    bgProg = createProgram(gl, BG_VS, BG_FS);
  } catch (e) {
    console.warn(e);
    return null;
  }
  const scene = toMesh(gl, buildScene());
  const F = 2.72, S = 60;
  const floor = createMesh(gl, { aPos: { data: [-S, -F, -S, S, -F, -S, S, -F, S, -S, -F, -S, S, -F, S, -S, -F, S], size: 3 } }, 6);
  const quad = createMesh(gl, { aPos: { data: [-1, -1, 3, -1, -1, 3], size: 2 } }, 3);

  const reduced = prefersReducedMotion();
  const state = { mx: 0, my: 0, tx: 0, ty: 0, scroll: 0, assemble: reduced ? 1 : 0, started: reduced };

  const hero = canvas.closest('section') || canvas.parentElement;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    state.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    state.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  hero.addEventListener('pointerleave', () => { state.tx = 0; state.ty = 0; });
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma == null) return;
    state.tx = clamp(e.gamma / 30, -1, 1);
    state.ty = clamp((e.beta - 45) / 30, -1, 1);
  });

  const mirror = mat4.multiply(mat4.translation(0, -F, 0), mat4.multiply(mat4.scaling(1, -1, 1), mat4.translation(0, F, 0)));

  const drawScene = (model, proj, view, eye, reflect, sweep) => {
    gl.useProgram(prog.program);
    const u = prog.uniforms;
    gl.uniformMatrix4fv(u.uProj, false, proj);
    gl.uniformMatrix4fv(u.uView, false, view);
    gl.uniformMatrix4fv(u.uModel, false, model);
    gl.uniform3fv(u.uEye, eye);
    gl.uniform3fv(u.uKey, state.key);
    gl.uniform3fv(u.uRim, state.rim);
    gl.uniform1f(u.uReflect, reflect ? 1 : 0);
    gl.uniform1f(u.uFloorY, -F);
    gl.uniform1f(u.uSweep, sweep);
    gl.uniform1f(u.uAssemble, state.assemble);
    bindMesh(gl, prog, scene);
    gl.drawArrays(gl.TRIANGLES, 0, scene.count);
  };

  const frame = (t, dt) => {
    fitCanvas(canvas, 2);
    const w = canvas.width, h = canvas.height, aspect = w / h;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (state.started && state.assemble < 1) state.assemble = Math.min(1, state.assemble + dt / 2.6);
    state.mx = damp(state.mx, state.tx, 2.4, dt);
    state.my = damp(state.my, state.ty, 2.4, dt);
    const rect = hero.getBoundingClientRect();
    state.scroll = clamp(-rect.top / Math.max(1, rect.height), 0, 1);

    const wide = aspect > 1.15;
    const markX = wide ? 4.2 : 0, markY = wide ? 0 : 4.2;
    const idle = reduced ? 0 : Math.sin(t * 0.3) * 0.07;

    const dist = (wide ? 20 : 22 + (1 - aspect) * 16) - state.scroll * 4;
    const eye = [state.mx * 1.4, 0.9 - state.my * 0.6 + state.scroll * 2.4, dist];
    const target = [wide ? 1.5 : 0, wide ? -0.4 : -1.4, 0];
    const view = mat4.lookAt(eye, target, [0, 1, 0]);
    const proj = mat4.perspective(wide ? 0.5 : 0.6, aspect, 0.5, 120);

    // studio lights, fixed in the world so reflections glide as the mark turns
    state.key = [markX - 7, markY + 8, 9];
    state.rim = [markX + 8, markY + 3, -6];
    const sweep = markX + (reduced ? 0 : Math.sin(t * 0.32) * 3.6);

    let model = mat4.rotationY(-0.36 + state.mx * 0.2 + idle + state.scroll * 0.45);
    model = mat4.multiply(mat4.translation(markX, markY, 0), model);

    // backdrop
    const c = mat4.transformPoint(mat4.multiply(proj, view), [markX, markY + 0.2, 0]);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(bgProg.program);
    gl.uniform2f(bgProg.uniforms.uRes, w, h);
    gl.uniform2f(bgProg.uniforms.uGlow, (c[0] * 0.5 + 0.5) * w, (c[1] * 0.5 + 0.5) * h);
    gl.uniform1f(bgProg.uniforms.uTime, t);
    bindMesh(gl, bgProg, quad);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST);

    // reflection in the polished floor
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    drawScene(mat4.multiply(mirror, model), proj, view, eye, true, sweep);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.depthMask(false);
    gl.useProgram(floorProg.program);
    gl.uniformMatrix4fv(floorProg.uniforms.uProj, false, proj);
    gl.uniformMatrix4fv(floorProg.uniforms.uView, false, view);
    gl.uniform3fv(floorProg.uniforms.uCenter, [markX, 0, 0]);
    bindMesh(gl, floorProg, floor);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    drawScene(model, proj, view, eye, false, sweep);
  };

  state.key = [-3, 8, 9];
  state.rim = [12, 3, -6];
  const loop = visibleLoop(canvas, frame);
  requestAnimationFrame(() => { canvas.classList.add('is-ready'); onReady && onReady(); });
  return {
    start() { state.started = true; loop.kick(); },
  };
}
