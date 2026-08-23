(() => {
  "use strict";
  const section = document.getElementById("brandsSection");
  const track = document.getElementById("brandsTrack");
  if (!section || !track) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  const isNarrow = window.matchMedia("(max-width: 760px)").matches;

  // On touch/narrow screens, or without GSAP, keep the native
  // overflow-x scroll-snap track (already works via CSS alone).
  if (!hasScrollTrigger || reduceMotion || isNarrow) return;

  track.style.overflow = "visible";

  const setDistance = () => Math.max(0, track.scrollWidth - window.innerWidth + 2 * 24);

  let st;
  const build = () => {
    if (st) st.kill();
    st = gsap.to(track, {
      x: () => -setDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + setDistance(),
        scrub: true,
        pin: true,
        invalidateOnRefresh: true,
      },
    });
  };
  build();
  window.addEventListener("resize", () => ScrollTrigger.refresh());
})();
