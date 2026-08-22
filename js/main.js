(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Fullscreen index overlay — open/close, focus trap, Escape
     --------------------------------------------------------- */
  const toggle = document.getElementById("navToggle");
  const overlay = document.getElementById("navOverlay");
  const closeBtn = document.getElementById("navClose");

  if (toggle && overlay && closeBtn) {
    let lastFocused = null;

    const focusableSelector = 'a[href], button:not([disabled])';

    const openOverlay = () => {
      lastFocused = document.activeElement;
      overlay.hidden = false;
      document.body.style.overflow = "hidden";
      toggle.setAttribute("aria-expanded", "true");
      requestAnimationFrame(() => overlay.classList.add("is-open"));
      const firstLink = overlay.querySelector(focusableSelector);
      if (firstLink) firstLink.focus();
    };

    const closeOverlay = () => {
      overlay.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      const finish = () => { overlay.hidden = true; };
      if (reduceMotion) finish();
      else setTimeout(finish, 350);
      if (lastFocused) lastFocused.focus();
    };

    toggle.addEventListener("click", () => {
      const isOpen = overlay.classList.contains("is-open");
      isOpen ? closeOverlay() : openOverlay();
    });
    closeBtn.addEventListener("click", closeOverlay);

    overlay.addEventListener("click", (e) => {
      if (e.target.tagName === "A") closeOverlay();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) {
        closeOverlay();
        return;
      }
      if (e.key === "Tab" && overlay.classList.contains("is-open")) {
        const focusables = Array.from(overlay.querySelectorAll(focusableSelector));
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ---------------------------------------------------------
     Side rail — highlight the section currently in view
     --------------------------------------------------------- */
  const railLinks = document.querySelectorAll(".rail__list a");
  if (railLinks.length) {
    const map = new Map();
    railLinks.forEach((a) => {
      const id = a.getAttribute("data-section");
      const el = document.getElementById(id);
      if (el) map.set(el, a);
    });

    const railObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = map.get(entry.target);
          if (!link) return;
          if (entry.isIntersecting) {
            railLinks.forEach((l) => l.classList.remove("is-active"));
            link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    map.forEach((_, el) => railObserver.observe(el));
  }

  /* ---------------------------------------------------------
     Case-study scrollytelling — highlight the active phase
     (Problem / Decision / Evidence / Result) as the reader
     scrolls the narrative column. Purely additive: every
     phase is a real, readable <article> in document order,
     this only decorates the sticky index alongside it.
     --------------------------------------------------------- */
  document.querySelectorAll(".case").forEach((caseSection) => {
    const phaseItems = caseSection.querySelectorAll(".case__phases li");
    const blocks = caseSection.querySelectorAll(".case__block");
    if (!phaseItems.length || !blocks.length) return;

    const byPhase = new Map();
    phaseItems.forEach((li) => byPhase.set(li.getAttribute("data-phase"), li));

    const blockObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const phase = entry.target.getAttribute("data-phase");
          const li = byPhase.get(phase);
          if (!li) return;
          phaseItems.forEach((item) => item.classList.remove("is-active"));
          li.classList.add("is-active");
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    blocks.forEach((b) => blockObserver.observe(b));
  });

  /* ---------------------------------------------------------
     Quiet reveal-on-scroll for major content blocks
     --------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    ".origin__grid, .arc__heading, .arc__list, .case__block, .contact__heading, .contact__details"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));

  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }
})();
