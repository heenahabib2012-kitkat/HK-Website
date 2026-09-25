/* ==========================================================================
   HK Business Consultancy — "The Boardroom"
   Personalisation, agenda builder, meeting-time finder, calculated market
   charts, photo parallax and 3D tilt. Vanilla JS, no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var R = Math.PI / 180;
  var DXB = { name: 'Dubai', tz: 'Asia/Dubai', lat: 25.2, lon: 55.27, work: [1, 2, 3, 4, 5] };
  var WEEK = { mf: [1, 2, 3, 4, 5], st: [0, 1, 2, 3, 4] };
  var DAYNAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Markets used by the meeting finder and the charts (coordinates, time zone, working week)
  var MARKETS = [
    { name: 'Kuwait City', tz: 'Asia/Kuwait', lat: 29.37, lon: 47.98, work: WEEK.st },
    { name: 'Riyadh', tz: 'Asia/Riyadh', lat: 24.71, lon: 46.68, work: WEEK.st },
    { name: 'Cairo', tz: 'Africa/Cairo', lat: 30.04, lon: 31.24, work: WEEK.st },
    { name: 'Istanbul', tz: 'Europe/Istanbul', lat: 41.01, lon: 28.98, work: WEEK.mf },
    { name: 'London', tz: 'Europe/London', lat: 51.51, lon: -0.13, work: WEEK.mf },
    { name: 'Frankfurt', tz: 'Europe/Berlin', lat: 50.11, lon: 8.68, work: WEEK.mf },
    { name: 'Nairobi', tz: 'Africa/Nairobi', lat: -1.29, lon: 36.82, work: WEEK.mf },
    { name: 'Lagos', tz: 'Africa/Lagos', lat: 6.52, lon: 3.38, work: WEEK.mf },
    { name: 'Johannesburg', tz: 'Africa/Johannesburg', lat: -26.2, lon: 28.05, work: WEEK.mf },
    { name: 'Karachi', tz: 'Asia/Karachi', lat: 24.86, lon: 67.0, work: WEEK.mf },
    { name: 'Mumbai', tz: 'Asia/Kolkata', lat: 19.08, lon: 72.88, work: WEEK.mf },
    { name: 'Singapore', tz: 'Asia/Singapore', lat: 1.35, lon: 103.82, work: WEEK.mf },
    { name: 'Hong Kong', tz: 'Asia/Hong_Kong', lat: 22.32, lon: 114.17, work: WEEK.mf },
    { name: 'Tokyo', tz: 'Asia/Tokyo', lat: 35.68, lon: 139.69, work: WEEK.mf },
    { name: 'Sydney', tz: 'Australia/Sydney', lat: -33.87, lon: 151.21, work: WEEK.mf },
    { name: 'New York', tz: 'America/New_York', lat: 40.71, lon: -74.0, work: WEEK.mf },
    { name: 'São Paulo', tz: 'America/Sao_Paulo', lat: -23.55, lon: -46.63, work: WEEK.mf }
  ];

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function reduced() { return root.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function hhmm(m) { m = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  function hours(m) { var h = m / 60; return (Math.round(h * 10) / 10).toString().replace(/\.0$/, ''); }

  /* ------------------------------------------------------------ Time zones */
  function offset(tz, date) {
    var o = {};
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
      .formatToParts(date).forEach(function (p) { o[p.type] = +p.value; });
    return Math.round((Date.UTC(o.year, o.month - 1, o.day, o.hour % 24, o.minute) - Math.floor(date.getTime() / 60000) * 60000) / 60000);
  }
  function zoneName(tz, date) {
    try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'short' }).formatToParts(date).filter(function (p) { return p.type === 'timeZoneName'; })[0].value; } catch (e) { return ''; }
  }
  function gcKm(a, b) {
    var p1 = a.lat * R, p2 = b.lat * R, dl = (b.lon - a.lon) * R;
    var h = Math.pow(Math.sin((p2 - p1) / 2), 2) + Math.cos(p1) * Math.cos(p2) * Math.pow(Math.sin(dl / 2), 2);
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }
  // Office hours of a market (09:00-18:00 local) expressed in Dubai minutes, split at midnight
  function bandInDubai(m, now) {
    var shift = offset(DXB.tz, now) - offset(m.tz, now);
    var s = ((540 + shift) % 1440 + 1440) % 1440, e = s + 540;
    return e <= 1440 ? [[s, e]] : [[s, 1440], [0, e - 1440]];
  }
  function overlapMins(m, now) {
    return bandInDubai(m, now).reduce(function (sum, b) { return sum + Math.max(0, Math.min(b[1], 1080) - Math.max(b[0], 540)); }, 0);
  }
  function sharedDays(m) { return DXB.work.filter(function (d) { return m.work.indexOf(d) > -1; }); }
  function weekLabel(w) { return w === WEEK.st ? 'Sun–Thu' : 'Mon–Fri'; }
  function diffLabel(m, now) {
    var d = offset(m.tz, now) - offset(DXB.tz, now);
    if (!d) return 'Same time';
    var a = Math.abs(d);
    return (d > 0 ? '+' : '−') + Math.floor(a / 60) + (a % 60 ? ':' + String(a % 60).padStart(2, '0') : '') + ' h';
  }

  /* ------------------------------------------------------------ Date and Dubai clock */
  var todayEl = $('[data-today]');
  if (todayEl) todayEl.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: DXB.tz, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  var clock = $('[data-dxb-time]');
  function tick() { var n = new Date(); clock.textContent = hhmm(n.getUTCHours() * 60 + n.getUTCMinutes() + offset(DXB.tz, n)); }
  if (clock) { tick(); setInterval(tick, 20000); }

  /* ------------------------------------------------------------ Personalisation */
  var pForm = $('[data-personal]'), pInput = $('#p-company'), fCompany = $('#f-company');
  function applyCompany(name) {
    var n = (name || '').trim();
    $$('[data-company]').forEach(function (el) { el.textContent = n || 'Your business'; });
    if (pInput && document.activeElement !== pInput) pInput.value = n;
    if (fCompany && n && !fCompany.value) fCompany.value = n;
  }
  applyCompany(store('hk-company') || '');
  if (pForm) pForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = pInput.value.trim().slice(0, 60);
    store('hk-company', n);
    if (fCompany) fCompany.value = n;
    applyCompany(n);
    var cover = $('.pack__cover'); if (cover) { cover.classList.remove('flash'); void cover.offsetWidth; cover.classList.add('flash'); }
  });
  $$('[data-company-edit]').forEach(function (b) {
    b.addEventListener('click', function () {
      closeAgenda();
      $('#cover').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
      setTimeout(function () { pInput.focus(); }, reduced() ? 0 : 500);
    });
  });

  /* ------------------------------------------------------------ Agenda sidebar: scrollspy + mobile drawer */
  var agenda = $('#agenda'), toggle = $('[data-agenda-toggle]');
  var links = $$('.agenda__list a'), ids = links.map(function (a) { return a.getAttribute('href').slice(1); });
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var i = ids.indexOf(en.target.id);
      links.forEach(function (a, k) { a.classList.toggle('is-here', k === i); a.classList.toggle('is-done', k < i); if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  ids.forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  function closeAgenda() { if (!agenda) return; agenda.classList.remove('is-open'); if (toggle) toggle.setAttribute('aria-expanded', 'false'); }
  if (toggle) toggle.addEventListener('click', function () {
    var open = !agenda.classList.contains('is-open');
    agenda.classList.toggle('is-open', open); toggle.setAttribute('aria-expanded', String(open));
  });
  links.concat($$('[data-close-agenda]')).forEach(function (a) { a.addEventListener('click', closeAgenda); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAgenda(); });

  /* ------------------------------------------------------------ Agenda builder */
  var startSel = $('[data-agenda-start]'), list = $('[data-agenda-list]'), total = $('[data-agenda-total]');
  for (var t = 9 * 60; t <= 17 * 60; t += 30) {
    var o = document.createElement('option'); o.value = t; o.textContent = hhmm(t);
    if (t === 11 * 60) o.selected = true;
    startSel.appendChild(o);
  }
  var boxes = $$('.scope input[type="checkbox"]');
  function agendaItems() {
    var items = [{ t: 'Introductions and objectives', m: 10 }];
    boxes.forEach(function (b) { if (b.checked) items.push({ t: b.value, m: +b.getAttribute('data-mins') }); });
    items.push({ t: 'Next steps', m: 10 });
    return items;
  }
  function renderAgenda() {
    var picked = boxes.filter(function (b) { return b.checked; }).length;
    var items = agendaItems(), at = +startSel.value, sum = 0, html = '';
    items.forEach(function (it) { html += '<li><time>' + hhmm(at) + '</time><span>' + it.t + '</span><span class="m">' + it.m + ' min</span></li>'; at += it.m; sum += it.m; });
    if (!picked) html += '<li class="is-empty">Select services to add them to the agenda.</li>';
    list.innerHTML = html;
    total.textContent = sum + ' min · ends ' + hhmm(+startSel.value + sum) + ' Dubai';
    store('hk-agenda', JSON.stringify(boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; })));
  }
  try { var saved = JSON.parse(store('hk-agenda') || '[]'); boxes.forEach(function (b) { b.checked = saved.indexOf(b.value) > -1; }); } catch (e) {}
  boxes.forEach(function (b) { b.addEventListener('change', renderAgenda); });
  startSel.addEventListener('change', renderAgenda);
  renderAgenda();

  function toEnquiry(text, service) {
    var msg = $('#f-message');
    msg.value = (msg.value ? msg.value.replace(/\s+$/, '') + '\n\n' : '') + text;
    if (service) $('#f-service').value = service;
    var n = (store('hk-company') || '').trim(); if (n && !fCompany.value) fCompany.value = n;
    $('#next').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    var box = $('.enquiry'); box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash');
  }
  $('[data-agenda-use]').addEventListener('click', function () {
    var picked = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
    var at = +startSel.value, lines = agendaItems().map(function (it) { var l = hhmm(at) + '  ' + it.t + ' (' + it.m + ' min)'; at += it.m; return l; });
    toEnquiry('Proposed agenda (Dubai time):\n' + lines.join('\n'), picked.length === 1 ? picked[0] : picked.length > 1 ? 'Several services' : '');
  });

  /* ------------------------------------------------------------ Meeting-time finder */
  var citySel = $('[data-city]'), tl = $('[data-timeline]');
  var verdict = $('[data-verdict]'), detail = $('[data-verdict-detail]'), cityName = $('[data-city-name]');
  var localTz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || '';
  var pick = MARKETS.filter(function (m) { return m.tz === localTz; })[0] || MARKETS[4];
  MARKETS.forEach(function (m) {
    var o = document.createElement('option'); o.value = m.name; o.textContent = m.name; if (m === pick) o.selected = true; citySel.appendChild(o);
  });
  var proposal = '';
  function renderFinder() {
    var m = MARKETS.filter(function (x) { return x.name === citySel.value; })[0], now = new Date();
    var dOff = offset(DXB.tz, now), mOff = offset(m.tz, now), shift = mOff - dOff; // city minus Dubai
    cityName.textContent = m.name;
    var pct = function (v) { return (v / 1440 * 100) + '%'; };
    var html = '<div class="tl__row"><span class="tl__bar tl__bar--a" style="left:' + pct(540) + ';width:' + pct(540) + '"></span></div><div class="tl__row">';
    var band = bandInDubai(m, now);
    band.forEach(function (b) { html += '<span class="tl__bar tl__bar--b" style="left:' + pct(b[0]) + ';width:' + pct(b[1] - b[0]) + '"></span>'; });
    html += '</div>';
    var ov = [];
    band.forEach(function (b) { var s = Math.max(b[0], 540), e = Math.min(b[1], 1080); if (e > s) ov.push([s, e]); });
    ov.forEach(function (o, i) { html += '<span class="tl__overlap" style="left:' + pct(o[0]) + ';width:' + pct(o[1] - o[0]) + ';top:6px;bottom:6px">' + (i === 0 ? '<span>' + hours(o[1] - o[0]) + ' h shared</span>' : '') + '</span>'; });
    var nowD = ((now.getUTCHours() * 60 + now.getUTCMinutes() + dOff) % 1440 + 1440) % 1440;
    html += '<span class="tl__now" style="left:' + pct(nowD) + '" aria-hidden="true"></span>';
    tl.innerHTML = html;
    tl.setAttribute('role', 'img');
    var days = sharedDays(m).map(function (d) { return DAYNAMES[d]; });
    var zn = zoneName(m.tz, now);
    if (ov.length) {
      var o = ov[0];
      var best = [o[0], Math.min(o[1], o[0] + 60)];
      verdict.innerHTML = 'Meet between <b>' + hhmm(o[0]) + '–' + hhmm(o[1]) + '</b> Dubai time, which is <b>' + hhmm(o[0] + shift) + '–' + hhmm(o[1] + shift) + '</b> in ' + m.name + '.';
      var dl = diffLabel(m, now);
      detail.textContent = hours(o[1] - o[0]) + ' shared office hours on each shared working day (' + days[0] + ' to ' + days[days.length - 1] + ', ' + days.length + ' days). ' +
        (dl === 'Same time' ? m.name + ' is on Dubai time' : m.name + ' is ' + dl + ' from Dubai') + (zn ? ' (' + zn + ' today)' : '') + '.';
      proposal = 'Preferred meeting time: ' + hhmm(best[0]) + '–' + hhmm(best[1]) + ' Dubai time (' + hhmm(best[0] + shift) + '–' + hhmm(best[1] + shift) + ' ' + m.name + ').';
      tl.setAttribute('aria-label', 'Dubai office hours 09:00 to 18:00 and ' + m.name + ' office hours overlap from ' + hhmm(o[0]) + ' to ' + hhmm(o[1]) + ' Dubai time');
    } else {
      verdict.innerHTML = 'No shared office hours. The closest options are <b>09:00</b> Dubai (<b>' + hhmm(540 + shift) + '</b> in ' + m.name + ') or <b>18:00</b> Dubai (<b>' + hhmm(1080 + shift) + '</b> in ' + m.name + ').';
      detail.textContent = m.name + ' is ' + diffLabel(m, now) + ' from Dubai' + (zn ? ' (' + zn + ' today)' : '') + '. We can arrange an early or late call to suit you.';
      proposal = 'Preferred meeting time: early or late call across time zones (' + m.name + ', ' + diffLabel(m, now) + ' from Dubai).';
      tl.setAttribute('aria-label', 'Dubai and ' + m.name + ' office hours do not overlap');
    }
    renderCharts(m);
  }
  citySel.addEventListener('change', renderFinder);
  $('[data-use-time]').addEventListener('click', function () { toEnquiry(proposal); var c = $('#f-country'); if (!c.value) c.value = citySel.value; });

  /* ------------------------------------------------------------ Calculated market charts */
  var tip = $('[data-tip]');
  function ticks(max, step) { var a = []; for (var v = 0; v <= max; v += step) a.push(v); return a; }
  function barChart(el, rows, opts) {
    var html = '<div class="bars__grid" aria-hidden="true">';
    ticks(opts.max, opts.step).forEach(function (v) { html += '<i style="left:' + (v / opts.max * 100) + '%"></i><b style="left:' + (v / opts.max * 100) + '%">' + opts.fmt(v) + '</b>'; });
    html += '</div>';
    rows.forEach(function (r) {
      var w = Math.max(0, r.v / opts.max * 100);
      html += '<div class="bar' + (r.pick ? ' is-pick' : '') + '" tabindex="0" data-tipx="' + r.tip.replace(/"/g, '&quot;') + '"><span class="bar__label">' + r.name + '</span><span class="bar__track"><span class="bar__fill" style="width:' + w + '%"></span><span class="bar__val" style="left:' + w + '%">' + opts.fmt(r.v, true) + '</span></span></div>';
    });
    el.innerHTML = html;
  }
  function renderCharts(pickM) {
    var now = new Date();
    var data = MARKETS.map(function (m) {
      var days = sharedDays(m).length, ov = overlapMins(m, now);
      return { m: m, week: ov * days / 60, day: ov / 60, days: days, km: gcKm(DXB, m), diff: diffLabel(m, now) };
    });
    var byWeek = data.slice().sort(function (a, b) { return b.week - a.week || a.km - b.km; });
    barChart($('[data-chart="overlap"]'), byWeek.map(function (d) {
      return { name: d.m.name, v: d.week, pick: d.m === pickM, tip: '<b>' + d.m.name + '</b><br>' + hours(d.week * 60) + ' h per week (' + hours(d.day * 60) + ' h × ' + d.days + ' shared days)<br>' + d.diff + ' vs Dubai' };
    }), { max: 45, step: 10, fmt: function (v, tip) { return tip ? hours(v * 60) + ' h' : v; } });
    var byKm = data.slice().sort(function (a, b) { return a.km - b.km; });
    barChart($('[data-chart="distance"]'), byKm.map(function (d) {
      return { name: d.m.name, v: d.km, pick: d.m === pickM, tip: '<b>' + d.m.name + '</b><br>' + Math.round(d.km).toLocaleString('en-US') + ' km from Dubai (great circle)' };
    }), { max: 14000, step: 4000, fmt: function (v, tip) { return tip ? Math.round(v).toLocaleString('en-US') : (v ? (v / 1000) + 'k' : '0'); } });
    var tb = $('[data-market-table] tbody');
    tb.innerHTML = byWeek.map(function (d) {
      return '<tr><th scope="row">' + d.m.name + '</th><td>' + d.diff + '</td><td>' + weekLabel(d.m.work) + '</td><td>' + hours(d.week * 60) + '</td><td>' + Math.round(d.km).toLocaleString('en-US') + '</td></tr>';
    }).join('');
  }
  document.addEventListener('pointerover', function (e) {
    var b = e.target.closest('.bar'); if (!b) return;
    tip.innerHTML = b.getAttribute('data-tipx'); tip.hidden = false;
  });
  document.addEventListener('pointermove', function (e) {
    if (tip.hidden) return;
    if (!e.target.closest('.bar')) { tip.hidden = true; return; }
    var x = e.clientX + 16, y = e.clientY + 14;
    if (x + 250 > window.innerWidth) x = e.clientX - 256;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  });
  document.addEventListener('focusin', function (e) {
    var b = e.target.closest && e.target.closest('.bar'); if (!b) return;
    var r = b.getBoundingClientRect();
    tip.innerHTML = b.getAttribute('data-tipx'); tip.hidden = false;
    tip.style.left = Math.min(r.left + 130, window.innerWidth - 260) + 'px'; tip.style.top = (r.bottom + 6) + 'px';
  });
  document.addEventListener('focusout', function () { tip.hidden = true; });
  window.addEventListener('scroll', function () { tip.hidden = true; }, { passive: true });
  renderFinder();
  setInterval(renderFinder, 60000);

  /* ------------------------------------------------------------ Photos over drawn fallbacks */
  var photos = (window.HK && window.HK.config && window.HK.config.boardroomPhotos) || {};
  var anyUnsplash = false;
  $$('[data-photo-key]').forEach(function (h) {
    var src = photos[h.getAttribute('data-photo-key')];
    if (!src) return;
    var img = new Image();
    img.className = 'photo__img'; img.alt = h.getAttribute('data-alt') || ''; img.decoding = 'async';
    if (!h.closest('.cover')) img.loading = 'lazy';
    img.onload = function () {
      h.classList.add('is-loaded');
      if (/unsplash\.com/.test(src) && !anyUnsplash) { anyUnsplash = true; var c = $('[data-photo-credit]'); if (c) c.hidden = false; }
    };
    img.onerror = function () { img.remove(); };
    img.src = src;
    h.insertBefore(img, h.querySelector('.photo__tint'));
  });

  /* ------------------------------------------------------------ 3D tilt with photo parallax */
  $$('[data-tilt]').forEach(function (c) {
    var target = c.getAttribute('data-tilt') === 'pack' ? $('.pack__stack', c) : c.classList.contains('memo__portrait') ? $('.photo', c) : c;
    var base = c.getAttribute('data-tilt') === 'pack' ? { x: 10, y: -18 } : { x: 0, y: 0 };
    var span = c.getAttribute('data-tilt') === 'pack' ? 22 : 10;
    c.addEventListener('pointermove', function (e) {
      if (reduced() || e.pointerType !== 'mouse') return;
      var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      target.style.setProperty('--ry', (base.y + px * span).toFixed(1) + 'deg');
      target.style.setProperty('--rx', (base.x - py * span * .8).toFixed(1) + 'deg');
      $$('.photo__img', c).forEach(function (img) { img.style.setProperty('--px', (-px * 14).toFixed(1) + 'px'); img.style.setProperty('--py', (-py * 14).toFixed(1) + 'px'); });
    });
    c.addEventListener('pointerleave', function () {
      target.style.removeProperty('--rx'); target.style.removeProperty('--ry');
      $$('.photo__img', c).forEach(function (img) { img.style.removeProperty('--px'); img.style.removeProperty('--py'); });
    });
  });

  /* ------------------------------------------------------------ Dialogs */
  function openDlg(d) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  $$('[data-open]').forEach(function (b) { b.addEventListener('click', function () { openDlg($('#dlg-' + b.getAttribute('data-open'))); }); });
  $$('dialog').forEach(function (d) { d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-close]')) d.close(); }); });
  $$('[data-insight]').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = $('#dlg-insight');
      $('[data-ins-ref]', d).textContent = 'Appendix ' + $('.paper__ref', b).textContent;
      $('[data-ins-title]', d).textContent = $('b', b).textContent;
      $('[data-ins-desc]', d).textContent = $('.paper__sub', b).textContent + '.';
      openDlg(d);
    });
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
      send.then(function () { form.hidden = true; done.hidden = false; done.focus(); })
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
      store('hk-reduce-motion', on ? '1' : '0');
    });
  }
  var yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();
})();
