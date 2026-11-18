// Utilidades compartidas por los specs de Playwright.
import { artworks, sorted } from './paths.mjs';

export const LIST = sorted(artworks());
export const FIRST = LIST[0];
export const LAST = LIST[LIST.length - 1];
export const WIDTHS = [320, 375, 768, 1440];
export const LANGS = ['en', 'es'];

/** Las 8 URLs de QA. `status` = estado HTTP esperado del documento. */
export const QA_URLS = [
  { name: 'index', path: '/index.html', status: 200 },
  { name: 'work-first', path: `/work.html?id=${FIRST.id}`, status: 200 },
  { name: 'work-last', path: `/work.html?id=${LAST.id}`, status: 200 },
  { name: 'work-invalid', path: '/work.html?id=does-not-exist', status: 200 },
  { name: 'about', path: '/about.html', status: 200 },
  { name: 'commissions', path: '/commissions.html', status: 200 },
  { name: 'contact', path: '/contact.html', status: 200 },
  { name: '404', path: '/this-page-does-not-exist', status: 404 }
];

export const withLang = (p, lang) => p + (p.includes('?') ? '&' : '?') + 'lang=' + lang;

/** Recoge errores/avisos de consola, errores de página y respuestas ≥ 400. */
export function collect(page) {
  const out = { console: [], pageErrors: [], badResponses: [], requests: [] };
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') out.console.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => out.pageErrors.push(String(err)));
  page.on('request', (req) => out.requests.push(req.url()));
  page.on('response', (res) => { if (res.status() >= 400) out.badResponses.push(`${res.status()} ${res.url()}`); });
  return out;
}

/** Espera a que i18n y la galería/detalle hayan pintado. */
export async function ready(page) {
  await page.waitForLoadState('load');
  await page.evaluate(() => (window.I18n ? window.I18n.ready : null));
  await page.waitForFunction(() => {
    const g = document.querySelector('[data-gallery]');
    if (g) return g.querySelectorAll('.gallery__item').length > 0 || !g.querySelector('[data-gallery-status]').hidden;
    const w = document.querySelector('[data-work]');
    if (w) return !!w.querySelector('h1');
    return true;
  }, null, { timeout: 15_000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
}

/** Desbordamiento horizontal del documento. */
export const horizontalOverflow = (page) =>
  page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));

/**
 * Áreas táctiles < 44×44 px de los controles visibles.
 * Excepción WCAG 2.5.8: enlaces en línea dentro de una frase (el texto
 * alrededor fija su tamaño); el skip link fuera de pantalla; el honeypot.
 */
export function smallTargets(page) {
  return page.evaluate(() => {
    const MIN = 44;
    const out = [];
    const nodes = document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [tabindex]:not([tabindex="-1"])');
    for (const el of nodes) {
      if (el.closest('.form__honeypot')) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.bottom < 0 || r.right < 0 || r.left > document.documentElement.clientWidth) continue; // skip link oculto
      if (el.classList.contains('skip-link')) continue;
      if (style.display === 'inline') {
        const parent = el.parentElement;
        const text = [...parent.childNodes].some((n) => n !== el && (n.nodeType === 3 || (n.nodeType === 1 && getComputedStyle(n).display === "inline")) && n.textContent.trim());
        if (text) continue; // enlace dentro de una frase
      }
      if (r.width < MIN - 0.5 || r.height < MIN - 0.5) {
        const label = (el.getAttribute('aria-label') || el.textContent || el.name || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
        out.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${label}" ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
    }
    return [...new Set(out)];
  });
}

/** Textos con [[TODO o [[PROPUESTA visibles (texto, atributos, meta, JSON-LD). */
export function visibleTodos(page) {
  return page.evaluate(() => {
    const RE = /\[\[(TODO|PROPUESTA)/;
    const hits = [];
    if (RE.test(document.body.innerText)) hits.push('texto visible');
    for (const el of document.querySelectorAll('[alt], [title], [aria-label], [placeholder], [content]')) {
      for (const a of ['alt', 'title', 'aria-label', 'placeholder', 'content']) {
        const v = el.getAttribute(a);
        if (v && RE.test(v)) hits.push(`${el.tagName.toLowerCase()}[${a}]`);
      }
    }
    if (RE.test(document.title)) hits.push('title');
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) if (RE.test(s.textContent)) hits.push('JSON-LD');
    return hits;
  });
}
