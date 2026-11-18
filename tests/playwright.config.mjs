// Playwright: E2E (§12.3) y seguridad en navegador (§12.4) contra frontend/ servido en local.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT || 4173);
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const local = !process.env.BASE_URL;

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', testMatch: /e2e[\\/].*\.spec\.mjs$/, testIgnore: /perf\.spec\.mjs$/, use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', testMatch: /e2e[\\/].*\.spec\.mjs$/, testIgnore: /perf\.spec\.mjs$/, use: { ...devices['Desktop Safari'] } },
    // Rendimiento aparte y en serie (npm run test:perf, --workers=1): con CPU ×4 simulada,
    // la carga de los demás navegadores en paralelo falsea el LCP.
    { name: 'perf-chromium', testMatch: /e2e[\\/]perf\.spec\.mjs$/, use: { ...devices['Desktop Chrome'] } },
    { name: 'perf-webkit', testMatch: /e2e[\\/]perf\.spec\.mjs$/, use: { ...devices['Desktop Safari'] } },
    { name: 'security-chromium', testMatch: /security[\\/].*\.spec\.mjs$/, use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: local
    ? {
        // serve lee frontend/serve.json (cleanUrls: false) y sirve 404.html con estado 404.
        command: `npx serve ../frontend -l ${PORT} --no-clipboard --no-port-switching`,
        url: `http://localhost:${PORT}/index.html`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        stdout: 'ignore',
        stderr: 'pipe'
      }
    : undefined
});
