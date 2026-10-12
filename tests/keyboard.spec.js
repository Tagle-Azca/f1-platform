// DoD-5: keyboard-only navigation (Tab, Shift+Tab, Enter, Esc).
import { test, expect } from '@playwright/test'
import { installMockApi } from './helpers/mockApi.js'

test('skip link is first focusable and moves focus to main (desktop)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page)
  await page.goto('/')
  await page.waitForSelector('main#main')
  await page.keyboard.press('Tab')
  const first = page.getByRole('link', { name: 'Skip to content' })
  await expect(first).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main#main')).toBeFocused()
})

test('every desktop nav item is reachable by Tab with a visible focus ring; active has aria-current', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page)
  await page.goto('/')
  await page.waitForSelector('main#main')
  const nav = page.getByRole('navigation', { name: 'Primary' })
  await expect(nav.getByRole('link')).toHaveCount(13)
  await expect(nav.locator('a[aria-current="page"]')).toHaveText(/Dashboard/)
  const seen = new Set()
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab')
    const info = await page.evaluate(() => {
      const a = document.activeElement
      const inNav = !!a.closest('nav[aria-label="Primary"]') && a.tagName === 'A'
      const cs = getComputedStyle(a)
      return { inNav, href: a.getAttribute('href'), ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 }
    })
    if (info.inNav) { seen.add(info.href); expect(info.ring, `focus ring on ${info.href}`).toBe(true) }
  }
  expect(seen.size).toBe(13)
})

test('mobile drawer: opens from More, traps focus, Esc closes, focus returns to trigger', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await installMockApi(page)
  await page.goto('/')
  await page.waitForSelector('main#main')
  const more = page.getByRole('button', { name: 'More' })
  await more.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Main menu' })
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused()
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]'))).toBe(true)
  }
  await page.keyboard.press('Shift+Tab')
  expect(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]'))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(more).toBeFocused()
})

test('mobile drawer: choosing a link navigates, closes the drawer and focuses main', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await installMockApi(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'More' }).click()
  await page.getByRole('dialog').getByRole('link', { name: 'Circuits' }).click()
  await expect(page).toHaveURL(/\/circuits$/)
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.locator('main#main')).toBeFocused()
})
