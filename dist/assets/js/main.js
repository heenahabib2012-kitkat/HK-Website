/* HK Business Consultancy — site interactions
   Vanilla JS, no dependencies. Every effect degrades to a static, readable page. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  /* ---------- Page transitions (curtain) ---------- */
  const NAV_KEY = 'hk-nav';
  try {
    if (!reduce && sessionStorage.getItem(NAV_KEY)) {
      sessionStorage.removeItem(NAV_KEY);
      root.classList.add('is-arriving');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        root.classList.add('is-arrived');
        setTimeout(() => root.classList.remove('is-arriving', 'is-arrived'), 800);
      }));
    }
  } catch (e) { /* storage unavailable */ }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || /^(mailto|tel):/.test(a.getAttribute('href'))) return;
    if (url.pathname === location.pathname && url.hash) return; // in-page anchor
    if (url.pathname === location.pathname && !url.hash && url.search === location.search) return;
    e.preventDefault();
    try { sessionStorage.setItem(NAV_KEY, '1'); } catch (err) { /* ignore */ }
    root.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, 560);
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('is-leaving', 'is-arriving', 'is-arrived'); });

  /* ---------- Header ---------- */
  const header = $('[data-header]');
  let lastY = window.scrollY;
  const onScrollHeader = () => {
    const y = window.scrollY;
    header.classList.toggle('is-solid', y > 40);
    const menuOpen = document.body.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !menuOpen && y > window.innerHeight * 0.9 && y > lastY + 4);
    if (y < lastY - 4) header.classList.remove('is-hidden');
    lastY = y;
  };

  /* ---------- Mobile menu ---------- */
  const toggle = $('[data-menu-toggle]');
  const menu = $('[data-mobile-menu]');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      setTimeout(() => $('a', menu)?.focus(), 300);
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, reduce ? 0 : 700);
    }
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); toggle.focus(); }
    if (e.key === 'Tab' && document.body.classList.contains('menu-open')) {
      const f = [toggle, ...$$('a', menu)];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.matchMedia('(min-width: 1181px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

  /* ---------- Split words for typographic reveals ---------- */
  $$('.reveal-words').forEach((el) => {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
    $$('.w', el).forEach((w) => w.setAttribute('aria-hidden', 'true'));
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal, .reveal-words, .mask-reveal, .line-draw, .chapter, .eco, .steps');
  // gentle stagger for siblings revealed together
  $$('.svc-list, .mosaic, .principles__list, .associates__list, .industry-strip__grid, .cols3, .steps').forEach((g) => {
    Array.from(g.children).forEach((c, i) => c.style.setProperty('--d', `${Math.min(i, 8) * 0.08}s`));
  });
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    // clip-path masked elements report no intersection, so watch their box via a sentinel parent
    const masked = new Map();
    const mo = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { (masked.get(en.target) || []).forEach((el) => el.classList.add('is-in')); masked.delete(en.target); mo.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    revealEls.forEach((el) => {
      if (el.classList.contains('mask-reveal')) {
        const host = el.parentElement;
        if (!masked.has(host)) { masked.set(host, []); mo.observe(host); }
        masked.get(host).push(el);
      } else io.observe(el);
    });
  } else revealEls.forEach((el) => el.classList.add('is-in'));

  /* ---------- Parallax ---------- */
  const parallax = $$('[data-parallax]');
  const runParallax = () => {
    const vh = window.innerHeight;
    parallax.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const speed = parseFloat(el.dataset.parallax) || 0.1;
      const offset = (r.top + r.height / 2 - vh / 2) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  };

  /* ---------- Timeline progress ---------- */
  const timeline = $('.timeline');
  const runTimeline = () => {
    if (!timeline) return;
    const r = timeline.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (window.innerHeight * 0.6 - r.top) / r.height));
    timeline.style.setProperty('--p', p.toFixed(3));
  };

  /* ---------- Section nav (expertise) ---------- */
  const svcLinks = $$('.svc-nav a');
  const svcSections = svcLinks.map((a) => $(a.getAttribute('href').replace(/^.*#/, '#'))).filter(Boolean);
  const runSvcNav = () => {
    if (!svcSections.length) return;
    let current = svcSections[0];
    svcSections.forEach((s) => { if (s.getBoundingClientRect().top < window.innerHeight * 0.4) current = s; });
    svcLinks.forEach((a) => {
      const on = a.getAttribute('href').endsWith('#' + current.id);
      a.classList.toggle('is-current', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScrollHeader();
      if (!reduce) runParallax();
      runTimeline(); runSvcNav();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- Promise: Honest & Keen ---------- */
  const promise = $('[data-promise]');
  if (promise) {
    const tabs = $$('[role="tab"]', promise);
    let auto = null, interacted = false;
    const select = (tab, focus = false) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on; panel.classList.toggle('is-active', on);
      });
      if (focus) tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { interacted = true; select(t); });
      if (finePointer) t.addEventListener('mouseenter', () => { interacted = true; select(t); });
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); interacted = true; select(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true); }
      });
    });
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        clearInterval(auto);
        if (en.isIntersecting) auto = setInterval(() => {
          if (interacted) return clearInterval(auto);
          const cur = tabs.findIndex((t) => t.classList.contains('is-active'));
          select(tabs[(cur + 1) % tabs.length]);
        }, 5200);
      }, { threshold: 0.4 }).observe(promise);
    }
  }

  /* ---------- Cursor gallery (expertise list) ---------- */
  const gallery = $('.cursor-gallery');
  const galleryList = $('[data-cursor-gallery]');
  if (gallery && galleryList && finePointer && !reduce) {
    const frames = $$('.media', gallery);
    let x = 0, y = 0, cx = 0, cy = 0, raf = null;
    const loop = () => {
      cx += (x - cx) * 0.14; cy += (y - cy) * 0.14;
      gallery.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${((x - cx) * 0.03).toFixed(2)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    galleryList.addEventListener('mousemove', (e) => { x = e.clientX + 170; y = e.clientY; });
    $$('[data-preview]', galleryList).forEach((item) => {
      item.addEventListener('mouseenter', (e) => {
        if (!raf) { cx = x = e.clientX + 170; cy = y = e.clientY; loop(); }
        frames.forEach((f) => f.classList.toggle('is-active', f.dataset.media === item.dataset.preview));
        gallery.classList.add('is-visible');
      });
    });
    galleryList.addEventListener('mouseleave', () => { gallery.classList.remove('is-visible'); setTimeout(() => { if (!gallery.classList.contains('is-visible')) { cancelAnimationFrame(raf); raf = null; } }, 500); });
  }

  /* ---------- Testimonials ---------- */
  const voices = $('[data-voices]');
  if (voices) {
    const items = $$('[data-voice]', voices);
    const idx = $('[data-voice-index]', voices);
    let cur = 0, timer = null;
    const show = (n) => {
      cur = (n + items.length) % items.length;
      items.forEach((v, i) => { v.hidden = i !== cur; v.classList.toggle('is-active', i === cur); });
      idx.textContent = String(cur + 1).padStart(2, '0');
    };
    const start = () => { if (!reduce) { clearInterval(timer); timer = setInterval(() => show(cur + 1), 9000); } };
    $('[data-voice-next]', voices).addEventListener('click', () => { show(cur + 1); start(); });
    $('[data-voice-prev]', voices).addEventListener('click', () => { show(cur - 1); start(); });
    voices.addEventListener('mouseenter', () => clearInterval(timer));
    voices.addEventListener('mouseleave', start);
    voices.addEventListener('focusin', () => clearInterval(timer));
    start();
  }

  /* ---------- World map ---------- */
  $$('.world-map').forEach((map) => {
    $$('.map-arc', map).forEach((a, i) => a.style.setProperty('--i', i));
    $$('.map-node', map).forEach((n, i) => n.style.setProperty('--i', i));
    if (reduce || !('IntersectionObserver' in window)) { map.classList.add('is-drawn'); return; }
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { map.classList.add('is-drawn'); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(map);
  });
  const regionBtns = $$('[data-region-btn]');
  if (regionBtns.length) {
    const map = $('#atlas-map');
    const setRegion = (btn) => {
      regionBtns.forEach((b) => b.setAttribute('aria-expanded', String(b === btn)));
      if (btn) map.dataset.focus = btn.dataset.regionBtn; else delete map.dataset.focus;
    };
    regionBtns.forEach((b) => {
      b.addEventListener('click', () => setRegion(b.getAttribute('aria-expanded') === 'true' ? null : b));
      if (finePointer) {
        b.addEventListener('mouseenter', () => { map.dataset.focus = b.dataset.regionBtn; });
        b.addEventListener('mouseleave', () => { const open = regionBtns.find((x) => x.getAttribute('aria-expanded') === 'true'); if (open) map.dataset.focus = open.dataset.regionBtn; else delete map.dataset.focus; });
      }
    });
  }

  /* ---------- Industries explorer ---------- */
  const explorer = $('[data-explorer]');
  if (explorer) {
    const tabs = $$('[role="tab"]', explorer);
    const visuals = $$('.explorer__visual .media', explorer);
    let current = null;
    const select = (tab, { focus = false, push = false } = {}) => {
      if (tab === current) return;
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
        const p = document.getElementById(t.getAttribute('aria-controls'));
        p.hidden = !on; p.classList.toggle('is-active', on);
      });
      visuals.forEach((v) => {
        v.classList.remove('was-active');
        if (v.classList.contains('is-active')) { v.classList.remove('is-active'); v.classList.add('was-active'); }
        if (v.dataset.media === tab.dataset.visual) v.classList.add('is-active');
      });
      current = tab;
      if (focus) tab.focus();
      if (push) history.replaceState(null, '', '#' + tab.dataset.slug);
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => {
        select(t, { push: true });
        if (window.matchMedia('(max-width: 900px)').matches) $('.explorer__stage', explorer).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
      t.addEventListener('keydown', (e) => {
        const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], { focus: true, push: true }); }
        if (e.key === 'Home') { e.preventDefault(); select(tabs[0], { focus: true, push: true }); }
        if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], { focus: true, push: true }); }
      });
    });
    const fromHash = () => tabs.find((t) => '#' + t.dataset.slug === location.hash);
    select(fromHash() || tabs[0]);
    if (fromHash()) setTimeout(() => explorer.scrollIntoView({ behavior: 'auto', block: 'start' }), 50);
    window.addEventListener('hashchange', () => { const t = fromHash(); if (t) { select(t); explorer.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } });
  }

  /* ---------- Brand facets (expertise 04) ---------- */
  const facets = $$('[data-facet]');
  const facetNote = $('[data-facet-note]');
  facets.forEach((b) => {
    const pick = () => {
      facets.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      facetNote.textContent = b.dataset.facet;
      facetNote.classList.remove('is-swapping'); void facetNote.offsetWidth; facetNote.classList.add('is-swapping');
    };
    b.addEventListener('click', pick);
    if (finePointer) b.addEventListener('mouseenter', pick);
  });

  /* ---------- Expandable details: smooth height ---------- */
  if (!reduce) $$('details.detail').forEach((d) => {
    const summary = $('summary', d), body = $('.detail__body', d);
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) {
        const a = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 450, easing: 'cubic-bezier(.65,0,.35,1)' });
        a.onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        body.animate([{ height: '0px', opacity: 0 }, { height: body.scrollHeight + 'px', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  });

  /* ---------- Network ecosystem ---------- */
  $$('.eco__node').forEach((n) => {
    const link = $(`.eco__link[data-node="${n.dataset.node}"]`);
    const on = () => { if (link) { link.style.opacity = '1'; link.style.strokeWidth = '2'; } };
    const off = () => { if (link) { link.style.opacity = ''; link.style.strokeWidth = ''; } };
    n.addEventListener('mouseenter', on); n.addEventListener('mouseleave', off);
    n.addEventListener('focusin', on); n.addEventListener('focusout', off);
  });

  /* ---------- Contact form ---------- */
  const form = $('[data-contact-form]');
  if (form) {
    const params = new URLSearchParams(location.search);
    const enquiry = params.get('enquiry');
    if (enquiry) {
      const sel = form.elements.enquiry;
      const opt = Array.from(sel.options).find((o) => o.value === enquiry || o.dataset.key === enquiry);
      if (opt) sel.value = opt.value;
    }
    if (params.get('sector') && form.elements.sector) form.elements.sector.value = params.get('sector');
    const status = $('[data-form-status]', form);
    const success = $('[data-form-success]');
    const rules = {
      name: (v) => v.trim().length >= 2 || 'Please enter your full name.',
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
      phone: (v) => !v.trim() || /^[+()\d\s-]{7,20}$/.test(v.trim()) || 'Please enter a valid telephone number.',
      country: (v) => v.trim().length >= 2 || 'Please tell us your country.',
      enquiry: (v) => !!v || 'Please choose the nature of your enquiry.',
      message: (v) => v.trim().length >= 10 || 'Please share a little more detail (at least 10 characters).',
    };
    const check = (field) => {
      const rule = rules[field.name]; if (!rule) return true;
      const res = rule(field.value);
      const wrap = field.closest('.field'); const err = $('.field__error', wrap);
      const ok = res === true;
      wrap.classList.toggle('has-error', !ok);
      field.setAttribute('aria-invalid', String(!ok));
      err.textContent = ok ? '' : res;
      return ok;
    };
    Object.keys(rules).forEach((n) => {
      const f = form.elements[n]; if (!f) return;
      f.addEventListener('blur', () => { if (f.value || f.closest('.field').classList.contains('has-error')) check(f); });
      f.addEventListener('input', () => { if (f.closest('.field').classList.contains('has-error')) check(f); });
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.textContent = '';
      const invalid = Object.keys(rules).map((n) => form.elements[n]).filter((f) => f && !check(f));
      if (invalid.length) { invalid[0].focus(); status.textContent = 'Please review the highlighted fields.'; return; }
      if (form.elements['bot-field'].value) return; // honeypot
      const btn = $('button[type="submit"]', form);
      btn.setAttribute('aria-busy', 'true'); const label = btn.textContent; btn.textContent = 'Sending…';
      const data = new FormData(form);
      const endpoint = form.dataset.endpoint;
      try {
        let res;
        if (endpoint) {
          res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        } else {
          // Netlify Forms (default): POST url-encoded to the page path
          res = await fetch(form.getAttribute('action') || '/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() });
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.hidden = true;
        success.classList.add('is-visible');
        success.setAttribute('tabindex', '-1'); success.focus();
        $('[data-success-name]', success).textContent = data.get('name').toString().split(' ')[0];
        if (window.gtag) window.gtag('event', 'generate_lead', { method: 'contact_form' });
      } catch (err) {
        const body = encodeURIComponent(`Name: ${data.get('name')}\nCompany: ${data.get('company')}\nEmail: ${data.get('email')}\nTelephone: ${data.get('phone')}\nCountry: ${data.get('country')}\nEnquiry: ${data.get('enquiry')}\n\n${data.get('message')}`);
        status.innerHTML = `We couldn’t send your message just now. Please email us directly at <a href="mailto:${form.dataset.email}?subject=${encodeURIComponent('Website enquiry — ' + data.get('enquiry'))}&body=${body}">${form.dataset.email}</a>.`;
      } finally {
        btn.removeAttribute('aria-busy'); btn.textContent = label;
      }
    });
  }
})();
