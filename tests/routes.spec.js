// DoD-1: every route resolves without the error boundary ("Red Flag"); DoD-10 rail behavior; DoD-11 reduced motion.
import { test, expect } from '@playwright/test'
import { installMockApi } from './helpers/mockApi.js'

const ROUTES = ['/', '/encyclopedia', '/encyclopedia?view=circuits', '/drivers', '/drivers/norris', '/drivers/not_a_driver', '/drivers/%3Cscript%3E', '/constructors/ferrari', '/constructors/not_a_team', '/races', '/races/2025/1', '/circuits', '/circuits/monza', '/circuits/not_a_circuit', '/circuits/%3Cscript%3E', '/telemetry',
  '/standings', '/constructor-standings', '/teammates', '/tire-strategy', '/race-pace', '/next-race', '/live', '/graph', '/register', '/no-such-page']

for (const r of ROUTES) {
  test(`route ${r} renders without error boundary`, async ({ page }) => {
    await installMockApi(page)
    await page.goto(r)
    await page.waitForSelector('main#main')
    await page.waitForTimeout(700)
    await expect(page.locator('[data-error-boundary]')).toHaveCount(0)
    await expect(page.locator('main#main')).toBeVisible()
  })
}

test('standings rail: visible at 1280+, absent below, sidebar has 4 groups', async ({ page }) => {
  await installMockApi(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.waitForSelector('main#main')
  await expect(page.getByRole('complementary', { name: 'Championship standings' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('heading', { level: 2 })).toHaveCount(4)
  await page.setViewportSize({ width: 1279, height: 900 })
  await expect(page.getByRole('complementary', { name: 'Championship standings' })).toHaveCount(0)
  // Dashboard standings widget is dropped at xl (rail shows it) and returns below it.
  await expect(page.locator('[data-widget="standings"]')).toHaveCount(1)
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.locator('[data-widget="standings"]')).toHaveCount(0)
})

test('reduced motion: animations and transitions are effectively instant', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await installMockApi(page, { live: true })
  await page.goto('/live')
  await page.waitForSelector('main#main')
  const d = await page.evaluate(() => {
    const dot = document.querySelector('.live-pill__dot')
    return parseFloat(getComputedStyle(dot).animationDuration)
  })
  expect(d).toBeLessThan(0.01)
})

test('dark only: no color-scheme toggle, color-scheme is dark', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/')
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark')
})
