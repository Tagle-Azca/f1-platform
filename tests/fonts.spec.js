import { test, expect } from '@playwright/test'
import { installMockApi } from './helpers/mockApi.js'

test('no request goes to Google font hosts (DoD-7)', async ({ page }) => {
  const hosts = []
  page.on('request', (r) => { hosts.push(new URL(r.url()).host) })
  await installMockApi(page)
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  expect(hosts.filter((h) => /fonts\.(googleapis|gstatic)\.com/.test(h))).toEqual([])
})

test('Geist loads and tabular figures have equal width (DoD-7)', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/')
  const res = await page.evaluate(async () => {
    await document.fonts.load('600 40px "Geist Variable"', '0123456789')
    await document.fonts.ready
    const mk = (txt) => {
      const s = document.createElement('span')
      s.textContent = txt
      s.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:600 40px "Geist Variable";font-variant-numeric:tabular-nums'
      document.body.appendChild(s)
      const w = s.getBoundingClientRect().width
      s.remove()
      return w
    }
    return { loaded: document.fonts.check('600 40px "Geist Variable"', '0123456789'), w1: mk('1111'), w0: mk('0000') }
  })
  expect(res.loaded).toBe(true)
  expect(Math.abs(res.w1 - res.w0)).toBeLessThan(0.5)
})
