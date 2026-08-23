(() => {
  "use strict";
  const cycle = document.getElementById("mentorshipCycle");
  if (!cycle) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const words = Array.from(cycle.querySelectorAll("span"));
  if (reduceMotion || words.length < 2) return;

  let index = 0;
  let timer = null;

  const step = () => {
    words[index].classList.remove("is-active");
    index = (index + 1) % words.length;
    words[index].classList.add("is-active");
  };

  const start = () => { if (!timer) timer = setInterval(step, 1400); };
  const stop = () => { clearInterval(timer); timer = null; };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? start() : stop()));
    }, { threshold: 0.4 }).observe(cycle);
  } else {
    start();
  }
})();
