// Pure Encyclopedia hub model (no React): URL params, hub cards, favourites and search grouping.
// Every input is an untrusted API payload: values are validated, ids are checked before they become links.
import { asArray, asObjectArray } from '../../utils/safeArray'
import { safeString } from '../../utils/safeText'
import { codeFromName } from '../../utils/driverCode'
import { CTOR_COLORS, ctorColor, ctorCode } from '../../utils/teamColors'
import { isValidEntityId, initialsOf } from '../profiles/entityId'

export const VIEWS = ['drivers', 'constructors', 'circuits']
export const VIEW_OPTIONS = [
  { value: 'drivers', label: 'Drivers' },
  { value: 'constructors', label: 'Constructors' },
  { value: 'circuits', label: 'Circuits' },
]
export const FIRST_PLAUSIBLE_SEASON = 2000

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v + 0 : null) // "+ 0" turns -0 into 0
const hasOwn = (o, k) => typeof k === 'string' && Object.hasOwn(o, k)
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true })

/**
 * `?view=` and `?season=` from the hub URL. Anything outside the allowed set is reported through `dirty`
 * so the page can drop it with `replace`; the page itself always renders a valid default.
 * `season` is only a request: the data hook falls back to the latest season that has data.
 */
export function parseHubParams(params, { currentYear }) {
  const rawView = params?.get?.('view') ?? null
  const rawSeason = params?.get?.('season') ?? null
  const view = VIEWS.includes(rawView) ? rawView : 'drivers'
  const n = typeof rawSeason === 'string' && /^\d{4}$/.test(rawSeason) ? Number(rawSeason) : null
  const season = n !== null && n >= FIRST_PLAUSIBLE_SEASON && n <= currentYear ? n : null
  return { view, season, dirty: (rawView !== null && rawView !== view) || (rawSeason !== null && season === null) }
}

/** A copy of `params` with invalid `view` / `season` values removed. */
export function cleanHubParams(params, parsed) {
  const next = new URLSearchParams(params)
  if (params.get('view') !== null && !VIEWS.includes(params.get('view'))) next.delete('view')
  if (params.get('season') !== null && parsed.season === null) next.delete('season')
  return next
}

export function splitName(name) {
  const parts = safeString(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { given: '', surname: 'Unknown' }
  if (parts.length === 1) return { given: '', surname: parts[0] }
  return { given: parts.slice(0, -1).join(' '), surname: parts[parts.length - 1] }
}

function rank(cards) {
  const sorted = [...cards].sort((a, b) =>
    b.points - a.points
    || (a.official ?? Infinity) - (b.official ?? Infinity)
    || b.wins - a.wins
    || collator.compare(a.name, b.name))
  return sorted.map((c, i) => ({ ...c, position: i + 1 }))
}

const lastOf = (list) => {
  const a = asArray(list)
  return a.length ? fin(a[a.length - 1]) : null
}

/**
 * Driver cards in standings order. `photos` is the useStandingsData photo map (id -> { photoUrl, number, code }).
 * @returns {{ id, name, given, surname, team, teamId, color, position, points, wins, number, code, photoUrl }[]}
 */
export function buildDriverCards(payload, photos) {
  const map = photos instanceof Map ? photos : new Map()
  const seen = new Set()
  const cards = []
  for (const e of asObjectArray(payload?.drivers)) {
    const id = safeString(e.driverId)
    if (!isValidEntityId(id) || seen.has(id)) continue
    seen.add(id)
    const name = safeString(e.name).trim() || 'Unknown'
    const teamId = safeString(e.teamId)
    const photo = map.get(id)
    const { given, surname } = splitName(name)
    cards.push({
      id, name, given, surname,
      team: safeString(e.team),
      teamId,
      color: ctorColor(hasOwn(CTOR_COLORS, teamId) ? teamId : ''),
      points: Math.max(0, fin(e.finalPoints) ?? lastOf(e.cumulative) ?? 0),
      wins: Math.max(0, fin(e.wins) ?? 0),
      official: typeof e.officialPosition === 'number' && e.officialPosition > 0 ? e.officialPosition : null,
      number: safeString(e.number) || safeString(photo?.number),
      code: safeString(photo?.code) || codeFromName(name),
      photoUrl: photo?.photoUrl ?? null,
    })
  }
  return rank(cards)
}

/** @returns {{ id, name, code, color, position, points, wins }[]} */
export function buildConstructorCards(payload) {
  const seen = new Set()
  const cards = []
  for (const e of asObjectArray(payload?.constructors)) {
    const id = safeString(e.constructorId)
    if (!isValidEntityId(id) || seen.has(id)) continue
    seen.add(id)
    const name = safeString(e.name).trim() || 'Unknown'
    cards.push({
      id, name,
      code: (hasOwn(CTOR_COLORS, id) ? ctorCode(id) : null) ?? initialsOf(name),
      color: ctorColor(hasOwn(CTOR_COLORS, id) ? id : ''),
      points: Math.max(0, fin(e.finalPoints) ?? lastOf(e.cumulative) ?? 0),
      wins: Math.max(0, fin(e.wins) ?? 0),
      official: typeof e.officialPosition === 'number' && e.officialPosition > 0 ? e.officialPosition : null,
    })
  }
  return rank(cards)
}

const fold = (s) => safeString(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
// Preference ids that differ from the standings ids
const TEAM_ALIAS = { racing_bulls: 'rb' }

/**
 * Moves the user's favourite to the front. Drivers match on the folded full name (the preference is "Kimi Antonelli",
 * the standings say "Andrea Kimi Antonelli", so a trailing match counts); teams match on the id.
 * The card keeps its true `position`. Nothing is pinned when the favourite is not in the list.
 * @returns {{ pinned: object[], rest: object[] }}
 */
export function matchFavorites(cards, prefs, view) {
  const list = asArray(cards)
  let hit = -1
  if (view === 'drivers' && typeof prefs?.favoriteDriver === 'string' && prefs.favoriteDriver.trim()) {
    const want = fold(prefs.favoriteDriver)
    hit = list.findIndex((c) => fold(c.name) === want)
    if (hit < 0) hit = list.findIndex((c) => fold(c.name).endsWith(` ${want}`))
  } else if (view === 'constructors' && typeof prefs?.favoriteTeam === 'string' && prefs.favoriteTeam) {
    const want = hasOwn(TEAM_ALIAS, prefs.favoriteTeam) ? TEAM_ALIAS[prefs.favoriteTeam] : prefs.favoriteTeam
    hit = list.findIndex((c) => c.id === want)
  }
  if (hit < 0) return { pinned: [], rest: list }
  return { pinned: [list[hit]], rest: list.filter((_, i) => i !== hit) }
}

const ordinal = (n) => {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' })[n % 10] ?? 'th'}`
}
const plural = (n, one, many) => (n === 1 ? one : many)

/** Sentence read by screen readers for a driver or constructor card. */
export function describeCard(card, { kind, season, favourite = false }) {
  const parts = [`${ordinal(card.position)} in the ${season} ${kind === 'driver' ? 'standings' : "constructors' standings"} with ${card.points} ${plural(card.points, 'point', 'points')} and ${card.wins} ${plural(card.wins, 'win', 'wins')}.`]
  if (kind === 'driver' && card.team) parts.push(`${card.team}.`)
  return `${favourite ? 'Favourite. ' : ''}${parts.join(' ')}`
}

/** The count line and the ordering note under the controls. */
export function resultLine(view, { count, season, roundsDone = 0, current = false }) {
  const noun = view === 'drivers' ? plural(count, 'driver', 'drivers') : view === 'constructors' ? plural(count, 'constructor', 'constructors') : plural(count, 'circuit', 'circuits')
  const head = `${count} ${noun}`
  if (view === 'circuits') return { head, note: `${count} ${plural(count, 'circuit', 'circuits')} on the ${season} calendar, in race order.` }
  if (current) return { head, note: roundsDone > 0 ? `Order shows the standings after round ${roundsDone}.` : '' }
  return { head, note: `Order shows the final ${season} standings.` }
}

// ── search ──
export const SEARCH_GROUPS = [
  { type: 'driver', key: 'drivers', title: 'Drivers' },
  { type: 'constructor', key: 'constructors', title: 'Constructors' },
  { type: 'circuit', key: 'circuits', title: 'Circuits' },
  { type: 'race', key: 'races', title: 'Races' },
]
export const SEARCH_PER_GROUP = 5

function searchItem(type, r) {
  const label = safeString(r.label).trim()
  if (!label) return null
  if (type === 'race') {
    const m = /^(\d{4})-(\d{1,2})$/.exec(safeString(r.id))
    if (!m) return null
    const season = m[1]
    const round = String(Number(m[2]))
    const meta = [`${season} · Round ${round}`, safeString(r.circuitName)].filter(Boolean).join(' · ')
    return { type, key: `race:${season}-${round}`, label, meta, href: `/races/${season}/${round}` }
  }
  const id = safeString(r.id)
  if (!isValidEntityId(id)) return null
  if (type === 'driver') {
    const nat = safeString(r.nationality)
    const num = safeString(r.number)
    return { type, key: `driver:${id}`, label, meta: [nat, num && `No. ${num}`].filter(Boolean).join(' · '), href: `/drivers/${id}` }
  }
  if (type === 'constructor') return { type, key: `constructor:${id}`, label, meta: safeString(r.nationality), href: `/constructors/${id}` }
  return { type, key: `circuit:${id}`, label, meta: [safeString(r.locality), safeString(r.country)].filter(Boolean).join(', '), href: `/circuits/${id}` }
}

/**
 * Raw /api/search rows into groups in the fixed order Drivers, Constructors, Circuits, Races (at most 5 each, empty
 * groups omitted). Rows with a malformed id or no label are dropped, so every item has a safe canonical href.
 * The API lists races first and caps the list, which is why this runs on a larger response than it shows.
 */
export function groupSearchResults(results, perGroup = SEARCH_PER_GROUP) {
  const rows = asObjectArray(results)
  const groups = []
  for (const g of SEARCH_GROUPS) {
    const seen = new Set()
    const items = []
    for (const r of rows) {
      if (r.type !== g.type) continue
      const item = searchItem(g.type, r)
      if (!item || seen.has(item.key)) continue
      seen.add(item.key)
      items.push(item)
      if (items.length >= perGroup) break
    }
    if (items.length) groups.push({ key: g.key, title: g.title, items })
  }
  return groups
}

/** Flat list of every option (group headers excluded), in display order. */
export const flattenGroups = (groups) => groups.flatMap((g) => g.items)

/** Splits a label around the first (accent-insensitive) match of the query, for weight-only highlighting. */
export function splitMatch(label, query) {
  const text = safeString(label)
  const q = fold(query)
  if (!q) return [text, '', '']
  // fold() keeps length for the Latin text we show, so indexes line up
  const folded = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const i = folded.length === text.length ? folded.indexOf(q) : -1
  if (i < 0) return [text, '', '']
  return [text.slice(0, i), text.slice(i, i + q.length), text.slice(i + q.length)]
}
