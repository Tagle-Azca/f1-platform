/** Driver and constructor ids that may be put in a URL path or an API request (the API's own ids are lower-case snake case). */
export const ENTITY_ID_RE = /^[a-z0-9_]{1,40}$/
export const isValidEntityId = (id) => typeof id === 'string' && ENTITY_ID_RE.test(id)

const FROM_RE = /^\/(?:encyclopedia|standings)(?:\?[\w%+=&.~*'(),:@-]{0,300})?$/

/**
 * Back link for a profile. `from` comes from router history state, so it is untrusted: only an in-app
 * /encyclopedia or /standings URL is followed; anything else falls back to the hub tab for this entity type.
 */
export function backTarget(from, type = 'drivers') {
  const tab = type === 'constructors' || type === 'circuits' ? type : 'drivers'
  if (typeof from === 'string' && FROM_RE.test(from)) {
    return { to: from, label: from.startsWith('/standings') ? 'Standings' : 'Encyclopedia' }
  }
  return { to: `/encyclopedia?view=${tab}`, label: 'Encyclopedia' }
}

/** Initials of a name, at most 3 letters, for art fallbacks. */
export function initialsOf(name) {
  if (typeof name !== 'string') return ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase()
  return parts.slice(0, 3).map((p) => p[0]).join('').toUpperCase()
}

/** Document title of a not-found profile page. */
export const notFoundTitle = (type) => (type === 'constructor' ? 'Team not found · Pitwall' : 'Driver not found · Pitwall')
