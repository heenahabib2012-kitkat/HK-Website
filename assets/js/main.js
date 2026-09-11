import {
  brand, disciplines, journeys, markets, clients, groupCompanies,
  people, timeline, insightCategories, contactOptions, offices,
} from './data.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);
const escapeHtml = (str = '') => str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ==========================================================================
   NAVIGATION
   ========================================================================== */
function initNav() {
  const nav = byId('siteNav');
  const toggle = byId('navToggle');
  const mobileMenu = byId('mobileMenu');

  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const closeMobile = () => {
    mobileMenu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  toggle.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  qsa('[data-scroll-link]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || !targetId.startsWith('#')) return;
      const target = byId(targetId.slice(1));
      if (!target) return;
      e.preventDefault();
      closeMobile();
      const top = target.getBoundingClientRect().top + window.scrollY - (targetId === '#top' ? 0 : 68);
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  // Active link tracking
  const sections = ['approach', 'capabilities', 'markets', 'people', 'group', 'insights', 'contact']
    .map((id) => byId(id)).filter(Boolean);
  const navLinkFor = (id) => qs(`.nav-links a[href="#${id}"]`);
  if ('IntersectionObserver' in window && sections.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = navLinkFor(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          qsa('.nav-links a').forEach((a) => a.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
  }
}

/* ==========================================================================
   SCROLL REVEAL
   ========================================================================== */
function initReveal() {
  const targets = qsa('.reveal, .reveal-line');
  if (!('IntersectionObserver' in window) || prefersReducedMotion) {
    targets.forEach((t) => t.classList.add('is-visible'));
    return;
  }

  // Anything already in (or near) the viewport at load — the hero, chiefly —
  // is revealed immediately rather than waiting on the observer's first
  // tick, so first-paint content is never left in its hidden starting state.
  const inViewport = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  };
  targets.forEach((t) => { if (inViewport(t)) t.classList.add('is-visible'); });

  // Safety net: whatever the reason (host quirks, a missed observer tick,
  // an element resized to zero), nothing is allowed to stay permanently
  // hidden — force reveal everything after a short delay regardless.
  window.setTimeout(() => {
    qsa('.reveal:not(.is-visible), .reveal-line:not(.is-visible)').forEach((t) => t.classList.add('is-visible'));
  }, 2500);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });
  targets.forEach((t) => { if (!t.classList.contains('is-visible')) io.observe(t); });

  // Section headers / cards get .reveal added dynamically after render,
  // so also watch the document body for newly added reveal targets.
  const mo = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        const found = node.matches('.reveal, .reveal-line') ? [node] : qsa('.reveal, .reveal-line', node);
        found.forEach((t) => io.observe(t));
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

/* ==========================================================================
   MARQUEE
   ========================================================================== */
function initMarquee() {
  const track = byId('marqueeTrack');
  const items = disciplines.map((d) => d.name);
  const doubled = [...items, ...items];
  track.innerHTML = doubled.map((t) => `<span class="marquee-item">${escapeHtml(t)}</span>`).join('');
}

/* ==========================================================================
   HERO NETWORK
   ========================================================================== */
function initHeroNetwork() {
  const root = byId('heroNetwork');
  const hub = markets.find((m) => m.hub) || markets[0];
  const others = markets.filter((m) => m !== hub);

  const svgLines = others.map((m) => (
    `<path class="net-line" data-target="${m.id}" d="M ${hub.x} ${hub.y} L ${m.x} ${m.y}" vector-effect="non-scaling-stroke"></path>`
  )).join('');

  root.innerHTML = `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${svgLines}</svg>
    <div class="net-panel" id="netPanel"></div>
  `;

  markets.forEach((m) => {
    const btn = document.createElement('button');
    btn.className = 'net-node' + (m.hub ? ' is-hub' : '');
    btn.style.left = m.x + '%';
    btn.style.top = m.y + '%';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', `${m.name} — ${m.role}`);
    btn.dataset.id = m.id;
    btn.innerHTML = `<span class="dot"></span><span class="net-label">${escapeHtml(m.name)}</span>`;
    root.appendChild(btn);
  });

  const panel = qs('#netPanel', root);
  const lines = qsa('.net-line', root);

  const show = (m, btn) => {
    panel.innerHTML = `
      <p class="net-panel-loc">${escapeHtml(m.name)}</p>
      <p class="net-panel-role">${escapeHtml(m.role)}</p>
      <p class="net-panel-detail">${escapeHtml(m.detail)}</p>
    `;
    panel.classList.add('is-open');
    const r = btn.getBoundingClientRect();
    const stageRect = root.getBoundingClientRect();
    let left = r.left - stageRect.left + r.width / 2;
    let top = r.top - stageRect.top + r.height + 10;
    const maxLeft = stageRect.width - 280 - 8;
    left = Math.max(8, Math.min(left, maxLeft));
    if (top + 160 > stageRect.height) top = r.top - stageRect.top - 170;
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    lines.forEach((l) => l.classList.toggle('is-active', l.dataset.target === m.id));
    qsa('.net-node', root).forEach((n) => n.classList.toggle('is-active', n.dataset.id === m.id));
  };
  const hide = () => {
    panel.classList.remove('is-open');
    lines.forEach((l) => l.classList.remove('is-active'));
    qsa('.net-node', root).forEach((n) => n.classList.remove('is-active'));
  };

  qsa('.net-node', root).forEach((btn) => {
    const m = markets.find((mk) => mk.id === btn.dataset.id);
    btn.addEventListener('mouseenter', () => show(m, btn));
    btn.addEventListener('focus', () => show(m, btn));
    btn.addEventListener('mouseleave', hide);
    btn.addEventListener('blur', hide);
    btn.addEventListener('click', () => show(m, btn));
  });
}

/* ==========================================================================
   APPROACH — discipline wheel
   ========================================================================== */
function initApproachWheel() {
  const shell = byId('wheelShell');
  const panel = byId('approachPanel');
  const R = 40;
  const positions = {};
  disciplines.forEach((d, i) => {
    const angle = (i / disciplines.length) * Math.PI * 2 - Math.PI / 2;
    positions[d.id] = {
      x: 50 + R * Math.cos(angle),
      y: 50 + R * Math.sin(angle),
    };
  });

  const pairs = [];
  disciplines.forEach((d) => {
    d.related.forEach((rid) => {
      const key = [d.id, rid].sort().join('__');
      if (!pairs.find((p) => p.key === key)) pairs.push({ key, a: d.id, b: rid });
    });
  });

  const linesSvg = pairs.map((p) => {
    const a = positions[p.a]; const b = positions[p.b];
    return `<path data-a="${p.a}" data-b="${p.b}" d="M ${a.x} ${a.y} L ${b.x} ${b.y}" vector-effect="non-scaling-stroke"></path>`;
  }).join('');

  shell.innerHTML = `
    <svg class="wheel-svg-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${linesSvg}</svg>
    <div class="wheel-center">HK</div>
  `;

  disciplines.forEach((d) => {
    const pos = positions[d.id];
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'wheel-node';
    node.style.left = pos.x + '%';
    node.style.top = pos.y + '%';
    node.dataset.id = d.id;
    node.setAttribute('aria-label', d.name);
    node.innerHTML = `<span class="wheel-node-dot"></span><span class="wheel-node-label">${escapeHtml(d.short)}</span>`;
    shell.appendChild(node);
  });

  const renderPanel = (d) => {
    panel.innerHTML = `
      <p class="approach-panel-num">${d.n}</p>
      <h3 class="headline approach-panel-title">${escapeHtml(d.name)}</h3>
      <p class="approach-panel-desc">${escapeHtml(d.description)}</p>
      <div class="approach-panel-related">
        ${d.related.map((rid) => {
          const rd = disciplines.find((x) => x.id === rid);
          return rd ? `<button type="button" class="approach-chip" data-id="${rd.id}">${escapeHtml(rd.short)}</button>` : '';
        }).join('')}
      </div>
    `;
  };

  const setActive = (id) => {
    const d = disciplines.find((x) => x.id === id);
    if (!d) return;
    qsa('.wheel-node', shell).forEach((n) => {
      n.classList.toggle('is-active', n.dataset.id === id);
      n.classList.toggle('is-related', d.related.includes(n.dataset.id));
    });
    qsa('.wheel-svg-lines path', shell).forEach((p) => {
      p.classList.toggle('is-related', p.dataset.a === id || p.dataset.b === id);
    });
    renderPanel(d);
  };

  shell.addEventListener('click', (e) => {
    const node = e.target.closest('.wheel-node');
    if (node) setActive(node.dataset.id);
  });
  panel.addEventListener('click', (e) => {
    const chip = e.target.closest('.approach-chip');
    if (chip) setActive(chip.dataset.id);
  });
  qsa('.wheel-node', shell).forEach((node) => {
    node.addEventListener('focus', () => setActive(node.dataset.id));
  });

  setActive(disciplines[0].id);
}

/* ==========================================================================
   JOURNEY / CAPABILITIES ACCORDION
   ========================================================================== */
function initJourneys() {
  const list = byId('journeyList');
  list.innerHTML = journeys.map((j, i) => `
    <div class="journey-item${i === 0 ? ' is-open' : ''}" data-id="${j.id}" role="listitem">
      <button class="journey-trigger" aria-expanded="${i === 0}">
        <span class="journey-n">${j.n}</span>
        <span class="journey-title">${escapeHtml(j.title)}</span>
        <span class="journey-plus" aria-hidden="true"></span>
      </button>
      <div class="journey-body">
        <div class="journey-body-inner">
          <div class="journey-body-content">
            <div>
              <p class="journey-summary">${escapeHtml(j.summary)}</p>
              <div class="journey-caps">
                ${j.disciplineIds.map((id) => {
                  const d = disciplines.find((x) => x.id === id);
                  return d ? `<span class="journey-cap">${escapeHtml(d.name)}</span>` : '';
                }).join('')}
              </div>
            </div>
            <div class="journey-steps" aria-hidden="true">
              ${j.steps.map((s, si) => `<span class="journey-step${si === 0 ? ' is-first' : ''}">${escapeHtml(s)}</span>${si < j.steps.length - 1 ? '<span class="journey-arrow">→</span>' : ''}`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  qsa('.journey-item', list).forEach((item) => {
    const trigger = qs('.journey-trigger', item);
    trigger.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      qsa('.journey-item', list).forEach((other) => {
        other.classList.remove('is-open');
        qs('.journey-trigger', other).setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ==========================================================================
   MARKETS
   ========================================================================== */
function initMarkets() {
  const mapEl = byId('marketsMap');
  const panelEl = byId('marketPanel');
  const hub = markets.find((m) => m.hub) || markets[0];
  const others = markets.filter((m) => m !== hub);

  const linesSvg = others.map((m) => (
    `<path class="map-line" data-target="${m.id}" d="M ${hub.x} ${hub.y} L ${m.x} ${m.y}" vector-effect="non-scaling-stroke"></path>`
  )).join('');

  mapEl.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${linesSvg}</svg>`;

  markets.forEach((m) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'map-node' + (m.hub ? ' is-hub' : '');
    btn.style.left = m.x + '%';
    btn.style.top = m.y + '%';
    btn.dataset.id = m.id;
    btn.setAttribute('aria-label', `${m.name} — ${m.role}`);
    btn.innerHTML = `<span class="dot"></span><span class="lbl">${escapeHtml(m.name)}</span>`;
    mapEl.appendChild(btn);
  });

  const renderPanel = (m) => {
    panelEl.innerHTML = `
      <p class="market-panel-flag" aria-hidden="true">${m.flag}</p>
      <h3 class="headline market-panel-name">${escapeHtml(m.name)}</h3>
      <p class="market-panel-role">${escapeHtml(m.role)}</p>
      <p class="market-panel-detail">${escapeHtml(m.detail)}</p>
      <ul class="market-panel-list">
        ${m.capabilities.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
      </ul>
      ${m.people ? `<p class="market-panel-people">${m.people.map(escapeHtml).join('<br>')}</p>` : ''}
    `;
  };

  const setActive = (id) => {
    const m = markets.find((x) => x.id === id);
    if (!m) return;
    qsa('.map-node', mapEl).forEach((n) => n.classList.toggle('is-active', n.dataset.id === id));
    qsa('.map-line', mapEl).forEach((l) => l.classList.toggle('is-active', l.dataset.target === id));
    renderPanel(m);
  };

  mapEl.addEventListener('click', (e) => {
    const node = e.target.closest('.map-node');
    if (node) setActive(node.dataset.id);
  });
  qsa('.map-node', mapEl).forEach((node) => {
    node.addEventListener('focus', () => setActive(node.dataset.id));
    node.addEventListener('mouseenter', () => setActive(node.dataset.id));
  });

  setActive(hub.id);
}

/* ==========================================================================
   PORTFOLIO / CLIENTS
   ========================================================================== */
function initPortfolio() {
  const scroller = byId('folioScroller');
  scroller.innerHTML = clients.map((c) => `
    <button type="button" class="folio-card" data-name="${escapeHtml(c.name)}" data-cat="${escapeHtml(c.category)}">
      <span class="folio-card-cat">${escapeHtml(c.category)}</span>
      <span class="folio-card-name">${escapeHtml(c.name)}</span>
      <span class="folio-card-foot">
        <span>Client</span>
        <svg class="folio-card-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" stroke-width="1.2"/></svg>
      </span>
    </button>
  `).join('');

  scroller.addEventListener('click', (e) => {
    const card = e.target.closest('.folio-card');
    if (!card) return;
    openModal({
      cat: card.dataset.cat,
      title: card.dataset.name,
      body: `${card.dataset.name} is a client of HK Business Consultancy. Individual engagement details are not published for this relationship — this entry is shown by its general line of business only.`,
    });
  });
}

/* ==========================================================================
   GROUP ECOSYSTEM
   ========================================================================== */
function initEcosystem() {
  const shell = byId('ecosystemShell');
  const panel = byId('ecoPanel');
  const R = 40;
  const positions = {};
  groupCompanies.forEach((c) => {
    const rad = (c.angle * Math.PI) / 180;
    positions[c.id] = { x: 50 + R * Math.cos(rad), y: 50 + R * Math.sin(rad) };
  });

  const linesSvg = groupCompanies.map((c) => {
    const p = positions[c.id];
    return `<path class="eco-line" data-id="${c.id}" d="M 50 50 L ${p.x} ${p.y}" vector-effect="non-scaling-stroke"></path>`;
  }).join('');

  shell.innerHTML = `
    <svg class="eco-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${linesSvg}</svg>
    <div class="eco-center"><b>HK</b><span>Consultancy</span></div>
  `;

  groupCompanies.forEach((c) => {
    const p = positions[c.id];
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'eco-node';
    node.style.left = p.x + '%';
    node.style.top = p.y + '%';
    node.dataset.id = c.id;
    node.setAttribute('aria-label', c.name);
    node.innerHTML = `<span class="eco-node-dot"></span><span class="eco-node-label">${escapeHtml(c.name)}</span>`;
    shell.appendChild(node);
  });

  const renderPanel = (c) => {
    panel.innerHTML = `
      <p class="eco-panel-cat">${escapeHtml(c.category || 'HK Group Company')}</p>
      <h3 class="headline eco-panel-name" style="color:var(--ivory)">${escapeHtml(c.name)}</h3>
      <p class="eco-panel-desc">${escapeHtml(c.description)}</p>
    `;
  };

  const setActive = (id) => {
    const c = groupCompanies.find((x) => x.id === id);
    if (!c) return;
    qsa('.eco-node', shell).forEach((n) => n.classList.toggle('is-active', n.dataset.id === id));
    qsa('.eco-line', shell).forEach((l) => l.classList.toggle('is-active', l.dataset.id === id));
    renderPanel(c);
  };

  shell.addEventListener('click', (e) => {
    const node = e.target.closest('.eco-node');
    if (node) setActive(node.dataset.id);
  });
  qsa('.eco-node', shell).forEach((node) => {
    node.addEventListener('focus', () => setActive(node.dataset.id));
  });

  setActive(groupCompanies[1].id); // Maplitho — a company with real, described work
}

/* ==========================================================================
   PEOPLE INDEX
   ========================================================================== */
function initPeople() {
  const listsEl = byId('peopleLists');
  const detailEl = byId('peopleDetail');
  const tabs = qsa('.people-tab');
  const groups = ['core', 'directors', 'advisory'];

  const initials = (name) => name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  listsEl.innerHTML = groups.map((g) => `
    <div class="people-list-panel${g === 'core' ? ' is-active' : ''}" data-group="${g}">
      ${people[g].map((p, i) => `
        <button type="button" class="people-row" data-group="${g}" data-idx="${i}">
          <span class="people-row-idx">${String(i + 1).padStart(2, '0')}</span>
          <span class="people-row-name">${escapeHtml(p.name)}</span>
          <span class="people-row-loc">${escapeHtml(p.loc)}</span>
        </button>
      `).join('')}
    </div>
  `).join('');

  const renderDetail = (p) => {
    detailEl.innerHTML = `
      <div class="people-detail-mono">${initials(p.name)}</div>
      <h3 class="headline people-detail-name">${escapeHtml(p.name)}</h3>
      <p class="people-detail-role">${escapeHtml(p.role)}</p>
      <p class="people-detail-loc">${escapeHtml(p.loc)}</p>
      <p class="people-detail-bio">${escapeHtml(p.bio)}</p>
    `;
  };

  const selectRow = (row) => {
    const g = row.dataset.group;
    const idx = Number(row.dataset.idx);
    const p = people[g][idx];
    qsa('.people-row', listsEl).forEach((r) => r.classList.remove('is-active'));
    row.classList.add('is-active');
    renderDetail(p);
  };

  listsEl.addEventListener('click', (e) => {
    const row = e.target.closest('.people-row');
    if (row) selectRow(row);
  });
  listsEl.addEventListener('mouseover', (e) => {
    const row = e.target.closest('.people-row');
    if (row) selectRow(row);
  });
  listsEl.addEventListener('focusin', (e) => {
    const row = e.target.closest('.people-row');
    if (row) selectRow(row);
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      const g = tab.dataset.tab;
      qsa('.people-list-panel', listsEl).forEach((panel) => panel.classList.toggle('is-active', panel.dataset.group === g));
      const firstRow = qs(`.people-list-panel[data-group="${g}"] .people-row`, listsEl);
      if (firstRow) selectRow(firstRow);
    });
  });

  const firstRow = qs('.people-row', listsEl);
  if (firstRow) selectRow(firstRow);
}

/* ==========================================================================
   TIMELINE
   ========================================================================== */
function initTimeline() {
  const scroller = byId('timelineScroller');
  const fill = byId('timelineFill');

  scroller.innerHTML = timeline.map((t) => `
    <div class="timeline-item">
      <p class="timeline-year">${escapeHtml(t.year)}</p>
      <p class="timeline-place">${escapeHtml(t.place)}</p>
      <h3 class="headline timeline-title" style="color:var(--ivory)">${escapeHtml(t.title)}</h3>
      <p class="timeline-text">${escapeHtml(t.text)}</p>
    </div>
  `).join('');

  const updateFill = () => {
    const max = scroller.scrollWidth - scroller.clientWidth;
    const pct = max > 0 ? (scroller.scrollLeft / max) * 100 : 0;
    fill.style.width = pct + '%';
  };
  updateFill();
  scroller.addEventListener('scroll', updateFill, { passive: true });
  window.addEventListener('resize', updateFill);
}

/* ==========================================================================
   INSIGHTS
   ========================================================================== */
function initInsights() {
  const el = byId('insightsCats');
  el.innerHTML = insightCategories.map((c) => `
    <div class="insights-cat-row" role="listitem">
      <span>${escapeHtml(c)}</span>
      <span class="insights-cat-tag">0 articles</span>
    </div>
  `).join('');
}

/* ==========================================================================
   CONTACT — conversational enquiry
   ========================================================================== */
function initContact() {
  const convo = byId('convo');
  const officesList = byId('officesList');

  officesList.innerHTML = offices.map((o) => `
    <div class="office-row">
      <span class="office-flag" aria-hidden="true">${o.flag}</span>
      <div>
        <p class="office-country">${escapeHtml(o.country)}</p>
        <p class="office-detail">${o.detail}</p>
      </div>
    </div>
  `).join('');

  const state = { topic: null, name: '', company: '', email: '', phone: '', message: '' };
  let step = 1;
  const totalSteps = 3;

  function render() {
    convo.innerHTML = `
      <div class="convo-step${step === 1 ? ' is-active' : ''}" data-step="1">
        <p class="convo-q">What can we help you with?</p>
        <div class="convo-options" role="listbox" aria-label="Enquiry topic">
          ${contactOptions.map((o) => `<button type="button" class="convo-option${state.topic === o.id ? ' is-selected' : ''}" data-id="${o.id}" role="option" aria-selected="${state.topic === o.id}">${escapeHtml(o.label)}</button>`).join('')}
        </div>
      </div>

      <div class="convo-step${step === 2 ? ' is-active' : ''}" data-step="2">
        <p class="convo-q">A little about you.</p>
        <div class="convo-fields">
          <div class="convo-row">
            <div class="fld"><label for="fldName">Full name</label><input id="fldName" type="text" autocomplete="name" value="${escapeHtml(state.name)}" required /></div>
            <div class="fld"><label for="fldCompany">Company</label><input id="fldCompany" type="text" autocomplete="organization" value="${escapeHtml(state.company)}" /></div>
          </div>
          <div class="convo-row">
            <div class="fld"><label for="fldEmail">Email address</label><input id="fldEmail" type="email" autocomplete="email" value="${escapeHtml(state.email)}" required /></div>
            <div class="fld"><label for="fldPhone">Phone</label><input id="fldPhone" type="tel" autocomplete="tel" value="${escapeHtml(state.phone)}" /></div>
          </div>
          <div class="fld"><label for="fldMessage">Tell us about your business and goals</label><textarea id="fldMessage" required>${escapeHtml(state.message)}</textarea></div>
        </div>
      </div>

      <div class="convo-step${step === 3 ? ' is-active' : ''}" data-step="3">
        <p class="convo-q">Ready to send.</p>
        <div class="convo-summary">
          <p class="convo-summary-label">Enquiry</p>
          <p class="convo-summary-value">${escapeHtml(contactOptions.find((o) => o.id === state.topic)?.label || '—')}</p>
        </div>
        <p class="stone-text" style="line-height:1.8;font-size:0.88rem;">${escapeHtml(state.name)}${state.company ? ' · ' + escapeHtml(state.company) : ''}<br>${escapeHtml(state.email)}${state.phone ? ' · ' + escapeHtml(state.phone) : ''}</p>
      </div>

      <div class="convo-step${step === 4 ? ' is-active' : ''}" data-step="4">
        <div class="convo-success">
          <p class="eyebrow" style="justify-content:center;">Thank you</p>
          <h3 class="headline" style="font-size:1.6rem;">Your message is ready to send.</h3>
          <p>This opens your email client with everything filled in, addressed to info@honestandkeen.com. Prefer WhatsApp? Use the discreet option alongside.</p>
        </div>
      </div>

      <div class="convo-nav" ${step === 4 ? 'hidden' : ''}>
        <button type="button" class="convo-back" ${step === 1 ? 'hidden' : ''} id="convoBack">
          <svg width="14" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true"><path d="M15 5H1M1 5L5 1M1 5L5 9" stroke="currentColor" stroke-width="1.2"/></svg>
          Back
        </button>
        <div class="convo-progress" aria-hidden="true">
          ${Array.from({ length: totalSteps }).map((_, i) => `<span class="${i < step ? 'is-done' : ''}"></span>`).join('')}
        </div>
        <button type="button" class="btn btn-primary" id="convoNext">${step === 3 ? 'Send Message' : 'Continue'}</button>
      </div>
    `;
    bind();
  }

  function bind() {
    qsa('.convo-option', convo).forEach((btn) => {
      btn.addEventListener('click', () => {
        state.topic = btn.dataset.id;
        step = 2;
        render();
      });
    });

    const back = qs('#convoBack', convo);
    if (back) back.addEventListener('click', () => { step = Math.max(1, step - 1); render(); });

    const next = qs('#convoNext', convo);
    if (next) next.addEventListener('click', () => {
      if (step === 2) {
        const name = qs('#fldName', convo);
        const email = qs('#fldEmail', convo);
        const message = qs('#fldMessage', convo);
        state.name = name.value.trim();
        state.company = qs('#fldCompany', convo).value.trim();
        state.email = email.value.trim();
        state.phone = qs('#fldPhone', convo).value.trim();
        state.message = message.value.trim();
        if (!state.name || !state.email || !state.message) {
          [name, email, message].forEach((el) => {
            if (!el.value.trim()) el.style.borderColor = '#b23b3b';
          });
          return;
        }
        step = 3;
        render();
        return;
      }
      if (step === 3) {
        const topicLabel = contactOptions.find((o) => o.id === state.topic)?.label || 'General enquiry';
        const subject = encodeURIComponent(`${topicLabel} — enquiry via hkbusinessconsultancy.com`);
        const bodyLines = [
          `Topic: ${topicLabel}`,
          `Name: ${state.name}`,
          state.company ? `Company: ${state.company}` : null,
          `Email: ${state.email}`,
          state.phone ? `Phone: ${state.phone}` : null,
          '',
          state.message,
        ].filter(Boolean);
        const body = encodeURIComponent(bodyLines.join('\n'));
        window.location.href = `mailto:${brand.email}?subject=${subject}&body=${body}`;
        step = 4;
        render();
        return;
      }
    });
  }

  render();
}

/* ==========================================================================
   MODAL
   ========================================================================== */
let lastFocused = null;
function openModal({ cat, title, body }) {
  const overlay = byId('modal');
  byId('modalCat').textContent = cat || '';
  byId('modalTitle').textContent = title || '';
  byId('modalBody').textContent = body || '';
  lastFocused = document.activeElement;
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  byId('modalClose').focus();
}
function closeModal() {
  const overlay = byId('modal');
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
  if (lastFocused) lastFocused.focus();
}
function initModal() {
  byId('modalClose').addEventListener('click', closeModal);
  byId('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && byId('modal').classList.contains('is-open')) closeModal();
  });
}

/* ==========================================================================
   INIT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initMarquee();
  initHeroNetwork();
  initApproachWheel();
  initJourneys();
  initMarkets();
  initPortfolio();
  initEcosystem();
  initPeople();
  initTimeline();
  initInsights();
  initContact();
  initModal();
  initReveal();
});
