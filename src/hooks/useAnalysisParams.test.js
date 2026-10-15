import { describe, it, expect } from 'vitest'
import { parseAnalysisParams, cleanAnalysisParams, withChoice, pastRacesOf, seasonsOf, isHistoricalSeason } from './useAnalysisParams'

const NOW = new Date('2026-06-01T00:00:00Z')
const races = [
  { raceId: '2026_9100', date: '2026-03-01T13:00:00Z' },
  { raceId: '2026_9200', date: '2026-05-01T13:00:00Z' },
  { raceId: '2026_9300', date: '2026-09-01T13:00:00Z' }, // upcoming
  { raceId: '2025_8800', date: '2025-03-01T13:00:00Z' },
  { raceId: '2025_8900', date: '2025-09-01T13:00:00Z' },
]
const sp = (q) => new URLSearchParams(q)
const parse = (q, list = races) => parseAnalysisParams(sp(q), list, { now: NOW })

describe('parseAnalysisParams', () => {
  it('defaults to pace and the latest past race of the newest season, not dirty', () => {
    expect(parse('')).toMatchObject({ view: 'pace', season: '2026', raceId: '2026_9200', dirty: false })
  })
  it('reads each view and drops invalid ones', () => {
    for (const v of ['pace', 'tyres', 'telemetry']) expect(parse(`view=${v}`)).toMatchObject({ view: v, dirty: false })
    expect(parse('view=bogus')).toMatchObject({ view: 'pace', badView: true, dirty: true })
  })
  it('honours a known race and derives the season from it', () => {
    expect(parse('race=2025_8800')).toMatchObject({ season: '2025', raceId: '2025_8800', dirty: false })
  })
  it('flags malformed and unknown races and resolves the latest past race', () => {
    for (const bad of ['junk', '2025_x', '../2025_8800', '2023_1', '2025_8800%20']) {
      const p = parse(`race=${bad}`)
      expect(p).toMatchObject({ season: '2026', raceId: '2026_9200', badRace: true, dirty: true })
    }
  })
  it('a race outside the requested season is replaced by that season latest', () => {
    expect(parse('season=2025&race=2026_9100')).toMatchObject({ season: '2025', raceId: '2025_8900', badRace: true })
  })
  it('a race is not judged before the list is known', () => {
    expect(parse('race=2025_8800', [])).toMatchObject({ raceId: '', badRace: false, dirty: false })
    expect(parse('race=junk', [])).toMatchObject({ badRace: true })
  })
  it('seasons before 2023 have no race (telemetry season view) and drop a race param', () => {
    expect(parse('view=telemetry&season=2019')).toMatchObject({ season: '2019', raceId: '', dirty: false })
    expect(parse('season=2019&race=2025_8800')).toMatchObject({ raceId: '', badRace: true })
    expect(isHistoricalSeason('2022')).toBe(true)
    expect(isHistoricalSeason('2023')).toBe(false)
  })
  it('an invalid season is dropped', () => {
    expect(parse('season=abc')).toMatchObject({ season: '2026', badSeason: true })
  })
  it('a season with no lap-data race resolves to no race', () => {
    expect(parse('season=2030')).toMatchObject({ season: '2030', raceId: '' })
  })
  it('an empty list gives no season and no race', () => {
    expect(parse('', [])).toMatchObject({ season: '', raceId: '', dirty: false })
  })
})

describe('cleanAnalysisParams / withChoice', () => {
  it('replaces a bad race with the resolved one and keeps the rest', () => {
    const q = sp('view=tyres&race=junk&x=1')
    const p = parseAnalysisParams(q, races, { now: NOW })
    expect(cleanAnalysisParams(q, p).toString()).toBe('view=tyres&race=2026_9200&x=1')
  })
  it('drops bad view and season, and a race with no resolution', () => {
    const q = sp('view=nope&season=abc')
    expect(cleanAnalysisParams(q, parseAnalysisParams(q, races, { now: NOW })).toString()).toBe('')
    const q2 = sp('season=2019&race=2025_8800')
    expect(cleanAnalysisParams(q2, parseAnalysisParams(q2, races, { now: NOW })).toString()).toBe('season=2019')
  })
  it('a view choice keeps the race; pace is the default and is not written', () => {
    expect(withChoice(sp('race=2025_8800'), { view: 'tyres' }, races).toString()).toBe('race=2025_8800&view=tyres')
    expect(withChoice(sp('view=tyres&race=2025_8800'), { view: 'pace' }, races).toString()).toBe('race=2025_8800')
  })
  it('a race choice writes the race only', () => {
    expect(withChoice(sp('season=2019&view=telemetry'), { race: '2025_8800' }, races).toString()).toBe('view=telemetry&race=2025_8800')
  })
  it('a season choice resets the race to the latest past race, or writes the season when it has none', () => {
    expect(withChoice(sp('race=2026_9100&view=tyres'), { season: '2025' }, races, NOW).toString()).toBe('race=2025_8900&view=tyres')
    expect(withChoice(sp('race=2026_9100'), { season: '2019' }, races, NOW).toString()).toBe('season=2019')
    expect(withChoice(sp('race=2026_9100'), { season: '2030' }, races, NOW).toString()).toBe('season=2030')
  })
})

describe('helpers', () => {
  it('pastRacesOf excludes future races; seasonsOf is newest first', () => {
    expect(pastRacesOf(races, 2026, NOW).map(r => r.raceId)).toEqual(['2026_9100', '2026_9200'])
    expect(seasonsOf(races)).toEqual(['2026', '2025'])
  })
})
