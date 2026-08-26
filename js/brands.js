(() => {
  "use strict";
  // The brand track is a plain horizontally-scrollable list
  // (overflow-x + scroll-snap in CSS) on every device — no JS needed.
  // A GSAP ScrollTrigger pin-and-scrub version was tried here, but
  // pinning the page scroll to drive it proved unreliable (it could
  // leave scrolling stuck partway through the track), so it's been
  // removed in favor of the simple, native scroll that can't jam.
})();
