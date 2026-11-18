// Carga una página de frontend/ en jsdom y ejecuta sus scripts del navegador
// (IIFE que exponen window.I18n, window.Artworks…) sin servidor.
// - runScripts: 'outside-only' → los <script> del HTML NO se ejecutan; se
//   evalúan a mano, en orden, los que se pidan.
// - fetch simulado: lee de frontend/ (o de `routes`, para forzar errores).
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { FRONTEND } from './paths.mjs';

export const ORIGIN = 'http://localhost';

function makeResponse(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k) => headers[k.toLowerCase()] ?? null },
    json: async () => JSON.parse(body),
    text: async () => body
  };
}

/**
 * @param {string} page  p. ej. 'index.html'
 * @param {object} opts
 *   search: '?id=…&lang=es'
 *   scripts: ['i18n.js', 'nav.js', …] (de assets/js/)
 *   navigatorLanguage: 'es-ES'
 *   storage: { lang: 'es' }  → localStorage previo
 *   storageThrows: true       → localStorage lanza (modo privado)
 *   routes: { 'data/artworks.json': (req) => ({ status, body }) | Promise.reject(...) }
 */
export async function loadPage(page, opts = {}) {
  const html = fs.readFileSync(path.join(FRONTEND, page), 'utf8');
  const errors = [];
  const logs = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (e) => errors.push(e));
  for (const level of ['error', 'warn', 'log', 'info']) {
    virtualConsole.on(level, (...args) => logs.push({ level, args }));
  }

  const dom = new JSDOM(html, {
    url: ORIGIN + '/' + page + (opts.search || ''),
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole
  });
  const { window } = dom;
  const calls = [];

  if (opts.navigatorLanguage !== undefined) {
    Object.defineProperty(window.navigator, 'language', { get: () => opts.navigatorLanguage, configurable: true });
  }
  if (opts.storage) {
    for (const [k, v] of Object.entries(opts.storage)) window.localStorage.setItem(k, v);
  }
  if (opts.storageThrows) {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new window.DOMException('blocked', 'SecurityError'); },
      configurable: true
    });
  }

  window.fetch = async (input, init = {}) => {
    const url = new URL(input && typeof input === 'object' && 'url' in input ? input.url : String(input), window.location.href);
    const rel = url.pathname.replace(/^\//, '');
    const call = { url: url.href, rel, method: (init.method || 'GET').toUpperCase(), headers: init.headers || {}, body: init.body };
    calls.push(call);
    const route = opts.routes && (opts.routes[rel] ?? opts.routes[url.pathname]);
    if (route) {
      const res = await route(call);
      return makeResponse(res.status ?? 200, res.body ?? '', res.headers);
    }
    const file = path.join(FRONTEND, rel);
    if (call.method === 'GET' && rel && fs.existsSync(file) && fs.statSync(file).isFile()) {
      return makeResponse(200, fs.readFileSync(file, 'utf8'));
    }
    return makeResponse(404, 'Not found');
  };

  polyfillImageAttrs(window);
  if (opts.before) opts.before(window);

  for (const name of opts.scripts || []) {
    const src = fs.readFileSync(path.join(FRONTEND, 'assets/js', name), 'utf8');
    window.eval(src + `\n//# sourceURL=${name}`);
  }

  if (window.I18n) await window.I18n.ready;
  await settle(window);
  return { dom, window, document: window.document, calls, errors, logs };
}

/** Deja correr promesas y macrotareas pendientes. */
export async function settle(window, rounds = 5) {
  for (let i = 0; i < rounds; i++) {
    await new Promise((r) => window.setTimeout(r, 0));
  }
}

/**
 * jsdom no implementa img.loading / img.decoding (quedan como propiedades sueltas,
 * sin atributo). Se añaden como atributos reflejados, igual que en un navegador.
 */
export function polyfillImageAttrs(window) {
  const proto = window.HTMLImageElement.prototype;
  for (const prop of ['loading', 'decoding', 'fetchPriority']) {
    if (Object.getOwnPropertyDescriptor(proto, prop)) continue;
    const attr = prop.toLowerCase();
    Object.defineProperty(proto, prop, {
      configurable: true,
      get() { return this.getAttribute(attr) || ''; },
      set(v) { this.setAttribute(attr, v); }
    });
  }
}
