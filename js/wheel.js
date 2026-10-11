/* Industries: a sculpted dial-wheel. Nine turned porcelain spokes run from a gilded HK hub
   to a lacquered dial ring engraved with the industry names. Choosing an industry turns
   the wheel — with a gentle mechanical settle — until its spoke meets the gold pointer. */
import { Mesh, arc, lathe, box, extrudeProfile } from './geo.js';
import { mat4, createGL, createProgram, createMesh, bindMesh, fitCanvas, visibleLoop, damp, prefersReducedMotion } from './gl.js';

const N = 9, STEP = (Math.PI * 2) / N;
const R_IN = 2.24, R_OUT = 2.86, R_JEWEL = 2.39, R_TEXT = 2.63;
const M_LACQUER = 0, M_GOLD = 1, M_PORCELAIN = 2, M_LAPIS = 3, M_DIAL = 4;
const Z_FRONT = 0.07;
const toAxisZ = mat4.rotationX(Math.PI / 2);   // lathe builds around y; the wheel faces +z

// HK monogram polygons from the SVG mark (120 × 100 viewBox)
const MARK = [
  [[8, 6], [23.5, 6], [23.5, 94], [8, 94]],
  [[54, 6], [69.5, 6], [69.5, 94], [54, 94]],
  [[23.5, 45.5], [54, 45.5], [54, 54.5], [23.5, 54.5]],
  [[69.5, 46], [101, 6], [118, 6], [69.5, 67.6]],
  [[77.3, 57.7], [87.7, 44.5], [116, 94], [98, 94]],
];

const torus = (m, R, r, y = 0) => lathe(m, arc(R, y, r, 0, Math.PI * 2, 18), { seg: 120 });

function ccw(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return a < 0 ? poly.slice().reverse() : poly;
}

function buildWheel() {
  const m = new Mesh(['mat', 'id']);
  m.set('id', -1);
  // dial ring: lacquer with an engraved front face
  m.set('mat', M_DIAL);
  let f = m.count;
  lathe(m, [[R_IN, -Z_FRONT], [R_OUT, -Z_FRONT], [R_OUT + 0.03, -0.03], [R_OUT + 0.03, 0.03], [R_OUT, Z_FRONT], [R_IN, Z_FRONT], [R_IN, -Z_FRONT]], { seg: 160 });
  m.transform(f, toAxisZ);
  // gold beads on both edges of the ring, and a fine inner line
  m.set('mat', M_GOLD);
  f = m.count;
  torus(m, R_OUT + 0.05, 0.05);
  torus(m, R_IN, 0.045);
  torus(m, 1.0, 0.018);
  m.transform(f, toAxisZ);
  // spokes: turned balusters from hub to ring, plus a gold collar where each meets the rim
  for (let i = 0; i < N; i++) {
    const rot = mat4.rotationZ(-i * STEP);
    m.set('id', i).set('mat', M_PORCELAIN);
    f = m.count;
    lathe(m, [[0, 0], [0.085, 0], [0.09, 0.04], [0.06, 0.1], [0.05, 0.3], [0.068, 0.62], [0.072, 0.72], [0.055, 0.86],
      [0.045, 1.25], [0.05, 1.42], [0.07, 1.47], [0.07, 1.52], [0.05, 1.56], [0.05, 1.68], [0, 1.68]], { seg: 28 });
    m.transform(f, mat4.multiply(rot, mat4.translation(0, 0.56, 0)));
    m.set('mat', M_GOLD);
    f = m.count;
    lathe(m, [[0, 0], [0.1, 0], [0.11, 0.03], [0.1, 0.06], [0, 0.06]], { seg: 28 });
    m.transform(f, mat4.multiply(rot, mat4.translation(0, R_IN - 0.1, 0)));
    // lapis jewel in a gold bezel, set into the dial
    m.set('mat', M_LAPIS);
    f = m.count;
    lathe(m, [[0, 0], [0.105, 0], ...arc(0, 0, 0.105, 0, Math.PI / 2, 10).slice(1).map(([x, y]) => [x, y * 0.55])], { seg: 36 });
    m.transform(f, mat4.multiply(rot, mat4.multiply(mat4.translation(0, R_JEWEL, Z_FRONT), toAxisZ)));
    m.set('mat', M_GOLD);
    f = m.count;
    torus(m, 0.115, 0.018);
    m.transform(f, mat4.multiply(rot, mat4.multiply(mat4.translation(0, R_JEWEL, Z_FRONT), toAxisZ)));
  }
  return m;
}

function buildHub() {
  // the hub stays upright while the wheel turns around it, so the mark always reads
  const m = new Mesh(['mat', 'id']);
  m.set('id', -1);
  let f;
  // hub: a turned boss
  m.set('mat', M_LACQUER);
  f = m.count;
  lathe(m, [[0, -0.12], [0.56, -0.12], [0.6, -0.02], [0.58, 0.12], [0.52, 0.19], [0, 0.19]], { seg: 72 });
  m.set('mat', M_GOLD);
  torus(m, 0.56, 0.03, 0.1);
  m.transform(f, toAxisZ);
  // the raised HK mark
  const s = 0.0068;
  for (const poly of MARK) {
    const p = ccw(poly.map(([x, y]) => [(x - 63) * s, (50 - y) * s]));
    extrudeProfile(m, p, 0.04, 0.01, 0.21);
  }
  return m;
}

function buildScale() {
  // a fine counter-rotating scale ring behind the wheel
  const m = new Mesh(['mat', 'id']);
  m.set('mat', M_GOLD).set('id', -1);
  let f = m.count;
  torus(m, 3.12, 0.008);
  m.transform(f, toAxisZ);
  for (let k = 0; k < 120; k++) {
    const long = k % 10 === 0, len = long ? 0.13 : 0.06, w = long ? 0.012 : 0.007;
    f = m.count;
    box(m, -w, 3.14, -0.006, w, 3.14 + len, 0.006);
    m.transform(f, mat4.rotationZ((k / 120) * Math.PI * 2));
  }
  return m;
}

function buildPointer() {
  const m = new Mesh(['mat', 'id']);
  m.set('mat', M_GOLD).set('id', -1);
  extrudeProfile(m, [[0, R_OUT + 0.14], [0.13, R_OUT + 0.42], [-0.13, R_OUT + 0.42]], 0.05, 0.02, 0.1);
  box(m, -0.006, R_OUT + 0.42, 0.08, 0.006, R_OUT + 0.85, 0.11);
  return m;
}

function dialCanvas(names) {
  const S = 2048, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  const k = S / 2 / (R_OUT + 0.1), C = S / 2;
  g.strokeStyle = '#fff'; g.fillStyle = '#fff';
  // graduations
  for (let t = 0; t < 180; t++) {
    const a = (t / 180) * Math.PI * 2, long = t % 5 === 0;
    const r0 = (R_OUT - (long ? 0.09 : 0.05)) * k, r1 = (R_OUT - 0.02) * k;
    g.lineWidth = long ? 2.2 : 1.2;
    g.beginPath(); g.moveTo(C + Math.sin(a) * r0, C - Math.cos(a) * r0); g.lineTo(C + Math.sin(a) * r1, C - Math.cos(a) * r1); g.stroke();
  }
  g.lineWidth = 1.5;
  g.beginPath(); g.arc(C, C, (R_IN + 0.05) * k, 0, Math.PI * 2); g.stroke();
  // names, set along the arc and centred on each spoke
  g.textBaseline = 'middle'; g.textAlign = 'center';
  names.forEach((name, i) => {
    const label = name.toUpperCase();
    let size = 44;
    g.font = `500 ${size}px Jost, "Helvetica Neue", Arial, sans-serif`;
    const spacing = 0.28 * size;
    const width = () => [...label].reduce((w, ch) => w + g.measureText(ch).width + spacing, -spacing);
    const maxArc = STEP * R_TEXT * k * 0.86;
    while (width() > maxArc && size > 22) { size -= 1; g.font = `500 ${size}px Jost, "Helvetica Neue", Arial, sans-serif`; }
    const r = R_TEXT * k, total = width(), sp = 0.28 * size;
    let a = i * STEP - total / 2 / r;
    for (const ch of label) {
      const w = g.measureText(ch).width;
      const mid = a + w / 2 / r;
      g.save(); g.translate(C + Math.sin(mid) * r, C - Math.cos(mid) * r); g.rotate(mid); g.fillText(ch, 0, 0); g.restore();
      a += (w + sp) / r;
    }
  });
  return c;
}

/* ---------- shaders ---------- */

const VS = `
attribute vec3 aPos; attribute vec3 aNormal; attribute float aMat; attribute float aId;
uniform mat4 uProj, uView, uModel; uniform float uHi[9];
varying vec3 vW, vN, vL; varying float vMat, vHi;
void main(){
  vec4 w = uModel * vec4(aPos, 1.0);
  vW = w.xyz; vL = aPos; vN = mat3(uModel) * aNormal; vMat = aMat;
  vHi = aId < -0.5 ? 0.0 : uHi[int(aId + 0.5)];
  gl_Position = uProj * uView * w;
}`;

const FS = `
precision highp float;
varying vec3 vW, vN, vL; varying float vMat, vHi;
uniform vec3 uEye; uniform sampler2D uDial; uniform float uDialR;
vec3 env(vec3 d){
  vec3 c = mix(vec3(0.02,0.04,0.12), vec3(0.08,0.15,0.4), smoothstep(-0.5, 0.9, d.y));
  float sb = dot(d, normalize(vec3(-0.5, 0.65, 0.6)));
  c += vec3(1.0,0.96,0.9) * smoothstep(0.88, 0.96, sb) * 2.2;
  float st = dot(d, normalize(vec3(0.8, -0.1, 0.6)));
  c += vec3(1.0,0.88,0.7) * smoothstep(0.94, 0.99, st) * 1.2;
  return c;
}
vec3 tone(vec3 c){ float m = max(max(c.r, c.g), c.b) + 1e-4; return c * ((1.0 - exp(-1.7 * m)) / m) * 1.08; }
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec3 N = normalize(vN), V = normalize(uEye - vW), R = reflect(-V, N);
  float NV = clamp(dot(N, V), 0.0, 1.0);
  vec3 L = normalize(vec3(-4.0, 5.0, 7.0) - vW), L2 = normalize(vec3(6.0, -2.0, 4.0) - vW);
  vec3 H = normalize(L + V), H2 = normalize(L2 + V);
  float d = max(dot(N, L), 0.0), d2 = max(dot(N, L2), 0.0);
  float F = 0.04 + 0.96 * pow(1.0 - NV, 5.0);
  vec3 F0 = vec3(1.0, 0.8, 0.46), Fg = F0 + (1.0 - F0) * pow(1.0 - NV, 5.0);
  vec3 gold = (env(R) * 0.9 + vec3(0.3, 0.23, 0.11) + vec3(1.0, 0.95, 0.85) * pow(max(dot(N, H), 0.0), 80.0) * 2.4 + d * 0.35) * Fg;
  vec3 col;
  if (vMat < 0.5 || (vMat > 3.5 && vMat < 4.5)) {
    vec3 lac = vec3(0.012, 0.03, 0.1) * (0.45 + 0.7 * d);
    lac += env(R) * mix(0.05, 0.9, F) * 0.6;
    lac += vec3(1.0, 0.96, 0.9) * pow(max(dot(N, H), 0.0), 240.0) * 0.8;
    col = lac;
    if (vMat > 3.5 && N.z > 0.5) {
      float t = texture2D(uDial, vec2(vL.x, -vL.y) / uDialR * 0.5 + 0.5).r;
      col = mix(col, gold * 0.95, t);
    }
  } else if (vMat < 1.5) {
    col = gold;
  } else if (vMat < 2.5) {
    // porcelain spokes, gilding when chosen
    float wrap = dot(N, L) * 0.5 + 0.5;
    vec3 ivory = vec3(0.93, 0.91, 0.87) * (0.18 + wrap * 0.4 + d * 0.55 + d2 * 0.15);
    ivory += vec3(1.0, 0.97, 0.9) * pow(max(dot(N, H), 0.0), 160.0) * 1.2;
    ivory += env(R) * mix(0.03, 0.7, F) * 0.4;
    col = mix(ivory, gold, vHi);
  } else {
    // lapis cabochon with gold flecks; it glows when chosen
    vec3 lap = mix(vec3(0.04, 0.12, 0.5), vec3(0.12, 0.26, 0.8), hash(floor(vL.xy * 90.0)) * 0.5 + 0.3) * (0.35 + d * 0.8);
    lap += vec3(0.9, 0.7, 0.3) * step(0.97, hash(floor(vL.xy * 140.0))) * 0.6;
    lap += env(R) * mix(0.04, 1.0, F) * 0.9 + vec3(1.0, 0.97, 0.9) * pow(max(dot(N, H), 0.0), 200.0) * 1.6;
    col = mix(lap, gold * 1.25 + vec3(0.22, 0.13, 0.02), vHi);
  }
  gl_FragColor = vec4(tone(col), 1.0);
}`;

/* ---------- scene ---------- */

export function initWheel(canvas, { names, onPick } = {}) {
  const gl = createGL(canvas);
  if (!gl) return null;
  let prog;
  try { prog = createProgram(gl, VS, FS); } catch (e) { console.warn(e); return null; }

  const toGL = (m) => createMesh(gl, {
    aPos: { data: m.pos, size: 3 }, aNormal: { data: m.nrm, size: 3 },
    aMat: { data: m.attrs.mat, size: 1 }, aId: { data: m.attrs.id, size: 1 },
  }, m.count);
  const wheel = toGL(buildWheel()), hub = toGL(buildHub()), scale = toGL(buildScale()), pointer = toGL(buildPointer());

  const dialTex = gl.createTexture();
  const uploadDial = () => {
    gl.bindTexture(gl.TEXTURE_2D, dialTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, dialCanvas(names));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  uploadDial();
  if (document.fonts) document.fonts.ready.then(uploadDial);

  const reduced = prefersReducedMotion();
  const hi = new Float32Array(9);
  const st = { active: -1, angle: 0, vel: 0, target: 0, scale: 0, mx: 0, my: 0, tx: 0, ty: 0, jewels: [] };

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
  function pick(x, y) {
    let best = -1, bd = 34;
    st.jewels.forEach((p, i) => { const d = Math.hypot(x - p[0], y - p[1]); if (d < bd) { bd = d; best = i; } });
    return best;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  const frame = (t, dt) => {
    fitCanvas(canvas, 2);
    const w = canvas.width, h = canvas.height, aspect = w / h;
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    st.mx = damp(st.mx, st.tx, 2.2, dt);
    st.my = damp(st.my, st.ty, 2.2, dt);
    // a lightly under-damped spring gives the dial a mechanical settle
    if (reduced) st.angle = st.target;
    else {
      const k = 26, c = 7.5;
      st.vel += ((st.target - st.angle) * k - st.vel * c) * dt;
      st.angle += st.vel * dt;
    }
    st.scale -= dt * (reduced ? 0 : 0.03);
    for (let i = 0; i < 9; i++) hi[i] = damp(hi[i], i === st.active ? 1 : 0, 4, dt);

    const fov = 0.5, tn = Math.tan(fov / 2), half = 3.75;
    const dist = Math.max(half / tn, half / (tn * aspect));
    const eye = [0, 0, dist];
    const view = mat4.lookAt(eye, [0, 0, 0], [0, 1, 0]);
    const proj = mat4.perspective(fov, aspect, 0.5, 60);
    const tilt = mat4.multiply(mat4.rotationX(-0.26 + st.my * 0.12), mat4.rotationY(0.3 + st.mx * 0.22 + (reduced ? 0 : Math.sin(t * 0.2) * 0.04)));
    const base = mat4.multiply(mat4.translation(0, -0.25, 0), tilt);

    gl.useProgram(prog.program);
    const u = prog.uniforms;
    gl.uniformMatrix4fv(u.uProj, false, proj);
    gl.uniformMatrix4fv(u.uView, false, view);
    gl.uniform3fv(u.uEye, eye);
    gl.uniform1fv(u.uHi, hi);
    gl.uniform1f(u.uDialR, R_OUT + 0.1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dialTex);
    gl.uniform1i(u.uDial, 0);

    const draw = (mesh, model) => { gl.uniformMatrix4fv(u.uModel, false, model); bindMesh(gl, prog, mesh); gl.drawArrays(gl.TRIANGLES, 0, mesh.count); };
    const wheelModel = mat4.multiply(base, mat4.rotationZ(st.angle));
    draw(scale, mat4.multiply(base, mat4.multiply(mat4.translation(0, 0, -0.35), mat4.rotationZ(st.scale))));
    draw(wheel, wheelModel);
    draw(hub, mat4.multiply(base, mat4.translation(0, 0, 0.002)));
    draw(pointer, base);

    // jewel positions on screen, for picking
    const vp = mat4.multiply(proj, mat4.multiply(view, wheelModel)), cw = canvas.clientWidth, ch = canvas.clientHeight;
    for (let i = 0; i < N; i++) {
      const a = -i * STEP;
      const q = mat4.transformPoint(vp, [-Math.sin(a) * R_JEWEL, Math.cos(a) * R_JEWEL, Z_FRONT]);
      st.jewels[i] = [(q[0] * 0.5 + 0.5) * cw, (1 - (q[1] * 0.5 + 0.5)) * ch];
    }
  };

  const loop = visibleLoop(canvas, frame);
  return {
    select(i) {
      st.active = i;
      // shortest turn that brings spoke i to twelve o'clock
      const goal = i * STEP;
      let delta = (goal - st.target) % (Math.PI * 2);
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      st.target += delta;
      loop.kick();
    },
  };
}
