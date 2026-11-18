// §12.2 HTML estático (parseo de los 6 .html), sitemap y robots.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { FRONTEND, PAGES, artworks, readText } from '../helpers/paths.mjs';

const SITE = 'https://kukobaezartgallery.netlify.app/';
const parse = (page) => new JSDOM(readText(`frontend/${page}`)).window.document;
const docs = Object.fromEntries(PAGES.map((p) => [p, parse(p)]));
const INDEXABLE = PAGES.filter((p) => p !== '404.html');

for (const page of PAGES) {
  test(`${page}: estructura, metadatos y accesibilidad estructural`, () => {
    const doc = docs[page];
    const problems = [];
    const h1 = doc.querySelectorAll('h1').length;
    // work.html pinta su h1 con JS (se comprueba en jsdom/E2E): aquí 0 o 1.
    if (page === 'work.html' ? h1 > 1 : h1 !== 1) problems.push(`${h1} <h1>`);
    if (!doc.documentElement.getAttribute('lang')) problems.push('sin lang');
    if (!doc.title.trim()) problems.push('sin <title>');
    if (!doc.querySelector('meta[name="description"]')?.content?.trim()) problems.push('sin meta description');
    if (!doc.querySelector('meta[name="viewport"]')) problems.push('sin viewport');
    for (const p of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) {
      if (!doc.querySelector(`meta[property="${p}"]`)?.content) problems.push(`sin ${p}`);
    }
    const ogImage = doc.querySelector('meta[property="og:image"]')?.content || '';
    if (ogImage.startsWith(SITE) && !fs.existsSync(path.join(FRONTEND, ogImage.slice(SITE.length)))) problems.push(`og:image no existe: ${ogImage}`);
    // 404 es noindex: no lleva canonical ni hreflang (sería contradictorio).
    if (page !== '404.html') {
      const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
      if (!canonical.startsWith(SITE)) problems.push(`canonical: ${canonical}`);
      for (const l of ['en', 'es', 'x-default']) {
        if (!doc.querySelector(`link[rel="alternate"][hreflang="${l}"]`)?.getAttribute('href')?.startsWith(SITE)) problems.push(`sin hreflang ${l}`);
      }
    }
    const main = doc.querySelector('main#main');
    if (!main) problems.push('sin <main id="main">');
    const skip = doc.querySelector('body a.skip-link, body > a[href="#main"]');
    if (!skip || skip.getAttribute('href') !== '#main') problems.push('sin skip link a #main');
    if (doc.querySelectorAll('main').length !== 1) problems.push('más de un <main>');
    // Todas las <img> (incluidas las de <template>) con alt, width y height.
    const imgs = [...doc.querySelectorAll('img')];
    for (const t of doc.querySelectorAll('template')) imgs.push(...t.content.querySelectorAll('img'));
    for (const img of imgs) {
      for (const a of ['alt', 'width', 'height']) if (!img.hasAttribute(a)) problems.push(`<img ${img.getAttribute('src')}> sin ${a}`);
    }
    // Scripts inline ejecutables: no debe haber (CSP script-src 'self').
    for (const s of doc.querySelectorAll('script:not([src])')) {
      if (s.type !== 'application/ld+json') problems.push(`<script> inline: ${s.textContent.trim().slice(0, 60)}`);
    }
    for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
      try { JSON.parse(s.textContent); } catch (e) { problems.push(`JSON-LD inválido: ${e.message}`); }
    }
    assert.deepEqual(problems, []);
  });
}

test('index.html lleva JSON-LD Person', () => {
  const ld = [...docs['index.html'].querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent));
  assert.ok(ld.some((d) => d['@type'] === 'Person' && d.name && d.url), 'falta Person');
});

test('no hay enlaces internos rotos (href/src → archivo existente)', () => {
  const broken = [];
  for (const page of PAGES) {
    const doc = docs[page];
    const nodes = [...doc.querySelectorAll('[href], [src]')];
    for (const t of doc.querySelectorAll('template')) nodes.push(...t.content.querySelectorAll('[href], [src]'));
    for (const node of nodes) {
      const ref = node.getAttribute('href') ?? node.getAttribute('src');
      if (!ref || /^(https?:|mailto:|tel:|data:|#)/.test(ref)) continue;
      const clean = ref.split(/[?#]/)[0];
      if (!clean) continue;
      const file = clean.startsWith('/') ? path.join(FRONTEND, clean) : path.join(FRONTEND, path.dirname(page), clean);
      // Los PDF de CV van en <template data-enabled="false"> (aún no existen): no cuentan.
      if (!fs.existsSync(file)) {
        const disabled = [...doc.querySelectorAll('template[data-enabled="false"]')].some((t) => t.content.contains(node));
        if (!disabled) broken.push(`${page}: ${ref}`);
      }
    }
    // Anclas internas: #id debe existir
    for (const a of doc.querySelectorAll('a[href^="#"]')) {
      const id = a.getAttribute('href').slice(1);
      if (id && !doc.getElementById(id)) broken.push(`${page}: ancla ${a.getAttribute('href')}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('404.html: noindex y rutas absolutas', () => {
  const doc = docs['404.html'];
  assert.equal(doc.querySelector('meta[name="robots"]')?.content, 'noindex');
  const relative = [...doc.querySelectorAll('[href], [src]')]
    .map((n) => n.getAttribute('href') ?? n.getAttribute('src'))
    .filter((r) => r && !/^(\/|https?:|mailto:|data:|#)/.test(r));
  assert.deepEqual(relative, [], 'rutas relativas en 404.html (se rompen en /a/b/c)');
});

test('sitemap.xml coincide con las páginas publicables y las obras', () => {
  const xml = readText('frontend/sitemap.xml');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  const expected = [
    SITE,
    ...INDEXABLE.filter((p) => !['index.html', 'work.html'].includes(p)).map((p) => SITE + p),
    ...artworks().map((a) => `${SITE}work.html?id=${a.id}`)
  ];
  assert.deepEqual([...locs].sort(), [...expected].sort());
  assert.ok(!locs.some((l) => l.includes('404')), '404 en el sitemap');
});

test('robots.txt apunta al sitemap', () => {
  const robots = readText('frontend/robots.txt');
  assert.match(robots, new RegExp(`^Sitemap: ${SITE}sitemap\\.xml$`, 'm'));
  assert.ok(!/^Disallow:\s*\/\s*$/m.test(robots), 'robots bloquea todo');
});
