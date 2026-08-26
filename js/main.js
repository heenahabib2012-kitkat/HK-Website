(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------
     Lenis smooth scroll (progressive enhancement)
     --------------------------------------------------------- */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    if (hasScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
  window.__hkLenis = lenis;

  /* ---------------------------------------------------------
     Scroll progress bar
     --------------------------------------------------------- */
  const progressFill = document.getElementById("scrollProgressFill");
  if (progressFill) {
    if (reduceMotion) progressFill.style.transition = "none";
    const updateProgress = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
      progressFill.style.width = pct + "%";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  /* ---------------------------------------------------------
     Nav: scrolled state + mobile fullscreen menu
     --------------------------------------------------------- */
  const nav = document.getElementById("siteNav");
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const navToggle = document.getElementById("navToggle");
  const navMobile = document.getElementById("navMobile");
  if (navToggle && navMobile) {
    const open = () => {
      navMobile.hidden = false;
      requestAnimationFrame(() => navMobile.classList.add("is-open"));
      navToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      navMobile.querySelector("a")?.focus();
    };
    const close = () => {
      navMobile.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      setTimeout(() => { navMobile.hidden = true; }, reduceMotion ? 0 : 500);
    };
    navToggle.addEventListener("click", () => {
      navMobile.classList.contains("is-open") ? close() : open();
    });
    navMobile.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navMobile.classList.contains("is-open")) {
        close();
        navToggle.focus();
      }
    });
  }

  /* ---------------------------------------------------------
     Split-text: wrap headline text into masked lines
     --------------------------------------------------------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    const html = el.innerHTML;
    const parts = html.split(/<br\s*\/?>/i);
    el.innerHTML = parts
      .map(
        (part) =>
          `<span class="split-line-mask"><span class="split-line">${part}</span></span>`
      )
      .join("");
  });

  /* ---------------------------------------------------------
     Reveal on scroll: [data-reveal] elements reveal themselves.
     .split-line elements are clipped by their own overflow:hidden
     mask, so observing them directly never registers as
     intersecting (an ancestor clip zeroes the visible area per
     the IntersectionObserver spec) — observe the unclipped
     .split-line-mask wrapper instead and reveal its child.
     --------------------------------------------------------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  const maskEls = document.querySelectorAll(".split-line-mask");
  const revealTarget = (el) => {
    const line = el.classList.contains("split-line-mask") ? el.querySelector(".split-line") : el;
    line.classList.add("is-visible");
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealTarget(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
    maskEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    maskEls.forEach((el) => revealTarget(el));
  }

  /* ---------------------------------------------------------
     Magnetic buttons (desktop, fine pointer only)
     --------------------------------------------------------- */
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (canHover && !reduceMotion) {
    document.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------
     Cursor dot
     --------------------------------------------------------- */
  const dot = document.getElementById("cursorDot");
  if (dot && canHover) {
    let x = 0, y = 0, dx = 0, dy = 0;
    window.addEventListener("mousemove", (e) => {
      x = e.clientX; y = e.clientY;
      dot.style.opacity = "1";
    });
    const animateDot = () => {
      dx += (x - dx) * 0.18;
      dy += (y - dy) * 0.18;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%,-50%)`;
      requestAnimationFrame(animateDot);
    };
    if (!reduceMotion) requestAnimationFrame(animateDot);
    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        dot.style.width = "22px"; dot.style.height = "22px";
      });
      el.addEventListener("mouseleave", () => {
        dot.style.width = "8px"; dot.style.height = "8px";
      });
    });
  }

  /* ---------------------------------------------------------
     Grain canvas (subtle, static-ish film grain)
     --------------------------------------------------------- */
  const grainCanvas = document.getElementById("grainCanvas");
  if (grainCanvas && !reduceMotion) {
    const ctx = grainCanvas.getContext("2d");
    const resize = () => {
      grainCanvas.width = window.innerWidth;
      grainCanvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = grainCanvas.width, h = grainCanvas.height;
      const imgData = ctx.createImageData(w, h);
      const buffer = new Uint32Array(imgData.data.buffer);
      for (let i = 0; i < buffer.length; i++) {
        const v = (Math.random() * 255) | 0;
        buffer[i] = (255 << 24) | (v << 16) | (v << 8) | v;
      }
      ctx.putImageData(imgData, 0, 0);
    };
    let last = 0;
    const loop = (t) => {
      if (t - last > 90) { draw(); last = t; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  } else if (grainCanvas) {
    grainCanvas.remove();
  }
})();
