import { expect, test } from '@playwright/test'

// Functional study flows (design-contract.spec.js covers static/visual gates).
// Logs in as the persistent QA account and clicks through real reviews —
// residue is legitimate review activity, never temp entities. Needs dev
// servers + Atlas + VV_QA_EMAIL/VV_QA_PASSWORD (see AGENTS.md). Stays out
// of CI by design.

function qaCreds() {
  const email = process.env.VV_QA_EMAIL
  const password = process.env.VV_QA_PASSWORD
  if (!email || !password) {
    throw new Error('E2E needs VV_QA_EMAIL + VV_QA_PASSWORD env vars (QA account, never committed)')
  }
  return { email, password }
}

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

test.beforeEach(async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.context().errors = errors
  const { email, password } = qaCreds()
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:5173/', { timeout: 20000 })
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
  // Tight feedback shape: box label plus earned XP, never a vague toast.
  await expect(page.getByText(/Box \d|Mastered/)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/\+\d+ XP/).first()).toBeVisible({ timeout: 10000 })
})

test('quiz answer advances to next', async ({ page }) => {
  const id = await firstDueDeckId(page)
  await page.goto(`/decks/${id}/quiz`)
  await page.getByRole('button', { name: 'Start quiz', exact: true }).waitFor({ timeout: 15000 })
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click()
  // Answer the first question with the first option (either outcome records).
  // Option buttons render the letter glued to the text ("Awealth…").
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
  // Wrong on purpose: the correction banner names the word.
  await expect(page.getByText(/The spelling is/)).toBeVisible({ timeout: 10000 })
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
    // Restore: leave no residue on the shared account.
    await page.getByRole('button', { name: /Remove abate from saved/ }).first().click()
    await expect(page.getByText('abate', { exact: false })).toHaveCount(0, { timeout: 15000 })
  } else {
    // Was already starred: unstar from here to restore the prior state.
    await page.goto('/bookmarks')
    await page.getByRole('button', { name: /Remove abate from saved/ }).first().click()
    await expect(page.getByText('abate', { exact: false })).toHaveCount(0, { timeout: 15000 })
  }
})
