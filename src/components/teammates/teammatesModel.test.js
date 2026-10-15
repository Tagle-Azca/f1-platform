import { describe, it, expect } from 'vitest'
import {
  parseMatchup, matchupParams, matchupHref, prettifySlug, resolveDriverName, latestTeam, seasonRange, matchupRelation,
  sharedTeams, commonTeammates, compareRows, sameTone, comparisonSentence, filterMatchups, hasNoData, surname, givenNames,
} from './teammatesModel'
import { ctorColor } from '../../styles/vizPalette'
import { MATCHUPS, MATCHUP_FILTERS, PRESET_NAMES, FEATURED } from './constants'

const P = (q) => new URLSearchParams(q)
const mc = { constructorId: 'mclaren', name: 'McLaren', seasons: ['2023', '2024', '2025', '2026'] }
const ferrari = (s) => ({ constructorId: 'ferrari', name: 'Ferrari', seasons: s })
const stats = (o = {}) => ({ races: 100, wins: 10, podiums: 30, points: 900, poles: 5, fastestLaps: 4, seasons: 5, firstSeason: '2022', lastSeason: '2026', ...o })

describe('URL state', () => {
  it('round-trips a canonical selection', () => {
    for (const [a, b] of [['norris', 'piastri'], ['norris', ''], ['', '']]) {
      const parsed = parseMatchup(matchupParams(a, b))
      expect([parsed.a, parsed.b, parsed.fix]).toEqual([a, b, false])
      expect(matchupParams(parsed.a, parsed.b).toString()).toBe(matchupParams(a, b).toString())
    }
  })
  it('omits empty keys and keeps a before b', () => {
    expect(matchupParams('', 'x').toString()).toBe('b=x')
    expect(matchupParams('a1', 'b1').toString()).toBe('a=a1&b=b1')
    expect(matchupHref('', '')).toBe('/teammates')
    expect(matchupHref('norris', 'piastri')).toBe('/teammates?a=norris&b=piastri')
  })
  it('drops malformed and duplicate ids and asks for a replace', () => {
    expect(parseMatchup(P('a=<script>&b=norris'))).toEqual({ a: 'norris', b: '', fix: true })
    expect(parseMatchup(P('a=norris&b=norris'))).toEqual({ a: 'norris', b: '', fix: true })
    expect(parseMatchup(P('a=norris&b=../x'))).toEqual({ a: 'norris', b: '', fix: true })
    expect(parseMatchup(P('b=piastri'))).toEqual({ a: 'piastri', b: '', fix: true })
    expect(parseMatchup(P('b=piastri&a=norris')).fix).toBe(true)
    expect(parseMatchup(P('foo=1'))).toEqual({ a: '', b: '', fix: false })
  })
})

describe('names and teams', () => {
  it('prettifies slugs and resolves names in priority order', () => {
    expect(prettifySlug('max_verstappen')).toBe('Max Verstappen')
    const partner = { teammates: [{ driverId: 'x', name: 'Partner Name' }] }
    expect(resolveDriverName('x', { preset: 'Preset', partnerData: partner, searchHit: 'Hit' })).toBe('Preset')
    expect(resolveDriverName('x', { partnerData: partner, searchHit: 'Hit' })).toBe('Partner Name')
    expect(resolveDriverName('x', { searchHit: 'Hit' })).toBe('Hit')
    expect(resolveDriverName('some_driver', {})).toBe('Some Driver')
  })
  it('splits names and ranges', () => {
    expect(surname('Lando Norris')).toBe('Norris')
    expect(givenNames('Max Emilian Verstappen')).toBe('Max Emilian')
    expect(seasonRange(['2024', '2022', '2023'])).toBe('2022-2024')
    expect(seasonRange(['2025'])).toBe('2025')
    expect(seasonRange([])).toBe('')
  })
  it('picks the team of the latest season', () => {
    expect(latestTeam([ferrari(['2022']), { ...mc, seasons: ['2023', '2024'] }]).constructorId).toBe('mclaren')
    expect(latestTeam([])).toBeNull()
    expect(latestTeam(null)).toBeNull()
  })
  it('flags drivers without data', () => {
    expect(hasNoData(null)).toBe(true)
    expect(hasNoData({ teams: [], teammates: [], stats: null })).toBe(true)
    expect(hasNoData({ teams: [mc], teammates: [], stats: stats() })).toBe(false)
  })
})

describe('matchupRelation', () => {
  const norris = { teams: [mc], teammates: [{ driverId: 'piastri', name: 'Oscar Piastri', seasons: ['2023', '2024'], teams: ['McLaren'] }], stats: stats() }
  const piastri = { teams: [mc], teammates: [], stats: stats() }
  it('teammates come from teammates[]', () => {
    expect(matchupRelation(norris, piastri, 'piastri')).toEqual({ kind: 'teammates', text: 'Teammates, McLaren 2023-2024', seasons: [2023, 2024] })
  })
  it('same team in different seasons', () => {
    const a = { teams: [ferrari(['2022'])], teammates: [], stats: stats() }
    const b = { teams: [ferrari(['2025'])], teammates: [], stats: stats() }
    expect(matchupRelation(a, b, 'b')).toMatchObject({ kind: 'sameTeam', text: 'Both drove for Ferrari, never together' })
  })
  it('apart, and different eras only when ranges do not overlap', () => {
    const a = { teams: [mc], teammates: [], stats: stats() }
    const b = { teams: [{ constructorId: 'williams', name: 'Williams', seasons: ['2024'] }], teammates: [], stats: stats() }
    expect(matchupRelation(a, b, 'b')).toMatchObject({ kind: 'apart', text: 'Never teammates' })
    const old = { teams: [{ constructorId: 'williams', name: 'Williams', seasons: ['2007'] }], teammates: [], stats: stats({ firstSeason: '2007', lastSeason: '2012' }) }
    expect(matchupRelation(a, old, 'b').text).toBe('Different eras, 2022-2026 vs 2007-2012')
  })
  it('lists shared teams and common teammates', () => {
    const a = { teams: [mc, ferrari(['2024'])], teammates: [{ driverId: 'p', name: 'P' }, { driverId: 'q', name: 'Q' }] }
    const b = { teams: [ferrari(['2025', '2026'])], teammates: [{ driverId: 'q', name: 'Q' }, { driverId: 'a', name: 'A' }] }
    expect(sharedTeams(a, b)).toEqual([{ constructorId: 'ferrari', name: 'Ferrari', a: '2024', b: '2025-2026' }])
    expect(commonTeammates(a, b, 'a', 'b')).toEqual([{ driverId: 'q', name: 'Q' }])
    expect(commonTeammates({}, {}, 'a', 'b')).toEqual([])
  })
})

describe('compareRows', () => {
  it('names the leader per row, ties and nulls', () => {
    const rows = compareRows(stats({ wins: 11, poles: null }), stats({ wins: 9, poles: 3, races: 100, podiums: 30 }))
    const by = Object.fromEntries(rows.map((r) => [r.key, r]))
    expect(by.wins).toMatchObject({ a: 11, b: 9, leader: 'a' })
    expect(by.podiums.leader).toBe('tie')
    expect(by.poles).toMatchObject({ a: null, b: 3, leader: null })
    expect(rows.map((r) => r.key)).toEqual(['races', 'wins', 'podiums', 'poles', 'fastestLaps', 'points', 'seasons', 'winRate'])
  })
  it('win rate needs races on both sides', () => {
    expect(compareRows(stats({ races: 0 }), stats()).some((r) => r.key === 'winRate')).toBe(false)
    expect(compareRows(stats({ wins: 1, races: 3 }), stats()).find((r) => r.key === 'winRate').a).toBe(33)
  })
  it('returns nothing without stats', () => {
    expect(compareRows(null, stats())).toEqual([])
  })
  it('missing numbers stay null, never 0', () => {
    expect(compareRows({ races: 'x' }, {}).find((r) => r.key === 'races')).toMatchObject({ a: null, b: null, leader: null })
  })
})

describe('misc', () => {
  it('detects near-identical bar colours', () => {
    expect(sameTone(ctorColor('mclaren'), ctorColor('mclaren'))).toBe(true)
    expect(sameTone(ctorColor('mclaren'), ctorColor('mercedes'))).toBe(false)
  })
  it('writes the live sentence', () => {
    const rows = compareRows(stats({ wins: 11 }), stats({ wins: 9 }))
    expect(comparisonSentence({ nameA: 'Lando Norris', nameB: 'Oscar Piastri', relation: { text: 'Teammates, McLaren 2023-2026' }, rows }))
      .toBe('Norris and Piastri. Teammates, McLaren 2023-2026. Norris leads on wins, 11 to 9.')
    expect(comparisonSentence({ nameA: 'A B', nameB: 'C D', relation: { text: 'Never teammates' }, rows: [] })).toBe('B and D. Never teammates.')
  })
  it('filters matchups by pill and drops the pair on screen in either order', () => {
    expect(filterMatchups(MATCHUPS, 'all')).toHaveLength(10)
    expect(filterMatchups(MATCHUPS, 'title').map((m) => `${m.a}-${m.b}`)).toEqual(['max_verstappen-hamilton', 'max_verstappen-norris', 'alonso-michael_schumacher'])
    expect(filterMatchups(MATCHUPS, 'teammates')).toHaveLength(4)
    expect(filterMatchups(MATCHUPS, 'classic').map((m) => m.tag)).toEqual(['Classic rivals', 'Rivalry', 'Legends'])
    expect(filterMatchups(MATCHUPS, 'all', ['piastri', 'norris'])).toHaveLength(9)
    expect(filterMatchups(MATCHUPS, 'all', ['norris', ''])).toHaveLength(10)
  })
  it('every preset id has a name and no colours', () => {
    for (const m of MATCHUPS) { expect(PRESET_NAMES[m.a]).toBeTruthy(); expect(PRESET_NAMES[m.b]).toBeTruthy(); expect(m.ctorA).toMatch(/^[a-z_]+$/); expect(m.ctorB).toMatch(/^[a-z_]+$/); expect(MATCHUP_FILTERS.map((f) => f.id)).toContain(m.filter) }
    for (const f of FEATURED) expect(PRESET_NAMES[f.driverId]).toBeTruthy()
    expect(JSON.stringify([MATCHUPS, FEATURED])).not.toMatch(/#[0-9a-f]{3,8}/i)
  })
})
