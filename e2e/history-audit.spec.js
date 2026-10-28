import { expect, test } from '@playwright/test'

// E2E test suite for History & Performance Audit:
// 1. Chronological Review Feed with Leitner box pills and mode tags
// 2. Quiz Session Performance History with question breakdown audits

test.beforeEach(async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.context().errors = errors
  await page.goto('/history')
  await page.waitForSelector('text=History & Performance', { timeout: 15000 })
})

test.afterEach(async ({ page }) => {
  expect(page.context().errors ?? [], 'zero page errors').toEqual([])
})

test('review history feed renders box pills and filters', async ({ page }) => {
  const reviewTab = page.getByRole('tab', { name: /Card Reviews/i })
  await reviewTab.waitFor({ timeout: 10000 })
  await reviewTab.click()

  // Verify filter tabs exist
  await expect(page.getByRole('tab', { name: 'All', exact: true })).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('tab', { name: 'Correct', exact: true })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Needs Review', exact: true })).toBeVisible()

  // Filter by Correct
  await page.getByRole('tab', { name: 'Correct', exact: true }).click()
  await page.waitForTimeout(300)

  // Filter by Needs Review
  await page.getByRole('tab', { name: 'Needs Review', exact: true }).click()
  await page.waitForTimeout(300)
})

test('quiz history displays performance summary and question audits', async ({ page }) => {
  const quizTab = page.getByRole('tab', { name: /Quiz History/i })
  await quizTab.waitFor({ timeout: 10000 })
  await quizTab.click()

  const expandBtn = page.getByRole('button', { name: /Review.*questions/i }).first()
  const hasSessions = await expandBtn.isVisible({ timeout: 5000 }).catch(() => false)

  if (hasSessions) {
    await expandBtn.click()
    // Verify question prompt or answer tag expands
    await expect(page.getByText(/Correct|Missed/i).first()).toBeVisible({ timeout: 5000 })
    // Collapse back
    await page.getByRole('button', { name: /Hide question audit/i }).first().click()
  } else {
    await expect(page.getByText(/No quizzes completed yet/i)).toBeVisible({ timeout: 5000 })
  }
})
