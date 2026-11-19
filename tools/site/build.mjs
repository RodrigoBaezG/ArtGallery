// Genera, a partir de frontend/data/artworks.json:
//  - frontend/sitemap.xml
//  - el bloque @generated:first-artworks de frontend/assets/js/home-preload.js
//    (primera obra de cada categoría, para el preload del LCP).
// Uso (desde la raíz):  node tools/site/build.mjs
// Ejecutar tras cualquier cambio de obras, orden o featured. Sin dependencias. Salida determinista: páginas fijas en orden fijo y obras
// por categoría (watercolor → drawing) en el orden de la galería
// (featured → order). Cada URL lleva hreflang en / es / x-default (?lang=).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = 'https://kukobaezgallery.netlify.app/';
const CATEGORIES = ['watercolor', 'drawing'];

const artworks = JSON.parse(fs.readFileSync(path.join(ROOT, 'frontend/data/artworks.json'), 'utf8'));
const categoryOf = (art) => (CATEGORIES.includes(art.category) ? art.category : CATEGORIES[0]);

const sorted = artworks.slice().sort((a, b) =>
  CATEGORIES.indexOf(categoryOf(a)) - CATEGORIES.indexOf(categoryOf(b)) ||
  (!!b.featured - !!a.featured) ||
  (a.order || 0) - (b.order || 0)
);

const ids = new Set();
for (const art of sorted) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(art.id)) throw new Error(`id no válido: ${art.id}`);
  if (ids.has(art.id)) throw new Error(`id duplicado: ${art.id}`);
  ids.add(art.id);
}

// Rutas relativas a SITE, con su query (sin lang).
const paths = [
  '',
  '?category=drawing', // galería de dibujos: contenido propio, autocanónica (gallery.js)
  'about.html',
  'commissions.html',
  'contact.html',
  ...sorted.map((art) => `work.html?id=${art.id}`)
];

const esc = (s) => s.replace(/&/g, '&amp;');
const withLang = (p, lang) => p + (p.includes('?') ? '&' : '?') + `lang=${lang}`;

const body = paths.map((p) => [
  '  <url>',
  `    <loc>${esc(SITE + p)}</loc>`,
  `    <xhtml:link rel="alternate" hreflang="en" href="${esc(SITE + withLang(p, 'en'))}"/>`,
  `    <xhtml:link rel="alternate" hreflang="es" href="${esc(SITE + withLang(p, 'es'))}"/>`,
  `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(SITE + p)}"/>`,
  '  </url>'
].join('\n')).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'frontend/sitemap.xml'), xml);
console.log(`sitemap.xml: ${paths.length} URLs (${sorted.length} obras)`);

// ---- home-preload.js: primera obra (featured → order) de cada categoría ----
const first = {};
for (const cat of CATEGORIES) {
  const art = sorted.find((a) => categoryOf(a) === cat);
  if (!art) continue;
  const { base, widths, width, height } = art.image;
  first[cat] = { base, widths, width, height };
}
const preloadPath = path.join(ROOT, 'frontend/assets/js/home-preload.js');
const js = fs.readFileSync(preloadPath, 'utf8');
const block = /(\/\* @generated:first-artworks[^*]*\*\/\r?\n)[\s\S]*?(\r?\n\s*\/\* @end:first-artworks \*\/)/;
if (!block.test(js)) throw new Error('home-preload.js: no se encuentra el bloque @generated:first-artworks');
fs.writeFileSync(preloadPath, js.replace(block, (m, open, close) => `${open}  var FIRST = ${JSON.stringify(first)};${close}`));
console.log(`home-preload.js: ${Object.entries(first).map(([c, v]) => `${c} → ${v.base.split('/').pop()}`).join(', ')}`);
