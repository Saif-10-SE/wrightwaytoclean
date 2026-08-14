(() => {
  document.documentElement.classList.add("js");

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const hidePreloader = () => $("#preloader")?.classList.add("hide");
  window.addEventListener("DOMContentLoaded", () => setTimeout(hidePreloader, 180));
  setTimeout(hidePreloader, 1400);

  const chrome = $("#siteChrome");
  const progress = $(".scroll-progress");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (chrome) chrome.classList.toggle("scrolled", y > 40);
      if (progress) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = h > 0 ? `${(y / h) * 100}%` : "0%";
      }
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = $(".menu-toggle");
  const nav = $(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
      document.body.classList.toggle("nav-open");
    });
    $$(".nav a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        document.body.classList.remove("nav-open");
      })
    );
  }

  const video = $("#heroVideo");
  const saveData = navigator.connection?.saveData === true;
  const slowNet = /2g/.test(navigator.connection?.effectiveType || "");
  const allowVideo =
    video &&
    window.matchMedia("(min-width: 900px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !saveData &&
    !slowNet;

  if (allowVideo) {
    const start = () => {
      if (video.dataset.ready) return;
      video.dataset.ready = "1";
      video.preload = "metadata";
      video.load();
      const play = () => {
        video.muted = true;
        const p = video.play();
        if (p) p.then(() => video.classList.add("is-on")).catch(() => {});
      };
      video.addEventListener("canplay", play, { once: true });
      play();
    };
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 600));
    idle(start, { timeout: 1800 });

    const vio = new IntersectionObserver(
      ([e]) => {
        if (!video.dataset.ready) return;
        if (e.isIntersecting) video.play().then(() => video.classList.add("is-on")).catch(() => {});
        else video.pause();
      },
      { threshold: 0.2 }
    );
    vio.observe(video);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) video.pause();
      else if (video.dataset.ready) video.play().catch(() => {});
    });
  } else if (video) {
    video.removeAttribute("src");
    video.querySelectorAll("source").forEach((s) => s.remove());
    video.load();
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in", "in-view");
        io.unobserve(e.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  $$(".reveal-on").forEach((el) => io.observe(el));

  const counters = $$("[data-count]");
  if (counters.length) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          const target = +el.dataset.count;
          const suffix = el.dataset.suffix || "";
          const start = performance.now();
          const dur = 1200;
          const tick = (now) => {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          cio.unobserve(el);
        });
      },
      { threshold: 0.45 }
    );
    counters.forEach((c) => cio.observe(c));
  }

  $$(".faq-item button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      const open = item.classList.contains("open");
      $$(".faq-item").forEach((i) => i.classList.remove("open"));
      if (!open) item.classList.add("open");
    });
  });

  const slider = $(".quotes-slider");
  const track = $("#quotes-track");
  if (slider && track) {
    const viewport = slider.querySelector(".quotes-viewport");
    const cards = $$(".quote-card", track);
    const gap = 22;
    let index = 0;
    let timer;
    let resizeTimer;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const perView = () => {
      const w = window.innerWidth;
      if (w < 700) return 1;
      if (w < 1020) return 2;
      return 3;
    };

    const layout = () => {
      const p = perView();
      const width = (viewport.clientWidth - gap * (p - 1)) / p;
      cards.forEach((c) => {
        c.style.flex = `0 0 ${width}px`;
        c.style.width = `${width}px`;
      });
      const max = Math.max(0, cards.length - p);
      if (index > max) index = 0;
      track.style.transform = `translateX(${-index * (width + gap)}px)`;
    };

    const go = (dir) => {
      const p = perView();
      const max = Math.max(0, cards.length - p);
      index += dir;
      if (index > max) index = 0;
      if (index < 0) index = max;
      const width = cards[0].getBoundingClientRect().width;
      track.style.transform = `translateX(${-index * (width + gap)}px)`;
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const play = () => {
      if (reduce) return;
      stop();
      timer = setInterval(() => go(1), 5000);
    };

    $("#qPrev")?.addEventListener("click", () => {
      go(-1);
      play();
    });
    $("#qNext")?.addEventListener("click", () => {
      go(1);
      play();
    });
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", play);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else play();
    });
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 120);
    });
    layout();
    play();
  }

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  const handleForm = (form) => {
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = form.querySelector(".form-success");
      form.querySelectorAll("input, select, textarea, button[type=submit]").forEach((el) => {
        if (el.type !== "hidden") el.style.display = el.tagName === "BUTTON" ? "none" : el.style.display;
      });
      form.querySelectorAll(".field, .btn").forEach((el) => (el.style.display = "none"));
      if (ok) ok.classList.add("show");
      form.reset();
    });
  };
  handleForm($("#bookForm"));
  handleForm($("#contactForm"));
})();
