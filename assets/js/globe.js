/* ==========================================================================
   HK — Interactive dot globe (canvas 2D, orthographic projection)
   • Slow auto-rotation, drag to spin (with inertia)
   • Gold great-circle arcs travelling from Kuwait & Dubai to world markets
   • Region hover highlights via inverse projection
   No WebGL dependency: renders anywhere, downgrades density on mobile.
   ========================================================================== */
(function (HK) {
  'use strict';
  var D2R = Math.PI / 180;

  function Globe(canvas, opts) {
    opts = opts || {};
    var geo = HK.geo;
    var ctx = canvas.getContext('2d');
    var mobile = window.matchMedia('(max-width: 760px)').matches;
    var reduced = HK.reducedMotion && HK.reducedMotion();
    var W, H, R, cx, cy, dpr;
    var rot = -55 * D2R, tilt = 18 * D2R;       // Dubai faces the viewer
    var vRot = 0, vTilt = 0, auto = reduced ? 0 : 0.0009;
    var dragging = false, lastX = 0, lastY = 0, hoverRegion = null, target = null;
    var running = false, raf = 0, t0 = performance.now();

    // ---- Land dots (Fibonacci sphere for even spacing)
    var N = mobile ? 9000 : 20000;
    var dots = [];
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2;
      var lat = Math.asin(y) / D2R;
      var lon = (((i * golden) / D2R) % 360) - 180;
      if (lat < -58) continue;
      if (geo.isLand(lon, lat)) {
        dots.push({ lon: lon * D2R, lat: lat * D2R, clat: Math.cos(lat * D2R), slat: Math.sin(lat * D2R), region: geo.region(lon, lat) });
      }
    }

    // ---- Arcs
    var P = geo.PLACES;
    var arcsDef = [
      ['kuwait', 'dubai', 0],
      ['dubai', 'london', 0.12], ['dubai', 'frankfurt', 0.5], ['dubai', 'mumbai', 0.22], ['dubai', 'delhi', 0.7],
      ['dubai', 'singapore', 0.35], ['dubai', 'hongkong', 0.82], ['dubai', 'tokyo', 0.6], ['dubai', 'nairobi', 0.45],
      ['dubai', 'lagos', 0.9], ['dubai', 'johannesburg', 0.28], ['dubai', 'newyork', 0.66], ['dubai', 'sydney', 0.15],
      ['kuwait', 'paris', 0.4], ['kuwait', 'almaty', 0.75], ['dubai', 'saopaulo', 0.55]
    ];
    function vec(lon, lat) { lon *= D2R; lat *= D2R; return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)]; }
    var arcs = arcsDef.map(function (a) {
      var A = vec(P[a[0]].lon, P[a[0]].lat), B = vec(P[a[1]].lon, P[a[1]].lat);
      var dot = A[0] * B[0] + A[1] * B[1] + A[2] * B[2];
      var om = Math.acos(Math.min(1, Math.max(-1, dot)));
      var pts = [], n = 56, lift = 0.08 + om * 0.13;
      for (var k = 0; k <= n; k++) {
        var t = k / n, s = Math.sin(om);
        var f1 = Math.sin((1 - t) * om) / s, f2 = Math.sin(t * om) / s;
        var h = 1 + Math.sin(Math.PI * t) * lift;
        pts.push([(A[0] * f1 + B[0] * f2) * h, (A[1] * f1 + B[1] * f2) * h, (A[2] * f1 + B[2] * f2) * h]);
      }
      return { pts: pts, phase: a[2], hero: a[0] === 'kuwait' && a[1] === 'dubai' };
    });

    function size() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      R = Math.min(W, H) * 0.42; cx = W / 2; cy = H / 2;
    }

    // Project a unit-ish 3D vector (in globe space) to screen.
    function project(v, cr, sr, ct, st) {
      // rotate around Y by rot
      var x = v[0] * cr + v[2] * sr;
      var z = -v[0] * sr + v[2] * cr;
      var y = v[1];
      // tilt around X
      var y1 = y * ct - z * st;
      var z1 = z * ct + y * st;
      return [cx + x * R, cy - y1 * R, z1, x, y1];
    }

    function unproject(px, py) {
      var x = (px - cx) / R, y1 = (cy - py) / R, d = x * x + y1 * y1;
      if (d > 1) return null;
      var z1 = Math.sqrt(1 - d), ct = Math.cos(tilt), st = Math.sin(tilt);
      var y = y1 * ct + z1 * st, z = z1 * ct - y1 * st;
      var lon = Math.atan2(x, z) - rot;
      lon = ((lon / D2R + 540) % 360) - 180;
      return [lon, Math.asin(Math.max(-1, Math.min(1, y))) / D2R];
    }

    function draw(now) {
      var t = (now - t0) / 1000;
      if (!dragging) {
        if (target !== null) {
          var d = target - rot;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          rot += d * 0.06;
          if (Math.abs(d) < 0.002) target = null;
        } else {
          rot += auto + vRot; vRot *= 0.94;
        }
        tilt += vTilt; vTilt *= 0.9;
        tilt = Math.max(-0.6, Math.min(0.8, tilt));
      }
      var cr = Math.cos(rot), sr = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // atmosphere
      var atm = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.35);
      atm.addColorStop(0, 'rgba(60,100,255,0.28)');
      atm.addColorStop(0.35, 'rgba(40,70,200,0.1)');
      atm.addColorStop(1, 'rgba(10,20,60,0)');
      ctx.fillStyle = atm; ctx.fillRect(0, 0, W, H);

      // sphere body
      var body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      body.addColorStop(0, '#1b2f7a');
      body.addColorStop(0.55, '#0c1848');
      body.addColorStop(1, '#070f30');
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      // graticule (subtle)
      ctx.strokeStyle = 'rgba(140,170,255,0.06)'; ctx.lineWidth = 1;
      for (var la = -60; la <= 60; la += 30) {
        ctx.beginPath(); var started = false;
        for (var lo = -180; lo <= 180; lo += 6) {
          var p = project(vec(lo, la), cr, sr, ct, st);
          if (p[2] > 0) { started ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); started = true; } else started = false;
        }
        ctx.stroke();
      }

      // land dots
      var ds = mobile ? 1.5 : 1.7;
      for (var i = 0; i < dots.length; i++) {
        var dt = dots[i];
        var v = [dt.clat * Math.sin(dt.lon), dt.slat, dt.clat * Math.cos(dt.lon)];
        var q = project(v, cr, sr, ct, st);
        if (q[2] <= 0.02) continue;
        var a = 0.25 + q[2] * 0.7;
        if (hoverRegion && dt.region === hoverRegion) ctx.fillStyle = 'rgba(232,200,130,' + Math.min(1, a + 0.2) + ')';
        else if (dt.region === 'middleeast') ctx.fillStyle = 'rgba(214,184,120,' + a * 0.75 + ')';
        else ctx.fillStyle = 'rgba(150,178,255,' + a * 0.6 + ')';
        var s = ds * (0.6 + q[2] * 0.5);
        ctx.fillRect(q[0] - s / 2, q[1] - s / 2, s, s);
      }

      // rim light
      var rim = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R);
      rim.addColorStop(0, 'rgba(0,0,0,0)');
      rim.addColorStop(1, 'rgba(120,150,255,0.22)');
      ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      // arcs
      ctx.lineCap = 'round';
      for (var j = 0; j < arcs.length; j++) {
        var arc = arcs[j], pts = arc.pts, proj = [];
        for (var k = 0; k < pts.length; k++) {
          var pp = project(pts[k], cr, sr, ct, st);
          var outside = (pp[3] * pp[3] + pp[4] * pp[4]) > 1;
          proj.push([pp[0], pp[1], pp[2] > 0 || outside]);
        }
        // faint full path
        ctx.strokeStyle = arc.hero ? 'rgba(232,200,130,0.55)' : 'rgba(212,175,95,0.2)';
        ctx.lineWidth = arc.hero ? 1.6 : 1;
        ctx.beginPath();
        for (var m = 1; m < proj.length; m++) {
          if (proj[m][2] && proj[m - 1][2]) { ctx.moveTo(proj[m - 1][0], proj[m - 1][1]); ctx.lineTo(proj[m][0], proj[m][1]); }
        }
        ctx.stroke();
        // travelling comet
        var head = reduced ? 1 : ((t * 0.28 + arc.phase) % 1.35);
        var hi = Math.floor(head * (proj.length - 1));
        var tail = 12;
        for (var n = Math.max(1, hi - tail); n <= Math.min(hi, proj.length - 1); n++) {
          if (!(proj[n][2] && proj[n - 1][2])) continue;
          var f = 1 - (hi - n) / tail;
          ctx.strokeStyle = 'rgba(255,226,160,' + (f * 0.95) + ')';
          ctx.lineWidth = 0.6 + f * 1.8;
          ctx.beginPath(); ctx.moveTo(proj[n - 1][0], proj[n - 1][1]); ctx.lineTo(proj[n][0], proj[n][1]); ctx.stroke();
        }
        // endpoint glow on arrival
        var end = proj[proj.length - 1];
        if (end[2] && head > 0.95 && head < 1.3) {
          var ga = 1 - (head - 0.95) / 0.35;
          ctx.fillStyle = 'rgba(255,220,150,' + ga * 0.8 + ')';
          ctx.beginPath(); ctx.arc(end[0], end[1], 2 + (1 - ga) * 6, 0, Math.PI * 2); ctx.fill();
        }
      }

      // origin nodes
      ['kuwait', 'dubai'].forEach(function (key, idx) {
        var pl = P[key], q = project(vec(pl.lon, pl.lat), cr, sr, ct, st);
        if (q[2] <= 0) return;
        var pulse = reduced ? 0.5 : ((t * 0.7 + idx * 0.5) % 1);
        ctx.strokeStyle = 'rgba(232,200,130,' + (1 - pulse) * 0.8 + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(q[0], q[1], 4 + pulse * 16, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#f4dfa8';
        ctx.beginPath(); ctx.arc(q[0], q[1], key === 'dubai' ? 3.6 : 2.8, 0, Math.PI * 2); ctx.fill();
        ctx.font = '600 11px Outfit, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, q[2] * 1.4) + ')';
        ctx.textAlign = key === 'dubai' ? 'left' : 'right';
        ctx.fillText(pl.name.toUpperCase(), q[0] + (key === 'dubai' ? 10 : -10), q[1] + (key === 'dubai' ? 12 : -6));
      });

      if (running) raf = requestAnimationFrame(draw);
    }

    function start() { if (running) return; running = true; raf = requestAnimationFrame(draw); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    // ---- Interaction
    function local(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    canvas.addEventListener('pointerdown', function (e) {
      dragging = true; target = null; lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-grabbing');
    });
    canvas.addEventListener('pointermove', function (e) {
      if (dragging) {
        var dx = e.clientX - lastX, dy = e.clientY - lastY;
        rot += dx * 0.005; tilt += dy * 0.004; tilt = Math.max(-0.6, Math.min(0.8, tilt));
        vRot = dx * 0.0008; vTilt = dy * 0.0004;
        lastX = e.clientX; lastY = e.clientY;
        if (!running) draw(performance.now());
      }
      if (e.pointerType === 'mouse' || !dragging) {
        var l = local(e), ll = unproject(l[0], l[1]);
        var reg = ll && geo.isLand(ll[0], ll[1]) ? geo.region(ll[0], ll[1]) : null;
        if (reg !== hoverRegion) {
          hoverRegion = reg;
          if (!running) draw(performance.now());
        }
        opts.onHover && opts.onHover(reg, e.clientX, e.clientY);
      }
    });
    function end(e) { dragging = false; canvas.classList.remove('is-grabbing'); }
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('pointerleave', function () {
      hoverRegion = null; opts.onHover && opts.onHover(null);
    });

    size();
    draw(performance.now());
    var io = new IntersectionObserver(function (e) { e[0].isIntersecting && !reduced ? start() : stop(); }, { rootMargin: '100px' });
    io.observe(canvas);
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); draw(performance.now()); }, 150); });

    return {
      focus: function (lon) {
        target = -lon * D2R;
        if (reduced) { rot = target; target = null; draw(performance.now()); }
      },
      spin: function () { target = null; vRot = 0.06; if (reduced) draw(performance.now()); }
    };
  }

  HK.Globe = Globe;
})(window.HK = window.HK || {});
