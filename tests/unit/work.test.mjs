// §12.2 work.js (jsdom)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPage } from '../helpers/jsdom.mjs';
import { CATEGORIES, DEFAULT_CATEGORY, artworks, dict, flatten, inCategory } from '../helpers/paths.mjs';

const SCRIPTS = ['i18n.js', 'nav.js', 'gallery.js', 'work.js'];
const DATA = artworks();
// Prev/next recorren solo la categoría de la obra (§3). LIST = acuarelas.
const BY = Object.fromEntries(CATEGORIES.map((c) => [c, inCategory(DATA, c)]));
const LIST = BY.watercolor;
// Respaldo si el catálogo aún no tiene `category`: los tests fallan con mensaje, el módulo no se rompe.
const MISSING = { id: "missing-watercolor", title: {}, medium: {}, image: { alt: {} } };
const FIRST = LIST[0] || MISSING, SECOND = LIST[1] || MISSING, LAST = LIST[LIST.length - 1] || MISSING;
const D = { en: flatten(dict('en')), es: flatten(dict('es')) };

// Copia con datos completos en la primera obra para probar el pintado de metadatos
// (en el catálogo real year/dimensions/status son [[TODO]]).
const COMPLETE = DATA.map((a) => (a.id === FIRST.id
  ? { ...a, year: 2023, dimensions: '30 × 40 cm', status: 'available', description: { en: 'Para one.\n\nPara two.', es: 'Párrafo uno.\n\nPárrafo dos.' } }
  : a));
const completeRoute = { 'data/artworks.json': () => ({ body: JSON.stringify(COMPLETE) }) };

const open = (id, lang = 'en', extra = {}) =>
  loadPage('work.html', { search: `?id=${encodeURIComponent(id)}&lang=${lang}`, scripts: SCRIPTS, ...extra });

test('un id válido pinta título, año, técnica, medidas, estado y «Encargar algo similar»', async () => {
  for (const lang of ['en', 'es']) {
    const { document } = await open(FIRST.id, lang, { routes: completeRoute });
    const d = D[lang];
    assert.equal(document.querySelectorAll('h1').length, 1);
    assert.equal(document.querySelector('h1').textContent, FIRST.title[lang]);
    const rows = Object.fromEntries([...document.querySelectorAll('.work__meta-row')].map((r) => [r.querySelector('dt').textContent, r.querySelector('dd').textContent]));
    assert.equal(rows[d['work.meta.year']], '2023');
    assert.equal(rows[d['work.meta.medium']], FIRST.medium[lang]);
    assert.equal(rows[d['work.meta.dimensions']], '30 × 40 cm');
    assert.equal(document.querySelector('.work__status').textContent, d['common.status.available']);
    const cta = document.querySelector('.work__cta');
    assert.equal(cta.textContent, d['work.actions.commissionSimilar']);
    assert.match(cta.getAttribute('href'), /^(commissions|contact)\.html/);
    assert.equal(document.querySelectorAll('.work__description p').length, 2);
    const img = document.querySelector('.work__image');
    assert.equal(img.alt, FIRST.image.alt[lang]);
    assert.ok(img.getAttribute('srcset').includes('-2000.webp'));
    assert.equal(img.getAttribute('width'), String(FIRST.image.width));
  }
});

test('con el catálogo real los [[TODO]] (año, medidas, estado) no se muestran', async () => {
  const { document } = await open(FIRST.id);
  assert.ok(!/\[\[/.test(document.body.textContent));
  assert.equal(document.querySelector('.work__status'), null);
  assert.equal(document.querySelector('h1').textContent, FIRST.title.en);
});

test('id inválido, vacío o malicioso → estado «no encontrado»', async () => {
  const ids = ['', 'nope', '<img src=x onerror=alert(1)>', '"><script>alert(1)</script>', 'javascript:alert(1)', '../../etc/passwd', '\u0000', 'a'.repeat(10000), FIRST.id.toUpperCase(), ' ' + FIRST.id];
  for (const id of ids) {
    for (const lang of ['en', 'es']) {
      const { document, errors } = await open(id, lang);
      const label = `id=${JSON.stringify(id.slice(0, 30))} ${lang}`;
      assert.equal(document.querySelector('h1')?.textContent, D[lang]['work.notFound.heading'], label);
      assert.equal(document.querySelector('main img'), null, label);
      assert.equal([...document.querySelectorAll('script')].filter((s) => /alert/.test(s.textContent)).length, 0, label);
      assert.equal(document.querySelector('meta[name="robots"]')?.content, 'noindex', label);
      assert.equal(errors.length, 0, label);
    }
  }
});

const navId = (document, dir) => {
  const a = document.querySelector(`.work-nav__link--${dir}`);
  return a && new URL(a.href).searchParams.get('id');
};
const position = (lang, current, total) => D[lang]['work.nav.position'].replace('{current}', current).replace('{total}', total);

for (const category of CATEGORIES) {
  test(`${category}: anterior/siguiente solo dentro de la categoría, con límites en la primera y la última`, async () => {
    const list = BY[category];
    assert.ok(list.length >= 3, `${category}: hacen falta ≥ 3 obras (hay ${list.length})`);
    const [first, second, last, penultimate] = [list[0], list[1], list[list.length - 1], list[list.length - 2]];
    const a = await open(first.id);
    assert.equal(navId(a.document, 'prev'), null, 'la primera de la categoría no tiene anterior');
    assert.equal(navId(a.document, 'next'), second.id);
    const z = await open(last.id);
    assert.equal(navId(z.document, 'next'), null, 'la última de la categoría no tiene siguiente (no salta a la otra categoría)');
    assert.equal(navId(z.document, 'prev'), penultimate.id);
    const m = await open(second.id, 'es');
    assert.equal(navId(m.document, 'prev'), first.id);
    assert.equal(navId(m.document, 'next'), list[2].id);
    // «2 de n» cuenta solo la categoría
    assert.equal(m.document.querySelector('.work__position')?.textContent, position('es', 2, list.length));
  });

  test(`${category}: cada obra enlaza prev/next con obras de su misma categoría`, async () => {
    const list = BY[category];
    const ids = new Set(list.map((x) => x.id));
    const bad = [];
    for (const art of list) {
      const { document } = await open(art.id);
      for (const dir of ['prev', 'next']) {
        const target = navId(document, dir);
        if (target && !ids.has(target)) bad.push(`${art.id} ${dir} → ${target}`);
      }
    }
    assert.deepEqual(bad, []);
  });

  test(`${category}: «volver a la galería» lleva a la home con su categoría (y conserva lang)`, async () => {
    const art = BY[category][1] || BY[category][0];
    assert.ok(art, `${category}: sin obras`);
    for (const search of [{ lang: 'en', withLang: true }, { lang: 'es', withLang: true }]) {
      const { document, window } = await open(art.id, search.lang);
      const back = document.querySelector('.work-nav__back');
      assert.ok(back, 'falta .work-nav__back');
      const url = new URL(back.getAttribute('href'), window.location.href);
      assert.match(url.pathname, /\/(index\.html)?$/, `volver apunta a ${url.pathname}`);
      // watercolor es la categoría por defecto: se acepta sin parámetro.
      const got = url.searchParams.get('category') ?? DEFAULT_CATEGORY;
      assert.equal(got, category, `volver → ${back.getAttribute('href')}`);
      assert.equal(url.searchParams.get('lang'), search.lang, `volver pierde lang: ${back.getAttribute('href')}`);
    }
    // Sin ?lang en la URL no se inventa
    const { document, window } = await loadPage('work.html', { search: `?id=${encodeURIComponent(art.id)}`, scripts: SCRIPTS });
    const url = new URL(document.querySelector('.work-nav__back').getAttribute('href'), window.location.href);
    assert.equal(url.searchParams.get('category') ?? DEFAULT_CATEGORY, category);
  });

  test(`${category}: Esc lleva al mismo destino que «volver a la galería»`, async () => {
    const art = BY[category][0];
    const { document, window } = await open(art.id, 'es');
    const back = document.querySelector('.work-nav__back');
    let handled = null;
    // jsdom no navega: se comprueba que Esc se gestiona (preventDefault) y que el
    // destino (.work-nav__back, que lee el handler) lleva la categoría.
    const ev = new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    window.addEventListener('keydown', (e) => { handled = e.defaultPrevented; });
    document.body.dispatchEvent(ev);
    assert.equal(handled, true, "Esc no se gestiona");
    const url = new URL(back.href);
    assert.equal(url.searchParams.get('category') ?? DEFAULT_CATEGORY, category);
  });
}

test('obras de categorías distintas se encuentran por id (ids únicos en todo el catálogo)', async () => {
  for (const category of CATEGORIES) {
    const art = BY[category][0];
    assert.ok(art, `${category}: sin obras`);
    const { document } = await open(art.id, 'en');
    assert.ok(document.querySelector('.work__title'), `${category}: ${art.id} → «no encontrado»`);
    assert.notEqual(document.querySelector('h1')?.textContent, D.en['work.notFound.heading'], `${category}: ${art.id}`);
  }
});

test('JSON-LD de un dibujo: artform coherente con la categoría (aviso)', async (t) => {
  const art = BY.drawing[0];
  if (!art) { t.skip('sin dibujos'); return; }
  const { document } = await open(art.id, 'en');
  const data = JSON.parse(document.getElementById('jsonld-artwork').textContent);
  if (/paint/i.test(data.artform || '')) t.diagnostic(`AVISO: el JSON-LD de un dibujo declara artform "${data.artform}" (debería ser Drawing/Dibujo) — frontend-dev`);
  assert.equal(data['@type'], 'VisualArtwork');
});

test('JSON-LD VisualArtwork parsea con name, artMedium e inLanguage del idioma activo', async () => {
  for (const lang of ['en', 'es']) {
    const { document } = await open(FIRST.id, lang);
    const data = JSON.parse(document.getElementById('jsonld-artwork').textContent);
    assert.equal(data['@type'], 'VisualArtwork');
    assert.equal(data.name, FIRST.title[lang]);
    assert.equal(data.artMedium, FIRST.medium[lang]);
    assert.equal(data.inLanguage, lang);
    assert.ok(!/\[\[/.test(JSON.stringify(data)), 'JSON-LD con [[TODO]]');
  }
  // Cambio de idioma en caliente
  const { window, document } = await open(FIRST.id, 'en');
  await window.I18n.setLang('es', { persist: true });
  const data = JSON.parse(document.getElementById('jsonld-artwork').textContent);
  assert.equal(data.inLanguage, 'es');
  assert.equal(data.name, FIRST.title.es);
  assert.equal(document.documentElement.lang, 'es');
});

test('title y canonical de la obra', async () => {
  const { document } = await open(FIRST.id, 'en');
  assert.ok(document.title.includes(FIRST.title.en));
  assert.match(document.querySelector('link[rel="canonical"]').href, new RegExp(`work\\.html\\?id=${FIRST.id}`));
});
