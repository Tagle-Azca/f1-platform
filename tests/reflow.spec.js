// DoD-17 / DoD-19: 320px width and 200% zoom (1280px viewport = 640 CSS px): no horizontal scroll, nothing clipped.
import { test, expect } from '@playwright/test'
import { installMockApi } from './helpers/mockApi.js'

const PAGES = [['/', {}], ['/live', { live: true, liveCount: 20 }], ['/races/2026/13', { rich: true }], ['/races/2025/1', { rich: true }], ['/calendar', {}], ['/drivers', {}], ['/drivers?season=1988', {}],
  ['/teammates?view=network&a=norris', {}], ['/analysis', {}], ['/analysis?view=tyres', {}], ['/analysis?view=telemetry', {}],
  ['/circuits', { rich: true }], ['/circuits?view=map&c=monza', { rich: true }], ['/circuits/monza', { rich: true }], ['/circuits/sepang', { rich: true }], ['/circuits/imola', { rich: true }]]
const WIDTHS = [[320, 568], [375, 812], [640, 450]]

for (const [w, h] of WIDTHS) {
  for (const [path, opts] of PAGES) {
    test(`no horizontal scroll at ${w}px on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h })
      await installMockApi(page, opts)
      await page.goto(path)
      await page.waitForSelector('main#main')
      await page.waitForTimeout(1800)
      const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
      expect(m.sw, `scrollWidth ${m.sw} > clientWidth ${m.cw}`).toBeLessThanOrEqual(m.cw)
    })
  }
}

for (const w of [320, 375]) {
  test(`live tower gap value is never truncated at ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 700 })
    await installMockApi(page, { live: true, liveCount: 20 })
    await page.goto('/live')
    await page.waitForSelector('table')
    await page.waitForTimeout(800)
    const bad = await page.evaluate(() => [...document.querySelectorAll('td[data-cell="gap"] .num')].filter((e) => {
      const r = e.getBoundingClientRect()
      return e.scrollWidth > e.clientWidth + 0.5 || r.right > window.innerWidth || r.left < 0
    }).length)
    expect(bad).toBe(0)
    // DoD-17: the gap bar is present (and has width) at 320 as well as 375
    const bars = await page.evaluate(() => [...document.querySelectorAll('td[data-cell="gap"] svg[data-gapbar]')].filter((e) => e.getBoundingClientRect().width > 0).length)
    expect(bars).toBeGreaterThanOrEqual(15)
    const targets = await page.evaluate(() => [...document.querySelectorAll('tbody tr[data-num]')].map((r) => r.getBoundingClientRect().height))
    expect(Math.min(...targets)).toBeGreaterThanOrEqual(44)
  })
}

test('live tower header stays visible after scrolling 400px (sticky, A4)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 600 })
  await installMockApi(page, { live: true, liveCount: 20 })
  await page.goto('/live')
  await page.waitForSelector('table')
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(400)
  const top = await page.evaluate(() => { const t = document.querySelector('thead').getBoundingClientRect(); const header = document.querySelector('header').getBoundingClientRect(); return { thead: t.top, headerBottom: header.bottom } })
  expect(top.thead).toBeGreaterThanOrEqual(0)
  expect(top.thead).toBeLessThanOrEqual(top.headerBottom + 2)
  expect(top.thead).toBeGreaterThanOrEqual(top.headerBottom - 2)
})

test('hostile long names do not widen the Live page (B5)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  const rows = Array.from({ length: 20 }, (_, i) => ({ driverNum: String(i), position: i + 1, acronym: 'X'.repeat(300), fullName: 'Y'.repeat(900), stat: '+' + i, statLabel: 'gap' }))
  await installMockApi(page, { live: true, liveBody: { isLive: true, isRaceType: true, sessionName: 'Race', raceName: 'R', updatedAt: 'garbage', classification: rows } })
  await page.goto('/live')
  await page.waitForSelector('table')
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  expect(m.sw).toBeLessThanOrEqual(m.cw)
  await expect(page.getByText('Invalid Date')).toHaveCount(0)
})

test('stale feed dims the tyre disc but not the tyre letter (A7)', async ({ page }) => {
  test.setTimeout(30_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, { live: true, liveCount: 12, failAfter: { '/api/dashboard/live': 3 } })
  await page.goto('/live')
  await page.waitForSelector('.tyre')
  await expect(page.locator('table[data-stale="true"]')).toHaveCount(1, { timeout: 15_000 })
  const r = await page.evaluate(() => { const t = document.querySelector('.tyre'); const cs = getComputedStyle(t); return { opacity: cs.opacity, color: cs.color } })
  expect(r.opacity).toBe('1')
  expect(r.color).toBe('rgb(238, 241, 244)')
})

test('every tyre letter keeps >= 4.5:1 on its disc, normal and stale (B9)', async ({ page }) => {
  test.setTimeout(30_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  const comps = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET']
  const rows = comps.map((c, i) => ({ driverNum: String(i + 1), position: i + 1, acronym: `T${i}`, fullName: c, stat: i ? `+${i}.0` : 'LEADER', statLabel: 'gap', compound: c, sectors: [] }))
  await installMockApi(page, { live: true, failAfter: { '/api/dashboard/live': 3 }, liveBody: { isLive: true, isRaceType: true, sessionName: 'Race', raceName: 'R', updatedAt: new Date().toISOString(), classification: rows } })
  await page.goto('/live')
  await page.waitForSelector('.tyre')
  const measure = () => page.evaluate(() => {
    const parse = (c) => c.match(/[\d.]+/g).map(Number)
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
    const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
    const ground = parse(getComputedStyle(document.body).backgroundColor)
    return [...document.querySelectorAll('.tyre')].map((t) => {
      const bgc = parse(getComputedStyle(t).backgroundColor)
      const a = bgc.length > 3 ? bgc[3] : 1
      const disc = [0, 1, 2].map((i) => bgc[i] * a + ground[i] * (1 - a))
      const fg = parse(getComputedStyle(t.firstElementChild).color).slice(0, 3)
      const [hi, lo] = [lum(fg), lum(disc)].sort((x, y) => y - x)
      return (hi + 0.05) / (lo + 0.05)
    })
  })
  const normal = await measure()
  expect(normal.length).toBe(5)
  for (const r of normal) expect(r).toBeGreaterThanOrEqual(4.5)
  await expect(page.locator('table[data-stale="true"]')).toHaveCount(1, { timeout: 15_000 })
  for (const r of await measure()) expect(r).toBeGreaterThanOrEqual(4.5)
})
