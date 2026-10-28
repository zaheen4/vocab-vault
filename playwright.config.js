import { defineConfig, devices } from '@playwright/test'
import fs from 'node:fs'

const systemChromium = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || systemChromium

// E2E + design-contract suite. Browser assertions only — the API contract
// is covered by curl suites and unit tests run in CI without a database.
// Local runs attach to `npm run dev` when already up (reuseExistingServer);
// without it, the config boots the full stack (needs server/.env + Atlas).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    launchOptions: executablePath
      ? { executablePath }
      : undefined,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.js/,
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        storageState: '.playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /design-contract\.spec\.js/,
    },
  ],
})
