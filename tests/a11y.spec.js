// DoD-3 / DoD-4: axe on 4 pages x 2 viewports. Zero color-contrast violations, zero serious/critical violations.
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { installMockApi } from './helpers/mockApi.js'

const PAGES = [['/', 'dashboard'], ['/live', 'live'], ['/next-race', 'next-race'], ['/standings', 'standings'], ['/standings?view=constructors', 'standings-constructors'],
  ['/circuits', 'circuits-grid'], ['/circuits?view=map', 'circuits-map'], ['/circuits/monza', 'circuit-detail'],
  ['/encyclopedia', 'encyclopedia'], ['/drivers/norris', 'driver-profile'], ['/constructors/mclaren', 'constructor-profile']]
const VIEWPORTS = [['375', { width: 375, height: 812 }], ['1440', { width: 1440, height: 900 }]]

for (const [vn, vp] of VIEWPORTS) {
  for (const [path, name] of PAGES) {
    test(`axe ${name} @${vn}`, async ({ page }) => {
      await page.setViewportSize(vp)
      await installMockApi(page, { live: path === '/live', rich: true, liveCount: 20, standings: path.startsWith('/standings') ? 'rich' : undefined })
      await page.goto(path)
      await page.waitForSelector('main#main')
      await page.waitForTimeout(1500)
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
      const fmt = (v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`
      expect(results.violations.filter(v => v.id === 'color-contrast').map(fmt), 'color-contrast').toEqual([])
      expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(fmt), 'serious/critical').toEqual([])
    })
  }
}
