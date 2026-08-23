(() => {
  "use strict";
  const hero = document.querySelector(".hero");
  const imageWrap = document.getElementById("heroImageWrap");
  const image = document.getElementById("heroImage");
  const nameLines = document.querySelectorAll(".hero__name-line");
  if (!hero || !image) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Cursor-reactive parallax depth (desktop only) */
  if (canHover && !reduceMotion) {
    let px = 0, py = 0, cx = 0, cy = 0;
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    const loop = () => {
      cx += (px - cx) * 0.06;
      cy += (py - cy) * 0.06;
      image.style.transform = `translate3d(${cx * -14}px, ${cy * -10}px, 0) scale(1.04)`;
      nameLines.forEach((line, i) => {
        const depth = (i + 1) * 3;
        line.style.transform = `translate3d(${cx * depth}px, ${cy * depth * 0.6}px, 0)`;
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* Scroll-driven hero image drift + fade of hero content */
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== "undefined";

  if (hasScrollTrigger && !reduceMotion) {
    gsap.to(imageWrap, {
      yPercent: 14,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__content, .hero__stats", {
      opacity: 0,
      y: -40,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "10% top", end: "70% top", scrub: true },
    });
  } else if (!reduceMotion) {
    // Fallback: plain scroll listener, no GSAP
    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        const vh = window.innerHeight;
        if (y < vh) {
          imageWrap.style.transform = `translate3d(0, ${y * 0.15}px, 0)`;
        }
      },
      { passive: true }
    );
  }
})();
