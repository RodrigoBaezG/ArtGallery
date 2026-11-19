// §12.4 test:prod — cabeceras HTTP, redirección HTTPS, 404 reales y honeypot contra
// el sitio desplegado. NO forma parte de `npm test`.
//   npm run test:prod                          (https://kukobaezgallery.netlify.app)
//   BASE_URL=https://deploy-preview-1--….netlify.app npm run test:prod
// Honeypot (opcional): NETLIFY_TOKEN y NETLIFY_SITE_ID para consultar la API de envíos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REQUIRED_HEADERS, cspMap } from '../helpers/headers.mjs';

const BASE = (process.env.BASE_URL || 'https://kukobaezgallery.netlify.app').replace(/\/$/, '');
const get = (p, init = {}) => fetch(BASE + p, { redirect: 'manual', ...init });

for (const p of ['/', '/index.html', '/work.html?id=moonlit-sorceress', '/contact.html', '/data/artworks.json', '/i18n/en.json', '/assets/img/works/moonlit-sorceress-640.webp']) {
  test(`cabeceras de seguridad en ${p}`, async () => {
    const res = await get(p);
    assert.equal(res.status, 200, `${p}: ${res.status}`);
    const problems = [];
    for (const [name, expected] of Object.entries(REQUIRED_HEADERS)) {
      const v = res.headers.get(name);
      if (!v) { problems.push(`falta ${name}`); continue; }
      if (name === 'Content-Security-Policy') {
        if (JSON.stringify(cspMap(v)) !== JSON.stringify(cspMap(expected))) problems.push(`CSP distinta: ${v}`);
      } else if (name === 'Strict-Transport-Security') {
        // Netlify impone su propio HSTS en *.netlify.app (con `preload`): se acepta si es igual o más estricto.
        const maxAge = Number((/max-age=(\d+)/i.exec(v) || [])[1] || 0);
        if (maxAge < 31536000 || !/includeSubDomains/i.test(v)) problems.push(`${name}: "${v}"`);
      } else if (v !== expected) problems.push(`${name}: "${v}"`);
    }
    assert.deepEqual(problems, []);
  });
}

test('caché: assets/img inmutable; HTML y JSON revalidan', async () => {
  const img = await get('/assets/img/works/moonlit-sorceress-640.webp');
  assert.match(img.headers.get('cache-control') || '', /public.*max-age=31536000.*immutable/);
  for (const p of ['/index.html', '/data/artworks.json', '/i18n/es.json']) {
    const cc = (await get(p)).headers.get('cache-control') || '';
    assert.match(cc, /max-age=0|no-cache/, `${p}: ${cc}`);
  }
});

test('HTTP → HTTPS con 301', async () => {
  const res = await fetch(BASE.replace(/^https:/, 'http:') + '/', { redirect: 'manual' });
  assert.equal(res.status, 301);
  assert.match(res.headers.get('location') || '', /^https:\/\//);
});

for (const p of ['/this-page-does-not-exist', '/backend', '/api', '/api/artworks', '/.git/config', '/.env', '/tools/images/manifest.json']) {
  test(`${p} → 404 real`, async () => {
    const res = await get(p);
    assert.equal(res.status, 404, `${p}: ${res.status}`);
  });
}

test('honeypot: un envío con bot-field relleno no aparece en Netlify', async (t) => {
  const { NETLIFY_TOKEN, NETLIFY_SITE_ID } = process.env;
  if (!NETLIFY_TOKEN || !NETLIFY_SITE_ID) { t.skip('requiere NETLIFY_TOKEN y NETLIFY_SITE_ID'); return; }
  const marker = `qa-honeypot-${Date.now()}`;
  const body = new URLSearchParams({ 'form-name': 'contact', 'bot-field': 'i am a bot', name: marker, email: 'qa@example.com', message: marker });
  const res = await fetch(BASE + '/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  assert.ok(res.status < 400, `POST: ${res.status}`);
  const text = await res.text();
  assert.ok(!text.includes(marker), 'la respuesta refleja datos enviados');
  await new Promise((r) => setTimeout(r, 5000));
  const api = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/submissions`, { headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` } });
  const list = await api.json();
  assert.ok(!JSON.stringify(list).includes(marker), 'el envío con honeypot llegó a Netlify');
});
