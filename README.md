# Kuko Báez — Watercolor Portfolio

Portfolio de acuarela de Kuko Báez (Rodrigo Báez), orientado a ilustración editorial, libros y encargos. Sitio estático y bilingüe (EN/ES).

**Web:** https://kukobaezartgallery.netlify.app/

## Stack

HTML, CSS y JavaScript vanilla, sin frameworks ni build step. Desplegado en Netlify (formulario con Netlify Forms). Las imágenes se procesan en local con Node + `sharp`.

## Estructura

```
frontend/          # sitio publicado
├── *.html         # index (galería), work, about, commissions, contact, 404
├── data/artworks.json   # catálogo de obras
├── i18n/{en,es}.json    # textos
└── assets/        # css, js, img/works (generadas), img/site
tools/images/      # pipeline de imágenes
docs/              # diseño, datos pendientes y QA
```

## Desarrollo local

```bash
npx serve frontend
```

Abre `http://localhost:3000/index.html`. No funciona abriendo el HTML directamente (`file://`), porque los datos se cargan con `fetch`.

## Añadir o cambiar obras

1. Añade el original a `tools/images/manifest.json` (`source` → `id`).
2. Genera las imágenes y verifica que no lleven metadatos:

   ```bash
   cd tools/images
   npm install
   npm run build
   npm run verify
   ```

3. Completa título, alt, año, medidas y estado en `frontend/data/artworks.json` (EN y ES).

Los originales viven fuera del repo y nunca se suben.

## Despliegue

Netlify publica la carpeta `frontend/` según `netlify.toml`, sin paso de build.

## Historial

La versión anterior (galería general con API Express + PostgreSQL en Render) se conserva en el tag `v1-api`.

## Contacto

[Instagram @kuko.baez](https://www.instagram.com/kuko.baez/) · rkbaezgarcia@gmail.com

© 2026 Rodrigo Báez. All rights reserved.
