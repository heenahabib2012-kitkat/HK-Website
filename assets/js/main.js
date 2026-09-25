/* ==========================================================================
   HK Business Consultancy — interaction layer
   Vanilla JS, no dependencies. Everything degrades gracefully:
   touch devices skip cursor/magnetic/tilt; reduced motion disables motion.
   ========================================================================== */
(function (HK) {
  'use strict';

  var root = document.documentElement;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var mobile = window.matchMedia('(max-width: 760px)').matches;

  HK.reducedMotion = function () { return mqReduce.matches || root.classList.contains('reduce-motion'); };

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------------------------------------------------------------- Photos */
  function initPhotos() {
    var photos = (HK.config && HK.config.photos) || {};
    $$('[data-photo]').forEach(function (holder) {
      var src = photos[holder.getAttribute('data-photo')];
      if (!src) return;
      var img = new Image();
      img.alt = holder.getAttribute('data-alt') || '';
      img.decoding = 'async';
      img.loading = 'lazy';
      img.className = 'photo';
      img.onload = function () { holder.classList.add('has-photo'); };
      img.src = src;
      holder.appendChild(img);
    });
  }

  /* ---------------------------------------------------------------- Loader */
  function initLoader() {
    var loader = $('.loader');
    var done = function () { root.classList.add('is-loaded'); setTimeout(function () { loader && loader.remove(); }, 1200); };
    if (HK.reducedMotion()) return done();
    var t = setTimeout(done, 2200);
    window.addEventListener('load', function () { clearTimeout(t); setTimeout(done, 700); });
  }

  /* ---------------------------------------------------------------- Nav */
  function initNav() {
    var nav = $('.nav'), toggle = $('.nav__toggle'), menu = $('#mobile-menu');
    var last = 0;
    function onScroll() {
      var y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > 400 && y > last && !root.classList.contains('menu-open'));
      last = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function setMenu(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      root.classList.toggle('menu-open', open);
      if (open) { menu.hidden = false; requestAnimationFrame(function () { menu.classList.add('is-open'); }); }
      else { menu.classList.remove('is-open'); setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 500); }
    }
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) setMenu(false); });

    // active section highlight
    var links = $$('.nav__links a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          map[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); s && io.observe(s); });
  }

  /* ---------------------------------------------------------------- Cursor */
  function initCursor() {
    if (!finePointer || HK.reducedMotion()) return;
    var c = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
    var x = -100, y = -100, rx = -100, ry = -100;
    root.classList.add('has-cursor');
    window.addEventListener('pointermove', function (e) { x = e.clientX; y = e.clientY; c.classList.add('is-visible'); }, { passive: true });
    document.addEventListener('pointerleave', function () { c.classList.remove('is-visible'); });
    (function loop() {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('a, button, [data-tilt], input, select, textarea, canvas.globe, .worldmap');
      c.classList.toggle('is-hover', !!t && !t.matches('input, select, textarea'));
      c.classList.toggle('is-text', !!t && t.matches('input, textarea'));
      c.classList.toggle('is-drag', !!t && t.matches('canvas.globe'));
    });
    document.addEventListener('pointerdown', function () { c.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { c.classList.remove('is-down'); });
  }

  /* ---------------------------------------------------------------- Magnetic */
  function initMagnetic() {
    if (!finePointer || HK.reducedMotion()) return;
    $$('.magnetic').forEach(function (el) {
      var strength = el.classList.contains('btn--block') ? 0.08 : 0.28;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + dx * strength + 'px,' + dy * strength * 1.2 + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------------- 3D tilt */
  function initTilt() {
    if (!finePointer || HK.reducedMotion()) return;
    $$('[data-tilt]').forEach(function (el) {
      var raf = 0;
      el.addEventListener('pointermove', function (e) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          el.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(2) + 'deg');
          el.style.setProperty('--ry', ((px - 0.5) * 12).toFixed(2) + 'deg');
          el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        });
      });
      el.addEventListener('pointerleave', function () {
        cancelAnimationFrame(raf);
        el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------------------------------------------------------------- Split headings */
  function initSplit() {
    $$('.split').forEach(function (h) {
      var idx = 0;
      function walk(node, parent) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (w) {
              if (!w) return;
              if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
              var outer = document.createElement('span'); outer.className = 'w';
              var inner = document.createElement('span'); inner.textContent = w;
              inner.style.transitionDelay = (idx++ * 0.045) + 's';
              outer.appendChild(inner); frag.appendChild(outer);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1) walk(n);
        });
      }
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      walk(h);
      $$('.w', h).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
    });
  }

  /* ---------------------------------------------------------------- Reveal */
  function initReveal() {
    var targets = $$('.reveal, .split, .pillar, .svc, .ins, .sector, .jstep, .stat, .hero__title');
    if (!('IntersectionObserver' in window)) { targets.forEach(function (t) { t.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        // stagger siblings of the same kind
        var sibs = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains(el.classList[0]); }) : [];
        var i = sibs.indexOf(el);
        if (i > 0) el.style.setProperty('--stagger', (i * 0.08) + 's');
        el.classList.add('in');
        io.unobserve(el);
        if (el.classList.contains('stat')) countUp(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  function countUp(stat) {
    var n = $('[data-count]', stat);
    if (!n || HK.reducedMotion()) return;
    var target = parseInt(n.getAttribute('data-count'), 10), start = performance.now();
    (function tick(now) {
      var p = clamp((now - start) / 900, 0, 1);
      var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      n.textContent = (v < 10 ? '0' : '') + v;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  /* ---------------------------------------------------------------- Parallax */
  function initParallax() {
    if (HK.reducedMotion()) return;
    var els = $$('[data-speed]');
    var heroContent = $('.hero__content'), heroVeil = $('.hero__veil');
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var center = r.top + r.height / 2 - vh / 2;
        el.style.transform = 'translate3d(0,' + (center * parseFloat(el.getAttribute('data-speed'))).toFixed(1) + 'px,0)';
      });
      var y = window.scrollY;
      if (y < vh * 1.2 && heroContent) {
        heroContent.style.transform = 'translate3d(0,' + (y * 0.35).toFixed(1) + 'px,0)';
        heroContent.style.opacity = String(clamp(1 - y / (vh * 0.75), 0, 1));
        heroVeil.style.opacity = String(clamp(0.55 + y / vh, 0, 1));
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------- Gold particles */
  function initParticles() {
    $$('canvas.particles').forEach(function (cv) {
      var ctx = cv.getContext('2d');
      var count = parseInt(cv.getAttribute('data-count') || '40', 10);
      if (mobile) count = Math.round(count * 0.45);
      var W, H, dpr, parts = [], running = false, raf = 0;
      function size() {
        var r = cv.getBoundingClientRect();
        W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        cv.width = W * dpr; cv.height = H * dpr;
        parts = [];
        for (var i = 0; i < count; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.3, vx: (Math.random() - 0.5) * 0.12, vy: -Math.random() * 0.25 - 0.05, a: Math.random(), p: Math.random() * 6.28 });
      }
      function draw() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.x += p.vx; p.y += p.vy; p.p += 0.02;
          if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
          var a = (0.25 + Math.sin(p.p) * 0.25 + 0.25) * p.a;
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, 'rgba(244,223,168,' + a + ')');
          g.addColorStop(1, 'rgba(201,161,74,0)');
          ctx.fillStyle = g;
          ctx.fillRect(p.x - p.r * 4, p.y - p.r * 4, p.r * 8, p.r * 8);
        }
        if (running) raf = requestAnimationFrame(draw);
      }
      size(); draw();
      if (HK.reducedMotion()) return;
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { if (!running) { running = true; raf = requestAnimationFrame(draw); } }
        else { running = false; cancelAnimationFrame(raf); }
      }).observe(cv);
      window.addEventListener('resize', size);
    });
  }

  /* ---------------------------------------------------------------- Hover card */
  var card = $('.hover-card');
  function showCard(reg, x, y) {
    if (!card) return;
    if (!reg || !HK.geo.REGIONS[reg]) { card.classList.remove('is-on'); return; }
    var info = HK.geo.REGIONS[reg];
    if (card.getAttribute('data-reg') !== reg) {
      card.setAttribute('data-reg', reg);
      $('.hover-card__region', card).textContent = info.name;
      $('.hover-card__focus', card).textContent = info.focus;
      $('.hover-card__note', card).textContent = info.note;
    }
    card.hidden = false;
    card.classList.add('is-on');
    if (x != null) {
      var w = card.offsetWidth, h = card.offsetHeight;
      var left = x + 22, top = y + 18;
      if (left + w > window.innerWidth - 12) left = x - w - 22;
      if (top + h > window.innerHeight - 12) top = y - h - 18;
      card.style.transform = 'translate3d(' + left + 'px,' + top + 'px,0)';
    }
  }

  /* ---------------------------------------------------------------- Globe */
  function initGlobe() {
    var cv = $('canvas.globe');
    if (!cv || !HK.Globe) return;
    var globe = HK.Globe(cv, { onHover: showCard });
    $$('.route__step').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.route__step').forEach(function (x) { x.classList.remove('is-active'); });
        b.classList.add('is-active');
        var f = b.getAttribute('data-focus');
        if (f === 'spin') globe.spin(); else globe.focus(parseFloat(f));
      });
    });
  }

  /* ---------------------------------------------------------------- Maps */
  function initMaps() {
    if (!HK.WorldMap) return;
    var why = $('#why-map');
    if (why) HK.WorldMap(why, {
      bounds: [-22, 150, -38, 62], step: 2.2, hub: 'dubai',
      links: ['kuwait', 'mumbai', 'london', 'singapore', 'nairobi', 'hongkong', 'lagos', 'delhi'],
      labelMap: { kuwait: 'Kuwait', mumbai: 'India', london: 'Europe', singapore: 'Asia', nairobi: 'Africa', hongkong: 'East Asia', lagos: 'West Africa', delhi: '' },
      onHover: showCard
    });
    var pres = $('#presence-map');
    if (pres) HK.WorldMap(pres, {
      bounds: [-128, 178, -48, 72], step: mobile ? 3 : 2, hub: 'dubai', origin: 'kuwait', hubLabel: 'DUBAI · HQ', originLabel: 'KUWAIT',
      links: ['london', 'frankfurt', 'newyork', 'saopaulo', 'lagos', 'nairobi', 'johannesburg', 'mumbai', 'almaty', 'singapore', 'hongkong', 'tokyo', 'sydney'],
      labelMap: { london: 'Europe', frankfurt: '', newyork: 'North America', saopaulo: 'South America', lagos: '', nairobi: 'Africa', johannesburg: '', mumbai: 'India', almaty: 'Central Asia', singapore: 'South-East Asia', hongkong: '', tokyo: 'East Asia', sydney: 'Oceania' },
      labels: !mobile, onHover: showCard
    });
    var jm = $('#journey-map');
    if (jm) HK.WorldMap(jm, {
      bounds: [-128, 178, -48, 72], step: 3, hub: 'dubai', aspect: 'xMidYMid slice', labels: false, interactive: false,
      links: ['kuwait', 'london', 'newyork', 'mumbai', 'singapore', 'tokyo', 'nairobi', 'sydney', 'saopaulo']
    });
  }

  /* ---------------------------------------------------------------- Skylines */
  function initSkylines() {
    if (!HK.Skyline) return;
    var hero = $('.hero__skyline');
    if (hero) HK.Skyline(hero, { focus: mobile ? 0.7 : 0.66 });
    var why = $('.why__skyline');
    if (why) HK.Skyline(why, { focus: 0.5, scroll: false });
    var cta = $('.cta__skyline');
    if (cta) HK.Skyline(cta, { focus: 0.5, scroll: false });
    var js = $('.journey__skyline');
    if (js) HK.Skyline(js, { focus: 0.55, scroll: false });
  }

  /* ---------------------------------------------------------------- Journey (pinned horizontal timeline) */
  function initJourney() {
    var sec = $('.journey');
    if (!sec) return;
    var track = $('.journey__track', sec), bar = $('.journey__bar i', sec);
    var steps = $$('.jstep', sec), scenes = $$('.scene', sec), labels = $$('.journey__labels b', sec);
    var names = ['kuwait', 'dubai', 'global'];
    var current = -1, ticking = false;
    function horizontal() { return window.innerWidth > 900; }
    function update() {
      ticking = false;
      var r = sec.getBoundingClientRect();
      var total = sec.offsetHeight - window.innerHeight;
      var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
      if (horizontal()) {
        var max = track.scrollWidth - track.clientWidth;
        track.style.transform = 'translate3d(' + (-p * max).toFixed(1) + 'px,0,0)';
      } else track.style.transform = '';
      var idx = Math.min(2, Math.floor(p * 3 * 0.999));
      if (idx !== current) {
        current = idx;
        steps.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
        labels.forEach(function (s, i) { s.classList.toggle('is-active', i <= idx); });
        scenes.forEach(function (s) { s.classList.toggle('is-active', s.classList.contains('scene--' + names[idx])); });
      }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------------------------------------------------------------- Services (tap to expand on touch) */
  function initServices() {
    $$('.svc').forEach(function (s) {
      s.addEventListener('click', function (e) {
        if (e.target.closest('.svc__link')) return;
        if (!finePointer) {
          var open = s.classList.contains('is-open');
          $$('.svc.is-open').forEach(function (o) { o.classList.remove('is-open'); });
          if (!open) s.classList.add('is-open');
        }
      });
      s.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target === s) { $('.svc__link', s).click(); }
      });
    });
  }

  /* ---------------------------------------------------------------- Sectors accordion */
  function initSectors() {
    $$('.sector > button').forEach(function (b) {
      b.addEventListener('click', function () {
        var li = b.parentElement, open = b.getAttribute('aria-expanded') === 'true';
        $$('.sector > button[aria-expanded="true"]').forEach(function (o) { o.setAttribute('aria-expanded', 'false'); o.parentElement.classList.remove('is-open'); });
        if (!open) { b.setAttribute('aria-expanded', 'true'); li.classList.add('is-open'); }
      });
    });
  }

  /* ---------------------------------------------------------------- Overlays */
  function initDialogs() {
    var lastTrigger = null;
    function open(dlg) {
      if (typeof dlg.showModal !== 'function') { dlg.setAttribute('open', ''); return; }
      dlg.showModal();
      root.classList.add('dialog-open');
      requestAnimationFrame(function () { dlg.classList.add('is-open'); });
    }
    function close(dlg, cb) {
      dlg.classList.remove('is-open');
      setTimeout(function () {
        dlg.close(); root.classList.remove('dialog-open');
        if (cb) cb(); else if (lastTrigger) lastTrigger.focus({ preventScroll: true });
      }, HK.reducedMotion() ? 0 : 380);
    }
    $$('dialog.overlay').forEach(function (dlg) {
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(dlg); });
      dlg.addEventListener('click', function (e) {
        if (e.target === dlg) return close(dlg);
        var c = e.target.closest('[data-close]');
        if (!c) return;
        var href = c.getAttribute('href');
        if (href && href.charAt(0) === '#') {
          e.preventDefault();
          close(dlg, function () { var t = $(href); t && t.scrollIntoView({ behavior: HK.reducedMotion() ? 'auto' : 'smooth' }); });
        } else close(dlg);
      });
    });

    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-dialog]');
      if (!t) return;
      e.preventDefault();
      lastTrigger = t;
      var type = t.getAttribute('data-dialog');
      if (type === 'chairman') return open($('#dlg-chairman'));
      if (type === 'service') {
        var svc = t.closest('.svc'), dlg = $('#dlg-service');
        $('[data-svc-idx]', dlg).textContent = $('.svc__idx', svc).textContent;
        $('[data-svc-title]', dlg).textContent = $('.svc__title', svc).textContent;
        $('[data-svc-desc]', dlg).textContent = $('.svc__desc', svc).textContent;
        $('[data-svc-icon]', dlg).innerHTML = $('.svc__icon', svc).outerHTML;
        $('[data-svc-list]', dlg).innerHTML = $('.svc__more ul', svc).innerHTML;
        $('[data-svc-cta]', dlg).setAttribute('data-service', $('.svc__title', svc).textContent);
        return open(dlg);
      }
      if (type === 'insight') {
        var ins = t.closest('.ins'), d2 = $('#dlg-insight');
        $('[data-ins-tag]', d2).textContent = ins ? $('.ins__tag', ins).textContent : 'Knowledge centre';
        $('[data-ins-title]', d2).textContent = ins ? $('h3', ins).textContent : 'HK Insights';
        $('[data-ins-desc]', d2).textContent = ins ? $('p', ins).textContent : 'Perspectives on business in the UAE, market entry, corporate strategy, global business, entrepreneurship, and investment & growth.';
        return open(d2);
      }
    });

    // Pre-select the service in the enquiry form when coming from a service overlay
    var cta = $('[data-svc-cta]');
    if (cta) cta.addEventListener('click', function () {
      var sel = $('#enquiry select[name="service"]'), name = cta.getAttribute('data-service');
      $$('option', sel).forEach(function (o) { if (o.textContent === name) sel.value = o.value || o.textContent; });
      sel.classList.add('has-value');
    });
  }

  /* ---------------------------------------------------------------- Enquiry form */
  function initForm() {
    var form = $('#enquiry');
    if (!form) return;
    var err = $('.form__error', form), success = $('.form__success');
    var sel = $('select', form);
    sel.addEventListener('change', function () { sel.classList.add('has-value'); });

    function validate() {
      var bad = [];
      $$('[required]', form).forEach(function (f) {
        var ok = f.value.trim() !== '' && (f.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
        f.closest('.field').classList.toggle('is-invalid', !ok);
        f.setAttribute('aria-invalid', String(!ok));
        if (!ok) bad.push(f);
      });
      return bad;
    }
    $$('input, textarea, select', form).forEach(function (f) {
      f.addEventListener('blur', function () { if (f.closest('.field').classList.contains('is-invalid')) validate(); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.website.value) return; // honeypot
      var bad = validate();
      if (bad.length) {
        err.textContent = 'Please complete the highlighted fields' + (bad.some(function (b) { return b.type === 'email'; }) ? ' and check your email address.' : '.');
        err.hidden = false;
        bad[0].focus();
        return;
      }
      err.hidden = true;
      var btn = $('button[type="submit"]', form);
      btn.disabled = true; btn.classList.add('is-loading');
      var endpoint = HK.config && HK.config.formEndpoint;
      var send = endpoint
        ? fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } }).then(function (r) { if (!r.ok) throw new Error(r.status); })
        : new Promise(function (res) { if (window.console) console.info('[HK] formEndpoint not configured — enquiry not sent.'); setTimeout(res, 700); });
      send.then(function () {
        form.hidden = true;
        success.hidden = false;
        requestAnimationFrame(function () { success.classList.add('is-on'); success.focus(); });
      }).catch(function () {
        err.textContent = 'Sorry — something went wrong sending your enquiry. Please try again shortly.';
        err.hidden = false;
      }).then(function () { btn.disabled = false; btn.classList.remove('is-loading'); });
    });
  }

  /* ---------------------------------------------------------------- Motion toggle */
  function initMotionToggle() {
    var b = $('.motion-toggle');
    if (!b) return;
    b.setAttribute('aria-pressed', String(HK.reducedMotion()));
    b.addEventListener('click', function () {
      var on = !root.classList.contains('reduce-motion');
      try { localStorage.setItem('hk-reduce-motion', on ? '1' : '0'); } catch (e) {}
      // Reload so every canvas/animation re-initialises in the chosen mode.
      root.classList.toggle('reduce-motion', on);
      location.reload();
    });
  }

  /* ---------------------------------------------------------------- Boot */
  function boot() {
    var y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
    initPhotos();
    initLoader();
    initNav();
    initSplit();
    initReveal();
    initCursor();
    initMagnetic();
    initTilt();
    initParallax();
    initSkylines();
    initParticles();
    initGlobe();
    initMaps();
    initJourney();
    initServices();
    initSectors();
    initDialogs();
    initForm();
    initMotionToggle();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.HK = window.HK || {});
