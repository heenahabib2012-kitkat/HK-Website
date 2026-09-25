/* ==========================================================================
   HK Business Consultancy — "Departures"
   Split-flap boards, live world clocks and a great-circle route map.
   Vanilla JS, no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var R = Math.PI / 180;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function reduced() { return root.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  var wide = window.matchMedia('(min-width: 901px)').matches;

  /* ------------------------------------------------------------ Split-flap engine */
  var CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&.-:';
  function cellHTML(ch) {
    return '<span class="f__t"><b>' + ch + '</b></span><span class="f__b"><b>' + ch + '</b></span><span class="f__ft"><b>' + ch + '</b></span><span class="f__fb"><b>' + ch + '</b></span>';
  }
  function Flap(el) {
    var len = +el.getAttribute('data-len') || el.getAttribute('data-flap').length;
    var cells = [], text = '';
    el.textContent = '';
    for (var i = 0; i < len; i++) {
      var c = document.createElement('span');
      c.className = 'f'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = cellHTML('&nbsp;');
      c._cur = ' '; c._queue = []; c._busy = false;
      el.appendChild(c); cells.push(c);
    }
    function show(c, ch) { $$('b', c).forEach(function (b) { b.textContent = ch === ' ' ? ' ' : ch; }); c._cur = ch; }
    function step(c) {
      if (!c._queue.length) { c._busy = false; return; }
      c._busy = true;
      var next = c._queue.shift(), cur = c._cur, d = 70;
      var t = $('.f__t b', c), ft = $('.f__ft', c), fb = $('.f__fb', c), b = $('.f__b b', c);
      t.textContent = next === ' ' ? ' ' : next;
      $('b', fb).textContent = t.textContent;
      $('b', ft).textContent = cur === ' ' ? ' ' : cur;
      var a1 = ft.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], { duration: d / 2, easing: 'ease-in', fill: 'forwards' });
      var a2 = fb.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }], { duration: d / 2, delay: d / 2, easing: 'ease-out', fill: 'forwards' });
      a2.onfinish = function () {
        show(c, next); a1.cancel(); a2.cancel();
        step(c);
      };
    }
    function set(str, opts) {
      opts = opts || {};
      str = String(str).toUpperCase();
      text = str;
      el.setAttribute('aria-label', str.trim());
      var target = (str + ' '.repeat(len)).slice(0, len);
      cells.forEach(function (c, i) {
        var ch = target[i];
        if (reduced() || opts.instant || !c.animate) { c._queue = []; show(c, ch); return; }
        if (ch === c._cur && !opts.scramble) return;
        var q = [], n = opts.scramble ? 3 + Math.floor(Math.random() * 6) : 1 + Math.floor(Math.random() * 3);
        for (var k = 0; k < n; k++) q.push(CHARS[1 + Math.floor(Math.random() * 26)]);
        q.push(ch);
        setTimeout(function () { c._queue = q; if (!c._busy) step(c); }, (opts.delay || 0) + i * (opts.stagger == null ? 22 : opts.stagger));
      });
    }
    el._flap = { set: set, get: function () { return text; } };
    set(el.getAttribute('data-flap'), { instant: true });
    return el._flap;
  }

  // Destinations become flaps on wide screens; plain text on phones
  $$('.dest').forEach(function (d) { if (wide) d.classList.add('flap', 'flap--md'); });
  $$('.flap[data-flap]').forEach(Flap);

  // Boards re-flip (scramble then settle) the first time they come into view
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      seen.unobserve(en.target);
      $$('.flap[data-flap]', en.target).forEach(function (f, i) { f._flap.set(f._flap.get(), { scramble: true, delay: i * 40 }); });
    });
  }, { threshold: .3 });
  $$('.sign, .board').forEach(function (b) { seen.observe(b); });

  /* ------------------------------------------------------------ Hero sign tilt */
  var sign = $('[data-tilt-sign] .sign'), hero = $('.hero');
  if (sign && hero) {
    hero.addEventListener('pointermove', function (e) {
      if (reduced() || e.pointerType !== 'mouse') return;
      var r = hero.getBoundingClientRect();
      sign.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 8).toFixed(2) + 'deg');
      sign.style.setProperty('--rx', (6 + ((e.clientY - r.top) / r.height - .5) * -6).toFixed(2) + 'deg');
    });
    hero.addEventListener('pointerleave', function () { sign.style.removeProperty('--rx'); sign.style.removeProperty('--ry'); });
  }

  /* ------------------------------------------------------------ Time helpers */
  function parts(tz, date) {
    var o = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', weekday: 'short', hour: '2-digit', minute: '2-digit' })
      .formatToParts(date).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }
  function offset(tz, date) {
    var o = {};
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
      .formatToParts(date).forEach(function (p) { o[p.type] = +p.value; });
    return Math.round((Date.UTC(o.year, o.month - 1, o.day, o.hour % 24, o.minute) - Math.floor(date.getTime() / 60000) * 60000) / 60000);
  }

  /* ------------------------------------------------------------ Bar clock */
  var barClock = $('[data-clock]');
  function tickBar() { var p = parts('Asia/Dubai', new Date()); barClock._flap.set(p.hour + ':' + p.minute); }
  if (barClock) { tickBar(); setInterval(tickBar, 15000); }

  /* ------------------------------------------------------------ World clocks board */
  var CITIES = [
    { name: 'Dubai', tz: 'Asia/Dubai', home: true, work: [1, 2, 3, 4, 5] },
    { name: 'Kuwait', tz: 'Asia/Kuwait', work: [0, 1, 2, 3, 4] },
    { name: 'Mumbai', tz: 'Asia/Kolkata', work: [1, 2, 3, 4, 5] },
    { name: 'Singapore', tz: 'Asia/Singapore', work: [1, 2, 3, 4, 5] },
    { name: 'London', tz: 'Europe/London', work: [1, 2, 3, 4, 5] },
    { name: 'New York', tz: 'America/New_York', work: [1, 2, 3, 4, 5] }
  ];
  var DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  var clocks = $('[data-clocks]');
  if (clocks) {
    CITIES.forEach(function (c) {
      var row = document.createElement('div');
      row.className = 'board__row'; row.setAttribute('role', 'row');
      row.innerHTML = '<span role="cell" class="city' + (c.home ? ' is-home' : '') + '">' + c.name + '</span>' +
        '<span role="cell" class="flap flap--md" data-flap="--:--" data-len="5"></span>' +
        '<span role="cell" class="diff"></span>' +
        '<span role="cell" class="flap flap--md is-status" data-flap="" data-len="6"></span>';
      clocks.appendChild(row);
      c.time = Flap(row.children[1]); c.status = Flap(row.children[3]); c.diff = row.children[2]; c.statusEl = row.children[3];
    });
    var tickClocks = function () {
      var now = new Date(), dxb = offset('Asia/Dubai', now);
      CITIES.forEach(function (c) {
        var p = parts(c.tz, now), mins = +p.hour * 60 + +p.minute;
        var open = c.work.indexOf(DAYS[p.weekday]) > -1 && mins >= 540 && mins < 1080;
        c.time.set(p.hour + ':' + p.minute);
        c.status.set(open ? 'OPEN' : 'CLOSED');
        c.statusEl.classList.toggle('is-amber', open);
        var d = offset(c.tz, now) - dxb;
        c.diff.textContent = c.home ? '—' : (d >= 0 ? '+' : '−') + Math.floor(Math.abs(d) / 60) + (Math.abs(d) % 60 ? ':' + String(Math.abs(d) % 60).padStart(2, '0') : '') + 'h';
      });
    };
    tickClocks();
    setInterval(tickClocks, 30000);
  }

  /* ------------------------------------------------------------ Services board */
  var rows = $$('[data-svc]'), info = $('[data-info]');
  function selectRow(i) {
    rows.forEach(function (r, k) {
      var on = k === i;
      r.classList.toggle('is-on', on);
      r.setAttribute('aria-pressed', String(on));
      var st = r.querySelector('.is-status');
      if (st._flap.get() !== (on ? 'BOARDING' : 'OPEN')) st._flap.set(on ? 'BOARDING' : 'OPEN');
    });
    var r = rows[i], cells = r.children;
    var title = cells[1].getAttribute('data-flap');
    $('[data-info-flight]').textContent = cells[0].getAttribute('data-flap');
    $('[data-info-gate]').textContent = cells[2].getAttribute('data-flap');
    $('[data-info-title]').textContent = titleCase(title);
    $('[data-info-desc]').textContent = r.getAttribute('data-desc');
    $('[data-info-pts]').innerHTML = r.getAttribute('data-points').split('|').map(function (x) { return '<li>' + x + '</li>'; }).join('');
    $('[data-info-cta]').setAttribute('data-service', titleCase(title));
  }
  function titleCase(s) {
    return s.toLowerCase().replace(/(^|[\s-])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); }).replace(/\bUae\b/, 'UAE');
  }
  rows.forEach(function (r, i) { r.addEventListener('click', function () { selectRow(i); }); });
  if (rows.length) selectRow(0);
  var cta = $('[data-info-cta]');
  if (cta) cta.addEventListener('click', function () { $('#f-service').value = cta.getAttribute('data-service'); });

  /* ------------------------------------------------------------ Route map */
  var REGIONS = {
    middleeast: ['Middle East', 'Business Advisory', 'Where our journey began, Kuwait, and where we are headquartered, Dubai.'],
    india: ['India & South Asia', 'Market Entry & Corporate Solutions', 'Supporting businesses moving between South Asia and the Gulf.'],
    europe: ['Europe', 'International Business Support', 'Serving clients across international markets.'],
    asia: ['Asia', 'Strategic Expansion', 'Helping businesses evaluate growth across Asian markets.'],
    africa: ['Africa', 'Cross-Border Business Solutions', 'Exploring opportunities across emerging African markets.'],
    namerica: ['North America', 'Global Business Connections', 'Serving clients across international markets.'],
    samerica: ['South America', 'International Opportunity', 'Serving clients across international markets.'],
    oceania: ['Oceania', 'International Opportunity', 'Serving clients across international markets.'],
    centralasia: ['Central Asia', 'Strategic Expansion', 'Serving clients across international markets.']
  };
  var ROUTES = [
    ['KWI', 'Kuwait City', 29.37, 47.98, 'middleeast'], ['RUH', 'Riyadh', 24.71, 46.68, 'middleeast'], ['CAI', 'Cairo', 30.04, 31.24, 'africa'],
    ['IST', 'Istanbul', 41.01, 28.98, 'europe'], ['LHR', 'London', 51.51, -0.13, 'europe'], ['JFK', 'New York', 40.71, -74.0, 'namerica'],
    ['GRU', 'São Paulo', -23.55, -46.63, 'samerica'], ['LOS', 'Lagos', 6.52, 3.38, 'africa'], ['NBO', 'Nairobi', -1.29, 36.82, 'africa'],
    ['JNB', 'Johannesburg', -26.2, 28.05, 'africa'], ['KHI', 'Karachi', 24.86, 67.0, 'india'], ['BOM', 'Mumbai', 19.08, 72.88, 'india'],
    ['DEL', 'Delhi', 28.61, 77.21, 'india'], ['ALA', 'Almaty', 43.24, 76.95, 'centralasia'], ['SIN', 'Singapore', 1.35, 103.82, 'asia'],
    ['HKG', 'Hong Kong', 22.32, 114.17, 'asia'], ['HND', 'Tokyo', 35.68, 139.69, 'asia'], ['SYD', 'Sydney', -33.87, 151.21, 'oceania']
  ];
  var DXB = [25.2, 55.27];
  var map = $('[data-map]'), mapCard = $('[data-map-card]');
  if (map && window.HK && window.HK.geo) {
    var NS = 'http://www.w3.org/2000/svg';
    var B = [-100, 160, -45, 66], K = 5; // lon min/max, lat min/max, px per degree
    var Wm = (B[1] - B[0]) * K, Hm = (B[3] - B[2]) * K;
    map.setAttribute('viewBox', '0 0 ' + Wm + ' ' + Hm);
    var xy = function (lon, lat) { return [(lon - B[0]) * K, (B[3] - lat) * K]; };
    var mk = function (n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
    var land = '', step = 2;
    for (var la = B[3] - 1; la > B[2]; la -= step) {
      for (var lo = B[0] + 1; lo < B[1]; lo += step) {
        if (window.HK.geo.isLand(lo, la)) { var q = xy(lo, la); land += 'M' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + 'h.01'; }
      }
    }
    mk('path', { d: land, class: 'm-land', 'stroke-width': 4.2, stroke: 'rgba(154,163,199,.28)', 'stroke-linecap': 'round' }, map);
    var gcPath = function (lat1, lon1, lat2, lon2) {
      var p1 = lat1 * R, l1 = lon1 * R, p2 = lat2 * R, l2 = lon2 * R;
      var A = [Math.cos(p1) * Math.cos(l1), Math.cos(p1) * Math.sin(l1), Math.sin(p1)];
      var Bv = [Math.cos(p2) * Math.cos(l2), Math.cos(p2) * Math.sin(l2), Math.sin(p2)];
      var om = Math.acos(Math.max(-1, Math.min(1, A[0] * Bv[0] + A[1] * Bv[1] + A[2] * Bv[2]))), d = '';
      for (var i = 0; i <= 48; i++) {
        var t = i / 48, s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om);
        var x = A[0] * s1 + Bv[0] * s2, y = A[1] * s1 + Bv[1] * s2, z = A[2] * s1 + Bv[2] * s2;
        var q = xy(Math.atan2(y, x) / R, Math.atan2(z, Math.sqrt(x * x + y * y)) / R);
        d += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
      }
      return { d: d, km: 6371 * om };
    };
    var cityEls = [];
    ROUTES.forEach(function (r, i) {
      var g = gcPath(DXB[0], DXB[1], r[2], r[3]);
      mk('path', { d: g.d, class: 'm-route' }, map);
      if (!reduced()) {
        var plane = mk('circle', { r: 3, class: 'm-plane' }, map);
        mk('animateMotion', { dur: (5 + (i % 5)) + 's', begin: (i * .6) + 's', repeatCount: 'indefinite', path: g.d }, plane);
      }
      var q = xy(r[3], r[2]);
      var grp = mk('g', { class: 'm-city', tabindex: 0, role: 'button', 'aria-label': r[1] + ' (' + r[0] + '), ' + Math.round(g.km) + ' km from Dubai' }, map);
      mk('circle', { cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: 4 }, grp);
      var left = r[3] < DXB[1] && r[0] !== 'KWI';
      var tx = mk('text', { x: (q[0] + (left ? -9 : 9)).toFixed(1), y: (q[1] + (r[0] === 'KWI' ? -8 : 4)).toFixed(1), 'text-anchor': left ? 'end' : 'start' }, grp);
      tx.textContent = r[0];
      var pick = function () {
        cityEls.forEach(function (c) { c.classList.remove('is-on'); });
        grp.classList.add('is-on');
        var rg = REGIONS[r[4]];
        mapCard.textContent = r[1] + ' (' + r[0] + '), ' + Math.round(g.km).toLocaleString('en-US') + ' km from Dubai. ' + rg[0] + ': ' + rg[1] + '. ' + rg[2];
      };
      grp.addEventListener('mouseenter', pick); grp.addEventListener('focus', pick); grp.addEventListener('click', pick);
      cityEls.push(grp);
    });
    var h = xy(DXB[1], DXB[0]);
    mk('circle', { cx: h[0], cy: h[1], r: 6, class: 'm-hubring' }, map);
    mk('circle', { cx: h[0], cy: h[1], r: 6, class: 'm-hub' }, map);
    var ht = mk('text', { x: h[0] + 10, y: h[1] + 20, class: 'm-hubtext' }, map); ht.textContent = 'DXB';
    cityEls[0].dispatchEvent(new Event('click'));
  }

  /* ------------------------------------------------------------ Tilt (boarding pass, covers) */
  $$('[data-tilt]').forEach(function (c) {
    var target = c.classList.contains('pass-wrap') ? $('.pass', c) : c;
    c.addEventListener('pointermove', function (e) {
      if (reduced() || e.pointerType !== 'mouse') return;
      var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      target.style.setProperty('--ry', ((px - .5) * 12).toFixed(1) + 'deg');
      target.style.setProperty('--rx', ((py - .5) * -10).toFixed(1) + 'deg');
      target.style.setProperty('--shine', (100 - px * 100).toFixed(0) + '%');
    });
    c.addEventListener('pointerleave', function () { ['--rx', '--ry', '--shine'].forEach(function (v) { target.style.removeProperty(v); }); });
  });

  /* ------------------------------------------------------------ Dialogs */
  function openDlg(d) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  $$('[data-open]').forEach(function (b) { b.addEventListener('click', function () { openDlg($('#dlg-' + b.getAttribute('data-open'))); }); });
  $$('dialog').forEach(function (d) { d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-close]')) d.close(); }); });
  $$('[data-insight]').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = $('#dlg-insight');
      $('[data-ins-issue]', d).textContent = 'HK Insights · ' + $('.cover__issue', b).textContent;
      $('[data-ins-title]', d).textContent = $('b', b).textContent;
      $('[data-ins-desc]', d).textContent = $('.cover__sub', b).textContent + '.';
      openDlg(d);
    });
  });

  /* ------------------------------------------------------------ Photos */
  var photos = (window.HK && window.HK.config && window.HK.config.photos) || {};
  $$('[data-photo]').forEach(function (h) {
    var src = photos[h.getAttribute('data-photo')];
    if (!src) return;
    var img = new Image();
    img.alt = h.getAttribute('data-alt') || ''; img.loading = 'lazy'; img.decoding = 'async'; img.className = 'photo';
    img.onload = function () { h.classList.add('has-photo'); };
    img.src = src; h.appendChild(img);
  });

  /* ------------------------------------------------------------ Enquiry form */
  var form = $('#enquiry');
  if (form) {
    var err = $('.form__error', form), done = $('.form__done');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.website.value) return;
      var bad = [];
      $$('[required]', form).forEach(function (f) {
        var v = f.value.trim(), ok = v !== '' && (f.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
        f.closest('.field').classList.toggle('is-invalid', !ok);
        f.setAttribute('aria-invalid', String(!ok));
        if (!ok) bad.push(f);
      });
      if (bad.length) {
        err.textContent = 'Please complete the highlighted fields' + (bad.some(function (b) { return b.type === 'email'; }) ? ' and check the email address.' : '.');
        err.hidden = false; bad[0].focus(); return;
      }
      err.hidden = true;
      var btn = $('button[type="submit"]', form); btn.disabled = true;
      var endpoint = window.HK && window.HK.config && window.HK.config.formEndpoint;
      var send = endpoint
        ? fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } }).then(function (r) { if (!r.ok) throw new Error(r.status); })
        : new Promise(function (res) { console.info('[HK] formEndpoint not configured; enquiry not sent.'); setTimeout(res, 500); });
      send.then(function () {
        form.hidden = true; done.hidden = false; done.focus();
        var f = $('.flap', done); if (f && f._flap) f._flap.set('CHECKED IN', { scramble: true });
      }).catch(function () { err.textContent = 'Your enquiry could not be sent. Please try again in a moment.'; err.hidden = false; })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ------------------------------------------------------------ Motion toggle, year */
  var mt = $('.motion');
  if (mt) {
    mt.setAttribute('aria-pressed', String(reduced()));
    mt.addEventListener('click', function () {
      var on = !root.classList.contains('reduce-motion');
      root.classList.toggle('reduce-motion', on);
      mt.setAttribute('aria-pressed', String(on));
      try { localStorage.setItem('hk-reduce-motion', on ? '1' : '0'); } catch (e) {}
    });
  }
  var yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();
})();
