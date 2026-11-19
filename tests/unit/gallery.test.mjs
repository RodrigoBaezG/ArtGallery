// §12.2 gallery.js (jsdom con fetch simulado)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPage, settle } from '../helpers/jsdom.mjs';
import { CATEGORIES, artworks, dict, flatten, inCategory } from '../helpers/paths.mjs';

const SCRIPTS = ['i18n.js', 'gallery.js'];
const DATA = artworks();
const EAGER = 4;
const en = flatten(dict('en'));
const es = flatten(dict('es'));
const WATERCOLORS = inCategory(DATA, 'watercolor');
const DRAWINGS = inCategory(DATA, 'drawing');
const BY = { watercolor: WATERCOLORS, drawing: DRAWINGS };

const galleryIds = (document) => [...document.querySelectorAll('.gallery__link')].map((a) => new URL(a.href).searchParams.get('id'));
const click = (window, el, init = {}) => {
  const ev = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  el.dispatchEvent(ev);
  return ev;
};

function variantWidth(image, n) {
  return Math.round(n * image.width / Math.max(image.width, image.height));
}

/** Registra el orden en que se asignan srcset/sizes/loading/src a cada <img>. */
function spyImages(window) {
  const proto = window.HTMLImageElement.prototype;
  const log = new window.WeakMap();
  for (const prop of ['src', 'srcset', 'sizes', 'loading']) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    Object.defineProperty(proto, prop, {
      configurable: true,
      get: desc.get,
      set(v) {
        if (!log.has(this)) log.set(this, []);
        log.get(this).push(prop);
        desc.set.call(this, v);
      }
    });
  }
  const origSetAttr = window.Element.prototype.setAttribute;
  window.Element.prototype.setAttribute = function (name, value) {
    if (this instanceof window.HTMLImageElement && ['src', 'srcset', 'sizes', 'loading'].includes(name)) {
      if (!log.has(this)) log.set(this, []);
      log.get(this).push(name);
    }
    return origSetAttr.call(this, name, value);
  };
  window.__imgLog = log;
}

test('las dos categorías tienen obras en el catálogo real', () => {
  assert.ok(WATERCOLORS.length > 0, 'sin obras con category=watercolor');
  assert.ok(DRAWINGS.length > 0, 'sin obras con category=drawing');
});

test('ordena featured primero y después por order, dentro de la categoría', async () => {
  // Datos barajados (categorías mezcladas, order repetido entre categorías)
  const shuffled = DATA.slice().reverse().map((a, i) => ({ ...a, featured: i % 5 === 0 }));
  for (const category of CATEGORIES) {
    const { document } = await loadPage('index.html', {
      search: `?category=${category}`,
      scripts: SCRIPTS,
      routes: { 'data/artworks.json': () => ({ body: JSON.stringify(shuffled) }) }
    });
    const expected = inCategory(shuffled, category).map((a) => a.id);
    assert.ok(expected.length > 0, `${category}: sin obras`);
    assert.deepEqual(galleryIds(document), expected, category);
  }
});

for (const [search, expected] of [
  ['', 'watercolor'],
  ['?category=watercolor', 'watercolor'],
  ['?category=drawing', 'drawing'],
  ['?category=drawing&lang=es', 'drawing'],
  ['?lang=es&category=drawing', 'drawing'],
  ['?category=', 'watercolor'],
  ['?category=painting', 'watercolor'],
  ['?category=%3Cscript%3Ealert(1)%3C%2Fscript%3E', 'watercolor'],
  ['?category=drawing%00', 'watercolor'],
  ['?category=__proto__', 'watercolor']
]) {
  test(`?category "${search || '(sin parámetro)'}" → pinta solo ${expected}`, async () => {
    const { document, errors } = await loadPage('index.html', { search, scripts: SCRIPTS });
    assert.ok(BY[expected].length > 0, `${expected}: sin obras en el catálogo`);
    assert.deepEqual(galleryIds(document), BY[expected].map((a) => a.id));
    assert.equal(errors.length, 0, String(errors[0]));
    assert.equal(document.querySelector('[data-gallery-status]').hidden, true, 'aviso de estado visible');
  });
}

/* ---- Pestañas de categoría (contrato §8: .category-tabs, aria-current) ---- */
const tabLinks = (document) => [...document.querySelectorAll('.category-tabs .category-tabs__link')];
const tabCategory = (a, window) => new URL(a.getAttribute('href'), window.location.href).searchParams.get('category');
const tabFor = (document, window, c) => tabLinks(document).find((a) => tabCategory(a, window) === c);

test('pestañas: <nav> con nombre accesible, un <a> por categoría y aria-current solo en la activa', async () => {
  for (const lang of ['en', 'es']) {
    for (const category of CATEGORIES) {
      const { document, window } = await loadPage('index.html', { search: `?category=${category}&lang=${lang}`, scripts: SCRIPTS });
      const d = lang === 'en' ? en : es;
      const nav = document.querySelector('nav.category-tabs');
      assert.ok(nav, 'falta nav.category-tabs');
      assert.equal(nav.getAttribute('aria-label'), d['home.categories.label'], `${lang}: aria-label del nav`);
      assert.equal(nav.querySelector('[role="tablist"], [role="tab"]'), null, 'no debe ser un tablist ARIA (§3)');
      const links = tabLinks(document);
      assert.deepEqual(links.map((a) => tabCategory(a, window)), CATEGORIES, 'un enlace por categoría, en orden');
      for (const a of links) {
        const c = tabCategory(a, window);
        assert.equal(a.tagName, 'A');
        assert.equal(a.textContent.trim(), d[`home.categories.${c}`], `${lang}: texto de la pestaña ${c}`);
        if (c === category) assert.equal(a.getAttribute('aria-current'), 'page', `${c} activa`);
        else assert.equal(a.hasAttribute('aria-current'), false, `${c} no debe llevar aria-current`);
      }
    }
  }
});

test('pestañas: con ?category inválido la activa es watercolor', async () => {
  const { document, window } = await loadPage('index.html', { search: '?category=nope', scripts: SCRIPTS });
  assert.equal(tabFor(document, window, 'watercolor')?.getAttribute('aria-current'), 'page');
  assert.equal(tabFor(document, window, 'drawing')?.hasAttribute('aria-current'), false);
});

test('pestañas: con ?lang en la URL los enlaces lo conservan', async () => {
  const { document, window } = await loadPage('index.html', { search: '?lang=es', scripts: SCRIPTS });
  const links = tabLinks(document);
  assert.equal(links.length, 2);
  for (const a of links) {
    assert.equal(new URL(a.href, window.location.href).searchParams.get('lang'), 'es', `pestaña ${a.getAttribute('href')} pierde lang`);
  }
});

test('pestañas: clic cambia la galería sin recargar; replaceState conserva lang y mueve aria-current', async () => {
  const { document, window, errors } = await loadPage('index.html', { search: '?lang=es', scripts: SCRIPTS });
  window.__sameDocument = true;
  let pushes = 0;
  const origPush = window.history.pushState.bind(window.history);
  window.history.pushState = (...args) => { pushes++; return origPush(...args); };

  const toDrawing = tabFor(document, window, 'drawing');
  const toWater = tabFor(document, window, 'watercolor');
  const ev = click(window, toDrawing);
  await settle(window);
  assert.equal(ev.defaultPrevented, true, 'el clic debe interceptarse (sin recarga)');
  assert.equal(window.__sameDocument, true);
  assert.deepEqual(galleryIds(document), DRAWINGS.map((a) => a.id), 'la galería muestra los dibujos');
  let url = new URL(window.location.href);
  assert.equal(url.searchParams.get('category'), 'drawing');
  assert.equal(url.searchParams.get('lang'), 'es', 'replaceState pierde lang');
  assert.equal(pushes, 0, 'debe usar replaceState, no pushState (§3)');
  assert.equal(toDrawing.getAttribute('aria-current'), 'page');
  assert.equal(toWater.hasAttribute('aria-current'), false);
  assert.equal(document.querySelector('.gallery__title').textContent, DRAWINGS[0].title.es);
  assert.equal(document.querySelector('.gallery__image').getAttribute('alt'), DRAWINGS[0].image.alt.es);
  // Las obras de la nueva categoría: eager las primeras, lazy el resto
  [...document.querySelectorAll('.gallery__image')].forEach((img, i) => {
    assert.equal(img.getAttribute('loading') === 'lazy', i >= EAGER, `dibujo ${i}: eager/lazy`);
  });

  click(window, toWater);
  await settle(window);
  assert.deepEqual(galleryIds(document), WATERCOLORS.map((a) => a.id));
  url = new URL(window.location.href);
  assert.equal(url.searchParams.get('category'), 'watercolor');
  assert.equal(url.searchParams.get('lang'), 'es');
  assert.equal(toWater.getAttribute('aria-current'), 'page');
  assert.equal(toDrawing.hasAttribute('aria-current'), false);
  assert.equal(errors.length, 0, String(errors[0]));
});

test('pestañas: Ctrl/Cmd/Shift-clic y botón central no se interceptan (abrir en pestaña nueva)', async () => {
  const { document, window } = await loadPage('index.html', { scripts: SCRIPTS });
  const toDrawing = tabFor(document, window, 'drawing');
  for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }]) {
    let prevented = null;
    // Se observa en window (burbuja) y luego se cancela, para que jsdom no intente navegar.
    const spy = (e) => { prevented = e.defaultPrevented; e.preventDefault(); };
    window.addEventListener('click', spy);
    click(window, toDrawing, init);
    window.removeEventListener('click', spy);
    assert.equal(prevented, false, `clic ${JSON.stringify(init)} interceptado`);
  }
  assert.deepEqual(galleryIds(document), WATERCOLORS.map((a) => a.id));
});

test('alternar pestañas no vuelve a pedir artworks.json', async () => {
  const { document, window, calls } = await loadPage('index.html', { scripts: SCRIPTS });
  for (const c of ['drawing', 'watercolor', 'drawing']) {
    click(window, tabFor(document, window, c));
    await settle(window);
  }
  assert.equal(calls.filter((c) => c.rel === 'data/artworks.json').length, 1);
});

test('?category=drawing: srcset, alt y eager/lazy correctos en los dibujos', async () => {
  const { document } = await loadPage('index.html', { search: '?category=drawing&lang=es', scripts: SCRIPTS });
  const imgs = [...document.querySelectorAll('.gallery__image')];
  assert.ok(DRAWINGS.length > 0, 'sin dibujos');
  assert.equal(imgs.length, DRAWINGS.length);
  imgs.forEach((img, i) => {
    const art = DRAWINGS[i];
    assert.equal(img.getAttribute('alt'), art.image.alt.es, `${art.id} alt`);
    assert.ok(img.getAttribute('srcset').includes(`${art.image.base}-`), `${art.id} srcset`);
    assert.equal(img.getAttribute('loading') === 'lazy', i >= EAGER, `${art.id} eager/lazy`);
  });
});

test('pinta las acuarelas (categoría por defecto) con srcset, sizes, width, height, alt y eager/lazy correctos', async () => {
  for (const lang of ['en', 'es']) {
    const { document } = await loadPage('index.html', { search: `?lang=${lang}`, scripts: SCRIPTS });
    const imgs = [...document.querySelectorAll('.gallery__image')];
    const list = WATERCOLORS;
    assert.ok(list.length > 0, 'sin acuarelas');
    assert.equal(imgs.length, list.length);
    imgs.forEach((img, i) => {
      const art = list[i];
      const expectedSrcset = art.image.widths.map((n) => `${art.image.base}-${n}.webp ${variantWidth(art.image, n)}w`).join(', ');
      assert.equal(img.getAttribute('srcset'), expectedSrcset, `${art.id} srcset`);
      assert.ok(img.getAttribute('sizes') && /\d/.test(img.getAttribute('sizes')), `${art.id} sizes`);
      assert.equal(img.getAttribute('width'), String(art.image.width), `${art.id} width`);
      assert.equal(img.getAttribute('height'), String(art.image.height), `${art.id} height`);
      assert.equal(img.getAttribute('alt'), art.image.alt[lang], `${art.id} alt ${lang}`);
      assert.equal(img.getAttribute('decoding'), 'async', `${art.id} decoding`);
      if (i < EAGER) assert.notEqual(img.getAttribute('loading'), 'lazy', `${art.id} debe ser eager`);
      else assert.equal(img.getAttribute('loading'), 'lazy', `${art.id} debe ser lazy`);
      assert.ok(img.getAttribute('src').endsWith('.webp'));
    });
    assert.equal(document.querySelector('.gallery__title').textContent, list[0].title[lang]);
  }
});

test('src se asigna después de srcset, sizes y loading (regresión I1)', async () => {
  const { document, window } = await loadPage('index.html', { scripts: SCRIPTS, before: spyImages });
  const imgs = [...document.querySelectorAll('.gallery__image')];
  assert.ok(imgs.length > 0);
  imgs.forEach((img, i) => {
    const log = window.__imgLog.get(img) || [];
    const srcAt = log.indexOf('src');
    assert.ok(srcAt !== -1, `img ${i} sin src`);
    assert.ok(log.indexOf('srcset') !== -1 && log.indexOf('srcset') < srcAt, `img ${i}: srcset después de src (${log})`);
    assert.ok(log.indexOf('sizes') !== -1 && log.indexOf('sizes') < srcAt, `img ${i}: sizes después de src (${log})`);
    if (i >= EAGER) assert.ok(log.indexOf('loading') !== -1 && log.indexOf('loading') < srcAt, `img ${i}: loading después de src (${log})`);
    assert.equal(log.lastIndexOf('src'), srcAt, `img ${i}: src asignado dos veces`);
  });
});

for (const [name, route] of [
  ['fetch rechazado', () => Promise.reject(new TypeError('Failed to fetch'))],
  ['HTTP 500', () => ({ status: 500, body: 'error' })],
  ['JSON corrupto', () => ({ body: '{"not": json' })]
]) {
  test(`si falla la carga (${name}) muestra el error de i18n y la página no queda en blanco`, async () => {
    for (const lang of ['en', 'es']) {
      const { document } = await loadPage('index.html', {
        search: `?lang=${lang}`,
        scripts: SCRIPTS,
        routes: { 'data/artworks.json': route }
      });
      const status = document.querySelector('[data-gallery-status]');
      const d = lang === 'en' ? en : es;
      assert.equal(status.hidden, false, 'el aviso debe verse');
      assert.equal(status.textContent, d['home.gallery.error']);
      assert.ok(status.classList.contains('notice--error'));
      assert.ok(document.querySelector('h1').textContent.trim(), 'h1 sigue visible');
    }
  });
}

test('lista vacía muestra home.gallery.empty', async () => {
  const { document } = await loadPage('index.html', { scripts: SCRIPTS, routes: { 'data/artworks.json': () => ({ body: '[]' }) } });
  assert.equal(document.querySelector('[data-gallery-status]').textContent, en['home.gallery.empty']);
});

test('Artworks.url(art) genera work.html?id=… (codificado)', async () => {
  const { window } = await loadPage('index.html', { scripts: SCRIPTS });
  assert.equal(window.Artworks.url({ id: 'paco-disco' }), 'work.html?id=paco-disco');
  assert.equal(window.Artworks.url({ id: 'a&b=c' }), 'work.html?id=a%26b%3Dc');
});

test('Artworks.url(art) conserva lang cuando la página lo lleva en la URL', async () => {
  const { window, document } = await loadPage('index.html', { search: '?lang=es', scripts: SCRIPTS });
  const url = new URL(window.Artworks.url({ id: 'paco-disco' }), window.location.href);
  assert.equal(url.searchParams.get('id'), 'paco-disco');
  assert.equal(url.searchParams.get('lang'), 'es', `Artworks.url no conserva lang: ${url.search}`);
  const first = new URL(document.querySelector('.gallery__link').href);
  assert.equal(first.searchParams.get('lang'), 'es', 'los enlaces de la galería pierden ?lang');
});
