// §12.2 Textos — i18n/{en,es}.json
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { FRONTEND, PAGES, dict, flatten, readText } from '../helpers/paths.mjs';

const en = flatten(dict('en'));
const es = flatten(dict('es'));
const NAMESPACES = ['common', 'home', 'work', 'about', 'commissions', 'contact', 'notFound', 'meta'];

test('en.json y es.json tienen exactamente las mismas claves', (t) => {
  const a = Object.keys(en), b = Object.keys(es);
  t.diagnostic(`${a.length} claves en EN, ${b.length} en ES`);
  assert.deepEqual(a.filter((k) => !(k in es)), [], 'claves solo en EN');
  assert.deepEqual(b.filter((k) => !(k in en)), [], 'claves solo en ES');
});

test('ningún valor vacío y todos son strings', () => {
  const bad = [];
  for (const [lang, d] of [['en', en], ['es', es]]) {
    for (const [k, v] of Object.entries(d)) if (typeof v !== 'string' || !v.trim()) bad.push(`${lang}:${k}`);
  }
  assert.deepEqual(bad, []);
});

// Notación pagina.seccion.elemento. Ajuste: se exigen ≥ 2 segmentos (no 3),
// porque páginas pequeñas como notFound.* y meta.siteName no tienen sección;
// forzar un tercer nivel sería ruido. Las de 2 niveles se listan como aviso.
test('claves con notación pagina.seccion.elemento (camelCase, namespace conocido)', (t) => {
  const bad = Object.keys(en).filter((k) => {
    const parts = k.split('.');
    return parts.length < 2 || !NAMESPACES.includes(parts[0]) || parts.some((p) => !/^[a-z][a-zA-Z0-9]*$/.test(p));
  });
  const short = Object.keys(en).filter((k) => k.split('.').length === 2);
  if (short.length) t.diagnostic(`AVISO: claves de 2 niveles: ${short.join(', ')}`);
  assert.deepEqual(bad, []);
});

test('los placeholders {x} coinciden entre EN y ES', () => {
  const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
  const bad = Object.keys(en).filter((k) => k in es && ph(en[k]) !== ph(es[k])).map((k) => `${k}: EN{${ph(en[k])}} ES{${ph(es[k])}}`);
  assert.deepEqual(bad, []);
});

test('los marcadores [[TODO]] están en las mismas claves en EN y ES (aviso)', (t) => {
  const todo = (v) => /\[\[TODO/.test(v);
  const list = Object.keys(en).filter((k) => todo(en[k]));
  t.diagnostic(`AVISO: ${list.length} claves con [[TODO]] (se ocultan en pantalla): ${list.join(', ')}`);
  const mismatch = Object.keys(en).filter((k) => k in es && todo(en[k]) !== todo(es[k]));
  assert.deepEqual(mismatch, []);
});

/* ---- Claves usadas en HTML y JS ------------------------------------------ */
function usedKeys() {
  const keys = new Map(); // clave → origen
  const add = (k, from) => { if (!keys.has(k)) keys.set(k, from); };
  for (const page of PAGES) {
    const html = readText(`frontend/${page}`);
    for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) add(m[1], page);
    for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
      for (const pair of m[1].split(';')) { const i = pair.indexOf(':'); if (i > 0) add(pair.slice(i + 1).trim(), page); }
    }
    // Claves dinámicas de i18n.js: meta.{data-page}.title/description
    const pageAttr = html.match(/<body[^>]*data-page="([^"]+)"/);
    const custom = /<body[^>]*data-meta="custom"/.test(html);
    if (pageAttr && !custom) { add(`meta.${pageAttr[1]}.title`, page); add(`meta.${pageAttr[1]}.description`, page); }
  }
  const jsDir = path.join(FRONTEND, 'assets/js');
  for (const f of fs.readdirSync(jsDir)) {
    const src = fs.readFileSync(path.join(jsDir, f), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    // Literales con forma de clave de un namespace conocido (cubre I18n.t('…') y ternarios).
    for (const m of src.matchAll(/'((?:common|home|work|about|commissions|contact|notFound|meta)\.[a-zA-Z0-9.]+)'/g)) {
      if (!m[1].endsWith('.') && !/\.(html|json|js|css)$/.test(m[1])) add(m[1], f);
    }
  }
  // Claves construidas por concatenación (revisadas a mano en el código):
  for (const s of ['available', 'sold', 'private', 'commissioned']) add(`common.status.${s}`, 'work.js');
  for (const s of ['success', 'error']) { add(`contact.${s}.heading`, 'contact.js'); add(`contact.${s}.text`, 'contact.js'); }
  return keys;
}

test('cada data-i18n de los HTML y cada clave usada en los JS existe en EN y ES', (t) => {
  const keys = usedKeys();
  t.diagnostic(`${keys.size} claves usadas`);
  const missing = [];
  for (const [k, from] of keys) {
    if (!(k in en)) missing.push(`EN ${k} (${from})`);
    if (!(k in es)) missing.push(`ES ${k} (${from})`);
  }
  assert.deepEqual(missing, []);
});
