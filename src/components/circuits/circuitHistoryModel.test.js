import { describe, it, expect } from 'vitest'
import { isDnf, normalizeRaces, resultsByYear, circuitRecords, dataSpan } from './circuitHistoryModel'

const res = (pos, grid, driver, ctor = 'ferrari', status = 'Finished', extra = {}) => ({
  position: String(pos), grid: String(grid), status,
  Driver: { driverId: driver, givenName: 'G', familyName: driver[0].toUpperCase() + driver.slice(1) },
  Constructor: { constructorId: ctor, name: ctor.toUpperCase() }, ...extra,
})
const race = (season, round, Results, extra = {}) => ({ season: String(season), round: String(round), raceName: 'Italian Grand Prix', date: `${season}-09-01`, Results, ...extra })

describe('isDnf', () => {
  it('treats Finished and lapped finishes as classified', () => {
    expect(isDnf('Finished')).toBe(false)
    expect(isDnf('+1 Lap')).toBe(false)
    expect(isDnf('+12 Laps')).toBe(false)
    expect(isDnf('Engine')).toBe(true)
    expect(isDnf('Collision')).toBe(true)
    expect(isDnf('')).toBe(true)
    expect(isDnf(undefined)).toBe(true)
  })
})

describe('normalizeRaces', () => {
  it('survives hostile input', () => {
    expect(normalizeRaces({ length: 2 })).toEqual([])
    expect(normalizeRaces(null)).toEqual([])
    expect(normalizeRaces([null, 4, { Results: 'x' }, { Results: [null, { a: 1 }] }])).toEqual([{ Results: [] }, { Results: [{ a: 1 }] }])
  })
})

describe('resultsByYear', () => {
  const races = [
    race(2023, 16, [res(2, 1, 'norris', 'mclaren'), res(1, 3, 'verstappen', 'red_bull'), res(3, 2, 'piastri', 'mclaren'), res(4, 4, 'leclerc')]),
    race(2025, 16, [res(1, 1, 'verstappen', 'red_bull'), res(2, 5, 'norris', 'mclaren')]),
    race(2024, 16, []),
    race(2025, 3, [res(1, 0, 'hamilton', 'ferrari')]),
  ]
  it('lists seasons newest first, then by round', () => {
    expect(resultsByYear(races).map((r) => `${r.season}-${r.round}`)).toEqual(['2025-16', '2025-3', '2024-16', '2023-16'])
  })
  it('builds the podium in position order and flags pole-to-win', () => {
    const [r2025, , , r2023] = resultsByYear(races)
    expect(r2025.podium.map((p) => [p.pos, p.driverId, p.constructorId, p.team])).toEqual([[1, 'verstappen', 'red_bull', 'RED_BULL'], [2, 'norris', 'mclaren', 'MCLAREN']])
    expect(r2025.poleToWin).toBe(true)
    expect(r2025.winnerGrid).toBe(1)
    expect(r2025.poleSitter.name).toBe('Verstappen')
    expect(r2023.podium.map((p) => p.pos)).toEqual([1, 2, 3])
    expect(r2023.poleToWin).toBe(false)
    expect(r2023.winnerGrid).toBe(3)
    expect(r2023.poleSitter).toMatchObject({ driverId: 'norris', pos: 2 })
  })
  it('keeps a pit-lane winner as grid 0 and a race without results', () => {
    const rows = resultsByYear(races)
    expect(rows[1]).toMatchObject({ winnerGrid: 0, poleToWin: false, poleSitter: null })
    expect(rows[2]).toMatchObject({ hasResult: false, podium: [], poleSitter: null, poleToWin: false, winnerGrid: null })
  })
  it('handles missing grid, numeric or object names, and a numeric grid', () => {
    const odd = race(2022, 1, [
      { position: '1', Driver: { driverId: 'x', givenName: 5, familyName: { a: 1 } }, Constructor: null },
      { position: 2, grid: 1, Driver: { driverId: 'y', givenName: 'Only' }, Constructor: { constructorId: 7, name: 9 } },
      { position: 'R', grid: '4', Driver: { driverId: 'z' } },
      { position: '0', Driver: null },
    ])
    const [row] = resultsByYear([odd])
    expect(row.winnerGrid).toBeNull()
    expect(row.podium[0]).toMatchObject({ name: 'Unknown', fullName: 'Unknown', constructorId: '', team: '' })
    expect(row.podium[1]).toMatchObject({ name: 'Only', fullName: 'Only' })
    expect(row.poleSitter).toMatchObject({ driverId: 'y', pos: 2 })
    expect(row.podium).toHaveLength(2)
  })
  it('puts races without a season last and tolerates junk', () => {
    expect(resultsByYear([{ raceName: 'x' }, race(2022, 1, [])]).map((r) => r.season)).toEqual([2022, null])
    expect(resultsByYear(undefined)).toEqual([])
  })
})

describe('circuitRecords', () => {
  it('returns nulls for no data', () => {
    expect(circuitRecords([])).toEqual({ mostWins: null, bestGain: null, dnfRate: null })
    expect(circuitRecords({ length: 2 })).toEqual({ mostWins: null, bestGain: null, dnfRate: null })
    expect(circuitRecords([race(2025, 1, [])]).dnfRate).toBeNull()
  })
  it('counts most wins and keeps ties', () => {
    const r = circuitRecords([
      race(2022, 1, [res(1, 1, 'verstappen')]), race(2023, 1, [res(1, 1, 'verstappen')]),
      race(2024, 1, [res(1, 1, 'norris')]), race(2025, 1, [res(1, 1, 'norris')]), race(2026, 1, [res(1, 1, 'piastri')]),
    ])
    expect(r.mostWins.count).toBe(2)
    expect(r.mostWins.drivers.map((d) => d.name)).toEqual(['Norris', 'Verstappen'])
    const single = circuitRecords([race(2022, 1, [res(1, 1, 'verstappen')]), race(2023, 1, [res(1, 1, 'verstappen')]), race(2024, 1, [res(1, 1, 'norris')])])
    expect(single.mostWins).toEqual({ drivers: [{ driverId: 'verstappen', name: 'Verstappen', count: 2 }], count: 2 })
  })
  it('skips winners without a driver id', () => {
    expect(circuitRecords([race(2022, 1, [{ position: '1', grid: '1', status: 'Finished', Driver: {} }])]).mostWins).toBeNull()
  })
  it('finds the best classified gain, excluding pit-lane starts, DNFs and non-gains', () => {
    const r = circuitRecords([
      race(2022, 1, [res(1, 20, 'a', 'x', 'Engine'), res(2, 0, 'pitlane'), res(3, 9, 'b'), res(4, 4, 'flat'), res(5, 3, 'back'), { position: 'R', grid: '5', Driver: { driverId: 'q' } }, { position: '2', grid: 'x', status: 'Finished', Driver: { driverId: 'nogrid' } }]),
    ])
    expect(r.bestGain).toMatchObject({ driverId: 'b', grid: 9, position: 3, gain: 6, season: 2022 })
  })
  it('breaks gain ties by the most recent season, then round', () => {
    const mk = (s, rd, id) => race(s, rd, [res(1, 5, id)])
    expect(circuitRecords([mk(2023, 1, 'old'), mk(2025, 1, 'new'), mk(2024, 1, 'mid')]).bestGain.driverId).toBe('new')
    expect(circuitRecords([mk(2025, 2, 'late'), mk(2025, 1, 'early')]).bestGain.driverId).toBe('late')
    expect(circuitRecords([mk(2025, 1, 'early'), mk(2025, 2, 'late')]).bestGain.driverId).toBe('late')
    expect(circuitRecords([race('x', 'y', [res(1, 5, 'nodate')]), mk(2025, 1, 'dated')]).bestGain.driverId).toBe('dated')
  })
  it('is null when nobody gained a place', () => {
    expect(circuitRecords([race(2022, 1, [res(1, 1, 'a'), res(2, 2, 'b')])]).bestGain).toBeNull()
  })
  it('computes the DNF rate from every start', () => {
    const r = circuitRecords([race(2022, 1, [res(1, 1, 'a'), res(2, 2, 'b', 'x', '+1 Lap'), res(3, 3, 'c', 'x', 'Engine'), res(4, 4, 'd', 'x', 'Collision')])])
    expect(r.dnfRate).toEqual({ dnfs: 2, starts: 4, pct: 50 })
  })
})

describe('dataSpan', () => {
  it('reports the first and last season and the race count', () => {
    expect(dataSpan([race(2024, 1, []), race(2022, 1, []), race(2026, 1, [])])).toEqual({ first: 2022, last: 2026, count: 3 })
  })
  it('is null without dated races', () => {
    expect(dataSpan([])).toBeNull()
    expect(dataSpan([{ raceName: 'x' }])).toBeNull()
    expect(dataSpan({ length: 3 })).toBeNull()
  })
})
