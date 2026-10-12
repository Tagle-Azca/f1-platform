// Circuits redesign: index (grid, lazy map, filters, URL state) and the detail page. All data from tests/helpers/mockApi.js.
import { test, expect } from '@playwright/test'
import { installMockApi } from './helpers/mockApi.js'

const search = (page) => new URL(page.url()).search
const tracking = (page) => {
  const seen = []
  page.on('request', (r) => seen.push(r.url()))
  return seen
}

test('the default state is a bare /circuits and every control round-trips through a reload', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/circuits')
  await expect(page.getByRole('heading', { level: 1, name: 'Circuits' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Circuit de Monaco' })).toBeVisible()
  expect(search(page)).toBe('')
  await page.getByLabel('Search').fill('mon')
  await expect.poll(() => search(page)).toContain('q=mon')
  await page.getByRole('radio', { name: 'Street' }).click()
  await page.getByRole('button', { name: /On \d{4} calendar/ }).click()
  await page.getByRole('combobox', { name: /Sort/ }).click()
  await page.getByRole('option', { name: 'A to Z' }).click()
  await expect.poll(() => search(page)).toMatch(/q=mon.*type=street.*cal=1.*sort=az/)
  await page.reload()
  await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue('mon')
  await expect(page.getByRole('radio', { name: 'Street' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('button', { name: /On \d{4} calendar/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('link', { name: 'Circuit de Monaco' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Hungaroring' })).toHaveCount(0)
  // Clear filters resets everything but the view
  await page.goto('/circuits?view=grid&q=zzzz')
  await expect(page.getByText('No circuits match')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).first().click()
  await expect.poll(() => search(page)).toBe('')
  // invalid values fall back
  await page.goto('/circuits?type=oval&sort=nope&region=Mars&view=cube')
  await expect(page.getByRole('link', { name: 'Circuit de Monaco' })).toBeVisible()
})

test('calendar groups, the Next chip, the calendar-only circuit and the no-outline fallback', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/circuits')
  await expect(page.getByRole('heading', { level: 2, name: /calendar/ })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Other circuits' })).toBeVisible()
  await expect(page.locator('[data-next]')).toHaveCount(1)
  await expect(page.locator('[data-next]')).toHaveAttribute('data-circuit-card', 'marina_bay')
  const sepang = page.getByRole('link', { name: 'Sepang International Circuit' })
  await expect(sepang).toContainText('Not in the 2022 to 2026 race data.')
  await expect(sepang.locator('[data-fallback-tile]')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Circuit Paul Ricard' }).locator('[data-fallback-tile]')).toBeVisible()
  expect(await page.locator('[data-circuit-grid] [data-track-trace]:not([data-static])').count()).toBe(0)
})

// The grid is auto-fill with a 224px minimum, so the column count follows the content width
// (the shell's standings rail takes width from 1280px up). Check the count matches the width and never drops below 2.
for (const w of [768, 1280, 1440]) {
  test(`grid fills its width at ${w}px with as many 224px+ columns as fit`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 })
    await installMockApi(page)
    await page.goto('/circuits')
    await page.waitForSelector('[data-circuit-card]')
    const m = await page.evaluate(() => {
      const ul = document.querySelectorAll('[data-circuit-grid] ul')[0]
      const gap = parseFloat(getComputedStyle(ul).columnGap) || 0
      const cards = [...ul.children].map((li) => li.getBoundingClientRect())
      return {
        cols: new Set(cards.map((r) => Math.round(r.left))).size,
        fit: Math.floor((ul.getBoundingClientRect().width + gap) / (224 + gap)),
        min: Math.min(...cards.map((r) => r.width)),
      }
    })
    expect(m.cols).toBe(m.fit)
    expect(m.cols).toBeGreaterThanOrEqual(2)
    expect(m.min).toBeGreaterThanOrEqual(224)
  })
}

test('below 640px the cards are rows; the longest name stays inside the screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await installMockApi(page)
  await page.goto('/circuits')
  const card = page.getByRole('link', { name: 'Autodromo Internazionale Enzo e Dino Ferrari' })
  await expect(card).toBeVisible()
  const box = await card.boundingBox()
  expect(box.width).toBeLessThanOrEqual(343 + 1)
  expect(box.height).toBeGreaterThanOrEqual(96)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
})

test('filters sheet at 375: badge, focus trap, Esc, focus returns to the trigger', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await installMockApi(page)
  await page.goto('/circuits')
  const trigger = page.getByRole('button', { name: 'Filters' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Filters' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('combobox', { name: /Region/ })).toBeFocused()
  await dialog.getByRole('radio', { name: 'Street' }).click()
  await expect(dialog.getByRole('button', { name: /Show \d+ circuits?/ })).toBeVisible()
  // Base UI traps focus with guard elements that hand focus back into the dialog a tick after Tab lands on them,
  // so poll briefly: focus must settle inside the dialog after every Tab (it may never stay outside).
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    await expect.poll(() => page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')), { timeout: 1000 }).toBe(true)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'Filters, 1 active' })).toBeFocused()
  expect(search(page)).toContain('type=street')
})

test('Tab order on the index: search, view, region, type, calendar, sort, then the first card', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page)
  await page.goto('/circuits')
  await page.waitForSelector('[data-circuit-card]')
  await page.getByLabel('Search').focus()
  const names = []
  for (let i = 0; i < 6; i++) {
    names.push(await page.evaluate(() => {
      const e = document.activeElement
      return e.getAttribute('aria-label') || e.id || e.getAttribute('role') || e.textContent.trim().slice(0, 30)
    }))
    await page.keyboard.press('Tab')
  }
  expect(names[0]).toBe('cs-search')
  expect(names[1]).toBe('circuits-tab-grid')
  expect(names[2]).toBe('cs-region')
  expect(names[3]).toBe('radio')
  expect(names[4]).toMatch(/calendar/)
  expect(names[5]).toBe('cs-sort')
  expect(await page.evaluate(() => document.activeElement.getAttribute('data-circuit-card'))).not.toBeNull()
})

test('grid view loads no Leaflet chunk and no tile requests; opening Map loads the chunk; rail selection updates the URL', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page)
  const seen = tracking(page)
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('/circuits')
  await page.waitForSelector('[data-circuit-card]')
  await page.waitForTimeout(500)
  const leafletish = (u) => /leaflet|CircuitsMap|mapTiles/i.test(u)
  expect(seen.filter(leafletish)).toEqual([])
  await page.getByRole('tab', { name: 'Map' }).click()
  await expect.poll(() => search(page)).toContain('view=map')
  await expect(page.locator('.leaflet-container')).toBeVisible()
  expect(seen.some(leafletish)).toBe(true)
  await expect(page.getByText('Basemap unavailable. Pins show circuit locations.')).toBeVisible()
  expect(seen.filter((u) => u.includes('cartocdn'))).toEqual([])
  expect(await page.locator('.leaflet-popup, .leaflet-control-attribution').count()).toBe(0)
  const rail = page.getByRole('region', { name: 'Circuits on the map' })
  await rail.getByRole('button', { name: /Autodromo Nazionale di Monza/ }).click()
  await expect.poll(() => search(page)).toContain('c=monza')
  await expect(rail.getByRole('button', { name: /Autodromo Nazionale di Monza/ })).toHaveAttribute('aria-current', 'true')
  await expect(page.locator('.leaflet-marker-icon[aria-label$="selected"]')).toHaveCount(1)
  // markers are focusable and named
  const first = page.locator('.leaflet-marker-icon').first()
  await expect(first).toHaveAttribute('tabindex', '0')
  await expect(first).toHaveAttribute('aria-label', /, (permanent|street|hybrid)/)
  // wheel zoom is gated until the map is clicked
  expect(await page.evaluate(() => document.querySelector('.leaflet-container').getAttribute('aria-label'))).toMatch(/Circuits map/)
  expect(errors).toEqual([])
  // back to the grid
  await page.getByRole('tab', { name: 'Grid' }).click()
  await expect(page.locator('[data-circuit-card]').first()).toBeVisible()
})

test.describe('map on a touch phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })
  test('Explore map toggle, bottom card, top-right zoom, View as grid', async ({ page }) => {
    await installMockApi(page)
    await page.goto('/circuits?view=map')
    await expect(page.locator('.leaflet-container')).toBeVisible()
    const explore = page.getByRole('button', { name: 'Explore map' })
    await expect(explore).toHaveAttribute('aria-pressed', 'false')
    expect((await explore.boundingBox()).height).toBeGreaterThanOrEqual(44)
    await explore.click()
    await expect(page.getByRole('button', { name: 'Lock map' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Lock map' }).click()
    const zoom = await page.locator('.leaflet-control-zoom').boundingBox()
    expect(zoom.x + zoom.width).toBeGreaterThan(375 / 2) // right side
    expect(zoom.y).toBeLessThan(500) // top
    // Tap the first single pin that is on screen (at 375px the world view leaves some pins off-canvas until you pan)
    const pins = page.locator('.leaflet-marker-icon:not(.cmark-wrap--cluster)')
    const visibleIndex = await pins.evaluateAll((els) => {
      const box = document.querySelector('[data-circuits-map]').getBoundingClientRect()
      return els.findIndex((e) => { const r = e.getBoundingClientRect(); return r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom })
    })
    // At world zoom every on-screen circuit in the fixture may sit in a cluster bubble: tap bubbles to zoom in, as a user would
    let index = visibleIndex
    for (let i = 0; index < 0 && i < 4; i++) {
      await page.locator('.cmark-wrap--cluster').first().click()
      await page.waitForTimeout(900)
      index = await pins.evaluateAll((els) => {
        const box = document.querySelector('[data-circuits-map]').getBoundingClientRect()
        return els.findIndex((e) => { const r = e.getBoundingClientRect(); return r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom })
      })
    }
    expect(index).toBeGreaterThanOrEqual(0)
    await pins.nth(index).click()
    const card = page.getByRole('region', { name: 'Selected circuit' })
    await expect(card).toBeVisible()
    await expect(card.getByRole('link', { name: 'Open circuit' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
    await card.getByRole('button', { name: 'Close' }).click()
    await expect(card).toBeHidden()
    await page.getByRole('button', { name: 'View as grid' }).click()
    await expect.poll(() => search(page)).not.toContain('view=map')
  })
})

test('keyboard: Enter on a marker selects it; below lg focus moves to the card and Esc returns it', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 })
  await installMockApi(page)
  await page.goto('/circuits?view=map')
  // A single pin, not a cluster bubble (bubbles zoom in rather than select)
  const marker = page.locator('.leaflet-marker-icon:not(.cmark-wrap--cluster)').first()
  await marker.focus()
  await page.keyboard.press('Enter')
  const card = page.getByRole('region', { name: 'Selected circuit' })
  await expect(card).toBeVisible()
  await expect(card.getByRole('heading')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(card).toBeHidden()
  await expect(marker).toBeFocused()
})

test('card navigation, Back restores the exact filters and makes no second list request', async ({ page }) => {
  const counters = {}
  await installMockApi(page, { counters })
  await page.goto('/circuits?type=permanent&sort=az')
  await page.getByRole('link', { name: 'Autodromo Nazionale di Monza' }).click()
  await expect(page).toHaveURL(/\/circuits\/monza$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Autodromo Nazionale di Monza' })).toBeVisible()
  await expect(page.getByRole('link', { name: /All circuits/ })).toHaveAttribute('href', '/circuits?type=permanent&sort=az')
  await page.goBack()
  await expect(page).toHaveURL(/type=permanent&sort=az/)
  await expect(page.getByRole('radio', { name: 'Permanent' })).toHaveAttribute('aria-checked', 'true')
  expect(counters['/api/circuits']).toBe(1)
  expect(counters['/api/stats/circuit/monza']).toBe(1)
})

test('detail page sections, order, links and a single draw-in', async ({ page }) => {
  const counters = {}
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, { counters })
  await page.goto('/circuits/monza')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Compare laps at Autodromo Nazionale di Monza' })).toHaveAttribute('href', '/telemetry?race=2025_9912')
  await expect(page.getByRole('link', { name: /Wikipedia/ })).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(page.getByText('Lap length')).toBeVisible()
  const table = page.getByRole('table', { name: /Results at/ })
  await expect(table.getByRole('row')).toHaveCount(6)
  await expect(table.getByRole('link').first()).toHaveAttribute('href', /\/races\/2026\/\d+/)
  await expect(page.getByText('Within 2022 to 2026 race data.')).toBeVisible()
  const heads = await page.getByRole('heading', { level: 2 }).allTextContents()
  const order = ['Results', 'Records', 'Circuit DNA', 'Location', 'Car demand'].map((t) => heads.findIndex((h) => h.includes(t)))
  expect(order.every((i) => i >= 0)).toBe(true)
  expect([...order].sort((a, b) => a - b)).toEqual(order)
  await expect(page.getByRole('button', { name: 'Car demand' })).toHaveAttribute('aria-expanded', 'false')
  await page.waitForTimeout(1500)
  expect(await page.locator('[data-track-trace]:not([data-static])').count()).toBe(1)
  expect(counters['/api/stats/circuit/monza']).toBe(1)
  expect(await page.locator('.leaflet-container').count()).toBe(0)
})

test('Las Vegas (id alias) shows the spec strip; sepang shows the fallback hero and the empty history', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/circuits/vegas')
  await expect(page.getByText('Lap length')).toBeVisible()
  await expect(page.getByText('6.2')).toBeVisible()
  await page.goto('/circuits/sepang')
  await expect(page.getByRole('heading', { level: 1, name: 'Sepang International Circuit' })).toBeVisible()
  await expect(page.getByText('No track outline available')).toBeVisible()
  await expect(page.getByText('No Grand Prix here in the 2022 to 2026 data yet.')).toBeVisible()
  await expect(page.getByRole('link', { name: /Compare laps/ })).toHaveCount(0)
  await expect(page.getByText('Lap length')).toHaveCount(0)
})

test('not found: unknown and invalid ids show the designed state; the invalid id makes no request', async ({ page }) => {
  const counters = {}
  await installMockApi(page, { counters })
  await page.goto('/circuits/not_a_circuit')
  await expect(page.getByRole('heading', { name: 'Circuit not found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Browse circuits' })).toHaveAttribute('href', '/circuits')
  await expect(page.getByRole('link', { name: 'Circuits', exact: true }).first()).toBeVisible()
  expect(await page.title()).toBe('Circuit not found · Pitwall')
  Object.keys(counters).forEach((k) => delete counters[k])
  await page.goto('/circuits/%3Cscript%3E')
  await expect(page.getByRole('heading', { name: 'Circuit not found' })).toBeVisible()
  expect(Object.keys(counters).filter((p) => p.startsWith('/api/circuits') || p.startsWith('/api/stats/circuit'))).toEqual([])
})

test('Compare laps lands on Telemetry with the race preselected', async ({ page }) => {
  await installMockApi(page)
  await page.route('**/api/telemetry/races', (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify([{ raceId: '2025_9912', date: '2025-09-07T13:00:00Z', raceName: 'Italian Grand Prix' }, { raceId: '2025_9930', date: '2025-10-05T13:00:00Z', raceName: 'Singapore Grand Prix' }]),
  }))
  await page.goto('/circuits/monza')
  await page.getByRole('link', { name: /Compare laps at/ }).click()
  await expect(page).toHaveURL(/\/telemetry\?race=2025_9912$/)
  await expect(page.getByRole('combobox', { name: /Race/i }).first()).toContainText(/Italian|9912/)
})

test('Home makes no circuits list or calendar request', async ({ page }) => {
  const counters = {}
  await installMockApi(page, { counters })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.waitForTimeout(1200)
  expect(counters['/api/circuits']).toBeUndefined()
  expect(counters['/api/races']).toBeUndefined()
})

test('a calendar failure degrades: notice, no calendar controls, A to Z', async ({ page }) => {
  await installMockApi(page, { calendar: null })
  await page.route('**/api/races**', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: '{}' }))
  await page.goto('/circuits?cal=1')
  await expect(page.getByText(/calendar could not be loaded/)).toBeVisible()
  await expect(page.getByRole('button', { name: /On \d{4} calendar/ })).toHaveCount(0)
  // No calendar group headings in the grid (the shell rail has its own h2s)
  await expect(page.locator('[data-circuit-grid]').getByRole('heading', { level: 2 })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Circuit de Monaco' })).toBeVisible()
})

test('reduced motion: nothing animates on the index or the detail page, the view switch is instant', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page)
  for (const path of ['/circuits', '/circuits/monza', '/circuits?view=map']) {
    await page.goto(path)
    await page.waitForTimeout(1700)
    expect(await page.evaluate(() => document.getAnimations().map((a) => String(a.effect?.target?.className)))).toEqual([])
  }
})

test('CLS on the index stays under 0.1', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page)
  await page.addInitScript(() => {
    window.__cls = 0
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value }).observe({ type: 'layout-shift', buffered: true })
  })
  await page.goto('/circuits')
  await page.waitForSelector('[data-circuit-card]')
  await page.waitForTimeout(1500)
  expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.1)
})
