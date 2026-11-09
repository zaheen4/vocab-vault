#!/usr/bin/env node
// Regenerates the screenshots embedded in README.md.
//
//   npm run dev                     # API :5000 + web :5173
//   npx playwright test e2e/auth.setup.js   # writes .playwright/.auth/user.json
//   npm run screenshots
//
// Needs a QA account with due cards and saved words; /practice/due is used for
// the study shot because a full e2e run drains a single deck's queue.

import { existsSync } from 'node:fs'
import { chromium } from '@playwright/test'

const BASE = process.env.VV_BASE_URL || 'http://localhost:5173'
const CHROMIUM =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined)
const STATE = '.playwright/.auth/user.json'
const OUT = 'docs/assets'
const SETTLE = 700

if (!existsSync(STATE)) {
  console.error(`Missing ${STATE}. Run: npx playwright test e2e/auth.setup.js`)
  process.exit(1)
}

const browser = await chromium.launch({ executablePath: CHROMIUM })
const only = process.argv[2]

async function shot({ file, path, size, ready, before, fullPage = false }) {
  if (only && !file.includes(only)) return
  const context = await browser.newContext({
    viewport: size,
    deviceScaleFactor: 2,
    colorScheme: 'light',
    storageState: STATE,
  })
  await context.addInitScript(() => localStorage.setItem('vv_theme', 'light'))
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.goto(`${BASE}${path}`)
  await page.locator(ready).first().waitFor({ timeout: 20000 })
  if (before) await before(page)
  await page.waitForTimeout(SETTLE)
  await page.screenshot({ path: `${OUT}/${file}`, fullPage })
  await context.close()

  if (errors.length) throw new Error(`${file}: page errors -> ${errors.join(' | ')}`)
  console.log(`wrote ${OUT}/${file}`)
}

const desktop = { width: 1280, height: 860 }
const phone = { width: 390, height: 844 }

await shot({
  file: 'study.png',
  path: '/practice/due',
  size: desktop,
  ready: 'button[aria-label*="tap to reveal"]',
  before: async (page) => {
    await page.locator('button[aria-label*="tap to reveal"]').first().click()
    await page.waitForTimeout(400)
  },
})

await shot({
  file: 'quiz.png',
  path: '/quiz',
  size: desktop,
  ready: 'button:has-text("Start quiz")',
  before: async (page) => {
    await page.getByRole('button', { name: 'Start quiz' }).click()
    await page.locator('div.grid.grid-cols-1 button').first().waitFor({ timeout: 20000 })
    await page.locator('div.grid.grid-cols-1 button').first().click()
    await page.waitForTimeout(400)
  },
})

await shot({
  file: 'progress.png',
  path: '/progress',
  size: desktop,
  ready: 'main h1',
})

await shot({
  file: 'mobile-home.png',
  path: '/',
  size: phone,
  ready: '[data-testid="home-ready"]',
})

await browser.close()
