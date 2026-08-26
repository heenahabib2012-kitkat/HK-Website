(() => {
  "use strict";
  const wrap = document.getElementById("journeyTimeline");
  const fill = document.getElementById("journeyFill");
  if (!wrap || !fill) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== "undefined";

  if (hasScrollTrigger) {
    gsap.to(fill, {
      height: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top 60%",
        end: "bottom 70%",
        scrub: true,
      },
    });
    return;
  }

  // Fallback: manual scroll-progress calculation
  const update = () => {
    const r = wrap.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = r.height + vh * 0.3;
    const passed = vh * 0.6 - r.top;
    const pct = Math.max(0, Math.min(1, passed / total));
    fill.style.height = reduceMotion ? "100%" : pct * 100 + "%";
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
