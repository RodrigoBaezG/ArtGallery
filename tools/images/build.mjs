// Pipeline de imágenes del portfolio.
// Lee manifest.json, genera derivados WebP ({id}-{w}.webp, lado largo = w px),
// el og-{cover}.jpg 1200x630 y actualiza los campos técnicos de frontend/data/artworks.json
// (id, category, order, featured, image.base/widths/width/height, source). Nunca toca los campos
// de texto de las obras existentes; las nuevas reciben marcadores [[TODO]].
//
// Categorías: 'works' del nivel superior pertenece a manifest.category (watercolor) con origen
// manifest.sourceDir; cada entrada de manifest.collections aporta otra categoría con su propio
// sourceDir y su lista works. 'order' se numera 1..n dentro de cada categoría.
//
// Uso (desde la raíz):  node tools/images/build.mjs [--force]
// Idempotente: si los derivados ya existen, son más recientes que el original y su entrada del
// manifest no ha cambiado, no se regeneran (usa --force para rehacerlos).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const MANIFEST = path.join(HERE, 'manifest.json');
const WORKS_DIR = path.join(ROOT, 'frontend', 'assets', 'img', 'works');
const SITE_DIR = path.join(ROOT, 'frontend', 'assets', 'img', 'site');
const DATA_FILE = path.join(ROOT, 'frontend', 'data', 'artworks.json');
const FORCE = process.argv.includes('--force');
const TODO = '[[TODO]]';
const OG_W = 1200, OG_H = 630;

sharp.cache(false);

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const { widths, quality, cover } = manifest;
const maxW = Math.max(...widths);
const CATEGORIES = ['watercolor', 'drawing'];

// Grupos por categoría (el primero es el del nivel superior del manifest).
const groups = [
  { category: manifest.category || 'watercolor', sourceDir: manifest.sourceDir, works: manifest.works || [] },
  ...(manifest.collections || []),
];
const seenCats = new Set();
for (const g of groups) {
  if (!CATEGORIES.includes(g.category)) throw new Error(`categoría no válida: ${g.category}`);
  if (seenCats.has(g.category)) throw new Error(`categoría repetida en el manifest: ${g.category}`);
  seenCats.add(g.category);
  if (!g.sourceDir || !Array.isArray(g.works)) throw new Error(`grupo ${g.category} sin sourceDir o works`);
}
// Lista plana: cada obra con su carpeta de origen, su categoría y su orden dentro de la categoría.
const works = groups.flatMap((g) => g.works.map((w, i) => ({ w, dir: g.sourceDir, category: g.category, order: i + 1 })));

// ---------- validación ----------
const ids = new Set();
for (const { w, dir } of works) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(w.id)) throw new Error(`id no válido (kebab-case): ${w.id}`);
  if (ids.has(w.id)) throw new Error(`id duplicado: ${w.id}`);
  ids.add(w.id);
  const src = path.join(dir, w.source);
  if (path.dirname(path.resolve(src)) !== path.resolve(dir)) {
    throw new Error(`Solo se admiten archivos del nivel superior de sourceDir: ${w.source}`);
  }
  if (!fs.existsSync(src)) throw new Error(`No existe el original: ${src}`);
}
if (cover && !ids.has(cover)) throw new Error(`cover "${cover}" no está en works`);

fs.mkdirSync(WORKS_DIR, { recursive: true });
fs.mkdirSync(SITE_DIR, { recursive: true });
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

const mtime = (p) => (fs.existsSync(p) ? fs.statSync(p).mtimeMs : 0);

// Frescura por entrada: cada derivado se regenera si falta, si el original es más reciente,
// o si cambia la parte del manifest que le afecta (firma guardada en node_modules/.cache,
// ignorado por git). Así editar una entrada del manifest no reprocesa todas las demás.
// Sin caché (clon nuevo), se aceptan los derivados existentes más recientes que su original.
const CACHE_FILE = path.join(HERE, 'node_modules', '.cache', 'artgallery-images.json');
const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
const sig = (obj) => JSON.stringify(obj);
function isFresh(key, signature, outs, src) {
  if (FORCE) return false;
  if (!outs.every((o) => mtime(o) > mtime(src))) return false;
  if (key in cache) return cache[key] === signature;
  cache[key] = signature; // primera ejecución con caché: se adopta el estado actual
  return true;
}

/** Pipeline base: orientación EXIF aplicada, recorte opcional, sRGB. Sin metadatos en la salida. */
function basePipeline(w, dir) {
  let img = sharp(path.join(dir, w.source), { limitInputPixels: false }).rotate();
  if (w.crop) img = img.extract(w.crop);
  return img.toColourspace('srgb');
}

const results = new Map();

for (const { w, dir } of works) {
  const src = path.join(dir, w.source);
  const outs = widths.map((n) => path.join(WORKS_DIR, `${w.id}-${n}.webp`));
  const key = `work:${w.id}`, signature = sig({ w, widths, quality });
  const fresh = isFresh(key, signature, outs, src);
  cache[key] = signature;

  if (fresh) {
    const meta = await sharp(outs[outs.length - 1]).metadata();
    results.set(w.id, { width: meta.width, height: meta.height });
    console.log(`= ${w.id} (sin cambios)`);
    continue;
  }

  // Un único decode del original: se reduce a lado largo = maxW y de ahí salen los demás anchos.
  const { data, info } = await basePipeline(w, dir)
    .resize(maxW, maxW, { fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const raw = { raw: { width: info.width, height: info.height, channels: info.channels } };
  if (Math.max(info.width, info.height) < maxW) {
    console.warn(`! ${w.id}: el original es menor que ${maxW}px (${info.width}x${info.height})`);
  }

  for (const [i, n] of widths.entries()) {
    await sharp(data, raw)
      .resize(n, n, { fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
      .webp({ quality, effort: 5, smartSubsample: true })
      .toFile(outs[i]); // sharp no escribe EXIF/ICC/XMP salvo que se pida con withMetadata()
  }
  results.set(w.id, { width: info.width, height: info.height });
  console.log(`+ ${w.id}  ${info.width}x${info.height}  <- ${w.source}${w.crop ? '  [crop]' : ''}`);
}

// ---------- og:image de la portada ----------
if (cover) {
  const { w, dir } = works.find((x) => x.w.id === cover);
  const ogPath = path.join(SITE_DIR, `og-${cover}.jpg`);
  const src = path.join(dir, w.source);
  const key = 'og', signature = sig({ w, OG_W, OG_H });
  const ogFresh = isFresh(key, signature, [ogPath], src);
  cache[key] = signature;
  if (!ogFresh) {
    // Banda horizontal 1200:630 a todo el ancho, centrada en ogFocusY (por defecto 0.5).
    const { data, info } = await basePipeline(w, dir)
      .resize(2400, 2400, { fit: 'inside', withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const ratio = OG_W / OG_H;
    let bw = info.width, bh = Math.round(bw / ratio);
    if (bh > info.height) { bh = info.height; bw = Math.round(bh * ratio); }
    const fy = typeof w.ogFocusY === 'number' ? w.ogFocusY : 0.5;
    const top = Math.min(Math.max(Math.round(fy * info.height - bh / 2), 0), info.height - bh);
    const left = Math.round((info.width - bw) / 2);
    await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
      .extract({ left, top, width: bw, height: bh })
      .resize(OG_W, OG_H)
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toFile(ogPath);
    console.log(`+ og-${cover}.jpg`);
  } else {
    console.log(`= og-${cover}.jpg (sin cambios)`);
  }
}

// ---------- imágenes del sitio (retrato, banner...): sin recorte ni ampliación ----------
// Cada entrada: { out: "x.webp" } -> tamaño nativo, o { base: "x", widths: [..] } -> x-{w}.webp
// (ancho = w, alto proporcional; nunca se amplía por encima del original).
// 'source' puede ser absoluta o relativa a tools/images/.
const siteOuts = new Set();
for (const s of manifest.site || []) {
  const srcPath = path.resolve(HERE, s.source);
  if (!fs.existsSync(srcPath)) throw new Error(`No existe el original: ${srcPath}`);
  let targets;
  if (s.widths) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.base || '')) throw new Error(`site.base no válido: ${s.base}`);
    targets = s.widths.map((n) => ({ file: `${s.base}-${n}.webp`, width: n }));
  } else {
    if (!/^[a-z0-9-]+\.webp$/.test(s.out)) throw new Error(`site.out no válido: ${s.out}`);
    targets = [{ file: s.out, width: null }];
  }
  for (const t of targets) {
    siteOuts.add(t.file);
    const outPath = path.join(SITE_DIR, t.file);
    const key = `site:${t.file}`, signature = sig({ s, t, quality });
    const siteFresh = isFresh(key, signature, [outPath], srcPath);
    cache[key] = signature;
    if (siteFresh) {
      console.log(`= site/${t.file} (sin cambios)`);
      continue;
    }
    let img = sharp(srcPath, { limitInputPixels: false }).rotate().toColourspace('srgb');
    if (s.removeAlpha) img = img.removeAlpha(); // solo si el alfa es 100 % opaco (ver manifest)
    if (t.width) img = img.resize({ width: t.width, withoutEnlargement: true, kernel: 'lanczos3' });
    await img
      .webp({ quality: s.quality ?? quality, effort: 5, smartSubsample: true })
      .toFile(outPath); // sin withMetadata(): no se copian EXIF/XMP/ICC
    const m = await sharp(outPath).metadata();
    if (t.width && m.width !== t.width) console.warn(`! site/${t.file}: el original es menor que ${t.width}px (${m.width}x${m.height})`);
    console.log(`+ site/${t.file}  ${m.width}x${m.height}`);
  }
}

// ---------- artworks.json ----------
const existing = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : [];
const byId = new Map(existing.map((e) => [e.id, e]));
const bilingual = () => ({ en: TODO, es: TODO });
// Marcadores para obras nuevas (los rellena content-writer); los mismos que ya usa el catálogo.
const todoTitle = () => ({ en: '[[TODO: title]]', es: '[[TODO: título]]' });
const todoAlt = () => ({ en: '[[TODO: alt text]]', es: '[[TODO: texto alternativo]]' });
const emptyText = () => ({ en: '', es: '' });

const out = works.map(({ w, category, order }) => {
  const prev = byId.get(w.id) || {};
  const prevImg = prev.image || {};
  const { width, height } = results.get(w.id);
  // Orden de claves según CLAUDE.md §3; los campos de texto se conservan si ya existen.
  return {
    id: w.id,
    category,
    order,
    featured: !!w.featured,
    title: prev.title ?? todoTitle(),
    description: prev.description ?? emptyText(),
    year: prev.year ?? TODO,
    dimensions: prev.dimensions ?? TODO,
    medium: prev.medium ?? bilingual(),
    status: prev.status ?? TODO,
    image: {
      base: `assets/img/works/${w.id}`,
      widths: [...widths],
      width,
      height,
      alt: prevImg.alt ?? todoAlt(),
    },
    source: w.source,
  };
});

const dropped = existing.filter((e) => !ids.has(e.id)).map((e) => e.id);
if (dropped.length) console.warn(`! Entradas eliminadas de artworks.json (ya no están en el manifest): ${dropped.join(', ')}`);
fs.writeFileSync(DATA_FILE, JSON.stringify(out, null, 2) + '\n');

// ---------- limpieza de derivados huérfanos ----------
const wanted = new Set(works.flatMap(({ w }) => widths.map((n) => `${w.id}-${n}.webp`)));
for (const f of fs.readdirSync(WORKS_DIR)) {
  if (f.endsWith('.webp') && !wanted.has(f)) {
    fs.unlinkSync(path.join(WORKS_DIR, f));
    console.log(`- ${f} (huérfano)`);
  }
}
for (const f of fs.readdirSync(SITE_DIR)) {
  if (/^og-.+\.jpg$/.test(f) && f !== `og-${cover}.jpg`) {
    fs.unlinkSync(path.join(SITE_DIR, f));
    console.log(`- site/${f} (huérfano)`);
  }
}

fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + '\n');

console.log(`\nOK: ${works.length} obras -> ${path.relative(ROOT, DATA_FILE)}`);
