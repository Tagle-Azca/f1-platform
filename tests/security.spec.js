// Security regressions (S1, S3, S4, S5) against hostile mocked API/SSE values.
import { test, expect } from '@playwright/test'
import { installMockApi, liveFixture, dashboardFixture } from './helpers/mockApi.js'

test('S1: hostile SSE sessionName / dashboard values do not blank the app on any route', async ({ page }) => {
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await installMockApi(page, { live: true })
  // override after the generic mock (later routes win)
  await page.route('**/api/dashboard/live/status', r => r.fulfill({
    status: 200, headers: { 'content-type': 'text/event-stream' },
    body: 'retry: 60000\ndata: {"available":true,"sessionName":{"x":1},"raceName":["r"]}\n\n',
  }))
  await page.route('**/api/dashboard', r => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ totalRounds: { a: 1 }, nextRace: { raceName: { $ne: 1 }, round: { a: 1 }, locality: [1], schedule: {} }, standings: [] }),
  }))
  await page.setViewportSize({ width: 1440, height: 900 })
  for (const path of ['/', '/drivers', '/standings']) {
    await page.goto(path)
    await page.waitForSelector('main#main')
    await page.waitForTimeout(500)
    expect(await page.evaluate(() => document.getElementById('root').innerHTML.length), path).toBeGreaterThan(500)
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
  }
  expect(errors.filter(e => /Objects are not valid|split is not a function/.test(e))).toEqual([])
})

test('S1: standings rail survives a numeric driver name', async ({ page }) => {
  await installMockApi(page)
  await page.route('**/api/stats/standings/*', r => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ season: '2026', rounds: [1, 2], drivers: [{ driverId: 'a', name: 12345, team: 'T', teamId: 'ferrari', cumulative: [1, 2] }] }),
  }))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/drivers')
  await page.waitForSelector('main#main')
  await expect(page.getByRole('complementary', { name: 'Championship standings' })).toContainText('12345')
})

test('S3: /live shows rows (no Red Flag) when a feed row has object fields', async ({ page }) => {
  const body = liveFixture()
  body.classification[0].acronym = { a: 1 }
  body.classification[1].fullName = { b: 2 }
  await installMockApi(page, { live: true, liveBody: body })
  await page.goto('/live')
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.locator('[data-error-boundary]')).toHaveCount(0)
})

test('S4: closing the login modal clears the typed password and its visibility', async ({ page }) => {
  await installMockApi(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Sign in' }).click()
  const dlg = page.getByRole('dialog')
  await dlg.getByLabel('Password', { exact: true }).fill('hunter2-secret')
  await dlg.getByRole('button', { name: 'Show password' }).click()
  await page.keyboard.press('Escape')
  await expect(dlg).toBeHidden()
  await page.getByRole('button', { name: 'Sign in' }).click()
  const pw = page.getByRole('dialog').getByLabel('Password', { exact: true })
  await expect(pw).toHaveValue('')
  await expect(pw).toHaveAttribute('type', 'password')
})

test('S5: no request to Google Fonts for IBM Plex Mono; the font is served locally', async ({ page }) => {
  const fontReqs = []
  page.on('request', r => { if (/fonts\.googleapis\.com/.test(r.url())) fontReqs.push(r.url()) })
  await installMockApi(page)
  await page.goto('/')
  await page.waitForSelector('main#main')
  expect(fontReqs.filter(u => /IBM\+Plex/.test(u))).toEqual([])
  const loaded = await page.evaluate(async () => { await document.fonts.load('400 14px "IBM Plex Mono"'); return document.fonts.check('400 14px "IBM Plex Mono"') })
  expect(loaded).toBe(true)
})

test('S10: one malformed /api/dashboard field does not send /, /next-race or /live to the Red Flag page', async ({ page }) => {
  await installMockApi(page)
  const hostile = (mutate) => async (route) => {
    const d = JSON.parse(JSON.stringify(dashboardFixture()))
    mutate(d)
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(d) })
  }
  const variants = [
    d => { d.nextRace.schedule.fp1 = { date: '2099-01-01', time: 5 } },
    d => { d.nextRace.raceName = { $ne: 1 }; d.nextRace.round = { a: 1 } },
    d => { d.standings = { length: 2 } },
    d => { d.standings[0].name = { a: 1 } },
  ]
  for (const mutate of variants) {
    await page.route('**/api/dashboard', hostile(mutate))
    for (const path of ['/', '/next-race', '/live']) {
      await page.goto(path)
      await page.waitForSelector('main#main')
      await page.waitForTimeout(400)
      await expect(page.locator('[data-error-boundary]'), `${path} ${mutate}`).toHaveCount(0)
      await expect(page.getByRole('heading', { level: 1 })).not.toHaveCount(0)
    }
  }
})
