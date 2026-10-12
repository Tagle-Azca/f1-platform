// DoD-14: /live polling cadence and endpoints unchanged (2s interval, only /api/dashboard/live per tick).
import { test, expect } from '@playwright/test'
import { installMockApi } from './helpers/mockApi.js'

test('/live polls /api/dashboard/live every ~2s and adds no per-tick requests', async ({ page }) => {
  test.setTimeout(60_000)
  const counters = {}
  await installMockApi(page, { live: true, counters })
  await page.goto('/live')
  await page.waitForSelector('table')
  const base = { ...counters }
  await page.waitForTimeout(30_000)
  const delta = (p) => (counters[p] ?? 0) - (base[p] ?? 0)
  const live = delta('/api/dashboard/live')
  expect(live).toBeGreaterThanOrEqual(13)
  expect(live).toBeLessThanOrEqual(16)
  // everything else that moved during the window (shell poller is 30s)
  const others = Object.keys(counters).filter(p => p !== '/api/dashboard/live' && delta(p) > 0)
  for (const p of others) expect(delta(p), `${p} requests in 30s`).toBeLessThanOrEqual(2)
  expect(others.every(p => ['/api/dashboard', '/api/dashboard/live/status', '/api/telemetry/timing-tower'].includes(p) || delta(p) <= 2)).toBe(true)
})
