// §12.2 i18n.js (jsdom)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPage } from '../helpers/jsdom.mjs';
import { dict, flatten } from '../helpers/paths.mjs';

const en = flatten(dict('en'));
const es = flatten(dict('es'));
const clean = (s) => s.replace(/^\s*\[\[PROPUESTA\]\]\s*/, '');
const SCRIPTS = ['i18n.js'];

test('prioridad: ?lang > localStorage > navigator.language > en', async () => {
  const cases = [
    [{ search: '?lang=es', storage: { lang: 'en' }, navigatorLanguage: 'en-US' }, 'es'],
    [{ search: '?lang=en', storage: { lang: 'es' }, navigatorLanguage: 'es-ES' }, 'en'],
    [{ storage: { lang: 'es' }, navigatorLanguage: 'en-US' }, 'es'],
    [{ storage: { lang: 'en' }, navigatorLanguage: 'es-ES' }, 'en'],
    [{ navigatorLanguage: 'es-AR' }, 'es'],
    [{ navigatorLanguage: 'ES' }, 'es'],
    [{ navigatorLanguage: 'de-DE' }, 'en'],
    [{ navigatorLanguage: '' }, 'en']
  ];
  for (const [opts, expected] of cases) {
    const { window } = await loadPage('index.html', { ...opts, scripts: SCRIPTS });
    assert.equal(window.I18n.lang, expected, JSON.stringify(opts));
    assert.equal(window.document.documentElement.lang, expected, JSON.stringify(opts));
  }
});

test('?lang=es se persiste en localStorage', async () => {
  const { window } = await loadPage('index.html', { search: '?lang=es', scripts: SCRIPTS });
  assert.equal(window.localStorage.getItem('lang'), 'es');
});

test('?lang inválido (fr, <script>, vacío) cae a en sin errores', async () => {
  for (const v of ['fr', encodeURIComponent('<script>alert(1)</script>'), '', 'ES', 'en-US']) {
    const { window, errors } = await loadPage('index.html', { search: `?lang=${v}`, navigatorLanguage: 'en-US', scripts: SCRIPTS });
    assert.equal(window.I18n.lang, 'en', `lang=${v}`);
    assert.deepEqual(errors, [], `errores jsdom con lang=${v}`);
    assert.ok(![...window.document.querySelectorAll('script')].some((s) => /alert/.test(s.textContent)), 'script inyectado');
  }
});

test('localStorage envenenado se ignora', async () => {
  const { window } = await loadPage('index.html', { storage: { lang: '<img src=x onerror=alert(1)>' }, navigatorLanguage: 'en-US', scripts: SCRIPTS });
  assert.equal(window.I18n.lang, 'en');
});

test('localStorage que lanza (modo privado) no rompe la página', async () => {
  const { window, errors } = await loadPage('index.html', { storageThrows: true, search: '?lang=es', scripts: SCRIPTS });
  assert.equal(window.I18n.lang, 'es');
  assert.deepEqual(errors, []);
  await window.I18n.setLang('en', { persist: true });
  assert.equal(window.document.documentElement.lang, 'en');
});

test('setLang actualiza <html lang>, <title>, meta description y canonical', async () => {
  const { window, document } = await loadPage('about.html', { search: '?lang=en', scripts: SCRIPTS });
  assert.equal(document.title, en['meta.about.title']);
  await window.I18n.setLang('es', { persist: true });
  assert.equal(document.documentElement.lang, 'es');
  assert.equal(document.title, clean(es['meta.about.title']));
  assert.equal(document.querySelector('meta[name="description"]').content, clean(es['meta.about.description']));
  assert.equal(document.querySelector('link[rel="canonical"]').href, 'https://kukobaezgallery.netlify.app/about.html?lang=es');
  assert.equal(new URL(window.location.href).searchParams.get('lang'), 'es');
  assert.equal(window.localStorage.getItem('lang'), 'es');
  // Los textos data-i18n cambian
  assert.equal(document.querySelector('[data-i18n="common.nav.about"]').textContent, es['common.nav.about']);
});

test('t() con clave inexistente devuelve fallback ("") y no lanza', async () => {
  const { window } = await loadPage('index.html', { scripts: SCRIPTS });
  assert.equal(window.I18n.t('does.not.exist'), '');
  assert.equal(window.I18n.t(''), '');
  assert.doesNotThrow(() => window.I18n.t('common'));
});

test('elemento data-i18n con clave inexistente conserva el texto de fallback', async () => {
  const { window, document } = await loadPage('index.html', {
    scripts: SCRIPTS,
    before: (w) => {
      const p = w.document.createElement('p');
      p.id = 'probe';
      p.dataset.i18n = 'does.not.exist';
      p.textContent = 'Fallback';
      w.document.body.appendChild(p);
    }
  });
  assert.equal(document.getElementById('probe').textContent, 'Fallback');
  assert.ok(window.I18n);
});

test('los valores con [[TODO no se muestran', async () => {
  for (const lang of ['en', 'es']) {
    const { window, document } = await loadPage('commissions.html', { search: `?lang=${lang}`, scripts: SCRIPTS });
    assert.ok(!/\[\[(TODO|PROPUESTA)/.test(document.body.textContent), `${lang}: [[TODO visible en commissions`);
    const { document: about } = await loadPage('about.html', { search: `?lang=${lang}`, scripts: SCRIPTS });
    assert.ok(!/\[\[(TODO|PROPUESTA)/.test(about.body.textContent), `${lang}: [[TODO visible en about`);
    assert.equal(window.I18n.isTodo('[[TODO: x]]'), true);
    assert.equal(window.I18n.clean('Hola [[TODO: x]]'), 'Hola');
    assert.equal(window.I18n.artworkText({ en: '[[TODO]]', es: '[[TODO]]' }), '');
  }
});
