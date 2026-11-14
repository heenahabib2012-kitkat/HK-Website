/* HK — "Building Possibilities" cinematic hero (WebGL, three.js)
   A Gulf skyline at dusk, rendered in real time:
   glass towers with lit windows and gold crowns, a champagne afterglow behind
   the skyline, reflective water, streaming traffic and atmospheric haze.
   Three directed shots on a 30s loop, joined by soft dips to dark:
     A  Arrival   — low over the water towards the skyline
     B  Avenue    — gliding down the central avenue towards the landmark tower
     C  Overview  — a high orbit while gold connections reach out to the horizon
   Exposes window.HKCinema; hero-film.js falls back to its 2D film without WebGL. */
(() => {
  'use strict';
  const THREE = window.THREE;

  const supported = () => {
    if (!THREE) return false;
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { return false; }
  };

  // deterministic random
  let seed = 7021;
  const rnd = () => ((seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9) | 0) >>> 0) / 4294967296;

  const SUN = new THREE.Vector3(0.18, 0.035, -1).normalize();
  const HOR = new THREE.Color(0.80, 0.64, 0.38);      // champagne horizon
  const FOG = new THREE.Color(0.045, 0.095, 0.21);    // royal-midnight haze
  const LANDMARK = new THREE.Vector3(0, 0, -330);

  const GLSL_HASH = `
    float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  `;
  const FOG_FN = `
    uniform float uTime; uniform vec3 uSun; uniform vec3 uHor; uniform vec3 uFog;
    vec3 skyColor(vec3 d){
      float h = d.y;
      vec3 top = vec3(0.012, 0.035, 0.10), mid = vec3(0.055, 0.15, 0.36);
      vec3 col = mix(mid, top, smoothstep(0.02, 0.55, h));
      float s = max(dot(d, uSun), 0.0);
      float glow = exp(-max(h, 0.0) * 7.0);
      col = mix(col, uHor * 0.75, glow * (0.34 + 0.66 * pow(s, 4.0)));
      col += uHor * (pow(s, 90.0) * 0.9 + pow(s, 14.0) * 0.18) * smoothstep(-0.05, 0.08, h + 0.05);
      return col;
    }
    // aerial perspective: near haze is royal blue, distance dissolves into the sky itself
    vec3 applyFog(vec3 col, vec3 w){
      vec3 dir = normalize(w - cameraPosition);
      float d = length(w - cameraPosition);
      float f = 1.0 - exp(-d * 0.00125);
      vec3 far = skyColor(vec3(dir.x, max(dir.y, 0.0) * 0.4 + 0.003, dir.z));
      vec3 fc = mix(uFog, far, smoothstep(250.0, 2600.0, d));
      return mix(col, fc, clamp(f, 0.0, 1.0));
    }
  `;

  function create(canvas, { mobile = false } = {}) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
    renderer.setClearColor(0x081a3a, 1);
    renderer.autoClear = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(mobile ? 58 : 42, 16 / 9, 1, 6000);
    const common = { uTime: { value: 0 }, uSun: { value: SUN }, uHor: { value: HOR }, uFog: { value: FOG } };

    /* ---------- sky ---------- */
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(4000, 48, 24),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, uniforms: common,
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          varying vec3 vDir;
          ${GLSL_HASH}
          ${FOG_FN}
          void main(){
            vec3 d = normalize(vDir); float h = d.y;
            vec3 col = skyColor(d);
            float s = max(dot(d, uSun), 0.0);
            float band = sin(d.x * 9.0 + 1.3) * sin(d.z * 5.0 + d.x * 3.0);
            col += uHor * 0.10 * smoothstep(0.55, 1.0, band) * smoothstep(0.02, 0.10, h) * smoothstep(0.30, 0.10, h) * (0.4 + pow(s, 3.0));
            vec2 g = d.xz / (d.y + 0.25) * 160.0;
            float st = hash(floor(g));
            col += step(0.9965, st) * smoothstep(0.18, 0.6, h) * (0.55 + 0.45 * sin(uTime * 1.7 + st * 60.0)) * 0.7;
            if (h < 0.0) col = skyColor(vec3(d.x, 0.003, d.z));
            gl_FragColor = vec4(col, 1.0);
          }`,
      })
    );
    scene.add(sky);

    /* ---------- city layout ---------- */
    const BLOCK = mobile ? 30 : 26;
    const boxes = []; // {x,z,w,d,h,y0,seed,crown}
    const beacons = [];
    const roadsX = [], roadsZ = [];
    for (let bx = -11; bx <= 11; bx++) {
      for (let bz = -24; bz <= 0; bz++) {
        const cx = bx * BLOCK, cz = bz * BLOCK - 20;
        if (bx === 0 && cz > -300) continue;                         // the central avenue
        if (Math.hypot(cx - LANDMARK.x, cz - LANDMARK.z) < 46) continue; // landmark plaza
        const n = rnd() > 0.55 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const w = (n === 2 ? 7 : 10) + rnd() * (n === 2 ? 5 : 8);
          const d = (n === 2 ? 7 : 10) + rnd() * (n === 2 ? 5 : 8);
          const ox = n === 2 ? (k ? 1 : -1) * (BLOCK * 0.22) : (rnd() - 0.5) * 4;
          const x = cx + ox, z = cz + (rnd() - 0.5) * 4;
          const dc = Math.hypot(x - LANDMARK.x, (z - LANDMARK.z) * 0.8);
          const core = Math.exp(-(dc * dc) / (2 * 150 * 150));
          let h = 10 + rnd() * 26 + core * (60 + rnd() * 150);
          if (rnd() > 0.965) h += 70 + rnd() * 60;
          if (Math.abs(bx) > 8) h *= 0.6;
          const s = rnd();
          boxes.push({ x, z, w, d, h, y0: 0, seed: s, crown: s > 0.72 && h > 60 });
          if (h > 120) beacons.push(new THREE.Vector3(x, h + 2, z));
          // podium setback on tall towers
          if (h > 90 && rnd() > 0.4) boxes.push({ x, z, w: w * 0.62, d: d * 0.62, h: h * (0.12 + rnd() * 0.1), y0: h, seed: rnd(), crown: true });
        }
      }
    }
    for (let bx = -11; bx <= 11; bx++) roadsX.push(bx * BLOCK + BLOCK / 2);
    for (let bz = -24; bz <= 0; bz++) roadsZ.push(bz * BLOCK - 20 + BLOCK / 2);
    // the landmark: a stepped tower with a needle
    const L = [[34, 0, 110], [27, 110, 95], [21, 205, 80], [15, 285, 60], [10, 345, 45], [5, 390, 40], [1.8, 430, 70]];
    L.forEach(([w, y0, h], i) => boxes.push({ x: LANDMARK.x, z: LANDMARK.z, w, d: w, h, y0, seed: 0.9, crown: i >= 3 }));
    beacons.push(new THREE.Vector3(LANDMARK.x, 502, LANDMARK.z));

    const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
    const towers = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({
      uniforms: common,
      vertexShader: `
        attribute float aSeed; attribute float aTop; attribute float aCrown;
        varying vec3 vW; varying vec3 vN; varying float vSeed; varying float vTop; varying float vCrown;
        void main(){
          vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vW = w.xyz; vN = normalize(mat3(modelMatrix * instanceMatrix) * normal);
          vSeed = aSeed; vTop = aTop; vCrown = aCrown;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: `
        varying vec3 vW; varying vec3 vN; varying float vSeed; varying float vTop; varying float vCrown;
        ${GLSL_HASH}
        ${FOG_FN}
        void main(){
          vec3 n = normalize(vN);
          vec3 V = normalize(cameraPosition - vW);
          float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
          vec3 glass = mix(vec3(0.018, 0.04, 0.10), vec3(0.07, 0.14, 0.30), clamp(vW.y / 320.0, 0.0, 1.0));
          float sunFace = max(dot(n, normalize(vec3(uSun.x, 0.0, uSun.z))), 0.0);
          vec3 col = glass + uHor * (0.28 * fres + 0.10 * sunFace * smoothstep(0.0, 300.0, vW.y));
          float dist = length(cameraPosition - vW);
          if (abs(n.y) < 0.5) {
            vec2 f = abs(n.x) > 0.5 ? vec2(vW.z, vW.y) : vec2(vW.x, vW.y);
            vec2 cell = vec2(3.0, 2.7);
            vec2 id = floor(f / cell); vec2 uv = fract(f / cell);
            float win = step(0.16, uv.x) * step(uv.x, 0.84) * step(0.22, uv.y) * step(uv.y, 0.82);
            float r = hash(id + vSeed * 31.7);
            float lit = step(0.50 + 0.18 * step(0.85, vSeed), r);
            float flick = 0.82 + 0.18 * sin(uTime * 0.5 + r * 70.0);
            vec3 warm = mix(vec3(1.0, 0.80, 0.50), vec3(0.80, 0.88, 1.0), step(0.95, r));
            float near = smoothstep(1500.0, 240.0, dist);
            col += win * (lit * warm * 1.3 * flick + (1.0 - lit) * vec3(0.025, 0.05, 0.11)) * mix(0.28, 1.0, near);
            // vertical fins
            col += vec3(0.6, 0.5, 0.3) * 0.05 * step(0.94, fract(f.x / 6.0)) * near;
            // gold crown band
            float band = smoothstep(vTop - 4.0, vTop - 3.0, vW.y) * (1.0 - smoothstep(vTop - 1.2, vTop - 0.3, vW.y));
            col += vec3(0.85, 0.68, 0.38) * band * 1.8 * vCrown;
            // street glow at the base
            col += uHor * 0.35 * smoothstep(6.0, 0.0, vW.y);
          } else if (n.y > 0.5) {
            col = vec3(0.025, 0.05, 0.11) + uHor * 0.04;
          }
          gl_FragColor = vec4(applyFog(col, vW), 1.0);
        }`,
    }), boxes.length);
    const m4 = new THREE.Matrix4(), aSeed = new Float32Array(boxes.length), aTop = new Float32Array(boxes.length), aCrown = new Float32Array(boxes.length);
    boxes.forEach((b, i) => {
      m4.compose(new THREE.Vector3(b.x, b.y0, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.d));
      towers.setMatrixAt(i, m4);
      aSeed[i] = b.seed; aTop[i] = b.y0 + b.h; aCrown[i] = b.crown ? 1 : 0;
    });
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
    geo.setAttribute('aTop', new THREE.InstancedBufferAttribute(aTop, 1));
    geo.setAttribute('aCrown', new THREE.InstancedBufferAttribute(aCrown, 1));
    towers.frustumCulled = false;
    scene.add(towers);

    /* ---------- land with lit street grid ---------- */
    const land = new THREE.Mesh(new THREE.PlaneGeometry(12000, 6020), new THREE.ShaderMaterial({
      uniforms: { ...common, uBlock: { value: BLOCK } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `
        uniform float uBlock; varying vec3 vW;
        ${FOG_FN}
        void main(){
          vec2 g = abs(fract((vW.xz - vec2(uBlock*0.5, -20.0 + uBlock*0.5)) / uBlock + 0.5) - 0.5) * uBlock;
          float road = (1.0 - smoothstep(0.6, 2.4, min(g.x, g.y))) * step(abs(vW.x), 300.0) * step(-650.0, vW.z);
          vec3 col = vec3(0.02, 0.04, 0.09) + vec3(0.95, 0.72, 0.42) * road * 0.22;
          col += uHor * 0.05;
          gl_FragColor = vec4(applyFog(col, vW), 1.0);
        }`,
    }));
    land.rotation.x = -Math.PI / 2; land.position.set(0, 0, -2990);
    scene.add(land);

    /* ---------- water ---------- */
    const water = new THREE.Mesh(new THREE.PlaneGeometry(9000, 4000), new THREE.ShaderMaterial({
      uniforms: common,
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `
        varying vec3 vW;
        ${GLSL_HASH}
        ${FOG_FN}
        void main(){
          vec3 V = normalize(cameraPosition - vW);
          float w1 = sin(vW.x * 0.09 + uTime * 0.7) + sin(vW.z * 0.15 - uTime * 1.1 + vW.x * 0.04);
          float w2 = sin(vW.x * 0.31 - uTime * 1.6 + vW.z * 0.2) * 0.5;
          vec3 nrm = normalize(vec3((w1 + w2) * 0.035, 1.0, (w1 - w2) * 0.03));
          vec3 R = reflect(-V, nrm);
          float fres = pow(1.0 - max(dot(nrm, V), 0.0), 4.0);
          float s = max(dot(R, uSun), 0.0);
          vec3 col = vec3(0.01, 0.025, 0.07);
          col += uHor * (0.55 * fres + pow(s, 60.0) * 1.3 + pow(s, 8.0) * 0.12);
          // shimmering reflections of the city lights
          vec2 cell = vec2(floor(vW.x * 0.45), floor(vW.z * 0.9 + uTime * 0.6));
          float sp = step(0.982, hash(cell));
          float toward = smoothstep(420.0, 0.0, abs(vW.x)) * smoothstep(-40.0, 260.0, vW.z) * smoothstep(900.0, 120.0, vW.z);
          col += vec3(1.0, 0.82, 0.55) * sp * 0.55 * toward * (0.5 + 0.5 * sin(uTime * 3.0 + cell.x));
          gl_FragColor = vec4(applyFog(col, vW), 1.0);
        }`,
    }));
    water.rotation.x = -Math.PI / 2; water.position.set(0, -0.6, 2000 + 120);
    scene.add(water);

    /* ---------- traffic ---------- */
    const CARS = mobile ? 900 : 2200;
    const tGeo = new THREE.BufferGeometry();
    const tStart = new Float32Array(CARS * 3), tDir = new Float32Array(CARS * 3), tOff = new Float32Array(CARS), tCol = new Float32Array(CARS);
    for (let i = 0; i < CARS; i++) {
      const alongX = rnd() > 0.5;
      const lane = (rnd() > 0.5 ? 1 : -1) * 1.6;
      if (alongX) {
        const z = roadsZ[(rnd() * roadsZ.length) | 0] + lane;
        tStart.set([-300, 0.8, z], i * 3); tDir.set([rnd() > 0.5 ? 600 : -600, 0, 0], i * 3);
        if (tDir[i * 3] < 0) tStart[i * 3] = 300;
      } else {
        const x = (rnd() > 0.35 ? roadsX[(rnd() * roadsX.length) | 0] : 0) + lane;
        tStart.set([x, 0.8, 20], i * 3); tDir.set([0, 0, -650], i * 3);
        if (rnd() > 0.5) { tStart[i * 3 + 2] = -630; tDir[i * 3 + 2] = 650; }
      }
      tOff[i] = rnd(); tCol[i] = rnd();
    }
    tGeo.setAttribute('position', new THREE.BufferAttribute(tStart, 3));
    tGeo.setAttribute('aDir', new THREE.BufferAttribute(tDir, 3));
    tGeo.setAttribute('aOff', new THREE.BufferAttribute(tOff, 1));
    tGeo.setAttribute('aCol', new THREE.BufferAttribute(tCol, 1));
    const traffic = new THREE.Points(tGeo, new THREE.ShaderMaterial({
      uniforms: { ...common, uScale: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        uniform float uTime; uniform float uScale; attribute vec3 aDir; attribute float aOff; attribute float aCol;
        varying float vCol; varying float vFade;
        void main(){
          float t = fract(aOff + uTime * (0.012 + aOff * 0.006));
          vec3 p = position + aDir * t;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = clamp(uScale * 260.0 / -mv.z, 1.0, 9.0);
          vCol = aCol; vFade = smoothstep(0.0, 0.05, t) * smoothstep(1.0, 0.95, t) * smoothstep(1600.0, 200.0, -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying float vCol; varying float vFade;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          vec3 c = mix(vec3(1.0, 0.78, 0.45), vec3(0.95, 0.95, 1.0), step(0.6, vCol));
          gl_FragColor = vec4(c * a * vFade * 0.9, 1.0);
        }`,
    }));
    traffic.frustumCulled = false;
    scene.add(traffic);

    /* ---------- tower-top beacons ---------- */
    const bGeo = new THREE.BufferGeometry().setFromPoints(beacons);
    const bPh = new Float32Array(beacons.length).map(() => rnd());
    bGeo.setAttribute('aPh', new THREE.BufferAttribute(bPh, 1));
    const beaconPts = new THREE.Points(bGeo, new THREE.ShaderMaterial({
      uniforms: { ...common, uScale: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `uniform float uTime; uniform float uScale; attribute float aPh; varying float vA;
        void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = clamp(uScale * 900.0 / -mv.z, 2.0, 22.0);
          vA = pow(max(sin(uTime * 2.2 + aPh * 6.28), 0.0), 8.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(1.0, 0.86, 0.6) * smoothstep(0.5, 0.0, d) * (0.15 + vA), 1.0); }`,
    }));
    beaconPts.frustumCulled = false;
    scene.add(beaconPts);

    /* ---------- gold connections from the landmark ---------- */
    const top = new THREE.Vector3(LANDMARK.x, 440, LANDMARK.z);
    const tall = boxes.filter((b) => b.y0 === 0 && b.h > 110 && Math.hypot(b.x, b.z - LANDMARK.z) > 60).slice(0, 9);
    const targets = tall.map((b) => new THREE.Vector3(b.x, b.h, b.z));
    // reaching beyond the city, towards the horizon (the world)
    for (let i = 0; i < 7; i++) { const a = -Math.PI * 0.95 + (i / 6) * Math.PI * 0.9; targets.push(new THREE.Vector3(Math.cos(a) * 2600, 40, LANDMARK.z + Math.sin(a) * 2600 * 0.6 - 300)); }
    const aPos = [], aP = [], aDelay = [];
    targets.forEach((t, k) => {
      const far = t.y < 100;
      const mid = top.clone().lerp(t, 0.5); mid.y += far ? 520 : 90 + top.distanceTo(t) * 0.25;
      const curve = new THREE.QuadraticBezierCurve3(top, mid, t);
      const pts = curve.getPoints(80);
      for (let i = 0; i < pts.length - 1; i++) {
        aPos.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
        aP.push(i / 80, (i + 1) / 80); aDelay.push(k * 0.07 + (far ? 0.25 : 0), k * 0.07 + (far ? 0.25 : 0));
      }
    });
    const arcGeo = new THREE.BufferGeometry();
    arcGeo.setAttribute('position', new THREE.Float32BufferAttribute(aPos, 3));
    arcGeo.setAttribute('aP', new THREE.Float32BufferAttribute(aP, 1));
    arcGeo.setAttribute('aDelay', new THREE.Float32BufferAttribute(aDelay, 1));
    const arcUniforms = { ...common, uArc: { value: 0 }, uArcAlpha: { value: 0 } };
    const arcs = new THREE.LineSegments(arcGeo, new THREE.ShaderMaterial({
      uniforms: arcUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float aP; attribute float aDelay; varying float vP; varying float vD;
        void main(){ vP = aP; vD = aDelay; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uArc; uniform float uArcAlpha; varying float vP; varying float vD;
        void main(){
          float prog = clamp((uArc - vD) / 0.55, 0.0, 1.0);
          if (vP > prog) discard;
          float head = exp(-abs(prog - vP) * 30.0);
          gl_FragColor = vec4(vec3(0.92, 0.76, 0.46) * (0.8 + head * 2.4) * uArcAlpha, 1.0);
        }`,
    }));
    arcs.frustumCulled = false;
    scene.add(arcs);

    /* ---------- dip-to-dark overlay ---------- */
    const fadeScene = new THREE.Scene();
    const fadeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const fadeMat = new THREE.MeshBasicMaterial({ color: 0x050f24, transparent: true, opacity: 0, depthTest: false });
    fadeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fadeMat));

    /* ---------- direction ---------- */
    const ease = (x) => x * x * (3 - 2 * x);
    const lerp = (a, b, t) => a + (b - a) * t;
    const v = new THREE.Vector3(), look = new THREE.Vector3();
    const SHOTS = [
      { len: 10, cam(u) { v.set(lerp(70, 18, u), lerp(9, 30, u), lerp(470, 250, u)); look.set(lerp(-10, 0, u), lerp(150, 170, u), LANDMARK.z); } },
      { len: 9, cam(u) { v.set(lerp(-160, 60, u), lerp(70, 95, u), lerp(420, 380, u)); look.set(lerp(-90, 10, u), 175, LANDMARK.z); } },
      { len: 11, cam(u) { const a = lerp(0.62, 0.22, u); const r = lerp(980, 900, u); v.set(Math.sin(a) * r, lerp(150, 210, u), LANDMARK.z + Math.cos(a) * r); look.set(0, lerp(190, 200, u), LANDMARK.z - 60); } },
    ];
    const LOOP = SHOTS.reduce((s, x) => s + x.len, 0);
    const DIP = 0.85;

    function render(t) {
      common.uTime.value = t;
      let u = t % LOOP, i = 0;
      while (u > SHOTS[i].len) { u -= SHOTS[i].len; i++; }
      const shot = SHOTS[i];
      shot.cam(ease(u / shot.len) * 0.15 + (u / shot.len) * 0.85);
      camera.position.copy(v); camera.lookAt(look);
      // dip at the start and end of every shot (not before the very first frame)
      const edge = Math.min(u, shot.len - u);
      fadeMat.opacity = edge < DIP && !(t < DIP) ? 1 - ease(edge / DIP) : 0;
      // connections draw during the overview shot, faintly visible in the avenue
      arcUniforms.uArc.value = i === 2 ? (u / shot.len) * 1.9 : i === 1 ? 2 : 0;
      arcUniforms.uArcAlpha.value = i === 2 ? 1 : i === 1 ? 0.35 : 0;
      renderer.clear();
      renderer.render(scene, camera);
      if (fadeMat.opacity > 0.001) renderer.render(fadeScene, fadeCam);
    }

    function resize(w, h, dpr) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 1 ? 64 : 42;
      // On wide screens, frame the city in the right of the picture so the headline
      // on the left sits over open sky and water rather than over lit towers.
      if (w / h > 1.15) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      const scale = (h / 900) * dpr;
      traffic.material.uniforms.uScale.value = scale;
      beaconPts.material.uniforms.uScale.value = scale;
    }

    return { render, resize, loop: LOOP, dispose() { renderer.dispose(); } };
  }

  window.HKCinema = { supported, create };
})();
