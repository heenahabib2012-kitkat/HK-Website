(() => {
  "use strict";
  const scroller = document.getElementById("brandsScroller");
  const trackWrap = scroller ? scroller.querySelector(".brands__track-wrap") : null;
  const track = document.getElementById("brandsTrack");
  if (!scroller || !trackWrap || !track) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isNarrow = window.matchMedia("(max-width: 760px)").matches;

  // On touch/narrow screens, or with reduced motion, keep the plain
  // native overflow-x scroll-snap track (already works via CSS alone) —
  // no scroll-driven effect, nothing to go wrong.
  if (reduceMotion || isNarrow) return;

  track.style.overflow = "visible";

  const BUFFER = 48;
  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + BUFFER);
  const stickyTop = () => parseFloat(getComputedStyle(trackWrap).top) || 0;

  const layout = () => {
    scroller.style.height = window.innerHeight + distance() + "px";
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    const total = distance();
    if (total <= 0) {
      track.style.transform = "";
      return;
    }
    const scrolledIntoPin = stickyTop() - scroller.getBoundingClientRect().top;
    const progress = Math.min(1, Math.max(0, scrolledIntoPin / total));
    track.style.transform = `translate3d(${-progress * total}px, 0, 0)`;
  };
  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  layout();
  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => { layout(); requestUpdate(); });
  window.addEventListener("load", () => { layout(); requestUpdate(); });
})();
