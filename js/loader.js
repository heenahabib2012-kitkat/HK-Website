(() => {
  "use strict";
  const loader = document.getElementById("loader");
  const fill = document.getElementById("loaderFill");
  if (!loader) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let progress = 0;
  const tick = () => {
    progress = Math.min(progress + (Math.random() * 18 + 6), 92);
    if (fill) fill.style.width = progress + "%";
    if (progress < 92) setTimeout(tick, 140);
  };
  tick();

  const finish = () => {
    if (fill) fill.style.width = "100%";
    setTimeout(() => {
      loader.classList.add("is-hidden");
      document.body.style.overflow = "";
    }, reduceMotion ? 0 : 260);
  };

  document.body.style.overflow = "hidden";
  if (document.readyState === "complete") {
    finish();
  } else {
    window.addEventListener("load", finish, { once: true });
    // safety net: never hold the page hostage
    setTimeout(finish, 3500);
  }
})();
