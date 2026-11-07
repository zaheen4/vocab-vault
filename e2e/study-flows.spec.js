import { expect, test } from '@playwright/test'

async function apiGet(page, path) {
  const token = await page.evaluate(() => localStorage.getItem('vv_token'))
  const res = await page.request.get(`http://localhost:5000/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(res.ok(), `GET ${path} -> ${res.status()}`).toBe(true)
  return res.json()
}

async function firstDueDeckId(page) {
  const { decks } = await apiGet(page, '/decks')
  const deck = decks.find((d) => (d.dueCount || 0) > 0) ?? decks[0]
  expect(deck, 'at least one deck exists').toBeTruthy()
  return deck._id
}

async function firstGroupDeckId(page) {
  const { decks } = await apiGet(page, '/decks')
  const deck = decks.find((d) => d.group === 1) ?? decks[0]
  expect(deck, 'at least one group deck exists').toBeTruthy()
  return deck._id
}

test.beforeEach(async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.context().errors = errors
  await page.goto('/')
})

test.afterEach(async ({ page }) => {
  expect(page.context().errors ?? [], 'zero page errors').toEqual([])
})

test('practice answer records a review with XP', async ({ page }) => {
  const id = await firstDueDeckId(page)
  await page.goto(`/decks/${id}`)
  await page.getByRole('button', { name: /tap to reveal/i }).first().waitFor({ timeout: 15000 })
  await page.getByRole('button', { name: /tap to reveal/i }).first().click()
  await page.getByRole('button', { name: /^got it$/i }).click()
  await expect(page.getByText(/Box \d|Mastered/)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/\+\d+ XP/).first()).toBeVisible({ timeout: 10000 })
})

test('deck header labels the session and keyboard answers a card', async ({ page }) => {
  const id = await firstGroupDeckId(page)
  await page.goto(`/decks/${id}`)

  const header = page.getByTestId('deck-header')
  await header.waitFor({ timeout: 15000 })
  await expect(header).toContainText(/Group \d+ · All parts/i)
  await expect(header).toContainText(/\d+ words/)
  await expect(page.getByRole('tab', { name: /Part 1/ })).toContainText(/\d+ due|\d+%/)

  await page.goto('/practice/due')
  await page.getByRole('button', { name: /tap to reveal/i }).first().waitFor({ timeout: 15000 })
  await page.keyboard.press(' ')
  await expect(page.getByRole('button', { name: /^got it$/i })).toBeVisible({ timeout: 10000 })
  await page.keyboard.press('2')
  await expect(page.getByText(/Box \d|Mastered/)).toBeVisible({ timeout: 10000 })
})

test('quiz answer advances to next', async ({ page }) => {
  const id = await firstDueDeckId(page)
  await page.goto(`/decks/${id}/quiz`)
  await page.getByRole('button', { name: 'Start quiz', exact: true }).waitFor({ timeout: 15000 })
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click()
  const option = page.locator('div.grid button', { hasText: /^[A-D]/ }).first()
  await option.waitFor({ timeout: 10000 })
  await option.click()
  await expect(page.getByRole('button', { name: /^(Next|See results)/ })).toBeVisible({
    timeout: 10000,
  })
})

test('typing submit grades the spelling', async ({ page }) => {
  const id = await firstDueDeckId(page)
  await page.goto(`/decks/${id}/typing`)
  await page.getByRole('button', { name: 'Start typing', exact: true }).waitFor({ timeout: 15000 })
  await page.getByRole('button', { name: 'Start typing', exact: true }).click()
  await page.getByLabel('Your spelling').fill('x')
  await page.getByRole('button', { name: /check spelling/i }).click()
  await expect(page.getByText(/The spelling is/)).toBeVisible({ timeout: 10000 })
})

test('deck part navigation switches parts and updates url', async ({ page }) => {
  const id = await firstGroupDeckId(page)
  await page.goto(`/decks/${id}`)
  await page.waitForSelector('text=Part 1', { timeout: 15000 })
  await expect(page.getByRole('tab', { name: /Part 1/i })).toBeVisible()
  await expect(page.getByRole('tab', { name: /Part 2/i })).toBeVisible()
  await expect(page.getByRole('tab', { name: /Part 3/i })).toBeVisible()

  await page.getByRole('tab', { name: /Part 2/i }).click()
  await page.waitForURL(new RegExp(`/decks/${id}\\?part=2`), { timeout: 10000 })
  expect(page.url()).toContain('part=2')
})

test('reverse card toggle alters flashcard orientation', async ({ page }) => {
  const id = await firstDueDeckId(page)
  await page.goto(`/decks/${id}`)
  const toggle = page.getByRole('button', { name: /Reverse/i })
  await toggle.waitFor({ timeout: 15000 })
  const initialPressed = await toggle.getAttribute('aria-pressed')
  await toggle.click()
  await page.waitForTimeout(200)
  expect(await toggle.getAttribute('aria-pressed')).not.toBe(initialPressed)
  await toggle.click()
})

test('pronunciation audio button triggers without page error', async ({ page }) => {
  await page.goto('/search')
  await page.getByLabel('Search words').fill('abate')
  await page.getByText(/^\d+ results?$/).first().waitFor({ timeout: 15000 })
  const speaker = page.getByRole('button', { name: /Pronounce abate/i }).first()
  await speaker.waitFor({ timeout: 10000 })
  await speaker.click()
  await page.waitForTimeout(500)
})

test('search, star, and unstar round-trip', async ({ page }) => {
  await page.goto('/search')
  await page.getByLabel('Search words').fill('abate')
  await page.getByText(/^\d+ results?$/).first().waitFor({ timeout: 15000 })
  const star = page.getByRole('button', { name: /Save abate|Remove abate/ }).first()
  await star.waitFor({ timeout: 15000 })
  const label = await star.getAttribute('aria-label')
  await star.click()
  await page.waitForTimeout(1000)
  if (label?.startsWith('Save')) {
    await page.goto('/bookmarks')
    await expect(page.getByText('abate', { exact: false }).first()).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /Remove abate from saved/ }).first().click()
    await expect(page.getByText('abate', { exact: false })).toHaveCount(0, { timeout: 15000 })
  } else {
    await page.goto('/bookmarks')
    await page.getByRole('button', { name: /Remove abate from saved/ }).first().click()
    await expect(page.getByText('abate', { exact: false })).toHaveCount(0, { timeout: 15000 })
  }
})
