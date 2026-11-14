// Header border on scroll, mobile menu, gentle fade-in and the contact form.
(() => {
  const header = document.querySelector('[data-header]');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menu = document.querySelector('[data-menu]');
  const nav = document.querySelector('[data-nav]');
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    menu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  }));

  const els = document.querySelectorAll('.section .container > *');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
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
      const body = `Name: ${d.name}\nEmail: ${d.email}\nCompany: ${d.company || '-'}\nService: ${d.service}\n\n${d.message}`;
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
