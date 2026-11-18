// §12.2 gallery.js (jsdom con fetch simulado)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPage } from '../helpers/jsdom.mjs';
import { artworks, dict, flatten, sorted } from '../helpers/paths.mjs';

const SCRIPTS = ['i18n.js', 'gallery.js'];
const DATA = artworks();
const EAGER = 4;
const en = flatten(dict('en'));
const es = flatten(dict('es'));

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

test('ordena featured primero y después por order', async () => {
  // Datos barajados para comprobar el orden de verdad
  const shuffled = DATA.slice().reverse().map((a, i) => ({ ...a, featured: i % 5 === 0 }));
  const { document } = await loadPage('index.html', {
    scripts: SCRIPTS,
    routes: { 'data/artworks.json': () => ({ body: JSON.stringify(shuffled) }) }
  });
  const hrefs = [...document.querySelectorAll('.gallery__link')].map((a) => new URL(a.href).searchParams.get('id'));
  assert.deepEqual(hrefs, sorted(shuffled).map((a) => a.id));
});

test('pinta las 22 obras con srcset, sizes, width, height, alt y eager/lazy correctos', async () => {
  for (const lang of ['en', 'es']) {
    const { document } = await loadPage('index.html', { search: `?lang=${lang}`, scripts: SCRIPTS });
    const imgs = [...document.querySelectorAll('.gallery__image')];
    const list = sorted(DATA);
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
