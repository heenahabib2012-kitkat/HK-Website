// Sticky header, mobile menu, scroll reveals and the contact form.
(() => {
  const header = document.querySelector('[data-header]');
  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = document.querySelector('[data-burger]');
  const nav = document.querySelector('[data-nav]');
  const setMenu = (open) => { burger.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  const targets = document.querySelectorAll('.sec__head, .about__lead, .steps li, .founder__fig, .founder__copy, .vm__block, .card, .numbers__row > div, .inds li, .assoc li, .logos img, .words figure, .contact__info, .form');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -6% 0px' });
    targets.forEach((el) => {
      const sibs = [...el.parentElement.children];
      el.style.transitionDelay = `${Math.min(sibs.indexOf(el), 5) * 70}ms`;
      el.classList.add('rv');
      io.observe(el);
    });
  }

  document.querySelector('[data-year]').textContent = new Date().getFullYear();

  const form = document.querySelector('[data-form]');
  const status = document.querySelector('[data-status]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('input, select, textarea').forEach((f) => {
      const valid = f.checkValidity();
      f.classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) { status.textContent = 'Please complete the highlighted fields.'; return; }
    const d = Object.fromEntries(new FormData(form));
    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      const body = `Name: ${d.name}\nEmail: ${d.email}\nCompany: ${d.company || '-'}\nPhone: ${d.phone || '-'}\nService: ${d.service}\n\n${d.message}`;
      window.location.href = `mailto:info@honestandkeen.com?subject=${encodeURIComponent('Enquiry: ' + d.service)}&body=${encodeURIComponent(body)}`;
      status.textContent = 'Your email app is opening with your message — just press send.';
      return;
    }
    status.textContent = 'Sending…';
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d) });
      if (!res.ok) throw new Error();
      form.reset();
      status.textContent = 'Thank you — we will be in touch shortly.';
    } catch {
      status.textContent = 'Something went wrong. Please email info@honestandkeen.com.';
    }
  });
})();
