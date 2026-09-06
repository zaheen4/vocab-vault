import { defineConfig, devices } from '@playwright/test'

// E2E + design-contract suite. Browser assertions only — the API contract
// is covered by curl suites and unit tests run in CI without a database.
// Local runs attach to `npm run dev` when already up (reuseExistingServer);
// without it, the config boots the full stack (needs server/.env + Atlas).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : undefined,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
