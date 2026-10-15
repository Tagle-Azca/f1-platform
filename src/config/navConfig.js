import {
  LayoutDashboard, Radio, Flag, MapPin, Trophy, Users, Swords,
  Activity, Gauge, CircleDot, Network, BookOpen, History, CalendarDays,
} from 'lucide-react'
import { features, isFeatureOn } from './features'

/**
 * Single source of truth for navigation (Sidebar, MobileNav tab bar + drawer).
 * Item fields: path, label, icon, live?, mobilePrimary?, featureFlag?
 *   mobilePrimary: shown as a bottom tab bar slot (the 5th slot is always "More")
 *   featureFlag:   key of config/features.js; the item does not render while it is off
 * Paths are routes and must not change.
 */
export const NAV_GROUPS = [
  {
    label: 'Race weekend',
    items: [
      { path: '/',          label: 'Dashboard',   icon: LayoutDashboard, mobilePrimary: true },
      { path: '/live',      label: 'Live timing', icon: Radio, live: true, mobilePrimary: true },
      { path: '/next-race', label: 'Next race',   icon: Flag, mobilePrimary: true },
      { path: '/calendar',  label: 'Calendar',    icon: CalendarDays },
      { path: '/circuits',  label: 'Circuits',    icon: MapPin },
    ],
  },
  {
    label: 'Championship',
    items: [
      { path: '/standings', label: 'Standings', icon: Trophy, mobilePrimary: true },
      { path: '/drivers',   label: 'Drivers',   icon: Users },
      { path: '/teammates', label: 'Rivalries', icon: Swords },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { path: '/telemetry',     label: 'Telemetry',      icon: Activity },
      { path: '/race-pace',     label: 'Race pace',      icon: Gauge },
      { path: '/tire-strategy', label: 'Tire strategy',  icon: CircleDot },
      { path: '/graph',         label: 'Graph explorer', icon: Network },
    ],
  },
  {
    label: 'Archive',
    items: [
      { path: '/encyclopedia', label: 'Encyclopedia',   icon: BookOpen },
      { path: '/races',        label: 'Races 1950–2026', icon: History },
    ],
  },
]

/** Groups with feature-flagged items removed (empty groups dropped). */
export function getVisibleGroups(groups = NAV_GROUPS, flags = features) {
  return groups
    .map(g => ({ ...g, items: g.items.filter(i => isFeatureOn(i.featureFlag, flags)) }))
    .filter(g => g.items.length > 0)
}

export const getMobilePrimaryItems = (groups = NAV_GROUPS, flags = features) =>
  getVisibleGroups(groups, flags).flatMap(g => g.items).filter(i => i.mobilePrimary)
