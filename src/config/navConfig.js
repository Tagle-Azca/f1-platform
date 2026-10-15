import { LayoutDashboard, Radio, MapPin, Trophy, Users, Swords, Activity, CalendarDays } from 'lucide-react'
import { features, isFeatureOn } from './features'

/**
 * Single source of truth for navigation (Sidebar, MobileNav tab bar + drawer): 3 groups, 8 destinations.
 * Item fields: path, label, icon, live?, mobilePrimary?, featureFlag?, activePrefixes?
 *   mobilePrimary:  shown as a bottom tab bar slot (the 5th slot is always "More")
 *   featureFlag:    key of config/features.js; the item does not render while it is off
 *   activePrefixes: extra path prefixes that keep the item highlighted (a race weekend page highlights Calendar)
 * Paths are routes. Retired routes (/races, /next-race, /encyclopedia, /telemetry, /race-pace, /tire-strategy, /graph)
 * redirect to their new home (config/legacyRedirects.js, components/race/NextRaceRedirect.jsx).
 */
export const NAV_GROUPS = [
  {
    label: 'Race weekend',
    items: [
      { path: '/',         label: 'Dashboard',   icon: LayoutDashboard, mobilePrimary: true },
      { path: '/live',     label: 'Live timing', icon: Radio, live: true, mobilePrimary: true },
      { path: '/calendar', label: 'Calendar',    icon: CalendarDays, mobilePrimary: true, activePrefixes: ['/races/'] },
      { path: '/circuits', label: 'Circuits',    icon: MapPin },
    ],
  },
  {
    label: 'Championship',
    items: [
      { path: '/standings', label: 'Standings',       icon: Trophy, mobilePrimary: true },
      { path: '/drivers',   label: 'Drivers & teams', icon: Users, activePrefixes: ['/constructors/'] },
      { path: '/teammates', label: 'Rivalries',       icon: Swords },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { path: '/analysis', label: 'Race analysis', icon: Activity },
    ],
  },
]

/** Whether a nav item is the current destination: its own path (and anything below it) or one of its activePrefixes. */
export function isItemActive(item, pathname) {
  if (item.path === '/') return pathname === '/'
  return pathname.startsWith(item.path) || (item.activePrefixes ?? []).some((p) => pathname.startsWith(p))
}

/** Groups with feature-flagged items removed (empty groups dropped). */
export function getVisibleGroups(groups = NAV_GROUPS, flags = features) {
  return groups
    .map(g => ({ ...g, items: g.items.filter(i => isFeatureOn(i.featureFlag, flags)) }))
    .filter(g => g.items.length > 0)
}

export const getMobilePrimaryItems = (groups = NAV_GROUPS, flags = features) =>
  getVisibleGroups(groups, flags).flatMap(g => g.items).filter(i => i.mobilePrimary)
