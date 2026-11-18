// §12.4 Seguridad en navegador: XSS, CSP (simulada con las cabeceras de netlify.toml),
// terceros en red y disponibilidad (404 reales) en local.
import { test, expect } from '@playwright/test';
import { FIRST, QA_URLS, ready } from '../helpers/e2e.mjs';
import { headersFor, readNetlifyToml } from '../helpers/headers.mjs';
import { dict, flatten } from '../helpers/paths.mjs';

const D = { en: flatten(dict('en')), es: flatten(dict('es')) };
const PAYLOADS = [
  '<img src=x onerror=alert(1)>',
  '"><script>alert(1)</script>',
  'javascript:alert(1)',
  '../../etc/passwd',
  '%00',
  "'-alert(1)-'",
  '<svg/onload=alert(1)>',
  'x'.repeat(10_000)
];

/** Nodos script/img/iframe/svg de la página (para comparar con los esperados). */
const snapshot = (page) => page.evaluate(() => ({
  scripts: [...document.querySelectorAll('script')].map((s) => s.src ? new URL(s.src).pathname : `inline:${s.type}`).sort(),
  imgs: document.querySelectorAll('main img').length,
  dangerous: document.querySelectorAll('iframe, object, embed, svg[onload], [onerror], [onload], a[href^="javascript:"]').length,
  flag: window.__xss === true
}));

async function guard(page) {
  const dialogs = [];
  page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });
  await page.addInitScript(() => { window.alert = () => { window.__xss = true; }; });
  return dialogs;
}

test.describe('XSS', () => {
  test('work.html?id= con cargas maliciosas → «no encontrado», sin diálogos ni nodos nuevos', async ({ page }) => {
    const dialogs = await guard(page);
    await page.goto('/work.html?id=does-not-exist');
    await ready(page);
    const baseline = await snapshot(page);
    for (const p of PAYLOADS) {
      for (const lang of ['en', 'es']) {
        await page.goto(`/work.html?id=${encodeURIComponent(p)}&lang=${lang}`);
        await ready(page);
        await expect(page.locator('h1'), p.slice(0, 30)).toHaveText(D[lang]['work.notFound.heading']);
        const s = await snapshot(page);
        expect(s, p.slice(0, 30)).toEqual(baseline);
      }
      // Sin codificar (tal cual lo pegaría un atacante)
      await page.goto(`/work.html?id=${p}`).catch(() => {});
      await ready(page).catch(() => {});
      expect((await snapshot(page)).flag).toBe(false);
    }
    expect(dialogs).toEqual([]);
  });

  test('?lang= y ?sent= con cargas maliciosas no inyectan nada', async ({ page }) => {
    const dialogs = await guard(page);
    for (const p of PAYLOADS) {
      await page.goto(`/index.html?lang=${encodeURIComponent(p)}`);
      await ready(page);
      await expect(page.locator('html')).toHaveAttribute('lang', /^(en|es)$/);
      expect((await snapshot(page)).dangerous).toBe(0);
      await page.goto(`/contact.html?sent=${encodeURIComponent(p)}`);
      await ready(page);
      await expect(page.locator('.form__status')).toHaveText('');
      expect((await snapshot(page)).dangerous).toBe(0);
      await page.goto(`/work.html?id=${FIRST.id}&lang=${encodeURIComponent(p)}`);
      await ready(page);
      await expect(page.locator('h1')).toHaveText(/\S/);
    }
    expect(dialogs).toEqual([]);
    expect((await snapshot(page)).flag).toBe(false);
  });

  test('localStorage envenenado con valores arbitrarios', async ({ page }) => {
    const dialogs = await guard(page);
    for (const p of PAYLOADS.slice(0, 4)) {
      await page.addInitScript((v) => { try { localStorage.setItem('lang', v); } catch (e) {} }, p);
    }
    for (const path of ['/index.html', `/work.html?id=${FIRST.id}`, '/contact.html']) {
      await page.goto(path);
      await ready(page);
      await expect(page.locator('html')).toHaveAttribute('lang', /^(en|es)$/);
      expect((await snapshot(page)).dangerous).toBe(0);
    }
    expect(dialogs).toEqual([]);
  });

  test('HTML en los campos del formulario no se refleja como HTML', async ({ page }) => {
    const dialogs = await guard(page);
    await page.route('**/', (route) => (route.request().method() === 'POST'
      ? route.fulfill({ status: 200, body: 'ok' })
      : route.fallback()));
    await page.goto('/contact.html');
    await ready(page);
    const html = '<img src=x onerror=alert(1)><b id="injected">x</b>';
    await page.fill('#name', html);
    await page.fill('#email', '"><svg onload=alert(1)>@x');
    await page.fill('#message', html);
    await page.locator('form [type="submit"]').click();
    await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
    expect(await page.locator('#injected').count()).toBe(0);
    await page.fill('#email', 'ana@example.com');
    await page.locator('form [type="submit"]').click();
    await expect(page.locator('.form__status')).toHaveClass(/form__status--success/);
    expect(await page.locator('#injected').count()).toBe(0);
    expect(await page.locator('.form__status').textContent()).not.toContain('<b');
    expect((await snapshot(page)).dangerous).toBe(0);
    expect(dialogs).toEqual([]);
  });
});

test.describe('CSP (cabeceras de netlify.toml aplicadas en local)', () => {
  const toml = readNetlifyToml();

  for (const qa of QA_URLS) {
    test(`sin violaciones de CSP en ${qa.name}`, async ({ page }) => {
      const violations = [];
      page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (e) => {
          (window.__csp = window.__csp || []).push(`${e.violatedDirective} ${e.blockedURI} ${e.sourceFile}:${e.lineNumber}`);
        });
      });
      await page.route((url) => url.hostname === 'localhost', async (route) => {
        const res = await route.fetch();
        const headers = { ...res.headers() };
        const extra = headersFor(new URL(route.request().url()).pathname, toml);
        for (const [k, v] of Object.entries(extra)) {
          // upgrade-insecure-requests subiría localhost a https y rompería la prueba local.
          headers[k.toLowerCase()] = k === 'Content-Security-Policy' ? v.replace(/;\s*upgrade-insecure-requests/, '') : v;
        }
        await route.fulfill({ response: res, headers });
      });
      await page.goto(qa.path);
      await ready(page);
      // Interacciones que crean contenido dinámico
      if (qa.name === 'index') await page.locator('[data-lang="es"]').first().click();
      await page.waitForTimeout(300);
      const events = await page.evaluate(() => window.__csp || []);
      expect([...violations, ...events]).toEqual([]);
      if (qa.name === 'index') {
        // Las filas justificadas dependen de --w/--h: deben seguir aplicándose con la CSP.
        const w = await page.locator('.gallery__item').first().evaluate((el) => getComputedStyle(el).getPropertyValue('--w').trim());
        expect(w).not.toBe('1');
      }
    });
  }
});

test.describe('red y disponibilidad (local)', () => {
  test('sin peticiones a terceros fuera de Google Fonts', async ({ page }) => {
    const hosts = new Set();
    page.on('request', (r) => hosts.add(new URL(r.url()).hostname));
    for (const qa of QA_URLS) {
      await page.goto(qa.path);
      await ready(page);
    }
    const bad = [...hosts].filter((h) => !['localhost', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(h));
    expect(bad).toEqual([]);
  });

  for (const path of ['/this-page-does-not-exist', '/backend', '/api', '/api/artworks', '/.git/config', '/.env', '/tools/images/manifest.json', '/tests/package.json']) {
    test(`${path} devuelve 404 real`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(404);
    });
  }
});
