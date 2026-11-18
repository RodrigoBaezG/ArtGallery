// §12.2 CSS: fuera de tokens.css no hay colores, tamaños ni tiempos sueltos.
//
// Lista blanca (justificada):
// - Valores dentro de @media / @container: las custom properties no se pueden
//   usar en media queries, así que los breakpoints (40em, 60em…) van en literal.
// - `1px` y `-1px`: patrón estándar de .visually-hidden (clip a 1×1 px). No es
//   un valor de diseño; los bordes de 1 px sí deben venir de tokens.
// - `0s` / `0ms` / `0`: ausencia de duración (p. ej. visibility 0s linear …).
// - Valores sin unidad (line-height, z-index, flex, opacity 0/1…).
// - Custom properties locales de componente (--container-gutter: var(--gutter-sm),
//   --w/--h por defecto): se permiten; su valor se revisa igual que cualquier otro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { FRONTEND, walk } from '../helpers/paths.mjs';

const CSS_DIR = path.join(FRONTEND, 'assets/css');
const files = walk(CSS_DIR).filter((f) => f.endsWith('.css') && path.basename(f) !== 'tokens.css');

function strip(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

test('existe tokens.css y define custom properties', () => {
  const tokens = fs.readFileSync(path.join(CSS_DIR, 'tokens.css'), 'utf8');
  assert.ok((tokens.match(/--[\w-]+\s*:/g) || []).length > 20);
});

test('sin colores, tamaños ni tiempos sueltos fuera de tokens.css', () => {
  const findings = [];
  for (const file of files) {
    const lines = strip(fs.readFileSync(file, 'utf8')).split('\n');
    lines.forEach((line, i) => {
      const where = `${path.relative(CSS_DIR, file)}:${i + 1}`;
      if (/^\s*@(media|container|supports)\b/.test(line)) return; // breakpoints
      const decl = line.includes(':') ? line.slice(line.indexOf(':') + 1) : line;
      for (const m of decl.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) findings.push(`${where} color ${m[0]}`);
      for (const m of decl.matchAll(/\b(rgba?|hsla?|hwb|lab|lch|oklch|oklab|color-mix)\(/g)) findings.push(`${where} color ${m[0]}`);
      for (const m of decl.matchAll(/(-?\d*\.?\d+)(px|rem|em|vw|vh|ch|pt)\b/g)) {
        if (m[2] === 'px' && Math.abs(parseFloat(m[1])) === 1) continue; // .visually-hidden
        if (parseFloat(m[1]) === 0) continue;
        findings.push(`${where} tamaño ${m[0]}`);
      }
      for (const m of decl.matchAll(/(?<![\w-])(\d*\.?\d+)(ms|s)\b/g)) {
        if (parseFloat(m[1]) === 0) continue;
        findings.push(`${where} tiempo ${m[0]}`);
      }
    });
  }
  assert.deepEqual(findings, []);
});
