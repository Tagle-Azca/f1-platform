// (Circuits left this guard: it has its own baselines in screens.spec.js.)
// DoD-5 guard: out-of-scope pages must not change visually (except shell regions).
// Baselines are created with `--update-snapshots` BEFORE the pass changes, and compared after.
// Run: SCOPE_SHOTS=1 PW_CHANNEL=chrome npx playwright test tests/scope-shots.spec.js [--update-snapshots]
import { test, expect } from '@playwright/test'
import { installMockApi } from './helpers/mockApi.js'

test.skip(!process.env.SCOPE_SHOTS, 'set SCOPE_SHOTS=1 to run the out-of-scope visual guard')

const PAGES = [['analysis', '/analysis?view=telemetry'], ['drivers-teams', '/drivers'], ['teammates', '/teammates']]
const VIEWPORTS = [['375', { width: 375, height: 812 }], ['1440', { width: 1440, height: 900 }]]

for (const [vn, vp] of VIEWPORTS) {
  for (const [name, path] of PAGES) {
    test(`scope ${name} @${vn}`, async ({ page }) => {
      await page.setViewportSize(vp)
      await page.clock.setFixedTime(new Date('2026-10-09T10:00:00Z'))
      await installMockApi(page)
      await page.goto(path)
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(1200)
      // Shell regions are expected to change in this pass: mask them.
      const masks = ['aside', 'nav', 'header', '[data-error-boundary]'].map((s) => page.locator(s))
      await expect(page).toHaveScreenshot(`${name}-${vn}.png`, { fullPage: true, animations: 'disabled', mask: masks, maxDiffPixelRatio: 0.002 })
    })
  }
}
