/* ==========================================================================
   HK — Lattice 3D
   A carved mashrabiya screen rendered in raw WebGL (no library): every bar
   of the star-and-cross lattice is an extruded box, set in a pointed-arch
   frame, in front of a backdrop (sky, lantern glow or a photo texture).
   Light comes from the real sun over Dubai, or from behind at night.
   window.HKLattice3D(canvas, { mode: 'sun' | 'lantern', photo?: url })
   ========================================================================== */
(function () {
  'use strict';

  var W = 200, H = 300, S = 127;          // arch box and springing height (y up)
  var TILE = 40;                          // lattice tile size in scene units

  // Star-and-cross lattice segments on a 100 x 100 tile (y down)
  var SEG = [
    [24, 24, 76, 24], [76, 24, 76, 76], [76, 76, 24, 76], [24, 76, 24, 24],
    [50, 13, 87, 50], [87, 50, 50, 87], [50, 87, 13, 50], [13, 50, 50, 13],
    [50, 13, 50, 0], [50, 87, 50, 100], [13, 50, 0, 50], [87, 50, 100, 50],
    [24, 24, 0, 0], [76, 24, 100, 0], [76, 76, 100, 100], [24, 76, 0, 100]
  ];

  // Two-centred pointed arch (equilateral): inside test in y-up space
  function inside(x, y, inset) {
    inset = inset || 0;
    if (x < inset || x > W - inset || y < inset) return false;
    if (y <= S) return true;
    var r = W - inset;
    return (x - W) * (x - W) + (y - S) * (y - S) <= r * r && x * x + (y - S) * (y - S) <= r * r;
  }
  function archOutline(inset, n) {
    var pts = [], r = W - inset, apexY = S + Math.sqrt(r * r - (W / 2) * (W / 2));
    pts.push([inset, inset], [inset, S]);
    // left arc: centre (W, S), from (inset, S) to apex (W/2, apexY)
    var t0 = Math.PI, t1 = Math.atan2(apexY - S, W / 2 - W);
    for (var i = 1; i <= n; i++) { var t = t0 + (t1 - t0) * i / n; pts.push([W + r * Math.cos(t), S + r * Math.sin(t)]); }
    // right arc: centre (0, S), from apex to (W - inset, S)
    var u0 = Math.atan2(apexY - S, W / 2), u1 = 0;
    for (var j = 1; j <= n; j++) { var u = u0 + (u1 - u0) * j / n; pts.push([r * Math.cos(u), S + r * Math.sin(u)]); }
    pts.push([W - inset, inset]);
    return pts;
  }

  function buildGeometry() {
    var segs = [];
    var clip = function (x0, y0, x1, y1) {
      var a = inside(x0, y0, 6), b = inside(x1, y1, 6);
      if (a && b) return [x0, y0, x1, y1];
      if (!a && !b) return null;
      var lo = 0, hi = 1, ox = a ? x0 : x1, oy = a ? y0 : y1, fx = a ? x1 : x0, fy = a ? y1 : y0;
      for (var k = 0; k < 18; k++) {
        var m = (lo + hi) / 2;
        if (inside(ox + (fx - ox) * m, oy + (fy - oy) * m, 6)) lo = m; else hi = m;
      }
      return [ox, oy, ox + (fx - ox) * lo, oy + (fy - oy) * lo];
    };
    var sc = TILE / 100, cols = Math.ceil(W / TILE), rows = Math.ceil(H / TILE) + 1;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        SEG.forEach(function (s) {
          var x0 = c * TILE + s[0] * sc, y0 = r * TILE + s[1] * sc;
          var x1 = c * TILE + s[2] * sc, y1 = r * TILE + s[3] * sc;
          var cl = clip(x0, y0, x1, y1);
          if (cl) segs.push([cl[0], cl[1], cl[2], cl[3], 0]);
        });
      }
    }
    var o = archOutline(3, 18);
    for (var i = 0; i < o.length - 1; i++) segs.push([o[i][0], o[i][1], o[i + 1][0], o[i + 1][1], 1]);
    segs.push([o[o.length - 1][0], o[o.length - 1][1], o[0][0], o[0][1], 1]);

    // Each segment becomes a box of 6 faces (24 vertices, 36 indices)
    var base = [], off = [], nor = [], kind = [], idx = [], v = 0;
    segs.forEach(function (s) {
      var dx = s[2] - s[0], dy = s[3] - s[1], len = Math.hypot(dx, dy);
      if (len < .01) return;
      dx /= len; dy /= len;
      var nx = -dy, ny = dx, k = s[4];
      function P(end, side, z) { // end: 0/1, side: -1/1, z: -1/1
        return { b: [end ? s[2] : s[0], end ? s[3] : s[1], z], o: [nx * side + dx * (end ? 1 : -1), ny * side + dy * (end ? 1 : -1)] };
      }
      var faces = [
        [[0, -1, 1], [1, -1, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]],        // front
        [[0, 1, -1], [1, 1, -1], [1, -1, -1], [0, -1, -1], [0, 0, -1]],   // back
        [[0, 1, 1], [1, 1, 1], [1, 1, -1], [0, 1, -1], [nx, ny, 0]],      // side +
        [[0, -1, -1], [1, -1, -1], [1, -1, 1], [0, -1, 1], [-nx, -ny, 0]],// side -
        [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1], [dx, dy, 0]],    // end 1
        [[0, 1, 1], [0, 1, -1], [0, -1, -1], [0, -1, 1], [-dx, -dy, 0]]   // end 0
      ];
      faces.forEach(function (f) {
        for (var q = 0; q < 4; q++) {
          var p = P(f[q][0], f[q][1], f[q][2]);
          base.push(p.b[0], p.b[1], p.b[2]); off.push(p.o[0], p.o[1]);
          nor.push(f[4][0], f[4][1], f[4][2]); kind.push(k);
        }
        idx.push(v, v + 1, v + 2, v, v + 2, v + 3);
        v += 4;
      });
    });
    return { base: new Float32Array(base), off: new Float32Array(off), nor: new Float32Array(nor), kind: new Float32Array(kind), idx: new Uint16Array(idx) };
  }

  var VS_BARS = [
    'attribute vec3 aBase; attribute vec2 aOff; attribute vec3 aNor; attribute float aKind;',
    'uniform mat4 uMVP; uniform mat4 uModel; uniform float uBarW; uniform float uDepth;',
    'varying vec3 vN; varying float vKind; varying float vZ;',
    'void main(){',
    '  float w = mix(uBarW, 7.0, aKind);',
    '  float d = mix(uDepth, uDepth * 1.9, aKind);',
    '  vec3 p = vec3(aBase.xy + aOff * w, aBase.z * d * 0.5 + aKind * 2.0);',
    '  vN = mat3(uModel) * aNor; vKind = aKind; vZ = aBase.z;',
    '  gl_Position = uMVP * vec4(p, 1.0);',
    '}'
  ].join('\n');
  var FS_BARS = [
    'precision mediump float;',
    'varying vec3 vN; varying float vKind; varying float vZ;',
    'uniform vec3 uLight; uniform vec3 uLightCol; uniform float uAmb; uniform float uBack; uniform vec3 uBase; uniform vec3 uFrame;',
    'void main(){',
    '  vec3 n = normalize(vN);',
    '  vec3 base = mix(uBase, uFrame, vKind);',
    '  float dif = max(dot(n, normalize(uLight)), 0.0);',
    '  float rim = uBack * pow(1.0 - abs(n.z), 2.0);',          // edges catch the backlight
    '  vec3 c = base * (uAmb + dif * 0.7) + uLightCol * (dif * 0.22 + rim * 0.9);',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');
  var VS_BG = [
    'attribute vec2 aPos; uniform mat4 uMVP; varying vec2 vP;',
    'void main(){ vP = aPos; gl_Position = uMVP * vec4(aPos, -34.0, 1.0); }'
  ].join('\n');
  var FS_BG = [
    'precision mediump float;',
    'varying vec2 vP;',
    'uniform vec3 uTop; uniform vec3 uBot; uniform float uGlow; uniform vec3 uGlowCol; uniform float uStars; uniform float uTime;',
    'uniform sampler2D uTex; uniform float uHasTex;',
    'float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
    'void main(){',
    '  vec2 q = vP;',
    '  float r = 206.0;',
    '  if (q.x < -6.0 || q.x > 206.0 || q.y < -4.0) discard;',
    '  if (q.y > 127.0 && (distance(q, vec2(200.0, 127.0)) > r || distance(q, vec2(0.0, 127.0)) > r)) discard;',
    '  float t = clamp(q.y / 300.0, 0.0, 1.0);',
    '  vec3 c = mix(uBot, uTop, t);',
    '  if (uHasTex > 0.5) { vec2 uv = vec2((q.x + 30.0) / 260.0, 1.0 - (q.y + 20.0) / 360.0); c = mix(c, texture2D(uTex, uv).rgb, 0.92); }',
    '  float g = length((q - vec2(100.0, 110.0)) / vec2(120.0, 150.0));',
    '  c += uGlowCol * uGlow * smoothstep(1.0, 0.0, g);',
    '  if (uStars > 0.5) { vec2 cell = floor(q / 7.0); float s = h(cell); if (s > 0.985) c += vec3(0.8) * (0.6 + 0.4 * sin(uTime * 2.0 + s * 40.0)) * smoothstep(0.3, 1.0, t); }',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  // ---- tiny matrix helpers (column-major)
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
      var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s;
    }
    return o;
  }
  function persp(fov, asp, n, f) {
    var t = 1 / Math.tan(fov / 2), o = new Float32Array(16);
    o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o;
  }
  function trans(x, y, z) { var o = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]); return o; }
  function rotX(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); }
  function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); }
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]; }

  function compile(gl, vs, fs) {
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  window.HKLattice3D = function (canvas, opts) {
    opts = opts || {};
    var gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) return null;
    var reduce = function () { return document.documentElement.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
    var geo = buildGeometry();
    var pBars = compile(gl, VS_BARS, FS_BARS), pBg = compile(gl, VS_BG, FS_BG);
    function buf(data, target) { var b = gl.createBuffer(); gl.bindBuffer(target || gl.ARRAY_BUFFER, b); gl.bufferData(target || gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; }
    var bBase = buf(geo.base), bOff = buf(geo.off), bNor = buf(geo.nor), bKind = buf(geo.kind), bIdx = buf(geo.idx, gl.ELEMENT_ARRAY_BUFFER);
    var bQuad = buf(new Float32Array([-30, -20, 230, -20, 230, 340, -30, -20, 230, 340, -30, 340]));
    var loc = {
      aBase: gl.getAttribLocation(pBars, 'aBase'), aOff: gl.getAttribLocation(pBars, 'aOff'), aNor: gl.getAttribLocation(pBars, 'aNor'), aKind: gl.getAttribLocation(pBars, 'aKind'),
      aPos: gl.getAttribLocation(pBg, 'aPos')
    };
    function U(p, n) { return gl.getUniformLocation(p, n); }

    var tex = null, hasTex = 0;
    if (opts.photo) {
      var img = new Image();
      img.onload = function () {
        tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        hasTex = 1; draw(performance.now());
      };
      img.src = opts.photo;
    }

    var state = { yaw: 0, pitch: 0, ty: 0, tp: 0, bar: 3.4, light: { mode: opts.mode || 'sun', alt: 40, az: 220 } };
    var running = false, raf = 0, t0 = performance.now();

    function size() {
      var r = canvas.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * d)); canvas.height = Math.max(1, Math.round(r.height * d));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function palette() {
      var L = state.light, night = L.mode === 'lantern' || L.alt < -6, dusk = !night && L.alt < 8;
      if (night) return { top: hex('#060d38'), bot: hex('#14237a'), glow: 1.15, glowCol: hex('#f2bf5e'), stars: 1, light: [0, .1, -1], lightCol: hex('#f2bf5e'), amb: .18, back: 1.0 };
      var az = L.az * Math.PI / 180, el = Math.max(4, L.alt) * Math.PI / 180;
      var dir = [Math.sin(az - Math.PI) * Math.cos(el), Math.sin(el), .55 + .45 * Math.cos(el)];
      if (dusk) return { top: hex('#2f3f98'), bot: hex('#f4a95a'), glow: .35, glowCol: hex('#f7c77a'), stars: 0, light: dir, lightCol: hex('#ffb56b'), amb: .4, back: .35 };
      return { top: hex('#7fa8df'), bot: hex('#f4dcaa'), glow: .18, glowCol: hex('#fff1cf'), stars: 0, light: dir, lightCol: hex('#fff0c9'), amb: .32, back: .12 };
    }

    function draw(now) {
      var t = (now - t0) / 1000;
      state.yaw += (state.ty - state.yaw) * .08; state.pitch += (state.tp - state.pitch) * .08;
      var sway = reduce() ? 0 : Math.sin(t * .35) * .035;
      var asp = canvas.width / canvas.height, fov = 32 * Math.PI / 180;
      var dist = (H / 2) / Math.tan(fov / 2) * (asp < W / H ? (W / H) / asp : 1) * 1.14;
      var model = mul(rotX(state.pitch), mul(rotY(state.yaw + sway), trans(-W / 2, -H / 2 + 4, 0)));
      var mvp = mul(persp(fov, asp, 10, 2000), mul(trans(0, 0, -dist), model));
      var pal = palette();

      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      // backdrop, clipped to the arch by the stencil-free trick: drawn first, the frame hides its edge
      gl.useProgram(pBg);
      gl.bindBuffer(gl.ARRAY_BUFFER, bQuad); gl.enableVertexAttribArray(loc.aPos); gl.vertexAttribPointer(loc.aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(U(pBg, 'uMVP'), false, mvp);
      gl.uniform3fv(U(pBg, 'uTop'), pal.top); gl.uniform3fv(U(pBg, 'uBot'), pal.bot);
      gl.uniform1f(U(pBg, 'uGlow'), pal.glow); gl.uniform3fv(U(pBg, 'uGlowCol'), pal.glowCol);
      gl.uniform1f(U(pBg, 'uStars'), pal.stars); gl.uniform1f(U(pBg, 'uTime'), t);
      gl.uniform1f(U(pBg, 'uHasTex'), hasTex);
      if (tex) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U(pBg, 'uTex'), 0); }
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(loc.aPos);

      gl.useProgram(pBars);
      [[bBase, loc.aBase, 3], [bOff, loc.aOff, 2], [bNor, loc.aNor, 3], [bKind, loc.aKind, 1]].forEach(function (a) {
        gl.bindBuffer(gl.ARRAY_BUFFER, a[0]); gl.enableVertexAttribArray(a[1]); gl.vertexAttribPointer(a[1], a[2], gl.FLOAT, false, 0, 0);
      });
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);
      gl.uniformMatrix4fv(U(pBars, 'uMVP'), false, mvp);
      gl.uniformMatrix4fv(U(pBars, 'uModel'), false, model);
      gl.uniform1f(U(pBars, 'uBarW'), state.bar); gl.uniform1f(U(pBars, 'uDepth'), 12);
      gl.uniform3fv(U(pBars, 'uLight'), pal.light); gl.uniform3fv(U(pBars, 'uLightCol'), pal.lightCol);
      gl.uniform1f(U(pBars, 'uAmb'), pal.amb); gl.uniform1f(U(pBars, 'uBack'), pal.back);
      gl.uniform3fv(U(pBars, 'uBase'), hex(opts.bar || '#1b34b0')); gl.uniform3fv(U(pBars, 'uFrame'), hex(opts.frame || '#0d1a66'));
      gl.drawElements(gl.TRIANGLES, geo.idx.length, gl.UNSIGNED_SHORT, 0);
      [loc.aBase, loc.aOff, loc.aNor, loc.aKind].forEach(function (l) { gl.disableVertexAttribArray(l); });

      if (running && !reduce()) raf = requestAnimationFrame(draw);
    }
    function start() { if (running) return; running = true; raf = requestAnimationFrame(draw); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    size(); draw(performance.now());
    if ('ResizeObserver' in window) new ResizeObserver(function () { size(); draw(performance.now()); }).observe(canvas);
    new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }).observe(canvas);
    window.addEventListener('resize', function () { size(); draw(performance.now()); });
    var host = opts.pointerHost || canvas;
    host.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      state.ty = ((e.clientX - (r.left + r.width / 2)) / r.width) * .5;
      state.tp = ((e.clientY - (r.top + r.height / 2)) / r.height) * -.28;
      if (reduce()) { state.yaw = state.ty; state.pitch = state.tp; draw(performance.now()); }
    });
    host.addEventListener('pointerleave', function () { state.ty = 0; state.tp = 0; });

    return {
      setLight: function (l) { state.light = { mode: opts.mode === 'lantern' ? 'lantern' : 'sun', alt: l.alt, az: l.az }; draw(performance.now()); },
      setOpen: function (p) { state.bar = 3.4 - p * 1.9; if (!running || reduce()) draw(performance.now()); }
    };
  };
})();
