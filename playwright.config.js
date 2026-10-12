// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
const PORT = 5199

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  testIgnore: ['**/example.spec.js', '**/__baseline__/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    // Pitwall is dark-only; make that explicit for the browser too.
    colorScheme: 'dark',
  },

  // Chromium only (`npx playwright install chromium`). Set PW_CHANNEL=chrome to use an installed Google Chrome instead.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined } },
  ],

  // All specs mock /api/** (tests/helpers/mockApi.js), so no backend is needed.
  webServer: {
    // An empty VITE_CARTO_KEY (it wins over .env.local) keeps the Circuits map on its plain canvas: no tiles, deterministic baselines.
    command: `VITE_CARTO_KEY= npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
