// §12.3 Lazy loading y rendimiento.
import { test, expect } from '@playwright/test';
import { FIRST, LIST, ready } from '../helpers/e2e.mjs';

const EAGER = 4;
const workImage = (url) => {
  const m = new URL(url).pathname.match(/\/assets\/img\/works\/(.+)-(\d+)\.webp$/);
  return m && { base: m[1], width: Number(m[2]) };
};

test.describe('lazy loading (375 px, contexto nuevo)', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('primera vista: como máximo las eager; al hacer scroll llegan las 22 sin duplicados', async ({ page }) => {
    const loaded = [];
    page.on('requestfinished', (req) => { const w = workImage(req.url()); if (w) loaded.push(w); });
    await page.goto('/index.html');
    await ready(page);
    await page.waitForLoadState('networkidle');
    const initial = new Set(loaded.map((w) => w.base));
    // Diagnóstico: cuántas obras quedan dentro de la ventana o cerca.
    const inView = await page.evaluate(() => [...document.querySelectorAll('.gallery__image')].filter((i) => i.getBoundingClientRect().top < innerHeight).length);
    test.info().annotations.push({ type: 'lazy', description: `primera vista: ${initial.size} obras descargadas, ${inView} visibles en la ventana, eager=${EAGER}` });
    // Ajuste razonado: el lazy loading nativo descarga también las imágenes a
    // menos de un umbral bajo la ventana (Chromium: 1250–2500 px según la red;
    // WebKit: similar). Se exige: (a) nada fuera de eager + ese margen, y
    // (b) que las obras lejanas NO se descarguen (el lazy funciona).
    // + LAYOUT_SLACK: el navegador decide con el layout inicial y aquí se mide tras cargar
    // fuentes (font-display: swap); el hero puede desplazar la galería unas decenas de px.
    const MARGIN = 2500;
    const LAYOUT_SLACK = 64;
    const positions = await page.evaluate(() => [...document.querySelectorAll('.gallery__image')].map((i) => ({
      base: new URL(i.currentSrc || i.src).pathname.split('/').pop().replace(/-\d+\.webp$/, ''),
      top: i.getBoundingClientRect().top + scrollY, lazy: i.loading === 'lazy'
    })));
    const vh = page.viewportSize().height;
    const outside = positions.filter((p) => initial.has(p.base) && p.lazy && p.top > vh + MARGIN + LAYOUT_SLACK).map((p) => `${p.base}@${Math.round(p.top)}`);
    expect.soft(outside, 'lazy descargadas fuera del margen del navegador').toEqual([]);
    const far = positions.filter((p) => p.top > vh + MARGIN);
    if (far.length) expect.soft(far.some((p) => !initial.has(p.base)), 'ninguna obra lejana quedó sin descargar: lazy inefectivo').toBe(true);
    expect.soft(positions.slice(0, EAGER).every((p) => initial.has(p.base)), 'las eager deben descargarse').toBe(true);

    // Scroll progresivo hasta el final
    for (let i = 0; i < 80; i++) {
      const done = await page.evaluate(() => { window.scrollBy(0, innerHeight * 0.8); return innerHeight + scrollY >= document.documentElement.scrollHeight - 2; });
      await page.waitForTimeout(120);
      if (done) break;
    }
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => [...document.querySelectorAll('.gallery__image')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 20_000 });
    const bases = new Set(loaded.map((w) => w.base));
    expect(bases.size, 'obras descargadas tras el scroll').toBe(LIST.length);
    const perBase = {};
    for (const w of loaded) perBase[w.base] = (perBase[w.base] || 0) + 1;
    const dup = Object.entries(perBase).filter(([, n]) => n > 1).map(([b, n]) => `${b} ×${n}`);
    expect(dup, 'descargas duplicadas').toEqual([]);
    // A 375 px (DPR 1) no debería bajarse nunca la variante de 2000.
    expect(loaded.filter((w) => w.width === 2000).map((w) => w.base), 'variante 2000 en móvil').toEqual([]);
  });
});

test.describe('rendimiento (Chromium, 4G simulado + CPU ×4)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP solo en Chromium');

  async function throttle(page) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    // Perfil "Slow 4G" de Lighthouse: 150 ms RTT, 1,6 Mbps bajada, 750 kbps subida.
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8
    });
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    return cdp;
  }

  async function lcp(page) {
    return page.evaluate(() => new Promise((resolve) => {
      let last = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) last = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      setTimeout(() => resolve(last), 1500);
    }));
  }

  for (const [name, path] of [['home', '/index.html'], ['detalle', `/work.html?id=${FIRST.id}`]]) {
    test(`LCP < 2,5 s en ${name} (375 px)`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: 375, height: 740 });
      await throttle(page);
      await page.goto(path, { waitUntil: 'load', timeout: 90_000 });
      await ready(page);
      const value = await lcp(page);
      test.info().annotations.push({ type: 'LCP', description: `${name}: ${Math.round(value)} ms` });
      expect(value, `LCP ${Math.round(value)} ms`).toBeGreaterThan(0);
      expect(value, `LCP ${Math.round(value)} ms`).toBeLessThan(2500);
    });
  }

  for (const width of [375, 1440]) {
    test(`peso de la home en la primera vista < 1,5 MB (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 740 : 900 });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      let bytes = 0;
      const byType = {};
      const types = new Map();
      cdp.on('Network.responseReceived', (e) => types.set(e.requestId, e.type));
      cdp.on('Network.loadingFinished', (e) => {
        bytes += e.encodedDataLength;
        const t = types.get(e.requestId) || 'Other';
        byType[t] = (byType[t] || 0) + e.encodedDataLength;
      });
      await page.goto('/index.html');
      await ready(page);
      await page.waitForLoadState('networkidle');
      const kb = Math.round(bytes / 1024);
      test.info().annotations.push({ type: 'peso', description: `${width}px: ${kb} KB ${JSON.stringify(Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, Math.round(v / 1024)])))}` });
      expect(bytes, `${kb} KB`).toBeLessThan(1.5 * 1024 * 1024);
    });
  }
});
