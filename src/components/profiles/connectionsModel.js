// Pure model for the Connections section: the ego graph payload becomes validated nodes/links for the canvas
// and the visible "Connected" list (the accessible alternative and the cross-link set).
import { asArray, asObjectArray } from '../../utils/safeArray'
import { safeString } from '../../utils/safeText'
import { isValidEntityId } from './entityId'

export const MAX_NODES = 60
export const MAX_CONNECTED = 12

const PREFIX = /^(driver|teammate|team)_(.+)$/

/** "teammate_piastri" -> { kind: 'driver', slug: 'piastri' }; "team_mclaren" -> { kind: 'team', slug: 'mclaren' }. */
export function parseNodeId(id) {
  const m = PREFIX.exec(safeString(id))
  if (!m) return null
  return { kind: m[1] === 'team' ? 'team' : 'driver', slug: m[2] }
}

/**
 * @param {object} payload  { nodes: [{ id, name, type, isSelf, seasons, teamIds }], links: [{ source, target, rel }] }
 * @param {{ selfId?: string }} opts
 * @returns {{ nodes, links, connected, empty }}
 *   nodes carry { id, name, kind: 'driver'|'team', isSelf, strength }; links reference node ids that exist.
 */
export function buildConnections(payload, { selfId = '' } = {}) {
  const raw = asObjectArray(payload?.nodes).slice(0, MAX_NODES)
  const seen = new Set()
  const nodes = []
  for (const n of raw) {
    const id = safeString(n.id)
    const parsed = parseNodeId(id)
    if (!id || !parsed || seen.has(id)) continue
    seen.add(id)
    const type = safeString(n.type)
    const isSelf = n.isSelf === true || (selfId !== '' && parsed.slug === selfId)
    nodes.push({
      id, name: safeString(n.name).trim() || parsed.slug,
      kind: type === 'Team' ? 'team' : parsed.kind,
      slug: parsed.slug,
      isSelf,
      strength: asArray(n.seasons).length,
    })
  }
  const ids = new Set(nodes.map((n) => n.id))
  const links = asObjectArray(payload?.links)
    .map((l) => ({ source: safeString(typeof l.source === 'object' ? l.source?.id : l.source), target: safeString(typeof l.target === 'object' ? l.target?.id : l.target), rel: safeString(l.rel) }))
    .filter((l) => ids.has(l.source) && ids.has(l.target))
  const collator = new Intl.Collator('en', { sensitivity: 'base' })
  const connected = nodes
    .filter((n) => !n.isSelf)
    .map((n) => ({ kind: n.kind, id: n.slug, valid: isValidEntityId(n.slug), name: n.name, strength: n.strength }))
    .sort((a, b) => b.strength - a.strength || collator.compare(a.name, b.name))
    .slice(0, MAX_CONNECTED)
  return { nodes, links, connected, empty: nodes.filter((n) => !n.isSelf).length === 0 }
}
