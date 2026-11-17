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
- **Despliegue**: Netlify, carpeta publicada `frontend/`. URL actual: `https://kukobaezartgallery.netlify.app/`.
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

- **Home**: nombre, una línea de posicionamiento (p. ej. “Watercolor illustrator — editorial, books & commissions”) y la obra justo debajo. Sin banners grandes.
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
| `qa-reviewer` | Verificación: responsive, accesibilidad, rendimiento, i18n, enlaces | `docs/qa/**` (solo informes) | Todo lo demás (no corrige, reporta) |

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

- [ ] Fase 1 — Diseño, imágenes y textos (agentes en paralelo).
- [ ] Fase 2 — Reescritura del frontend estático y bilingüe.
- [ ] Fase 3 — QA y correcciones.
- [ ] Fase 4 — Limpieza: borrar imágenes antiguas (`painting*`, `drawing*`, `digital*`, banner), `serve.json` si deja de usarse. Etiquetar `v1-api` en git y eliminar `backend/` **solo con confirmación de Rodrigo**. Después, Rodrigo apaga el servicio en Render.
- [ ] Fase 5 — Actualizar `README.md` y desplegar.

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
