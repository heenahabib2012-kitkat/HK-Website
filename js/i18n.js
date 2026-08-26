(() => {
  "use strict";
  const STORAGE_KEY = "hk-lang";
  const TITLE_EN = document.title;
  const TITLE_AR = "حبيب كويا — رائد أعمال، استراتيجي، صانع علامات تجارية";

  const nodes = Array.from(document.querySelectorAll("[data-ar]"));
  // Cache the original English markup once, before anything else touches it.
  nodes.forEach((el) => {
    if (!el.hasAttribute("data-en")) el.setAttribute("data-en", el.innerHTML);
  });

  // Re-wrap a [data-split] headline into the masked-line structure main.js
  // builds on load. Needed only when toggling *after* main.js already ran —
  // on first load with a saved Arabic preference, this script runs before
  // main.js and just sets plain text, letting main.js wrap it normally.
  const wrapSplitLines = (el) => {
    const html = el.innerHTML;
    const parts = html.split(/<br\s*\/?>/i);
    el.innerHTML = parts
      .map((part) => `<span class="split-line-mask"><span class="split-line is-visible">${part}</span></span>`)
      .join("");
  };

  const applyLang = (lang, opts) => {
    const persist = !opts || opts.persist !== false;
    const isAr = lang === "ar";

    document.documentElement.lang = isAr ? "ar" : "en";
    document.documentElement.dir = isAr ? "rtl" : "ltr";

    nodes.forEach((el) => {
      const wasSplit = el.hasAttribute("data-split") && !!el.querySelector(".split-line-mask");
      el.innerHTML = isAr ? el.getAttribute("data-ar") : el.getAttribute("data-en");
      if (wasSplit) wrapSplitLines(el);
      // Only force reveal on a runtime toggle (after main.js's own scroll
      // observer already ran) — on first load, let it observe and reveal
      // these fresh so the entrance animation still plays normally.
      if (window.__hkMainInitialized && el.hasAttribute("data-reveal")) {
        el.classList.add("is-visible");
      }
    });

    document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
      btn.textContent = isAr ? "EN" : "عربي";
      btn.setAttribute("aria-label", isAr ? "Switch to English" : "التبديل إلى العربية");
    });
    document.title = isAr ? TITLE_AR : TITLE_EN;

    // Layout-sensitive scripts (brand scroller width, globe/grain canvas
    // sizing) only recompute on scroll/resize — nudge them after a swap.
    window.dispatchEvent(new Event("resize"));

    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    }
  };

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang-toggle]");
    if (!btn) return;
    const isAr = document.documentElement.lang === "ar";
    applyLang(isAr ? "en" : "ar");
  });

  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (saved === "ar") applyLang("ar", { persist: false });
})();
