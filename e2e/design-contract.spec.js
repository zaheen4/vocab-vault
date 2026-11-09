import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.context().errors = errors
  await page.goto('/')
  await page.getByTestId('home-ready').waitFor({ timeout: 15000 })
})

test.afterEach(async ({ page }) => {
  expect(page.context().errors ?? [], 'zero page errors').toEqual([])
})

test('voice surfaces render Baloo, body reads Nunito', async ({ page }) => {
  const brand = await page
    .getByTestId('brand-wordmark')
    .evaluate((e) => getComputedStyle(e).fontFamily)
  expect(brand).toContain('Baloo')
  const h1 = await page.locator('h1').first().evaluate((e) => getComputedStyle(e).fontFamily)
  expect(h1).toContain('Baloo')
  const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  expect(body).toContain('Nunito')
})

const TAP_TARGET_ROUTES = [
  { path: '/', ready: 'main h1' },
  { path: '/search', ready: '#word-search' },
  { path: '/bookmarks', ready: 'main h1' },
  { path: '/history', ready: 'main h1' },
  { path: '/progress', ready: 'main h1' },
  { path: '/settings', ready: 'main h1' },
]

async function subMinimumTargets(page, route) {
  return page.evaluate(
    (where) =>
      [...document.querySelectorAll('a, button')]
        .map((e) => {
          const r = e.getBoundingClientRect()
          const label = (e.innerText || e.getAttribute('aria-label') || '?')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 32)
          return { where, tag: e.tagName.toLowerCase(), label, w: Math.round(r.width), h: Math.round(r.height) }
        })
        .filter((b) => b.w > 0 && Math.min(b.w, b.h) < 24)
        .map((b) => `${b.where} ${b.tag} "${b.label}" ${b.w}x${b.h}`),
    route
  )
}

test('no tap target under the 24px minimum', async ({ page }) => {
  const offenders = []
  for (const { path, ready } of TAP_TARGET_ROUTES) {
    await page.goto(path)
    await page.locator(ready).first().waitFor({ timeout: 15000 })
    if (path === '/search') {
      await page.getByLabel('Search words').fill('ab')
      await page.locator('li button[aria-expanded]').first().waitFor({ timeout: 15000 })
    }
    offenders.push(...(await subMinimumTargets(page, path)))
  }
  expect(offenders, 'tap targets under 24px').toEqual([])
})

test('reduced motion disables celebratory animation', async ({ browser }) => {
  const ctx = await browser.newContext({
    reducedMotion: 'reduce',
    storageState: '.playwright/.auth/user.json',
  })
  const pg = await ctx.newPage()
  await pg.goto('/')
  await pg.getByTestId('home-ready').waitFor({ timeout: 15000 })
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

  await toggle.click()
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(initialDark)
})

test('desktop nav exposes the review-first destinations', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })

  const nav = page.locator('[role="navigation"][aria-label="Primary"]')
  await expect(nav).toBeVisible({ timeout: 10000 })

  for (const label of ['Decks', 'Review', 'Search', 'Saved', 'Progress']) {
    await expect(nav.getByRole('link', { name: new RegExp(`^${label}`) })).toBeVisible()
  }
  await expect(nav.getByText('History', { exact: true })).toHaveCount(0)

  await page.goto('/history')
  await expect(page.getByText('History & Performance')).toBeVisible({ timeout: 10000 })
  const active = nav.locator('[aria-current="page"]')
  await expect(active).toHaveCount(1)
  await expect(active).toContainText('Progress')
})

test('primary nav stays pinned and marks the active section', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })

  const header = page.locator('header')
  await expect(header).toHaveCSS('position', 'sticky')
  await expect(header).toHaveCSS('top', '0px')

  await page.evaluate(() => window.scrollTo(0, 900))
  await page.waitForTimeout(300)
  const box = await header.boundingBox()
  expect(Math.round(box?.y ?? -1)).toBe(0)

  const active = header.locator('[aria-current="page"]')
  await expect(active).toHaveCount(1)
  await expect(active).toContainText('Decks')
})

test('primary nav labels share one baseline', async ({ page }) => {
  const width = page.viewportSize()?.width ?? 1280
  const selector =
    width >= 768
      ? 'header [role="navigation"][aria-label="Primary"] > a > span:first-child'
      : 'nav[aria-label="Primary"] a > span:last-child > span:first-child'

  const labels = page.locator(selector)
  await expect(labels).toHaveCount(5)

  const centers = await labels.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect()
      return Math.round(r.top + r.height / 2)
    })
  )
  expect(new Set(centers).size, `label centers: ${centers.join(', ')}`).toBe(1)
})

test('reduced motion puts the nav indicator straight on the active link', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 800 })

  await page.goto('/search')
  const active = page.locator('header [aria-current="page"]')
  await expect(active).toContainText('Search')

  const indicator = page.getByTestId('nav-indicator')
  await expect(indicator).toBeVisible()

  const [bar, label] = await Promise.all([
    indicator.boundingBox(),
    active.locator('span').first().boundingBox(),
  ])
  expect(bar && label, 'indicator and label boxes').toBeTruthy()

  const barCenter = bar.x + bar.width / 2
  const labelCenter = label.x + label.width / 2
  expect(Math.abs(barCenter - labelCenter)).toBeLessThan(2)

  const transform = await indicator.evaluate((el) => getComputedStyle(el).transform)
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform)
})

test('home leads with today and gives each deck a single action', async ({ page }) => {
  await page.getByTestId('home-ready').waitFor({ timeout: 15000 })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const cards = page.getByTestId('deck-card')
  await expect(cards.first()).toBeVisible()
  const total = await cards.count()
  expect(total).toBeGreaterThan(0)

  await expect(page.getByRole('link', { name: /^Practice .* Part \d$/ })).toHaveCount(0)

  const actionLinks = page.locator('[data-testid="deck-card"] a[href^="/decks/"]')
  expect(await actionLinks.count()).toBeGreaterThanOrEqual(total)

  const dueChip = page.getByRole('button', { name: 'Due', exact: true })
  await dueChip.click()
  const countLine = page.getByText(/\d+ of \d+ decks/)
  await expect(countLine).toBeVisible()

  const [shown, all] = (await countLine.textContent()).match(/\d+/g).map(Number)
  expect(all).toBe(total)
  await expect(cards).toHaveCount(shown)
})

test('mobile bottom tab bar renders 5 primary tabs with >= 44px tap targets', async ({ page }) => {
  const viewport = page.viewportSize()
  if (!viewport || viewport.width >= 768) {
    await page.setViewportSize({ width: 390, height: 844 })
  }

  const tabbar = page.locator('nav[aria-label="Primary"]')
  await expect(tabbar).toBeVisible({ timeout: 10000 })

  const tabs = tabbar.locator('a')
  await expect(tabs).toHaveCount(5)
  await expect(tabbar.getByText('Decks')).toBeVisible()
  await expect(tabbar.getByText('Review')).toBeVisible()
  await expect(tabbar.getByText('Search')).toBeVisible()
  await expect(tabbar.getByText('Saved')).toBeVisible()
  await expect(tabbar.getByText('Progress')).toBeVisible()
  await expect(tabbar.getByText('History')).toHaveCount(0)

  const heights = await tabs.evaluateAll((els) =>
    els.map((e) => Math.round(e.getBoundingClientRect().height))
  )
  for (const h of heights) {
    expect(h).toBeGreaterThanOrEqual(44)
  }
})

test('study stage keeps the card and its answer row in the first screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const href = await page
    .locator('[data-testid="deck-card"] a[href^="/decks/"]')
    .first()
    .getAttribute('href')
  await page.goto(href)

  const card = page.locator('button[aria-label$="tap to reveal"]').first()
  await card.waitFor({ timeout: 15000 })
  const box = await card.boundingBox()
  expect(Math.round(box.y), 'card top on mobile').toBeLessThanOrEqual(380)
  expect(Math.round(box.height), 'card height on mobile').toBeGreaterThanOrEqual(420)

  await expect(page.locator('a[aria-label]').filter({ hasText: '←' })).toHaveCount(1)

  await card.click()
  const gotIt = page.getByRole('button', { name: /^got it$/i })
  await expect(gotIt).toBeVisible({ timeout: 10000 })
  const bar = await gotIt.boundingBox()
  expect(Math.round(bar.y), 'answer row sits below the card').toBeGreaterThanOrEqual(
    Math.round(box.y + box.height)
  )
})

test('home puts the first deck inside the first screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const first = page.getByTestId('deck-card').first()
  await expect(first).toBeVisible({ timeout: 15000 })
  const box = await first.boundingBox()
  expect(Math.round(box.y), 'first deck card top on mobile').toBeLessThanOrEqual(520)
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
