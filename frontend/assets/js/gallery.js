/* ==========================================================================
   gallery.js — catálogo (data/artworks.json) y galería de la home
   - window.Artworks: carga, orden (featured → order) y atributos de imagen;
     lo reutiliza work.js.
   - Si existe [data-gallery], pinta la galería en filas (gallery__grid--rows).
   Nota de imágenes: el número de {base}-{n}.webp es el LADO LARGO. El ancho
   real de cada variante = round(n * width / max(width, height)), con
   image.width / image.height de la variante de 2000.
   ========================================================================== */
(function () {
  'use strict';

  var BASE = new URL('../../', document.currentScript ? document.currentScript.src : location.href);
  var dataPromise = null;

  function load() {
    if (!dataPromise) {
      dataPromise = fetch(new URL('data/artworks.json', BASE))
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(sort);
    }
    return dataPromise;
  }

  function sort(list) {
    return list.slice().sort(function (a, b) {
      if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
      return (a.order || 0) - (b.order || 0);
    });
  }

  function variantWidth(image, n) {
    return Math.round(n * image.width / Math.max(image.width, image.height));
  }

  function file(image, n) {
    return image.base + '-' + n + '.webp';
  }

  function srcset(image) {
    return image.widths.map(function (n) {
      return file(image, n) + ' ' + variantWidth(image, n) + 'w';
    }).join(', ');
  }

  /* Valor válido de un campo simple (year/dimensions/status) o '' si es TODO. */
  function field(value) {
    if (value === null || value === undefined) return '';
    value = String(value);
    return window.I18n.isTodo(value) ? '' : window.I18n.clean(value);
  }

  window.Artworks = {
    load: load,
    file: file,
    srcset: srcset,
    variantWidth: variantWidth,
    field: field,
    url: url
  };

  /* Enlace al detalle. Conserva el idioma si la página lo lleva en ?lang
     (con localStorage bloqueado es lo único que lo mantiene al navegar).
     bare = true: sin lang (base para canonical/hreflang en work.js). */
  function url(art, bare) {
    var href = 'work.html?id=' + encodeURIComponent(art.id);
    if (!bare && window.I18n && new URLSearchParams(location.search).has('lang')) {
      href += '&lang=' + encodeURIComponent(window.I18n.lang);
    }
    return href;
  }

  /* ---- Galería de la home ---------------------------------------------- */
  var section = document.querySelector('[data-gallery]');
  if (!section) return;

  var grid = section.querySelector('.gallery__grid');
  var status = section.querySelector('[data-gallery-status]');
  // Primeras obras sin lazy. Fijo en 4: tests/e2e/perf.spec.mjs exige que las
  // 4 primeras se descarguen también en móvil (WebKit apenas precarga lazy).
  var EAGER = 4;
  var ROW = 288; // --gallery-row-height (18rem) en px
  var ROW_LG = 352; // --gallery-row-height-lg (22rem) en px
  // Margen por el crecimiento flex de cada fila (medido: huecos ~1,16× la
  // base). Con 1.4 se pedía la variante 1280 para huecos de ~610 px en DPR 1.
  // sizes va en px CSS: el navegador ya multiplica por el DPR.
  var GROW = 1.15;
  var items = [];

  function sizes(image) {
    var ratio = image.width / image.height;
    var lg = Math.min(Math.round(ROW_LG * ratio * GROW), 1344);
    // Apaisadas: entre 40em y 80em suelen llenar la fila entera.
    var md = ratio > 1.3 ? 'calc(100vw - 4rem)' : Math.min(Math.round(ROW * ratio * GROW), 900) + 'px';
    return '(min-width: 80em) ' + lg + 'px, (min-width: 40em) ' + md + ', calc(100vw - 2rem)';
  }

  // El aviso de estado no usa data-i18n: su clave cambia (cargando/vacío/error).
  var statusKey = 'home.gallery.loading'; // el HTML lo trae vacío: sin JS no se anuncia una carga eterna
  function setStatus(key) {
    statusKey = key;
    if (!status) return;
    if (key) status.textContent = window.I18n.t(key);
    status.classList.toggle('notice--error', key === 'home.gallery.error');
    status.hidden = !key; // [hidden] ya gana a cualquier display (base.css)
  }
  window.I18n.ready.then(function () { if (statusKey) setStatus(statusKey); });
  document.addEventListener('i18n:change', function () { if (statusKey) setStatus(statusKey); });

  function build(art, index) {
    var img = art.image;
    var li = document.createElement('li');
    li.className = 'gallery__item';
    // CSSOM (no atributo style): la CSP sin 'unsafe-inline' bloquearía setAttribute('style').
    li.style.setProperty('--w', String(img.width));
    li.style.setProperty('--h', String(img.height));

    var a = document.createElement('a');
    a.className = 'gallery__link';
    a.href = window.Artworks.url(art);

    var figure = document.createElement('figure');
    figure.className = 'gallery__figure';

    var media = document.createElement('div');
    media.className = 'gallery__media';

    var image = document.createElement('img');
    image.className = 'gallery__image';
    // Orden importante: src SIEMPRE al final. Si se asigna antes, la descarga
    // empieza sin lazy/srcset (descargas dobles y lazy loading roto).
    image.decoding = 'async';
    if (index >= EAGER) image.loading = 'lazy';
    if (index === 0) image.setAttribute('fetchpriority', 'high');
    image.width = img.width;
    image.height = img.height;
    image.sizes = sizes(img);
    image.srcset = srcset(img);
    image.src = file(img, img.widths[0]);

    var caption = document.createElement('figcaption');
    caption.className = 'gallery__caption';
    var title = document.createElement('span');
    title.className = 'gallery__title';
    caption.appendChild(title);

    var year = field(art.year);
    if (year) {
      var meta = document.createElement('span');
      meta.className = 'gallery__meta';
      meta.textContent = year;
      caption.appendChild(meta);
    }

    media.appendChild(image);
    figure.appendChild(media);
    figure.appendChild(caption);
    a.appendChild(figure);
    li.appendChild(a);

    items.push({ art: art, link: a, img: image, title: title });
    return li;
  }

  function translate() {
    items.forEach(function (item) {
      item.link.href = window.Artworks.url(item.art); // ?lang puede haber cambiado
      item.title.textContent = window.I18n.artworkText(item.art.title);
      item.img.alt = window.I18n.artworkText(item.art.image.alt);
    });
  }

  Promise.all([window.I18n.ready, load()]).then(function (res) {
    var list = res[1];
    if (!list.length) { setStatus('home.gallery.empty'); return; }
    var frag = document.createDocumentFragment();
    list.forEach(function (art, i) { frag.appendChild(build(art, i)); });
    grid.appendChild(frag);
    translate();
    setStatus('');
    document.addEventListener('i18n:change', translate);
  }).catch(function (err) {
    console.error('[gallery]', err);
    setStatus('home.gallery.error');
  });
})();
