/* ==========================================================================
   HK Business Consultancy — "Lattice"
   The mashrabiya screen, the sun over Dubai, the khatam of services and the
   rosette of directions. Vanilla JS, no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var NS = 'http://www.w3.org/2000/svg';
  var R = Math.PI / 180;
  var DXB = { lat: 25.2, lon: 55.27 };
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function reduced() { return root.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function css(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function dataUri(svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }

  /* ------------------------------------------------------------ Geometry */
  // Star-and-cross lattice on a 100 x 100 tile: an eight-pointed star made of
  // a square and a diamond, joined to its neighbours at edges and corners.
  var KHATAM_TILE = 'M24 24H76V76H24Z M50 13L87 50L50 87L13 50Z M50 13V0 M50 87V100 M13 50H0 M87 50H100 M24 24L0 0 M76 24L100 0 M76 76L100 100 M24 76L0 100';
  var TILES = [
    { w: 100, h: 100, d: KHATAM_TILE },
    { w: 60, h: 104, d: 'M0 0L60 104 M60 0L0 104 M0 52H60 M30 0V104' },
    { w: 60, h: 60, d: 'M30 0L60 30L30 60L0 30Z M15 15L45 45 M45 15L15 45 M0 0L60 60 M60 0L0 60' }
  ];
  function tileSvg(t, stroke, sw, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + (size * t.h / t.w) + '" viewBox="0 0 ' + t.w + ' ' + t.h + '"><path d="' + t.d + '" fill="none" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linecap="square"/></svg>';
  }
  // Pointed arch in a 100 x 150 box
  // Two-centred (equilateral) pointed arch in a 100 x 150 box, and an inset line
  var ARCH = 'M0 150V86.5A100 100 0 0 1 50 0A100 100 0 0 1 100 86.5V150Z';
  var ARCH_IN = 'M6 150V86.5A94 94 0 0 1 50 6.9A94 94 0 0 1 94 86.5V150';

  root.style.setProperty('--arch', dataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150" preserveAspectRatio="none"><path d="' + ARCH + '"/></svg>'));
  var lapisDeep = css('--lapis-deep') || '#102079', sand = css('--sand') || '#e7dac2';
  var rule = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="14" viewBox="0 0 28 14"><path d="M14 1l3 4h4l-1 4 3 3-4 1-1 4-4-3-4 3-1-4-4-1 3-3-1-4h4z" transform="scale(.8) translate(3.5 -.5)" fill="none" stroke="' + lapisDeep + '"/><path d="M0 7h6M22 7h6" stroke="' + lapisDeep + '"/></svg>';
  root.style.setProperty('--rule', dataUri(rule));
  root.style.setProperty('--band', dataUri(tileSvg(TILES[0], 'rgba(243,236,221,.55)', 6, 56)));
  root.style.setProperty('--floor', dataUri(tileSvg(TILES[0], 'rgba(27,52,176,.35)', 3, 120)));

  // Arch outlines drawn on top of arched elements
  function frame(host) {
    var s = el('svg', { class: 'arch-frame', viewBox: '0 0 100 150', preserveAspectRatio: 'none', 'aria-hidden': 'true' }, host);
    el('path', { d: ARCH.replace('Z', '') }, s);
    el('path', { d: ARCH_IN }, s);
  }

  /* ------------------------------------------------------------ Hero window + cast light */
  var screen = $('[data-screen]'), sky = $('[data-sky]'), cast = $('[data-cast]'), cap = $('[data-suncap]');
  var barEls = [];
  function latticeRect(svg, id, stroke, w) {
    var defs = el('defs', {}, svg);
    var p = el('pattern', { id: id, width: w, height: w, patternUnits: 'userSpaceOnUse' }, defs);
    var path = el('path', { d: KHATAM_TILE, fill: 'none', stroke: stroke, 'stroke-width': 7, 'stroke-linecap': 'square', transform: 'scale(' + (w / 100) + ')' }, p);
    barEls.push(path);
    return el('rect', { width: '100%', height: '100%', fill: 'url(#' + id + ')' }, svg);
  }
  if (screen) {
    screen.setAttribute('viewBox', '0 0 200 300');
    screen.setAttribute('preserveAspectRatio', 'none');
    latticeRect(screen, 'lat-screen', lapisDeep, 40);
    frame($('.window__arch'));
  }
  var castSvg = null;
  if (cast) {
    castSvg = el('svg', { viewBox: '0 0 200 300', preserveAspectRatio: 'none' }, cast);
    var castDefs = el('defs', {}, castSvg);
    var g = el('linearGradient', { id: 'cast-g', x1: 1, y1: 1, x2: 0, y2: 0 }, castDefs);
    el('stop', { offset: 0, 'stop-color': '#fff3d6', 'stop-opacity': '.95' }, g);
    el('stop', { offset: 1, 'stop-color': '#fff3d6', 'stop-opacity': '.25' }, g);
    el('path', { d: ARCH, transform: 'scale(2)', fill: 'url(#cast-g)' }, castSvg);
    var mask = el('clipPath', { id: 'cast-clip' }, castDefs);
    el('path', { d: ARCH, transform: 'scale(2)' }, mask);
    var bars = latticeRect(castSvg, 'lat-cast', sand, 40);
    bars.setAttribute('clip-path', 'url(#cast-clip)');
  }

  var photos = (window.HK && window.HK.config && window.HK.config.photos) || {};
  var hero3d = null, glc = $('[data-gl]');
  if (glc && window.HKLattice3D) {
    $('.window').classList.add('is-3d');
    try { hero3d = window.HKLattice3D(glc, { mode: 'sun', photo: photos.heroView, pointerHost: $('.hero') }); } catch (e) { hero3d = null; }
    if (!hero3d) $('.window').classList.remove('is-3d');
  }

  // Solar position (after the NOAA / suncalc formulation)
  function sun(date, lat, lon) {
    var d = (date.getTime() - 946728000000) / 86400000;
    var M = R * (357.5291 + 0.98560028 * d);
    var C = R * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    var L = M + C + R * 102.9372 + Math.PI, e = R * 23.4397;
    var dec = Math.asin(Math.sin(e) * Math.sin(L));
    var ra = Math.atan2(Math.sin(L) * Math.cos(e), Math.cos(L));
    var H = R * (280.16 + 360.9856235 * d) + R * lon - ra, phi = R * lat;
    var alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
    var az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
    return { alt: alt / R, az: (az / R + 180 + 360) % 360 };
  }
  function dubaiTime(date) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  }
  var lanternGlow = null;
  function light() {
    var now = new Date(), s = sun(now, DXB.lat, DXB.lon), t = dubaiTime(now);
    var state = s.alt > 8 ? 'day' : s.alt > -6 ? 'dusk' : 'night';
    root.setAttribute('data-light', state);
    if (hero3d) hero3d.setLight(s);
    if (sky) {
      if (state === 'day') sky.style.background = 'linear-gradient(180deg, #86aee3 0%, #b9d0ea 55%, #f4dcaa 100%)';
      else if (state === 'dusk') sky.style.background = 'linear-gradient(180deg, #2f3f98 0%, #b0628a 55%, #f4a95a 100%)';
      else sky.style.background = 'radial-gradient(circle at 50% 78%, rgba(242,191,94,.95) 0, rgba(242,191,94,.35) 22%, rgba(10,20,80,0) 48%), radial-gradient(1px 1px at 20% 20%, #fff, transparent), radial-gradient(1px 1px at 70% 14%, #fff, transparent), radial-gradient(1px 1px at 40% 34%, #fff, transparent), radial-gradient(1.5px 1.5px at 82% 40%, #fff, transparent), linear-gradient(180deg, #060d38, #14237a)';
    }
    if (cast) {
      if (state === 'night') cast.style.opacity = '0';
      else {
        var elev = Math.max(4, s.alt);
        var len = Math.max(.6, Math.min(1.4, 1 / Math.tan(elev * R))) * .8;
        var skew = Math.max(-38, Math.min(38, (s.az - 180) * .32));
        cast.style.opacity = state === 'dusk' ? '.4' : '.6';
        cast.style.transform = 'skewX(' + skew.toFixed(1) + 'deg) scaleY(' + len.toFixed(2) + ')';
      }
    }
    if (cap) {
      cap.textContent = state === 'night'
        ? 'Dubai, ' + t + '. The sun has set; the lamps are lit.'
        : 'Dubai, ' + t + '. Sun ' + Math.round(s.alt) + '° above the horizon at a bearing of ' + Math.round(s.az) + '°.';
    }
  }
  light();
  setInterval(light, 60000);

  // The screen opens as you scroll: bars thin from 7 to 2.5 units.
  var ticking = false;
  function openScreen() {
    ticking = false;
    var p = Math.min(1, window.scrollY / 700);
    var w = (7 - p * 4.5).toFixed(2);
    barEls.forEach(function (b) { b.setAttribute('stroke-width', w); });
    if (hero3d) hero3d.setOpen(p);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(openScreen); } }, { passive: true });

  /* ------------------------------------------------------------ Arched elements */
  $$('.gate__arch, .arch-photo').forEach(function (a) {
    var f = document.createElement('div'); f.className = 'arch-fill'; a.insertBefore(f, a.firstChild); frame(a);
  });
  var portrait = $('.arch-portrait');
  if (portrait) {
    var pf = document.createElement('div'); pf.className = 'arch-fill'; portrait.insertBefore(pf, portrait.firstChild); frame(portrait);
  }

  /* ------------------------------------------------------------ Services: khatam */
  var star = $('[data-khatam]'), items = $$('[data-svcs] li');
  var names = items.map(function (li) { return li.textContent.trim(); });
  var petals = [], listBtns = [];
  function P(r, deg) { return [200 + r * Math.cos(deg * R), 200 + r * Math.sin(deg * R)]; }
  function pt(p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
  function selectSvc(i, focusPetal) {
    var li = items[i];
    $('[data-svc-n]').textContent = 'Point ' + (i + 1) + ' of 8';
    $('[data-svc-title]').textContent = names[i];
    $('[data-svc-desc]').textContent = li.getAttribute('data-desc');
    $('[data-svc-pts]').innerHTML = li.getAttribute('data-points').split('|').map(function (x) { return '<li>' + x + '</li>'; }).join('');
    $('[data-svc-cta]').setAttribute('data-service', names[i]);
    petals.forEach(function (p, k) { p.classList.toggle('is-on', k === i); p.setAttribute('aria-pressed', String(k === i)); });
    listBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
    if (focusPetal) petals[i].focus();
  }
  if (star) {
    el('circle', { class: 'khatam__ring', cx: 200, cy: 200, r: 198 }, star);
    el('circle', { class: 'khatam__ring', cx: 200, cy: 200, r: 150 }, star);
    var r0 = 62, r1 = 104, Rt = 190;
    items.forEach(function (li, i) {
      var a = -90 + i * 45;
      var gp = el('g', { class: 'pt', tabindex: 0, role: 'button', 'aria-label': (i + 1) + ': ' + names[i] }, star);
      el('path', { d: 'M' + pt(P(r0, a - 22.5)) + 'L' + pt(P(r1, a - 22.5)) + 'L' + pt(P(Rt, a)) + 'L' + pt(P(r1, a + 22.5)) + 'L' + pt(P(r0, a + 22.5)) + 'Z' }, gp);
      var c = P((r1 + Rt) / 2 - 8, a);
      var tx = el('text', { x: c[0].toFixed(1), y: (c[1] + 8).toFixed(1), 'text-anchor': 'middle' }, gp);
      tx.textContent = i + 1;
      gp.addEventListener('click', function () { selectSvc(i); });
      gp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSvc(i); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); selectSvc((i + 1) % 8, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); selectSvc((i + 7) % 8, true); }
      });
      petals.push(gp);
      // turn list items into buttons
      var b = document.createElement('button');
      b.type = 'button'; b.innerHTML = '<b>' + (i + 1) + '</b>' + li.innerHTML;
      li.textContent = ''; li.appendChild(b);
      b.addEventListener('click', function () { selectSvc(i); });
      listBtns.push(b);
    });
    var oct = '';
    for (var k = 0; k < 8; k++) oct += (k ? 'L' : 'M') + pt(P(r0, -90 - 22.5 + k * 45));
    el('path', { class: 'khatam__core', d: oct + 'Z' }, star);
    var ct = el('text', { class: 'khatam__core-text', x: 200, y: 205, 'text-anchor': 'middle' }, star);
    ct.textContent = 'HK';
    selectSvc(0);

    // Give the star real thickness: stacked copies behind it, tilted in 3D
    var s3 = $('[data-star3d]');
    for (var ly = 1; ly <= 12; ly++) {
      var cl = star.cloneNode(true);
      cl.removeAttribute('data-khatam'); cl.removeAttribute('role'); cl.removeAttribute('aria-label');
      cl.setAttribute('aria-hidden', 'true');
      $$('[tabindex]', cl).forEach(function (n) { n.removeAttribute('tabindex'); n.removeAttribute('role'); n.removeAttribute('aria-label'); });
      cl.setAttribute('class', 'star3d__layer');
      cl.style.transform = 'translateZ(' + (-ly * 2.4) + 'px)';
      s3.insertBefore(cl, star);
    }
    var host = $('[data-tilt-host]');
    host.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      s3.style.setProperty('--sy', (-10 + ((e.clientX - r.left) / r.width - .5) * 40).toFixed(1) + 'deg');
      s3.style.setProperty('--sx', (12 + ((e.clientY - r.top) / r.height - .5) * -32).toFixed(1) + 'deg');
    });
    host.addEventListener('pointerleave', function () { s3.style.removeProperty('--sx'); s3.style.removeProperty('--sy'); });
  }
  $$('[data-svc-cta]').forEach(function (a) {
    a.addEventListener('click', function () { $('#f-service').value = a.getAttribute('data-service'); });
  });

  /* ------------------------------------------------------------ Rosette: every direction from Dubai */
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
    ['Kuwait City', 29.37, 47.98, 'middleeast', 1], ['Riyadh', 24.71, 46.68, 'middleeast'], ['Cairo', 30.04, 31.24, 'africa'],
    ['Istanbul', 41.01, 28.98, 'europe'], ['London', 51.51, -0.13, 'europe'], ['Moscow', 55.76, 37.62, 'europe'],
    ['New York', 40.71, -74.0, 'namerica'], ['São Paulo', -23.55, -46.63, 'samerica'], ['Lagos', 6.52, 3.38, 'africa'],
    ['Nairobi', -1.29, 36.82, 'africa'], ['Johannesburg', -26.2, 28.05, 'africa'], ['Karachi', 24.86, 67.0, 'india'],
    ['Mumbai', 19.08, 72.88, 'india'], ['Delhi', 28.61, 77.21, 'india'], ['Almaty', 43.24, 76.95, 'centralasia'],
    ['Singapore', 1.35, 103.82, 'asia'], ['Hong Kong', 22.32, 114.17, 'asia'], ['Tokyo', 35.68, 139.69, 'asia'],
    ['Sydney', -33.87, 151.21, 'oceania']
  ];
  function gc(lat1, lon1, lat2, lon2) {
    var p1 = lat1 * R, p2 = lat2 * R, dl = (lon2 - lon1) * R;
    var h = Math.pow(Math.sin((p2 - p1) / 2), 2) + Math.cos(p1) * Math.cos(p2) * Math.pow(Math.sin(dl / 2), 2);
    return [2 * 6371 * Math.asin(Math.sqrt(h)), (Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) / R + 360) % 360];
  }
  var ros = $('[data-rosette]'), rcard = $('[data-rosette-card]');
  if (ros) {
    ros.setAttribute('viewBox', '-300 -270 600 540');
    var rOf = function (km) { return 44 + 184 * Math.sqrt(km / 12500); };
    // 16-point geometric rosette in the background
    var d = '';
    for (var i = 0; i < 16; i++) {
      var a1 = i * 22.5 * R, a2 = (i * 22.5 + 11.25) * R;
      d += (i ? 'L' : 'M') + (244 * Math.sin(a1)).toFixed(1) + ' ' + (-244 * Math.cos(a1)).toFixed(1) + 'L' + (206 * Math.sin(a2)).toFixed(1) + ' ' + (-206 * Math.cos(a2)).toFixed(1);
    }
    el('path', { class: 'r-geo', d: d + 'Z' }, ros);
    for (var j = 0; j < 8; j++) {
      var aa = j * 22.5 * R;
      el('line', { class: 'r-geo', x1: (-244 * Math.sin(aa)).toFixed(1), y1: (244 * Math.cos(aa)).toFixed(1), x2: (244 * Math.sin(aa)).toFixed(1), y2: (-244 * Math.cos(aa)).toFixed(1) }, ros);
    }
    [1000, 5000, 10000].forEach(function (km) {
      var r = rOf(km);
      el('circle', { class: 'r-ring', r: r.toFixed(1) }, ros);
      var t = el('text', { class: 'r-ringlabel', x: 4, y: (-r - 4).toFixed(1) }, ros);
      t.textContent = km.toLocaleString('en-US') + ' km';
    });
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(function (c) {
      var t = el('text', { class: 'r-card', x: (258 * Math.sin(c[1] * R)).toFixed(1), y: (-258 * Math.cos(c[1] * R) + 5).toFixed(1), 'text-anchor': 'middle' }, ros);
      t.textContent = c[0];
    });
    var cities = [];
    PLACES.forEach(function (pl) {
      var g2 = gc(DXB.lat, DXB.lon, pl[1], pl[2]), km = g2[0], brg = g2[1], r = rOf(km);
      var x = r * Math.sin(brg * R), y = -r * Math.cos(brg * R), right = x >= 0;
      var grp = el('g', { class: 'r-city' + (pl[4] ? ' is-origin' : ''), tabindex: 0, role: 'button', 'aria-label': pl[0] + ', ' + Math.round(km) + ' kilometres at ' + Math.round(brg) + ' degrees' }, ros);
      el('line', { x1: 0, y1: 0, x2: x.toFixed(1), y2: y.toFixed(1) }, grp);
      el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 4 }, grp);
      // Kuwait City sits close to Cairo, so its label goes above the dot
      var above = !!pl[4];
      var lx = above ? x : x + (right ? 8 : -8), ly = above ? y - 22 : y - 1;
      var anchor = above ? 'middle' : right ? 'start' : 'end';
      var t1 = el('text', { x: lx.toFixed(1), y: ly.toFixed(1), 'text-anchor': anchor }, grp);
      t1.textContent = pl[0];
      var t2 = el('text', { class: 'r-km', x: lx.toFixed(1), y: (ly + 12).toFixed(1), 'text-anchor': anchor }, grp);
      t2.textContent = Math.round(km).toLocaleString('en-US') + ' km · ' + Math.round(brg) + '°';
      function pick() {
        cities.forEach(function (c) { c.classList.remove('is-on'); });
        grp.classList.add('is-on');
        var rg = REGIONS[pl[3]];
        rcard.textContent = pl[0] + ', ' + Math.round(km).toLocaleString('en-US') + ' km at ' + Math.round(brg) + '°. ' + rg[0] + ': ' + rg[1] + '. ' + rg[2];
      }
      grp.addEventListener('mouseenter', pick);
      grp.addEventListener('focus', pick);
      grp.addEventListener('click', pick);
      cities.push(grp);
    });
    el('circle', { class: 'r-hub', r: 9 }, ros);
    var ht = el('text', { class: 'r-hubtext', x: 14, y: 22 }, ros);
    ht.textContent = 'Dubai';
    cities[0].dispatchEvent(new Event('click'));
  }

  /* ------------------------------------------------------------ Insight tiles */
  $$('[data-tile]').forEach(function (b) {
    var t = TILES[+b.getAttribute('data-tile')];
    $('.ins__tile', b).style.backgroundImage = dataUri(tileSvg(t, 'rgba(241,232,216,.8)', 4, 56));
  });

  /* ------------------------------------------------------------ Lantern */
  var lan = $('[data-lantern]');
  if (lan) {
    var ls = el('svg', { viewBox: '0 0 400 400' }, lan);
    var ld = el('defs', {}, ls);
    var rg = el('radialGradient', { id: 'lan-g' }, ld);
    el('stop', { offset: 0, 'stop-color': '#f7d27f', 'stop-opacity': '.95' }, rg);
    el('stop', { offset: '.45', 'stop-color': '#f2bf5e', 'stop-opacity': '.35' }, rg);
    el('stop', { offset: 1, 'stop-color': '#f2bf5e', 'stop-opacity': '0' }, rg);
    el('circle', { cx: 200, cy: 200, r: 200, fill: 'url(#lan-g)' }, ls);
    var lanGl = $('[data-gl-lantern]'), lan3d = null;
    if (lanGl && window.HKLattice3D) {
      try { lan3d = window.HKLattice3D(lanGl, { mode: 'lantern', bar: '#1a2a8c', frame: '#0c1760', pointerHost: $('.lantern') }); } catch (e) { lan3d = null; }
    }
    if (lan3d) { lan.classList.add('is-3d'); lan.insertBefore(ls, lanGl); }
    else { if (lanGl) lanGl.remove(); buildLanternSvg(); }
  }
  function buildLanternSvg() {
    var ls = $('[data-lantern] svg'), ld = $('defs', ls);
    var lp = el('pattern', { id: 'lan-p', width: 32, height: 32, patternUnits: 'userSpaceOnUse' }, ld);
    el('path', { d: KHATAM_TILE, fill: 'none', stroke: '#0a1450', 'stroke-width': 7, transform: 'scale(.32)' }, lp);
    var lc = el('clipPath', { id: 'lan-c' }, ld);
    el('path', { d: ARCH, transform: 'translate(120 80) scale(1.6)' }, lc);
    el('rect', { x: 120, y: 80, width: 160, height: 240, fill: 'url(#lan-p)', 'clip-path': 'url(#lan-c)' }, ls);
    el('path', { d: ARCH, transform: 'translate(120 80) scale(1.6)', fill: 'none', stroke: '#f2bf5e', 'stroke-width': 1.2, opacity: '.7' }, ls);
  }

  /* ------------------------------------------------------------ Journey: walk through the arches */
  var walk = $('.walk'), world = $('[data-walk]');
  if (walk && world) {
    var GAP = 1000, gates = $$('.gate, .gate__leg', walk);
    gates.forEach(function (g) { g._i = parseFloat(g.style.getPropertyValue('--i')) || 0; });
    var flat = function () { return reduced() || window.innerWidth < 900; };
    var wtick = false;
    var stepWalk = function () {
      wtick = false;
      walk.classList.toggle('walk--flat', flat());
      if (flat()) { world.style.transform = ''; gates.forEach(function (g) { g.style.opacity = ''; }); return; }
      var r = walk.getBoundingClientRect(), total = walk.offsetHeight - window.innerHeight;
      var p = Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
      var cam = p * 2.15 * GAP;
      world.style.transform = 'translateZ(' + cam.toFixed(1) + 'px)';
      gates.forEach(function (g) {
        var z = cam - g._i * GAP;
        var o = z > 120 ? 1 - (z - 120) / 380 : z < -1300 ? 1 + (z + 1300) / 700 : 1;
        g.style.opacity = Math.max(0, Math.min(1, o)).toFixed(3);
        g.style.visibility = o <= 0 ? 'hidden' : '';
      });
    };
    window.addEventListener('scroll', function () { if (!wtick) { wtick = true; requestAnimationFrame(stepWalk); } }, { passive: true });
    window.addEventListener('resize', stepWalk);
    stepWalk();
  }
  $$('[data-photo-bg]').forEach(function (g) {
    var src = photos[g.getAttribute('data-photo-bg')];
    if (!src) return;
    var arch = $('.gate__arch', g), img = new Image();
    img.alt = ''; img.className = 'photo'; img.decoding = 'async';
    img.onload = function () { arch.classList.add('has-photo'); };
    img.src = src; arch.insertBefore(img, arch.querySelector('.arch-frame'));
  });

  /* ------------------------------------------------------------ Tilt */
  $$('[data-tilt]').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      if (reduced() || e.pointerType !== 'mouse') return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 14).toFixed(1) + 'deg');
      c.style.setProperty('--rx', (((e.clientY - r.top) / r.height - .5) * -12).toFixed(1) + 'deg');
    });
    c.addEventListener('pointerleave', function () { c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); });
  });

  /* ------------------------------------------------------------ Dialogs */
  function openDlg(d) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  $$('[data-open]').forEach(function (b) { b.addEventListener('click', function () { openDlg($('#dlg-' + b.getAttribute('data-open'))); }); });
  $$('dialog').forEach(function (d) { d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-close]')) d.close(); }); });
  $$('[data-insight]').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = $('#dlg-insight');
      $('[data-ins-title]', d).textContent = $('b', b).textContent;
      $('[data-ins-desc]', d).textContent = $('.ins__sub', b).textContent + '.';
      openDlg(d);
    });
  });

  /* ------------------------------------------------------------ Photos */
  $$('[data-photo]').forEach(function (h) {
    var src = photos[h.getAttribute('data-photo')];
    if (!src) return;
    var img = new Image();
    img.alt = h.getAttribute('data-alt') || ''; img.loading = 'lazy'; img.decoding = 'async'; img.className = 'photo';
    img.onload = function () { h.classList.add('has-photo'); if (h.hasAttribute('data-reveal')) h.hidden = false; };
    img.src = src; h.insertBefore(img, h.querySelector('.arch-frame'));
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
      try { localStorage.setItem('hk-reduce-motion', on ? '1' : '0'); } catch (e) {}
    });
  }
  var yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();
})();
