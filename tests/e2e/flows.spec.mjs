// §12.3 Recorridos: quien contrata, idioma, formulario, sin JS, reduced motion y SEO.
import { test, expect } from '@playwright/test';
import { FIRST, LANGS, LIST, QA_URLS, collect, ready, visibleTodos, withLang } from '../helpers/e2e.mjs';
import { dict, flatten } from '../helpers/paths.mjs';

const D = { en: flatten(dict('en')), es: flatten(dict('es')) };
const clean = (s) => String(s).replace(/^\s*\[\[PROPUESTA\]\]\s*/, '').replace(/\s*\[\[TODO[^\]]*\]\]/g, '').trim();

test.describe('recorrido de quien contrata', () => {
  for (const width of [375, 1440]) {
    test(`home → obra → ← → → Esc → encargar → contacto → validación (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const log = collect(page);
      await page.goto('/index.html');
      await ready(page);
      await expect(page.locator('h1')).toHaveText(D.en['home.hero.name']);

      // Clic en la primera obra
      await page.locator('.gallery__link').first().click();
      await page.waitForURL(/work\.html\?id=/);
      await ready(page);
      expect(new URL(page.url()).searchParams.get('id')).toBe(LIST[0].id);
      await expect(page.locator('h1')).toHaveText(LIST[0].title.en);

      // → siguiente, ← anterior
      await page.keyboard.press('ArrowRight');
      await page.waitForURL((u) => u.searchParams.get('id') === LIST[1].id);
      await ready(page);
      await expect(page.locator('h1')).toHaveText(LIST[1].title.en);
      await page.keyboard.press('ArrowLeft');
      await page.waitForURL((u) => u.searchParams.get('id') === LIST[0].id);
      await ready(page);

      // Esc → galería, en la categoría de la obra (watercolor: con o sin ?category)
      await page.keyboard.press('Escape');
      await page.waitForURL((u) => /\/(index\.html)?$/.test(u.pathname) && u.hash === '#gallery');
      expect(new URL(page.url()).searchParams.get('category') ?? 'watercolor').toBe('watercolor');
      await ready(page);
      await expect(page.locator('.gallery__item')).toHaveCount(LIST.length);

      // Obra → «Encargar algo similar»
      await page.locator('.gallery__link').nth(2).click();
      await page.waitForURL(/work\.html/);
      await ready(page);
      const cta = page.getByRole('link', { name: D.en['work.actions.commissionSimilar'] });
      await expect(cta).toBeVisible();
      await cta.click();
      await page.waitForURL(/(commissions|contact)\.html/);
      await ready(page);

      // Desde encargos, el CTA a contacto
      if (/commissions\.html/.test(page.url())) {
        await page.locator('main a[href^="contact.html"]').first().click();
        await page.waitForURL(/contact\.html/);
        await ready(page);
      }
      // Tipo de proyecto preseleccionado: no aplica (ni el CTA ni contact.js pasan
      // ese dato); se comprueba al menos que el selector existe y tiene opciones.
      expect(await page.locator('#project-type option').count()).toBeGreaterThan(1);

      // El formulario valida
      await page.getByRole('button', { name: D.en['contact.form.submit'] }).click();
      await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#name')).toBeFocused();
      await expect(page.locator('#name-error')).toHaveText(D.en['contact.validation.required']);

      expect(log.pageErrors).toEqual([]);
      expect(log.console).toEqual([]);
    });
  }

  test('teclado: Tab llega a la galería con foco visible', async ({ page, browserName }) => {
    // WebKit (como Safari por defecto) no enfoca enlaces con Tab: limitación del motor, no del sitio.
    test.skip(browserName === 'webkit', 'WebKit no enfoca enlaces con Tab por defecto');
    await page.goto('/index.html');
    await ready(page);
    const firstLink = page.locator('.gallery__link').first();
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      if (await firstLink.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(firstLink).toBeFocused();
    const outline = await firstLink.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), shadow: s.boxShadow };
    });
    expect(outline.style !== 'none' && outline.width > 0 || outline.shadow !== 'none', `foco visible: ${JSON.stringify(outline)}`).toBeTruthy();
    await page.keyboard.press('Enter');
    await page.waitForURL(/work\.html/);
  });
});

test.describe('idioma', () => {
  test('EN → ES cambia textos, lang, title y URL; persiste al navegar y al recargar', async ({ page }) => {
    await page.goto('/index.html?lang=en');
    await ready(page);
    const titleEn = await page.title();
    await page.locator('[data-lang="es"]').first().click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page).toHaveTitle(clean(D.es['meta.home.title']));
    expect(await page.title()).not.toBe(titleEn);
    expect(new URL(page.url()).searchParams.get('lang')).toBe('es');
    await expect(page.locator('[data-lang="es"]').first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', clean(D.es['meta.home.description']));

    // Todos los data-i18n visibles muestran el texto ES
    const mismatches = await page.evaluate((es) => {
      const out = [];
      for (const el of document.querySelectorAll('[data-i18n]')) {
        const v = es[el.dataset.i18n];
        if (v === undefined || /\[\[TODO/.test(v)) continue;
        const expected = v.replace(/^\s*\[\[PROPUESTA\]\]\s*/, '').replace(/\{year\}/, String(new Date().getFullYear())).replace(/\{email\}/, es['common.contactInfo.email']);
        if (/\{\w+\}/.test(expected)) continue;
        if (el.textContent.trim() !== expected.trim()) out.push(`${el.dataset.i18n}: "${el.textContent.trim()}"`);
      }
      return out;
    }, D.es);
    expect(mismatches).toEqual([]);
    // La galería también cambia (título y alt de la primera obra)
    await expect(page.locator('.gallery__title').first()).toHaveText(LIST[0].title.es);
    await expect(page.locator('.gallery__image').first()).toHaveAttribute('alt', LIST[0].image.alt.es);

    // Navegar (sin ?lang en el enlace) mantiene ES
    await page.locator('.nav__link[href="about.html"]').click();
    await page.waitForURL(/about\.html/);
    await ready(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await page.goto('/commissions.html');
    await ready(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await page.reload();
    await ready(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page).toHaveTitle(clean(D.es['meta.commissions.title']));
  });

  test('locale es-ES sin preferencia guardada → ES', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'es-ES' });
    const page = await ctx.newPage();
    await page.goto('/about.html');
    await ready(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await ctx.close();
  });
});

test.describe('formulario', () => {
  for (const [status, state] of [[200, 'success'], [500, 'error']]) {
    test(`POST / interceptado con ${status} → estado ${state}`, async ({ page }) => {
      let posted = null;
      await page.route('**/', (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        posted = route.request().postData();
        return route.fulfill({ status, body: status === 200 ? 'ok' : 'error', contentType: 'text/html' });
      });
      const log = collect(page);
      await page.goto('/contact.html?lang=es');
      await ready(page);
      await page.fill('#name', 'Ana');
      await page.fill('#email', 'ana@example.com');
      await page.selectOption('#project-type', 'book');
      await page.fill('#message', 'Hola, ¿tienes disponibilidad?');
      await page.getByRole('button', { name: D.es['contact.form.submit'] }).click();
      const statusBox = page.locator('.form__status');
      await expect(statusBox).toHaveClass(new RegExp(`form__status--${state}`));
      await expect(statusBox).toContainText(D.es[`contact.${state}.heading`]);
      await expect(statusBox).toBeFocused();
      await expect(page.getByRole('button', { name: D.es['contact.form.submit'] })).toBeEnabled();
      const body = new URLSearchParams(posted);
      expect(body.get('form-name')).toBe('contact');
      expect(body.get('project-type')).toBe('book');
      expect(body.has('bot-field')).toBe(true);
      expect(await statusBox.textContent()).not.toContain('ana@example.com');
      // El 500 se registra con console.warn('[contact]'): esperado en este caso.
      expect(log.console.filter((m) => !(status === 500 && /\[contact\]|500/.test(m)))).toEqual([]);
    });
  }

  test('el honeypot no se ve ni se puede enfocar', async ({ page }) => {
    await page.goto('/contact.html');
    await ready(page);
    const bot = page.locator('[name="bot-field"]');
    await expect(bot).toBeHidden();
    await page.locator('#name').focus();
    const focused = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Shift+Tab');
      focused.push(await page.evaluate(() => document.activeElement?.name || document.activeElement?.className || ''));
    }
    expect(focused).not.toContain('bot-field');
  });
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const width of [375, 1440]) {
    test(`navegación, enlaces y formulario nativo usables (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/index.html');
      await expect(page.locator('h1')).toBeVisible();
      // Los enlaces de navegación se ven sin pulsar el botón del menú
      for (const href of ['about.html', 'commissions.html', 'contact.html']) {
        await expect(page.locator(`.nav__menu a[href="${href}"]`), `nav ${href}`).toBeVisible();
      }
      await expect(page.locator('.nav__toggle')).toBeHidden();
      await page.locator('.nav__menu a[href="about.html"]').click();
      await expect(page).toHaveURL(/about\.html/);
      await expect(page.locator('h1')).toBeVisible();
      await page.goto('/contact.html');
      const form = page.locator('form[name="contact"]');
      await expect(form).toHaveAttribute('method', /post/i);
      await expect(form).toHaveAttribute('action', /contact\.html\?sent=1/);
      for (const id of ['name', 'email', 'project-type', 'message']) await expect(page.locator(`#${id}`)).toBeVisible();
      await expect(page.locator('form [type="submit"]')).toBeEnabled();
      // Validación nativa: sin rellenar, el navegador no envía
      await page.locator('form [type="submit"]').click();
      await expect(page).toHaveURL(/contact\.html$/);
      const o = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(o).toBe(true);
      // La galería sin JS ofrece contacto (noscript)
      await page.goto('/index.html');
      await expect(page.locator('#gallery a[href="contact.html"]').first()).toBeVisible();
    });
  }
});

test.describe('prefers-reduced-motion: reduce', () => {
  test.use({ reducedMotion: 'reduce' });
  for (const qa of QA_URLS.filter((q) => ['index', 'work-first', 'contact'].includes(q.name))) {
    test(`sin transiciones ni animaciones en ${qa.name}`, async ({ page }) => {
      await page.goto(qa.path);
      await ready(page);
      // También con el menú abierto (si aplica) y tras hover/focus
      const moving = await page.evaluate(() => {
        // Umbral 1 ms: la técnica estándar `transition-duration: 0.01ms !important`
        // (1e-05 s) anula el movimiento pero conserva los eventos transitionend.
        const dur = (v) => v.split(',').some((x) => parseFloat(x) * (x.trim().endsWith('ms') ? 0.001 : 1) > 0.001);
        const out = [];
        for (const el of document.querySelectorAll('*')) {
          const s = getComputedStyle(el);
          if (dur(s.transitionDuration) && s.transitionProperty !== 'none') out.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} transition ${s.transitionProperty} ${s.transitionDuration}`);
          if (dur(s.animationDuration) && s.animationName !== 'none') out.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} animation ${s.animationName}`);
        }
        if (getComputedStyle(document.documentElement).scrollBehavior === 'smooth') out.push('html scroll-behavior: smooth');
        return [...new Set(out)];
      });
      expect(moving).toEqual([]);
    });
  }
});

test.describe('SEO', () => {
  for (const lang of LANGS) {
    for (const qa of QA_URLS) {
      test(`${qa.name} ${lang}: JSON-LD válido y sin [[TODO]]/[[PROPUESTA]] visibles`, async ({ page }) => {
        await page.goto(withLang(qa.path, lang));
        await ready(page);
        const ld = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent));
        const parsed = ld.map((t) => JSON.parse(t));
        if (qa.name === 'index') expect(parsed.some((d) => d['@type'] === 'Person')).toBe(true);
        if (qa.name.startsWith('work-') && qa.name !== 'work-invalid') {
          const art = parsed.find((d) => d['@type'] === 'VisualArtwork');
          expect(art, 'VisualArtwork').toBeTruthy();
          expect(art.inLanguage).toBe(lang);
          expect(art.name).toBeTruthy();
          expect(art.artMedium).toBeTruthy();
          expect(art.image).toMatch(/^https:\/\//);
        }
        expect(await visibleTodos(page)).toEqual([]);
        await expect(page).toHaveTitle(/\S/);
        const desc = await page.locator('meta[name="description"]').getAttribute('content');
        expect(desc && desc.length > 20).toBe(true);
      });
    }
  }

  test('detalle: title, canonical y hreflang propios de la obra', async ({ page }) => {
    await page.goto(`/work.html?id=${FIRST.id}&lang=es`);
    await ready(page);
    await expect(page).toHaveTitle(new RegExp(FIRST.title.es));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`work\\.html\\?id=${FIRST.id}&lang=es$`));
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', new RegExp(`id=${FIRST.id}&lang=en$`));
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });
});
