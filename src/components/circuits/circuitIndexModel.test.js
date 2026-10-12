import { describe, it, expect } from 'vitest'
import {
  normalizeCircuit, mergeCalendar, filterCircuits, sortCircuits, groupByCalendar, nextRoundId, regionsPresent,
  parseIndexParams, toIndexParams, sheetFilterCount, hasActiveFilters, filterSummary, fold, isValidCircuitId, DEFAULT_STATE,
} from './circuitIndexModel'

const loop = Array.from({ length: 10 }, (_, i) => [i, i * 2])
const raw = (o = {}) => ({
  circuitId: 'monza', circuitName: 'Autodromo Nazionale di Monza', url: 'https://x.test/w',
  Location: { lat: '45.6156', long: '9.28111', locality: 'Monza', country: 'Italy' },
  trackCoords: loop, raceCount: 5, lastSeason: '2026', lastRaceName: 'Italian Grand Prix', ...o,
})
const cal = (id, round, extra = {}) => ({
  round: String(round), date: `2026-0${Math.min(round, 9)}-10`, raceName: `GP ${round}`,
  Circuit: { circuitId: id, circuitName: id.toUpperCase(), Location: { lat: '2.76', long: '101.74', locality: 'Kuala Lumpur', country: 'Malaysia' } }, ...extra,
})
const c = (id, o = {}) => ({ ...normalizeCircuit(raw({ circuitId: id, circuitName: id })), ...o })

describe('normalizeCircuit', () => {
  it('parses a full payload', () => {
    const n = normalizeCircuit(raw(), cal('monza', 14))
    expect(n).toMatchObject({
      id: 'monza', name: 'Autodromo Nazionale di Monza', locality: 'Monza', country: 'Italy', region: 'Europe', type: 'permanent',
      lat: 45.6156, lng: 9.28111, raceCount: 5, lastSeason: 2026, lastRaceName: 'Italian Grand Prix', calendarRound: 14, calendarOnly: false,
    })
    expect(n.coords).toHaveLength(10)
  })
  it('builds a calendar-only entry from the calendar round', () => {
    const n = normalizeCircuit(null, cal('sepang', 16))
    expect(n).toMatchObject({ id: 'sepang', name: 'SEPANG', locality: 'Kuala Lumpur', region: 'Asia', type: 'permanent', raceCount: 0, lastSeason: null, calendarOnly: true, calendarRound: 16, coords: [] })
    expect(n.lat).toBeCloseTo(2.76)
  })
  it('survives hostile payloads', () => {
    const n = normalizeCircuit({ circuitId: 5, circuitName: { a: 1 }, Location: null, trackCoords: 'x', raceCount: 'abc', lastSeason: {}, lastRaceName: 9, url: 4 })
    expect(n).toMatchObject({ id: '', name: '', locality: '', country: '', region: 'Other', lat: null, lng: null, coords: [], raceCount: 0, lastSeason: null, lastRaceName: '', url: '' })
    expect(normalizeCircuit(undefined, undefined).calendarOnly).toBe(true)
    expect(normalizeCircuit('str', 7).name).toBe('')
  })
  it('rejects non-finite or out-of-range coordinates and blank strings', () => {
    expect(normalizeCircuit(raw({ Location: { lat: '', long: 'x' } })).lat).toBeNull()
    expect(normalizeCircuit(raw({ Location: { lat: 91, long: -181 } }))).toMatchObject({ lat: null, lng: null })
    expect(normalizeCircuit(raw({ Location: { lat: Infinity, long: 12.5 } }))).toMatchObject({ lat: null, lng: 12.5 })
    expect(normalizeCircuit(raw({ raceCount: -3, lastSeason: -1 }))).toMatchObject({ raceCount: 0, lastSeason: null })
    expect(normalizeCircuit(raw({ raceCount: 4.9 })).raceCount).toBe(4)
  })
})

describe('mergeCalendar', () => {
  it('attaches rounds and appends calendar-only circuits once', () => {
    const list = [normalizeCircuit(raw())]
    const out = mergeCalendar(list, [cal('monza', 14), cal('sepang', 16), cal('sepang', 17), cal('monza', 18)])
    expect(out).toHaveLength(2)
    expect(out[0].calendarRound).toBe(14)
    expect(out[1]).toMatchObject({ id: 'sepang', calendarOnly: true, calendarRound: 16 })
    expect(list[0].calendarRound).toBeNull() // input untouched
  })
  it('ignores junk races and non-array input', () => {
    const list = [normalizeCircuit(raw())]
    expect(mergeCalendar(list, null)).toEqual(list)
    expect(mergeCalendar(list, [null, 5, {}, { Circuit: null }, { Circuit: { circuitId: 3 } }])).toHaveLength(1)
  })
})

describe('filterCircuits', () => {
  const list = [
    normalizeCircuit(raw()),
    normalizeCircuit(raw({ circuitId: 'rodriguez', circuitName: 'Autódromo Hermanos Rodríguez', Location: { lat: '19.4', long: '-99.09', locality: 'Mexico City', country: 'Mexico' } })),
    normalizeCircuit(raw({ circuitId: 'monaco', circuitName: 'Circuit de Monaco', Location: { lat: '43.7', long: '7.42', locality: 'Monte Carlo', country: 'Monaco' } })),
  ]
  list[0].calendarRound = 14
  it('returns everything with no filter', () => {
    expect(filterCircuits(list)).toHaveLength(3)
    expect(filterCircuits(list, {})).toHaveLength(3)
  })
  it('searches name, locality and country ignoring case and diacritics', () => {
    expect(filterCircuits(list, { q: 'RODRIGUEZ' }).map((x) => x.id)).toEqual(['rodriguez'])
    expect(filterCircuits(list, { q: 'autodromo' })).toHaveLength(2)
    expect(filterCircuits(list, { q: 'mexico' }).map((x) => x.id)).toEqual(['rodriguez'])
    expect(filterCircuits(list, { q: 'monte carlo' }).map((x) => x.id)).toEqual(['monaco'])
    expect(filterCircuits(list, { q: '   ' })).toHaveLength(3)
  })
  it('combines region, type and calendar with AND', () => {
    expect(filterCircuits(list, { region: 'Europe' })).toHaveLength(2)
    expect(filterCircuits(list, { region: 'Europe', type: 'street' }).map((x) => x.id)).toEqual(['monaco'])
    expect(filterCircuits(list, { cal: true }).map((x) => x.id)).toEqual(['monza'])
    expect(filterCircuits(list, { region: 'Americas', cal: true })).toEqual([])
  })
  it('fold handles non-strings', () => { expect(fold(5)).toBe('') })
})

describe('sortCircuits', () => {
  const a = c('a', { name: 'Alpha', raceCount: 2, lastSeason: 2024 })
  const b = c('b', { name: 'Bravo', raceCount: 5, lastSeason: 2026 })
  const d = c('d', { name: 'Delta', raceCount: 5, lastSeason: 2026 })
  const e = c('e', { name: 'Echo', raceCount: 0, lastSeason: null, calendarOnly: true })
  it('az sorts diacritic-insensitively and breaks ties by id', () => {
    const x = c('x', { name: 'Édouard' }), y = c('y', { name: 'Edouard' })
    expect(sortCircuits([d, y, x, a], 'az').map((q) => q.id)).toEqual(['a', 'd', 'x', 'y'])
  })
  it('races: count descending, then A-Z, calendar-only last', () => {
    expect(sortCircuits([e, a, d, b], 'races').map((q) => q.id)).toEqual(['b', 'd', 'a', 'e'])
  })
  it('last: season descending with null last, then A-Z', () => {
    expect(sortCircuits([e, a, d, b], 'last').map((q) => q.id)).toEqual(['b', 'd', 'a', 'e'])
  })
  it('calendar: rounds ascending, then off-calendar by last season, then A-Z', () => {
    const r2 = { ...a, calendarRound: 2 }, r1 = { ...b, calendarRound: 1 }, r1b = { ...d, calendarRound: 1 }
    const cs = { ...e, calendarRound: 3 }
    const out = sortCircuits([a2(), cs, r2, d0(), r1b, r1], 'calendar').map((q) => q.id)
    expect(out).toEqual(['b', 'd', 'a', 'e', 'z', 'y'])
    function a2() { return c('y', { name: 'Yankee', lastSeason: 2020 }) }
    function d0() { return c('z', { name: 'Zulu', lastSeason: 2025 }) }
  })
  it('does not mutate and defaults unknown sorts to calendar', () => {
    const list = [b, a]
    const out = sortCircuits(list, 'nope')
    expect(list[0]).toBe(b)
    expect(out).toHaveLength(2)
  })
})

describe('groupByCalendar', () => {
  it('splits and omits empty groups', () => {
    const on = c('a', { calendarRound: 1 }), off = c('b')
    expect(groupByCalendar([on, off]).map((g) => g.key)).toEqual(['calendar', 'other'])
    expect(groupByCalendar([on]).map((g) => g.key)).toEqual(['calendar'])
    expect(groupByCalendar([off]).map((g) => g.key)).toEqual(['other'])
    expect(groupByCalendar([])).toEqual([])
  })
})

describe('nextRoundId', () => {
  const r = (id, date, flags = {}) => ({ date, Circuit: { circuitId: id }, ...flags })
  const now = new Date('2026-06-15T12:00:00Z')
  it('uses the API flags first', () => {
    expect(nextRoundId([r('a', '2026-01-01', { isUpcoming: false }), r('b', '2026-09-01', { isUpcoming: true }), r('c', '2026-10-01', { isUpcoming: true })], now)).toBe('b')
    expect(nextRoundId([r('a', '2026-01-01', { isCurrentWeekend: true }), r('b', '2026-09-01', { isUpcoming: true })], now)).toBe('a')
  })
  it('returns null when flags exist but nothing is upcoming', () => {
    expect(nextRoundId([r('a', '2026-12-01', { isUpcoming: false, isCurrentWeekend: false })], now)).toBeNull()
  })
  it('falls back to the first date on or after today (UTC) when no flags exist', () => {
    expect(nextRoundId([r('a', '2026-06-14'), r('b', '2026-06-15'), r('c', '2026-07-01')], now)).toBe('b')
    expect(nextRoundId([r('a', '2026-06-14')], now)).toBeNull()
    expect(nextRoundId([r('a', '2999-12-31')])).toBe('a') // default clock
  })
  it('tolerates junk', () => {
    expect(nextRoundId(null, now)).toBeNull()
    expect(nextRoundId([null, 3, { date: 5 }, { date: '2026-07-01', Circuit: null }], now)).toBeNull()
    expect(nextRoundId([{ date: '2026-07-01', Circuit: { circuitId: 'x' } }], now)).toBe('x')
  })
})

describe('regionsPresent', () => {
  it('lists present regions in display order', () => {
    expect(regionsPresent([c('a', { region: 'Asia' }), c('b', { region: 'Europe' }), c('d', { region: 'Other' })])).toEqual(['Europe', 'Asia', 'Other'])
    expect(regionsPresent([])).toEqual([])
  })
})

describe('URL state', () => {
  const sp = (s) => new URLSearchParams(s)
  it('defaults give a bare query', () => {
    expect(parseIndexParams(sp(''))).toEqual(DEFAULT_STATE)
    expect(toIndexParams(DEFAULT_STATE).toString()).toBe('')
    expect(toIndexParams({}).toString()).toBe('')
  })
  it('round-trips every key', () => {
    const state = { view: 'map', q: 'monza', region: 'Middle East', type: 'street', cal: true, sort: 'races', c: 'monza' }
    const qs = toIndexParams(state).toString()
    expect(parseIndexParams(sp(qs))).toEqual(state)
  })
  it('falls back on invalid values and caps and trims q', () => {
    const s = parseIndexParams(sp(`view=x&q=${'a'.repeat(100)}&region=Mars&type=oval&cal=yes&sort=zzz&c=<script>`))
    expect(s).toEqual({ ...DEFAULT_STATE, q: 'a'.repeat(60) })
    expect(parseIndexParams(sp('q=%20%20hi%20%20')).q).toBe('hi')
  })
  it('ignores calendar and cal when the calendar is unavailable', () => {
    const o = { hasCalendar: false }
    expect(parseIndexParams(sp('cal=1&sort=calendar'), o)).toMatchObject({ cal: false, sort: 'az' })
    expect(parseIndexParams(sp(''), o).sort).toBe('az')
    expect(parseIndexParams(sp('sort=last'), o).sort).toBe('last')
    expect(toIndexParams({ cal: true, sort: 'az' }, o).toString()).toBe('')
    expect(toIndexParams({ sort: 'calendar' }, o).toString()).toBe('')
    expect(toIndexParams({ sort: 'last' }, o).toString()).toBe('sort=last')
  })
  it('omits the default sort and keeps c only for the map', () => {
    expect(toIndexParams({ sort: 'calendar' }).toString()).toBe('')
    expect(toIndexParams({ sort: 'az' }).toString()).toBe('sort=az')
    expect(toIndexParams({ view: 'grid', c: 'monza' }).toString()).toBe('')
    expect(toIndexParams({ view: 'map', c: '../x' }).toString()).toBe('view=map')
  })
  it('drops junk state values when serialising', () => {
    expect(toIndexParams({ q: 7, region: 'x', type: 'y', sort: 'bad' }).toString()).toBe('')
  })
})

describe('filter helpers', () => {
  it('counts sheet filters and detects active ones', () => {
    expect(sheetFilterCount(DEFAULT_STATE)).toBe(0)
    expect(sheetFilterCount({ ...DEFAULT_STATE, region: 'Asia', type: 'street', cal: true })).toBe(3)
    expect(hasActiveFilters(DEFAULT_STATE)).toBe(false)
    expect(hasActiveFilters({ ...DEFAULT_STATE, q: 'a' })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_STATE, sort: 'az', view: 'map' })).toBe(false)
  })
  it('summarises filters', () => {
    expect(filterSummary({ ...DEFAULT_STATE, q: 'mo', region: 'Europe', type: 'street', cal: true }, 2026)).toEqual(['"mo"', 'Europe', 'Street', 'On 2026 calendar'])
    expect(filterSummary(DEFAULT_STATE, 2026)).toEqual([])
  })
  it('validates circuit ids', () => {
    expect(isValidCircuitId('monza')).toBe(true)
    for (const v of ['', 'A', 'a-b', '../x', 'x'.repeat(41), 5, null]) expect(isValidCircuitId(v)).toBe(false)
  })
})
