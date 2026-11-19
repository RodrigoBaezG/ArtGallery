// §12.4 Privacidad y fuga de datos, secretos, terceros y dependencias.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import { FRONTEND, PAGES, ROOT, SOURCE_DIR, TESTS, artworks, readJSON, readText, walk } from '../helpers/paths.mjs';

const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
const SITE_HOST = 'kukobaezgallery.netlify.app';
const THIRD_PARTY_OK = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';

/* ---- EXIF / GPS ------------------------------------------------------------ */
test('npm run verify (tools/images): 0 imágenes con EXIF/GPS, incluidos portrait y og:image', (t) => {
  const dir = path.join(ROOT, 'tools/images');
  if (!fs.existsSync(path.join(dir, 'node_modules', 'sharp'))) {
    t.skip('AVISO: tools/images sin node_modules (cd tools/images && npm install)');
    return;
  }
  const r = spawnSync(npm, ['run', 'verify', '--silent'], { cwd: dir, encoding: 'utf8', shell: isWin });
  const out = (r.stdout || '') + (r.stderr || '');
  t.diagnostic(out.trim().split('\n').pop());
  assert.equal(r.status, 0, out);
  const m = out.match(/(\d+) archivos revisados, (\d+) con metadatos/);
  assert.ok(m, 'salida de verify inesperada');
  const expected = walk(path.join(FRONTEND, 'assets/img')).filter((f) => /\.(webp|jpe?g)$/i.test(f)).length;
  assert.equal(Number(m[1]), expected, 'verify no revisó todas las imágenes');
  assert.equal(Number(m[2]), 0);
  assert.ok(fs.existsSync(path.join(FRONTEND, 'assets/img/site/portrait.webp')));
});

/* ---- Archivos sensibles en frontend/ -------------------------------------- */
test('frontend/ no contiene .env, .git, *.map, originales, manifest.json ni rutas locales', () => {
  const bad = [];
  for (const f of walk(FRONTEND)) {
    const r = rel(f);
    const base = path.basename(f).toLowerCase();
    if (/(^|\/)\.git(\/|$)/.test(r) || base.startsWith('.env')) bad.push(`${r}: sensible`);
    if (/\.(map|psd|psb|tif|tiff|raw|cr2|nef|dng|heic|kra|xcf|ai)$/i.test(base)) bad.push(`${r}: fuente/original`);
    if (base === 'manifest.json' || base === 'package.json' || base === 'package-lock.json') bad.push(`${r}: manifest/paquete`);
    if (/\.(jpe?g|png)$/i.test(base) && fs.statSync(f).size > 1.5 * 1024 * 1024) bad.push(`${r}: imagen > 1,5 MB (¿original?)`);
    if (/\.(html|js|json|css|txt|xml|svg|toml)$/i.test(base)) {
      const src = fs.readFileSync(f, 'utf8');
      if (/[A-Za-z]:[\\/]+Users[\\/]|\/Users\/[A-Za-z]|\/home\/[a-z]|file:\/\//.test(src)) bad.push(`${r}: ruta absoluta local`);
    }
  }
  assert.deepEqual(bad, []);
});

/* ---- fotos para pintar/ y mockups/ ---------------------------------------- */
test('ningún archivo de fotos para pintar/ ni mockups/ llega a frontend/ ni al catálogo', (t) => {
  const dirs = ['fotos para pintar', 'mockups'].map((d) => path.join(SOURCE_DIR, d)).filter((d) => fs.existsSync(d));
  if (!dirs.length) { t.skip('carpeta de origen no disponible en esta máquina'); return; }
  const stem = (n) => path.basename(n).toLowerCase().replace(/\.[^.]+$/, '');
  // Solo nombres (readdirSync), nunca contenido.
  const excluded = new Map();
  for (const d of dirs) for (const n of fs.readdirSync(d)) excluded.set(stem(n), path.basename(d));
  t.diagnostic(`${excluded.size} nombres excluidos comparados (sin leer su contenido)`);

  const manifest = readJSON('tools/images/manifest.json');
  const sources = [
    ...artworks().map((a) => a.source),
    ...(manifest.works || []).map((w) => w.source),
    ...(manifest.site || []).map((s) => s.source)
  ].filter(Boolean);
  const hits = [];
  for (const s of sources) {
    if (/fotos para pintar|mockups/i.test(s)) hits.push(`source con carpeta excluida: ${path.basename(s)}`);
    if (excluded.has(stem(s))) hits.push(`source coincide con ${excluded.get(stem(s))}/: ${path.basename(s)}`);
  }
  for (const f of walk(FRONTEND)) {
    const s = stem(f).replace(/-(640|1280|2000)$/, '');
    if (excluded.has(stem(f)) || excluded.has(s)) hits.push(`frontend contiene ${rel(f)} (coincide con ${excluded.get(s) || excluded.get(stem(f))}/)`);
  }
  assert.deepEqual(hits, []);
});

/* ---- Enlaces externos y terceros ------------------------------------------ */
function allDocs() {
  return PAGES.map((p) => [p, new JSDOM(readText(`frontend/${p}`)).window.document]);
}

test('enlaces externos con rel="noopener" (y noreferrer si target=_blank)', () => {
  const bad = [];
  for (const [page, doc] of allDocs()) {
    for (const a of doc.querySelectorAll('a[href^="http"]')) {
      const host = new URL(a.href).host;
      if (host === SITE_HOST) continue;
      const rels = (a.getAttribute('rel') || '').split(/\s+/);
      if (!rels.includes('noopener')) bad.push(`${page}: ${a.href} sin noopener`);
      if (a.getAttribute('target') === '_blank' && !rels.includes('noreferrer')) bad.push(`${page}: ${a.href} _blank sin noreferrer`);
    }
  }
  assert.deepEqual(bad, []);
});

test('ningún recurso de terceros fuera de Google Fonts; sin trackers', () => {
  const bad = [];
  const check = (where, url) => {
    if (!/^https?:\/\//.test(url) && !url.startsWith('//')) return;
    const host = new URL(url, 'https://x/').host;
    if (host !== SITE_HOST && !THIRD_PARTY_OK.includes(host)) bad.push(`${where}: ${url}`);
  };
  for (const [page, doc] of allDocs()) {
    for (const n of doc.querySelectorAll('script[src], link[href]:not([rel="canonical"]):not([rel="alternate"]), img[src], iframe[src], source[src], source[srcset], video[src], audio[src], object[data], embed[src]')) {
      check(page, n.getAttribute('src') || n.getAttribute('href') || n.getAttribute('data') || n.getAttribute('srcset'));
    }
    for (const t of doc.querySelectorAll('template')) for (const n of t.content.querySelectorAll('[src]')) check(page, n.getAttribute('src'));
    if (doc.querySelector('iframe, object, embed')) bad.push(`${page}: iframe/object/embed`);
  }
  for (const f of walk(FRONTEND).filter((x) => /\.(css|js)$/.test(x))) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/(?:url\(\s*['"]?|@import\s+['"]|fetch\(\s*['"])(https?:\/\/[^'")\s]+)/g)) check(rel(f), m[1]);
  }
  const trackers = /google-analytics|googletagmanager|gtag\(|fbq\(|facebook\.net|hotjar|plausible|matomo|segment\.(io|com)|clarity\.ms|doubleclick/i;
  for (const f of walk(FRONTEND).filter((x) => /\.(html|js)$/.test(x))) if (trackers.test(fs.readFileSync(f, 'utf8'))) bad.push(`${rel(f)}: tracker`);
  assert.deepEqual(bad, []);
});

/* ---- Secretos -------------------------------------------------------------- */
// gitleaks no está instalado en esta máquina: escaneo equivalente con regex
// propio sobre `git ls-files` (contenido actual) y `git log -p --all` (historial).
const SECRET_PATTERNS = [
  ['AWS access key', /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['AWS secret', /aws_secret_access_key\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}/i],
  ['GitHub token', /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/],
  ['Clave privada', /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY( BLOCK)?-----/],
  ['password=', /\b(pass(word|wd)?|pwd)\s*[:=]\s*['"]?[^\s'"`<>{}(),;]{6,}/i],
  ['Mongo/DB URI con credenciales', /\b(mongodb(\+srv)?|postgres(ql)?|mysql|redis):\/\/[^\s:@/]+:[^\s@/]+@/i],
  ['Slack token', /\bxox[abpors]-[A-Za-z0-9-]{10,}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Stripe key', /\b(sk|rk)_(live|test)_[0-9a-zA-Z]{20,}/],
  ['JWT secret / API key asignada', /\b(jwt_?secret|api_?key|secret_?key|client_?secret)\s*[:=]\s*['"][^'"\s]{12,}['"]/i]
];
// Falsos positivos conocidos (documentación de la propia regla, placeholders):
const ALLOW = [
  /password\s*=\s*['"]?(\*+|x+|changeme|example|your[_-]?password|<[^>]+>)\b/i,
  /process\.env\./,
  // backend/.env.example (commit 6e0d167): línea comentada con placeholder genérico user/host, revisada el 2026-11-18.
  /^\+?\s*#\s*DATABASE_URL=postgres:\/\/user:[^@\s]+@host:5432\/artgallery\s*$/,
  // docs/qa/2026-11-18-tests.md describe ese hallazgo con un URI parafraseado (usuario:contraseña@…), no es un secreto.
  /URI de base de datos con credenciales/
];

function scan(text, where, hits) {
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const [name, re] of SECRET_PATTERNS) {
      if (re.test(line) && !ALLOW.some((a) => a.test(line))) hits.push(`${where}:${i + 1} ${name}`);
    }
  });
}

test('escaneo de secretos en archivos versionados (git ls-files)', () => {
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
  const hits = [];
  for (const f of files) {
    if (/\.(webp|jpe?g|png|gif|pdf|ico|woff2?)$/i.test(f)) continue;
    if (/(^|\/)\.env(\.|$)/.test(f)) hits.push(`${f}: archivo .env versionado`);
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    if (f.startsWith('tests/security/privacy.test.mjs')) continue; // contiene las propias regex
    scan(fs.readFileSync(p, 'utf8'), f, hits);
  }
  assert.deepEqual(hits, []);
});

test('escaneo de secretos en el historial (git log -p --all)', (t) => {
  const names = execFileSync('git', ['log', '--all', '--name-only', '--pretty=format:'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const hits = [];
  for (const n of new Set(names.split('\n').filter(Boolean))) {
    if (/(^|\/)\.env(\.[a-z]+)?$/.test(n) && !/\.example$/.test(n)) hits.push(`historial: archivo ${n} versionado alguna vez`);
  }
  const log = execFileSync('git', ['log', '-p', '--all', '--no-color', '--no-ext-diff', '--', '.', ':(exclude)tests/security/privacy.test.mjs'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024 });
  let commit = '?', file = '?';
  const added = [];
  for (const line of log.split('\n')) {
    if (line.startsWith('commit ')) commit = line.slice(7, 14);
    else if (line.startsWith('+++ b/')) file = line.slice(6);
    else if (line.startsWith('+') && !line.startsWith('+++')) added.push([`${commit} ${file}`, line.slice(1)]);
  }
  t.diagnostic(`${added.length} líneas añadidas revisadas en el historial`);
  for (const [where, line] of added) scan(line, where, hits);
  assert.deepEqual([...new Set(hits.map((h) => h.replace(/:\d+ /, ' ')))], []);
});

/* ---- Dependencias ---------------------------------------------------------- */
function audit(dir, args) {
  const r = spawnSync(npm, ['audit', '--json', ...args], { cwd: dir, encoding: 'utf8', shell: isWin, maxBuffer: 64 * 1024 * 1024 });
  try { return JSON.parse(r.stdout); } catch { return null; }
}

for (const [label, dir, args] of [
  ['tools/images', path.join(ROOT, 'tools/images'), ['--omit=dev']],
  // tests/ solo tiene devDependencies: con --omit=dev no auditaría nada, así que se audita todo.
  ['tests', TESTS, []]
]) {
  test(`npm audit ${args.join(' ')} en ${label}: 0 high/critical (moderate = aviso)`, (t) => {
    assert.ok(fs.existsSync(path.join(dir, 'package-lock.json')), `${label} sin package-lock.json`);
    const res = audit(dir, args);
    if (!res || !res.metadata) { t.skip('npm audit no disponible (¿sin red?)'); return; }
    const v = res.metadata.vulnerabilities;
    t.diagnostic(`${label}: ${JSON.stringify(v)}`);
    if (v.moderate) t.diagnostic(`AVISO (Importante §12.5): ${v.moderate} vulnerabilidades moderate en ${label}`);
    assert.equal((v.high || 0) + (v.critical || 0), 0);
  });
}

test('versiones fijadas con lockfile', () => {
  for (const dir of ['tools/images', 'tests']) {
    const lock = JSON.parse(fs.readFileSync(path.join(ROOT, dir, 'package-lock.json'), 'utf8'));
    assert.ok(lock.lockfileVersion >= 2, `${dir}: lockfile antiguo`);
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, dir, 'package.json'), 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const name of Object.keys(deps)) assert.ok(lock.packages?.[`node_modules/${name}`]?.version, `${dir}: ${name} no está en el lockfile`);
  }
});
