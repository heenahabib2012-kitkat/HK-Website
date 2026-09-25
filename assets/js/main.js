/* ==========================================================================
   HK Business Consultancy — "The Ascent"
   Scroll position is read as a floor level: the lift rail, the lit floor on
   the hero tower and the header readout all follow it.
   Vanilla JS, no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var TOP = 160;          // level at the top of the spire
  var M_PER_LEVEL = 4.2;  // storey height used for the elevation readout
  var reduced = function () {
    return root.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function pad3(n) { return String(Math.round(n)).padStart(3, '0'); }
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    parent && parent.appendChild(e);
    return e;
  }

  /* ------------------------------------------------------------ Floors */
  var floors = $$('.floor[data-level]').map(function (el) {
    return { el: el, id: el.id, level: +el.getAttribute('data-level'), name: el.getAttribute('data-name') };
  });

  // Slab elevation labels
  floors.forEach(function (f) {
    var lvl = $('.slab__lvl', f.el);
    if (lvl) lvl.setAttribute('data-elev', '+' + (f.level * M_PER_LEVEL).toFixed(1) + ' m');
  });

  /* ------------------------------------------------------------ Lift rail + directory */
  var stops = $('[data-stops]'), dirList = $('[data-directory]');
  floors.forEach(function (f) {
    var li = document.createElement('li');
    li.style.setProperty('--at', f.level / TOP);
    li.innerHTML = '<a href="#' + f.id + '" aria-label="Level ' + pad3(f.level) + ': ' + f.name + '">' + pad3(f.level) + '<span>' + f.name + '</span></a>';
    stops.appendChild(li);
  });
  floors.slice().reverse().forEach(function (f) {
    var li = document.createElement('li');
    li.innerHTML = '<a href="#' + f.id + '" data-close>' + f.name + '<small>LVL ' + pad3(f.level) + '</small></a>';
    dirList.appendChild(li);
  });

  /* ------------------------------------------------------------ Hero tower (elevation drawing) */
  var tower = $('[data-tower]'), lit = null;
  var tiers = [ // [from level, to level, half-width]
    [0, 6, 176], [6, 30, 150], [30, 58, 122], [58, 84, 96], [84, 106, 72],
    [106, 126, 52], [126, 142, 34], [142, 152, 20]
  ];
  function yOf(level) { return 1000 - level / TOP * 1000; }
  function halfAt(level) {
    for (var i = tiers.length - 1; i >= 0; i--) if (level >= tiers[i][0]) return level < tiers[i][1] ? tiers[i][2] : 3;
    return tiers[0][2];
  }
  if (tower) {
    var cx = 200;
    tiers.forEach(function (t, i) {
      var y0 = yOf(t[0]), y1 = yOf(t[1]), w = t[2], d = (i * 0.13) + 's';
      // floor lines every 4 levels
      var fine = '';
      for (var l = t[0] + 4; l < t[1]; l += 4) fine += 'M' + (cx - w) + ' ' + yOf(l) + 'H' + (cx + w);
      // mullions
      [-0.5, 0, 0.5].forEach(function (m) { fine += 'M' + (cx + w * m) + ' ' + y0 + 'V' + y1; });
      svgEl('path', { d: fine, class: 't-fine t-draw', pathLength: 1, style: '--d:' + (i * 0.13 + 0.35) + 's' }, tower);
      svgEl('path', { d: 'M' + (cx - w) + ' ' + y0 + 'V' + y1 + 'H' + (cx + w) + 'V' + y0, class: 't-ink t-draw', pathLength: 1, style: '--d:' + d }, tower);
    });
    svgEl('path', { d: 'M' + cx + ' ' + yOf(152) + 'V0', class: 't-ink t-draw', pathLength: 1, style: '--d:1.1s' }, tower);
    svgEl('path', { d: 'M0 1000H400', class: 't-ink t-draw', pathLength: 1, style: '--d:0s' }, tower);
    lit = svgEl('rect', { class: 't-lit', x: cx - 150, y: yOf(2), width: 300, height: 6 }, tower);
  }

  /* ------------------------------------------------------------ Fit the hero headline to its column
     (keeps the stacked lines intact whichever font actually loads) */
  var title = $('.hero__title');
  function fitTitle() {
    if (!title) return;
    title.style.fontSize = '';
    var lines = $$('span', title), avail = title.clientWidth, widest = 0;
    lines.forEach(function (l) { widest = Math.max(widest, l.scrollWidth); });
    if (widest > avail) title.style.fontSize = (parseFloat(getComputedStyle(title).fontSize) * avail / widest * 0.98) + 'px';
  }
  fitTitle();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitTitle(); measure(); update(); });

  /* ------------------------------------------------------------ Scroll → level */
  var num = $('[data-lvl-num]'), mini = $('[data-level-mini]'), elev = $('[data-lvl-elev]'), dirEl = $('[data-dir]');
  var car = $('.lift__car'), stopLinks = $$('.lift__stops a');
  var marks = [];
  function measure() {
    marks = floors.map(function (f) { return { top: f.el.getBoundingClientRect().top + window.scrollY, level: f.level }; });
    marks.push({ top: document.documentElement.scrollHeight - window.innerHeight * 0.6, level: TOP });
  }
  var lastY = window.scrollY, ticking = false;
  function update() {
    ticking = false;
    var y = window.scrollY, p = y + window.innerHeight * 0.4, level = 0;
    for (var i = 0; i < marks.length - 1; i++) {
      if (p >= marks[i].top) {
        var a = marks[i], b = marks[i + 1];
        level = a.level + Math.min(1, (p - a.top) / Math.max(1, b.top - a.top)) * (b.level - a.level);
      }
    }
    if (y <= 2) level = 0;
    level = Math.max(0, Math.min(TOP, level));
    num.textContent = pad3(level);
    if (mini) mini.textContent = pad3(level);
    elev.textContent = '+' + (level * M_PER_LEVEL).toFixed(1) + ' m';
    if (y !== lastY) dirEl.classList.toggle('is-down', y < lastY);
    lastY = y;
    car.style.setProperty('--p', (level / TOP).toFixed(4));
    var here = 0;
    floors.forEach(function (f, i) { if (level >= f.level - 0.5) here = i; });
    stopLinks.forEach(function (a, i) { a.classList.toggle('is-here', i === here); });
    $$('a', dirList).forEach(function (a, i) { a.classList.toggle('is-here', floors.length - 1 - i === here); });
    if (lit) {
      var L = Math.max(1, Math.min(151, level));
      var w = halfAt(L);
      lit.setAttribute('x', 200 - w); lit.setAttribute('width', w * 2);
      lit.setAttribute('y', yOf(L) - 3);
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { fitTitle(); measure(); update(); });
  window.addEventListener('load', function () { measure(); update(); });
  measure(); update();

  /* ------------------------------------------------------------ Services floors */
  $$('.fl__row').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(!open));
      b.parentElement.classList.toggle('is-open', !open);
      setTimeout(measure, 500);
    });
  });
  $$('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () { $('#f-service').value = a.getAttribute('data-service'); });
  });

  /* ------------------------------------------------------------ Sectors board */
  $$('.board__list button').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') === 'true';
      $$('.board__list button[aria-expanded="true"]').forEach(function (o) { o.setAttribute('aria-expanded', 'false'); });
      b.setAttribute('aria-expanded', String(!open));
    });
  });

  /* ------------------------------------------------------------ The working day, seen from Dubai */
  var CITIES = [
    { name: 'Singapore', tz: 'Asia/Singapore' },
    { name: 'Mumbai', tz: 'Asia/Kolkata' },
    { name: 'Dubai', tz: 'Asia/Dubai', home: true },
    { name: 'Kuwait', tz: 'Asia/Kuwait' },
    { name: 'London', tz: 'Europe/London' },
    { name: 'New York', tz: 'America/New_York' }
  ];
  function tzOffset(tz, date) {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(date);
    var v = {}; parts.forEach(function (p) { v[p.type] = +p.value; });
    var asUTC = Date.UTC(v.year, v.month - 1, v.day, v.hour % 24, v.minute);
    return Math.round((asUTC - Math.floor(date.getTime() / 60000) * 60000) / 60000);
  }
  function hhmm(mins) { mins = ((mins % 1440) + 1440) % 1440; return String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'); }
  var day = $('[data-day]');
  function drawDay() {
    if (!day) return;
    var now = new Date(), utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
    var dxb = tzOffset('Asia/Dubai', now);
    day.innerHTML = '';
    CITIES.forEach(function (c) {
      var off = tzOffset(c.tz, now);
      var row = document.createElement('div');
      row.className = 'day__row' + (c.home ? ' is-home' : '');
      row.innerHTML = '<div class="day__city"><b>' + c.name + '</b><span>' + hhmm(utcMin + off) + '</span></div><div class="day__track"></div>';
      var track = row.lastChild;
      var start = ((9 * 60 - off + dxb) % 1440 + 1440) % 1440, len = 9 * 60;
      [[start, Math.min(len, 1440 - start)], [0, Math.max(0, start + len - 1440)]].forEach(function (seg) {
        if (seg[1] <= 0) return;
        var band = document.createElement('span');
        band.className = 'day__band';
        band.style.left = (seg[0] / 1440 * 100) + '%';
        band.style.width = (seg[1] / 1440 * 100) + '%';
        track.appendChild(band);
      });
      row.setAttribute('aria-label', c.name + ': office hours 09:00 to 18:00 local are ' + hhmm(9 * 60 - off + dxb) + ' to ' + hhmm(18 * 60 - off + dxb) + ' Dubai time');
      day.appendChild(row);
    });
    var f = (((utcMin + dxb) % 1440) + 1440) % 1440 / 1440;
    var line = document.createElement('div');
    line.className = 'day__nowline' + (f > 0.8 ? ' is-late' : '');
    line.style.left = 'calc(var(--lab) + (100% - var(--lab)) * ' + f.toFixed(4) + ')';
    line.innerHTML = '<span>Now in Dubai ' + hhmm(utcMin + dxb) + '</span>';
    day.appendChild(line);
  }
  drawDay();
  setInterval(drawDay, 30000);

  /* ------------------------------------------------------------ Observation deck panorama */
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
  var PLACES = [
    ['Kuwait City', 29.37, 47.98, 'middleeast', 'origin'], ['Riyadh', 24.71, 46.68, 'middleeast'], ['Cairo', 30.04, 31.24, 'africa'],
    ['Istanbul', 41.01, 28.98, 'europe'], ['London', 51.51, -0.13, 'europe'], ['Moscow', 55.76, 37.62, 'europe'],
    ['New York', 40.71, -74.0, 'namerica'], ['São Paulo', -23.55, -46.63, 'samerica', 'flip'], ['Lagos', 6.52, 3.38, 'africa'],
    ['Nairobi', -1.29, 36.82, 'africa'], ['Johannesburg', -26.2, 28.05, 'africa', 'flip'], ['Karachi', 24.86, 67.0, 'india'],
    ['Mumbai', 19.08, 72.88, 'india'], ['Delhi', 28.61, 77.21, 'india'], ['Almaty', 43.24, 76.95, 'centralasia'],
    ['Singapore', 1.35, 103.82, 'asia'], ['Hong Kong', 22.32, 114.17, 'asia'], ['Tokyo', 35.68, 139.69, 'asia'],
    ['Sydney', -33.87, 151.21, 'oceania']
  ];
  var DXB = [25.2, 55.27], R = Math.PI / 180;
  function gc(lat1, lon1, lat2, lon2) {
    var p1 = lat1 * R, p2 = lat2 * R, dl = (lon2 - lon1) * R;
    var h = Math.pow(Math.sin((p2 - p1) / 2), 2) + Math.cos(p1) * Math.cos(p2) * Math.pow(Math.sin(dl / 2), 2);
    var dist = 2 * 6371 * Math.asin(Math.sqrt(h));
    var brg = (Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) / R + 360) % 360;
    return [dist, brg];
  }
  var pano = $('[data-pano]');
  if (pano) {
    var view = $('.pano__view', pano), strip = $('[data-strip]', pano), headingEl = $('[data-heading]', pano);
    var PX = window.matchMedia('(max-width: 640px)').matches ? 11 : 14, W = 360 * PX;
    var heading = 300, anim = 0;
    var cardR = $('[data-card-region]'), cardF = $('[data-card-focus]'), cardN = $('[data-card-note]');
    var CARD = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    var html = '<div class="pano__horizon" style="left:' + (-W) + 'px;width:' + (3 * W) + 'px"></div>';
    for (var k = -1; k <= 1; k++) {
      for (var d = 0; d < 360; d += 5) {
        var x = (d + 360 * k) * PX;
        html += '<span class="pano__tick' + (d % 30 === 0 ? ' is-major' : '') + '" style="left:' + x + 'px"></span>';
        if (d % 45 === 0) html += '<span class="pano__deg is-card" style="left:' + x + 'px">' + CARD[d / 45] + '</span>';
        else if (d % 15 === 0) html += '<span class="pano__deg" style="left:' + x + 'px">' + d + '°</span>';
      }
    }
    strip.innerHTML = html;
    var markers = [];
    PLACES.forEach(function (pl) {
      var g = gc(DXB[0], DXB[1], pl[1], pl[2]), dist = g[0], brg = g[1];
      var h = Math.round(36 + 200 * Math.max(0, 1 - dist / 12500));
      for (var k2 = -1; k2 <= 1; k2++) {
        var mk = document.createElement('div');
        mk.className = 'pano__mk' + (pl[4] === 'origin' ? ' is-origin' : '') + (pl[4] === 'flip' ? ' is-flip' : '');
        mk.style.left = ((brg + 360 * k2) * PX) + 'px';
        mk.style.height = h + 'px';
        mk.setAttribute('data-region', pl[3]);
        mk.innerHTML = '<button type="button" tabindex="' + (k2 === 0 ? 0 : -1) + '"><b>' + pl[0] + '</b><small>' +
          Math.round(dist).toLocaleString('en-US') + ' km · ' + Math.round(brg) + '°</small></button>';
        strip.appendChild(mk);
        markers.push(mk);
      }
    });
    function select(mk) {
      markers.forEach(function (m) { m.classList.remove('is-active'); });
      var name = $('b', mk).textContent;
      markers.forEach(function (m) { if ($('b', m).textContent === name) m.classList.add('is-active'); });
      var r = REGIONS[mk.getAttribute('data-region')];
      cardR.textContent = r[0] + ' · ' + name;
      cardF.textContent = r[1];
      cardN.textContent = r[2];
    }
    markers.forEach(function (mk) {
      var b = $('button', mk);
      b.addEventListener('mouseenter', function () { select(mk); });
      b.addEventListener('focus', function () { select(mk); turnTo(parseFloat(mk.style.left) / PX); });
      b.addEventListener('click', function () { select(mk); });
    });
    function render() {
      heading = ((heading % 360) + 360) % 360;
      strip.style.transform = 'translate3d(' + (view.clientWidth / 2 - heading * PX) + 'px,0,0)';
      headingEl.textContent = Math.round(heading) + '° ' + CARD[Math.round(heading / 45) % 8];
    }
    function turnTo(target) {
      cancelAnimationFrame(anim);
      var from = heading, delta = ((target - from + 540) % 360) - 180;
      if (reduced()) { heading = from + delta; return render(); }
      var t0 = performance.now();
      (function step(now) {
        var t = Math.min(1, (now - t0) / 600), e = 1 - Math.pow(1 - t, 3);
        heading = from + delta * e; render();
        if (t < 1) anim = requestAnimationFrame(step);
      })(t0);
    }
    $$('[data-turn]', pano).forEach(function (b) {
      b.addEventListener('click', function () { turnTo(heading + parseFloat(b.getAttribute('data-turn'))); });
    });
    view.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); heading -= 5; render(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); heading += 5; render(); }
    });
    var dragX = null, moved = 0;
    view.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      cancelAnimationFrame(anim); dragX = e.clientX; moved = 0;
      view.setPointerCapture(e.pointerId); view.classList.add('is-drag');
    });
    view.addEventListener('pointermove', function (e) {
      if (dragX === null) return;
      var dx = e.clientX - dragX; dragX = e.clientX; moved += Math.abs(dx);
      heading -= dx / PX; render();
    });
    function endDrag() { dragX = null; view.classList.remove('is-drag'); }
    view.addEventListener('pointerup', endDrag);
    view.addEventListener('pointercancel', endDrag);
    window.addEventListener('resize', render);
    render();
    select(markers[1]);
  }

  /* ------------------------------------------------------------ Dialogs */
  function openDlg(dlg) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  $$('[data-open]').forEach(function (b) {
    b.addEventListener('click', function () { openDlg($('#dlg-' + b.getAttribute('data-open'))); });
  });
  $$('dialog').forEach(function (dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
    });
  });
  $$('[data-insight]').forEach(function (row) {
    row.addEventListener('click', function () {
      var c = $$('span', row), dlg = $('#dlg-insight');
      $('[data-ins-ref]', dlg).textContent = c[0].textContent + ' · ' + c[3].textContent;
      $('[data-ins-title]', dlg).textContent = c[1].textContent;
      $('[data-ins-desc]', dlg).textContent = c[2].textContent + '.';
      openDlg(dlg);
    });
  });

  /* ------------------------------------------------------------ Photos (see config.js) */
  var photos = (window.HK && window.HK.config && window.HK.config.photos) || {};
  $$('[data-photo]').forEach(function (holder) {
    var src = photos[holder.getAttribute('data-photo')];
    if (!src) return;
    var img = new Image();
    img.alt = holder.getAttribute('data-alt') || '';
    img.loading = 'lazy'; img.decoding = 'async'; img.className = 'photo';
    img.onload = function () { holder.classList.add('has-photo'); };
    img.src = src;
    holder.appendChild(img);
  });

  /* ------------------------------------------------------------ Enquiry form */
  var form = $('#enquiry');
  if (form) {
    var err = $('.form__error', form), done = $('.form__done');
    var validate = function () {
      var bad = [];
      $$('[required]', form).forEach(function (f) {
        var v = f.value.trim();
        var ok = v !== '' && (f.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
        f.closest('.field').classList.toggle('is-invalid', !ok);
        f.setAttribute('aria-invalid', String(!ok));
        if (!ok) bad.push(f);
      });
      return bad;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.website.value) return;
      var bad = validate();
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
      send.then(function () { form.hidden = true; done.hidden = false; done.focus(); measure(); })
        .catch(function () { err.textContent = 'Your enquiry could not be sent. Please try again in a moment.'; err.hidden = false; })
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
