# Landing Fernanda Perdomo — Implementation Plan

> Ejecución: nativa (Jorge pidió "dale construye"). Checkbox por tarea.

**Goal:** landing estática de booking para DJ Fernanda Perdomo, fiel al PDF (negro/lima), muy animada, con WhatsApp y tarifas.
**Architecture:** `index.html` estático con todo el contenido en HTML; `css/styles.css`; `js/main.js` (animaciones GSAP + player + lightbox + WhatsApp builder). Assets optimizados por `tools/build_assets.py`. GitHub Pages.
**Tech Stack:** HTML/CSS/JS vanilla, GSAP 3 + ScrollTrigger (cdnjs), Lenis (jsdelivr), Google Fonts Anton + Barlow Condensed, Python Pillow + ffmpeg para assets, Playwright (node) para verificar.
**Spec:** `docs/2026-09-27-landing-fernanda-perdomo-design.md`

## Global Constraints
- Lima `#E6FD01`, negro `#0A0A0A`. Anton títulos, Barlow Condensed texto.
- WhatsApp `573187822041`. Instagram `https://www.instagram.com/djfernandaperdomoo`.
- **Sin correo y sin TikTok** (pendientes; TikTok queda como `CONFIG.tiktok = ""`, oculto si vacío).
- **Sin descarga del PDF** (contiene el correo).
- 3 tracks: Noche en Ibiza, Gin Tonic, Baila Conmigo. El audio de WhatsApp NO se usa.
- Fotos originales y audios crudos NUNCA al repo.

## Review Focus
1. Móvil 360 px: nada desborda horizontalmente (tipografía gigante es el riesgo #1).
2. `prefers-reduced-motion` / GSAP no carga (CDN caído): todo el contenido visible igual (clase `.js-anim` solo si GSAP existe).
3. Dos tracks: al dar play a uno se pausa el otro.
4. Formulario WhatsApp con campos vacíos: igual abre WhatsApp con mensaje coherente (sin "undefined").
5. Lightbox: cierra con Esc, clic fuera y botón; flechas navegan; no bloquea el scroll al cerrar.

### Task 1: Assets
**Files:** `tools/build_assets.py` → `assets/img/*.webp`, `assets/audio/*.mp3`, `assets/og.jpg`, `assets/img/flyers/*.webp`, `assets/img/rider-cdj.webp`
- [ ] Fotos elegidas → WebP 1400 px lado largo q78 + thumbs 700 px; frames giro 9874–9880 a 900 px.
- [ ] Recortar flyers de `imagenes/p7_0.jpeg` (Resi Dencias, Energy Up, HOUP, Ananda, Coffee Party, Perdomo Int Guest).
- [ ] Audios → MP3 128 kbps mono-no, con tags.
- [ ] OG 1200×630.
- [ ] Verificar: tamaños y peso total; commit.

### Task 2: Página (HTML + CSS)
- [ ] Secciones según spec, contenido real, links WhatsApp/Instagram. Responsive 360→1440. Commit.

### Task 3: Interacción (JS)
- [ ] Lenis + GSAP: intro con letras PERDOMO, flipbook de giro atado al scroll, reveals, marquee, parallax.
- [ ] Player: 1 activo, progreso, seek, visualizador (WebAudio AnalyserNode; fallback barras CSS).
- [ ] Lightbox por look. WhatsApp builder. Commit.

### Task 4: Verificación local (Playwright)
- [ ] Script `tools/verify.mjs`: 360/768/1440, sin scroll horizontal, sin errores de consola, 3 audios con `duration>0`, hrefs `wa.me/573187822041?text=` correctos, screenshots. Cubre Review Focus 1–5.

### Task 5: Publicar
- [ ] Crear repo `virtanancucuta/fernanda-perdomo` (API con token classic), push, activar Pages, esperar build, re-correr verify contra la URL pública.
