/* ==========================================================================
   work.js — detalle de obra (work.html?id=slug)
   Imagen grande con srcset, metadatos (sin los TODO), estado, CTA de encargo,
   anterior/siguiente en el orden de la galería y teclado (← → Esc).
   Actualiza title, meta description, Open Graph, canonical/hreflang y el
   JSON-LD VisualArtwork en cada cambio de idioma.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-work]');
  if (!root) return;

  var I18n = window.I18n;
  var Artworks = window.Artworks;
  var id = new URLSearchParams(location.search).get('id') || '';
  var SITE = I18n.site;
  var STATUSES = ['available', 'sold', 'private', 'commissioned'];

  var state = { list: [], index: -1, image: null };

  /* ---- Utilidades DOM --------------------------------------------------- */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function link(className, href, text) {
    var a = el('a', className, text);
    a.href = href;
    return a;
  }

  function setMeta(selector, value) {
    var node = document.head.querySelector(selector);
    if (node) node.setAttribute('content', value);
  }

  function setLink(selector, href) {
    var node = document.head.querySelector(selector);
    if (node) node.setAttribute('href', href);
  }

  function absolute(path) {
    return new URL(path, SITE).href;
  }

  /* ---- SEO -------------------------------------------------------------- */
  function updateHead(art) {
    var title, desc, pageUrl;
    var robots = document.head.querySelector('meta[name="robots"]');

    if (!art) {
      title = I18n.t('meta.work.notFoundTitle');
      desc = I18n.t('meta.notFound.description');
      if (!robots) {
        robots = el('meta');
        robots.name = 'robots';
        robots.content = 'noindex';
        document.head.appendChild(robots);
      }
    } else {
      var name = I18n.artworkText(art.title);
      title = I18n.t('meta.work.title', { title: name });
      desc = I18n.t('meta.work.description', { title: name });
      if (robots) robots.remove();
    }

    if (title) document.title = title;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', desc);

    if (!art) return;

    pageUrl = absolute(Artworks.url(art));
    var hasLang = new URLSearchParams(location.search).has('lang');
    var canonical = hasLang ? pageUrl + '&lang=' + I18n.lang : pageUrl;
    setLink('link[rel="canonical"]', canonical);
    setLink('link[hreflang="en"]', pageUrl + '&lang=en');
    setLink('link[hreflang="es"]', pageUrl + '&lang=es');
    setLink('link[hreflang="x-default"]', pageUrl);
    setMeta('meta[property="og:url"]', canonical);
    setMeta('meta[property="og:type"]', 'article');

    // og:image se queda en el JPG genérico del <head>: los scrapers sociales no
    // ejecutan JS y el webp tiene soporte irregular (ver QA M8).
    var img = art.image;

    var data = {
      '@context': 'https://schema.org',
      '@type': 'VisualArtwork',
      name: I18n.artworkText(art.title),
      url: pageUrl,
      image: absolute(Artworks.file(img, 2000)),
      artform: I18n.lang === 'es' ? 'Pintura' : 'Painting',
      artMedium: I18n.artworkText(art.medium),
      inLanguage: I18n.lang,
      creator: {
        '@type': 'Person',
        name: 'Kuko Báez',
        alternateName: 'Rodrigo Báez',
        url: SITE
      }
    };
    var description = I18n.artworkText(art.description);
    if (description) data.description = description;
    var year = Artworks.field(art.year);
    if (year) data.dateCreated = year;

    var script = document.getElementById('jsonld-artwork');
    if (!script) {
      script = el('script');
      script.type = 'application/ld+json';
      script.id = 'jsonld-artwork';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  /* ---- Estado "no encontrada" ------------------------------------------ */
  function renderNotFound() {
    root.textContent = '';
    var header = el('header', 'page-header'); // ya está dentro de .container
    header.appendChild(el('h1', 'page-header__title', I18n.t('work.notFound.heading')));
    header.appendChild(el('p', 'page-header__lead', I18n.t('work.notFound.text')));
    var actions = el('div', 'page-header__actions');
    actions.appendChild(link('button button--primary', 'index.html#gallery', I18n.t('work.notFound.cta')));
    header.appendChild(actions);
    root.appendChild(header);
    updateHead(null);
  }

  /* ---- Detalle ---------------------------------------------------------- */
  function metaRow(termKey, value) {
    var row = el('div', 'work__meta-row');
    row.appendChild(el('dt', 'work__meta-term', I18n.t(termKey)));
    row.appendChild(el('dd', 'work__meta-value', value));
    return row;
  }

  function navLink(art, dir) {
    var a = link('work-nav__link work-nav__link--' + dir, Artworks.url(art));
    a.rel = dir;
    a.appendChild(el('span', 'work-nav__label', I18n.t(dir === 'prev' ? 'work.nav.previous' : 'work.nav.next')));
    a.appendChild(el('span', 'work-nav__title', I18n.artworkText(art.title)));
    return a;
  }

  function buildImage(art) {
    var img = art.image;
    var image = el('img', 'work__image');
    // src al final: así el navegador elige ya con srcset/sizes (sin descarga doble).
    image.decoding = 'async';
    image.setAttribute('fetchpriority', 'high');
    image.width = img.width;
    image.height = img.height;
    image.sizes = '(min-width: 60em) 62vw, 100vw';
    image.srcset = Artworks.srcset(img);
    image.src = Artworks.file(img, 1280);
    return image;
  }

  function render() {
    var list = state.list;
    var index = state.index;
    var art = list[index];
    var focusInside = root.contains(document.activeElement) && document.activeElement !== document.body;

    root.textContent = '';
    var article = el('article', 'work');

    var figure = el('figure', 'work__figure');
    if (!state.image) state.image = buildImage(art);
    state.image.alt = I18n.artworkText(art.image.alt);
    figure.appendChild(state.image);
    article.appendChild(figure);

    var body = el('div', 'work__body');
    body.appendChild(el('p', 'work__position', I18n.t('work.nav.position', { current: index + 1, total: list.length })));
    body.appendChild(el('h1', 'work__title', I18n.artworkText(art.title)));

    var dl = el('dl', 'work__meta');
    var year = Artworks.field(art.year);
    var medium = I18n.artworkText(art.medium);
    var dims = Artworks.field(art.dimensions);
    if (year) dl.appendChild(metaRow('work.meta.year', year));
    if (medium) dl.appendChild(metaRow('work.meta.medium', medium));
    if (dims) dl.appendChild(metaRow('work.meta.dimensions', dims));
    if (dl.children.length) body.appendChild(dl);

    var status = Artworks.field(art.status);
    if (STATUSES.indexOf(status) !== -1) {
      body.appendChild(el('p', 'work__status status status--' + status, I18n.t('common.status.' + status)));
    }

    var description = I18n.artworkText(art.description);
    if (description) {
      var prose = el('div', 'work__description prose');
      description.split(/\n{2,}/).forEach(function (para) { prose.appendChild(el('p', '', para)); });
      body.appendChild(prose);
    }

    body.appendChild(link('work__cta button button--secondary', 'commissions.html', I18n.t('work.actions.commissionSimilar')));
    if (status === 'available') {
      var inquire = el('p');
      inquire.appendChild(link('quiet-link', 'contact.html', I18n.t('work.actions.inquire')));
      body.appendChild(inquire);
    }
    article.appendChild(body);

    var nav = el('nav', 'work-nav');
    nav.setAttribute('aria-label', I18n.t('work.nav.label'));
    if (index > 0) nav.appendChild(navLink(list[index - 1], 'prev'));
    nav.appendChild(link('work-nav__back', 'index.html#gallery', I18n.t('work.nav.back')));
    if (index < list.length - 1) nav.appendChild(navLink(list[index + 1], 'next'));
    nav.appendChild(el('p', 'visually-hidden', I18n.t('work.nav.keyboardHint')));

    root.appendChild(article);
    root.appendChild(nav);
    updateHead(art);
    if (focusInside) {
      var h1 = root.querySelector('.work__title');
      h1.tabIndex = -1;
      h1.focus();
    }
  }

  /* ---- Teclado ---------------------------------------------------------- */
  function onKey(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    var target = null;
    if (e.key === 'ArrowLeft') target = root.querySelector('.work-nav__link--prev');
    else if (e.key === 'ArrowRight') target = root.querySelector('.work-nav__link--next');
    else if (e.key === 'Escape') target = root.querySelector('.work-nav__back') || { href: 'index.html#gallery' };
    if (!target) return;
    e.preventDefault();
    location.href = target.href;
  }

  /* ---- Arranque --------------------------------------------------------- */
  // Aviso de carga: vacío y con hidden en el HTML; se muestra solo si los datos
  // aún no han llegado cuando el idioma ya está listo. render() lo elimina.
  var notice = root.querySelector('[data-work-status]');
  var drawn = false;
  I18n.ready.then(function () {
    if (drawn || !notice) return;
    notice.textContent = I18n.t('common.a11y.loading');
    notice.hidden = false;
  });

  Promise.all([I18n.ready, Artworks.load()]).then(function (res) {
    state.list = res[1];
    state.index = state.list.findIndex(function (art) { return art.id === id; });
    var draw = state.index === -1 ? renderNotFound : render;
    drawn = true;
    draw();
    document.addEventListener('i18n:change', draw);
    if (state.index !== -1) document.addEventListener('keydown', onKey);
  }).catch(function (err) {
    console.error('[work]', err);
    drawn = true;
    renderNotFound();
  });
})();
