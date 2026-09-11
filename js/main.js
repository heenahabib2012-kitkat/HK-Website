/* ==========================================================================
   HK Business Consultancy — Main script
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     Preloader
     ------------------------------------------------------------------ */
  (function preloader() {
    var el = document.getElementById("preloader");
    var pct = document.getElementById("preloaderPercent");
    if (!el) return;
    var progress = 0;
    var timer = setInterval(function () {
      progress += Math.random() * 18;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        setTimeout(function () {
          el.classList.add("is-hidden");
          document.body.style.overflow = "";
        }, 250);
      }
      if (pct) pct.textContent = Math.floor(progress) + "%";
    }, 120);

    document.body.style.overflow = "hidden";
    window.addEventListener("load", function () {
      setTimeout(function () {
        document.body.style.overflow = "";
      }, 900);
    });
  })();

  /* ------------------------------------------------------------------
     Custom cursor
     ------------------------------------------------------------------ */
  (function cursor() {
    var dot = document.getElementById("cursorDot");
    var ring = document.getElementById("cursorRing");
    if (!dot || !ring || window.matchMedia("(hover: none)").matches) return;

    var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    var ringX = mouseX, ringY = mouseY;

    window.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = "translate(" + mouseX + "px," + mouseY + "px) translate(-50%,-50%)";
    });

    function raf() {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ring.style.transform = "translate(" + ringX + "px," + ringY + "px) translate(-50%,-50%)";
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    var interactive = "a, button, input, textarea, select, [data-tilt]";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(interactive)) ring.classList.add("is-active");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(interactive)) ring.classList.remove("is-active");
    });
  })();

  /* ------------------------------------------------------------------
     Starfield canvas
     ------------------------------------------------------------------ */
  (function starfield() {
    var canvas = document.getElementById("starfield");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var stars = [];
    var shootingStars = [];
    var w, h, dpr;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    }

    function buildStars() {
      var count = Math.round((w * h) / 9000);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.4 + 0.3,
          baseAlpha: Math.random() * 0.6 + 0.3,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    window.addEventListener("mousemove", function (e) {
      targetX = (e.clientX / w - 0.5) * 14;
      targetY = (e.clientY / h - 0.5) * 14;
    });

    var t = 0;
    function draw() {
      t += 1;
      ctx.clearRect(0, 0, w, h);

      mouseX += (targetX - mouseX) * 0.02;
      mouseY += (targetY - mouseY) * 0.02;

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var alpha = s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.phase) * 0.35;
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255," + Math.max(0, Math.min(1, alpha)) + ")";
        ctx.arc(s.x + mouseX, s.y + mouseY, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion && Math.random() < 0.006 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * w * 0.6 + w * 0.2,
          y: Math.random() * h * 0.3,
          len: Math.random() * 120 + 80,
          speed: Math.random() * 9 + 7,
          angle: Math.PI / 4,
          life: 1
        });
      }
      for (var j = shootingStars.length - 1; j >= 0; j--) {
        var sh = shootingStars[j];
        sh.x += Math.cos(sh.angle) * sh.speed;
        sh.y += Math.sin(sh.angle) * sh.speed;
        sh.life -= 0.02;
        var grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.len * Math.cos(sh.angle), sh.y - sh.len * Math.sin(sh.angle));
        grad.addColorStop(0, "rgba(255,255,255," + sh.life + ")");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - sh.len * Math.cos(sh.angle), sh.y - sh.len * Math.sin(sh.angle));
        ctx.stroke();
        if (sh.life <= 0 || sh.y > h) shootingStars.splice(j, 1);
      }

      requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    resize();
    draw();
  })();

  /* ------------------------------------------------------------------
     Scroll progress bar + nav scroll state
     ------------------------------------------------------------------ */
  (function scrollChrome() {
    var progress = document.getElementById("scrollProgress");
    var nav = document.getElementById("nav");
    var backToTop = document.getElementById("backToTop");

    function onScroll() {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      if (progress) progress.style.width = pct + "%";
      if (nav) nav.classList.toggle("is-scrolled", scrollTop > 40);
      if (backToTop) backToTop.classList.toggle("is-visible", scrollTop > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (backToTop) {
      backToTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  })();

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  (function mobileMenu() {
    var burger = document.getElementById("navBurger");
    var menu = document.getElementById("mobileMenu");
    if (!burger || !menu) return;

    function close() {
      burger.classList.remove("is-open");
      menu.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    }
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    menu.querySelectorAll("[data-nav-mobile]").forEach(function (a) {
      a.addEventListener("click", close);
    });
  })();

  /* ------------------------------------------------------------------
     Active nav link on scroll (IntersectionObserver)
     ------------------------------------------------------------------ */
  (function activeNav() {
    var links = document.querySelectorAll("[data-nav]");
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute("href");
      var section = id && id.startsWith("#") ? document.querySelector(id) : null;
      if (section) sections.push({ link: link, section: section });
    });
    if (!sections.length || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var match = sections.find(function (s) { return s.section === entry.target; });
          if (!match) return;
          if (entry.isIntersecting) {
            links.forEach(function (l) { l.classList.remove("active"); });
            match.link.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach(function (s) { observer.observe(s.section); });
  })();

  /* ------------------------------------------------------------------
     Reveal-on-scroll (GSAP if available, else IntersectionObserver)
     ------------------------------------------------------------------ */
  (function reveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      items.forEach(function (item, i) {
        gsap.to(item, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          delay: (i % 3) * 0.08,
          scrollTrigger: {
            trigger: item,
            start: "top 88%",
            toggleActions: "play none none none"
          }
        });
      });
    } else if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      items.forEach(function (item) { io.observe(item); });
    } else {
      items.forEach(function (item) { item.classList.add("is-visible"); });
    }
  })();

  /* ------------------------------------------------------------------
     Animated counters
     ------------------------------------------------------------------ */
  (function counters() {
    var counters = document.querySelectorAll(".counter");
    if (!counters.length || !("IntersectionObserver" in window)) return;

    function animateCounter(el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var duration = 1600;
      var start = null;

      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target;
        }
      }
      requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (c) { io.observe(c); });
  })();

  /* ------------------------------------------------------------------
     Service card tilt + spotlight
     ------------------------------------------------------------------ */
  (function tiltCards() {
    var cards = document.querySelectorAll("[data-tilt]");
    if (!cards.length || window.matchMedia("(hover: none)").matches) return;

    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cx = rect.width / 2;
        var cy = rect.height / 2;
        var rotateX = ((y - cy) / cy) * -6;
        var rotateY = ((x - cx) / cx) * 6;
        card.style.transform = "perspective(700px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) translateY(-4px)";
        card.style.setProperty("--mx", x + "px");
        card.style.setProperty("--my", y + "px");
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "perspective(700px) rotateX(0) rotateY(0) translateY(0)";
      });
    });
  })();

  /* ------------------------------------------------------------------
     Timeline fill animation
     ------------------------------------------------------------------ */
  (function timelineFill() {
    var fill = document.getElementById("timelineFill");
    var timeline = document.querySelector(".timeline");
    if (!fill || !timeline || !("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            fill.style.width = "100%";
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(timeline);
  })();

  /* ------------------------------------------------------------------
     Testimonial slider
     ------------------------------------------------------------------ */
  (function testimonialSlider() {
    var track = document.getElementById("testimonialTrack");
    var dotsWrap = document.getElementById("testimonialDots");
    var prevBtn = document.getElementById("testimonialPrev");
    var nextBtn = document.getElementById("testimonialNext");
    if (!track || !dotsWrap) return;

    var slides = track.children.length;
    var index = 0;
    var autoplayId;

    for (var i = 0; i < slides; i++) {
      var dot = document.createElement("button");
      if (i === 0) dot.classList.add("is-active");
      dot.setAttribute("aria-label", "Go to testimonial " + (i + 1));
      dot.addEventListener("click", function (idx) {
        return function () { goTo(idx); };
      }(i));
      dotsWrap.appendChild(dot);
    }
    var dots = dotsWrap.querySelectorAll("button");

    function goTo(i) {
      index = (i + slides) % slides;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach(function (d, di) { d.classList.toggle("is-active", di === index); });
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    if (nextBtn) nextBtn.addEventListener("click", function () { next(); restartAutoplay(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); restartAutoplay(); });

    function startAutoplay() {
      if (reduceMotion) return;
      autoplayId = setInterval(next, 6000);
    }
    function restartAutoplay() {
      clearInterval(autoplayId);
      startAutoplay();
    }

    var slider = document.querySelector(".testimonial-slider");
    if (slider) {
      slider.addEventListener("mouseenter", function () { clearInterval(autoplayId); });
      slider.addEventListener("mouseleave", startAutoplay);
    }

    startAutoplay();
  })();

  /* ------------------------------------------------------------------
     Contact form (client-side validation + simulated submit)
     ------------------------------------------------------------------ */
  (function contactForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;
    var submitBtn = document.getElementById("formSubmit");
    var success = document.getElementById("formSuccess");

    function validateField(field) {
      var wrap = field.closest(".form-field");
      if (!wrap) return true;
      var valid = field.checkValidity();
      wrap.classList.toggle("has-error", !valid);
      return valid;
    }

    form.querySelectorAll("input[required], textarea[required]").forEach(function (field) {
      field.addEventListener("blur", function () { validateField(field); });
      field.addEventListener("input", function () {
        if (field.closest(".form-field").classList.contains("has-error")) validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var requiredFields = form.querySelectorAll("input[required], textarea[required]");
      var isValid = true;
      requiredFields.forEach(function (field) {
        if (!validateField(field)) isValid = false;
      });
      if (!isValid) return;

      submitBtn.classList.add("is-loading");
      submitBtn.disabled = true;
      success.classList.remove("is-visible");

      setTimeout(function () {
        submitBtn.classList.remove("is-loading");
        submitBtn.disabled = false;
        success.classList.add("is-visible");
        form.reset();
        setTimeout(function () { success.classList.remove("is-visible"); }, 6000);
      }, 1200);
    });
  })();

  /* ------------------------------------------------------------------
     Newsletter form (footer)
     ------------------------------------------------------------------ */
  (function newsletterForm() {
    var form = document.getElementById("newsletterForm");
    var success = document.getElementById("newsletterSuccess");
    if (!form || !success) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      success.classList.add("is-visible");
      form.reset();
      setTimeout(function () { success.classList.remove("is-visible"); }, 5000);
    });
  })();

  /* ------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------ */
  (function footerYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  })();

})();
