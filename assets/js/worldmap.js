/* ==========================================================================
   HK — Stylised dot world map (SVG, equirectangular)
   Used by "Why Dubai?", "Our Journey" and "Global Presence".
   Regions light up on hover; gold arcs radiate from the Dubai hub.
   ========================================================================== */
(function (HK) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function WorldMap(svg, o) {
    var geo = HK.geo, P = geo.PLACES;
    o = o || {};
    var b = o.bounds || [-170, 190, -56, 80];   // lonMin, lonMax, latMin, latMax
    var step = o.step || 2.5, k = 10;
    var reduced = HK.reducedMotion && HK.reducedMotion();
    var Wv = (b[1] - b[0]) * k, Hv = (b[3] - b[2]) * k;
    svg.setAttribute('viewBox', '0 0 ' + Wv + ' ' + Hv);
    svg.setAttribute('preserveAspectRatio', o.aspect || 'xMidYMid meet');

    function xy(lon, lat) { return [(lon - b[0]) * k, (b[3] - lat) * k]; }

    // defs
    var defs = el('defs', {}, svg);
    var gid = 'hkg' + Math.random().toString(36).slice(2, 7);
    var lg = el('linearGradient', { id: gid, x1: '0', x2: '1' }, defs);
    el('stop', { offset: '0', 'stop-color': '#f4dfa8', 'stop-opacity': '0.95' }, lg);
    el('stop', { offset: '1', 'stop-color': '#c9a14a', 'stop-opacity': '0.35' }, lg);
    var glow = el('radialGradient', { id: gid + 'r' }, defs);
    el('stop', { offset: '0', 'stop-color': '#f4dfa8', 'stop-opacity': '0.55' }, glow);
    el('stop', { offset: '1', 'stop-color': '#f4dfa8', 'stop-opacity': '0' }, glow);

    // dots grouped by region
    var groups = {};
    var land = el('g', { class: 'map-land' }, svg);
    for (var lat = b[3] - step / 2; lat > b[2]; lat -= step) {
      for (var lon = b[0] + step / 2; lon < b[1]; lon += step) {
        var L = lon > 180 ? lon - 360 : lon;
        if (!geo.isLand(L, lat)) continue;
        var reg = geo.region(L, lat) || 'other';
        if (!groups[reg]) groups[reg] = el('g', { class: 'map-region', 'data-region': reg }, land);
        var p = xy(lon, lat);
        el('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: (step * k * 0.26).toFixed(1) }, groups[reg]);
      }
    }

    // arcs
    var hub = P[o.hub || 'dubai'];
    var H = xy(hub.lon, hub.lat);
    var arcs = el('g', { class: 'map-arcs' }, svg);
    (o.links || []).forEach(function (key, i) {
      var t = P[key], T = xy(t.lon, t.lat);
      var mx = (H[0] + T[0]) / 2, my = (H[1] + T[1]) / 2;
      var dx = T[0] - H[0], dy = T[1] - H[1], len = Math.sqrt(dx * dx + dy * dy);
      var cxp = mx + dy * 0.08 * (i % 2 ? 1 : -1), cyp = my - len * 0.28;
      var d = 'M' + H[0].toFixed(1) + ' ' + H[1].toFixed(1) + ' Q' + cxp.toFixed(1) + ' ' + cyp.toFixed(1) + ' ' + T[0].toFixed(1) + ' ' + T[1].toFixed(1);
      el('path', { d: d, class: 'map-arc-base' }, arcs);
      el('path', { d: d, class: 'map-arc', stroke: 'url(#' + gid + ')', pathLength: '1', style: '--d:' + (i * 0.18) + 's' }, arcs);
      if (!reduced) {
        var c = el('circle', { r: '5', class: 'map-comet' }, arcs);
        el('animateMotion', { dur: (3.2 + (i % 3) * 0.7) + 's', begin: (i * 0.45) + 's', repeatCount: 'indefinite', path: d, keyPoints: '0;1', keyTimes: '0;1', calcMode: 'spline', keySplines: '0.4 0 0.2 1' }, c);
      }
      var node = el('g', { class: 'map-node', transform: 'translate(' + T[0].toFixed(1) + ' ' + T[1].toFixed(1) + ')' }, arcs);
      el('circle', { r: '6', class: 'map-node-dot' }, node);
      var label = o.labelMap && key in o.labelMap ? o.labelMap[key] : t.name;
      if (o.labels !== false && label) {
        var tx = el('text', { x: '12', y: '5', class: 'map-label' }, node);
        tx.textContent = label;
      }
    });

    // hub(s)
    function hubNode(place, cls, label) {
      var p = xy(place.lon, place.lat);
      var g = el('g', { class: 'map-hub ' + (cls || ''), transform: 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')' }, svg);
      el('circle', { r: '60', fill: 'url(#' + gid + 'r)' }, g);
      el('circle', { r: '10', class: 'map-hub-ring' }, g);
      el('circle', { r: '10', class: 'map-hub-ring map-hub-ring--2' }, g);
      el('circle', { r: '7', class: 'map-hub-dot' }, g);
      if (label) { var t = el('text', { x: cls === 'is-origin' ? -16 : 16, y: cls === 'is-origin' ? -12 : 26, class: 'map-hub-label', 'text-anchor': cls === 'is-origin' ? 'end' : 'start' }, g); t.textContent = label; }
      return g;
    }
    if (o.origin) hubNode(P[o.origin], 'is-origin', o.originLabel || P[o.origin].name.toUpperCase());
    hubNode(hub, 'is-hub', o.hubLabel || hub.name.toUpperCase());

    // hover
    var current = null;
    function setRegion(reg, e) {
      if (reg === current) { if (reg && o.onHover) o.onHover(reg, e.clientX, e.clientY); return; }
      if (current && groups[current]) groups[current].classList.remove('is-active');
      current = reg;
      if (reg && groups[reg]) groups[reg].classList.add('is-active');
      svg.classList.toggle('has-active', !!reg);
      o.onHover && o.onHover(reg, e && e.clientX, e && e.clientY);
    }
    if (o.interactive !== false) {
      svg.addEventListener('pointermove', function (e) {
        var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        var m = svg.getScreenCTM(); if (!m) return;
        var q = pt.matrixTransform(m.inverse());
        var lon = q.x / k + b[0], lat = b[3] - q.y / k;
        if (lon > 180) lon -= 360;
        // snap to nearest grid dot so small islands still register
        var reg = null;
        for (var dl = 0; dl <= step && !reg; dl += step) {
          if (geo.isLand(lon, lat)) reg = geo.region(lon, lat);
          else if (geo.isLand(lon + dl, lat)) reg = geo.region(lon + dl, lat);
          else if (geo.isLand(lon - dl, lat)) reg = geo.region(lon - dl, lat);
        }
        setRegion(reg, e);
      });
      svg.addEventListener('pointerleave', function (e) { setRegion(null, e); });
    }

    return { highlight: function (reg) { setRegion(reg, {}); } };
  }

  HK.WorldMap = WorldMap;
})(window.HK = window.HK || {});
