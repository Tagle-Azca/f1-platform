// DoD-7 (CLS), DoD-14 (hero fits the first viewport), DoD-16 (circuit fetch gating), DoD-13 (skeleton swap shift).
import { test, expect } from '@playwright/test'
import { installMockApi } from './helpers/mockApi.js'

const observeCls = () => {
  window.__cls = 0
  new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value }).observe({ type: 'layout-shift', buffered: true })
}

test('CLS on / is below 0.1 at 375 and 1440', async ({ page }) => {
  for (const vp of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(vp)
    await page.addInitScript(observeCls)
    await installMockApi(page, { rich: true })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(2500)
    const cls = await page.evaluate(() => window.__cls)
    expect(cls, `CLS at ${vp.width}`).toBeLessThan(0.1)
  }
})

test('hero headline, countdown and primary action fit the first viewport', async ({ page }) => {
  for (const [vp, avail] of [[{ width: 375, height: 812 }, 812 - 48 - 56], [{ width: 1440, height: 900 }, 900 - 64]]) {
    await page.setViewportSize(vp)
    await installMockApi(page, { rich: true })
    await page.goto('/')
    await page.waitForTimeout(1800)
    const bottom = await page.evaluate(() => {
      const cta = [...document.querySelectorAll('main a')].find((a) => a.textContent.trim() === 'Weekend schedule')
      return cta.getBoundingClientRect().bottom - document.querySelector('header').getBoundingClientRect().bottom
    })
    expect(bottom, `CTA bottom ${bottom} within ${avail}`).toBeLessThanOrEqual(avail)
  }
})

test('the circuit outline is fetched once at lg+ and never below lg', async ({ page }) => {
  const small = {}
  await page.setViewportSize({ width: 375, height: 812 })
  await installMockApi(page, { rich: true, counters: small })
  await page.goto('/')
  await page.waitForTimeout(1500)
  expect(Object.keys(small).filter((p) => p.startsWith('/api/circuits/'))).toEqual([])

  const big = {}
  const page2 = await page.context().newPage()
  await page2.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page2, { rich: true, counters: big })
  await page2.goto('/')
  await page2.waitForTimeout(3500)
  const hits = Object.entries(big).filter(([p]) => p.startsWith('/api/circuits/')).reduce((n, [, c]) => n + c, 0)
  expect(hits).toBeLessThanOrEqual(2) // 1 in production; React StrictMode runs the dev effect twice
  expect(hits).toBeGreaterThanOrEqual(1)
  await expect(page2.locator('[data-track-trace]').first()).toBeVisible()
})

test('a failing circuit fetch leaves the hero intact', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, { fail: ['/api/circuits/hungaroring'] })
  await page.goto('/')
  await page.waitForTimeout(1500)
  await expect(page.getByRole('link', { name: 'Weekend schedule' })).toBeVisible()
  await expect(page.locator('[data-track-trace]')).toHaveCount(0)
})

test('Load map mounts the OpenStreetMap iframe only on request', async ({ page }) => {
  await installMockApi(page, { rich: true })
  const osm = []
  page.on('request', (r) => { if (r.url().includes('openstreetmap.org')) osm.push(r.url()) })
  await page.goto('/races/2026/13')
  await page.waitForTimeout(1500)
  expect(osm).toEqual([])
  await page.getByRole('button', { name: 'Load map' }).click()
  await expect(page.locator('iframe[title="Track map"]')).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin')
  await expect.poll(() => osm.length).toBeGreaterThan(0)
})

test('crossing the lg breakpoint back and forth fetches the circuit once (B3)', async ({ page }) => {
  const counters = {}
  await page.setViewportSize({ width: 800, height: 900 })
  await installMockApi(page, { rich: true, counters })
  await page.goto('/')
  for (const w of [1440, 800, 1440, 800, 1440]) { await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(500) }
  const hits = Object.entries(counters).filter(([p]) => p.startsWith('/api/circuits/')).reduce((n, [, c]) => n + c, 0)
  expect(hits).toBe(1)
})
