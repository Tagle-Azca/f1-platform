// Standings page (merged drivers + constructors): URL state, redirect, season select, replay, rows, drawer, sticky bar,
// tab order, reflow, reduced motion and request guards. All API calls are mocked (helpers/mockApi.js).
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { installMockApi, seasonStandingsFixture } from './helpers/mockApi.js'

const RICH = { standings: 'rich' }
const go = async (page, url, opts = RICH) => {
  await installMockApi(page, opts)
  await page.goto(url)
  await page.waitForSelector('main#main')
  await expect(page.getByRole('slider', { name: 'Replay round' })).toBeVisible()
}

test('legacy /constructor-standings redirects to the constructors view and keeps ?season=', async ({ page }) => {
  await go(page, '/constructor-standings?season=2025')
  await expect(page).toHaveURL(/\/standings\?view=constructors&season=2025$/)
  await expect(page.getByRole('tab', { name: 'Constructors' })).toHaveAttribute('aria-selected', 'true')
  await page.goBack().catch(() => {})
})

test('view and season round-trip through the URL; invalid values fall back', async ({ page }) => {
  await go(page, '/standings?view=constructors&season=2024')
  await expect(page.getByRole('tab', { name: 'Constructors' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Constructors, 2024. 24 rounds.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('tab', { name: 'Constructors' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Constructors, 2024. 24 rounds.')).toBeVisible()
  await page.getByRole('tab', { name: 'Drivers' }).click()
  await expect(page).toHaveURL(/\/standings\?season=2024$/)
  await go(page, '/standings?view=nope&season=zzz')
  await expect(page.getByRole('tab', { name: 'Drivers' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText(/After round 16 of 23/)).toBeVisible()
})

test('the season select lists exactly the seasons with data, newest first, and switching works', async ({ page }) => {
  await go(page, '/standings')
  await page.getByRole('combobox').click()
  await expect(page.getByRole('option').first()).toBeVisible()
  const options = await page.getByRole('option').allTextContents()
  expect(options.map(o => o.trim())).toEqual(['2026', '2025', '2024', '2023', '2022'])
  await page.getByRole('option', { name: '2025' }).click()
  await expect(page).toHaveURL(/season=2025/)
  await expect(page.getByRole('heading', { name: 'Champion', exact: true })).toBeVisible()
})

test('a season without data falls back with a notice that clears on the next change', async ({ page }) => {
  await go(page, '/standings?season=1988')
  await expect(page.getByRole('status').filter({ hasText: 'No standings for 1988. Showing 2026 instead.' })).toBeVisible()
  await expect(page).toHaveURL(/season=2026/)
  await page.getByRole('tab', { name: 'Constructors' }).click()
  await expect(page.getByText('No standings for 1988')).toHaveCount(0)
})

test('partial past season shows the chip; the current season with a sprint-only entry reads it in the label', async ({ page }) => {
  await go(page, '/standings?season=2023')
  await expect(page.getByText('20 of 22 rounds')).toBeVisible()
  await go(page, '/standings')
  await expect(page.getByText('Drivers, 2026. After round 16 of 23.')).toBeVisible()
  await expect(page.getByText(/^\d+ of \d+ rounds$/)).toHaveCount(0)
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.getByText('R17 · Round 17 GP, sprint')).toBeVisible()
  await expect(page.getByRole('slider', { name: 'Replay round' })).toHaveAttribute('aria-valuetext', 'After round 17, Round 17 GP, sprint')
  await expect(page.getByText('7 rounds left')).toBeVisible()
})

test('hero: current season shows the title fight with the points rule; past seasons show the champion', async ({ page }) => {
  await go(page, '/standings')
  await expect(page.getByRole('heading', { name: 'Title fight' })).toBeVisible()
  await expect(page.getByText('Counts 25 points per remaining Grand Prix. Sprint points are not included.')).toBeVisible()
  await page.getByRole('tab', { name: 'Constructors' }).click()
  await expect(page.getByText('Counts 43 points per remaining Grand Prix (a one-two). Sprint points are not included.')).toBeVisible()
  await go(page, '/standings?season=2024')
  await expect(page.getByRole('heading', { name: 'Champion', exact: true })).toBeVisible()
  await expect(page.getByText(/won the title by \d+ points over/)).toBeVisible()
  await page.getByRole('slider', { name: 'Replay round' }).fill('5')
  await expect(page.getByRole('heading', { name: 'Title fight' })).toBeVisible()
  await expect(page.getByText('Counts 26 points per remaining Grand Prix. Sprint points are not included.')).toBeVisible()
})

test('replay: scrub, play to the end, keyboard steps, and the season change resets it', async ({ page }) => {
  await go(page, '/standings?season=2025')
  const slider = page.getByRole('slider', { name: 'Replay round' })
  await slider.focus()
  await page.keyboard.press('Home')
  await expect(slider).toHaveAttribute('aria-valuetext', /After round 1,/)
  await page.keyboard.press('PageUp')
  await expect(slider).toHaveAttribute('aria-valuetext', /After round 6,/)
  await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveAttribute('aria-valuetext', /After round 7,/)
  await page.getByRole('button', { name: 'Play replay' }).click()
  await expect(page.getByRole('button', { name: 'Pause replay' })).toBeVisible()
  await page.waitForTimeout(1200)
  const during = await slider.getAttribute('aria-valuetext')
  expect(during).not.toMatch(/After round 7,/)
  await slider.fill('10') // moving the scrubber pauses playback
  await expect(page.getByRole('button', { name: 'Play replay' })).toBeVisible()
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: '2024' }).click()
  await expect(slider).toHaveAttribute('aria-valuetext', /After round 24,/)
  // the hero, the list and the label follow the same round
  await slider.fill('3')
  await expect(page.getByRole('list', { name: /standings after round 3/ })).toBeVisible()
  await expect(page.getByText('R3 · Round 3 GP').first()).toBeAttached()
})

test('replay plays to the end and stops by itself', async ({ page }) => {
  test.setTimeout(30_000)
  await go(page, '/standings?season=2023') // 20 rounds
  const slider = page.getByRole('slider', { name: 'Replay round' })
  await slider.fill('17')
  await page.getByRole('button', { name: 'Play replay' }).click()
  await expect(page.getByRole('button', { name: 'Replay season' })).toBeVisible({ timeout: 8000 })
  await expect(slider).toHaveAttribute('aria-valuetext', /After round 20,/)
})

test('rows: one disclosure open at a time, detail content, Open profile opens the drawer and focus returns to the row', async ({ page }) => {
  await go(page, '/standings')
  const rows = page.getByRole('list', { name: /Driver standings/ }).getByRole('button')
  await expect(rows).toHaveCount(20)
  await rows.nth(2).click()
  await expect(rows.nth(2)).toHaveAttribute('aria-expanded', 'true')
  const region = page.locator('[id^="st-detail-"]')
  await expect(region).toHaveCount(1)
  await expect(region.getByText('Wins this season')).toBeVisible()
  await expect(region.getByText('Best round', { exact: true })).toBeVisible()
  await expect(region.getByText('Last 5 rounds', { exact: true })).toBeVisible()
  await expect(region.getByText(/^Against /)).toBeVisible()
  const row5 = page.locator('li[data-row-id]').nth(5).locator('button[id^="st-row-"]')
  await row5.click()
  await expect(page.locator('[id^="st-detail-"]')).toHaveCount(1)
  await expect(rows.nth(2)).toHaveAttribute('aria-expanded', 'false')
  await page.getByRole('button', { name: 'Open profile' }).click()
  const drawer = page.getByRole('dialog').first()
  await expect(drawer).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(row5).toBeFocused()
  await page.keyboard.press('Tab') // into the strip: Escape there collapses it and returns to the row
  await page.keyboard.press('Escape')
  await expect(row5).toBeFocused()
  await expect(page.locator('[id^="st-detail-"]')).toHaveCount(0)
})

test('constructors rows open the constructor drawer and show the gap to the team ahead', async ({ page }) => {
  await go(page, '/standings?view=constructors')
  const rows = page.getByRole('list', { name: /Constructor standings/ }).getByRole('button')
  await expect(rows).toHaveCount(10)
  await page.locator('#st-row-ferrari').click()
  await expect(page.getByText('Gap to the team ahead')).toBeVisible()
  await page.getByRole('button', { name: 'Open profile' }).click()
  await expect(page.getByRole('dialog', { name: /constructor profile/ })).toBeVisible()
})

test('chart: Points | Position radiogroup, inverted integer rank axis, roving tabindex', async ({ page }) => {
  await go(page, '/standings')
  const group = page.getByRole('radiogroup', { name: 'Chart type' })
  await expect(group.getByRole('radio', { name: 'Points' })).toHaveAttribute('aria-checked', 'true')
  await group.getByRole('radio', { name: 'Position' }).click()
  await expect(group.getByRole('radio', { name: 'Position' })).toHaveAttribute('aria-checked', 'true')
  await expect.poll(async () => (await page.locator('.recharts-yAxis-tick-labels text').allTextContents()).map(t => t.trim())).toEqual(expect.arrayContaining(['P1', 'P5', 'P10']))
  await page.keyboard.press('ArrowLeft')
  await expect(group.getByRole('radio', { name: 'Points' })).toHaveAttribute('aria-checked', 'true')
  await expect(group.getByRole('radio', { name: 'Position' })).toHaveAttribute('tabindex', '-1')
})

test('mobile Position chart caps at the top 10 and the button shows all', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await go(page, '/standings')
  await page.getByRole('radio', { name: 'Position' }).click()
  const btn = page.getByRole('button', { name: /Showing the top 10\. Show all 20/ })
  await expect(btn).toBeVisible()
  const capped = await page.locator('.recharts-wrapper').boundingBox()
  await btn.click()
  const all = await page.locator('.recharts-wrapper').boundingBox()
  expect(all.height).toBeGreaterThan(capped.height)
  await expect(page.getByRole('button', { name: 'Show the top 10' })).toBeVisible()
})

test('hovering a chart line highlights its row and hovering a row promotes its line', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await go(page, '/standings')
  const row = page.getByRole('list', { name: /Driver standings/ }).getByRole('button').nth(12)
  await row.scrollIntoViewIfNeeded()
  await row.hover()
  await expect(row).toHaveAttribute('data-hover', 'true')
  const full = await page.locator('.st-line .recharts-line-curve[stroke-opacity="1"]').count()
  expect(full).toBe(6) // top 5 + the hovered entry
})

for (const [name, size] of [['375', { width: 375, height: 812 }], ['1440', { width: 1440, height: 900 }]]) {
  test(`sticky replay bar sticks under the header and never covers a focused row @${name}`, async ({ page }) => {
    await page.setViewportSize(size)
    await go(page, '/standings')
    const bar = page.getByRole('group', { name: 'Season replay' })
    const headerH = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')))
    await page.getByRole('list', { name: /Driver standings/ }).getByRole('button').nth(8).scrollIntoViewIfNeeded()
    await page.mouse.wheel(0, 400)
    await page.waitForTimeout(300)
    const b = await bar.boundingBox()
    expect(Math.abs(b.y - headerH)).toBeLessThanOrEqual(1.5)
    const rows = page.getByRole('list', { name: /Driver standings/ }).getByRole('button')
    await rows.nth(4).focus()
    for (let i = 0; i < 8; i++) {
      const f = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { top: r.top, h: r.height } })
      const bb = await bar.boundingBox()
      expect(f.top + 0.5, `focused element top ${f.top} is under the bar (bottom ${bb.y + bb.height})`).toBeGreaterThanOrEqual(bb.y + bb.height)
      await page.keyboard.press(i % 3 === 2 ? 'Enter' : 'Tab')
    }
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Shift+Tab')
      const f = await page.evaluate(() => document.activeElement.getBoundingClientRect().top)
      const bb = await bar.boundingBox()
      expect(f + 0.5).toBeGreaterThanOrEqual(bb.y + bb.height)
    }
  })
}

test('Tab order: season select, view tab, hero links, Play, scrubber, chart toggle, rows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await go(page, '/standings')
  await page.locator('#st-season').focus()
  const seen = []
  for (let i = 0; i < 9; i++) {
    seen.push(await page.evaluate(() => {
      const e = document.activeElement
      return e.id === 'st-season' ? 'season' : e.getAttribute('role') === 'tab' ? 'view-tab'
        : e.closest('[aria-labelledby="st-hero-h"]') ? 'hero-link' : (e.getAttribute('aria-label') || '').match(/replay/i) ? (e.type === 'range' ? 'scrubber' : 'play')
          : e.getAttribute('role') === 'radio' ? 'chart-toggle' : e.id.startsWith('st-row-') ? 'row' : `other:${e.tagName}`
    }))
    await page.keyboard.press('Tab')
  }
  expect(seen).toEqual(['season', 'view-tab', 'hero-link', 'hero-link', 'hero-link', 'play', 'scrubber', 'chart-toggle', 'row'])
})

test('no /api/races request, and one request per season for each payload', async ({ page }) => {
  const counters = {}
  await go(page, '/standings', { ...RICH, counters })
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: '2024' }).click()
  await expect(page.getByText(/Drivers, 2024/)).toBeVisible()
  await page.getByRole('tab', { name: 'Constructors' }).click()
  const standingsCalls = Object.entries(counters).filter(([p]) => p.startsWith('/api/stats/standings/'))
  expect(standingsCalls.length).toBeLessThanOrEqual(8)
  // The shell rail asks for the current season itself; every other season is requested exactly once per payload
  for (const [p, n] of Object.entries(counters).filter(([p]) => /\/api\/stats\/(constructor-)?standings\//.test(p) && !p.endsWith('/2026'))) expect(n, p).toBe(1)
  expect(counters['/api/stats/standings/2026']).toBeLessThanOrEqual(3)
  expect(Object.keys(counters).filter(p => p.startsWith('/api/races'))).toEqual([])
})

test('a failing constructors endpoint only breaks the Constructors view; retry recovers it', async ({ page }) => {
  await installMockApi(page, { ...RICH, fail: ['/api/stats/constructor-standings/2026'] })
  await page.goto('/standings')
  await expect(page.getByRole('heading', { name: 'Title fight' })).toBeVisible()
  await expect(page.getByRole('list', { name: /Driver standings/ })).toBeVisible()
  await page.getByRole('tab', { name: 'Constructors' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Standings could not be loaded' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Drivers' })).toBeVisible()
  await page.unroute('**/api/**')
  await installMockApi(page, RICH)
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { name: 'Title fight' })).toBeVisible()
  await expect(page.getByRole('list', { name: /Constructor standings/ })).toBeVisible()
})

test('a failing drivers endpoint shows the error with a working retry', async ({ page }) => {
  await installMockApi(page, { ...RICH, fail: ['/api/stats/standings/2026'] })
  await page.goto('/standings')
  await expect(page.getByRole('alert').filter({ hasText: 'Standings could not be loaded' })).toBeVisible()
  await page.unroute('**/api/**')
  await installMockApi(page, RICH)
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { name: 'Title fight' })).toBeVisible()
})

test('hero surnames never break mid-word at 375 and 320', async ({ page }) => {
  for (const w of [375, 320]) {
    await page.setViewportSize({ width: w, height: 800 })
    await go(page, '/standings')
    const bad = await page.evaluate(() => [...document.querySelectorAll('[aria-labelledby="st-hero-h"] ol a, [aria-labelledby="st-hero-h"] ol button')].filter(e => {
      const r = document.createRange(); r.selectNodeContents(e)
      return r.getClientRects().length > 1
    }).map(e => e.textContent))
    expect(bad, `wrapped names at ${w}`).toEqual([])
  }
})

test('ties on points use the official order and never print -0', async ({ page }) => {
  await installMockApi(page, RICH)
  // Hermetic: the body comes from the mock fixture, never from the network
  const body = seasonStandingsFixture(2026, true)
  body.drivers = body.drivers.map((d, i) => ({ ...d, officialPosition: i + 1, cumulative: d.cumulative.map(() => 50) }))
  await page.route('**/api/stats/standings/2026', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }))
  await page.goto('/standings')
  await expect(page.getByRole('list', { name: /Driver standings/ })).toBeVisible()
  await expect(page.locator('main')).not.toContainText('-0')
  const first = page.getByRole('list', { name: /Driver standings/ }).getByRole('button').first()
  await expect(first).toContainText(/1, Max Verstappen/)
})

test('deep link to a season that errors shows the error, hostile payloads do not crash', async ({ page }) => {
  await installMockApi(page, RICH)
  await page.route('**/api/stats/standings/2026', r => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ rounds: [{ round: { a: 1 } }, null], totalRounds: 'x', drivers: [{ driverId: 5, name: 12345, team: [1], teamId: {}, cumulative: [1, 2] }, null, 'x'] }),
  }))
  await page.route('**/api/stats/constructor-standings/2026', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ constructors: { length: 2 } }) }))
  await page.goto('/standings')
  await expect(page.getByRole('heading', { name: 'Standings', level: 1 })).toBeVisible()
  await expect(page.locator('[data-error-boundary]')).toHaveCount(0)
  await page.getByRole('tab', { name: 'Constructors' }).click()
  await expect(page.locator('[data-error-boundary]')).toHaveCount(0)
})

for (const [label, url] of [['drivers', '/standings'], ['constructors', '/standings?view=constructors']]) {
  for (const w of [375, 320]) {
    test(`no horizontal scroll at ${w}px (${label}): default, row expanded, Position chart`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 })
      await go(page, url)
      const wide = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(await wide()).toBeLessThanOrEqual(0)
      await page.getByRole('list', { name: /standings after round/ }).getByRole('button').nth(1).click()
      await page.waitForTimeout(400)
      expect(await wide()).toBeLessThanOrEqual(0)
      await page.getByRole('radio', { name: 'Position' }).click()
      await page.waitForTimeout(400)
      expect(await wide()).toBeLessThanOrEqual(0)
    })
  }
}

for (const [label, url] of [['drivers', '/standings'], ['constructors', '/standings?view=constructors']]) {
  test(`axe: ${label} with a row expanded has no serious or critical issues`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await go(page, url)
    await page.getByRole('list', { name: /standings after round/ }).getByRole('button').nth(2).click()
    await page.waitForTimeout(800)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    const fmt = (v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`
    expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(fmt)).toEqual([])
  })
}

test('reduced motion: nothing animates, replay still steps', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await go(page, '/standings')
  await page.getByRole('list', { name: /standings after round/ }).getByRole('button').nth(1).click()
  await page.waitForTimeout(1500)
  expect(await page.evaluate(() => document.getAnimations().map(a => String(a.effect?.target?.className)))).toEqual([])
  await expect(page.getByText('Reduced motion is on. Rounds change without animation.')).toBeVisible()
  const slider = page.getByRole('slider', { name: 'Replay round' })
  await slider.fill('4')
  await page.getByRole('button', { name: 'Play replay' }).click()
  await page.waitForTimeout(1200)
  expect(await slider.getAttribute('aria-valuetext')).not.toMatch(/After round 4,/)
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
})

test('motion allowed: only transform, opacity and stroke animate on the page after the entrance settles', async ({ page }) => {
  await go(page, '/standings')
  await page.waitForTimeout(2500)
  const running = await page.evaluate(() => document.getAnimations().map(a => String(a.effect?.target?.className)))
  expect(running).toEqual([])
})

test('the shell rail is still the only complementary landmark named Championship standings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await go(page, '/standings')
  await expect(page.getByRole('complementary', { name: 'Championship standings' })).toHaveCount(1)
})
