import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.context().errors = errors
})

test.afterEach(async ({ page }) => {
  expect(page.context().errors ?? [], 'zero page errors').toEqual([])
})

test('global daily due queue loads and records SRS review', async ({ page }) => {
  await page.goto('/practice/due')
  await page.waitForSelector('text=Daily Review', { timeout: 15000 })

  const revealBtn = page.getByRole('button', { name: /tap to reveal/i }).first()
  const isAvailable = await revealBtn.isVisible({ timeout: 5000 }).catch(() => false)

  if (isAvailable) {
    await revealBtn.click()
    await page.getByRole('button', { name: /^got it$/i }).click()
    await expect(page.getByText(/Box \d|Mastered/)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/\+\d+ XP/).first()).toBeVisible({ timeout: 10000 })
  } else {
    await expect(page.getByText(/All caught up|No cards due/i).first()).toBeVisible({ timeout: 5000 })
  }
})

test('weak words remediation loads mistake bank or displays clean state', async ({ page }) => {
  await page.goto('/practice/weak')
  await page.waitForSelector('text=Weak Words', { timeout: 15000 })

  const revealBtn = page.getByRole('button', { name: /tap to reveal/i }).first()
  const isAvailable = await revealBtn.isVisible({ timeout: 5000 }).catch(() => false)

  if (isAvailable) {
    await revealBtn.click()
    await page.getByRole('button', { name: /^got it$/i }).click()
    await expect(page.getByText(/Box \d|Mastered/)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/\+\d+ XP/).first()).toBeVisible({ timeout: 10000 })
  } else {
    await expect(page.getByText(/No weak words|clean record/i).first()).toBeVisible({ timeout: 5000 })
  }
})

test('all-deck quiz mode configures question count and scores answers', async ({ page }) => {
  await page.goto('/quiz')
  await page.waitForSelector('text=All-Deck Quiz', { timeout: 15000 })

  const lengthBtn = page.getByRole('button', { name: '5', exact: true })
  await lengthBtn.waitFor({ timeout: 10000 })
  await lengthBtn.click()

  const startBtn = page.getByRole('button', { name: 'Start quiz', exact: true })
  await startBtn.waitFor({ timeout: 10000 })
  await startBtn.click()

  const option = page.locator('div.grid button', { hasText: /^[A-D]/ }).first()
  await option.waitFor({ timeout: 10000 })
  await option.click()

  await expect(page.getByRole('button', { name: /^(Next|See results)/ })).toBeVisible({
    timeout: 10000,
  })
})
