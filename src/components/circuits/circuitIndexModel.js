// Pure model for the Circuits index: normalising, merging the calendar, filtering, sorting and URL state.
// Every feed value is untrusted: strings stay strings, numbers must be finite, anything else becomes a neutral default.
import { cleanCoords } from '../viz/trackCoords'
import { asArray } from '../../utils/safeArray'
import { circuitType, regionOf, REGION_ORDER } from './constants'
import { isValidCircuitId } from '../../utils/circuitId'

export { CIRCUIT_ID_RE, isValidCircuitId } from '../../utils/circuitId'

export const VIEWS = ['grid', 'map']
export const TYPES = ['permanent', 'street', 'hybrid']
export const SORTS = ['calendar', 'az', 'races', 'last']
export const SORT_LABELS = { calendar: 'Calendar order', az: 'A to Z', races: 'Most races', last: 'Last held' }
const Q_MAX = 60

const str = (v) => (typeof v === 'string' ? v : '')
const obj = (v) => (v !== null && typeof v === 'object' ? v : {})

function num(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN
  if (typeof v === 'string' && v.trim() !== '') return Number(v)
  return NaN
}
const inRange = (n, lim) => (Number.isFinite(n) && Math.abs(n) <= lim ? n : null)
const wholeOr = (v, fallback) => {
  const n = num(v)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback
}

/**
 * One circuit for the UI. `raw` is an /api/circuits entry (or null for a calendar-only circuit);
 * `entry` is the matching /api/races?season= round when there is one.
 */
export function normalizeCircuit(raw, entry) {
  const src = raw !== null && typeof raw === 'object' ? raw : null
  const e = obj(entry)
  const cal = obj(e.Circuit)
  const loc = obj(src ? src.Location : cal.Location)
  const id = str(src ? src.circuitId : cal.circuitId)
  const country = str(loc.country)
  const round = wholeOr(e.round, null)
  return {
    id,
    name: str(src ? src.circuitName : cal.circuitName),
    locality: str(loc.locality),
    country,
    region: regionOf(country),
    type: circuitType(id),
    lat: inRange(num(loc.lat), 90),
    lng: inRange(num(loc.long), 180),
    coords: src ? cleanCoords(src.trackCoords) : [],
    raceCount: src ? wholeOr(src.raceCount, 0) : 0,
    lastSeason: src ? wholeOr(src.lastSeason, null) : null,
    lastRaceName: src ? str(src.lastRaceName) : '',
    url: src ? str(src.url) : '',
    calendarRound: round,
    calendarDate: str(e.date),
    calendarRaceName: str(e.raceName),
    calendarOnly: src === null,
  }
}

/**
 * Attaches `calendarRound` to circuits on the calendar and appends calendar-only entries
 * (circuits on the calendar that the circuits collection does not have).
 */
export function mergeCalendar(circuits, races) {
  const list = circuits.map((c) => ({ ...c }))
  const byId = new Map(list.map((c) => [c.id, c]))
  for (const race of asArray(races)) {
    const id = str(obj(obj(race).Circuit).circuitId)
    if (!id) continue
    const existing = byId.get(id)
    if (existing) {
      if (existing.calendarRound == null) {
        const n = normalizeCircuit(null, race)
        existing.calendarRound = n.calendarRound
        existing.calendarDate = n.calendarDate
        existing.calendarRaceName = n.calendarRaceName
      }
      continue
    }
    const entry = normalizeCircuit(null, race)
    byId.set(id, entry)
    list.push(entry)
  }
  return list
}

/** Folds case and diacritics for search. */
export const fold = (s) => str(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function filterCircuits(list, { q = '', region = '', type = '', cal = false } = {}) {
  const needle = fold(q).trim()
  return list.filter((c) => {
    if (region && c.region !== region) return false
    if (type && c.type !== type) return false
    if (cal && c.calendarRound == null) return false
    if (needle && !fold(`${c.name} ${c.locality} ${c.country}`).includes(needle)) return false
    return true
  })
}

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true })
const byName = (a, b) => collator.compare(a.name, b.name) || collator.compare(a.id, b.id)

export function sortCircuits(list, sort) {
  const out = [...list]
  if (sort === 'az') return out.sort(byName)
  if (sort === 'races') return out.sort((a, b) => b.raceCount - a.raceCount || byName(a, b))
  if (sort === 'last') return out.sort((a, b) => (b.lastSeason ?? -1) - (a.lastSeason ?? -1) || byName(a, b))
  return out.sort((a, b) => {
    const ar = a.calendarRound, br = b.calendarRound
    if (ar != null && br != null) return ar - br || byName(a, b)
    if (ar != null) return -1
    if (br != null) return 1
    return (b.lastSeason ?? -1) - (a.lastSeason ?? -1) || byName(a, b)
  })
}

/** Splits a calendar-sorted list into the "on the calendar" and "other circuits" groups; empty groups are omitted. */
export function groupByCalendar(list) {
  const onCal = list.filter((c) => c.calendarRound != null)
  const other = list.filter((c) => c.calendarRound == null)
  const groups = []
  if (onCal.length) groups.push({ key: 'calendar', circuits: onCal })
  if (other.length) groups.push({ key: 'other', circuits: other })
  return groups
}

/**
 * Circuit id of the next round. The API flags (`isCurrentWeekend`, `isUpcoming`) decide when the payload has them;
 * otherwise the first round dated today (UTC) or later. A season with nothing upcoming returns null.
 */
export function nextRoundId(races, now = new Date()) {
  const list = asArray(races).filter((r) => r !== null && typeof r === 'object')
  const idOf = (r) => str(obj(r.Circuit).circuitId) || null
  const hasFlags = list.some((r) => 'isCurrentWeekend' in r || 'isUpcoming' in r)
  if (hasFlags) {
    const hit = list.find((r) => r.isCurrentWeekend === true || r.isUpcoming === true)
    return hit ? idOf(hit) : null
  }
  const today = now.toISOString().slice(0, 10)
  const hit = list.find((r) => typeof r.date === 'string' && r.date.slice(0, 10) >= today)
  return hit ? idOf(hit) : null
}

export const regionsPresent = (list) => REGION_ORDER.filter((r) => list.some((c) => c.region === r))

// ── URL state ──
export const DEFAULT_STATE = { view: 'grid', q: '', region: '', type: '', cal: false, sort: 'calendar', c: '' }

const defaultSort = (hasCalendar) => (hasCalendar ? 'calendar' : 'az')

/** Reads URLSearchParams into a valid state; anything invalid falls back to the default. */
export function parseIndexParams(sp, { hasCalendar = true } = {}) {
  const get = (k) => sp.get(k) ?? ''
  const sort = SORTS.includes(get('sort')) ? get('sort') : defaultSort(hasCalendar)
  const region = get('region')
  const c = get('c')
  return {
    view: get('view') === 'map' ? 'map' : 'grid',
    q: get('q').trim().slice(0, Q_MAX),
    region: REGION_ORDER.includes(region) ? region : '',
    type: TYPES.includes(get('type')) ? get('type') : '',
    cal: hasCalendar && get('cal') === '1',
    sort: !hasCalendar && sort === 'calendar' ? 'az' : sort,
    c: isValidCircuitId(c) ? c : '',
  }
}

/** Serialises a state, omitting every default so the default state is a bare /circuits. `c` only travels with the map. */
export function toIndexParams(state, { hasCalendar = true } = {}) {
  const sp = new URLSearchParams()
  const s = { ...DEFAULT_STATE, ...state }
  if (s.view === 'map') sp.set('view', 'map')
  const q = str(s.q).trim().slice(0, Q_MAX)
  if (q) sp.set('q', q)
  if (REGION_ORDER.includes(s.region)) sp.set('region', s.region)
  if (TYPES.includes(s.type)) sp.set('type', s.type)
  if (hasCalendar && s.cal) sp.set('cal', '1')
  if (SORTS.includes(s.sort) && s.sort !== defaultSort(hasCalendar) && !(!hasCalendar && s.sort === 'calendar')) sp.set('sort', s.sort)
  if (s.view === 'map' && isValidCircuitId(s.c)) sp.set('c', s.c)
  return sp
}

/** Filters held by the sheet (the badge count): region, type and the calendar toggle. */
export const sheetFilterCount = (s) => (s.region ? 1 : 0) + (s.type ? 1 : 0) + (s.cal ? 1 : 0)
/** True when "Clear filters" has something to clear. */
export const hasActiveFilters = (s) => Boolean(s.q) || sheetFilterCount(s) > 0

/** Human summary of the active filters, e.g. ["Europe", "Street", "On 2026 calendar"]. */
export function filterSummary(s, season) {
  const out = []
  if (s.q) out.push(`"${s.q}"`)
  if (s.region) out.push(s.region)
  if (s.type) out.push(s.type[0].toUpperCase() + s.type.slice(1))
  if (s.cal) out.push(`On ${season} calendar`)
  return out
}
