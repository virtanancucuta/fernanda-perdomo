/* DJ Fernanda Perdomo — interacción
   Todo el contenido existe en el HTML; este archivo solo agrega movimiento.
   Si GSAP/Lenis no cargan (CDN caído) la página queda completa y usable. */
(() => {
  "use strict";

  const CFG = Object.assign({ whatsapp: "573187822041", instagram: "", tiktok: "" }, window.FP_CONFIG || {});
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  /* ---------------- WhatsApp / redes ---------------- */
  const waUrl = (msg) => `https://wa.me/${CFG.whatsapp}` + (msg ? `?text=${encodeURIComponent(msg)}` : "");
  const DEFAULT_MSG = "Hola Fernanda, vi tu página y quiero información para contratarte como DJ.";
  $$("[data-wa]").forEach((a) => {
    a.href = waUrl(a.dataset.waMsg || DEFAULT_MSG);
    a.target = "_blank";
    a.rel = "noopener";
  });
  const tiktok = String(CFG.tiktok || "").replace(/^@/, "").trim();
  $$("[data-tiktok]").forEach((a) => {
    if (!tiktok) return;
    a.href = `https://www.tiktok.com/@${tiktok}`;
    a.hidden = false;
  });
  $$("[data-tiktok-handle]").forEach((b) => { b.textContent = tiktok ? `@${tiktok}` : ""; });

  /* ---------------- Formulario de reserva ---------------- */
  const form = $("[data-book-form]");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const val = (k) => String(d.get(k) || "").trim();
      let fecha = val("fecha");
      if (fecha) {
        const [y, m, dd] = fecha.split("-").map(Number);
        fecha = new Date(y, m - 1, dd).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      }
      const nombre = val("nombre");
      const lines = [
        nombre ? `Hola Fernanda, soy ${nombre}. Quiero reservarte para un evento.` : "Hola Fernanda, quiero reservarte para un evento.",
        "",
        `- Fecha: ${fecha || "por definir"}`,
        `- Ciudad: ${val("ciudad") || "por definir"}`,
        `- Tipo de evento: ${val("tipo") || "por definir"}`,
        `- Duración del set: ${val("horas") || "por definir"}`,
        "",
        "¿Tienes disponibilidad?",
      ];
      window.open(waUrl(lines.join("\n")), "_blank", "noopener");
    });
  }

  /* ---------------- Menú móvil ---------------- */
  const burger = $(".nav__burger");
  const menu = $("#menu");
  const setMenu = (open) => {
    root.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    menu.setAttribute("aria-hidden", String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------------- Scroll suave ---------------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    if (hasGSAP) {
      lenis.on("scroll", window.ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  // anclas internas con offset del nav
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id.length > 1 ? $(id) : null;
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: id === "#top" ? 0 : -10, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    });
  });

  /* ---------------- Nav: sólido + se oculta al bajar ---------------- */
  const nav = $(".nav");
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-solid", y > 40);
    nav.classList.toggle("is-hidden", y > lastY && y > 500 && !root.classList.contains("menu-open"));
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- Cursor + botones magnéticos ---------------- */
  if (finePointer && !reduced) {
    const cursor = $(".cursor");
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const loop = () => {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener("mouseover", (e) => {
      cursor.classList.toggle("is-hover", !!e.target.closest("a, button, input, label, .ph"));
    });
    // Con GSAP el imán se anima con GSAP (no con transición CSS: chocaría con las entradas gsap.from).
    const pull = (el, x, y, d) => {
      if (hasGSAP) gsap.to(el, { x, y, duration: d, ease: "power3.out", overwrite: "auto" });
      else el.style.transform = x || y ? `translate(${x}px, ${y}px)` : "";
    };
    $$(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        pull(el, (e.clientX - r.left - r.width / 2) * 0.25, (e.clientY - r.top - r.height / 2) * 0.35, 0.3);
      });
      el.addEventListener("mouseleave", () => pull(el, 0, 0, 0.5));
    });
  }

  /* ---------------- Flipbook del giro (hero) ---------------- */
  const spin = $("[data-spin]");
  const frames = spin ? $$("img", spin) : [];
  let frame = 0;
  const showFrame = (i) => {
    if (!frames.length) return;
    frames[frame].classList.remove("is-on");
    frame = i;
    frames[frame].classList.add("is-on");
  };
  if (frames.length && !reduced) {
    // ping-pong 0→6→0 para simular el giro del vestido
    const order = frames.map((_, i) => i).concat(frames.map((_, i) => frames.length - 2 - i).slice(0, -1));
    let k = 0;
    const afterLoad = new Promise((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", r, { once: true })));
    const ready = afterLoad.then(() => {
      frames.forEach((img) => { if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute("data-src"); } });
      return Promise.all(frames.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())));
    });
    ready.then(() => {
      setInterval(() => {
        if (document.hidden) return;
        k = (k + 1) % order.length;
        showFrame(order[k]);
      }, 150);
    });
  }

  /* ---------------- Reproductor ---------------- */
  const player = $("[data-player]");
  if (player) initPlayer(player);

  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  }

  function initPlayer(p) {
    const audio = $("[data-audio]", p);
    const toggle = $("[data-toggle]", p);
    const seek = $("[data-seek]", p);
    const cur = $("[data-cur]", p);
    const dur = $("[data-dur]", p);
    const title = $("[data-now-title]", p);
    const tracks = $$("[data-track]", p);
    const vinyl = $("[data-vinyl]", p);
    const canvas = $("[data-viz]", p);
    const ctx2d = canvas.getContext("2d");
    let actx = null, analyser = null, data = null, seeking = false;

    const setPlaying = (on) => {
      p.classList.toggle("is-playing", on);
      toggle.setAttribute("aria-label", on ? "Pausar" : "Reproducir");
    };

    const ensureAnalyser = () => {
      if (actx) { if (actx.state === "suspended") actx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        actx = new AC();
        const src = actx.createMediaElementSource(audio);
        analyser = actx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;
        src.connect(analyser);
        analyser.connect(actx.destination);
        data = new Uint8Array(analyser.frequencyBinCount);
      } catch (err) {
        actx = null; analyser = null;
      }
    };

    const load = (btn) => {
      tracks.forEach((t) => t.classList.toggle("is-active", t === btn));
      title.textContent = btn.dataset.title;
      dur.textContent = btn.querySelector(".track__d").textContent;
      audio.src = btn.dataset.src;
      seek.value = 0;
      seek.style.setProperty("--p", "0%");
      cur.textContent = "0:00";
    };

    const play = () => {
      ensureAnalyser();
      const pr = audio.play();
      if (pr && pr.catch) pr.catch(() => setPlaying(false));
    };

    toggle.addEventListener("click", () => (audio.paused ? play() : audio.pause()));
    tracks.forEach((btn) => btn.addEventListener("click", () => {
      if (btn.classList.contains("is-active") && audio.src) { audio.paused ? play() : audio.pause(); return; }
      load(btn);
      play();
    }));

    audio.addEventListener("play", () => setPlaying(true));
    audio.addEventListener("pause", () => setPlaying(false));
    audio.addEventListener("loadedmetadata", () => { dur.textContent = fmt(audio.duration); });
    audio.addEventListener("timeupdate", () => {
      if (seeking || !audio.duration) return;
      const r = audio.currentTime / audio.duration;
      seek.value = Math.round(r * 1000);
      seek.style.setProperty("--p", `${r * 100}%`);
      cur.textContent = fmt(audio.currentTime);
    });
    audio.addEventListener("ended", () => {
      const i = tracks.findIndex((t) => t.classList.contains("is-active"));
      load(tracks[(i + 1) % tracks.length]);
      play();
    });
    seek.addEventListener("input", () => {
      seeking = true;
      seek.style.setProperty("--p", `${seek.value / 10}%`);
      if (audio.duration) cur.textContent = fmt((seek.value / 1000) * audio.duration);
    });
    seek.addEventListener("change", () => {
      if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration;
      seeking = false;
    });

    // vinilo con inercia + visualizador
    let angle = 0, speed = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    let visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(p);
    }

    const BARS = 48;
    const draw = (t) => {
      requestAnimationFrame(draw);
      if (!visible) return;
      const playing = !audio.paused;
      speed += ((playing ? 1 : 0) - speed) * 0.04;
      if (!reduced) {
        angle = (angle + speed * 3.2) % 360;
        vinyl.style.transform = `rotate(${angle}deg)`;
      }
      const w = canvas.width, h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);
      if (analyser && playing) analyser.getByteFrequencyData(data);
      const gap = w / BARS;
      for (let i = 0; i < BARS; i++) {
        let v;
        if (analyser && data && playing) {
          v = data[Math.floor((i / BARS) * data.length * 0.8)] / 255;
        } else {
          v = 0.08 + 0.06 * Math.sin(t / 600 + i * 0.45) + (playing ? 0.3 * Math.abs(Math.sin(t / 180 + i)) : 0);
        }
        const bh = Math.max(3, v * h);
        ctx2d.fillStyle = i % 2 ? "rgba(230,253,1,.9)" : "rgba(230,253,1,.55)";
        ctx2d.fillRect(i * gap + gap * 0.18, (h - bh) / 2, gap * 0.64, bh);
      }
    };
    requestAnimationFrame(draw);
  }

  /* ---------------- Videos (en vivo + eventos) ---------------- */
  // En silencio por defecto; se reproducen solo en pantalla; un solo video con sonido a la vez.
  const mainAudio = $("[data-audio]");
  const reels = $$("[data-reel]").map((vid) => ({ vid, btn: $("[data-reel-sound]", vid.parentElement) }));
  const setSound = (r, on) => {
    r.vid.muted = !on;
    if (!r.btn) return;
    r.btn.setAttribute("aria-pressed", String(on));
    r.btn.querySelector("span").textContent = on ? "Silenciar" : "Activar sonido";
  };
  // portada + descarga cuando falta ~una pantalla para llegar: así arranca apenas se ve
  const warm = (v) => {
    if (v.dataset.poster) { v.poster = v.dataset.poster; v.removeAttribute("data-poster"); }
    if (v.preload === "none") v.preload = "auto";
  };
  const muteOthers = (keep) => reels.forEach((r) => { if (r !== keep && !r.vid.muted) setSound(r, false); });
  // si el navegador bloquea el autoplay (p. ej. iPhone en ahorro de batería) el botón invita a reproducir
  const tryPlay = (v) => {
    const pr = v.play();
    if (pr && pr.catch) pr.catch(() => {
      const r = reels.find((x) => x.vid === v);
      if (r && r.btn && v.paused) r.btn.querySelector("span").textContent = "Reproducir";
    });
  };
  // precarga en orden: un video se adelanta solo cuando el anterior ya puede reproducirse,
  // para no repartir el ancho de banda entre dos o tres videos a la vez
  const pending = new Set();
  const warmInOrder = (i) => {
    const r = reels[i], prev = reels[i - 1];
    if (r.warm) return;
    if (prev && !(prev.warm && prev.vid.readyState >= 3)) { pending.add(i); return; }
    pending.delete(i); r.warm = true; warm(r.vid);
  };
  reels.forEach((r, i) => {
    r.vid.addEventListener("canplay", () => { if (pending.has(i + 1)) warmInOrder(i + 1); });
    if (r.btn) {
      r.btn.addEventListener("click", () => {
        const on = r.vid.muted;
        if (on) {
          muteOthers(r);
          if (mainAudio && !mainAudio.paused) mainAudio.pause();
        }
        setSound(r, on);
        if (r.vid.paused) tryPlay(r.vid);
      });
    }
    if ("IntersectionObserver" in window) {
      // la precarga anticipada espera al load para no competir con el primer pantallazo
      const near = () => new IntersectionObserver(([e], io) => {
        if (e.isIntersecting) { warmInOrder(i); io.disconnect(); }
      }, { rootMargin: "100% 0px" }).observe(r.vid);
      if (document.readyState === "complete") near(); else window.addEventListener("load", near, { once: true });
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { r.warm = true; pending.delete(i); warm(r.vid); if (!reduced) tryPlay(r.vid); }
        else if (!r.vid.paused) r.vid.pause();
      }, { threshold: 0.35 }).observe(r.vid);
    } else {
      warm(r.vid);
    }
  });
  if (mainAudio) mainAudio.addEventListener("play", () => muteOthers(null));

  /* ---------------- Lightbox ---------------- */
  const lb = $(".lb");
  const shots = $$(".ph");
  let lbIndex = 0;
  const lbImg = $(".lb__fig img", lb);
  const lbCap = $(".lb__fig figcaption", lb);
  const openLb = (i) => {
    lbIndex = (i + shots.length) % shots.length;
    const a = shots[lbIndex];
    lbImg.src = a.href;
    lbImg.alt = a.querySelector("img").alt;
    const look = a.closest(".look");
    lbCap.textContent = `${look.querySelector(".look__label strong").textContent} · ${lbIndex + 1}/${shots.length}`;
    if (lb.hidden) {
      lb.hidden = false;
      if (lenis) lenis.stop();
      document.body.style.overflow = "hidden";
      $(".lb__close", lb).focus();
    }
  };
  const closeLb = () => {
    lb.hidden = true;
    lbImg.removeAttribute("src");
    if (lenis) lenis.start();
    document.body.style.overflow = "";
    shots[lbIndex] && shots[lbIndex].focus();
  };
  shots.forEach((a, i) => a.addEventListener("click", (e) => { e.preventDefault(); openLb(i); }));
  $(".lb__close", lb).addEventListener("click", closeLb);
  $(".lb__prev", lb).addEventListener("click", () => openLb(lbIndex - 1));
  $(".lb__next", lb).addEventListener("click", () => openLb(lbIndex + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target === $(".lb__fig", lb)) closeLb(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) { if (e.key === "Escape" && root.classList.contains("menu-open")) setMenu(false); return; }
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") openLb(lbIndex - 1);
    if (e.key === "ArrowRight") openLb(lbIndex + 1);
  });
  let touchX = null;
  lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) openLb(lbIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------------- Animaciones GSAP ---------------- */
  if (!hasGSAP || reduced) {
    root.classList.add("no-anim", "intro-off");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // divide texto en caracteres / palabras conservando accesibilidad
  const splitChars = (el) => {
    const text = el.innerHTML;
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = text.split(/(<br\s*\/?>|<em>|<\/em>)/i).map((part) => {
      if (/^<br|^<\/?em>/i.test(part)) return part;
      // cada palabra en un bloque que no se parte; cada letra animable
      return part.split(/(\s+)/).map((w) => (/^\s+$/.test(w) || !w ? w
        : `<span class="wd">${w.split("").map((c) => `<span class="ch" aria-hidden="true">${c}</span>`).join("")}</span>`)).join("");
    }).join("");
    return $$(".ch", el);
  };
  const splitWords = (el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
    return $$(".w", el);
  };

  // entrada del hero (el estado inicial ya lo puso el CSS; si pasó 1,2 s sin JS, se omite)
  const playIntro = !root.classList.contains("intro-off");
  if (playIntro) root.classList.add("intro-on");
  const heroWords = $$(".hero__name .word");
  if (playIntro) {
    gsap.set(heroWords, { y: 0, yPercent: 110 }); // y: 0 descarta el translateY(110%) del CSS inicial
    gsap.set(".hero__kicker span", { autoAlpha: 0, x: -30 });
    gsap.set(".hero__stage", { autoAlpha: 0, scale: 0.8, rotate: -25 });
    gsap.set([".hero__bottom", ".hero__scroll"], { autoAlpha: 0, y: 30 });
    gsap.set(".hero__deco > *", { autoAlpha: 0, scale: 0 });
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(".hero__stage", { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.6 }, 0)
      .to(heroWords, { yPercent: 0, duration: 1.3, stagger: 0.12 }, 0.1)
      .to(".hero__kicker span", { autoAlpha: 1, x: 0, duration: 1, stagger: 0.1 }, 0.4)
      .to(".hero__deco > *", { autoAlpha: 1, scale: 1, duration: 0.8, stagger: 0.08, ease: "back.out(3)" }, 0.7)
      .to([".hero__bottom", ".hero__scroll"], { autoAlpha: 1, y: 0, duration: 1 }, 0.8);
  }

  // decoraciones flotando
  $$(".hero__deco > *").forEach((el, i) => {
    gsap.to(el, { y: i % 2 ? 16 : -16, rotate: i % 2 ? 20 : -20, duration: 2.4 + i * 0.4, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1.5 });
  });

  // parallax del hero al hacer scroll
  gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
    .to(".hero__type", { yPercent: -18, ease: "none" }, 0)
    .to(".hero__stage", { yPercent: -30, rotate: 12, scale: 1.08, ease: "none" }, 0)
    .to(".hero__ring", { rotate: 90, ease: "none" }, 0);

  // títulos por caracteres
  $$(".reveal-title").forEach((el) => {
    const chars = splitChars(el);
    gsap.from(chars, {
      yPercent: 110, rotate: 8, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.035,
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });

  // números de sección
  $$(".sec-num").forEach((el) => {
    gsap.from(el, { autoAlpha: 0, x: -20, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  // en vivo
  gsap.from(".phone", { yPercent: 25, rotate: -12, autoAlpha: 0, duration: 1.5, ease: "expo.out", scrollTrigger: { trigger: ".live", start: "top 75%" } });
  gsap.from(".live__text .sec-sub, .live__text .btn", { autoAlpha: 0, y: 30, stagger: 0.1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".live", start: "top 65%" } });

  // player
  gsap.from(".player__deck", { autoAlpha: 0, x: -120, rotate: -90, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".player", start: "top 75%" } });
  gsap.from(".player__body > *", { autoAlpha: 0, y: 40, duration: 1, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: ".player", start: "top 70%" } });

  // bio
  gsap.from(".bio__p", { xPercent: -100, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".bio", start: "top 70%" } });
  gsap.from(".bio__photo", { clipPath: "inset(100% 0 0 0)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: ".bio", start: "top 70%" } });
  gsap.to(".bio__photo img", { yPercent: -8, ease: "none", scrollTrigger: { trigger: ".bio", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(".bio__name", { yPercent: 60, autoAlpha: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".bio__name", start: "top 85%" } });
  const bioWords = splitWords($(".scrub-text"));
  gsap.to(bioWords, {
    color: "#fff", stagger: 0.1, ease: "none",
    scrollTrigger: { trigger: ".scrub-text", start: "top 80%", end: "bottom 45%", scrub: true },
  });
  gsap.from([".bio__claim", ".bio .chips li"], { autoAlpha: 0, y: 24, stagger: 0.06, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".bio__claim", start: "top 90%" } });

  // sesión: scroll horizontal fijado (solo pantallas medianas+)
  const mm = gsap.matchMedia();
  mm.add("(min-width: 761px)", () => {
    const section = $(".session");
    const track = $("[data-hscroll]");
    const rail = $(".session__rail");
    section.classList.add("is-hscroll");
    const distance = () => Math.max(0, rail.scrollWidth - window.innerWidth);
    const tween = gsap.to(rail, {
      x: () => -distance(), ease: "none",
      scrollTrigger: {
        trigger: ".session__pin", start: "top top", end: () => `+=${distance()}`,
        pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
      },
    });
    $$(".look", track).forEach((look) => {
      gsap.from($$(".ph", look), {
        yPercent: 18, autoAlpha: 0, stagger: 0.05, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: look, containerAnimation: tween, start: "left 90%" },
      });
    });
    return () => section.classList.remove("is-hscroll");
  });
  mm.add("(max-width: 760px)", () => {
    gsap.from(".session__title", { autoAlpha: 0, y: 40, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".session", start: "top 75%" } });
  });

  // eventos
  gsap.from(".venues li", { autoAlpha: 0, y: 50, stagger: 0.06, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: ".venues", start: "top 85%" } });
  gsap.from(".flyers", { autoAlpha: 0, y: 80, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".flyers", start: "top 90%" } });
  $$(".reel").forEach((reel) => {
    gsap.from($(".reel__media", reel), { autoAlpha: 0, y: 90, scale: 0.94, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: reel, start: "top 85%" } });
    gsap.from($$(".reel__text > *", reel), { autoAlpha: 0, y: 30, stagger: 0.08, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: $(".reel__text", reel), start: "top 90%" } });
  });

  // rider
  gsap.from(".rider__title span", { yPercent: 100, autoAlpha: 0, stagger: 0.12, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".rider", start: "top 70%" } });
  gsap.from(".rider__list li", { autoAlpha: 0, x: 60, stagger: 0.12, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".rider__list", start: "top 85%" } });
  gsap.fromTo(".rider__cdj", { yPercent: 40, rotate: -6 }, { yPercent: 0, rotate: 0, ease: "none", scrollTrigger: { trigger: ".rider__cdj", start: "top bottom", end: "bottom bottom", scrub: true } });
  gsap.to(".rider__arc", { rotate: 120, ease: "none", scrollTrigger: { trigger: ".rider", start: "top bottom", end: "bottom top", scrub: true } });

  // reservar
  gsap.from([".book__direct .social:not([hidden])", ".form > *"], { autoAlpha: 0, y: 30, stagger: 0.06, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: ".book", start: "top 70%" } });

  // footer
  const footChars = splitChars($(".foot__big"));
  gsap.from(footChars, { yPercent: 100, stagger: 0.05, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".foot", start: "top 90%" } });

  // marquee acelera con la velocidad del scroll
  const mq = $(".marquee__track");
  ScrollTrigger.create({
    trigger: ".marquee", start: "top bottom", end: "bottom top",
    onUpdate: (self) => {
      const v = Math.min(4, 1 + Math.abs(self.getVelocity()) / 800);
      mq.getAnimations().forEach((a) => { a.playbackRate = v; });
    },
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
