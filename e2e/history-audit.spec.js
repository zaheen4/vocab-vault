import { expect, test } from '@playwright/test'

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
  const reviewTab = page.getByRole('button', { name: /Card Reviews/i })
  await reviewTab.waitFor({ timeout: 10000 })
  await reviewTab.click()
  await expect(reviewTab).toHaveAttribute('aria-pressed', 'true')

  const allFilter = page.getByRole('button', { name: 'All', exact: true })
  const correctFilter = page.getByRole('button', { name: 'Correct', exact: true })
  const needsReviewFilter = page.getByRole('button', { name: 'Needs Review', exact: true })
  await expect(allFilter).toBeVisible({ timeout: 10000 })
  await expect(correctFilter).toBeVisible()
  await expect(needsReviewFilter).toBeVisible()
  await expect(allFilter).toHaveAttribute('aria-pressed', 'true')

  await correctFilter.click()
  await expect(correctFilter).toHaveAttribute('aria-pressed', 'true')
  await expect(allFilter).toHaveAttribute('aria-pressed', 'false')

  await needsReviewFilter.click()
  await page.waitForTimeout(300)
})

test('quiz history displays performance summary and question audits', async ({ page }) => {
  const quizTab = page.getByRole('button', { name: /Quiz History/i })
  await quizTab.waitFor({ timeout: 10000 })
  await quizTab.click()

  const expandBtn = page.getByRole('button', { name: /Review.*questions/i }).first()
  const hasSessions = await expandBtn.isVisible({ timeout: 5000 }).catch(() => false)

  if (hasSessions) {
    await expandBtn.click()
    await expect(page.getByText(/Correct|Missed/i).first()).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /Hide question audit/i }).first().click()
  } else {
    await expect(page.getByText(/No quizzes completed yet/i)).toBeVisible({ timeout: 5000 })
  }
})
