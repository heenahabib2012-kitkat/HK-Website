/* HK Business Consultancy: site behaviour. No dependencies. */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  var cfg = window.HK_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Motion ----------
     Tokens mirror the CSS custom properties in site.css. Sequences use the
     browser's Web Animations API (no library). Every animation checks
     reduced motion first and falls back to an instant state change. */
  var MOTION = {
    fast: 150, base: 240, slow: 600, stagger: 80,
    easeOut: 'cubic-bezier(.2, .7, .2, 1)',
    easeIn: 'cubic-bezier(.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(.65, 0, .35, 1)'
  };
  var reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function canAnimate(el) { return !!(el && el.animate) && !(reduceMq && reduceMq.matches); }
  function stopAnimations(el) { if (el && el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); }); }
  var ENTER = [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }];
  var EXIT = [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }];

  /* ---------- Year ---------- */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Header state ---------- */
  var header = $('.site-header');
  var hero = $('.hero');
  var mobileCta = $('.mobile-cta');
  var contact = $('#contact');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 24);

    if (mobileCta && hero && contact) {
      var pastHero = y > hero.offsetHeight - 120;
      var cRect = contact.getBoundingClientRect();
      var atContact = cRect.top < window.innerHeight && cRect.bottom > 0;
      var show = pastHero && !atContact;
      mobileCta.classList.toggle('is-visible', show);
      mobileCta.setAttribute('aria-hidden', show ? 'false' : 'true');
      var a = $('a', mobileCta);
      if (a) a.tabIndex = show ? 0 : -1;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = $('.menu-toggle');
  var menu = $('#mobile-menu');
  function setMenu(open) {
    var wasOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (open === wasOpen) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    header.classList.toggle('menu-open', open);
    stopAnimations(menu);
    $$('li', menu).forEach(stopAnimations);

    if (open) {
      menu.hidden = false;
      if (!canAnimate(menu)) return;
      menu.animate(ENTER, { duration: MOTION.base, easing: MOTION.easeOut });
      $$('li', menu).forEach(function (li, i) {
        li.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }],
          { duration: MOTION.base, delay: 40 + i * (MOTION.stagger / 2), easing: MOTION.easeOut, fill: 'backwards' });
      });
    } else {
      if (!canAnimate(menu)) { menu.hidden = true; return; }
      menu.animate(EXIT, { duration: MOTION.fast, easing: MOTION.easeIn }).onfinish = function () {
        // Interrupted by a re-open: leave it visible.
        if (toggle.getAttribute('aria-expanded') === 'false') menu.hidden = true;
      };
    }
  }
  if (toggle && menu) {
    var isOpen = function () { return toggle.getAttribute('aria-expanded') === 'true'; };
    toggle.addEventListener('click', function () { setMenu(!isOpen()); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { setMenu(false); toggle.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080 && isOpen()) setMenu(false); });
  }

  /* ---------- Active nav link ---------- */
  var navLinks = $$('.nav a[href^="#"]');
  if ('IntersectionObserver' in window && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          navLinks.forEach(function (a) { a.classList.remove('is-active'); });
          map[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ---------- Services: open one at a time within a practice ---------- */
  $$('.svc-list').forEach(function (list) {
    var items = $$('details', list);

    function closeSvc(d) {
      var body = $('.svc-body', d);
      if (!canAnimate(body)) { d.open = false; return; }
      d.classList.add('is-closing');
      stopAnimations(body);
      body.animate(EXIT, { duration: MOTION.fast, easing: MOTION.easeIn }).onfinish = function () {
        if (!d.classList.contains('is-closing')) return; // re-opened meanwhile
        d.classList.remove('is-closing');
        d.open = false;
      };
    }
    function openSvc(d) {
      var body = $('.svc-body', d);
      items.forEach(function (o) { if (o !== d && o.open && !o.classList.contains('is-closing')) closeSvc(o); });
      d.classList.remove('is-closing');
      stopAnimations(body);
      d.open = true;
      if (canAnimate(body)) body.animate(ENTER, { duration: MOTION.base, easing: MOTION.easeOut });
    }

    items.forEach(function (d) {
      // Click also covers Enter/Space on the focused summary.
      $('summary', d).addEventListener('click', function (e) {
        e.preventDefault();
        if (d.open && !d.classList.contains('is-closing')) closeSvc(d); else openSvc(d);
      });
      // Fallback for opens that bypass the click handler (e.g. find-in-page).
      d.addEventListener('toggle', function () {
        if (d.open) items.forEach(function (o) { if (o !== d && o.open && !o.classList.contains('is-closing')) o.open = false; });
      });
    });
  });
  // Open the first service in the first practice so the section shows depth.
  var firstSvc = $('.svc');
  if (firstSvc) firstSvc.open = true;

  /* ---------- Leadership tabs ---------- */
  $$('[data-tabs]').forEach(function (root) {
    var tabs = $$('[role="tab"]', root);
    var list = $('[role="tablist"]', root);
    var indicator = document.createElement('span');
    indicator.className = 'tab-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    list.appendChild(indicator);
    list.classList.add('has-indicator');

    function moveIndicator(tab, instant) {
      if (instant) indicator.style.transition = 'none';
      indicator.style.transform = 'translate(' + tab.offsetLeft + 'px,' + (tab.offsetTop + tab.offsetHeight - list.offsetHeight) + 'px) scaleX(' + tab.offsetWidth + ')';
      if (instant) { void indicator.offsetWidth; indicator.style.transition = ''; }
    }
    function current() { return tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0]; }

    function select(tab, focus) {
      if (tab.getAttribute('aria-selected') === 'true') { if (focus) tab.focus(); return; }
      tabs.forEach(function (t) {
        var on = t === tab;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        stopAnimations(panel);
        panel.hidden = !on;
        if (on && canAnimate(panel)) {
          panel.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
            { duration: MOTION.base, easing: MOTION.easeOut });
        }
      });
      moveIndicator(tab);
      if (focus) tab.focus();
    }
    moveIndicator(current(), true);
    window.addEventListener('resize', function () { moveIndicator(current(), true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveIndicator(current(), true); });
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------- CTAs prefill the consultation form ---------- */
  var form = $('#enquiry');
  var fService = $('#f-service');
  var fAudience = $('#f-audience');
  var fName = $('#f-name');

  function selectOption(sel, value) {
    if (!sel || !value) return;
    $$('option', sel).forEach(function (o) { if (o.textContent.trim() === value) sel.value = o.value || o.textContent; });
  }
  $$('[data-service], [data-audience]').forEach(function (a) {
    a.addEventListener('click', function () {
      selectOption(fService, a.getAttribute('data-service'));
      selectOption(fAudience, a.getAttribute('data-audience'));
      setTimeout(function () { if (fName) fName.focus({ preventScroll: true }); }, 600);
    });
  });

  /* ---------- Form ---------- */
  if (form) {
    var status = $('#form-status');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setErr(input, msg) {
      var e = document.getElementById(input.id + '-err');
      if (msg) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', input.id + '-err'); }
      else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
      if (e) e.textContent = msg || '';
    }
    function validate() {
      var ok = true, first = null;
      var checks = [
        [fName, function (v) { return v ? '' : 'Please enter your name.'; }],
        [$('#f-email'), function (v) { return !v ? 'Please enter your email address.' : (emailRe.test(v) ? '' : 'Please enter a valid email address.'); }],
        [$('#f-message'), function (v) { return v ? '' : 'Please tell us briefly about your business.'; }]
      ];
      checks.forEach(function (c) {
        var msg = c[1](c[0].value.trim());
        setErr(c[0], msg);
        if (msg) { ok = false; if (!first) first = c[0]; }
      });
      if (first) first.focus();
      return ok;
    }
    $$('input, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) setErr(el, ''); });
    });

    function summary(fd) {
      var lines = [
        'Name: ' + fd.get('name'),
        'Company: ' + (fd.get('company') || '-'),
        'Email: ' + fd.get('email'),
        'Phone / WhatsApp: ' + (fd.get('phone') || '-'),
        'Country: ' + (fd.get('country') || '-'),
        'Describes them: ' + (fd.get('audience') || '-'),
        'Area of interest: ' + (fd.get('service') || '-'),
        'Preferred contact: ' + (fd.get('contact_method') || '-'),
        '',
        fd.get('message')
      ];
      return lines.join('\n');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-note';
      status.textContent = '';
      if (form.website && form.website.value) return; // honeypot
      if (!validate()) return;

      var fd = new FormData(form);
      fd.delete('website');
      var subject = 'Consultation request: ' + fd.get('name') + (fd.get('company') ? ' (' + fd.get('company') + ')' : '');
      fd.append('_subject', subject);
      var btn = $('button[type="submit"]', form);

      if (cfg.formEndpoint) {
        btn.disabled = true; btn.textContent = 'Sending…';
        fetch(cfg.formEndpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
          .then(function (r) { if (!r.ok) throw new Error(r.status); })
          .then(function () {
            form.reset();
            status.className = 'form-note ok';
            status.textContent = 'Thank you. Your consultation request has been received and a member of the HK team will be in touch.';
          })
          .catch(function () {
            status.innerHTML = 'Sorry, your request could not be sent. Please email <a href="mailto:' + cfg.email + '">' + cfg.email + '</a> or message us on <a href="https://wa.me/' + cfg.whatsapp + '" target="_blank" rel="noopener">WhatsApp</a>.';
          })
          .then(function () { btn.disabled = false; btn.textContent = 'Request a consultation'; });
        return;
      }

      // No endpoint configured: hand the enquiry to the visitor's email app.
      var href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(summary(fd));
      window.location.href = href;
      status.className = 'form-note ok';
      status.innerHTML = 'Your email app should open with your request ready to send. If it does not, email <a href="mailto:' + cfg.email + '">' + cfg.email + '</a> or <a href="https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(summary(fd)) + '" target="_blank" rel="noopener">send it on WhatsApp</a>.';
    });
  }

  /* ---------- Story moment: approach line ----------
     When the approach enters view, a blue line draws across the five stages
     and each stage lights as the line reaches it. It plays once. With
     reduced motion (or no IntersectionObserver) the line is simply shown. */
  var story = $('.steps-wrap');
  var bar = story && $('.steps-progress', story);
  if (bar && 'IntersectionObserver' in window && canAnimate(bar)) {
    var stages = $$('.steps li', story);
    story.classList.add('story-armed');

    var play = function () {
      var vertical = getComputedStyle(bar).getPropertyValue('--axis').trim() === 'y';
      var anim = bar.animate(
        [{ transform: vertical ? 'scaleY(0)' : 'scaleX(0)' }, { transform: vertical ? 'scaleY(1)' : 'scaleX(1)' }],
        { duration: MOTION.slow * 2, easing: MOTION.easeInOut, fill: 'forwards' }
      );
      // Light each stage when the drawn line actually reaches it (reads only, no layout writes).
      var origin = story.getBoundingClientRect();
      var marks = stages.map(function (li) {
        var r = li.getBoundingClientRect();
        return vertical ? r.top - origin.top : r.left - origin.left;
      });
      var tick = function () {
        var drawn = bar.getBoundingClientRect();
        var reach = vertical ? drawn.height : drawn.width;
        stages.forEach(function (li, i) { if (reach + 2 >= marks[i]) li.classList.add('is-reached'); });
        if (anim.playState === 'running') requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      anim.onfinish = function () {
        stages.forEach(function (li) { li.classList.add('is-reached', 'is-settled'); });
      };
    };

    var storyIo = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      storyIo.disconnect();
      play();
    }, { threshold: 0.4 });
    storyIo.observe(story);

    // If the visitor switches on reduced motion mid-visit, finish the moment instantly.
    if (reduceMq && reduceMq.addEventListener) reduceMq.addEventListener('change', function () {
      if (!reduceMq.matches) return;
      storyIo.disconnect();
      story.classList.remove('story-armed');
      stopAnimations(bar);
      stages.forEach(function (li) { li.classList.add('is-reached', 'is-settled'); });
    });
  }
})();
