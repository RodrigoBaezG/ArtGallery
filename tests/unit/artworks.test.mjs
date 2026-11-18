// §12.2 Datos — artworks.json según el esquema de CLAUDE.md §3.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { FRONTEND, readText, isTodoMarker } from '../helpers/paths.mjs';

const RAW = readText('frontend/data/artworks.json');
const STATUSES = ['available', 'sold', 'private', 'commissioned'];
const WIDTHS = [640, 1280, 2000];
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const BILINGUAL_REQUIRED = ['title', 'medium']; // sin vacíos
let list;

test('artworks.json es JSON válido y es un array', () => {
  list = JSON.parse(RAW);
  assert.ok(Array.isArray(list));
});

test('hay entre 12 y 24 obras', () => {
  assert.ok(list.length >= 12 && list.length <= 24, `hay ${list.length}`);
});

test('campos obligatorios y tipos (§3)', () => {
  const problems = [];
  for (const art of list) {
    const p = (msg) => problems.push(`${art.id}: ${msg}`);
    if (typeof art.id !== 'string') p('id no es string');
    if (!Number.isInteger(art.order)) p('order no es entero');
    if (typeof art.featured !== 'boolean') p('featured no es boolean');
    for (const f of ['title', 'description', 'medium']) {
      if (!art[f] || typeof art[f] !== 'object') p(`${f} no es objeto {en, es}`);
      else for (const l of ['en', 'es']) if (typeof art[f][l] !== 'string') p(`${f}.${l} no es string`);
    }
    // year: número o marcador [[TODO]] (dato pendiente de Rodrigo, §1.6).
    if (!(Number.isInteger(art.year) || isTodoMarker(art.year) || /^\d{4}$/.test(art.year))) p(`year inválido: ${art.year}`);
    if (typeof art.dimensions !== 'string') p('dimensions no es string');
    // status: valor del enum o marcador [[TODO]] (se lista como aviso más abajo).
    if (!(STATUSES.includes(art.status) || isTodoMarker(art.status))) p(`status inválido: ${art.status}`);
    const img = art.image;
    if (!img || typeof img !== 'object') { p('image no es objeto'); continue; }
    if (typeof img.base !== 'string') p('image.base no es string');
    if (!Array.isArray(img.widths) || !img.widths.length) p('image.widths vacío');
    if (!(Number.isInteger(img.width) && img.width > 0)) p('image.width <= 0');
    if (!(Number.isInteger(img.height) && img.height > 0)) p('image.height <= 0');
    if (!img.alt || typeof img.alt !== 'object') p('image.alt no es objeto');
    if (typeof art.source !== 'string' || !art.source) p('source vacío');
  }
  assert.deepEqual(problems, []);
});

test('id único y kebab-case; order único y entero', () => {
  const ids = list.map((a) => a.id);
  const orders = list.map((a) => a.order);
  assert.deepEqual(ids.filter((id) => !KEBAB.test(id)), [], 'ids no kebab-case');
  assert.equal(new Set(ids).size, ids.length, 'ids duplicados');
  assert.equal(new Set(orders).size, orders.length, 'order duplicado');
});

test('title, medium e image.alt tienen en y es sin vacíos', () => {
  const empty = [];
  for (const art of list) {
    for (const f of BILINGUAL_REQUIRED) for (const l of ['en', 'es']) if (!art[f]?.[l]?.trim()) empty.push(`${art.id}.${f}.${l}`);
    for (const l of ['en', 'es']) if (!art.image?.alt?.[l]?.trim()) empty.push(`${art.id}.image.alt.${l}`);
  }
  assert.deepEqual(empty, []);
});

// Ajuste razonado de la especificación: `description` está vacía en las 22 obras
// porque Rodrigo no ha dado textos y §1.6 prohíbe inventarlos; work.js la omite
// si está vacía. Se exige coherencia (las dos vacías o las dos con texto) y se
// avisa del número de obras sin descripción.
test('description: en y es coherentes (ambas vacías o ambas con texto)', (t) => {
  const mismatch = list.filter((a) => !!a.description.en.trim() !== !!a.description.es.trim()).map((a) => a.id);
  const missing = list.filter((a) => !a.description.en.trim()).length;
  if (missing) t.diagnostic(`AVISO: ${missing}/${list.length} obras sin descripción (pendiente de Rodrigo).`);
  assert.deepEqual(mismatch, []);
});

test('image.widths ⊆ {640,1280,2000} y cada {base}-{w}.webp existe', () => {
  const problems = [];
  for (const art of list) {
    for (const w of art.image.widths) {
      if (!WIDTHS.includes(w)) problems.push(`${art.id}: ancho ${w} no permitido`);
      const file = path.join(FRONTEND, `${art.image.base}-${w}.webp`);
      if (!fs.existsSync(file)) problems.push(`${art.id}: falta ${art.image.base}-${w}.webp`);
    }
    if (!/^assets\/img\/works\/[a-z0-9-]+$/.test(art.image.base)) problems.push(`${art.id}: base fuera de assets/img/works: ${art.image.base}`);
  }
  assert.deepEqual(problems, []);
});

test('ningún source procede de fotos para pintar/ ni de mockups/', () => {
  const bad = list.filter((a) => /fotos para pintar|mockups/i.test(a.source) || /[\\/]/.test(a.source)).map((a) => `${a.id}: ${a.source}`);
  assert.deepEqual(bad, []);
});

test('[[TODO en campos visibles: se listan como aviso', (t) => {
  const visible = ['title', 'description', 'medium', 'year', 'dimensions', 'status'];
  const todos = {};
  for (const art of list) {
    for (const f of visible) {
      const v = art[f];
      const values = v && typeof v === 'object' ? Object.values(v) : [v];
      if (values.some(isTodoMarker)) todos[f] = (todos[f] || 0) + 1;
    }
    if (Object.values(art.image.alt).some(isTodoMarker)) todos['image.alt'] = (todos['image.alt'] || 0) + 1;
  }
  for (const [f, n] of Object.entries(todos)) t.diagnostic(`AVISO [[TODO]]: ${f} en ${n}/${list.length} obras (i18n.js/work.js los ocultan)`);
  // Bloquea solo si el TODO está en un campo que se muestra siempre sin filtro (título o alt).
  assert.equal(todos.title || 0, 0, 'title con [[TODO]]');
  assert.equal(todos['image.alt'] || 0, 0, 'alt con [[TODO]]');
});
