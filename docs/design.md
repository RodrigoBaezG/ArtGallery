# Sistema visual — Portfolio de acuarela de Kuko Báez

> Mantenido por el agente `art-director`. Fuente única de los valores: `frontend/assets/css/tokens.css`.
> Si `frontend-dev` necesita una clase que no está aquí, la pide; no inventa estilos en el HTML.

## 0. Idea

Una hoja de papel en una sala silenciosa. Fondo de papel cálido, tinta suave, un único acento índigo diluido (el mismo azul-violeta de las aguadas de las obras), mucho aire. La interfaz no tiene sombras, ni texturas, ni manchas: la única "acuarela" de la página es la obra.

Las obras (vistas en `assets/img/works/*-640.webp`) son retratos y escenas con blancos amplios del papel, aguadas índigo/violeta y acentos carmín y naranja. Por eso el acento es índigo apagado: armoniza con casi todas y no compite con los rojos.

---

## 1. Archivos y orden de carga

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@400;500&display=swap">
<link rel="stylesheet" href="assets/css/tokens.css">
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" href="assets/css/components.css">
<link rel="stylesheet" href="assets/css/pages/home.css"> <!-- una por página -->
```

| Página | CSS de página |
|---|---|
| `index.html` | `pages/home.css` |
| `work.html` | `pages/work.css` |
| `about.html` | `pages/about.css` |
| `commissions.html` | `pages/commissions.css` |
| `contact.html` | `pages/contact.css` |

- Las fuentes se cargan con `<link>` en el HTML (no con `@import` en CSS, que retrasa el render).
- **Clase `js` en `<html>`**: el menú móvil solo se pliega si existe. Añadir en el `<head>`, antes de los CSS:
  `<script>document.documentElement.classList.add('js')</script>`. Sin JS el menú se ve completo en una segunda línea.

**CSS obsoletos**: `assets/css/styles.css`, `mobilefirst.css`, `gallery.css`, `detail.css` y `commissions.css` (el de la raíz de `css/`, no `pages/commissions.css`). Desde la ronda 1 de QA ningún HTML los referencia. Se borran en la Fase 4, **antes del primer despliegue** (QA M13) y con confirmación de Rodrigo.

**Atributo `hidden`**: `base.css` incluye `[hidden] { display: none !important; }`. Para ocultar algo basta `hidden`, aunque el componente fije `display` (QA M2).

---

## 2. Paleta

Contrastes calculados con la fórmula WCAG 2.x (luminancia relativa).

| Token | Hex | Rol |
|---|---|---|
| `--color-paper` | `#FAF8F4` | Fondo general |
| `--color-surface` | `#F3EFE8` | Superficie secundaria, fondo mientras carga una imagen |
| `--color-field` | `#FFFFFF` | Fondo de campos de formulario |
| `--color-line` | `#E3DDD3` | Bordes y separadores de 1 px (decorativos) |
| `--color-line-strong` | `#958D81` | Borde de campos de formulario |
| `--color-ink` | `#3A3835` | Texto principal, títulos |
| `--color-ink-soft` | `#69635B` | Texto secundario, metadatos, placeholders |
| `--color-accent` | `#46567A` | Índigo diluido: enlaces, botón primario, foco |
| `--color-accent-strong` | `#36435F` | Hover/activo del acento |
| `--color-accent-tint` | `#E9EBF1` | Fondo hover del botón secundario, selección |
| `--color-on-accent` | `#FAF8F4` | Texto sobre acento |
| `--color-error` | `#9A4A3C` | Terracota apagado: errores de formulario |
| `--color-success` | `#4F6B52` | Salvia oscuro: envío correcto |

### Contrastes comprobados

| Texto / elemento | Fondo | Ratio | Requisito |
|---|---|---|---|
| ink | paper | **11.02:1** | AA/AAA texto |
| ink | surface | 10.20:1 | AA/AAA |
| ink | field (blanco) | 11.69:1 | AA/AAA |
| ink-soft | paper | **5.60:1** | AA texto (4.5) |
| ink-soft | surface | 5.18:1 | AA |
| ink-soft | field | 5.94:1 | AA (placeholders) |
| accent | paper | **6.89:1** | AA texto |
| accent | surface | 6.38:1 | AA |
| accent | accent-tint | 6.13:1 | AA (hover botón secundario) |
| accent-strong | paper | 9.32:1 | AAA |
| on-accent (paper) | accent | **6.89:1** | AA (botón primario) |
| on-accent | accent-strong | 9.32:1 | AAA (hover) |
| error | paper / field | 5.79:1 / 6.14:1 | AA |
| success | paper / field | 5.57:1 / 5.90:1 | AA |
| line-strong (borde de campo) | paper / field | 3.09:1 / 3.28:1 | ≥ 3:1 (WCAG 1.4.11) |
| line | paper | 1.27:1 | Decorativo — nunca para información |

Reglas: sin negro puro; `--color-line` nunca separa algo cuya visibilidad sea necesaria (para eso `line-strong`). Sin modo oscuro en esta versión.

---

## 3. Tipografía

Dos familias (Google Fonts, `display=swap`):

- **Cormorant Garamond** (serif) — 400, 500, 400 italic. Títulos, nombre, títulos de obra, numeración de pasos.
- **Jost** (sans geométrica ligera) — 400, 500. Texto, navegación, botones, etiquetas.

| Token | Móvil (360 px) | Escritorio (1280 px) | Uso |
|---|---|---|---|
| `--font-size-xs` | 13 px | 13 px | Etiquetas en versalitas, metadatos |
| `--font-size-sm` | 14 px | 14 px | Nav, botones, labels |
| `--font-size-base` | 16 px | 17 px | Texto |
| `--font-size-md` | 18 px | 20 px | Título de obra en grid, h3, leads |
| `--font-size-lg` | 24 px | 30 px | h2, tagline del hero |
| `--font-size-xl` | 32 px | 44 px | h1 de página, título de obra |
| `--font-size-xxl` | 40 px | 64 px | Nombre en el hero |

- Interlineado: `--line-height-tight` 1.15 (títulos), `--line-height-snug` 1.35 (títulos pequeños, botones), `--line-height-body` 1.65 (texto).
- Tracking: títulos −0.01 em; etiquetas en mayúsculas +0.08 em (`--tracking-wide`).
- Ancho de lectura: `--measure` = 65ch.
- h1–h3 en serif 500; h4 en sans 500 mayúsculas pequeñas. Texto en sans 400 (no se usa 300: pierde contraste).

---

## 4. Espaciado, layout y breakpoints

**Escala (base 8 px)**: `--space-half` 4 · `--space-1` 8 · `--space-2` 16 · `--space-3` 24 · `--space-4` 32 · `--space-5` 40 · `--space-6` 48 · `--space-8` 64 · `--space-10` 80 · `--space-12` 96 · `--space-16` 128 px.

**Contenedores**

| Clase | Ancho máx. | Uso |
|---|---|---|
| `.container` | 72rem (1152 px) | Páginas de contenido |
| `.container--wide` | 90rem (1440 px) | Cabecera, hero, galería, detalle de obra, footer |
| `.container--narrow` | 48rem (768 px) | Formularios y páginas de texto |

Márgenes laterales: 16 px (móvil) → 32 px (≥ 640) → 48 px (≥ 1280).

**Breakpoints** (mobile-first, `min-width`; las media queries no admiten `var()`, por eso se escriben literales):

| Nombre | Valor | |
|---|---|---|
| sm | `40em` (640 px) | Galería a 2 columnas |
| md | `60em` (960 px) | Nav de escritorio, layouts a 2 columnas |
| lg | `80em` (1280 px) | Galería a 3 columnas, márgenes amplios |

Excepciones técnicas a "solo tokens" (aceptadas): `0`, `100%`, `auto`, `1fr`, `1px` del patrón `.visually-hidden` y los breakpoints anteriores.

**Alineación de contenedores (QA M10)**: todas las secciones de primer nivel de **todas** las páginas usan `container container--wide`, igual que la cabecera y el footer, para que la marca y los `h1` arranquen en el mismo borde izquierdo. El ancho del texto ya lo limitan `--measure`, `.prose` y los grids de cada página. `.container` (72rem) solo se mantiene para bloques que deban centrarse a propósito. Excepción: si un `.page-header` va **dentro** de un contenedor (p. ej. en `work.html`, obra no encontrada), no lleva la clase `container` (QA M4).

**Otros**: cabecera 64 px (`--header-height`), objetivos táctiles 44 × 44 px (`--tap-target`; `--tap-bleed` 8 px de relleno lateral compensado para enlaces de texto sueltos), separación entre secciones 64 → 96 px.

---

## 5. Formas, bordes, foco

- Radios: `--radius-sm` 2 px (botones, campos) o ninguno. Las imágenes de obra **sin radio**.
- Bordes: 1 px, `--color-line` (decorativo) o `--color-line-strong` (campos).
- Sombras: ninguna, salvo `--shadow-soft` (casi invisible) en el panel del menú móvil.
- **Foco**: anillo de 2 px en índigo (`--color-accent`), separado 3 px, solo con `:focus-visible`. En campos el borde también pasa a índigo.

## 6. Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--duration-fast` | 150 ms | Color de enlaces, bordes |
| `--duration-base` | 250 ms | Apertura del menú móvil |
| `--duration-slow` | 400 ms | Hover de obra en la galería |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Todas las transiciones |

- Solo fundidos y desplazamientos cortos: hover de obra = opacidad 0.92 + subida de 2 px; menú móvil = fundido + 8 px.
- `prefers-reduced-motion: reduce` → duraciones a 0.01 ms, desplazamiento de hover a 0 y sin `scroll-behavior: smooth` (definido en `tokens.css` y `base.css`).

---

## 7. Componentes (clases BEM y marcado de referencia)

Los textos del ejemplo son el fallback en inglés; en el HTML real llevan `data-i18n`.

### 7.1 Estructura de página

```html
<body>
  <a class="skip-link" href="#main" data-i18n="common.skip">Skip to content</a>
  <header class="site-header">…</header>
  <main id="main" class="site-main">…</main>
  <footer class="site-footer">…</footer>
</body>
```

### 7.2 Cabecera + nav + selector de idioma

- Móvil: marca | EN/ES | botón "Menu" (texto, sin icono). El menú se despliega bajo la cabecera.
- Escritorio (≥ 960 px): marca | enlaces | EN/ES. Botón oculto.
- Estado abierto: JS solo cambia `aria-expanded` del botón (`true`/`false`); el CSS hace el resto. Cerrar con Esc y al pulsar un enlace.
- Página actual: `aria-current="page"` (subrayado fino en tinta).
- Contacto: `nav__link--cta` (en índigo) — contacto a un clic desde cualquier página.
- Idioma activo: `aria-pressed="true"` en el botón (subrayado + tinta). Los botones llevan `lang` propio.
- La cabecera es `sticky` **solo con `html.js`**. Sin JS es estática, porque el menú ocupa una segunda línea y una cabecera fija taparía demasiado contenido en móvil (QA M3). Fondo papel y borde inferior de 1 px.
- En el panel móvil, la página actual va en peso 500 con subrayado fino bajo el texto (QA M7). En escritorio, el mismo subrayado fino de tinta (`text-decoration`, offset `--underline-offset-loose`), que sigue el ancho de la palabra.
- Área táctil (QA I2): `nav__link` mide ≥ 44 × 44 px (`min-width`/`min-height: var(--tap-target)`, texto centrado). Para no mover el texto ni cambiar el espacio visible entre enlaces, lleva relleno lateral `--tap-bleed` (8 px) compensado con el mismo margen negativo. En el panel móvil el enlace ocupa todo el ancho, alineado a la izquierda, sin relleno ni margen lateral. La misma regla se aplica a `site-footer__link` (§7.13).

```html
<header class="site-header">
  <div class="site-header__inner container container--wide">
    <a class="site-header__brand" href="index.html">Kuko Báez</a>
    <div class="site-header__tools">
      <div class="lang-switch" role="group" aria-label="Language" data-i18n-aria-label="common.lang.label">
        <button class="lang-switch__option" type="button" lang="en" data-lang="en" aria-pressed="true">EN</button>
        <span class="lang-switch__sep" aria-hidden="true">/</span>
        <button class="lang-switch__option" type="button" lang="es" data-lang="es" aria-pressed="false">ES</button>
      </div>
      <nav class="nav" aria-label="Main">
        <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-menu" data-i18n="common.nav.menu">Menu</button>
        <ul class="nav__menu" id="nav-menu" role="list">
          <li><a class="nav__link" href="index.html" aria-current="page" data-i18n="common.nav.work">Work</a></li>
          <li><a class="nav__link" href="about.html" data-i18n="common.nav.about">About</a></li>
          <li><a class="nav__link" href="commissions.html" data-i18n="common.nav.commissions">Commissions</a></li>
          <li><a class="nav__link nav__link--cta" href="contact.html" data-i18n="common.nav.contact">Contact</a></li>
        </ul>
      </nav>
    </div>
  </div>
</header>
```

El botón "Menu" debe cambiar su texto a "Close"/"Cerrar" al abrirse (clave i18n aparte). El botón tiene ancho fijo (`--nav-toggle-width`, 80 px) para que no cambie al abrir o cerrar. Por debajo de 22em los gaps de la cabecera bajan a 8 px, así cabe en una línea a 320 px en EN y ES (QA N3).

### 7.3 Hero (home)

Breve: en móvil la primera obra debe asomar en la primera pantalla. Nombre en serif xxl, tagline en serif itálica, ink-soft.

```html
<section class="hero container container--wide">
  <h1 class="hero__name">Kuko Báez</h1>
  <p class="hero__tagline" data-i18n="home.hero.tagline">Watercolor illustrator — editorial, books &amp; commissions</p>
  <div class="hero__actions">
    <a class="button button--primary" href="contact.html" data-i18n="home.hero.cta">Get in touch</a>
    <a class="button button--secondary" href="commissions.html" data-i18n="home.hero.ctaSecondary">Commissions</a>
  </div>
</section>
```

### 7.4 Galería + tarjeta de obra

- Variante `--rows` por debajo de 640 px: una obra por fila a ancho completo (`flex: 1 1 100%`), para que las verticales solas en su fila no queden más estrechas (QA I2).
- Masonry con **CSS columns**: 1 columna (< 640) · 2 (≥ 640) · 3 (≥ 1280). Sin JS de layout, sin recortes: la imagen conserva su proporción gracias a `width`/`height` + `height: auto`.
- Fondo `--color-surface` mientras la imagen carga (sin saltos de layout).
- Pie de tarjeta: título (serif) y año (sans xs, ink-soft). Siempre visible, también en móvil.
- Hover/foco: opacidad 0.92 y subida de 2 px; foco con anillo índigo.
- `sizes` recomendado: `(min-width: 80em) 30vw, (min-width: 40em) 46vw, 100vw`.
- **Orden**: con columns, el orden fluye de arriba abajo por columna (1ª obra arriba a la izquierda; la 2ª, debajo). Si se quiere que el orden curado se lea en filas (izquierda → derecha), usar el modificador **`gallery__grid--rows`** (filas justificadas con flexbox, sin JS), que necesita `style="--w: …; --h: …"` en cada `<li>` con `image.width`/`image.height`. Decisión de diseño: **usar `--rows`** si las 3–6 primeras obras deben verse juntas en la primera fila; columns si se prefiere el efecto masonry clásico. Ambas están implementadas.

```html
<section class="gallery container container--wide" id="gallery" aria-labelledby="gallery-title">
  <h2 class="visually-hidden" id="gallery-title" data-i18n="home.gallery.title">Selected work</h2>
  <ul class="gallery__grid" role="list">
    <li class="gallery__item" style="--w: 3000; --h: 4000">
      <a class="gallery__link" href="work.html?id=dog-red-collar">
        <figure class="gallery__figure">
          <div class="gallery__media">
            <img class="gallery__image"
                 src="assets/img/works/dog-red-collar-640.webp"
                 srcset="assets/img/works/dog-red-collar-640.webp 640w,
                         assets/img/works/dog-red-collar-1280.webp 1280w,
                         assets/img/works/dog-red-collar-2000.webp 2000w"
                 sizes="(min-width: 80em) 30vw, (min-width: 40em) 46vw, 100vw"
                 width="3000" height="4000"
                 alt="…" loading="lazy" decoding="async">
          </div>
          <figcaption class="gallery__caption">
            <span class="gallery__title">Dog with red collar</span>
            <span class="gallery__meta">2023</span>
          </figcaption>
        </figure>
      </a>
    </li>
  </ul>
</section>
```

(Las 2–3 primeras obras: sin `loading="lazy"`, la primera con `fetchpriority="high"`.)

**Aviso de carga o error** (`.notice`, `.notice--error`): texto pequeño en ink-soft con aire vertical; el error, en terracota. Sirve para la galería y para el «Loading…» del detalle de obra. Al terminar de cargar, se oculta con `hidden`.

```html
<p class="notice" role="status" data-gallery-status>Loading work…</p>
<!-- error: -->
<p class="notice notice--error" role="status" data-gallery-status>The work could not be loaded. <a href="https://instagram.com/…">See it on Instagram</a>.</p>
```

### 7.5 Estado de obra

`.status` + modificador. Solo `--available` usa el acento; el resto en ink-soft. Sin precios.

```html
<p class="status status--available" data-i18n="work.status.available">Original available — enquire</p>
<!-- status--sold | status--private | status--commissioned -->
```

### 7.6 Detalle de obra (`work.html`)

- Móvil: imagen arriba, ficha debajo. Escritorio: imagen 2/3 a la izquierda, ficha 1/3 a la derecha y fija (`sticky`) bajo la cabecera.
- Imagen **nunca recortada**: `object-fit: contain`, alto máximo 85 % de la ventana (`dvh`), sin radio, sobre fondo papel.
- Ficha: posición en la serie (`.work__position`, «3 of 22», versalitas pequeñas en ink-soft, sobre el título; sustituye a `eyebrow`), título (serif xl), metadatos en `<dl>` entre dos líneas finas, estado, descripción, CTA "Commission something similar".
- Navegación: anterior / volver / siguiente. Móvil: anterior y siguiente en una fila, "All work" debajo centrado. Escritorio: anterior | All work | siguiente. Si no hay anterior o siguiente, se omite ese enlace (el grid mantiene las posiciones).

```html
<div class="container container--wide">
  <article class="work">
    <figure class="work__figure">
      <img class="work__image" src="assets/img/works/flamenco-duo-1280.webp"
           srcset="… 640w, … 1280w, … 2000w"
           sizes="(min-width: 60em) 62vw, 100vw"
           width="3000" height="2000" alt="…" fetchpriority="high" decoding="async">
    </figure>
    <div class="work__body">
      <p class="work__position">3 of 22</p>
      <h1 class="work__title">Flamenco duo</h1>
      <dl class="work__meta">
        <div class="work__meta-row"><dt class="work__meta-term" data-i18n="work.meta.year">Year</dt><dd class="work__meta-value">2023</dd></div>
        <div class="work__meta-row"><dt class="work__meta-term" data-i18n="work.meta.medium">Medium</dt><dd class="work__meta-value">Watercolor on paper</dd></div>
        <div class="work__meta-row"><dt class="work__meta-term" data-i18n="work.meta.dimensions">Size</dt><dd class="work__meta-value">30 × 40 cm</dd></div>
      </dl>
      <p class="work__status status status--available">Original available — enquire</p>
      <div class="work__description prose"><p>…</p></div>
      <a class="work__cta button button--secondary" href="commissions.html" data-i18n="work.cta">Commission something similar</a>
    </div>
  </article>

  <nav class="work-nav" aria-label="Artwork navigation">
    <a class="work-nav__link work-nav__link--prev" href="work.html?id=…" rel="prev">
      <span class="work-nav__label" data-i18n="work.nav.prev">Previous</span>
      <span class="work-nav__title">Guitarist profile</span>
    </a>
    <a class="work-nav__back" href="index.html#gallery" data-i18n="work.nav.all">All work</a>
    <a class="work-nav__link work-nav__link--next" href="work.html?id=…" rel="next">
      <span class="work-nav__label" data-i18n="work.nav.next">Next</span>
      <span class="work-nav__title">Two dogs</span>
    </a>
  </nav>
</div>
```

### 7.7 Botones y enlaces

| Clase | Aspecto | Uso |
|---|---|---|
| `.button.button--primary` | Fondo índigo, texto papel; hover índigo oscuro | Acción principal (máx. 1 por vista) |
| `.button.button--secondary` | Borde índigo 1 px, texto índigo; hover fondo `accent-tint` | Acciones secundarias |
| `.button--block` | Ancho completo | Envío del formulario en móvil (opcional) |
| `[disabled]` / `aria-disabled="true"` | Opacidad 0.5 | Envío en curso |
| `a` (por defecto) | Índigo subrayado 1 px | Enlaces en texto |
| `.quiet-link` | Tinta con subrayado tono papel; índigo en hover; `inline-flex` con alto mínimo 44 px | Enlaces secundarios sueltos (p. ej. «consultar» en el detalle); no usar dentro de una frase |

Botones: mayúsculas pequeñas (14 px, +0.08 em), alto mínimo 44 px, radio 2 px.

```html
<a class="button button--primary" href="contact.html">Get in touch</a>
<button class="button button--secondary" type="button">…</button>
```

### 7.8 Cabecera de página (about / commissions / contact)

```html
<header class="page-header container container--wide">
  <p class="eyebrow" data-i18n="commissions.header.eyebrow">Custom watercolor</p>
  <h1 class="page-header__title" data-i18n="commissions.title">Commissions</h1>
  <p class="page-header__lead" data-i18n="commissions.lead">…</p>
  <div class="page-header__actions">                <!-- opcional: botones dentro del page-header (404, obra no encontrada) -->
    <a class="button button--primary" href="index.html#gallery">See all work</a>
  </div>
</header>
```

`.page-header__actions` sustituye a `cta__actions` cuando los botones van dentro de un `page-header` (`cta__actions` queda reservado al bloque `.cta`).

Utilidades de sección: `.section` (padding vertical 64 → 96 px), `.section--tight`, `.section__title`, `.section__lead`, `.prose` (texto largo, ≤ 65ch), `.eyebrow` (etiqueta pequeña en mayúsculas), `.divider` (`<hr>` fino).

### 7.9 CTA

Bloque sobrio separado por una línea fina. La línea es un `::before` que respeta el margen del contenedor (`--container-gutter`, definido en `.container`), igual que los separadores de sección (QA N4). Al final de home (opcional), work (opcional) y commissions (obligatorio).

```html
<section class="cta container container--wide">
  <h2 class="cta__title" data-i18n="commissions.cta.title">Have a project in mind?</h2>
  <p class="cta__text" data-i18n="commissions.cta.text">…</p>
  <div class="cta__actions">
    <a class="button button--primary" href="contact.html" data-i18n="commissions.cta.button">Start a commission</a>
  </div>
</section>
```

### 7.10 Formulario (`contact.html`, Netlify Forms)

- Etiquetas siempre visibles (nunca solo placeholder). Campos opcionales con `.form__optional`.
- Campo: fondo blanco, borde `line-strong` 1 px, radio 2 px, alto ≥ 44 px, texto 16–17 px (evita el zoom de iOS).
- Estados: hover (borde ink-soft) · foco (borde + anillo índigo) · error (`aria-invalid="true"` → borde terracota + `.form__error` enlazado con `aria-describedby`) · deshabilitado.
- Mensaje global: `.form__status` con `role="status"`, modificador `--success` / `--error`; vacío = oculto.

```html
<form class="form" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/contact.html?sent=1">
  <input type="hidden" name="form-name" value="contact">
  <p class="form__honeypot"><label>Don’t fill this out: <input name="bot-field"></label></p>

  <div class="form__field">
    <label class="form__label" for="name" data-i18n="contact.form.name">Name</label>
    <input class="form__input" id="name" name="name" type="text" autocomplete="name" required aria-describedby="name-error">
    <p class="form__error" id="name-error"></p>
  </div>

  <div class="form__field">
    <label class="form__label" for="email" data-i18n="contact.form.email">Email</label>
    <input class="form__input" id="email" name="email" type="email" autocomplete="email" required aria-describedby="email-error">
    <p class="form__error" id="email-error"></p>
  </div>

  <div class="form__field">
    <label class="form__label" for="project-type" data-i18n="contact.form.type">Project type</label>
    <select class="form__select" id="project-type" name="project-type">
      <option value="editorial">Editorial illustration</option>
      <option value="book">Book</option>
      <option value="pet-portrait">Pet portrait</option>
      <option value="custom">Custom artwork</option>
      <option value="other">Other</option>
    </select>
  </div>

  <div class="form__field">
    <label class="form__label" for="message" data-i18n="contact.form.message">Message</label>
    <p class="form__hint" id="message-hint" data-i18n="contact.form.messageHint">Size, deadline, references…</p>
    <textarea class="form__textarea" id="message" name="message" rows="6" required aria-describedby="message-hint message-error"></textarea>
    <p class="form__error" id="message-error"></p>
  </div>

  <div class="form__actions">
    <button class="button button--primary" type="submit" data-i18n="contact.form.submit">Send message</button>
  </div>
  <p class="form__status" role="status"></p>
</form>
```

### 7.11 Lista de contacto (email + Instagram)

Sin iconos decorativos: etiqueta en versalitas + enlace.

```html
<aside class="contact__aside">
  <ul class="contact-list" role="list">
    <li>
      <span class="contact-list__label" data-i18n="contact.email">Email</span>
      <a class="contact-list__link" href="mailto:[[TODO: email]]">[[TODO: email]]</a>
    </li>
    <li>
      <span class="contact-list__label">Instagram</span>
      <a class="contact-list__link" href="https://instagram.com/[[TODO]]" rel="me noopener">@[[TODO]]</a>
    </li>
  </ul>
</aside>
```

### 7.12 Enlace de descarga del CV

```html
<div class="about__downloads">
  <a class="download-link" href="assets/docs/cv-en.pdf" download hreflang="en" type="application/pdf">
    <span class="download-link__label" data-i18n="about.cv.en">CV (English)</span>
    <span class="download-link__meta">PDF</span>
  </a>
  <a class="download-link" href="assets/docs/cv-es.pdf" download hreflang="es" type="application/pdf">
    <span class="download-link__label" data-i18n="about.cv.es">CV (Español)</span>
    <span class="download-link__meta">PDF</span>
  </a>
</div>
```

### 7.13 Footer

El enlace de Instagram lleva un icono de línea **monocromo** (excepción a "sin iconos decorativos", decidida por Rodrigo). `site-footer__link--icon`: inline-flex, icono y texto centrados, separados por `--icon-gap` (8 px). `site-footer__icon`: 20 px (`--icon-size`), trazo 1.5 en `currentColor`, así que hereda la tinta suave y pasa a índigo en hover. El SVG va inline con `aria-hidden="true"` y el texto visible da el nombre accesible. El área táctil sigue en 44 px y el cambio de color dura 150 ms (0 con `prefers-reduced-motion`). No usar `assets/icons/instagram.svg` (a color).

Área táctil (QA I2): cada `site-footer__link` mide ≥ 44 × 44 px (`min-width`/`min-height: var(--tap-target)`, texto centrado), con relleno lateral `--tap-bleed` (8 px) compensado con margen negativo: «Email»/«Correo» siguen alineados con el nombre y el hueco de 24 px entre enlaces no cambia.

```html
<footer class="site-footer">
  <div class="site-footer__inner container container--wide">
    <p class="site-footer__name">Kuko Báez</p>
    <ul class="site-footer__links" role="list">
      <li><a class="site-footer__link" href="mailto:[[TODO: email]]" data-i18n="common.footer.email">Email</a></li>
      <li>
        <a class="site-footer__link site-footer__link--icon" href="https://www.instagram.com/kuko.baez/" rel="me noopener">
          <svg class="site-footer__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
          <span data-i18n="common.footer.instagramLabel">Instagram</span>
        </a>
      </li>
      <li><a class="site-footer__link" href="contact.html" data-i18n="common.nav.contact">Contact</a></li>
    </ul>
    <p class="site-footer__copy">© <span data-year>2026</span> Kuko Báez. <span data-i18n="common.footer.rights">All artworks © the artist.</span></p>
  </div>
</footer>
```

---

## 8. Composición de páginas

### About (`pages/about.css`)

```html
<header class="page-header container container--wide">…</header>
<section class="container container--wide section--tight">
  <div class="about__intro">
    <figure class="about__portrait"><img src="assets/img/site/portrait.webp" width="…" height="…" alt="…"></figure>
    <div>
      <div class="about__bio prose"><p>…</p></div>
      <div class="about__downloads">…download-link…</div>
    </div>
  </div>

  <section class="about__section">
    <h2 class="about__section-title" data-i18n="about.experience.title">Experience</h2>
    <ul class="cv-list" role="list">
      <li class="cv-list__item">
        <span class="cv-list__year">2024</span>
        <span class="cv-list__text">[[TODO: client / publication]]
          <span class="cv-list__detail">[[TODO: detail]]</span></span>
      </li>
    </ul>
  </section>
  <!-- repetir .about__section para publicaciones, exposiciones, herramientas y técnica -->
</section>
```

Retrato: máx. 22rem de ancho, sin radio. Escritorio: retrato 2/5, texto 3/5.

### Commissions (`pages/commissions.css`)

```html
<header class="page-header container container--wide">…</header>

<section class="section container container--wide">
  <h2 class="section__title">What I paint</h2>
  <ul class="commission-types" role="list">
    <li class="commission-type">
      <h3 class="commission-type__title">Editorial illustration</h3>
      <p class="commission-type__text">…</p>
    </li>
    <!-- libro, retrato de mascota, obra personalizada -->
  </ul>
</section>

<section class="section container container--wide">
  <h2 class="section__title">How it works</h2>
  <ol class="steps" role="list">
    <li class="steps__item">
      <div>
        <h3 class="steps__title">Brief</h3>
        <p class="steps__text">…</p>
      </div>
    </li>
  </ol>
</section>

<section class="section container container--wide">
  <h2 class="section__title">Timelines</h2>
  <dl class="facts">
    <div class="facts__item"><dt class="facts__term">Pet portrait</dt><dd class="facts__value">[[TODO]]</dd></div>
  </dl>
  <h3>What to send</h3>
  <ul class="checklist"><li>…</li></ul>
</section>

<section class="cta container container--wide">…</section>
```

Los pasos se numeran solos (01, 02…) en serif índigo mediante contador CSS: no escribir el número en el HTML. El `<ol>` conserva la semántica.

### Contact (`pages/contact.css`)

```html
<header class="page-header container container--wide">…</header>
<section class="container container--wide section--tight">
  <div class="contact">
    <form class="form" …>…</form>
    <aside class="contact__aside">…contact-list…</aside>
  </div>
</section>
```

Escritorio: formulario 3/5, datos de contacto 2/5 separados por una línea vertical.

---

## 9. Lista de clases disponibles

**Base / utilidades** (`base.css`): `js` (en `<html>`), atributo `[hidden]`, `skip-link`, `visually-hidden`, `site-main`, `container`, `container--wide`, `container--narrow`, `section`, `section--tight`, `section__title`, `section__lead`, `prose`, `eyebrow`, `divider`.

**Componentes** (`components.css`):
- Cabecera: `site-header`, `site-header__inner`, `site-header__brand`, `site-header__tools`
- Nav: `nav`, `nav__toggle`, `nav__menu`, `nav__link`, `nav__link--cta` (+ `aria-current="page"`, `aria-expanded`)
- Idioma: `lang-switch`, `lang-switch__option`, `lang-switch__sep` (+ `aria-pressed`)
- Cabecera de página: `page-header`, `page-header__title`, `page-header__lead`, `page-header__actions`
- Aviso de carga/error: `notice`, `notice--error`
- Galería: `gallery__grid`, `gallery__grid--rows`, `gallery__item`, `gallery__link`, `gallery__figure`, `gallery__media`, `gallery__image`, `gallery__caption`, `gallery__title`, `gallery__meta`
- Estado: `status`, `status--available`, `status--sold`, `status--private`, `status--commissioned`
- Botones/enlaces: `button`, `button--primary`, `button--secondary`, `button--block`, `quiet-link`
- CTA: `cta`, `cta__title`, `cta__text`, `cta__actions`
- Formulario: `form`, `form__field`, `form__label`, `form__optional`, `form__hint`, `form__input`, `form__select`, `form__textarea`, `form__error`, `form__actions`, `form__status`, `form__status--success`, `form__status--error`, `form__honeypot`
- Contacto/descarga: `contact-list`, `contact-list__label`, `contact-list__link`, `download-link`, `download-link__label`, `download-link__meta`
- Pie: `site-footer`, `site-footer__inner`, `site-footer__name`, `site-footer__links`, `site-footer__link`, `site-footer__link--icon`, `site-footer__icon`, `site-footer__copy`

**Páginas**:
- `home.css`: `hero`, `hero__name`, `hero__tagline`, `hero__actions`, `gallery`
- `work.css`: `work`, `work__position`, `work__figure`, `work__image`, `work__body`, `work__title`, `work__meta`, `work__meta-row`, `work__meta-term`, `work__meta-value`, `work__status`, `work__description`, `work__cta`, `work-nav`, `work-nav__link`, `work-nav__link--prev`, `work-nav__link--next`, `work-nav__label`, `work-nav__title`, `work-nav__back`
- `about.css`: `about__intro`, `about__portrait`, `about__bio`, `about__downloads`, `about__section`, `about__section-title`, `cv-list`, `cv-list__item`, `cv-list__year`, `cv-list__text`, `cv-list__detail`
- `commissions.css`: `commission-types`, `commission-type`, `commission-type__title`, `commission-type__text`, `steps`, `steps__item`, `steps__title`, `steps__text`, `facts`, `facts__item`, `facts__term`, `facts__value`, `checklist`
- `contact.css`: `contact`, `contact__aside`

## 10. Notas para otros agentes

- **frontend-dev**: no usar `style=""` salvo las variables `--w`/`--h` de la galería. No añadir colores ni tamaños en el HTML. Mantener `width`/`height` en todas las `<img>`.
- **image-curator**: las fotos de obra tienen un blanco de papel frío/grisáceo y la página es papel cálido; no corregir en silencio, pero señalar las obras con fondo muy gris o viñeteado (p. ej. sombras en bordes) para que Rodrigo decida. Retrato (`img/site/portrait`) y `og-image` aún no existen.
- **qa-reviewer**: verificar contraste con los ratios de §2, 44 px de área táctil en nav/idioma/botones, ausencia de scroll horizontal a 320 px y `prefers-reduced-motion`.
