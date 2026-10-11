/* Associate companies page: navigation, reveals and directory numbering. */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const nav = $('[data-nav]');
const toggle = $('[data-menu-toggle]');
const mobile = $('#mobile-menu');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  mobile.hidden = !open;
});
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// number the entries and keep the count in the header current
const entries = $$('.assoc');
entries.forEach((el, i) => { $('.assoc__num', el).textContent = String(i + 1).padStart(2, '0'); });
$('[data-assoc-count]').textContent = String(entries.length).padStart(2, '0');

const io = new IntersectionObserver((list) => {
  list.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
$$('[data-reveal]').forEach((el) => io.observe(el));

$('[data-year]').textContent = new Date().getFullYear();
