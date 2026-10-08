/* Global Reach: a royal-blue globe engraved with fine gold coastlines, the UAE as hub. */
import { mat4, createGL, createProgram, createMesh, bindMesh, fitCanvas, visibleLoop, damp, clamp, prefersReducedMotion } from './gl.js';
import { COASTS, HUB, REGIONS } from './world.js';

const D2R = Math.PI / 180;
const toXYZ = (lon, lat, r = 1) => {
  const la = lat * D2R, lo = lon * D2R;
  return [r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)];
};
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
const slerp = (a, b, t) => {
  const d = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1), w = Math.acos(d);
  if (w < 1e-5) return a.slice();
  const s = Math.sin(w), k0 = Math.sin((1 - t) * w) / s, k1 = Math.sin(t * w) / s;
  return [a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1];
};

function polylineSegments(out, kind, pts, r) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = toXYZ(pts[i][0], pts[i][1]), b = toXYZ(pts[i + 1][0], pts[i + 1][1]);
    const steps = Math.max(1, Math.ceil(Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)) / (2 * D2R)));
    let prev = a;
    for (let s = 1; s <= steps; s++) {
      const cur = slerp(a, b, s / steps);
      out.pos.push(prev[0] * r, prev[1] * r, prev[2] * r, cur[0] * r, cur[1] * r, cur[2] * r);
      out.kind.push(kind, kind);
      prev = cur;
    }
  }
}

const SPHERE_VS = `
attribute vec3 aPos; uniform mat4 uProj, uView, uModel; varying vec3 vN, vW;
void main(){ vec4 w = uModel * vec4(aPos,1.0); vW = w.xyz; vN = mat3(uModel) * aPos; gl_Position = uProj * uView * w; }`;
const SPHERE_FS = `
precision highp float; varying vec3 vN, vW; uniform vec3 uEye;
void main(){
  vec3 N = normalize(vN), V = normalize(uEye - vW);
  vec3 L = normalize(vec3(-0.6, 0.55, 0.8));
  float d = max(dot(N, L), 0.0);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.6);
  vec3 col = mix(vec3(0.020,0.045,0.15), vec3(0.075,0.19,0.58), d * 0.85 + 0.05);
  col += vec3(0.25,0.42,1.0) * rim * 0.45;
  col += vec3(0.95,0.78,0.45) * pow(max(dot(reflect(-V,N), L),0.0), 40.0) * 0.10;
  gl_FragColor = vec4(col, 1.0);
}`;

const LINE_VS = `
attribute vec3 aPos; attribute float aKind; uniform mat4 uProj, uView, uModel; uniform vec3 uEye;
varying float vK; varying float vFace;
void main(){ vec4 w = uModel * vec4(aPos,1.0); vK = aKind; vFace = dot(normalize(w.xyz), normalize(uEye - w.xyz)); gl_Position = uProj * uView * w; }`;
const LINE_FS = `
precision highp float; varying float vK; varying float vFace;
void main(){
  float edge = smoothstep(-0.05, 0.35, vFace);
  float a = vK < 0.5 ? 0.85 : 0.16;
  vec3 c = vK < 0.5 ? vec3(0.93,0.78,0.48) : vec3(0.78,0.64,0.38);
  gl_FragColor = vec4(c * a * edge, a * edge);
}`;

const ARC_VS = `
attribute vec3 aPos; attribute float aT; attribute float aArc; attribute float aRegion;
uniform mat4 uProj, uView, uModel; uniform vec3 uEye; varying float vT, vArc, vRegion, vFace;
void main(){
  vT = aT; vArc = aArc; vRegion = aRegion;
  vec4 w = uModel * vec4(aPos,1.0);
  vFace = dot(normalize(w.xyz), normalize(uEye - w.xyz));
  gl_Position = uProj * uView * w;
}`;
const ARC_FS = `
precision highp float; varying float vT, vArc, vRegion, vFace; uniform float uTime, uGrow, uActive;
void main(){
  float grow = clamp(uGrow * 1.6 - vArc * 0.04, 0.0, 1.0);
  if (vT > grow) discard;
  float active = uActive < 0.0 ? 0.55 : (abs(vRegion - uActive) < 0.5 ? 1.0 : 0.18);
  float head = fract(uTime * 0.22 + vArc * 0.173);
  float pulse = exp(-pow((head - vT) * 9.0, 2.0));
  float a = (0.35 + pulse * 0.9) * active * smoothstep(0.0, 0.3, vFace);
  vec3 c = mix(vec3(0.80,0.62,0.30), vec3(1.0,0.92,0.72), pulse);
  gl_FragColor = vec4(c * a, a);
}`;

const PT_VS = `
attribute vec3 aPos; attribute float aSize; uniform mat4 uProj, uView, uModel; uniform vec3 uEye; uniform float uDpr;
varying float vFace; varying float vHub;
void main(){
  vec4 w = uModel * vec4(aPos,1.0);
  vFace = dot(normalize(w.xyz), normalize(uEye - w.xyz)); vHub = step(9.0, aSize);
  gl_Position = uProj * uView * w; gl_PointSize = aSize * uDpr;
}`;
const PT_FS = `
precision highp float; varying float vFace; varying float vHub; uniform float uTime;
void main(){
  vec2 p = gl_PointCoord * 2.0 - 1.0; float r = length(p);
  float core = smoothstep(0.42, 0.28, r);
  float ring = vHub > 0.5 ? smoothstep(0.06, 0.0, abs(r - fract(uTime * 0.45) * 0.95)) * (1.0 - fract(uTime * 0.45)) : 0.0;
  float glow = exp(-r * r * 5.0) * 0.45;
  float a = (core + ring + glow) * smoothstep(-0.05, 0.25, vFace);
  gl_FragColor = vec4(vec3(1.0,0.86,0.58) * a, a);
}`;

export function initGlobe(canvas, { labelsEl, onRegion } = {}) {
  const gl = createGL(canvas);
  if (!gl) return null;
  let sp, lp, ap, pp;
  try {
    sp = createProgram(gl, SPHERE_VS, SPHERE_FS);
    lp = createProgram(gl, LINE_VS, LINE_FS);
    ap = createProgram(gl, ARC_VS, ARC_FS);
    pp = createProgram(gl, PT_VS, PT_FS);
  } catch (e) { console.warn(e); return null; }

  // sphere
  const sphere = [];
  const SEG = 72, RING = 36;
  for (let j = 0; j < RING; j++) for (let i = 0; i < SEG; i++) {
    const lo0 = -180 + (i / SEG) * 360, lo1 = -180 + ((i + 1) / SEG) * 360;
    const la0 = -90 + (j / RING) * 180, la1 = -90 + ((j + 1) / RING) * 180;
    const a = toXYZ(lo0, la0), b = toXYZ(lo1, la0), c = toXYZ(lo1, la1), d = toXYZ(lo0, la1);
    sphere.push(...a, ...b, ...c, ...a, ...c, ...d);
  }
  const sphereMesh = createMesh(gl, { aPos: { data: sphere, size: 3 } }, sphere.length / 3);

  // coastlines & graticule
  const lines = { pos: [], kind: [] };
  for (const c of COASTS) polylineSegments(lines, 0, c, 1.002);
  for (let lat = -75; lat <= 75; lat += 15) {
    const pts = []; for (let lon = -180; lon <= 180; lon += 5) pts.push([lon, lat]);
    polylineSegments(lines, 1, pts, 1.001);
  }
  for (let lon = -180; lon < 180; lon += 15) {
    const pts = []; for (let lat = -85; lat <= 85; lat += 5) pts.push([lon, lat]);
    polylineSegments(lines, 1, pts, 1.001);
  }
  const lineMesh = createMesh(gl, { aPos: { data: lines.pos, size: 3 }, aKind: { data: lines.kind, size: 1 } }, lines.pos.length / 3);

  // arcs from the hub
  const hub = toXYZ(HUB.lon, HUB.lat);
  const arcs = { pos: [], t: [], arc: [], region: [] };
  const points = { pos: [...toXYZ(HUB.lon, HUB.lat, 1.004)], size: [16] };
  let arcIndex = 0;
  REGIONS.forEach((reg, ri) => {
    reg.cities.forEach((city) => {
      const end = toXYZ(city.lon, city.lat);
      const ang = Math.acos(clamp(hub[0] * end[0] + hub[1] * end[1] + hub[2] * end[2], -1, 1));
      const lift = Math.min(0.03 + ang * 0.12, 0.2), N = 72;
      let prev = null, prevT = 0;
      for (let s = 0; s <= N; s++) {
        const t = s / N, p = norm(slerp(hub, end, t)), h = 1.004 + Math.sin(Math.PI * t) * lift;
        const cur = [p[0] * h, p[1] * h, p[2] * h];
        if (prev) {
          arcs.pos.push(...prev, ...cur); arcs.t.push(prevT, t);
          arcs.arc.push(arcIndex, arcIndex); arcs.region.push(ri, ri);
        }
        prev = cur; prevT = t;
      }
      points.pos.push(...toXYZ(city.lon, city.lat, 1.004)); points.size.push(7);
      arcIndex++;
    });
  });
  const arcMesh = createMesh(gl, {
    aPos: { data: arcs.pos, size: 3 }, aT: { data: arcs.t, size: 1 }, aArc: { data: arcs.arc, size: 1 }, aRegion: { data: arcs.region, size: 1 },
  }, arcs.pos.length / 3);
  const ptMesh = createMesh(gl, { aPos: { data: points.pos, size: 3 }, aSize: { data: points.size, size: 1 } }, points.size.length);

  // labels
  const labelEls = [];
  if (labelsEl) {
    const add = (name, lon, lat, cls) => {
      const el = document.createElement('span');
      el.className = 'globe-label ' + cls;
      el.textContent = name;
      labelsEl.appendChild(el);
      labelEls.push({ el, p: toXYZ(lon, lat, 1.01), cls });
    };
    add('UAE', HUB.lon, HUB.lat, 'is-hub');
    REGIONS.forEach((r, ri) => r.cities.forEach((c) => { add(c.name, c.lon, c.lat, 'is-city'); labelEls[labelEls.length - 1].region = ri; }));
  }

  const reduced = prefersReducedMotion();
  const state = {
    yaw: -HUB.lon * D2R, pitch: HUB.lat * D2R * 0.7,
    vyaw: 0, vpitch: 0,
    focusYaw: -HUB.lon * D2R, focusPitch: HUB.lat * D2R * 0.7,
    dragging: false, lastX: 0, lastY: 0, idleT: 0,
    grow: reduced ? 1 : 0, active: -1, seen: false,
  };

  canvas.addEventListener('pointerdown', (e) => {
    state.dragging = true; state.lastX = e.clientX; state.lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!state.dragging) return;
    const dx = e.clientX - state.lastX, dy = e.clientY - state.lastY;
    state.lastX = e.clientX; state.lastY = e.clientY;
    state.vyaw = dx * 0.006; state.vpitch = dy * 0.004;
    state.yaw += state.vyaw; state.pitch = clamp(state.pitch + state.vpitch, -0.9, 1.1);
    state.idleT = 0;
  });
  const end = () => { state.dragging = false; canvas.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  gl.clearColor(0, 0, 0, 0);

  const frame = (t, dt) => {
    fitCanvas(canvas, 2);
    const w = canvas.width, h = canvas.height, aspect = w / h;
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (state.seen && state.grow < 1) state.grow = Math.min(1, state.grow + dt / 3.2);
    if (!state.dragging) {
      state.yaw += state.vyaw; state.pitch = clamp(state.pitch + state.vpitch, -0.9, 1.1);
      state.vyaw *= 0.92; state.vpitch *= 0.92;
      state.idleT += dt;
      if (state.idleT > 2.2) {
        // ease back towards the current focus by the shortest way round
        let dy = state.focusYaw - state.yaw;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        state.yaw = damp(state.yaw, state.yaw + dy, 1.4, dt);
        state.pitch = damp(state.pitch, state.focusPitch, 1.4, dt);
        if (!reduced) state.focusYaw += Math.sin(t * 0.2) * 0.0006;
      }
    }

    const eye = [0, 0, 3.35];
    const view = mat4.lookAt(eye, [0, 0, 0], [0, 1, 0]);
    const proj = mat4.perspective(0.72, aspect, 0.1, 20);
    const model = mat4.multiply(mat4.rotationX(state.pitch), mat4.rotationY(state.yaw));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.useProgram(sp.program);
    gl.uniformMatrix4fv(sp.uniforms.uProj, false, proj);
    gl.uniformMatrix4fv(sp.uniforms.uView, false, view);
    gl.uniformMatrix4fv(sp.uniforms.uModel, false, model);
    gl.uniform3fv(sp.uniforms.uEye, eye);
    bindMesh(gl, sp, sphereMesh);
    gl.drawArrays(gl.TRIANGLES, 0, sphereMesh.count);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    gl.useProgram(lp.program);
    gl.uniformMatrix4fv(lp.uniforms.uProj, false, proj);
    gl.uniformMatrix4fv(lp.uniforms.uView, false, view);
    gl.uniformMatrix4fv(lp.uniforms.uModel, false, model);
    gl.uniform3fv(lp.uniforms.uEye, eye);
    bindMesh(gl, lp, lineMesh);
    gl.drawArrays(gl.LINES, 0, lineMesh.count);

    gl.useProgram(ap.program);
    gl.uniformMatrix4fv(ap.uniforms.uProj, false, proj);
    gl.uniformMatrix4fv(ap.uniforms.uView, false, view);
    gl.uniformMatrix4fv(ap.uniforms.uModel, false, model);
    gl.uniform3fv(ap.uniforms.uEye, eye);
    gl.uniform1f(ap.uniforms.uTime, reduced ? 0 : t);
    gl.uniform1f(ap.uniforms.uGrow, state.grow);
    gl.uniform1f(ap.uniforms.uActive, state.active);
    bindMesh(gl, ap, arcMesh);
    gl.drawArrays(gl.LINES, 0, arcMesh.count);

    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(pp.program);
    gl.uniformMatrix4fv(pp.uniforms.uProj, false, proj);
    gl.uniformMatrix4fv(pp.uniforms.uView, false, view);
    gl.uniformMatrix4fv(pp.uniforms.uModel, false, model);
    gl.uniform3fv(pp.uniforms.uEye, eye);
    gl.uniform1f(pp.uniforms.uDpr, dpr);
    gl.uniform1f(pp.uniforms.uTime, reduced ? 0.3 : t);
    bindMesh(gl, pp, ptMesh);
    gl.drawArrays(gl.POINTS, 0, ptMesh.count);
    gl.depthMask(true);

    // project labels
    if (labelEls.length) {
      const vp = mat4.multiply(proj, mat4.multiply(view, model));
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      for (const L of labelEls) {
        const wp = mat4.transformPoint(model, L.p);
        const face = wp[2] > 0.32; // in front of the limb as seen from the camera on +z
        const s = mat4.transformPoint(vp, L.p);
        const x = (s[0] * 0.5 + 0.5) * cw, y = (1 - (s[1] * 0.5 + 0.5)) * ch;
        const show = face && state.grow > 0.6 && (L.cls === 'is-hub' || L.region === state.active);
        L.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        L.el.classList.toggle('is-visible', show);
      }
    }
  };

  const loop = visibleLoop(canvas, frame);
  new IntersectionObserver(([e]) => { if (e.isIntersecting) state.seen = true; }, { threshold: 0.35 }).observe(canvas);

  return {
    focus(index) {
      state.idleT = 10;
      if (index == null || index < 0) {
        state.active = -1; state.focusYaw = -HUB.lon * D2R; state.focusPitch = HUB.lat * D2R * 0.7;
      } else {
        const r = REGIONS[index];
        state.active = index;
        // aim between the hub and the region so the connecting arcs stay in view
        const mid = norm(slerp(toXYZ(HUB.lon, HUB.lat), toXYZ(r.lon, r.lat), 0.55));
        const lon = Math.atan2(mid[0], mid[2]), lat = Math.asin(mid[1]);
        state.focusYaw = -lon; state.focusPitch = lat * 0.8;
      }
      onRegion && onRegion(index);
      loop.kick();
    },
  };
}
