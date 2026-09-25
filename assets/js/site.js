/* HK Business Consultancy: site behaviour. No dependencies. */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  var cfg = window.HK_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

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
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
    header.classList.toggle('menu-open', open);
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(menu.hidden); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080 && !menu.hidden) setMenu(false); });
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
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) items.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  });
  // Open the first service in the first practice so the section shows depth.
  var firstSvc = $('.svc');
  if (firstSvc) firstSvc.open = true;

  /* ---------- Leadership tabs ---------- */
  $$('[data-tabs]').forEach(function (root) {
    var tabs = $$('[role="tab"]', root);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    }
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

  /* ---------- Reveal on scroll (content is never left hidden) ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = $$('.section-head, .pillar, .practice, .aud, .steps li, .sector-row, .timeline li, .founder-grid > *, .market, .pull, .proof > *');
  if (!reduce && 'IntersectionObserver' in window) {
    revealEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top > window.innerHeight) el.classList.add('reveal');
    });
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); rio.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { rio.observe(el); });
    // Safety net: never leave content hidden.
    setTimeout(function () { $$('.reveal').forEach(function (el) { el.classList.add('is-in'); }); }, 6000);
  }
})();
