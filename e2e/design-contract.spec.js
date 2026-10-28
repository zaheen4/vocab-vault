import { expect, test } from '@playwright/test'

// Design-contract gate (mirrors docs/DESIGN_SYSTEM.md "Checking a PR"):
// voice vs reading type, tap-target minimums, reduced-motion kill-switch,
// clean renders, theme toggling, and mobile tab bar hygiene.
// Auth is handled via the global QA setup and storageState (see AGENTS.md).

test.beforeEach(async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.context().errors = errors
  await page.goto('/')
  await page.waitForSelector('text=Master your words.', { timeout: 15000 })
})

test.afterEach(async ({ page }) => {
  expect(page.context().errors ?? [], 'zero page errors').toEqual([])
})

test('voice surfaces render Baloo, body reads Nunito', async ({ page }) => {
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
  const small = await page.locator('a, button').evaluateAll((els) =>
    els
      .map((e) => {
        const r = e.getBoundingClientRect()
        const label = (e.innerText || e.getAttribute('aria-label') || '?').slice(0, 24)
        return { tag: e.tagName.toLowerCase(), label, w: Math.round(r.width), h: Math.round(r.height) }
      })
      .filter((b) => b.w > 0 && Math.min(b.w, b.h) < 24)
  )
  expect(small, 'tap targets under 24px').toEqual([])
})

test('reduced motion disables celebratory animation', async ({ browser }) => {
  const ctx = await browser.newContext({
    reducedMotion: 'reduce',
    storageState: '.playwright/.auth/user.json',
  })
  const pg = await ctx.newPage()
  await pg.goto('/')
  await pg.waitForSelector('text=Master your words.', { timeout: 15000 })
  expect(await pg.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")).toBe(true)
  const anim = await pg
    .locator('div.animate-fade-up')
    .first()
    .evaluate((e) => getComputedStyle(e).animationName)
  expect(anim).toBe('none')
  await ctx.close()
})

test('theme toggle switches dark mode and persists preference', async ({ page }) => {
  const toggle = page.getByRole('button', { name: /Switch to (dark|light) mode/i }).first()
  await toggle.waitFor({ timeout: 10000 })
  const initialDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))

  await toggle.click()
  await page.waitForTimeout(300)
  const nextDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  expect(nextDark).toBe(!initialDark)

  const stored = await page.evaluate(() => localStorage.getItem('vv_theme'))
  expect(stored).toBe(nextDark ? 'dark' : 'light')

  // Restore original state
  await toggle.click()
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(initialDark)
})

test('mobile bottom tab bar renders 4 primary tabs with >= 44px tap targets', async ({ page }) => {
  const viewport = page.viewportSize()
  if (!viewport || viewport.width >= 640) {
    await page.setViewportSize({ width: 390, height: 844 })
  }

  const tabbar = page.locator('nav[aria-label="Primary"]')
  await expect(tabbar).toBeVisible({ timeout: 10000 })

  const tabs = tabbar.locator('a')
  await expect(tabs).toHaveCount(4)
  await expect(tabbar.getByText('Decks')).toBeVisible()
  await expect(tabbar.getByText('Search')).toBeVisible()
  await expect(tabbar.getByText('Saved')).toBeVisible()
  await expect(tabbar.getByText('Progress')).toBeVisible()

  const heights = await tabs.evaluateAll((els) =>
    els.map((e) => Math.round(e.getBoundingClientRect().height))
  )
  for (const h of heights) {
    expect(h).toBeGreaterThanOrEqual(44)
  }
})

test('all major routes render clean without page errors', async ({ page }) => {
  const routes = [
    { path: '/search', selector: 'input[type="search"]' },
    { path: '/progress', selector: 'text=Your progress' },
    { path: '/history', selector: 'text=History & Performance' },
    { path: '/settings', selector: 'text=Settings & Privacy' },
    { path: '/quiz', selector: 'text=All-Deck Quiz' },
    { path: '/practice/due', selector: 'text=Daily Review' },
    { path: '/practice/weak', selector: 'text=Weak Words' },
    { path: '/bookmarks', selector: 'text=Saved words' },
    { path: '/bookmarks/practice', selector: 'text=Review saved' },
    { path: '/words/new', selector: 'text=Add your own word' },
    { path: '/about', selector: 'text=Privacy, plainly stated' },
  ]

  for (const r of routes) {
    await page.goto(r.path)
    await page.waitForSelector(r.selector, { timeout: 10000 })
  }
})
