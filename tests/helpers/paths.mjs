// Rutas y lectura de datos compartidas por todos los tests.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const TESTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = path.resolve(TESTS, '..');
export const FRONTEND = path.join(ROOT, 'frontend');

/** Origen de las acuarelas (fuera del repo). Solo se listan nombres, nunca se lee contenido. */
export const SOURCE_DIR = 'C:/Users/Kbaez/Desktop/etsy/Tecnicas/Acuarela';

export const PAGES = ['index.html', 'work.html', 'about.html', 'commissions.html', 'contact.html', '404.html'];

export function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

export function readJSON(rel) {
  return JSON.parse(readText(rel));
}

export const artworks = () => readJSON('frontend/data/artworks.json');
export const dict = (lang) => readJSON(`frontend/i18n/${lang}.json`);

/** Lista recursiva de archivos (rutas absolutas). */
export function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Aplana un diccionario anidado → { 'a.b.c': valor }. */
export function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

/** Orden de la galería: featured primero, luego order. */
export function sorted(list) {
  return list.slice().sort((a, b) => {
    if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
    return (a.order || 0) - (b.order || 0);
  });
}

export const isTodoMarker = (v) => typeof v === 'string' && /\[\[TODO/.test(v);

/* ---- Categorías (CLAUDE.md §3, 2026-11-19) -------------------------------- */
export const CATEGORIES = ['watercolor', 'drawing'];
export const DEFAULT_CATEGORY = 'watercolor';

/** Obras de una categoría en el orden de la galería (featured → order). */
export const inCategory = (list, category) => sorted(list.filter((a) => a.category === category));

/** Categoría que debe mostrar la home para un valor de ?category (inválido → watercolor). */
export const resolveCategory = (value) => (CATEGORIES.includes(value) ? value : DEFAULT_CATEGORY);
