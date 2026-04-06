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
    minCols:  2,
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

export const ALL_WIDGET_IDS  = Object.keys(WIDGET_REGISTRY)
export const DEFAULT_ENABLED = ['cassandra', 'mongo', 'dgraph']
export const DEFAULT_ORDER   = ['cassandra', 'mongo', 'dgraph']
export const DEFAULT_PAGE_ORDER = ['standings', 'lastSession', 'cassandra', 'mongo', 'dgraph']

export const SECTION_IDS = ['standings', 'lastSession']

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

/**
 * Returns the flat unified list of all items in display order.
 * New format: uses layout.pageOrder directly.
 * Legacy fallback: derives from sections + standingsLeft + order.
 */
export function getUnifiedList(layout) {
  const { pageOrder, sections = ['standings-row', 'db-cards'], standingsLeft = true, order = [], enabled = [] } = layout ?? {}

  if (pageOrder) {
    // Filter out disabled widgets; keep section items always
    const result = pageOrder.filter(id => SECTION_IDS.includes(id) || enabled.includes(id))
    // Safety net: append enabled widgets not yet in pageOrder
    for (const id of enabled) {
      if (!SECTION_IDS.includes(id) && !result.includes(id)) result.push(id)
    }
    return result
  }

  // Legacy fallback
  const result = []
  for (const section of sections) {
    if (section === 'standings-row') {
      result.push(...(standingsLeft ? ['standings', 'lastSession'] : ['lastSession', 'standings']))
    } else if (section === 'db-cards') {
      result.push(...order.filter(id => enabled.includes(id)))
    }
  }
  for (const id of enabled) {
    if (!SECTION_IDS.includes(id) && !result.includes(id)) result.push(id)
  }
  return result
}

/** Derive layout fields from a reordered unified list */
export function layoutFromUnified(unified, layout) {
  const widgetIds = unified.filter(id => !SECTION_IDS.includes(id))
  return {
    ...layout,
    pageOrder: unified,
    order:     widgetIds,
  }
}

/**
 * Split a unified list into renderable page segments:
 * { type: 'standings' | 'lastSession' | 'widgets', ids?: string[] }
 */
export function getPageSegments(layout) {
  const unified = getUnifiedList(layout)
  const segments = []
  let widgetBuffer = []

  for (const id of unified) {
    if (SECTION_IDS.includes(id)) {
      if (widgetBuffer.length) { segments.push({ type: 'widgets', ids: [...widgetBuffer] }); widgetBuffer = [] }
      segments.push({ type: id })
    } else {
      widgetBuffer.push(id)
    }
  }
  if (widgetBuffer.length) segments.push({ type: 'widgets', ids: widgetBuffer })
  return segments
}
