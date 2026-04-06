/**
 * Widget registry — single source of truth for dashboard cards.
 * minCols: 1 = works in any slot | 2 = needs wide (featured) slot
 */
export const WIDGET_REGISTRY = {
  cassandra: {
    id:       'cassandra',
    label:    'Driver Spotlight',
    desc:     'Telemetry · Pace · Strategy',
    icon:     '🏎',
    minCols:  2,   // rich layout, needs wide slot
    category: 'personal',
  },
  team: {
    id:       'team',
    label:    'Team Spotlight',
    desc:     'WCC · Drivers · Championship',
    icon:     '🏁',
    minCols:  2,
    category: 'personal',
  },
  mongo: {
    id:       'mongo',
    label:    'Season at a Glance',
    desc:     'Standings · Races · Circuits',
    icon:     '📅',
    minCols:  1,
    category: 'season',
  },
  dgraph: {
    id:       'dgraph',
    label:    'Title Fight',
    desc:     'Championship · Momentum · Records',
    icon:     '🏆',
    minCols:  1,
    category: 'season',
  },
}

export const ALL_WIDGET_IDS = Object.keys(WIDGET_REGISTRY)
export const DEFAULT_ENABLED = ['cassandra', 'mongo', 'dgraph']
export const DEFAULT_ORDER   = ['cassandra', 'mongo', 'dgraph']

const SECTION_IDS = ['standings', 'lastSession']

/** Returns true if the widget would be in a narrow (1fr) slot given layout */
export function isNarrowSlot(widgetId, layout) {
  const { featured = 'cassandra', order = DEFAULT_ORDER } = layout ?? {}
  if (order.length <= 1) return false
  return widgetId !== featured
}

/** Returns true if widget needs wide but is in narrow slot */
export function hasConstraintViolation(widgetId, layout) {
  const widget = WIDGET_REGISTRY[widgetId]
  if (!widget || widget.minCols < 2) return false
  return isNarrowSlot(widgetId, layout)
}

/** Build a flat unified list from the current layout */
export function getUnifiedList(layout) {
  const { sections = ['standings-row', 'db-cards'], standingsLeft = true, order = [], enabled = [] } = layout ?? {}
  const result = []
  for (const section of sections) {
    if (section === 'standings-row') {
      result.push(...(standingsLeft ? ['standings', 'lastSession'] : ['lastSession', 'standings']))
    } else if (section === 'db-cards') {
      result.push(...order.filter(id => enabled.includes(id)))
    }
  }
  // Append any enabled widgets not yet in result (safety net)
  for (const id of enabled) {
    if (!SECTION_IDS.includes(id) && !result.includes(id)) result.push(id)
  }
  return result
}

/** Derive layout fields from a reordered unified list */
export function layoutFromUnified(unified, layout) {
  const widgetIds = unified.filter(id => !SECTION_IDS.includes(id))
  const sIdx = unified.indexOf('standings')
  const lIdx = unified.indexOf('lastSession')
  const firstWidget = widgetIds.length > 0 ? unified.indexOf(widgetIds[0]) : unified.length
  const sectionRowFirst = Math.min(sIdx < 0 ? Infinity : sIdx, lIdx < 0 ? Infinity : lIdx) <= firstWidget
  return {
    ...layout,
    standingsLeft: sIdx <= lIdx,
    sections: sectionRowFirst ? ['standings-row', 'db-cards'] : ['db-cards', 'standings-row'],
    order: widgetIds,
  }
}
