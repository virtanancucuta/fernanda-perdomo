# Landing DJ Fernanda Perdomo — Diseño

Fecha: 2026-09-27 · Cliente: Fernanda Perdomo (DJ y modelo) · Autor: Jorge Valbuena + Claude

## Objetivo
Que un promotor escuche a Fernanda, vea el precio y la contrate por WhatsApp en menos de 30 segundos.
Éxito = clics en WhatsApp. Todo lo demás es secundario.

## Base de diseño: el PDF de booking (fuente de verdad visual)
- Paleta: negro `#0A0A0A`, lima `#E6FD01` (medido del PDF), blanco, gris `#9A9A9A`.
- Tipografía: el PDF usa **Gobold Uplow** (de pago) → sustituto libre **Anton** (títulos, condensada alta) + **Barlow Condensed** (texto).
- Recursos gráficos del PDF: letras gigantes cortadas ("PER / DO / MO"), círculo/arco lima, "x" y triángulos lima como adornos, fotos en blanco y negro con brillo lima, bloques lima sólidos a sangre.
- Las 285 fotos de la sesión (fondo blanco de estudio) se tratan en **blanco y negro con alto contraste** para unificarlas con la marca; el lima entra como acento, nunca como tinte total (salvo 1-2 fotos en duotono negro/lima, como la pág. 2 del PDF).

## Cambios aprobados después del spec (2026-09-27)
- Sin correo, sin TikTok (pendientes) y sin descarga del PDF (contiene el correo).
- Solo 3 tracks con nombre: Noche en Ibiza, Gin Tonic, Baila Conmigo.
- Nueva sección **En vivo** tras el hero: video vertical del evento (22 s) en marco lima, autoplay en silencio, botón de sonido.

## Estructura (una sola página, en este orden)
1. **Hero** — "MODEL & DEEJAY" + "PERDOMO" gigante (como pág. 1 del PDF). Foto recortada de Fernanda (look flecos) con secuencia de fotos FP-9874→9880 (giro) que da efecto de movimiento. 4 botones: Escuchar · Tarifas · Rider · WhatsApp.
2. **Música** — reproductor propio con 3 tracks: *Noche en Ibiza*, *Gin Tonic*, *Baila Conmigo*. Play/pausa, barra de progreso, visualizador de barras lima que reacciona al audio. Un solo track suena a la vez.
3. **Bio** — "Electrónica · Experimental House" + texto del PDF corregido (ortografía) + "Promotora e impulsadora femenina de la escena electrónica". Estilo pág. 4 del PDF (bloque lima + "perdomo").
4. **"Acompáñame a mi última sesión de fotos"** — galería por looks (jean, flecos, blanco boho, turbante, streetwear), ~6 fotos por look + las fotos de backstage con la maquilladora. Visor a pantalla completa al tocar.
5. **Ha tocado en** — muro de flyers de la pág. 7 del PDF (Casa Malva/Ananda, Resi Dencias, Energy Up, La Celosa, HOUP, Tropical Brunch).
6. **Tarifas** — 3 tarjetas: Eje Cafetero $500.000 COP · Cartagena/Bogotá/Cali/Medellín/otros $700.000 COP · Internacional $400 USD. Nota: "No incluye viáticos (tiquetes aéreos, hotel, alimentación)". Cada tarjeta con botón "Reservar por WhatsApp" que prellena la zona.
7. **Rider técnico** — 2x Pioneer CDJ-3000 (linked) o CDJ-2000NXS2, mínimo 3 decks · 1x DJM-900NXS2 o DJM-V10 · siempre con Pioneer RMX-1000. Fondo lima (como pág. 5). Botón "Descargar press kit (PDF)".
8. **Reservar** — mini formulario: fecha, ciudad, tipo de evento, horas de set → abre `wa.me/573187822041?text=...` con el mensaje armado. Sin backend.
9. **Pie** — WhatsApp 318 782 2041, Instagram @djfernandaperdomoo, correo (ver pendiente), créditos.
- **Botón flotante de WhatsApp** visible en toda la página (sobre todo en móvil).

## Técnico
- HTML + CSS + JS vanilla, estático, un `index.html` con el contenido real en el HTML (SEO y vista previa al compartir). Sin frameworks ni build.
- Hosting: GitHub Pages, repo `virtanancucuta/fernanda-perdomo` → `https://virtanancucuta.github.io/fernanda-perdomo/`.
- Imágenes: script Python que convierte las fotos elegidas a WebP (1600 px lado largo, ~150 KB) + miniaturas 600 px; `loading="lazy"` salvo el hero.
- Audio: MP3 128 kbps (los m4a son de 64 kbps, se convierten sin ganar calidad; se sugiere pedir originales). `preload="none"`.
- Open Graph: imagen 1200×630 con "PERDOMO" + foto, título y descripción, para que el link se vea bien en WhatsApp/Instagram.
- Animaciones: aparición al hacer scroll con IntersectionObserver; respeta `prefers-reduced-motion`.
- Responsive primero móvil (360 px) → escritorio.

## Verificación antes de entregar
- Playwright en 360 px y 1440 px: screenshots de cada sección, sin scroll horizontal.
- Los 3 audios suenan; los botones de WhatsApp abren la URL correcta con el texto prellenado.
- Peso total de la primera carga < 2 MB; verificación en la URL pública de GitHub Pages (no solo local).

## Fuera de alcance
Tienda, newsletter, fechas de gira, versión en inglés, dominio propio (se puede agregar después).

## Pendiente
- Correo y TikTok: NO se publican por decisión de Jorge (2026-09-27). TikTok se activa con `tiktok` en `js/config.js`.
- Selección final de fotos por look la hago yo; Jorge la revisa en el visual.
