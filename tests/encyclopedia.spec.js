// Encyclopedia hub, search, profiles, Connections gate, not-found, 375px (mock API: no backend needed).
import { test, expect } from '@playwright/test'
import { installMockApi } from './helpers/mockApi.js'

const HUB = '/encyclopedia'

test('hub: tabs and season are in the URL, Back restores them, invalid values are dropped', async ({ page }) => {
  await installMockApi(page, { standings: 'rich' })
  await page.goto(HUB)
  await page.waitForSelector('[data-hub-grid="drivers"]')
  await page.getByRole('tab', { name: 'Constructors' }).click()
  await expect(page).toHaveURL(/view=constructors/)
  await expect(page.locator('[data-constructor-card]').first()).toBeVisible()
  await page.getByRole('tab', { name: 'Circuits' }).click()
  await expect(page).toHaveURL(/view=circuits/)
  await expect(page.locator('[data-circuit-card]').first()).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/view=constructors/)
  await expect(page.getByRole('tab', { name: 'Constructors' })).toHaveAttribute('aria-selected', 'true')

  const before = await page.evaluate(() => history.length)
  await page.goto(`${HUB}?view=nope&season=1950`)
  await page.waitForSelector('[data-hub-grid="drivers"]')
  await expect(page).toHaveURL(/\/encyclopedia$/)
  expect(await page.evaluate(() => history.length)).toBeLessThanOrEqual(before + 1)
})

test('hub: season Select lists only seasons with data and nothing before 2022', async ({ page }) => {
  await installMockApi(page, { standings: 'rich' })
  await page.goto(HUB)
  await page.waitForSelector('[data-hub-grid="drivers"]')
  await page.locator('#enc-season').click()
  const opts = await page.getByRole('option').allTextContents()
  expect(opts).toEqual(['2026', '2025', '2024', '2023', '2022'])
  await page.keyboard.press('Escape')
  await expect(page.locator('main').getByText(/19\d\d/)).toHaveCount(0)
})

test('hub: no PageHint, native select or carousel; the Circuits tab fetches only when opened', async ({ page }) => {
  const counters = {}
  await installMockApi(page, { standings: 'rich', counters })
  await page.goto(HUB)
  await page.waitForSelector('[data-hub-grid="drivers"]')
  await page.waitForTimeout(500)
  await expect(page.locator('select')).toHaveCount(0)
  expect(counters['/api/circuits'] ?? 0).toBe(0)
  await page.getByRole('tab', { name: 'Circuits' }).click()
  await expect(page.locator('[data-circuit-card]').first()).toBeVisible()
  expect(counters['/api/circuits']).toBe(1)
})

test('search: combobox keys, groups and navigation to a canonical page', async ({ page }) => {
  await installMockApi(page, { standings: 'rich' })
  await page.goto(HUB)
  await page.waitForSelector('[data-hub-grid="drivers"]')
  await page.keyboard.press('/')
  const box = page.getByRole('combobox', { name: 'Search' })
  await expect(box).toBeFocused()
  await box.fill('mo')
  const list = page.getByRole('listbox', { name: 'Search results' })
  await expect(list).toBeVisible()
  await expect(list.getByRole('option')).toHaveCount(1)
  await box.fill('o')
  await box.fill('Lando')
  await expect(list.getByRole('option', { name: /Lando Norris/ })).toHaveAttribute('href', '/drivers/norris')
  await box.press('ArrowDown')
  await expect(box).toHaveAttribute('aria-activedescendant', /opt-0$/)
  await box.press('Escape')
  await expect(list).toHaveCount(0)
  await box.press('ArrowDown')
  await box.press('Enter')
  await expect(page).toHaveURL(/\/drivers\/norris$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Norris')
})

test('search: groups follow the fixed order and no-results is a status row', async ({ page }) => {
  await installMockApi(page, { standings: 'rich' })
  await page.goto(HUB)
  const box = page.getByRole('combobox', { name: 'Search' })
  await box.fill('ma')
  await expect(page.getByRole('option', { name: /McLaren/ })).toHaveAttribute('href', '/constructors/mclaren')
  await box.fill('zzzz')
  await expect(page.getByText(/No matches for/)).toBeVisible()
})

test('card to profile to profile, and Back restores the hub view', async ({ page }) => {
  await installMockApi(page, { standings: 'rich' })
  await page.goto(`${HUB}?view=constructors&season=2025`)
  await page.locator('[data-constructor-card="mclaren"]').click()
  await expect(page).toHaveURL(/\/constructors\/mclaren$/)
  await expect(page.getByRole('heading', { level: 1, name: 'McLaren' })).toBeVisible()
  await page.getByRole('link', { name: 'Lando Norris' }).first().click()
  await expect(page).toHaveURL(/\/drivers\/norris$/)
  await page.goBack()
  await page.goBack()
  await expect(page).toHaveURL(/view=constructors&season=2025/)
})

test('driver profile renders its sections and H2H follows the season control', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/drivers/norris')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Norris')
  for (const h of ['Totals since 2022', 'Seasons', 'Against teammates', 'Best circuits', 'Connections']) {
    await expect(page.getByRole('heading', { level: 2, name: h })).toBeVisible()
  }
  await expect(page.getByText(/career|all-time/i)).toHaveCount(0)
  await page.getByRole('radio', { name: '2025' }).click()
  await expect(page).toHaveURL(/h2h=2025/)
  await expect(page.getByText('Compared with Oscar Piastri in 2025.')).toBeVisible()
})

test('constructor profile: finish rate definition is visible and race pace follows the season', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/constructors/mclaren')
  await expect(page.getByText('Finish rate: share of car starts classified at the finish, 2022–2026.')).toBeVisible()
  await expect(page.getByText('Reliability')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 2, name: 'Team DNA' })).toBeVisible()
  await page.getByRole('heading', { name: 'Race pace' }).scrollIntoViewIfNeeded()
  await expect(page.getByText('Lap times in the Melbourne race. Pit laps are excluded.')).toBeVisible()
  await page.goto('/constructors/mclaren?season=2025')
  await page.getByRole('heading', { name: 'Race pace' }).scrollIntoViewIfNeeded()
  await expect(page.getByText('No lap data for McLaren in 2025.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)
})

test('Connections: no graph chunk and no ego request before the tap, same frame height after', async ({ page }) => {
  const counters = {}
  const chunks = []
  page.on('request', (r) => { if (/ConnectionsCanvas|react-force-graph/.test(r.url())) chunks.push(r.url()) })
  await installMockApi(page, { counters })
  await page.goto('/drivers/norris')
  await page.getByRole('heading', { level: 2, name: 'Connections' }).scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  expect(chunks).toEqual([])
  expect(counters['/api/graph/driver/norris/ego'] ?? 0).toBe(0)
  const frame = page.locator('[data-connections] > div').nth(0)
  const h0 = (await page.locator('[data-connections] .relative').first().boundingBox()).height
  await page.getByRole('button', { name: 'Show network' }).click()
  await expect(page.getByText('Connected', { exact: true })).toBeVisible()
  expect(counters['/api/graph/driver/norris/ego']).toBe(1)
  expect(chunks.length).toBeGreaterThan(0)
  const h1 = (await page.locator('[data-connections] .relative').first().boundingBox()).height
  expect(Math.abs(h1 - h0)).toBeLessThan(1)
  await expect(page.getByRole('link', { name: 'Oscar Piastri' })).toHaveAttribute('href', '/drivers/piastri')
  void frame
})

test('not found: unknown and hostile ids render a designed page, make no profile request and never echo the id', async ({ page }) => {
  const counters = {}
  await installMockApi(page, { counters })
  for (const [path, title] of [['/drivers/not_a_driver', 'Driver not found'], ['/constructors/not_a_team', 'Team not found'], ['/drivers/%3Cscript%3E', 'Driver not found'], ['/constructors/%3Cscript%3E', 'Team not found']]) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    expect(await page.content()).not.toContain('<script>alert')
    await expect(page.locator('main')).not.toContainText('script')
  }
  expect(Object.keys(counters).filter((k) => k.includes('/api/stats/driver/%3C') || k.includes('/api/stats/driver/<') || k.includes('constructor/<') || k.includes('constructor/%3C'))).toEqual([])
})

test('no third-party request from the hub or the profiles other than image hosts', async ({ page }) => {
  const external = []
  page.on('request', (r) => { const u = new URL(r.url()); if (!/localhost|127\.0\.0\.1/.test(u.hostname) && !/media\.formula1\.com/.test(u.hostname) && !u.protocol.startsWith('data')) external.push(u.hostname) })
  await installMockApi(page, { standings: 'rich' })
  for (const path of [HUB, `${HUB}?view=constructors`, '/drivers/norris', '/constructors/mclaren']) {
    await page.goto(path)
    await page.waitForTimeout(800)
  }
  expect(external.filter((h) => /wikipedia/.test(h))).toEqual([]) // the shell header's flag image is out of scope
})

test('drawer: slim summary with a working full-profile link', async ({ page }) => {
  await installMockApi(page, { standings: 'rich' })
  await page.goto('/standings?view=constructors')
  await page.locator('[id^="st-row-"]').first().click()
  await page.getByRole('button', { name: 'Open profile' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused()
  const box = await dialog.getByRole('button', { name: 'Close' }).boundingBox()
  expect(box.width).toBeGreaterThanOrEqual(44)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Open profile' }).click()
  await page.getByRole('link', { name: 'Open full profile' }).click()
  await expect(page).toHaveURL(/\/constructors\/[a-z_]+$/)
})

test.describe('375px', () => {
  test.use({ viewport: { width: 375, height: 812 } })
  for (const path of [HUB, `${HUB}?view=constructors`, `${HUB}?view=circuits`, '/drivers/norris', '/constructors/mclaren']) {
    test(`no horizontal scroll ${path}`, async ({ page }) => {
      await installMockApi(page, { standings: 'rich' })
      await page.goto(path)
      await page.waitForSelector('main#main')
      await page.waitForTimeout(1500)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
    })
  }
})
