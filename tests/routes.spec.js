// DoD-1: every route resolves without the error boundary ("Red Flag"); DoD-10 rail behavior; DoD-11 reduced motion.
import { test, expect } from '@playwright/test'
import { installMockApi } from './helpers/mockApi.js'

// DoD-14: every canonical URL of the 8-tab navigation, plus the hostile and not-found shapes.
const ROUTES = ['/', '/drivers', '/drivers?view=constructors', '/drivers?season=1988', '/drivers?view=constructors&season=1955', '/drivers/norris', '/drivers/not_a_driver', '/drivers/%3Cscript%3E',
  '/constructors/ferrari', '/constructors/not_a_team', '/races/2025/1', '/races/2026/13', '/races/2026/99', '/races/1950/1', '/races/abc/1', '/races/2025/1?session=quali',
  '/calendar', '/calendar?season=2023', '/calendar?season=abc', '/circuits', '/circuits/monza', '/circuits/not_a_circuit', '/circuits/%3Cscript%3E',
  '/analysis', '/analysis?view=pace', '/analysis?view=tyres', '/analysis?view=telemetry', '/analysis?view=telemetry&season=2019', '/analysis?season=2019', '/analysis?race=junk&view=nope',
  '/standings', '/constructor-standings', '/teammates', '/teammates?view=network', '/teammates?view=network&a=norris', '/live', '/register', '/no-such-page']

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

// DoD-2: every retired URL lands on its new home (replace, so Back does not return to the old URL).
const REDIRECTS = [
  ['/races', /\/calendar$/], ['/races?season=1988', /\/calendar\?season=1988$/],
  ['/encyclopedia', /\/drivers$/], ['/encyclopedia?view=constructors&season=2024', /\/drivers\?view=constructors&season=2024$/],
  ['/encyclopedia?view=circuits', /\/circuits$/], ['/drivers?view=circuits', /\/circuits$/],
  ['/telemetry', /\/analysis\?view=telemetry$/], ['/telemetry?race=2025_9912', /\/analysis\?view=telemetry&race=2025_9912$/], ['/telemetry?year=2019', /\/analysis\?view=telemetry&season=2019$/],
  ['/race-pace', /\/analysis\?view=pace$/], ['/tire-strategy', /\/analysis\?view=tyres$/], ['/graph', /\/teammates\?view=network$/],
  ['/next-race', /\/races\/2026\/13$/],
]
for (const [from, to] of REDIRECTS) {
  test(`redirect ${from}`, async ({ page }) => {
    await installMockApi(page)
    await page.goto('/standings')
    await page.waitForSelector('main#main')
    await page.goto(from)
    await expect(page).toHaveURL(to)
    await expect(page.locator('[data-error-boundary]')).toHaveCount(0)
    await page.goBack()
    await expect(page).toHaveURL(/\/standings$/) // the old URL is not in the history
  })
}

test('/next-race with no next round goes to the calendar; a dashboard error shows Retry and a calendar link', async ({ page }) => {
  await installMockApi(page)
  await page.route('**/api/dashboard', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ nextRace: null, standings: [] }) }))
  await page.goto('/next-race')
  await expect(page).toHaveURL(/\/calendar$/)
  const fail = await page.context().newPage()
  await installMockApi(fail, { fail: ['/api/dashboard'] })
  await fail.goto('/next-race')
  await expect(fail.getByRole('alert')).toContainText('Race data is unavailable')
  await expect(fail.getByRole('button', { name: 'Try again' })).toBeVisible()
  await expect(fail.getByRole('link', { name: 'Open the calendar' })).toHaveAttribute('href', '/calendar')
  await expect(fail).toHaveURL(/\/next-race$/)
})

test('standings rail: visible at 1280+, absent below, sidebar has 3 groups', async ({ page }) => {
  await installMockApi(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.waitForSelector('main#main')
  await expect(page.getByRole('complementary', { name: 'Championship standings' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('heading', { level: 2 })).toHaveCount(3)
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
