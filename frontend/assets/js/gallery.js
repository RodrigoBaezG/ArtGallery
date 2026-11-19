/* ==========================================================================
   gallery.js — catálogo (data/artworks.json) y galería de la home
   - window.Artworks: carga, orden (featured → order), categorías y atributos
     de imagen; lo reutiliza work.js.
   - Si existe [data-gallery], pinta la galería en filas (gallery__grid--rows)
     de la categoría activa (?category=watercolor|drawing, por defecto
     watercolor). Las pestañas [data-category-tabs] cambian de categoría sin
     recargar (history.replaceState); sin JS son enlaces normales.
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

  /* ---- Categorías (CLAUDE.md §3) --------------------------------------- */
  var CATEGORIES = ['watercolor', 'drawing'];
  var DEFAULT_CATEGORY = 'watercolor';

  /* Categoría válida o la de por defecto (obras sin campo → watercolor). */
  function category(value) {
    return CATEGORIES.indexOf(value) !== -1 ? value : DEFAULT_CATEGORY;
  }

  function categoryOf(art) {
    return category(art && art.category);
  }

  /* Obras de una categoría, conservando el orden featured → order. */
  function inCategory(list, cat) {
    cat = category(cat);
    return list.filter(function (art) { return categoryOf(art) === cat; });
  }

  /* ?lang de la página actual, si lo lleva (sin localStorage es lo único que
     mantiene el idioma al navegar). */
  function langParam() {
    return window.I18n && new URLSearchParams(location.search).has('lang')
      ? '&lang=' + encodeURIComponent(window.I18n.lang) : '';
  }

  /* Enlace a la home con una categoría (+lang si aplica). */
  function categoryUrl(cat) {
    return 'index.html?category=' + category(cat) + langParam();
  }

  window.Artworks = {
    load: load,
    categories: CATEGORIES.slice(),
    category: category,
    categoryOf: categoryOf,
    inCategory: inCategory,
    categoryUrl: categoryUrl,
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
    return bare ? href : href + langParam();
  }

  /* ---- Galería de la home ---------------------------------------------- */
  var section = document.querySelector('[data-gallery]');
  if (!section) return;

  var grid = section.querySelector('.gallery__grid');
  var status = section.querySelector('[data-gallery-status]');
  // Primeras obras sin lazy. Fijo en 4: tests/e2e/perf.spec.mjs exige que las
  // 4 primeras se descarguen también en móvil (WebKit apenas precarga lazy).
  var EAGER = 4;
  var I18n = window.I18n;
  var announcer = section.querySelector('[data-gallery-announce]');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-category-tabs] [data-category]'));
  var active = category(new URLSearchParams(location.search).get('category'));
  var catalog = null; // lista completa ordenada, cuando llega
  var failed = false;
  // Una vista por categoría, construida la primera vez que se muestra y
  // reutilizada después: los mismos <img> (ya descargados o aún lazy) vuelven
  // al DOM, así que cambiar de pestaña no repite descargas ni adelanta las de
  // la categoría oculta. EAGER se aplica a las primeras de cada categoría.
  var views = {};

  // sizes de cada obra: fuente única en home-preload.js (el preload de la
  // primera obra debe coincidir exactamente con su <img>).
  function sizes(image) {
    return window.GallerySizes ? window.GallerySizes(image) : 'calc(100vw - 2rem)';
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
  I18n.ready.then(function () { if (statusKey) setStatus(statusKey); updateHead(); });
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

    return { li: li, art: art, link: a, img: image, title: title };
  }

  function translateItems(items) {
    items.forEach(function (item) {
      item.link.href = window.Artworks.url(item.art); // ?lang puede haber cambiado
      item.title.textContent = I18n.artworkText(item.art.title);
      item.img.alt = I18n.artworkText(item.art.image.alt);
    });
  }

  function translate() {
    Object.keys(views).forEach(function (cat) { translateItems(views[cat].items); });
  }

  /* ---- Pestañas, URL y <head> -------------------------------------------- */
  function markTabs() {
    tabs.forEach(function (tab) {
      var cat = category(tab.dataset.category);
      tab.href = categoryUrl(cat); // conserva ?lang si la página lo lleva
      if (cat === active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }

  function replaceUrl() {
    try {
      var url = new URL(location.href);
      url.searchParams.set('category', active); // lang (si está) se conserva
      history.replaceState(history.state, '', url);
    } catch (e) { /* ignorar */ }
  }

  function setHead(selector, attr, value) {
    var node = document.head.querySelector(selector);
    if (node) node.setAttribute(attr, value);
  }

  /* Canonical/hreflang/og:url de la categoría: watercolor es la home a secas;
     drawing es ?category=drawing (contenido distinto, autocanónica). Se
     ejecuta después de i18n.js, que en cada cambio de idioma reescribe el
     canonical solo con ?lang. */
  function updateHead() {
    var base = I18n.site + (active === DEFAULT_CATEGORY ? '' : '?category=' + active);
    var sep = base.indexOf('?') === -1 ? '?' : '&';
    var canonical = new URLSearchParams(location.search).has('lang') ? base + sep + 'lang=' + I18n.lang : base;
    setHead('link[rel="canonical"]', 'href', canonical);
    setHead('meta[property="og:url"]', 'content', canonical);
    setHead('link[hreflang="en"]', 'href', base + sep + 'lang=en');
    setHead('link[hreflang="es"]', 'href', base + sep + 'lang=es');
    setHead('link[hreflang="x-default"]', 'href', base);
  }

  /* Aviso para lectores de pantalla tras cambiar de pestaña con JS (el foco
     se queda en la pestaña; sin aviso no habría constancia de que la galería
     cambió). Región visualmente oculta para no añadir ruido visual. Si la
     clave no existe aún, t() devuelve '' y no se anuncia nada. */
  function announce(cat, count) {
    if (!announcer) return;
    var tab = tabs.filter(function (t) { return t.dataset.category === cat; })[0];
    var name = I18n.t('home.categories.' + cat) || (tab ? tab.textContent.trim() : cat);
    announcer.textContent = '';
    var text = I18n.t('home.categories.announce', { category: name, count: count });
    if (text) setTimeout(function () { announcer.textContent = text; }, 50);
  }

  /* ---- Render de la categoría activa ----------------------------------- */
  function show(announceIt) {
    markTabs();
    updateHead();
    if (!catalog) return;
    var view = views[active];
    if (!view) {
      view = views[active] = { items: inCategory(catalog, active).map(build) };
      translateItems(view.items);
    }
    var frag = document.createDocumentFragment();
    view.items.forEach(function (item) { frag.appendChild(item.li); });
    grid.textContent = '';
    grid.appendChild(frag);
    setStatus(view.items.length ? '' : 'home.gallery.empty');
    if (announceIt) announce(active, view.items.length);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      // Clic con modificador o rueda: comportamiento normal del enlace. Si el
      // catálogo falló, el enlace recarga (reintenta la carga).
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || failed) return;
      e.preventDefault();
      var cat = category(tab.dataset.category);
      if (cat === active) return;
      active = cat;
      replaceUrl();
      show(true);
    });
  });
  markTabs(); // aria-current correcto antes de que llegue el catálogo

  document.addEventListener('i18n:change', function () {
    if (announcer) announcer.textContent = ''; // no dejar un aviso en el otro idioma
    markTabs();
    updateHead();
    translate();
  });

  Promise.all([I18n.ready, load()]).then(function (res) {
    catalog = res[1];
    show(false);
  }).catch(function (err) {
    failed = true;
    console.error('[gallery]', err);
    setStatus('home.gallery.error');
  });
})();
