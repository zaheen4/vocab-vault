import { expect, test } from '@playwright/test'

// Design-contract gate (mirrors docs/DESIGN_SYSTEM.md "Checking a PR"):
// voice vs reading type, tap-target minimums, reduced-motion kill-switch,
// clean renders. Auth via the persistent QA account (never register
// throwaways — shared Atlas cluster).
test.beforeEach(async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.context().errors = errors
  await page.goto('/login')
  await page.fill('input[type="email"]', 'qa@test.local')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:5173/', { timeout: 15000 })
})

test.afterEach(async ({ page }) => {
  expect(page.context().errors ?? [], 'zero page errors').toEqual([])
})

test('voice surfaces render Baloo, body reads Nunito', async ({ page }) => {
  await page.waitForSelector('text=Master your words.', { timeout: 10000 })
  const brand = await page
    .locator('header span')
    .first()
    .evaluate((e) => getComputedStyle(e).fontFamily)
  expect(brand).toContain('Baloo')
  const h1 = await page.locator('h1').first().evaluate((e) => getComputedStyle(e).fontFamily)
  expect(h1).toContain('Baloo')
  const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  expect(body).toContain('Nunito')
})

test('no tap target under the 24px minimum', async ({ page }) => {
  await page.waitForSelector('text=Master your words.', { timeout: 10000 })
  const small = await page.locator('a, button').evaluateAll((els) =>
    els
      .map((e) => {
        const r = e.getBoundingClientRect()
        const label = ((e.innerText || e.getAttribute('aria-label') || '?').slice(0, 24))
        return { tag: e.tagName.toLowerCase(), label, w: Math.round(r.width), h: Math.round(r.height) }
      })
      .filter((b) => b.w > 0 && Math.min(b.w, b.h) < 24)
  )
  expect(small, 'tap targets under 24px').toEqual([])
})

test('reduced motion disables celebratory animation', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const pg = await ctx.newPage()
  await pg.goto('/login')
  await pg.fill('input[type="email"]', 'qa@test.local')
  await pg.fill('input[type="password"]', 'password123')
  await pg.click('button[type="submit"]')
  await pg.waitForURL('http://localhost:5173/', { timeout: 15000 })
  await pg.waitForSelector('text=Master your words.', { timeout: 10000 })
  expect(await pg.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")).toBe(true)
  const anim = await pg
    .locator('div.animate-fade-up')
    .first()
    .evaluate((e) => getComputedStyle(e).animationName)
  expect(anim).toBe('none')
  await ctx.close()
})

test('core routes render clean', async ({ page }) => {
  await page.goto('/search')
  await page.waitForSelector('input[type="search"]', { timeout: 10000 })
  await page.goto('/progress')
  await page.waitForSelector('text=Your progress', { timeout: 10000 })
})
