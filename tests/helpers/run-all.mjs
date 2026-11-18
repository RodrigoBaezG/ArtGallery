// Ejecuta varias fases seguidas aunque una falle (para ver todos los fallos en
// una sola pasada) y sale con error si alguna falló.
//   node helpers/run-all.mjs                 → test:unit, test:security, test:e2e, test:perf
//   node helpers/run-all.mjs security        → tests estáticos de seguridad + Playwright security-chromium
import { spawnSync } from 'node:child_process';

const PRESETS = {
  all: ['npm run test:unit', 'npm run test:security', 'npm run test:e2e', 'npm run test:perf'],
  security: ['node --test "security/*.test.mjs"', 'npx playwright test --project=security-chromium']
};

const commands = PRESETS[process.argv[2] || 'all'];
const results = [];
for (const cmd of commands) {
  const r = spawnSync(cmd, { stdio: 'inherit', shell: true });
  results.push([cmd, r.status]);
}
console.log('\nResumen:');
for (const [cmd, status] of results) console.log(`  ${status === 0 ? 'OK   ' : 'FALLO'} ${cmd}`);
process.exit(results.some(([, s]) => s !== 0) ? 1 : 0);
