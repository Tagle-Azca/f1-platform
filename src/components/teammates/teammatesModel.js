import { isValidEntityId } from '../profiles/entityId'
import { safeString } from '../../utils/safeText'
import { contrastRatio, ctorColor, teamMark } from '../../styles/vizPalette'

export const DATA_RANGE = '2022-2026'
export const FOOTNOTE = `Career totals in Pitwall data, ${DATA_RANGE}. Points are not comparable across scoring eras.`

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Reads ?a= and ?b=. Invalid ids are dropped, b === a is dropped, a lone b moves to slot A. `fix` is true when the URL differs from the canonical form. */
export function parseMatchup(params) {
  const rawA = params.get('a') ?? ''
  const rawB = params.get('b') ?? ''
  let a = isValidEntityId(rawA) ? rawA : ''
  let b = isValidEntityId(rawB) && rawB !== a ? rawB : ''
  if (!a && b) { a = b; b = '' }
  const fix = (params.has('a') || params.has('b')) && matchupParams(a, b).toString() !== new URLSearchParams([...params].filter(([k]) => k === 'a' || k === 'b')).toString()
  return { a, b, fix }
}

/** Builds the query for a selection: empty keys are omitted, key order is a then b. */
export function matchupParams(a, b) {
  const p = new URLSearchParams()
  if (a) p.set('a', a)
  if (b) p.set('b', b)
  return p
}

export function matchupHref(a, b) {
  const q = matchupParams(a, b).toString()
  return q ? `/teammates?${q}` : '/teammates'
}

/** "max_verstappen" -> "Max Verstappen" (a stated approximation: used only when no real name is known). */
export function prettifySlug(id) {
  return safeString(id).split('_').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
}

/** Name to show for an id: preset constant, then the partner's teammates[] entry, then the search label, then the slug. */
export function resolveDriverName(id, { preset, partnerData, searchHit } = {}) {
  if (preset) return preset
  const fromPartner = (Array.isArray(partnerData?.teammates) ? partnerData.teammates : []).find((t) => t?.driverId === id)
  const n = safeString(fromPartner?.name).trim()
  if (n) return n
  const hit = safeString(searchHit).trim()
  if (hit) return hit
  return prettifySlug(id)
}

export const surname = (name) => safeString(name).trim().split(/\s+/).slice(-1)[0] || ''
export const givenNames = (name) => safeString(name).trim().split(/\s+/).slice(0, -1).join(' ')

const seasonsOf = (s) => (Array.isArray(s) ? s.map(Number).filter(Number.isFinite).sort((x, y) => x - y) : [])

/** "2023-2026", "2023" or "" for a list of seasons. */
export function seasonRange(seasons) {
  const s = seasonsOf(seasons)
  if (!s.length) return ''
  return s[0] === s[s.length - 1] ? String(s[0]) : `${s[0]}-${s[s.length - 1]}`
}

/** The team the driver raced for in the most recent season, or null. */
export function latestTeam(teams) {
  let best = null
  let bestYear = -Infinity
  for (const t of Array.isArray(teams) ? teams : []) {
    if (!t || typeof t.constructorId !== 'string') continue
    const y = Math.max(-Infinity, ...seasonsOf(t.seasons))
    if (y > bestYear) { best = t; bestYear = y }
  }
  return best
}

/** Bar and mark colour of a driver: the team they last raced for, as a contrast-safe mark. */
export const slotColor = (data) => teamMark(ctorColor(latestTeam(data?.teams)?.constructorId))

/** A driver with no race data: unknown id, or an empty connections answer. */
export const hasNoData = (data) => !data || !data.stats || !Array.isArray(data.teams) || data.teams.length === 0

/** Shared garage, shared team or nothing in common, derived from the connections of both drivers (teammates[] is authoritative). */
export function matchupRelation(aData, bData, bId) {
  const tm = (Array.isArray(aData?.teammates) ? aData.teammates : []).find((t) => t?.driverId === bId)
  if (tm) {
    const team = Array.isArray(tm.teams) && tm.teams[0] ? `${tm.teams[0]} ` : ''
    const range = seasonRange(tm.seasons)
    return { kind: 'teammates', text: `Teammates, ${team}${range}`.trim(), seasons: seasonsOf(tm.seasons) }
  }
  const common = sharedTeams(aData, bData)
  if (common.length) return { kind: 'sameTeam', text: `Both drove for ${common[0].name}, never together`, seasons: [] }
  const sa = aData?.stats
  const sb = bData?.stats
  const [fa, la, fb, lb] = [Number(sa?.firstSeason), Number(sa?.lastSeason), Number(sb?.firstSeason), Number(sb?.lastSeason)]
  if ([fa, la, fb, lb].every(Number.isFinite) && (la < fb || lb < fa)) {
    return { kind: 'apart', text: `Different eras, ${fa}-${la} vs ${fb}-${lb}`, seasons: [] }
  }
  return { kind: 'apart', text: 'Never teammates', seasons: [] }
}

/** Constructors both drivers raced for: [{ constructorId, name, a: "2019-2024", b: "2021-2023" }]. */
export function sharedTeams(aData, bData) {
  const bTeams = Array.isArray(bData?.teams) ? bData.teams : []
  const out = []
  for (const t of Array.isArray(aData?.teams) ? aData.teams : []) {
    const o = bTeams.find((x) => x?.constructorId === t?.constructorId)
    if (t && o) out.push({ constructorId: t.constructorId, name: safeString(t.name) || prettifySlug(t.constructorId), a: seasonRange(t.seasons), b: seasonRange(o.seasons) })
  }
  return out
}

/** Drivers who were teammates of both (neither of the two themselves). */
export function commonTeammates(aData, bData, aId, bId) {
  const bm = Array.isArray(bData?.teammates) ? bData.teammates : []
  return (Array.isArray(aData?.teammates) ? aData.teammates : [])
    .filter((t) => t && t.driverId !== aId && t.driverId !== bId && bm.some((o) => o?.driverId === t.driverId))
    .map((t) => ({ driverId: t.driverId, name: safeString(t.name) || prettifySlug(t.driverId) }))
}

const ROWS = [['races', 'Races'], ['wins', 'Wins'], ['podiums', 'Podiums'], ['poles', 'Poles'], ['fastestLaps', 'Fastest laps'], ['points', 'Points'], ['seasons', 'Seasons']]

/** Rows of the mirrored comparison. Missing values stay null (an en dash, never 0). leader: 'a' | 'b' | 'tie' | null. */
export function compareRows(sa, sb) {
  if (!sa || !sb) return []
  const rows = ROWS.map(([key, label]) => ({ key, label, a: num(sa[key]), b: num(sb[key]) }))
  const winRate = (s) => (num(s.races) > 0 && num(s.wins) !== null ? Math.round((s.wins / s.races) * 100) : null)
  const [wa, wb] = [winRate(sa), winRate(sb)]
  if (wa !== null && wb !== null) rows.push({ key: 'winRate', label: 'Win rate', a: wa, b: wb, unit: '%' })
  return rows.map((r) => ({ ...r, leader: r.a === null || r.b === null ? null : r.a === r.b ? 'tie' : r.a > r.b ? 'a' : 'b' }))
}

/** Bars of the same hue are told apart by opacity when the two team colours are (nearly) the same. */
export const sameTone = (colorA, colorB) => colorA === colorB || contrastRatio(colorA, colorB) < 1.3

/** One sentence for the live region. */
export function comparisonSentence({ nameA, nameB, relation, rows }) {
  const wins = rows.find((r) => r.key === 'wins')
  let lead = ''
  if (wins?.leader === 'a' || wins?.leader === 'b') {
    const [who, hi, lo] = wins.leader === 'a' ? [nameA, wins.a, wins.b] : [nameB, wins.b, wins.a]
    lead = ` ${surname(who)} leads on wins, ${hi} to ${lo}.`
  }
  return `${surname(nameA)} and ${surname(nameB)}. ${relation.text}.${lead}`
}

/** Matchups for one filter pill ('all' keeps every one), minus the pair already on screen (either order). */
export function filterMatchups(list, filter, exclude = []) {
  const [x, y] = exclude
  const open = (m) => Boolean(x && y) && ((m.a === x && m.b === y) || (m.a === y && m.b === x))
  return list.filter((m) => (filter === 'all' || m.filter === filter) && !open(m))
}
