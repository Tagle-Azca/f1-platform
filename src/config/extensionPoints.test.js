import { describe, it, expect } from 'vitest'
import { features, isFeatureOn } from './features'
import { NAV_GROUPS, getVisibleGroups, getMobilePrimaryItems } from './navConfig'
import { WIDGET_REGISTRY, getDashboardWidgets } from '../components/dashboard/widgetRegistry'

describe('feature flags (DoD-12)', () => {
  it('reserves myPitwall, deepAnalysis and social, all off', () => {
    expect(features).toEqual({ myPitwall: false, deepAnalysis: false, social: false })
  })
  it('is frozen so it cannot be toggled at runtime', () => {
    expect(Object.isFrozen(features)).toBe(true)
  })
  it('isFeatureOn treats a missing flag as on and an off flag as off', () => {
    expect(isFeatureOn(undefined)).toBe(true)
    expect(isFeatureOn('social')).toBe(false)
    expect(isFeatureOn('social', { social: true })).toBe(true)
  })
})

describe('navConfig', () => {
  it('keeps 4 groups and all 13 routes visible with the current flags', () => {
    expect(getVisibleGroups()).toHaveLength(4)
    expect(getVisibleGroups().flatMap(g => g.items)).toHaveLength(13)
  })
  it('does not render items whose featureFlag is off, and drops empty groups', () => {
    const groups = [
      { label: 'A', items: [{ path: '/a', label: 'A1' }, { path: '/b', label: 'B', featureFlag: 'deepAnalysis' }] },
      { label: 'Only flagged', items: [{ path: '/c', label: 'C', featureFlag: 'social' }] },
    ]
    const visible = getVisibleGroups(groups, features)
    expect(visible.map(g => g.label)).toEqual(['A'])
    expect(visible[0].items.map(i => i.path)).toEqual(['/a'])
    expect(getVisibleGroups(groups, { ...features, social: true, deepAnalysis: true }).flatMap(g => g.items)).toHaveLength(3)
  })
  it('exposes the 4 mobile primary tabs in order', () => {
    expect(getMobilePrimaryItems().map(i => i.path)).toEqual(['/', '/live', '/next-race', '/standings'])
  })
  it('every item has an icon and a path starting with /', () => {
    for (const g of NAV_GROUPS) for (const i of g.items) { expect(i.icon).toBeTruthy(); expect(i.path.startsWith('/')).toBe(true) }
  })
})

describe('widgetRegistry (DoD-12)', () => {
  it('drives the Dashboard in the specified mobile order', () => {
    expect(getDashboardWidgets({ width: 375 }).map(w => w.id)).toEqual(['hero', 'titleFight', 'lastSession', 'standings', 'goDeeper'])
  })
  it('entries have the documented shape', () => {
    for (const w of WIDGET_REGISTRY) {
      expect(w).toMatchObject({ id: expect.any(String), title: expect.any(String), minWidth: expect.any(Number), defaultVisible: expect.any(Boolean) })
      expect(typeof w.component).toBe('function')
    }
  })
  it('removes the standings widget at xl (the rail shows it) and keeps it below', () => {
    expect(getDashboardWidgets({ width: 1279 }).some(w => w.id === 'standings')).toBe(true)
    expect(getDashboardWidgets({ width: 1280 }).some(w => w.id === 'standings')).toBe(false)
  })
  it('shows the live console only when live and at lg+', () => {
    expect(getDashboardWidgets({ width: 1440, isLive: true }).some(w => w.id === 'liveConsole')).toBe(true)
    expect(getDashboardWidgets({ width: 1440, isLive: false }).some(w => w.id === 'liveConsole')).toBe(false)
    expect(getDashboardWidgets({ width: 800, isLive: true }).some(w => w.id === 'liveConsole')).toBe(false)
  })
  it('supports a per-user layout (order + hidden) without a rewrite', () => {
    const ids = getDashboardWidgets({ width: 375, layout: { order: ['goDeeper', 'hero'], hidden: ['titleFight'] } }).map(w => w.id)
    expect(ids.slice(0, 2)).toEqual(['goDeeper', 'hero'])
    expect(ids).not.toContain('titleFight')
  })
})
