import { describe, it, expect } from 'vitest'
import { features, isFeatureOn } from './features'
import { NAV_GROUPS, getVisibleGroups, getMobilePrimaryItems, isItemActive } from './navConfig'
import { WIDGET_REGISTRY, getDashboardWidgets } from '../components/dashboard/widgetRegistry'

describe('feature flags (DoD-12)', () => {
  it('reserves myPitwall, deepAnalysis and social, all off', () => {
    expect(features).toEqual({ myPitwall: false, deepAnalysis: false, social: false, liveTiming: false })
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
  it('has 3 groups and 7 destinations in the agreed order with the current flags, live timing hidden (DoD-1)', () => {
    expect(getVisibleGroups()).toHaveLength(3)
    expect(getVisibleGroups().map(g => g.items.map(i => i.label))).toEqual([
      ['Dashboard', 'Calendar', 'Circuits'],
      ['Standings', 'Drivers & teams', 'Rivalries'],
      ['Race analysis'],
    ])
    expect(getVisibleGroups().flatMap(g => g.items).map(i => i.path)).toEqual(['/', '/calendar', '/circuits', '/standings', '/drivers', '/teammates', '/analysis'])
  })
  it('shows Live timing second when the liveTiming flag is on', () => {
    const on = { ...features, liveTiming: true }
    expect(getVisibleGroups(undefined, on).flatMap(g => g.items).map(i => i.path)).toEqual(['/', '/live', '/calendar', '/circuits', '/standings', '/drivers', '/teammates', '/analysis'])
    expect(getMobilePrimaryItems(undefined, on).map(i => i.path)).toEqual(['/', '/live', '/calendar', '/standings'])
  })
  it('isItemActive honours activePrefixes (weekend pages highlight Calendar, constructor profiles highlight Drivers & teams)', () => {
    const item = (path) => NAV_GROUPS.flatMap(g => g.items).find(i => i.path === path)
    expect(isItemActive(item('/calendar'), '/races/2026/3')).toBe(true)
    expect(isItemActive(item('/calendar'), '/calendar')).toBe(true)
    expect(isItemActive(item('/drivers'), '/constructors/mclaren')).toBe(true)
    expect(isItemActive(item('/drivers'), '/drivers/norris')).toBe(true)
    expect(isItemActive(item('/'), '/live')).toBe(false)
    expect(isItemActive(item('/'), '/')).toBe(true)
    expect(isItemActive(item('/circuits'), '/races/2026/3')).toBe(false)
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
  it('exposes the 3 mobile primary tabs in order while live timing is hidden (DoD-1)', () => {
    expect(getMobilePrimaryItems().map(i => i.path)).toEqual(['/', '/calendar', '/standings'])
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
