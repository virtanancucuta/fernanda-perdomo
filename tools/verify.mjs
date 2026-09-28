// Verificación E2E de la landing.
// Uso: node tools/verify.mjs [url]   (por defecto http://localhost:8765/)
import { createRequire } from "module";
import { execSync } from "child_process";
import fs from "fs";

const require = createRequire(import.meta.url);
const globalRoot = execSync("npm root -g").toString().trim();
const { chromium } = require(`${globalRoot}/@playwright/cli/node_modules/playwright`);

const URL = process.argv[2] || "http://localhost:8765/";
const OUT = "verify-out";
fs.mkdirSync(OUT, { recursive: true });
const WA = "https://wa.me/573187822041";
const results = [];
const check = (name, ok, extra = "") => { results.push({ name, ok, extra }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`); };

const exe = process.env.PW_CHROME; const browser = await chromium.launch(exe ? { executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] } : {});

for (const vp of [{ w: 360, h: 760, tag: "movil" }, { w: 768, h: 1024, tag: "tablet" }, { w: 1440, h: 900, tag: "desktop" }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  const failed = [];
  page.on("requestfailed", (r) => failed.push(r.url()));
  page.on("response", (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(3200); // loader + intro

  // recorrer toda la página para disparar lazy-load y ScrollTriggers
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= total; y += Math.round(vp.h * 0.6)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(800);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`[${vp.tag}] sin scroll horizontal`, overflow <= 0, `exceso ${overflow}px`);
  check(`[${vp.tag}] sin errores de consola`, errors.length === 0, errors.slice(0, 3).join(" | "));
  check(`[${vp.tag}] sin recursos fallidos`, failed.length === 0, failed.slice(0, 3).join(" | "));
  const loaderGone = await page.evaluate(() => !document.querySelector(".loader"));
  check(`[${vp.tag}] loader se retira`, loaderGone);

  // screenshots por sección
  for (const id of ["top", "en-vivo", "musica", "bio", "sesion", "eventos", "tarifas", "rider", "reservar"]) {
    await page.evaluate((i) => { const el = document.getElementById(i); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY); }, id);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/${vp.tag}-${id}.png` });
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${vp.tag}-footer.png` });

  if (vp.tag === "desktop" || vp.tag === "movil") {
    // enlaces WhatsApp
    const waLinks = await page.$$eval("[data-wa]", (as) => as.map((a) => a.href));
    check(`[${vp.tag}] ${waLinks.length} links WhatsApp apuntan a ${WA}`, waLinks.length >= 7 && waLinks.every((h) => h.startsWith(WA)));
    check(`[${vp.tag}] links WhatsApp llevan mensaje sin 'undefined'`, waLinks.every((h) => h.includes("?text=") && !h.includes("undefined")));
    // sin correo y sin TikTok visible
    const html = await page.content();
    check(`[${vp.tag}] no aparece correo`, !/@gmail\.com|mailto:/i.test(html));
    const ttVisible = await page.$$eval("[data-tiktok]", (as) => as.some((a) => !a.hidden));
    check(`[${vp.tag}] TikTok oculto (config vacía)`, !ttVisible);

    // formulario vacío → WhatsApp coherente
    let opened = null;
    await page.exposeFunction("__captureOpen", (u) => { opened = u; });
    await page.evaluate(() => { window.open = (u) => { window.__captureOpen(u); return null; }; });
    await page.evaluate(() => document.querySelector("[data-book-form]").requestSubmit());
    await page.waitForTimeout(200);
    const msgEmpty = opened ? decodeURIComponent(opened.split("?text=")[1]) : "";
    check(`[${vp.tag}] form vacío abre WhatsApp`, !!opened && opened.startsWith(WA) && msgEmpty.includes("por definir") && !msgEmpty.includes("undefined"));
    // formulario lleno
    await page.fill("#f-nombre", "Club Prueba");
    await page.fill("#f-fecha", "2026-12-31");
    await page.fill("#f-ciudad", "Medellín");
    await page.evaluate(() => { document.querySelector('input[name=tipo][value="Festival"]').checked = true; document.querySelector('input[name=horas][value="2 horas"]').checked = true; });
    await page.evaluate(() => document.querySelector("[data-book-form]").requestSubmit());
    await page.waitForTimeout(200);
    const msg = decodeURIComponent(opened.split("?text=")[1]);
    check(`[${vp.tag}] form lleno arma mensaje`, msg.includes("Club Prueba") && msg.includes("Medellín") && msg.includes("Festival") && msg.includes("2 horas") && msg.includes("31"), msg.replace(/\n/g, " / "));

    // video en vivo: carga, se reproduce en silencio al estar en pantalla
    await page.evaluate(() => document.getElementById("en-vivo").scrollIntoView({ block: "center" }));
    await page.waitForTimeout(2500);
    const live = await page.evaluate(() => { const v = document.querySelector("[data-live]"); return { t: v.currentTime, muted: v.muted, dur: v.duration, w: v.videoWidth }; });
    check(`[${vp.tag}] video en vivo reproduce en silencio`, live.t > 0.3 && live.muted && live.dur > 20 && live.w === 720, JSON.stringify(live));
    await page.click("[data-live-sound]");
    await page.waitForTimeout(300);
    const unm = await page.evaluate(() => !document.querySelector("[data-live]").muted);
    check(`[${vp.tag}] botón activa sonido del video`, unm);
    await page.screenshot({ path: `${OUT}/${vp.tag}-en-vivo.png` });

    // audio: los 3 tracks cargan metadata
    const durs = await page.evaluate(async () => {
      const srcs = [...document.querySelectorAll("[data-track]")].map((b) => b.dataset.src);
      return Promise.all(srcs.map((s) => new Promise((res) => {
        const a = new Audio(); a.preload = "metadata"; a.src = s;
        a.onloadedmetadata = () => res(a.duration); a.onerror = () => res(-1);
        setTimeout(() => res(-2), 8000);
      })));
    });
    check(`[${vp.tag}] 3 audios con duración`, durs.length === 3 && durs.every((d) => d > 60), durs.map((d) => d.toFixed(0)).join(", "));

    // player: al cambiar de track solo hay un audio y cambia el src
    await page.evaluate(() => document.getElementById("musica").scrollIntoView());
    await page.waitForTimeout(600);
    await page.click('[data-track="1"]');
    await page.waitForTimeout(1500);
    const st = await page.evaluate(() => ({
      src: document.querySelector("[data-audio]").src,
      title: document.querySelector("[data-now-title]").textContent,
      audios: document.querySelectorAll("audio").length,
      active: document.querySelectorAll(".track.is-active").length,
    }));
    check(`[${vp.tag}] player cambia a Gin Tonic`, st.src.endsWith("gin-tonic.mp3") && st.title === "Gin Tonic" && st.audios === 1 && st.active === 1);
    const liveMuted = await page.evaluate(() => document.querySelector("[data-live]").muted);
    check(`[${vp.tag}] al sonar un track se silencia el video`, liveMuted);
    await page.screenshot({ path: `${OUT}/${vp.tag}-player-playing.png` });
    await page.evaluate(() => document.querySelector("[data-audio]").pause());

    // lightbox
    await page.evaluate(() => document.getElementById("sesion").scrollIntoView());
    await page.waitForTimeout(800);
    await page.evaluate(() => document.querySelector(".ph").click());
    await page.waitForTimeout(700);
    const lbOpen = await page.evaluate(() => !document.querySelector(".lb").hidden && document.querySelector(".lb__fig img").naturalWidth > 0);
    await page.screenshot({ path: `${OUT}/${vp.tag}-lightbox.png` });
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);
    const cap = await page.textContent(".lb__fig figcaption");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    const lbClosed = await page.evaluate(() => document.querySelector(".lb").hidden && document.body.style.overflow === "");
    check(`[${vp.tag}] lightbox abre, navega y cierra`, lbOpen && cap.includes("2/") && lbClosed, cap);
  }

  if (vp.tag === "movil") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.click(".nav__burger");
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/movil-menu.png` });
    const floatVisible = await page.isVisible(".wa-float");
    check("[movil] botón flotante WhatsApp visible", floatVisible);
  }
  await ctx.close();
}

// sin JS de terceros (CDN caído): contenido visible
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 760 } });
  const page = await ctx.newPage();
  await page.route(/cdnjs|jsdelivr/, (r) => r.abort());
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const vis = await page.evaluate(() => {
    const el = document.querySelector(".hero__name .word");
    const r = el.getBoundingClientRect();
    return getComputedStyle(el).visibility === "visible" && r.top < innerHeight && !document.querySelector(".loader");
  });
  check("[sin CDN] hero visible y loader retirado", vis);
  await page.screenshot({ path: `${OUT}/sin-cdn.png` });
  await ctx.close();
}

await browser.close();
const fails = results.filter((r) => !r.ok);
console.log(`\n${results.length - fails.length}/${results.length} PASS`);
process.exit(fails.length ? 1 : 0);
