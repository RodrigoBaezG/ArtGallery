// §12.2 contact.js y nav.js (jsdom)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPage, settle } from '../helpers/jsdom.mjs';
import { dict, flatten } from '../helpers/paths.mjs';

const SCRIPTS = ['i18n.js', 'nav.js', 'contact.js'];
const D = { en: flatten(dict('en')), es: flatten(dict('es')) };

const open = (lang = 'en', extra = {}) => loadPage('contact.html', { search: `?lang=${lang}`, scripts: SCRIPTS, ...extra });

function submit(window, form) {
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
}

function fill(document, values) {
  for (const [id, v] of Object.entries(values)) document.getElementById(id).value = v;
}

test('validación: obligatorios, aria-invalid y foco al primer inválido (EN y ES)', async () => {
  for (const lang of ['en', 'es']) {
    const { window, document, calls } = await open(lang);
    const form = document.querySelector('form[name="contact"]');
    submit(window, form);
    await settle(window);
    for (const id of ['name', 'email', 'message']) {
      assert.equal(document.getElementById(id).getAttribute('aria-invalid'), 'true', `${lang} ${id}`);
      assert.equal(document.getElementById(`${id}-error`).textContent, D[lang]['contact.validation.required'], `${lang} ${id} mensaje`);
    }
    assert.equal(document.activeElement.id, 'name', `${lang}: foco`);
    assert.equal(calls.filter((c) => c.method === 'POST').length, 0, 'no se envía');
  }
});

test('validación: formato de email', async () => {
  for (const lang of ['en', 'es']) {
    const { window, document } = await open(lang);
    fill(document, { name: 'Ana', email: 'no-es-un-email', message: 'Hola' });
    submit(window, document.querySelector('form'));
    await settle(window);
    assert.equal(document.getElementById('name').hasAttribute('aria-invalid'), false);
    assert.equal(document.getElementById('email').getAttribute('aria-invalid'), 'true');
    assert.equal(document.getElementById('email-error').textContent, D[lang]['contact.validation.email']);
    assert.equal(document.activeElement.id, 'email');
  }
});

test('envío: POST / url-encoded con form-name=contact y bot-field', async () => {
  const { window, document, calls } = await open('en', { routes: { '/': () => ({ status: 200, body: 'ok' }) } });
  fill(document, { name: 'Ana', email: 'ana@example.com', message: 'Hola' });
  submit(window, document.querySelector('form'));
  await settle(window, 10);
  const posts = calls.filter((c) => c.method === 'POST');
  assert.equal(posts.length, 1);
  assert.equal(new URL(posts[0].url).pathname, '/');
  const ct = posts[0].headers['Content-Type'] || posts[0].headers['content-type'];
  assert.equal(ct, 'application/x-www-form-urlencoded');
  const body = new URLSearchParams(posts[0].body);
  assert.equal(body.get('form-name'), 'contact');
  assert.ok(body.has('bot-field'), 'falta bot-field');
  assert.equal(body.get('email'), 'ana@example.com');
  const status = document.querySelector('.form__status');
  assert.ok(status.classList.contains('form__status--success'));
  assert.ok(!status.textContent.includes('ana@example.com'), 'el éxito no refleja datos enviados');
});

for (const [name, route] of [
  ['HTTP 500', () => ({ status: 500, body: 'error' })],
  ['HTTP 404', () => ({ status: 404, body: 'nf' })],
  ['error de red', () => Promise.reject(new TypeError('Failed to fetch'))]
]) {
  test(`${name}: estado de error y botón rehabilitado`, async () => {
    const { window, document } = await open('es', { routes: { '/': route } });
    fill(document, { name: 'Ana', email: 'ana@example.com', message: 'Hola' });
    submit(window, document.querySelector('form'));
    await settle(window, 10);
    const status = document.querySelector('.form__status');
    assert.ok(status.classList.contains('form__status--error'), status.className);
    assert.ok(status.textContent.startsWith(D.es['contact.error.heading']));
    const btn = document.querySelector('[type="submit"]');
    assert.equal(btn.disabled, false);
    assert.equal(btn.textContent, D.es['contact.form.submit']);
    assert.equal(document.getElementById('name').value, 'Ana', 'no se borra lo escrito si falla');
  });
}

test('sin doble envío mientras hay una petición en curso', async () => {
  let release;
  const pending = new Promise((r) => { release = r; });
  const { window, document, calls } = await open('en', { routes: { '/': () => pending.then(() => ({ status: 200 })) } });
  fill(document, { name: 'Ana', email: 'ana@example.com', message: 'Hola' });
  const form = document.querySelector('form');
  submit(window, form);
  submit(window, form);
  submit(window, form);
  await settle(window);
  assert.equal(document.querySelector('[type="submit"]').disabled, true);
  release();
  await settle(window, 10);
  assert.equal(calls.filter((c) => c.method === 'POST').length, 1);
});

test('?sent=1 muestra el éxito; cualquier otro valor no muestra nada', async () => {
  const ok = await loadPage('contact.html', { search: '?sent=1', scripts: SCRIPTS });
  assert.ok(ok.document.querySelector('.form__status').classList.contains('form__status--success'));
  for (const v of ['0', 'true', '11', '', encodeURIComponent('<img src=x onerror=alert(1)>')]) {
    const { document } = await loadPage('contact.html', { search: `?sent=${v}`, scripts: SCRIPTS });
    const status = document.querySelector('.form__status');
    assert.equal(status.textContent, '', `sent=${v}`);
    assert.equal(document.querySelector('main img'), null);
  }
});

test('nav.js: el menú alterna aria-expanded y se cierra con Esc', async () => {
  const { window, document } = await loadPage('index.html', { scripts: ['i18n.js', 'nav.js'] });
  const toggle = document.querySelector('.nav__toggle');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(toggle.getAttribute('aria-label'), D.en['common.nav.menuCloseLabel']);
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, toggle);
  toggle.click();
  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
});
