// §3 / §12.3 Categorías (2026-11-19): pestañas Watercolor · Drawings en la home.
// Contrato (§3, §8): <nav class="category-tabs" aria-label=home.categories.label>
// con enlaces <a class="category-tabs__link" href="?category=…">, aria-current="page"
// en la activa (no es un tablist ARIA); con JS filtran sin recargar y actualizan
// la URL con history.replaceState conservando lang. Valor inválido → watercolor.
// Los ids de obra se eligen siempre de artworks.json (nunca fijos).
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { BY_CATEGORY, DRAWINGS, LIST, collect, ready } from '../helpers/e2e.mjs';
import { dict, flatten } from '../helpers/paths.mjs';

const D = { en: flatten(dict('en')), es: flatten(dict('es')) };
/** Texto i18n obligatorio (falla con mensaje claro si content-writer aún no lo ha añadido). */
const T = (lang, key) => { expect(D[lang][key], `falta la clave i18n ${lang}:${key}`).toBeTruthy(); return D[lang][key]; };
const tabs = (page) => page.locator('nav.category-tabs .category-tabs__link');
const tab = (page, c) => page.locator(`nav.category-tabs .category-tabs__link[href*="category=${c}"]`);
const galleryIds = (page) => page.locator('.gallery__link').evaluateAll((as) => as.map((a) => new URL(a.href).searchParams.get('id')));
const ids = (list) => list.map((a) => a.id);
const param = (page, k) => new URL(page.url()).searchParams.get(k);

/** Marca el documento: si el clic recarga la página, la marca desaparece. */
const markDocument = (page) => page.evaluate(() => { window.__sameDocument = true; });
const sameDocument = (page) => page.evaluate(() => window.__sameDocument === true);

async function expectGallery(page, category) {
  const list = BY_CATEGORY[category];
  expect(list.length, `${category}: sin obras en artworks.json`).toBeGreaterThan(0);
  await expect(page.locator('.gallery__item')).toHaveCount(list.length);
  expect(await galleryIds(page)).toEqual(ids(list));
  await expect(tab(page, category)).toHaveAttribute('aria-current', 'page');
  for (const other of Object.keys(BY_CATEGORY).filter((c) => c !== category)) {
    await expect(tab(page, other)).not.toHaveAttribute('aria-current', /.*/);
  }
}

test.describe('pestañas de categoría: visibles y accesibles', () => {
  for (const width of [320, 375, 768, 1440]) {
    for (const lang of ['en', 'es']) {
      test(`${width}px ${lang}: nav con nombre accesible, 2 enlaces ≥ 44 px, aria-current correcto`, async ({ page }) => {
        await page.setViewportSize({ width, height: width < 768 ? 740 : 900 });
        await page.goto(`/index.html?lang=${lang}`);
        await ready(page);
        const nav = page.getByRole('navigation', { name: T(lang, 'home.categories.label') });
        await expect(nav).toBeVisible();
        await expect(nav.locator('[role="tablist"], [role="tab"]')).toHaveCount(0);
        await expect(tabs(page)).toHaveCount(2);
        for (const c of ['watercolor', 'drawing']) {
          const link = nav.getByRole('link', { name: T(lang, `home.categories.${c}`), exact: true });
          await expect(link).toBeVisible();
          const box = await link.boundingBox();
          expect(box.width, `${c}: ancho ${box.width}`).toBeGreaterThanOrEqual(43.5);
          expect(box.height, `${c}: alto ${box.height}`).toBeGreaterThanOrEqual(43.5);
        }
        await expect(tab(page, 'watercolor')).toHaveAttribute('aria-current', 'page');
        await expect(tab(page, 'drawing')).not.toHaveAttribute('aria-current', /.*/);
        // Las pestañas van entre el hero y la galería, y no tapan la primera obra
        const order = await page.evaluate(() => {
          const n = document.querySelector('nav.category-tabs');
          const g = document.querySelector('.gallery__grid');
          return !!(n.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING);
        });
        expect(order, 'pestañas antes de la galería').toBe(true);
        const o = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
        expect(o, 'sin scroll horizontal').toBe(true);
      });
    }
  }

  test('teclado: Tab llega a las pestañas con foco visible y Enter cambia de categoría', async ({ page, browserName }) => {
    await page.goto('/index.html');
    await ready(page);
    const drawing = tab(page, 'drawing');
    if (browserName === 'webkit') {
      // WebKit (como Safari por defecto) no enfoca enlaces con Tab: se enfoca a mano.
      await drawing.focus();
    } else {
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press('Tab');
        if (await drawing.evaluate((el) => el === document.activeElement)) break;
      }
    }
    await expect(drawing).toBeFocused();
    const outline = await drawing.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), shadow: s.boxShadow };
    });
    expect(outline.style !== 'none' && outline.width > 0 || outline.shadow !== 'none', `foco visible: ${JSON.stringify(outline)}`).toBeTruthy();
    await markDocument(page);
    await page.keyboard.press('Enter');
    await expectGallery(page, 'drawing');
    expect(await sameDocument(page), 'Enter recargó la página').toBe(true);
    expect(param(page, 'category')).toBe('drawing');
    // El foco no se pierde al body tras cambiar de categoría
    expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
  });
});

test.describe('pestañas de categoría: comportamiento', () => {
  test('clic cambia la galería sin recarga y actualiza la URL conservando lang; ida y vuelta', async ({ page }) => {
    const log = collect(page);
    const documents = [];
    page.on('request', (r) => { if (r.resourceType() === 'document') documents.push(r.url()); });
    await page.goto('/index.html?lang=es');
    await ready(page);
    await expectGallery(page, 'watercolor');
    await markDocument(page);
    const docsBefore = documents.length;

    await tab(page, 'drawing').click();
    await expectGallery(page, 'drawing');
    expect(param(page, 'category')).toBe('drawing');
    expect(param(page, 'lang')).toBe('es');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('.gallery__title').first()).toHaveText(DRAWINGS[0].title.es.replace(/^\s*\[\[PROPUESTA\]\]\s*/, ''));

    await tab(page, 'watercolor').click();
    await expectGallery(page, 'watercolor');
    expect(param(page, 'category')).toBe('watercolor');
    expect(param(page, 'lang')).toBe('es');

    expect(await sameDocument(page), 'el clic recargó la página').toBe(true);
    expect(documents.length - docsBefore, 'peticiones de documento al cambiar de pestaña').toBe(0);
    // replaceState, no pushState: «atrás» no recorre las pestañas
    const historyLength = await page.evaluate(() => history.length);
    expect(historyLength).toBeLessThanOrEqual(2);
    expect(log.pageErrors).toEqual([]);
    expect(log.console).toEqual([]);
  });

  test('recarga directa de ?category=drawing muestra los dibujos (y tras cambiar de pestaña también)', async ({ page }) => {
    const res = await page.goto('/index.html?category=drawing');
    expect(res.status()).toBe(200);
    await ready(page);
    await expectGallery(page, 'drawing');
    await page.reload();
    await ready(page);
    await expectGallery(page, 'drawing');
    // Tras cambiar con JS, la URL nueva también se puede recargar
    await tab(page, 'watercolor').click();
    await expectGallery(page, 'watercolor');
    await page.reload();
    await ready(page);
    await expectGallery(page, 'watercolor');
  });

  for (const value of ['', 'painting', 'DRAWING', '%3Cb%3Ex%3C%2Fb%3E']) {
    test(`?category=${value || '(vacío)'} → acuarelas`, async ({ page }) => {
      const log = collect(page);
      await page.goto(`/index.html?category=${value}`);
      await ready(page);
      await expectGallery(page, 'watercolor');
      expect(log.pageErrors).toEqual([]);
      expect(log.console).toEqual([]);
    });
  }

  test('cambiar de idioma en la pestaña de dibujos conserva la categoría', async ({ page }) => {
    await page.goto('/index.html?category=drawing&lang=en');
    await ready(page);
    await page.locator('[data-lang="es"]').first().click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    expect(param(page, 'category')).toBe('drawing');
    await expectGallery(page, 'drawing');
    await expect(tab(page, 'drawing')).toHaveText(T('es', 'home.categories.drawing'));
    await expect(page.getByRole('navigation', { name: T('es', 'home.categories.label') })).toBeVisible();
  });

  test('alternar pestañas no descarga dos veces ninguna imagen ni artworks.json (375 px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 });
    const requests = [];
    page.on('request', (r) => { const u = new URL(r.url()); if (/\/assets\/img\/works\/|\/data\/artworks\.json$/.test(u.pathname)) requests.push(u.pathname); });
    await page.goto('/index.html');
    await ready(page);
    await page.waitForLoadState('networkidle');
    for (const c of ['drawing', 'watercolor', 'drawing', 'watercolor']) {
      await tab(page, c).click();
      await expectGallery(page, c);
      await page.waitForLoadState('networkidle');
    }
    const count = requests.reduce((a, p) => ((a[p] = (a[p] || 0) + 1), a), {});
    const dup = Object.entries(count).filter(([, n]) => n > 1).map(([p, n]) => `${p} ×${n}`);
    expect(dup, 'descargas duplicadas al alternar pestañas').toEqual([]);
    expect(count['/data/artworks.json'], 'artworks.json').toBe(1);
    expect(requests.filter((p) => /-2000\.webp$/.test(p)), 'variante 2000 en móvil').toEqual([]);
  });

  for (const width of [375, 1440]) {
    test(`axe sin serious/critical tras cambiar de pestaña con JS (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 740 : 900 });
      await page.goto('/index.html?lang=es');
      await ready(page);
      await tab(page, 'drawing').click();
      await expectGallery(page, 'drawing');
      const axe = await new AxeBuilder({ page }).analyze();
      const serious = axe.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.impact} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
      expect(serious).toEqual([]);
    });
  }
});

test.describe('detalle de un dibujo', () => {
  test('← → recorren solo los dibujos; Esc vuelve a la pestaña de dibujos', async ({ page }) => {
    expect(DRAWINGS.length, 'hacen falta ≥ 3 dibujos').toBeGreaterThanOrEqual(3);
    const log = collect(page);
    // Desde la galería de dibujos, clic en la segunda obra
    await page.goto('/index.html?category=drawing&lang=es');
    await ready(page);
    await page.locator('.gallery__link').nth(1).click();
    await page.waitForURL((u) => u.searchParams.get('id') === DRAWINGS[1].id);
    await ready(page);
    await page.keyboard.press('ArrowRight');
    await page.waitForURL((u) => u.searchParams.get('id') === DRAWINGS[2].id);
    await ready(page);
    await page.keyboard.press('ArrowLeft');
    await page.waitForURL((u) => u.searchParams.get('id') === DRAWINGS[1].id);
    await ready(page);
    await page.keyboard.press('ArrowLeft');
    await page.waitForURL((u) => u.searchParams.get('id') === DRAWINGS[0].id);
    await ready(page);
    await expect(page.locator('.work-nav__link--prev'), 'el primer dibujo no tiene anterior').toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.waitForURL((u) => /\/(index\.html)?$/.test(u.pathname) && u.searchParams.get('category') === 'drawing');
    expect(param(page, 'lang')).toBe('es');
    await ready(page);
    await expectGallery(page, 'drawing');
    expect(log.pageErrors).toEqual([]);
  });

  test('el último dibujo no enlaza con la primera acuarela (ni al revés)', async ({ page }) => {
    const lastDrawing = DRAWINGS[DRAWINGS.length - 1];
    await page.goto(`/work.html?id=${lastDrawing.id}`);
    await ready(page);
    await expect(page.locator('.work-nav__link--next')).toHaveCount(0);
    const lastWater = LIST[LIST.length - 1];
    await page.goto(`/work.html?id=${lastWater.id}`);
    await ready(page);
    await expect(page.locator('.work-nav__link--next')).toHaveCount(0);
    const back = new URL(await page.locator('.work-nav__back').evaluate((a) => a.href));
    expect(back.searchParams.get('category') ?? 'watercolor').toBe('watercolor');
  });
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const width of [375, 1440]) {
    test(`las pestañas son enlaces que funcionan (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/index.html');
      await expect(tabs(page)).toHaveCount(2);
      await expect(tab(page, 'drawing')).toBeVisible();
      await expect(tab(page, 'watercolor')).toBeVisible();
      const [res] = await Promise.all([
        page.waitForResponse((r) => r.request().resourceType() === 'document'),
        tab(page, 'drawing').click()
      ]);
      expect(res.status()).toBe(200);
      expect(param(page, 'category')).toBe('drawing');
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(tab(page, 'watercolor')).toBeVisible();
      const o = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(o).toBe(true);
    });
  }
});
