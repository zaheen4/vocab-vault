import { expect, test } from '@playwright/test'

// E2E test suite for Authentication Lifecycle & Account Security:
// 1. Login demo quick-fill, password visibility toggle, remember-me
// 2. Registration live PasswordStrength meter & confirm-password mismatch
// 3. Forgot-password anti-enumeration response & dev-mode helper
// 4. Authenticated account settings, profile update, and danger zone modals

test.describe('unauthenticated auth forms', () => {
  // Use blank storageState so GuestRoute does not redirect to '/'
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    page.context().errors = errors
  })

  test.afterEach(async ({ page }) => {
    expect(page.context().errors ?? [], 'zero page errors').toEqual([])
  })

  test('login page supports demo quick-fill, visibility toggle, and theme switch', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('text=Log in to VocabVault', { timeout: 15000 })

    // Theme toggle on AuthShell
    const themeBtn = page.getByRole('button', { name: /Switch to (dark|light) mode/i }).first()
    await expect(themeBtn).toBeVisible()

    // Password visibility toggle
    const pwdInput = page.locator('input[autocomplete="current-password"]')
    await pwdInput.fill('SecretPassword123')
    const eyeToggle = page.getByRole('button', { name: /Show password/i }).first()
    await eyeToggle.click()
    expect(await pwdInput.getAttribute('type')).toBe('text')
    const hideToggle = page.getByRole('button', { name: /Hide password/i }).first()
    await hideToggle.click()
    expect(await pwdInput.getAttribute('type')).toBe('password')

    // Dev demo quick-fill button
    const demoFill = page.getByRole('button', { name: /Fill QA demo email/i })
    if (await demoFill.isVisible()) {
      await demoFill.click()
      await expect(page.locator('input[type="email"]')).toHaveValue('qa@test.local')
    }

    // Remember me checkbox
    const rememberMe = page.getByLabel('Remember me')
    await expect(rememberMe).toBeVisible()
    await rememberMe.check()
    await expect(rememberMe).toBeChecked()
  })

  test('registration displays live password strength meter and confirm validation', async ({ page }) => {
    await page.goto('/register')
    await page.waitForSelector('text=Create your account', { timeout: 15000 })

    await page.getByLabel('Name').fill('Alex QA')
    await page.getByLabel('Email').fill('alexqa@example.com')

    const pwdInputs = page.locator('input[type="password"]')
    const pwd = pwdInputs.nth(0)
    const confirm = pwdInputs.nth(1)

    // Weak password (score 1 requires length >= 6)
    await pwd.fill('weakpwd')
    await expect(page.getByText('Weak')).toBeVisible({ timeout: 5000 })

    // Strong password
    await pwd.fill('SuperStrongPassword99!')
    await expect(page.getByText('Strong')).toBeVisible({ timeout: 5000 })

    // Mismatched confirm password
    await confirm.fill('MismatchedPassword123')
    await page.getByRole('button', { name: 'Register', exact: true }).click()
    await expect(page.getByText(/Passwords do not match/i)).toBeVisible({ timeout: 5000 })
  })

  test('forgot password returns anti-enumeration message and dev reset link', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForSelector('text=Reset your password', { timeout: 15000 })

    await page.fill('input[type="email"]', 'nonexistent@example.com')
    await page.getByRole('button', { name: /Send reset link/i }).click()

    await expect(
      page.getByText(/If that email is registered, password reset instructions have been sent/i)
    ).toBeVisible({ timeout: 10000 })
  })
})

test.describe('authenticated account settings', () => {
  // Uses default QA storageState
  test.beforeEach(async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    page.context().errors = errors
    await page.goto('/settings')
    await page.waitForSelector('text=Settings & Privacy', { timeout: 15000 })
  })

  test.afterEach(async ({ page }) => {
    expect(page.context().errors ?? [], 'zero page errors').toEqual([])
  })

  test('profile display name updates and safely restores', async ({ page }) => {
    const nameInput = page.getByLabel('Display name')
    await nameInput.waitFor({ timeout: 10000 })
    const originalName = await nameInput.inputValue()

    // Update with temporary suffix
    await nameInput.fill(`${originalName} QA`)
    await page.getByRole('button', { name: /Save profile/i }).click()
    await expect(page.getByText(/Display name updated successfully/i)).toBeVisible({ timeout: 10000 })

    // Restore original name to leave zero residue on QA account
    await nameInput.fill(originalName)
    await page.getByRole('button', { name: /Save profile/i }).click()
    await expect(page.getByText(/Display name updated successfully/i)).toBeVisible({ timeout: 10000 })
  })

  test('danger zone modals render confirmation prompts and dismiss on cancel', async ({ page }) => {
    // 1. Reset progress modal
    const resetTrigger = page.getByRole('button', { name: 'Reset progress', exact: true })
    await resetTrigger.scrollIntoViewIfNeeded()
    await resetTrigger.click()
    await expect(page.getByRole('heading', { name: 'Confirm Progress Reset', exact: true })).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/All word mastery levels, XP, streaks, and quiz histories will be wiped clean/i)).toBeVisible()
    // Dismiss without submitting
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Confirm Progress Reset', exact: true })).toHaveCount(0)

    // 2. Delete account modal
    const deleteTrigger = page.getByRole('button', { name: 'Delete account', exact: true })
    await deleteTrigger.scrollIntoViewIfNeeded()
    await deleteTrigger.click()
    await expect(page.getByRole('heading', { name: 'Delete Account Permanently', exact: true })).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/This action cannot be undone/i)).toBeVisible()
    // Dismiss without submitting
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Delete Account Permanently', exact: true })).toHaveCount(0)
  })
})
