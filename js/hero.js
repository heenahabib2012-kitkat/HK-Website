/* Hero: a sculpted HK monogram rendered in WebGL — royal-blue lacquered stems,
   brushed-gold bevels and crossbar, a dark colonnade behind and a reflective floor. */
import { mat4, createGL, createProgram, createMesh, bindMesh, fitCanvas, visibleLoop, damp, clamp, prefersReducedMotion } from './gl.js';

const MAT_BLUE = 0, MAT_GOLD = 1, MAT_ARCH = 2;

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

function buildMonogram() {
  const b = new Builder();
  const W = 0.62, T = 2, B = -2, bev = 0.085;
  // H: left stem, shared stem (H right / K stem), gold crossbar set back
  b.rect(-2.15, B, -2.15 + W, T, 0.45, -0.45, bev, { piece: 0 });
  b.rect(-0.31, B, 0.31, T, 0.45, -0.45, bev, { piece: 1 });
  b.rect(-2.15 + W - 0.05, -0.2, -0.26, 0.2, 0.26, -0.3, 0.05, { front: MAT_GOLD, chamfer: MAT_GOLD, side: MAT_GOLD, piece: 2 });
  // K upper arm: parallelogram rising from the stem
  const armDir = [1.94, 2.35];
  const a0 = [0.25, -0.35], a1 = [0.25 + armDir[0] * (2.35 / 2.35), 2.0];
  const topLeftX = 1.42;
  const a3y = 2.0 - (topLeftX - 0.25) * (armDir[1] / armDir[0]);
  b.extrude([a0, [a1[0] + 0.05, a1[1]], [topLeftX, 2.0], [0.25, a3y]], 0.42, -0.42, bev, { piece: 3 });
  // K lower leg: emerges from beneath the arm, set back one plane
  const legDir = [-1.05, 2.45];
  const l0 = [1.5, B], l1 = [2.32, B];
  const armLine = { p: [a0[0] - 0.12, a0[1] + 0.14], d: armDir };
  const l2 = intersect(l1, legDir, armLine.p, armLine.d);
  const l3 = intersect(l0, legDir, armLine.p, armLine.d);
  b.extrude([l0, l1, l2, l3], 0.3, -0.36, bev, { piece: 4 });
  // thin gold plinth line beneath the mark
  b.rect(-2.15, -2.32, 2.32, -2.26, 0.06, -0.06, 0.02, { front: MAT_GOLD, chamfer: MAT_GOLD, side: MAT_GOLD, piece: 5 });
  return b;
}

function buildColonnade() {
  const b = new Builder();
  for (let i = -6; i <= 6; i++) {
    const x = i * 3.4, w = 0.55, z = -11 - Math.abs(i) * 0.2;
    b.rect(x - w / 2, -2.6, x + w / 2, 14, z + 0.6, z - 0.6, 0.04, { front: MAT_ARCH, chamfer: MAT_GOLD, side: MAT_ARCH, piece: 9 });
  }
  // lintel
  b.rect(-24, 7.4, 24, 7.9, -10.0, -11.6, 0.04, { front: MAT_ARCH, chamfer: MAT_GOLD, side: MAT_ARCH, piece: 9 });
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
  float t = clamp(uAssemble * 1.8 - aPiece * 0.16, 0.0, 1.0);
  t = 1.0 - pow(1.0 - t, 4.0);
  if (aPiece < 8.5) { p.z -= (1.0 - t) * 7.0; p.y += (1.0 - t) * (aPiece - 2.5) * 0.4; }
  vec4 w = uModel * vec4(p, 1.0);
  vW = w.xyz; vL = aLocal; vMat = aMat;
  vN = mat3(uModel) * aNormal;
  gl_Position = uProj * uView * w;
}`;

const FS = `
precision highp float;
varying vec3 vN, vW, vL; varying float vMat;
uniform vec3 uEye, uKey, uBg; uniform float uReflect, uFloorY, uTime, uFog;
vec3 env(vec3 d){
  float h = d.y;
  vec3 c = mix(vec3(0.010,0.018,0.055), vec3(0.05,0.10,0.30), smoothstep(-0.4, 0.9, h));
  c += vec3(1.0,0.86,0.62) * 0.55 * smoothstep(0.035, 0.0, abs(h - 0.02)) ;          // warm horizon band
  float sb = max(dot(d, normalize(uKey)), 0.0);
  c += vec3(1.0,0.95,0.86) * (pow(sb, 22.0) * 3.2 + pow(sb, 3.0) * 0.25);           // key softbox
  float rim = max(dot(d, normalize(vec3(0.9,0.35,-0.6))), 0.0);
  c += vec3(0.55,0.70,1.0) * pow(rim, 18.0) * 1.4;                                   // cool strip light
  return c;
}
float hash(float n){ return fract(sin(n) * 43758.5453); }
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
void main(){
  if (uReflect > 0.5 && vW.y > uFloorY) discard;
  vec3 N = normalize(vN), V = normalize(uEye - vW), R = reflect(-V, N);
  if (!gl_FrontFacing) N = -N;
  float NV = clamp(dot(N, V), 0.0, 1.0);
  vec3 L1 = normalize(uKey), L2 = normalize(vec3(0.8,0.15,0.5)), L3 = normalize(vec3(-0.2,0.5,-1.0));
  vec3 col;
  if (vMat < 0.5) {
    vec3 alb = vec3(0.016, 0.055, 0.32);
    float d = max(dot(N,L1),0.0)*0.95 + max(dot(N,L2),0.0)*0.22 + 0.10;
    float F = 0.045 + 0.955 * pow(1.0 - NV, 5.0);
    vec3 H = normalize(L1 + V);
    float sp = pow(max(dot(N,H),0.0), 90.0) * 0.9;
    col = alb * d + env(R) * F * 0.9 + vec3(1.0,0.93,0.8) * sp * 0.35;
  } else if (vMat < 1.5) {
    vec3 F0 = vec3(1.0, 0.76, 0.36);
    float streak = hash(floor((vL.x * 0.7 + vL.y + vL.z * 0.3) * 260.0)) * 0.22 + 0.89;
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - NV, 5.0);
    vec3 H = normalize(L1 + V);
    float sp = pow(max(dot(N,H),0.0), 48.0);
    float rim = pow(max(dot(N, L3), 0.0), 2.0);
    col = (env(R) * 0.85 + vec3(1.0,0.9,0.7) * sp * 1.6 + vec3(0.25,0.18,0.08)) * F * streak + F0 * rim * 0.2;
  } else {
    vec3 alb = vec3(0.010, 0.020, 0.060);
    float d = max(dot(N,L1),0.0)*0.4 + 0.3;
    float F = 0.02 + 0.5 * pow(1.0 - NV, 5.0);
    col = alb * d + env(R) * F * 0.12;
  }
  col = aces(col * 1.15);
  float dist = length(uEye - vW);
  col = mix(col, uBg, clamp((dist - 9.0) * uFog, 0.0, 0.88));
  if (uReflect > 0.5) {
    float fade = smoothstep(2.2, 0.0, uFloorY - vW.y);
    col = mix(uBg, col, fade * 0.32);
  }
  gl_FragColor = vec4(pow(col, vec3(1.0/2.2)), 1.0);
}`;

const FLOOR_VS = `
attribute vec3 aPos; uniform mat4 uProj, uView; varying vec3 vW;
void main(){ vW = aPos; gl_Position = uProj * uView * vec4(aPos, 1.0); }`;

const FLOOR_FS = `
precision highp float; varying vec3 vW; uniform vec3 uBg, uCenter; uniform float uTime;
void main(){
  vec2 p = vW.xz;
  float r = length((p - uCenter.xz) * vec2(0.42, 1.0));
  float shadow = smoothstep(2.6, 0.0, r) * 0.55;
  vec2 g = abs(fract(p / 2.6 + 0.5) - 0.5) * 2.6;
  float line = 1.0 - smoothstep(0.0, 0.018, min(g.x, g.y));
  float fall = exp(-length(p - vec2(uCenter.x, -1.0)) * 0.11);
  vec3 col = uBg * (1.0 - shadow);
  col += vec3(0.80,0.62,0.30) * line * fall * 0.16;
  float a = 0.62 + shadow * 0.35;
  gl_FragColor = vec4(col * a, a);
}`;

/* ---------- scene ---------- */

export function initHero(canvas, { onReady } = {}) {
  const gl = createGL(canvas);
  if (!gl) return null;
  let prog, floorProg;
  try {
    prog = createProgram(gl, VS, FS);
    floorProg = createProgram(gl, FLOOR_VS, FLOOR_FS);
  } catch (e) {
    console.warn(e);
    return null;
  }
  const mono = toMesh(gl, buildMonogram());
  const arch = toMesh(gl, buildColonnade());
  const F = 2.62, S = 40;
  const floor = createMesh(gl, { aPos: { data: [-S, -F, -S, S, -F, -S, S, -F, S, -S, -F, -S, S, -F, S, -S, -F, S], size: 3 } }, 6);

  const reduced = prefersReducedMotion();
  const bg = [0.018, 0.035, 0.105];
  const state = {
    mx: 0, my: 0, tx: 0, ty: 0, scroll: 0, assemble: reduced ? 1 : 0, started: reduced,
  };

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

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(bg[0], bg[1], bg[2], 1);

  const drawMesh = (mesh, model, proj, view, eye, reflect, fog) => {
    gl.useProgram(prog.program);
    const u = prog.uniforms;
    gl.uniformMatrix4fv(u.uProj, false, proj);
    gl.uniformMatrix4fv(u.uView, false, view);
    gl.uniformMatrix4fv(u.uModel, false, model);
    gl.uniform3fv(u.uEye, eye);
    gl.uniform3fv(u.uBg, bg);
    gl.uniform3fv(u.uKey, state.key);
    gl.uniform1f(u.uReflect, reflect ? 1 : 0);
    gl.uniform1f(u.uFloorY, -F);
    gl.uniform1f(u.uFog, fog);
    gl.uniform1f(u.uAssemble, state.assemble);
    bindMesh(gl, prog, mesh);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  };

  const mirror = mat4.multiply(mat4.translation(0, -F, 0), mat4.multiply(mat4.scaling(1, -1, 1), mat4.translation(0, F, 0)));

  const frame = (t, dt) => {
    fitCanvas(canvas, 1.75);
    const w = canvas.width, h = canvas.height, aspect = w / h;
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (state.started && state.assemble < 1) state.assemble = Math.min(1, state.assemble + dt / 2.4);
    state.mx = damp(state.mx, state.tx, 2.6, dt);
    state.my = damp(state.my, state.ty, 2.6, dt);
    const rect = hero.getBoundingClientRect();
    state.scroll = clamp(-rect.top / Math.max(1, rect.height), 0, 1);

    const wide = aspect > 1.15;
    const markX = wide ? 4.3 : 0, markY = wide ? 0.2 : 3.4;
    const idle = reduced ? 0 : Math.sin(t * 0.35) * 0.06;
    state.key = [-0.55 + Math.sin(t * 0.18) * 0.25, 0.75, 0.75];

    const dist = (wide ? 15.5 : 19 + (1 - aspect) * 14) - state.scroll * 3.5;
    const eye = [state.mx * 1.6, 0.9 - state.my * 0.8 + state.scroll * 2.2, dist];
    const target = [wide ? 1.4 : 0, wide ? 0.0 : -1.2, 0];
    const view = mat4.lookAt(eye, target, [0, 1, 0]);
    const proj = mat4.perspective(wide ? 0.62 : 0.72, aspect, 0.5, 80);

    let model = mat4.rotationY(-0.32 + state.mx * 0.22 + idle + state.scroll * 0.5);
    model = mat4.multiply(mat4.rotationX(-state.my * 0.06), model);
    model = mat4.multiply(mat4.translation(markX, markY + Math.sin(t * 0.8) * 0.04 * (reduced ? 0 : 1), 0), model);
    const ident = mat4.identity();

    drawMesh(arch, ident, proj, view, eye, false, 0.075);
    gl.frontFace(gl.CW);
    drawMesh(mono, mat4.multiply(mirror, model), proj, view, eye, true, 0.03);
    gl.frontFace(gl.CCW);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.useProgram(floorProg.program);
    gl.uniformMatrix4fv(floorProg.uniforms.uProj, false, proj);
    gl.uniformMatrix4fv(floorProg.uniforms.uView, false, view);
    gl.uniform3fv(floorProg.uniforms.uBg, bg);
    gl.uniform3fv(floorProg.uniforms.uCenter, [markX, 0, 0]);
    bindMesh(gl, floorProg, floor);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    drawMesh(mono, model, proj, view, eye, false, 0.03);
  };

  state.key = [-0.55, 0.75, 0.75];
  const loop = visibleLoop(canvas, frame);
  requestAnimationFrame(() => { canvas.classList.add('is-ready'); onReady && onReady(); });
  return {
    start() { state.started = true; loop.kick(); },
  };
}
