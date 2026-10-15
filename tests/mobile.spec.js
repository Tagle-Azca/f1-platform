// DoD-6: 375x812: no horizontal scroll, tab bar visible, >=44px primary targets, body >= 16px.
import { test, expect } from '@playwright/test'
import { installMockApi } from './helpers/mockApi.js'

test.use({ viewport: { width: 375, height: 812 } })
const PAGES = ['/', '/live', '/races/2026/13', '/races/2025/1', '/calendar', '/standings', '/standings?view=constructors', '/circuits', '/circuits/monza', '/drivers', '/drivers?season=1988',
  '/teammates?view=network&a=norris', '/analysis', '/analysis?view=tyres', '/analysis?view=telemetry', '/drivers/norris', '/constructors/mclaren']

for (const path of PAGES) {
  test(`mobile layout ${path}`, async ({ page }) => {
    await installMockApi(page, { live: path === '/live', standings: path.startsWith('/standings') ? 'rich' : undefined })
    await page.goto(path)
    await page.waitForSelector('main#main')
    await page.waitForTimeout(1200)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible()
    expect(await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize))).toBeGreaterThanOrEqual(16)

    // Primary targets: tab bar items and the main page's links/buttons that are visible
    const small = await page.evaluate(() => {
      const els = [...document.querySelectorAll('nav[aria-label="Mobile"] a, nav[aria-label="Mobile"] button, main button, main a')]
      // WCAG 2.5.8 inline exception: a link inside a sentence (its paragraph has other text around it)
      const inline = (e) => e.tagName === 'A' && e.parentElement?.closest('p') && e.closest('p').textContent.trim().length > e.textContent.trim().length
      // Stretched links: an absolutely positioned ::after covering the positioned row is the real target
      const target = (e) => {
        const after = getComputedStyle(e, '::after')
        if (after.position === 'absolute' && after.content !== 'none') {
          let p = e.parentElement
          while (p && getComputedStyle(p).position === 'static') p = p.parentElement
          if (p) return p.getBoundingClientRect()
        }
        return e.getBoundingClientRect()
      }
      return els.filter(e => { const r = target(e); const cs = getComputedStyle(e)
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && (r.height < 44 || r.width < 44) && !e.closest('[hidden]') && !inline(e) })
        .map(e => `${e.tagName} "${(e.getAttribute('aria-label') || e.textContent).trim().slice(0, 30)}" ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`)
    })
    // Inline text links inside paragraphs are exempt (WCAG 2.5.8 inline exception)
    expect(small, 'targets < 44px').toEqual([])
  })
}

test('no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await installMockApi(page)
  await page.goto('/')
  await page.waitForTimeout(1000)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
})
