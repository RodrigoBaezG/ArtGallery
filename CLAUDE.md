# CLAUDE.md — Portfolio de acuarela de Kuko Báez

Este repositorio es el **portfolio profesional de acuarela** de Rodrigo "Kuko" Báez. Su función principal es **conseguir trabajo**: encargos de ilustración editorial y de libros, y encargos/venta directa a particulares. Cada decisión se evalúa con una pregunta: *¿ayuda a que un director de arte, editor o cliente vea la obra y contacte en menos de un minuto?*

> Estado: en migración desde la galería anterior (pinturas / dibujos / digital + API en Render) a un **sitio estático, bilingüe y exclusivamente de acuarela**. Ver [Plan de migración](#plan-de-migración).

---

## 1. Principios

1. **La obra es la protagonista.** La interfaz se retira: nada compite en color, movimiento o tamaño con las acuarelas.
2. **Suave y minimalista.** Papel cálido, tinta suave, mucho aire. Sin sombras duras, sin bordes gruesos, sin gradientes llamativos, sin "manchas de acuarela" decorativas falsas.
3. **Curaduría antes que cantidad.** 12–24 obras, las mejores primero. Mejor dejar fuera una obra floja que diluir el conjunto.
4. **Contacto a un clic** desde cualquier página.
5. **Rápido.** Sin servidor que despertar. Imágenes optimizadas. Objetivo: LCP < 2,5 s en móvil 4G.
6. **Sin inventar datos.** Títulos, fechas, medidas, clientes o biografía que no haya dado Rodrigo se marcan como `[[TODO: …]]`, nunca se rellenan con ficción.

## 2. Stack y arquitectura

- **Sitio 100 % estático**: HTML + CSS + JavaScript vanilla, sin frameworks ni build step para el sitio.
- **Despliegue**: Netlify, carpeta publicada `frontend/`. URL actual: `https://kukobaezgallery.netlify.app/`.
- **Datos**: `frontend/data/artworks.json` (catálogo) — sustituye a la API.
- **Textos**: `frontend/i18n/en.json` y `frontend/i18n/es.json`.
- **Formulario de contacto**: Netlify Forms (`data-netlify="true"`), sin backend propio.
- **Pipeline de imágenes**: `tools/images/` (Node 22 + `sharp`), se ejecuta en local; solo se versionan las imágenes ya procesadas.
- **`backend/`**: congelado. No se modifica. Se eliminará en la fase final de la migración tras confirmación explícita de Rodrigo (ver §9).

### Estructura objetivo

```
frontend/
├── index.html          # Hero breve + galería única (es la home)
├── work.html           # Detalle de obra (?id=slug)
├── about.html          # Sobre mí + CV + PDF descargable
├── commissions.html    # Encargos: qué hago, proceso, plazos, cómo pedir
├── contact.html        # Formulario (Netlify Forms) + email + Instagram
├── data/artworks.json
├── i18n/{en,es}.json
└── assets/
    ├── css/            # tokens.css, base.css, components.css, pages/*.css
    ├── js/             # i18n.js, gallery.js, work.js, nav.js
    ├── img/works/      # derivados optimizados (generados, no editar a mano)
    ├── img/site/       # retrato, og-image, favicon
    └── docs/           # cv-en.pdf, cv-es.pdf
tools/images/           # script de procesado de imágenes
docs/                   # design.md, content-todo.md, qa/
```

## 3. Galería

- **Una sola galería**, sin categorías ni filtros. Orden manual por el campo `order`; las obras con `featured: true` van primero.
- Galería en **filas justificadas** (`gallery__grid--rows`, decisión de Rodrigo 2026-11-17): mantiene el orden curado de izquierda a derecha y respeta la proporción de cada acuarela sin recortarla.
- Se publican las 22 obras seleccionadas, incluido el fan art y los retratos (decisión de Rodrigo).
- Detalle de obra: imagen grande sobre fondo papel, título, año, técnica, medidas, estado y un enlace “Encargar algo similar / Commission something similar”.
- Navegación anterior/siguiente entre obras y con teclado (← →, Esc).

### Esquema de `artworks.json`

```json
{
  "id": "paco-disco",
  "order": 1,
  "featured": true,
  "title":       { "en": "…", "es": "…" },
  "description": { "en": "…", "es": "…" },
  "year": 2023,
  "dimensions": "30 × 40 cm",
  "medium":      { "en": "Watercolor on paper", "es": "Acuarela sobre papel" },
  "status": "available | sold | private | commissioned",
  "image": {
    "base": "assets/img/works/paco-disco",
    "widths": [640, 1280, 2000],
    "width": 3000, "height": 4000,
    "alt": { "en": "…", "es": "…" }
  },
  "source": "pacodisco2.jpg"
}
```

- `id` = slug en inglés, kebab-case, estable (forma parte de la URL).
- `source` = nombre del archivo original, solo para trazabilidad.
- Sin precios públicos: `available` se muestra como “Original disponible — consultar”.

## 4. Idiomas (bilingüe EN / ES)

- **Inglés por defecto**; español si `navigator.language` empieza por `es`, o si el usuario lo elige. La elección se guarda en `localStorage` (envuelto en `try/catch`) y en `?lang=es|en`.
- Todo texto visible sale de `i18n/*.json` mediante atributos `data-i18n="clave"`; nada de texto suelto hardcodeado en HTML salvo el fallback en inglés.
- Al cambiar idioma se actualizan `<html lang>`, `<title>` y meta description.
- Las dos claves de cada archivo i18n deben existir en ambos idiomas (QA lo comprueba).
- Código, nombres de archivo, clases CSS e IDs: **en inglés**. Documentación interna: en español.

## 5. Sistema visual

El detalle vive en `docs/design.md` (lo mantiene el agente `art-director`). Bases no negociables:

- **Paleta**: fondo papel cálido (en la familia de `#FAF8F4`), texto tinta suave (en la familia de `#3A3835`, nunca negro puro), un único acento de pigmento apagado (índigo, salvia o terracota diluidos). Contraste de texto ≥ 4.5:1.
- **Tipografía**: una serif elegante para títulos (Cormorant Garamond u otra equivalente) + una sans ligera y legible para texto. Máximo 2 familias, cargadas desde Google Fonts con `display=swap`.
- **Espaciado**: escala basada en 8 px, márgenes generosos, ancho de lectura ≤ 65 caracteres.
- **Movimiento**: solo fundidos y desplazamientos suaves (150–400 ms, `ease-out`). Respetar `prefers-reduced-motion`.
- **Formas**: radios pequeños o ninguno, bordes de 1 px en tono papel oscuro, sombras casi invisibles o ninguna.
- **Tokens**: todos los colores, tamaños y tiempos como variables en `assets/css/tokens.css`. Prohibido usar valores sueltos fuera de ese archivo.
- **Mobile-first**. Sin scroll horizontal. Áreas táctiles ≥ 44 px.
- Modo oscuro: **no** en esta versión (las acuarelas se diseñaron para verse sobre blanco/papel).
- **Excepción — banner de la home** (decisión de Rodrigo, 2026-11-19): la franja superior de la home usa el banner de su marca del proyecto original (azul marino con la firma KB, 1200×300). Solo en la home, con un máximo de 1200 px (no se amplía) y sin efectos. El `<h1>` sigue en el HTML, pero oculto a la vista (`visually-hidden`). Detalle en `docs/design.md`.

## 6. Imágenes

- **Origen**: `C:\Users\Kbaez\Desktop\etsy\Tecnicas\Acuarela` (fuera del repo, nunca se copia entero).
- **Solo archivos del nivel superior** de esa carpeta son candidatos.
  - `fotos para pintar/` — **EXCLUIDA SIEMPRE**: son fotos de referencia de terceros, no obra propia. No se leen, no se procesan, no se publican.
  - `mockups/` — excluida salvo que Rodrigo indique lo contrario.
- Los originales pueden pesar >100 MB: se procesan con `sharp` (`limitInputPixels: false`), nunca se suben al repo.
- Salida: WebP en anchos 640 / 1280 / 2000 px (lado largo máx. 2000 px), calidad ~82, convertidos a sRGB, **sin metadatos EXIF** (las fotos de móvil pueden contener GPS). Un JPG 1200×630 para `og:image`.
- Nombres de salida: `{id}-{width}.webp`.
- En HTML: `srcset` + `sizes`, `width`/`height` explícitos, `loading="lazy"` salvo las primeras obras visibles, `decoding="async"`.
- Fotos de obra torcidas, con sombras o con fondo visible: se señalan en el informe del curador para que Rodrigo decida (re-escanear o recortar), no se “arreglan” en silencio.

## 7. Enfoque portfolio (lo que busca quien contrata)

- **Home**: banner de marca (ver §5), una línea de posicionamiento (p. ej. “Watercolor illustrator — editorial, books & commissions”) y la obra justo debajo. Sin banners grandes.
- **About**: retrato, bio corta (≤ 120 palabras), experiencia/clientes/publicaciones/exposiciones, herramientas y técnica, **CV en PDF descargable** (EN y ES).
- **Commissions**: tipos de encargo (editorial, libro, retrato de mascota, obra personalizada…), proceso en pasos, plazos orientativos, qué información enviar, CTA a contacto.
- **Contact**: formulario corto (nombre, email, tipo de proyecto, mensaje), email visible e Instagram.
- **SEO**: `<title>` y meta description por página e idioma, Open Graph con imagen real de una acuarela, `hreflang`, JSON-LD `Person` en la home y `VisualArtwork` en el detalle, `sitemap.xml` y `robots.txt`.

## 8. Agentes

Hay 5 agentes de proyecto en `.claude/agents/`. **Cada uno es dueño exclusivo de unos archivos**; si necesita un cambio fuera de su zona, lo pide en su informe final en lugar de hacerlo.

| Agente | Función | Es dueño de | No toca |
|---|---|---|---|
| `art-director` | Sistema visual y CSS | `docs/design.md`, `frontend/assets/css/**` | HTML, JS, JSON, imágenes |
| `image-curator` | Selección y procesado de imágenes, catálogo | `tools/images/**`, `frontend/assets/img/**`, campos técnicos de `artworks.json` (`id`, `image`, `source`, `order`, `featured`) | CSS, HTML, JS, textos |
| `content-writer` | Textos bilingües y SEO textual | `frontend/i18n/*.json`, campos de texto y datos de obra de `artworks.json` (`title`, `description`, `medium`, `alt`, `year`, `dimensions`, `status`), `docs/content-todo.md` | CSS, HTML, JS, imágenes |
| `frontend-dev` | HTML, JS, i18n runtime, accesibilidad estructural, SEO técnico | `frontend/*.html`, `frontend/assets/js/**`, `sitemap.xml`, `robots.txt`, `netlify.toml` | Valores de diseño, textos, imágenes |
| `qa-reviewer` | Verificación: responsive, accesibilidad, rendimiento, i18n, enlaces, seguridad; escribe y ejecuta los tests (§12) | `docs/qa/**`, `tests/**` | Todo lo demás (no corrige el sitio, reporta) |

**Contratos entre agentes** (si cambian, se actualiza esta sección):
- Esquema de `artworks.json` → §3.
- Claves i18n: notación `pagina.seccion.elemento` (ej. `home.hero.tagline`), compartidas en `common.*`.
- Clases CSS: BEM ligero (`gallery__item`, `work__meta`). `frontend-dev` usa las clases que define `docs/design.md`; si necesita una nueva, la pide a `art-director`.

**Orden de trabajo**:
1. En paralelo: `art-director` (design.md + tokens), `image-curator` (selección + procesado + borrador de `artworks.json`), `content-writer` (textos + lista de datos que faltan).
2. `frontend-dev` integra todo.
3. `qa-reviewer` revisa; cada hallazgo se asigna al agente dueño del archivo.
4. Repetir 2–3 hasta que QA no tenga bloqueantes.

El hilo principal (Claude) coordina, resuelve conflictos entre agentes y es el único que hace commits.

## 9. Plan de migración

- [x] Fase 1 — Diseño, imágenes y textos (agentes en paralelo).
- [x] Fase 2 — Reescritura del frontend estático y bilingüe.
- [x] Fase 3 — QA y correcciones (2 rondas, ver `docs/qa/`).
- [x] Fase 4 — Limpieza: imágenes y CSS antiguos borrados; `backend/` eliminado (conservado en el tag `v1-api`). Pendiente: Rodrigo apaga el servicio en Render.
- [ ] Fase 5 — `README.md` actualizado. Pendiente: desplegar y verificar el formulario de Netlify en producción.
- [x] Fase 6 — Tests automatizados y endurecimiento de seguridad (ver §12). 2026-11-18: `npm test` en verde (unit, security, e2e, perf). 2026-11-19: `npm run test:prod` 17/17 en `kukobaezgallery.netlify.app` (cabeceras, 404 reales, honeypot). Detección de formularios de Netlify activada.

### Datos pendientes de Rodrigo
Se centralizan en `docs/content-todo.md`: títulos/años/medidas/estado de cada obra, bio, experiencia y clientes, condiciones de encargo, retrato, dominio propio (si lo hay).

## 10. Comandos

```bash
# Procesar imágenes (desde la raíz)
cd tools/images && npm install   # (--prefix falla en Git Bash)
npm run build                     # --force para regenerar todo
npm run verify                    # comprueba que no hay EXIF/GPS

# Servir el sitio en local
npx serve frontend
```

## 11. Reglas de trabajo

- Commits pequeños por fase, mensajes en el estilo existente (`frontend: …`, `images: …`, `docs: …`).
- No hacer commit ni push sin que Rodrigo lo pida.
- No publicar nada de `fotos para pintar/` ni de `mockups`. No subir originales al repo.
- Ante una decisión estética dudosa, elegir la opción más sobria.
- No se hace commit si `npm test` (§12) falla.

## 12. Tests

**Estado (2026-11-18)**: implementados en `tests/` y en verde en local (`docs/qa/2026-11-18-tests.md`). `test:prod` queda pendiente del despliegue. Los ajustes razonados a esta especificación están en §5 de ese informe.

### 12.1 Herramientas y estructura

- Los tests viven en `tests/`, **fuera de `frontend/`** (nunca se publican). Tienen su propio `package.json`, igual que `tools/images/`. El sitio sigue sin dependencias ni build step.
- **Unitarios y estáticos**: el runner nativo de Node 22 (`node --test`) + `jsdom` para cargar los scripts del navegador sin servidor.
- **Integración / E2E**: `@playwright/test` (Chromium + WebKit), contra `npx serve frontend` arrancado por la propia config (`webServer`).
- **Accesibilidad**: `@axe-core/playwright`.
- Los resultados de cada ejecución que se haga a mano se resumen en `docs/qa/AAAA-MM-DD-tests.md`.

```
tests/
├── package.json        # scripts: test, test:unit, test:e2e, test:security, test:prod
├── playwright.config.mjs
├── unit/               # *.test.mjs  (node --test)
├── e2e/                # *.spec.mjs  (Playwright)
├── security/           # *.test.mjs y *.spec.mjs
└── helpers/            # carga de scripts en jsdom, lectura de JSON
```

```bash
cd tests && npm install && npx playwright install chromium webkit
npm test                # unit + security + e2e + perf (local)
npm run test:unit
npm run test:e2e
npm run test:security
npm run test:perf       # rendimiento, aparte y en serie (el paralelo falsea el LCP)
npm run test:prod       # BASE_URL=https://kukobaezgallery.netlify.app — cabeceras y formulario reales
```

### 12.2 Tests unitarios

**Datos — `artworks.json`**
- Es JSON válido y cada obra cumple el esquema de §3: campos obligatorios, tipos, `status` ∈ {available, sold, private, commissioned}.
- `id` único, kebab-case (`^[a-z0-9]+(-[a-z0-9]+)*$`). `order` único y entero. Hay entre 12 y 24 obras (ahora mismo 22).
- `title`, `description`, `medium` y `image.alt` tienen `en` y `es`, sin vacíos.
- `image.widths` ⊆ {640, 1280, 2000}, y cada `{base}-{w}.webp` existe en disco. `width` y `height` son > 0.
- Ningún `source` sale de `fotos para pintar/` ni de `mockups/`.
- No queda ningún `[[TODO` en un campo que se muestre en pantalla, o al menos queda listado como aviso.

**Textos — `i18n/{en,es}.json`**
- Los dos archivos tienen exactamente el mismo conjunto de claves (hoy 183).
- Cada `data-i18n` de los HTML y cada `I18n.t('…')` de los JS existe en los dos diccionarios.
- Las claves siguen la notación `pagina.seccion.elemento`. Ningún valor está vacío.
- Los placeholders de interpolación coinciden entre EN y ES.

**`i18n.js`** (jsdom)
- Prioridad de idioma: `?lang` > `localStorage` > `navigator.language` (`es*`) > `en`.
- Un `?lang` inválido (`fr`, `<script>`, vacío) cae a `en` sin errores.
- Si `localStorage` lanza una excepción (modo privado), la página funciona igual.
- `setLang` actualiza `<html lang>`, `<title>`, la meta description y el canonical.
- `t()` con una clave inexistente devuelve el fallback y no lanza.
- Los valores con `[[TODO` no se muestran.

**`gallery.js`** (jsdom con `fetch` simulado)
- Ordena las obras con `featured` primero y después por `order`.
- Genera `srcset`, `sizes`, `width`, `height` y `alt` correctos. Las primeras obras usan `eager` y el resto `lazy`.
- Asigna `src` después de `srcset`/`loading`, para no repetir la regresión I1 de la ronda 1.
- Si `fetch` falla o el JSON está corrupto, muestra el mensaje de error de i18n y no deja la página en blanco.
- `Artworks.url(art)` genera `work.html?id=…` y conserva `lang`.

**`work.js`**
- Un `id` válido pinta título, año, técnica, medidas, estado y el enlace «Encargar algo similar».
- Los `id` inválido, vacío o malicioso muestran el estado «no encontrado».
- Anterior/siguiente: hay wrap-around o límites coherentes en la primera y la última obra.
- El JSON-LD `VisualArtwork` parsea y lleva `name`, `artMedium` e `inLanguage` del idioma activo.

**`contact.js`**
- Validación: campos obligatorios, formato de email, `aria-invalid` y foco al primer campo inválido, en EN y ES.
- El envío hace `POST /` con `form-name=contact` y `application/x-www-form-urlencoded`, e incluye `bot-field`.
- Un error de red o un HTTP ≠ 2xx muestra el estado de error y vuelve a habilitar el botón (sin doble envío).
- `?sent=1` muestra el éxito. Cualquier otro valor no muestra nada.

**`nav.js`**: el menú móvil alterna `aria-expanded` y se cierra con Esc.

**HTML estático** (parseo de los 6 `.html`)
- Cada página tiene un único `<h1>`, `lang`, `<title>`, meta description, canonical, `hreflang` en/es/x-default, Open Graph y `<main id="main">` con skip link.
- Todas las `<img>` tienen `alt`, `width` y `height`.
- No hay enlaces internos rotos (`href`/`src` → archivo existente).
- `404.html` tiene `noindex` y rutas absolutas.
- Las URLs de `sitemap.xml` coinciden con las páginas publicables. `robots.txt` apunta al sitemap.

**CSS**: fuera de `tokens.css` no hay colores, tamaños ni tiempos sueltos (regex sobre `#hex`, `rgb(`, `px`/`ms` en propiedades de diseño, con una lista blanca justificada).

### 12.3 Tests de integración / E2E (Playwright)

Se ejecutan con una matriz de **320, 375, 768 y 1440 px × EN/ES × Chromium/WebKit**, sobre las 8 URLs de QA: index, primera obra, última obra, obra inválida, about, commissions, contact y 404.

- **Consola limpia**: 0 errores y 0 avisos. Ninguna petición con estado ≥ 400, salvo la 404 esperada.
- **Sin scroll horizontal** (`scrollWidth <= clientWidth`) y **áreas táctiles ≥ 44 px**.
- **axe-core**: 0 violaciones `serious`/`critical`. Contraste ≥ 4.5:1.
- **Recorrido de quien contrata**: home → clic en una obra → detalle → ← → con el teclado → Esc vuelve a la galería → «Encargar algo similar» → contact con el tipo de proyecto preseleccionado (si aplica) → el formulario valida.
- **Idioma**: el conmutador EN/ES cambia todos los textos, `lang`, `<title>` y la URL. La elección persiste al navegar y al recargar.
- **Formulario**: con la ruta `POST /` interceptada (200 y 500), se comprueba el estado de éxito y el de error. El honeypot no se ve ni se puede enfocar.
- **Sin JS** (`javaScriptEnabled: false`): navegación, enlaces y formulario nativo siguen usables.
- **Lazy loading**: con el contexto recién abierto a 375 px se cargan como máximo las imágenes `eager`. Al hacer scroll llegan las 22, sin descargas duplicadas.
- **Rendimiento** (Chromium, 4G simulado + CPU ×4): LCP < 2,5 s en la home y en el detalle. El peso total de la home en la primera vista es < 1,5 MB.
- **`prefers-reduced-motion: reduce`**: no hay transiciones con duración > 0.
- **SEO**: el JSON-LD de home y detalle parsea, y no aparece ningún `[[TODO`/`[[PROPUESTA` visible (texto, `alt`, `title`, `aria-label`, `placeholder`, `<meta>`, JSON-LD).

### 12.4 Tests de seguridad

Objetivo: un sitio estático que no pueda usarse para inyectar contenido, que no filtre datos personales y que tenga cabeceras HTTP endurecidas.

**Inyección / XSS (E2E)**
- En `work.html?id=` se prueban cargas maliciosas: `<img src=x onerror=alert(1)>`, `"><script>alert(1)</script>`, `javascript:alert(1)`, `../../etc/passwd`, `%00` y un id de 10 000 caracteres. No se dispara ningún `dialog`, no aparece ningún nodo `<script>`/`<img>` nuevo fuera de los esperados y se muestra «no encontrado».
- Se repite con `?lang=` y `?sent=`, y con `localStorage` envenenado con valores arbitrarios.
- Se escribe HTML en los campos del formulario: no se refleja como HTML en la página.
- **Estático**: se prohíbe por grep `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, `setTimeout('string')` y `on*=` inline en `frontend/**`. Las URLs que se asignan a `href`/`src` desde datos solo pueden ser relativas o `https:`, nunca `javascript:`/`data:`.

**Cabeceras HTTP** (`netlify.toml`, dueño `frontend-dev`; se verifican contra `test:prod` y contra el deploy preview)
- `Content-Security-Policy`: `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests`. **Requisito previo**: el `<script>` inline que añade la clase `js` se mueve a un archivo o se autoriza con `'sha256-…'`. El test comprueba que no hay ninguna violación de CSP en consola.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (además de `frame-ancestors`)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Cross-Origin-Opener-Policy: same-origin`
- Caché: los JSON e HTML se revalidan, y `assets/img/**` lleva `Cache-Control: public, max-age=31536000, immutable`.
- HTTP → HTTPS con redirección 301.

**Formulario y spam**
- `netlify-honeypot="bot-field"` presente. En `test:prod`, un envío con `bot-field` relleno no aparece en Netlify.
- `maxlength` en todos los campos (nombre ≤ 100, email ≤ 254, mensaje ≤ 5 000) y `type="email"`.
- La respuesta de éxito no refleja ningún dato enviado.
- Recomendación: activar en Netlify el filtro de spam y las notificaciones por email (manual, Rodrigo).

**Privacidad y fuga de datos**
- `npm run verify` (tools/images) dentro de `npm test`: 0 imágenes con EXIF/GPS, incluidos `portrait.webp` y el `og:image`.
- No se publica nada sensible en `frontend/`: ni `.env`, `.git`, `*.map`, `*.psd`/originales, ni `manifest.json` con rutas locales (`C:\Users\…`). Un grep de rutas absolutas en `frontend/**` debe dar 0.
- **Escaneo de secretos** del repo y del historial (`npx gitleaks detect` o equivalente): 0 hallazgos.
- Ningún archivo de `fotos para pintar/` ni de `mockups/` llega a `frontend/`. Se comprueba con nombres contra la lista de la carpeta origen, sin leer su contenido.
- Los enlaces externos (`https://` a otro origen) llevan `rel="noopener"` (y `noreferrer` si tienen `target="_blank"`).
- Ningún recurso de terceros fuera de la lista blanca: `fonts.googleapis.com` y `fonts.gstatic.com`. Sin trackers.

**Dependencias**
- `npm audit --omit=dev` en `tools/images/` y `tests/`: 0 vulnerabilidades `high`/`critical`.
- Versiones fijadas con lockfile.

**Disponibilidad**
- Una ruta inexistente devuelve un **404 real** (estado HTTP), no un 200.
- `/backend`, `/api` y `/.git/config` devuelven 404 en producción.
- El dominio antiguo de Render, cuando Rodrigo lo apague, ya no responde (manual).

### 12.5 Criterios de aceptación

- **Bloqueante** (no se despliega): cualquier fallo de unit, de seguridad, de axe `serious`/`critical`, de consola o de scroll horizontal, o cualquier XSS.
- **Importante**: LCP ≥ 2,5 s, cabeceras incompletas o `npm audit` con `moderate`.
- Cada fallo se asigna al agente dueño del archivo (§8). `qa-reviewer` no corrige el sitio.
