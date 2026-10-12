// DoD-13: auth flows behave as before against mocked /api/auth/*; no tokens/PII in console or URL.
import { test, expect } from '@playwright/test'
import { installMockApi } from './helpers/mockApi.js'

const USER = { id: 'u1', email: 'driver@pitwall.io', displayName: 'Pit Driver' }

function authMock(log) {
  return async (route, p) => {
    const body = route.request().postData()
    log.push({ p, body })
    const json = (b, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(b) })
    if (p === '/api/auth/login') {
      const { password } = JSON.parse(body)
      return password === 'correct-horse' ? json({ accessToken: 'AT1', refreshToken: 'RT1', user: USER }) : json({ message: 'Invalid credentials' }, 401)
    }
    if (p === '/api/auth/refresh') return json({ accessToken: 'AT2', refreshToken: 'RT2', user: USER })
    if (p === '/api/auth/logout') return json({ ok: true })
    if (p === '/api/auth/register') return json({ accessToken: 'AT3', refreshToken: 'RT3', user: USER })
    return json({ message: 'nope' }, 404)
  }
}

test('login error is announced and linked; success stores pw_rt; reload refreshes; no secrets in console/URL', async ({ page }) => {
  const log = [], consoleLines = []
  page.on('console', m => consoleLines.push(m.text()))
  await installMockApi(page, { auth: authMock(log) })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Sign in' }).click()
  const dlg = page.getByRole('dialog', { name: 'ACCESS CONTROL' })
  await expect(dlg).toBeVisible()
  const email = dlg.getByLabel('Email'), pw = dlg.getByLabel('Password', { exact: true })
  await expect(email).toHaveAttribute('autocomplete', 'email')
  await expect(pw).toHaveAttribute('autocomplete', 'current-password')
  await expect(pw).toHaveAttribute('type', 'password')
  await email.fill('driver@pitwall.io'); await pw.fill('wrong')
  await dlg.getByRole('button', { name: 'Sign In' }).click()
  const err = dlg.getByRole('alert')
  await expect(err).toHaveText('Invalid credentials')
  await expect(pw).toHaveAttribute('aria-describedby', 'login-error')
  // password toggle
  await dlg.getByRole('button', { name: 'Show password' }).click()
  await expect(pw).toHaveAttribute('type', 'text')
  await pw.fill('correct-horse')
  await dlg.getByRole('button', { name: 'Sign In' }).click()
  await expect(dlg).toBeHidden()
  expect(await page.evaluate(() => localStorage.getItem('pw_rt'))).toBe('RT1')
  // access token is memory-only
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain('AT1')
  await expect(page.getByRole('button', { name: /Pit Driver/ })).toBeVisible()
  // reload -> refresh flow
  await page.reload()
  await expect(page.getByRole('button', { name: /Pit Driver/ })).toBeVisible()
  expect(log.some(l => l.p === '/api/auth/refresh')).toBe(true)
  expect(page.url()).not.toMatch(/RT|AT|token|driver@pitwall|correct-horse/i)
  const leaked = consoleLines.filter(l => /RT1|RT2|AT1|AT2|correct-horse|driver@pitwall\.io/.test(l))
  expect(leaked).toEqual([])
})

test('login modal closes on Esc and returns focus to the trigger', async ({ page }) => {
  await installMockApi(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Sign in' })
  await trigger.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('register page keeps autocomplete attributes and password masking', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/register')
  await expect(page.locator('input[autocomplete="new-password"]')).toHaveAttribute('type', 'password')
  await expect(page.locator('input[autocomplete="email"]')).toHaveCount(1)
})
