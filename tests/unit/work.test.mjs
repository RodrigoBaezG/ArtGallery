// §12.2 work.js (jsdom)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPage } from '../helpers/jsdom.mjs';
import { artworks, dict, flatten, sorted } from '../helpers/paths.mjs';

const SCRIPTS = ['i18n.js', 'nav.js', 'gallery.js', 'work.js'];
const DATA = artworks();
const LIST = sorted(DATA);
const FIRST = LIST[0], SECOND = LIST[1], LAST = LIST[LIST.length - 1];
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

test('anterior/siguiente: límites coherentes en la primera y la última obra', async () => {
  const first = await open(FIRST.id);
  assert.equal(first.document.querySelector('.work-nav__link--prev'), null, 'la primera no tiene anterior');
  assert.equal(new URL(first.document.querySelector('.work-nav__link--next').href).searchParams.get('id'), SECOND.id);
  const last = await open(LAST.id);
  assert.equal(last.document.querySelector('.work-nav__link--next'), null, 'la última no tiene siguiente');
  assert.equal(new URL(last.document.querySelector('.work-nav__link--prev').href).searchParams.get('id'), LIST[LIST.length - 2].id);
  const mid = await open(SECOND.id);
  assert.ok(mid.document.querySelector('.work-nav__link--prev') && mid.document.querySelector('.work-nav__link--next'));
  assert.ok(mid.document.querySelector('.work-nav__back').getAttribute('href').startsWith('index.html'));
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
