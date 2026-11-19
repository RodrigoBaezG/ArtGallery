/* ==========================================================================
   home-preload.js — precarga de la primera obra de la categoría activa
   Se carga SIN defer en el <head> de index.html: inyecta un
   <link rel="preload" as="image"> de la primera obra de ?category (inválido o
   ausente → watercolor), que es el LCP en móvil. Un preload estático en el
   HTML se descargaba también en la otra categoría (QA, 2026-11-19).
   - window.GallerySizes(image): atributo sizes de la galería en filas. Fuente
     única: gallery.js lo usa para cada <img>; si el preload y el <img> no
     coincidieran en sizes/srcset, el navegador descargaría dos variantes.
   - FIRST: generado por tools/site/build.mjs desde data/artworks.json (no
     editar a mano; regenerar si cambia el orden o la portada de una categoría).
   ========================================================================== */
(function () {
  'use strict';

  var ROW = 288; // --gallery-row-height (18rem) en px
  var ROW_LG = 352; // --gallery-row-height-lg (22rem) en px
  // Margen por el crecimiento flex de cada fila (medido: huecos ~1,16× la
  // base). sizes va en px CSS: el navegador ya multiplica por el DPR.
  var GROW = 1.15;
  // Variante pequeña (lado largo 640). Si la estimación en escritorio la
  // supera por poco (≤ 10 %), se anuncia 640: con DPR 1 se pedía la 1280
  // (3–4× más peso) para huecos de 650–760 px, cuando otras obras de la
  // misma página ya se ven a ~800 px desde la 640. Con DPR ≥ 2 no cambia nada.
  var SMALL = 640;
  var TOLERANCE = 1.1;

  function sizes(image) {
    var ratio = image.width / image.height;
    var lg = Math.min(Math.round(ROW_LG * ratio * GROW), 1344);
    if (lg > SMALL && lg <= SMALL * TOLERANCE) lg = SMALL;
    // Apaisadas: entre 40em y 80em suelen llenar la fila entera.
    var md = ratio > 1.3 ? 'calc(100vw - 4rem)' : Math.min(Math.round(ROW * ratio * GROW), 900) + 'px';
    return '(min-width: 80em) ' + lg + 'px, (min-width: 40em) ' + md + ', calc(100vw - 2rem)';
  }
  window.GallerySizes = sizes;

  /* @generated:first-artworks (tools/site/build.mjs) */
  var FIRST = {"watercolor":{"base":"assets/img/works/moonlit-sorceress","widths":[640,1280,2000],"width":1532,"height":2000},"drawing":{"base":"assets/img/works/dumbledore-pensieve","widths":[640,1280,2000],"width":1732,"height":2000}};
  /* @end:first-artworks */

  var param = new URLSearchParams(location.search).get('category');
  var image = FIRST[param === 'drawing' ? 'drawing' : 'watercolor'];
  if (!image || !document.head) return;

  // Mismo cálculo que gallery.js (Artworks.srcset/variantWidth).
  var srcset = image.widths.map(function (n) {
    return image.base + '-' + n + '.webp ' + Math.round(n * image.width / Math.max(image.width, image.height)) + 'w';
  }).join(', ');

  var link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = image.base + '-' + image.widths[0] + '.webp';
  link.setAttribute('imagesrcset', srcset);
  link.setAttribute('imagesizes', sizes(image));
  link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
})();
