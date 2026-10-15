import { describe, it, expect } from 'vitest'
import { median, stdDev, formatLapTime, buildPace, toggleDriver, defaultPaceDrivers, seriesFor } from './paceModel'

const lap = (n, time, isPit = false) => ({ lap: n, time, isPit })
const mk = (id, times, pits = []) => ({ driverId: id, laps: times.map((t, i) => lap(i + 1, t, pits.includes(i + 1))) })
const drivers = [
  { driverId: 'a', acronym: 'NOR', teamName: 'McLaren' },
  { driverId: 'b', acronym: 'PIA', teamName: 'McLaren' },
  { driverId: 'c', acronym: 'VER', teamName: 'Red Bull Racing' },
]

describe('paceModel stats', () => {
  it('median and standard deviation', () => {
    expect(median([])).toBe(0)
    expect(median([3, 1, 2])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
    expect(stdDev([5])).toBe(0)
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2)
  })
  it('formats lap times and rejects junk', () => {
    expect(formatLapTime(91.234)).toBe('1:31.234')
    expect(formatLapTime(0)).toBe('-')
    expect(formatLapTime(NaN)).toBe('-')
  })
})

describe('driver selection', () => {
  it('defaults to the first three and caps toggling at five', () => {
    expect(defaultPaceDrivers(['a', 'b', 'c', 'd'].map(driverId => ({ driverId })))).toEqual(['a', 'b', 'c'])
    expect(defaultPaceDrivers(null)).toEqual([])
    const five = ['a', 'b', 'c', 'd', 'e']
    expect(toggleDriver(five, 'f')).toEqual(five)
    expect(toggleDriver(five, 'a')).toEqual(['b', 'c', 'd', 'e'])
    expect(toggleDriver(['a'], 'b')).toEqual(['a', 'b'])
  })
  it('the second driver of a team is dashed; unknown teams fall back to the series tokens', () => {
    const seen = new Set()
    expect(seriesFor('McLaren', seen, 0).dashed).toBe(false)
    expect(seriesFor('McLaren', seen, 1).dashed).toBe(true)
    expect(seriesFor('', new Set(), 0).color).toBe('var(--viz-series-1)')
    expect(seriesFor('', new Set(), 1).color).toBe('var(--viz-series-2)')
    expect(seriesFor('McLaren', new Set(), 0).color).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('buildPace', () => {
  it('is empty without data', () => {
    expect(buildPace([], drivers)).toEqual({ chartData: [], driverMeta: [], pitLines: [], scPeriods: [] })
    expect(buildPace(null, drivers).chartData).toEqual([])
  })
  it('hides pit, out and anomalous laps, collects pit lines and per-driver stats', () => {
    const a = mk('a', [95, 90, 90, 91, 140, 90], [2])
    const { chartData, driverMeta, pitLines } = buildPace([a], drivers)
    expect(pitLines).toEqual([2])
    expect(chartData.map(r => r.a)).toEqual([95, null, null, 91, null, 90])
    expect(chartData[1].a_raw).toBe(90)
    expect(driverMeta[0]).toMatchObject({ acronym: 'NOR', teamName: 'McLaren', dashed: false })
    expect(driverMeta[0].best).toBe(90)
    expect(driverMeta[0].median).toBeGreaterThan(90)
  })
  it('best is 0 (not Infinity) when a driver has no valid lap', () => {
    expect(buildPace([mk('a', [5, 300])], drivers).driverMeta[0].best).toBe(0)
  })
  it('detects a safety-car period when most drivers slow down together', () => {
    const base = Array(10).fill(90)
    const slow = (arr) => arr.map((t, i) => (i >= 4 && i <= 6 ? 110 : t))
    const { scPeriods } = buildPace([mk('a', slow(base)), mk('b', slow(base)), mk('c', slow(base))], drivers)
    expect(scPeriods).toEqual([{ x1: 5, x2: 7 }])
  })
  it('a single slow lap is not a safety car', () => {
    const t = Array(10).fill(90); t[4] = 110
    expect(buildPace([mk('a', t), mk('b', t)], drivers).scPeriods).toEqual([])
  })
  it('marks the second driver of a team dashed and falls back to the id when the driver is unknown', () => {
    const { driverMeta } = buildPace([mk('a', [90, 90]), mk('b', [91, 91]), mk('z', [92, 92])], drivers)
    expect(driverMeta.map(d => d.dashed)).toEqual([false, true, false])
    expect(driverMeta[2].acronym).toBe('z')
  })
})
