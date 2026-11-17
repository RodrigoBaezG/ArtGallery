// Pipeline de imágenes del portfolio.
// Lee manifest.json, genera derivados WebP ({id}-{w}.webp, lado largo = w px),
// el og-{cover}.jpg 1200x630 y actualiza los campos técnicos de frontend/data/artworks.json
// (id, order, featured, image.base/widths/width/height, source). Nunca toca los campos de texto.
//
// Uso (desde la raíz):  node tools/images/build.mjs [--force]
// Idempotente: si los derivados ya existen y son más recientes que el original y el manifest,
// no se regeneran (usa --force para rehacerlos).

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
const { sourceDir, widths, quality, cover, works } = manifest;
const maxW = Math.max(...widths);

// ---------- validación ----------
const ids = new Set();
for (const w of works) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(w.id)) throw new Error(`id no válido (kebab-case): ${w.id}`);
  if (ids.has(w.id)) throw new Error(`id duplicado: ${w.id}`);
  ids.add(w.id);
  const src = path.join(sourceDir, w.source);
  if (path.dirname(path.resolve(src)) !== path.resolve(sourceDir)) {
    throw new Error(`Solo se admiten archivos del nivel superior de sourceDir: ${w.source}`);
  }
  if (!fs.existsSync(src)) throw new Error(`No existe el original: ${src}`);
}
if (cover && !ids.has(cover)) throw new Error(`cover "${cover}" no está en works`);

fs.mkdirSync(WORKS_DIR, { recursive: true });
fs.mkdirSync(SITE_DIR, { recursive: true });
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

const mtime = (p) => (fs.existsSync(p) ? fs.statSync(p).mtimeMs : 0);
const manifestTime = mtime(MANIFEST);

/** Pipeline base: orientación EXIF aplicada, recorte opcional, sRGB. Sin metadatos en la salida. */
function basePipeline(w) {
  let img = sharp(path.join(sourceDir, w.source), { limitInputPixels: false }).rotate();
  if (w.crop) img = img.extract(w.crop);
  return img.toColourspace('srgb');
}

const results = new Map();

for (const w of works) {
  const src = path.join(sourceDir, w.source);
  const outs = widths.map((n) => path.join(WORKS_DIR, `${w.id}-${n}.webp`));
  const fresh = !FORCE && outs.every((o) => mtime(o) > Math.max(mtime(src), manifestTime));

  if (fresh) {
    const meta = await sharp(outs[outs.length - 1]).metadata();
    results.set(w.id, { width: meta.width, height: meta.height });
    console.log(`= ${w.id} (sin cambios)`);
    continue;
  }

  // Un único decode del original: se reduce a lado largo = maxW y de ahí salen los demás anchos.
  const { data, info } = await basePipeline(w)
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
  const w = works.find((x) => x.id === cover);
  const ogPath = path.join(SITE_DIR, `og-${cover}.jpg`);
  const src = path.join(sourceDir, w.source);
  if (FORCE || mtime(ogPath) <= Math.max(mtime(src), manifestTime)) {
    // Banda horizontal 1200:630 a todo el ancho, centrada en ogFocusY (por defecto 0.5).
    const { data, info } = await basePipeline(w)
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

// ---------- artworks.json ----------
const existing = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : [];
const byId = new Map(existing.map((e) => [e.id, e]));
const bilingual = () => ({ en: TODO, es: TODO });

const out = works.map((w, i) => {
  const prev = byId.get(w.id) || {};
  const prevImg = prev.image || {};
  const { width, height } = results.get(w.id);
  // Orden de claves según CLAUDE.md §3; los campos de texto se conservan si ya existen.
  return {
    id: w.id,
    order: i + 1,
    featured: !!w.featured,
    title: prev.title ?? bilingual(),
    description: prev.description ?? bilingual(),
    year: prev.year ?? TODO,
    dimensions: prev.dimensions ?? TODO,
    medium: prev.medium ?? bilingual(),
    status: prev.status ?? TODO,
    image: {
      base: `assets/img/works/${w.id}`,
      widths: [...widths],
      width,
      height,
      alt: prevImg.alt ?? bilingual(),
    },
    source: w.source,
  };
});

const dropped = existing.filter((e) => !ids.has(e.id)).map((e) => e.id);
if (dropped.length) console.warn(`! Entradas eliminadas de artworks.json (ya no están en el manifest): ${dropped.join(', ')}`);
fs.writeFileSync(DATA_FILE, JSON.stringify(out, null, 2) + '\n');

// ---------- limpieza de derivados huérfanos ----------
const wanted = new Set(works.flatMap((w) => widths.map((n) => `${w.id}-${n}.webp`)));
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

console.log(`\nOK: ${works.length} obras -> ${path.relative(ROOT, DATA_FILE)}`);
