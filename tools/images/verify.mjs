// Verifica que ningún derivado publicado contiene metadatos EXIF/XMP (y por tanto GPS).
// Uso (desde la raíz): node tools/images/verify.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dirs = ['frontend/assets/img/works', 'frontend/assets/img/site'].map((d) => path.join(ROOT, d));

/** Lista los chunks RIFF de un WebP (EXIF, XMP , ICCP...). */
function webpChunks(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') throw new Error('no es WebP');
  const chunks = [];
  for (let o = 12; o + 8 <= buf.length; ) {
    const id = buf.toString('ascii', o, o + 4);
    const size = buf.readUInt32LE(o + 4);
    chunks.push(id);
    o += 8 + size + (size & 1);
  }
  return chunks;
}

/** Lista los marcadores APPn de un JPEG con su firma (Exif, http://ns.adobe.com/xap..., ICC_PROFILE). */
function jpegSegments(buf) {
  const segs = [];
  for (let o = 2; o + 4 <= buf.length; ) {
    if (buf[o] !== 0xff) break;
    const marker = buf[o + 1];
    if (marker === 0xda) break; // inicio de datos de imagen
    const len = buf.readUInt16BE(o + 2);
    if (marker >= 0xe0 && marker <= 0xef) segs.push(`APP${marker - 0xe0}:${buf.toString('latin1', o + 4, o + 4 + 12).replace(/\0.*$/s, '')}`);
    o += 2 + len;
  }
  return segs;
}

let files = 0, bad = 0;
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const buf = fs.readFileSync(p);
    let problems = [];
    if (f.endsWith('.webp')) {
      const chunks = webpChunks(buf);
      problems = chunks.filter((c) => c === 'EXIF' || c === 'XMP ');
    } else if (/\.jpe?g$/i.test(f)) {
      problems = jpegSegments(buf).filter((s) => /Exif|xap|xmp/i.test(s));
    } else continue;
    const meta = await sharp(buf).metadata();
    if (meta.exif) problems.push('sharp:exif');
    if (meta.xmp) problems.push('sharp:xmp');
    // El GPS solo puede viajar dentro de EXIF/XMP: sin esos bloques no hay GPS.
    files++;
    if (problems.length) { bad++; console.log(`FALLO ${path.relative(ROOT, p)}: ${problems.join(', ')}`); }
  }
}
console.log(`${files} archivos revisados, ${bad} con metadatos.`);
process.exit(bad ? 1 : 0);
