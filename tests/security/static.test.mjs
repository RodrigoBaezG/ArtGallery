// §12.4 Inyección/XSS (estático), cabeceras (netlify.toml) y formulario.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { FRONTEND, PAGES, ROOT, artworks, readText, walk } from '../helpers/paths.mjs';
import { loadPage } from '../helpers/jsdom.mjs';
import { REQUIRED_HEADERS, cspMap, headersFor, readNetlifyToml } from '../helpers/headers.mjs';

const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
const codeFiles = walk(FRONTEND).filter((f) => /\.(js|html)$/.test(f));
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1').replace(/<!--[\s\S]*?-->/g, '');

/* ---- APIs peligrosas ----------------------------------------------------- */
const FORBIDDEN = [
  ['innerHTML', /\.innerHTML\b/],
  ['outerHTML', /\.outerHTML\b/],
  ['insertAdjacentHTML', /\binsertAdjacentHTML\b/],
  ['document.write', /\bdocument\.write(ln)?\s*\(/],
  ['eval', /(^|[^\w.])eval\s*\(/],
  ['new Function', /\bnew\s+Function\s*\(/],
  ['setTimeout/setInterval con string', /\bset(Timeout|Interval)\s*\(\s*['"`]/],
  ['createContextualFragment', /createContextualFragment/],
  ['srcdoc', /\.srcdoc\b/]
];

test('frontend/** no usa innerHTML, outerHTML, insertAdjacentHTML, document.write, eval, new Function, setTimeout(string)', () => {
  const hits = [];
  for (const f of codeFiles) {
    const src = stripComments(fs.readFileSync(f, 'utf8'));
    for (const [name, re] of FORBIDDEN) if (re.test(src)) hits.push(`${rel(f)}: ${name}`);
  }
  assert.deepEqual(hits, []);
});

test('sin manejadores on*= inline ni javascript: en los HTML', () => {
  const hits = [];
  for (const page of PAGES) {
    const html = stripComments(readText(`frontend/${page}`));
    for (const m of html.matchAll(/<[a-z][^>]*\s(on[a-z]+)\s*=/gi)) hits.push(`${page}: ${m[1]}`);
    if (/(href|src|action)\s*=\s*["']?\s*javascript:/i.test(html)) hits.push(`${page}: javascript: URL`);
    if (/\sstyle\s*=/.test(html.replace(/<svg[\s\S]*?<\/svg>/g, ''))) hits.push(`${page}: atributo style inline (CSP style-src sin 'unsafe-inline')`);
  }
  assert.deepEqual(hits, []);
});

test('JS: sin setAttribute("style") ni setAttribute("on…") (CSP)', () => {
  const hits = [];
  for (const f of codeFiles.filter((x) => x.endsWith('.js'))) {
    const src = stripComments(fs.readFileSync(f, 'utf8'));
    if (/setAttribute\(\s*['"]style['"]/.test(src)) hits.push(`${rel(f)}: setAttribute('style')`);
    if (/setAttribute\(\s*['"]on/i.test(src)) hits.push(`${rel(f)}: setAttribute('on…')`);
    if (/\.style\.cssText\s*=/.test(src)) hits.push(`${rel(f)}: style.cssText`);
  }
  assert.deepEqual(hits, []);
});

test('URLs que se asignan a href/src desde datos: solo relativas o https:', async () => {
  const { window } = await loadPage('index.html', { scripts: ['i18n.js', 'gallery.js'] });
  const bad = [];
  const safe = (u) => !/^\s*(javascript|data|vbscript|file|blob):/i.test(u) && (/^https:\/\//.test(u) || !/^[a-z][a-z0-9+.-]*:/i.test(u)) && !u.startsWith('//');
  for (const art of artworks()) {
    const url = window.Artworks.url(art);
    if (!safe(url)) bad.push(`url(${art.id}) = ${url}`);
    for (const w of art.image.widths) {
      const f = window.Artworks.file(art.image, w);
      if (!safe(f)) bad.push(`file(${art.id}) = ${f}`);
    }
  }
  // Ids hostiles: Artworks.url los codifica y nunca produce un esquema.
  for (const id of ['javascript:alert(1)', 'data:text/html,x', '//evil.example', '"><img src=x>']) {
    const url = window.Artworks.url({ id });
    if (!safe(url) || /["<>]/.test(url)) bad.push(`url(${id}) = ${url}`);
  }
  for (const page of PAGES) {
    const doc = new JSDOM(readText(`frontend/${page}`)).window.document;
    for (const n of doc.querySelectorAll('[href], [src], [action]')) {
      const v = n.getAttribute('href') ?? n.getAttribute('src') ?? n.getAttribute('action');
      if (/^\s*(javascript|vbscript):/i.test(v)) bad.push(`${page}: ${v}`);
      if (/^\s*data:/i.test(v) && !(n.tagName === 'LINK' && n.getAttribute('rel') === 'icon' && v === 'data:,')) bad.push(`${page}: ${v}`);
      if (/^http:\/\//i.test(v)) bad.push(`${page}: http sin TLS ${v}`);
    }
  }
  assert.deepEqual(bad, []);
});

/* ---- Cabeceras HTTP en netlify.toml -------------------------------------- */
let toml;

test('netlify.toml parsea', () => {
  toml = readNetlifyToml();
  assert.equal(toml.build?.publish, 'frontend');
});

for (const p of ['/', '/index.html', '/work.html', '/data/artworks.json', '/assets/img/works/x-640.webp']) {
  test(`netlify.toml: cabeceras de seguridad en ${p}`, () => {
    const h = headersFor(p, toml);
    const problems = [];
    for (const [name, expected] of Object.entries(REQUIRED_HEADERS)) {
      if (!(name in h)) { problems.push(`falta ${name}`); continue; }
      if (name === 'Content-Security-Policy') {
        assert.deepEqual(cspMap(h[name]), cspMap(expected), 'CSP distinta de la exigida en §12.4');
      } else if (h[name] !== expected) problems.push(`${name}: "${h[name]}" ≠ "${expected}"`);
    }
    assert.deepEqual(problems, []);
  });
}

test('netlify.toml: caché inmutable en assets/img y revalidación en HTML/JSON', () => {
  const img = headersFor('/assets/img/works/x-640.webp', toml)['Cache-Control'] || '';
  assert.equal(img.replace(/\s+/g, ' '), 'public, max-age=31536000, immutable');
  for (const p of ['/index.html', '/data/artworks.json', '/i18n/en.json', '/i18n/es.json', '/work.html']) {
    const cc = headersFor(p, toml)['Cache-Control'];
    // Sin regla, Netlify ya sirve max-age=0, must-revalidate; con regla, debe revalidar.
    if (cc !== undefined) assert.match(cc, /no-cache|max-age=0/, `${p}: ${cc}`);
    assert.ok(!/immutable/.test(cc || ''), `${p} inmutable`);
  }
});

test('netlify.toml: la 404 propia se sirve con estado 404', () => {
  const r = (toml.redirects || []).find((x) => x.from === '/*');
  assert.ok(r, 'falta redirect /*');
  assert.equal(r.to, '/404.html');
  assert.equal(r.status, 404);
  assert.notEqual(r.force, true, 'force=true taparía archivos existentes');
});

/* ---- Formulario ---------------------------------------------------------- */
test('formulario: honeypot, maxlength y type=email', () => {
  const doc = new JSDOM(readText('frontend/contact.html')).window.document;
  const form = doc.querySelector('form[name="contact"]');
  const problems = [];
  if (form.getAttribute('netlify-honeypot') !== 'bot-field') problems.push('sin netlify-honeypot="bot-field"');
  if (!form.hasAttribute('data-netlify')) problems.push('sin data-netlify');
  if ((form.getAttribute('method') || '').toUpperCase() !== 'POST') problems.push('method ≠ POST');
  const bot = form.querySelector('[name="bot-field"]');
  if (!bot) problems.push('sin campo bot-field');
  else if (bot.getAttribute('tabindex') !== '-1') problems.push('bot-field enfocable');
  const limits = { name: 100, email: 254, message: 5000 };
  for (const [name, max] of Object.entries(limits)) {
    const el = form.querySelector(`[name="${name}"]`);
    const ml = Number(el?.getAttribute('maxlength'));
    if (!ml) problems.push(`${name} sin maxlength`);
    else if (ml > max) problems.push(`${name} maxlength=${ml} > ${max}`);
  }
  if (form.querySelector('[name="email"]')?.getAttribute('type') !== 'email') problems.push('email sin type="email"');
  assert.deepEqual(problems, []);
});
