// Screenshot baselines (DoD-4): Dashboard, Live (live mock) and Next race, in success / loading / error states, plus Standings (drivers, constructors),
// at 375x812 and 1440x900. Clock frozen (page.clock), fonts ready, CSS animations disabled, rich mock
// (non-empty trackCoords + Open-Meteo fixture). Update with: npx playwright test tests/screens.spec.js --update-snapshots
import { test, expect } from '@playwright/test'
import { installMockApi, FIXED_NOW } from './helpers/mockApi.js'

const VIEWPORTS = [['375', { width: 375, height: 812 }], ['1440', { width: 1440, height: 900 }]]
const SCENES = [
  ['home', 'success', '/', {}],
  ['home', 'loading', '/', { hang: ['/api/dashboard'] }],
  ['home', 'error', '/', { fail: ['/api/dashboard'] }],
  ['live', 'success', '/live', { live: true, liveCount: 20 }],
  ['live', 'loading', '/live', { live: true, hang: ['/api/dashboard/live'] }],
  ['live', 'error', '/live', { live: true, fail: ['/api/dashboard/live'] }],
  ['standings', 'drivers', '/standings', { standings: 'rich' }],
  ['standings', 'constructors', '/standings?view=constructors', { standings: 'rich' }],
  ['circuits', 'grid', '/circuits', {}],
  ['circuits', 'map', '/circuits?view=map&c=monza', {}],
  ['circuit-detail', 'monza', '/circuits/monza', {}],
  ['next-race', 'success', '/next-race', {}],
  ['next-race', 'loading', '/next-race', { hang: ['/api/dashboard'] }],
  ['next-race', 'error', '/next-race', { fail: ['/api/dashboard'] }],
]

for (const [vn, vp] of VIEWPORTS) {
  for (const [name, state, path, opts] of SCENES) {
    test(`baseline ${name} ${state} @${vn}`, async ({ page }) => {
      await page.setViewportSize(vp)
      await page.clock.setFixedTime(new Date(FIXED_NOW))
      await installMockApi(page, { rich: true, base: FIXED_NOW, ...opts })
      await page.goto(path)
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(1800) // let one-shot entrance motion settle
      await expect(page).toHaveScreenshot(`${name}-${state}-${vn}.png`, { fullPage: false, animations: 'disabled', maxDiffPixelRatio: 0.01 })
    })
  }
}
