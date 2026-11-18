// Cabeceras exigidas por CLAUDE.md §12.4 y utilidades para netlify.toml.
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseToml } from 'smol-toml';
import { ROOT } from './paths.mjs';

export const CSP = "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests";

export const REQUIRED_HEADERS = {
  'Content-Security-Policy': CSP,
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin'
};

/** CSP → { directiva: 'fuentes ordenadas' } para comparar sin depender del orden. */
export function cspMap(value) {
  return Object.fromEntries(String(value).split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
    const [name, ...src] = d.split(/\s+/);
    return [name.toLowerCase(), src.sort().join(' ')];
  }));
}

export function readNetlifyToml() {
  return parseToml(fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8'));
}

const escapeRe = (s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

/** Patrón de Netlify (`/*`, `/assets/img/*`, `/*.html`) → RegExp. */
const toRegex = (pattern) => new RegExp('^' + pattern.split('*').map(escapeRe).join('.*') + '$');

/** Cabeceras que Netlify aplicaría a una ruta (las reglas se acumulan en orden). */
export function headersFor(pathname, toml) {
  const out = {};
  for (const rule of toml.headers || []) {
    if (toRegex(rule.for).test(pathname)) Object.assign(out, rule.values);
  }
  return out;
}
