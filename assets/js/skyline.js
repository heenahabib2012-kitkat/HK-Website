/* ==========================================================================
   HK — Procedural night skyline of Dubai (canvas)
   Layers are pre-rendered once to offscreen canvases, then composited with
   parallax offsets every frame — cheap enough for mobile.
   Landmarks: Burj Khalifa, Emirates Towers, Burj Al Arab, Marina towers,
   Sheikh Zayed Road light trails.
   ========================================================================== */
(function (HK) {
  'use strict';

  function rng(seed) {
    return function () {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  // Burj Khalifa: stepped, tapering tower with spire. x = centre, base y, h = total height.
  function burj(ctx, x, base, h, fill, light) {
    var w = h * 0.105;
    var tiers = [
      [1.0, 0.0], [0.86, 0.16], [0.72, 0.30], [0.58, 0.44], [0.46, 0.56],
      [0.36, 0.66], [0.27, 0.74], [0.19, 0.81], [0.12, 0.86]
    ];
    ctx.fillStyle = fill;
    for (var i = 0; i < tiers.length; i++) {
      var tw = w * tiers[i][0];
      var y0 = base - h * tiers[i][1];
      var y1 = base - h * (tiers[i + 1] ? tiers[i + 1][1] : 0.9);
      ctx.fillRect(x - tw / 2, y1, tw, y0 - y1 + 1);
    }
    // spire
    ctx.beginPath();
    ctx.moveTo(x - w * 0.05, base - h * 0.9);
    ctx.lineTo(x, base - h);
    ctx.lineTo(x + w * 0.05, base - h * 0.9);
    ctx.fill();
    // lit spine
    var g = ctx.createLinearGradient(0, base - h, 0, base);
    g.addColorStop(0, 'rgba(255,236,190,0.95)');
    g.addColorStop(0.4, light);
    g.addColorStop(1, 'rgba(120,150,255,0.05)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 0.6, base - h * 0.98, 1.2, h * 0.98);
    for (var t = 1; t < tiers.length; t++) {
      var yy = base - h * tiers[t][1];
      ctx.fillStyle = 'rgba(212,175,95,0.55)';
      ctx.fillRect(x - w * tiers[t][0] / 2, yy, w * tiers[t][0], 1);
    }
  }

  // Emirates Towers: two tall triangular-topped towers
  function emirates(ctx, x, base, h, fill) {
    ctx.fillStyle = fill;
    [[0, 1], [h * 0.09, 0.9]].forEach(function (p) {
      var w = h * 0.07, hh = h * p[1], xx = x + p[0];
      ctx.beginPath();
      ctx.moveTo(xx, base);
      ctx.lineTo(xx, base - hh * 0.86);
      ctx.lineTo(xx + w * 0.5, base - hh);
      ctx.lineTo(xx + w, base - hh * 0.86);
      ctx.lineTo(xx + w, base);
      ctx.fill();
    });
  }

  // Burj Al Arab: sail silhouette
  function sail(ctx, x, base, h, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.lineTo(x, base - h);
    ctx.quadraticCurveTo(x + h * 0.42, base - h * 0.55, x + h * 0.34, base);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(212,175,95,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, base - h);
    ctx.quadraticCurveTo(x + h * 0.42, base - h * 0.55, x + h * 0.34, base);
    ctx.stroke();
    ctx.fillRect(x - 2, base - h * 1.08, 1.5, h * 0.08);
  }

  // Cayan-like twisted tower & Marina tower tops
  function tower(ctx, r, x, base, w, h, fill, winAlpha) {
    ctx.fillStyle = fill;
    var top = r();
    ctx.fillRect(x, base - h, w, h);
    if (top < 0.25) {
      ctx.beginPath(); ctx.moveTo(x, base - h); ctx.lineTo(x + w / 2, base - h - w * 0.8); ctx.lineTo(x + w, base - h); ctx.fill();
    } else if (top < 0.4) {
      ctx.fillRect(x + w * 0.46, base - h - h * 0.12, 1.2, h * 0.12);
    } else if (top < 0.5) {
      ctx.fillRect(x + w * 0.15, base - h - 6, w * 0.7, 6);
    }
    // windows
    var cols = Math.max(2, Math.floor(w / 4));
    var rows = Math.floor(h / 5);
    for (var i = 0; i < rows; i++) {
      for (var c = 0; c < cols; c++) {
        if (r() < 0.42) continue;
        var warm = r() < 0.72;
        ctx.fillStyle = warm
          ? 'rgba(255,214,150,' + (winAlpha * (0.35 + r() * 0.65)) + ')'
          : 'rgba(170,200,255,' + (winAlpha * (0.3 + r() * 0.5)) + ')';
        ctx.fillRect(x + 1.5 + c * (w - 3) / cols, base - h + 4 + i * 5, Math.max(1, (w - 3) / cols - 1.3), 1.6);
      }
    }
  }

  function renderLayer(W, H, dpr, opts) {
    var cv = document.createElement('canvas');
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    var r = rng(opts.seed);
    var base = H * opts.base;
    var x = -20;
    while (x < W + 20) {
      var w = opts.minW + r() * (opts.maxW - opts.minW);
      var h = (opts.minH + Math.pow(r(), 1.6) * (opts.maxH - opts.minH)) * H;
      // keep a valley where the hero landmark sits
      if (opts.valley && Math.abs(x - W * opts.valley) < W * 0.08) h *= 0.45;
      tower(ctx, r, x, base, w, h, opts.fill, opts.win);
      x += w + opts.gap * r();
    }
    ctx.fillStyle = opts.fill;
    ctx.fillRect(0, base, W, H - base);
    if (opts.landmarks) opts.landmarks(ctx, W, H, base);
    return cv;
  }

  function Skyline(canvas, options) {
    options = options || {};
    var ctx = canvas.getContext('2d');
    var layers = [], stars = [], trails = [], twinkles = [];
    var W = 0, H = 0, dpr = 1, raf = 0, running = false, t0 = performance.now();
    var mx = 0, my = 0, tx = 0, ty = 0, scrollY = 0;
    var reduced = HK.reducedMotion && HK.reducedMotion();
    var mobile = window.matchMedia('(max-width: 760px)').matches;
    var focus = options.focus == null ? 0.62 : options.focus; // x position of Burj Khalifa

    function build() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      var pad = 60; // parallax overscan
      var LW = W + pad * 2;
      layers = [
        { cv: renderLayer(LW, H, dpr, { seed: 11, base: 0.8, minW: 14, maxW: 34, minH: 0.06, maxH: 0.24, gap: 8, fill: '#0d1a44', win: 0.25 }), depth: 0.25 },
        { cv: renderLayer(LW, H, dpr, { seed: 29, base: 0.83, minW: 18, maxW: 44, minH: 0.08, maxH: 0.36, gap: 10, fill: '#0a1436', win: 0.55, valley: (W * focus + pad) / LW,
            landmarks: function (c, w, h, b) {
              burj(c, W * focus + pad, b, h * 0.78, '#0b1538', 'rgba(212,175,95,0.55)');
              emirates(c, W * focus + pad - h * 0.34, b, h * 0.33, '#0a1436');
              sail(c, pad + W * 0.08, b, h * 0.26, '#0b1538');
            } }), depth: 0.55 },
        { cv: renderLayer(LW, H, dpr, { seed: 47, base: 0.9, minW: 26, maxW: 70, minH: 0.04, maxH: 0.2, gap: 6, fill: '#060d26', win: 0.8 }), depth: 1 }
      ];
      var r = rng(7);
      stars = [];
      for (var i = 0; i < (mobile ? 60 : 140); i++) stars.push([r() * W, r() * H * 0.55, r() * 1.1 + 0.2, r() * 6.28]);
      trails = [];
      for (var j = 0; j < (mobile ? 14 : 34); j++) trails.push({ lane: r(), x: r() * W, v: 40 + r() * 120, dir: r() < 0.5 ? 1 : -1, len: 20 + r() * 60, warm: r() < 0.5 });
      twinkles = [];
      for (var k = 0; k < 26; k++) twinkles.push([r() * W, H * (0.45 + r() * 0.4), r() * 6.28, 0.5 + r()]);
      pad0 = pad;
    }
    var pad0 = 60;

    function draw(now) {
      var t = (now - t0) / 1000;
      tx += (mx - tx) * 0.05; ty += (my - ty) * 0.05;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // sky glow behind landmark
      var g = ctx.createRadialGradient(W * focus, H * 0.82, 10, W * focus, H * 0.7, H * 0.9);
      g.addColorStop(0, 'rgba(58,92,220,0.35)');
      g.addColorStop(0.45, 'rgba(34,56,160,0.12)');
      g.addColorStop(1, 'rgba(6,12,38,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // stars
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        ctx.globalAlpha = 0.25 + 0.35 * (reduced ? 0.5 : (Math.sin(t * 1.3 + s[3]) * 0.5 + 0.5));
        ctx.fillStyle = '#dfe6ff';
        ctx.fillRect(s[0] - tx * 4, s[1] - ty * 3, s[2], s[2]);
      }
      ctx.globalAlpha = 1;

      // layered skyline
      for (var l = 0; l < layers.length; l++) {
        var L = layers[l];
        var ox = -pad0 - tx * 26 * L.depth;
        var oy = scrollY * 0.18 * (1 - L.depth) - ty * 8 * L.depth + (reduced ? 0 : Math.sin(t * 0.25 + l) * 1.5 * L.depth);
        ctx.drawImage(L.cv, ox, oy, L.cv.width / dpr, L.cv.height / dpr);
      }

      // Burj Khalifa beacon
      var bx = W * focus - tx * 26 * 0.55, by = H * 0.83 - H * 0.78 + scrollY * 0.18 * 0.45 - ty * 8 * 0.55;
      var pulse = reduced ? 0.6 : (Math.sin(t * 2.2) * 0.5 + 0.5);
      var bg = ctx.createRadialGradient(bx, by, 0, bx, by, 18);
      bg.addColorStop(0, 'rgba(255,90,90,' + (0.5 + pulse * 0.5) + ')');
      bg.addColorStop(1, 'rgba(255,90,90,0)');
      ctx.fillStyle = bg; ctx.fillRect(bx - 18, by - 18, 36, 36);

      // window twinkles
      if (!reduced) {
        for (var k = 0; k < twinkles.length; k++) {
          var tw = twinkles[k], a = Math.max(0, Math.sin(t * tw[3] + tw[2]));
          ctx.fillStyle = 'rgba(255,220,160,' + (a * 0.8) + ')';
          ctx.fillRect(tw[0] - tx * 26, tw[1], 2, 1.5);
        }
      }

      // Sheikh Zayed Road light trails
      var roadY = H * 0.93;
      ctx.fillStyle = '#040a1e';
      ctx.fillRect(0, roadY - 4, W, H - roadY + 4);
      for (var j = 0; j < trails.length; j++) {
        var tr = trails[j];
        if (!reduced) tr.x += tr.dir * tr.v * 0.016;
        if (tr.x > W + 80) tr.x = -80;
        if (tr.x < -80) tr.x = W + 80;
        var y = roadY + tr.lane * (H - roadY - 4);
        var lg = ctx.createLinearGradient(tr.x, 0, tr.x - tr.dir * tr.len, 0);
        var col = tr.dir > 0 ? (tr.warm ? '255,200,120' : '255,240,220') : '255,80,70';
        lg.addColorStop(0, 'rgba(' + col + ',0.9)');
        lg.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = lg;
        ctx.fillRect(Math.min(tr.x, tr.x - tr.dir * tr.len), y, tr.len, 1.3);
      }

      // water reflection shimmer under the skyline
      var rg = ctx.createLinearGradient(0, roadY - 4, 0, H);
      rg.addColorStop(0, 'rgba(212,175,95,0.08)');
      rg.addColorStop(1, 'rgba(6,12,38,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, roadY - 4, W, H - roadY);

      if (running && !reduced) raf = requestAnimationFrame(draw);
    }

    function start() { if (running) return; running = true; raf = requestAnimationFrame(draw); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    build();
    draw(performance.now());

    var io = new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); });
    io.observe(canvas);

    if (!mobile) {
      window.addEventListener('pointermove', function (e) {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }
    if (options.scroll !== false) {
      window.addEventListener('scroll', function () {
        scrollY = Math.min(window.scrollY, H);
        if (reduced) draw(performance.now());
      }, { passive: true });
    }
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { build(); draw(performance.now()); }, 200);
    });
  }

  HK.Skyline = Skyline;
})(window.HK = window.HK || {});
