import { test as setup, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const authDir = '.playwright/.auth'
const authFile = path.join(authDir, 'user.json')

setup('authenticate as QA user', async ({ page }) => {
  const email = process.env.VV_QA_EMAIL
  const password = process.env.VV_QA_PASSWORD
  if (!email || !password) {
    throw new Error('E2E needs VV_QA_EMAIL + VV_QA_PASSWORD env vars (QA account, never committed)')
  }

  fs.mkdirSync(authDir, { recursive: true })

  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:5173/', { timeout: 20000 })
  await expect(page.getByText('Master your words.')).toBeVisible({ timeout: 10000 })

  await page.context().storageState({ path: authFile })
})
