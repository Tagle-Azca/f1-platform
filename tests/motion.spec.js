// DoD-9 / DoD-10: reduced motion leaves nothing animating; entrance motion is once per mount and never replays on a poll.
import { test, expect } from '@playwright/test'
import { installMockApi } from './helpers/mockApi.js'

const PAGES = [['/', {}], ['/live', { live: true, liveCount: 12 }], ['/next-race', { rich: true }], ['/circuits', { rich: true }], ['/circuits/monza', { rich: true }]]
const animating = (page) => page.evaluate(() => document.getAnimations().map((a) => a.effect?.target?.className?.toString?.() ?? String(a.effect?.target?.localName)))

for (const [path, opts] of PAGES) {
  test(`reduced motion: no running animations on ${path}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await installMockApi(page, opts)
    await page.goto(path)
    await page.waitForSelector('main#main')
    await page.waitForTimeout(500 + 1200)
    expect(await animating(page)).toEqual([])
  })

  test(`normal motion: only the LivePill dot loops on ${path}`, async ({ page }) => {
    await installMockApi(page, opts)
    await page.goto(path)
    await page.waitForSelector('main#main')
    await page.waitForTimeout(2500)
    const running = await animating(page)
    for (const target of running) expect(target, `unexpected animation on ${target}`).toContain('live-pill__dot')
  })
}

test('live polls never replay entrance motion or add animations', async ({ page }) => {
  test.setTimeout(30_000)
  await installMockApi(page, { live: true, liveCount: 12 })
  await page.goto('/live')
  await page.waitForSelector('table')
  await page.waitForTimeout(2500)
  const before = await animating(page)
  await page.waitForTimeout(6500) // three more polls
  const after = await animating(page)
  expect(after.filter((t) => !t.includes('live-pill__dot'))).toEqual(before.filter((t) => !t.includes('live-pill__dot')))
  expect(after.length).toBeLessThanOrEqual(before.length)
})

test('pages only animate transform/opacity-class properties (no layout properties)', async ({ page }) => {
  await installMockApi(page, { rich: true })
  await page.goto('/next-race')
  await page.waitForTimeout(300)
  const props = await page.evaluate(() => document.getAnimations().flatMap((a) => (a.effect?.getKeyframes?.() ?? []).flatMap((k) => Object.keys(k))))
  const banned = props.filter((p) => ['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding'].includes(p))
  expect(banned).toEqual([])
})
