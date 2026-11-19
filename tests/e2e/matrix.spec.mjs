// §12.3 Matriz 320/375/768/1440 × EN/ES × (Chromium/WebKit, por proyecto) × 10 URLs de QA
// (las 8 originales + home ?category=drawing + detalle de un dibujo):
// consola limpia, sin respuestas ≥ 400 (salvo la 404 esperada), sin scroll
// horizontal, áreas táctiles ≥ 44 px y axe sin violaciones serious/critical.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { BY_CATEGORY, LANGS, QA_URLS, WIDTHS, collect, horizontalOverflow, ready, smallTargets, withLang } from '../helpers/e2e.mjs';

// Como I18n.clean: sin [[PROPUESTA]] ni [[TODO…]] (un título solo-TODO no se exige).
const cleanText = (v) => String(v || '').replace(/^\s*\[\[PROPUESTA\]\]\s*/, '').replace(/\s*\[\[TODO[^\]]*\]\]/g, '').trim();

for (const width of WIDTHS) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: width < 768 ? 740 : 900 } });

    for (const lang of LANGS) {
      for (const qa of QA_URLS) {
        test(`${qa.name} ${lang}`, async ({ page }) => {
          const log = collect(page);
          const res = await page.goto(withLang(qa.path, lang));
          expect(res.status(), 'estado HTTP del documento').toBe(qa.status);
          await ready(page);

          await expect(page.locator('html')).toHaveAttribute('lang', lang);
          await expect(page.locator('h1'), 'un único h1').toHaveCount(1);

          // Contenido esperado: la home pinta su categoría; el detalle, su obra.
          if (qa.gallery) {
            const list = BY_CATEGORY[qa.gallery];
            expect(list.length, `${qa.gallery}: sin obras en artworks.json`).toBeGreaterThan(0);
            await expect(page.locator('.gallery__item'), `galería ${qa.gallery}`).toHaveCount(list.length);
            await expect(page.locator(`.category-tabs__link[aria-current="page"][href*="category=${qa.gallery}"]`), 'pestaña activa').toHaveCount(1);
          }
          if (qa.work) {
            expect(qa.work.missing, `${qa.name}: no hay obra de esa categoría en artworks.json`).toBeFalsy();
            await expect(page.locator('.work__title')).toHaveText(cleanText(qa.work.title[lang]) || /\S/);
          }

          // Consola y red
          const expected404 = (s) => qa.status === 404 && s.includes('404') && (s.includes(qa.path) || /Failed to load resource/.test(s));
          expect.soft(log.pageErrors, 'errores de página').toEqual([]);
          expect.soft(log.console.filter((m) => !expected404(m)), 'consola con errores/avisos').toEqual([]);
          expect.soft(log.badResponses.filter((r) => !(qa.status === 404 && r.includes(qa.path))), 'respuestas ≥ 400').toEqual([]);

          // Scroll horizontal
          const o = await horizontalOverflow(page);
          expect.soft(o.scroll, `scroll horizontal (${o.scroll} > ${o.client})`).toBeLessThanOrEqual(o.client);

          // Áreas táctiles
          expect.soft(await smallTargets(page), 'áreas táctiles < 44 px').toEqual([]);

          // axe
          const axe = await new AxeBuilder({ page }).analyze();
          const serious = axe.violations
            .filter((v) => v.impact === 'serious' || v.impact === 'critical')
            .map((v) => `${v.impact} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
          expect.soft(serious, 'axe serious/critical').toEqual([]);
        });
      }
    }

    if (width < 960) {
      test('menú móvil abierto: sin scroll horizontal y enlaces ≥ 44 px', async ({ page }) => {
        await page.goto('/index.html');
        await ready(page);
        const toggle = page.locator('.nav__toggle');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('.nav__link').first()).toBeVisible();
        const o = await horizontalOverflow(page);
        expect.soft(o.scroll).toBeLessThanOrEqual(o.client);
        expect.soft(await smallTargets(page)).toEqual([]);
        const axe = await new AxeBuilder({ page }).analyze();
        expect.soft(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => v.id)).toEqual([]);
        await page.keyboard.press('Escape');
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toBeFocused();
      });
    }
  });
}

// Avisos diferidos: algunos navegadores avisan segundos después de load
// (p. ej. WebKit con <link rel="preload"> no usado). Se espera 5 s.
test.describe('consola limpia también 5 s después de cargar', () => {
  for (const qa of QA_URLS.filter((q) => ['index', 'index-drawing', 'work-first', 'work-drawing', 'contact'].includes(q.name))) {
    test(qa.name, async ({ page }) => {
      const log = collect(page);
      const requests = [];
      page.on('request', (r) => { const u = new URL(r.url()); requests.push(u.origin === new URL(page.url() || 'http://x').origin ? u.pathname + u.search : u.href); });
      await page.goto(qa.path);
      await ready(page);
      await page.waitForTimeout(5000);
      expect.soft(log.pageErrors).toEqual([]);
      expect.soft(log.console).toEqual([]);
      const dup = Object.entries(requests.reduce((a, p) => ((a[p] = (a[p] || 0) + 1), a), {})).filter(([, n]) => n > 1).map(([p, n]) => `${p} ×${n}`);
      expect.soft(dup, 'recursos descargados más de una vez').toEqual([]);
    });
  }
});
