import { describe, it, expect } from 'vitest'
import {
  compoundKey, cleanStints, finalPositions, classification, outcomeOf, buildRows,
  stopsHistogram, compoundShare, longestStint, cleanPeriods, lapLeft, lapWidth,
} from '../components/tires/strategyModel'

const stint = (compound, lapStart, lapEnd, extra = {}) => ({ compound, lapStart, lapEnd, ...extra })
const driver = (driverId, acronym, fullName, stints) => ({ driverId, acronym, fullName, teamName: 'Team', stints })

describe('compoundKey / cleanStints', () => {
  it('normalizes compounds and drops unusable stints', () => {
    expect(compoundKey('soft')).toBe('SOFT')
    expect(compoundKey('SUPERSOFT')).toBe('UNKNOWN')
    expect(compoundKey(null)).toBe('UNKNOWN')
    const s = cleanStints([stint('HARD', 20, 40), stint('SOFT', 1, 19), stint('MEDIUM', 'x', 5), stint('WET', 10, 5), null])
    expect(s.map(x => x.compound)).toEqual(['SOFT', 'HARD'])
    expect(s[0].laps).toBe(19)
  })
})

describe('finalPositions', () => {
  it('reads the last lap entry and ignores the lap key', () => {
    const m = finalPositions({ laps: [{ lap: 1, 1: 2 }, { lap: 2, 1: 1, 44: 2, bad: 'x' }] })
    expect([...m]).toEqual([['1', 1], ['44', 2]])
  })
  it('handles missing data', () => {
    expect(finalPositions(null).size).toBe(0)
  })
})

describe('classification / outcomeOf', () => {
  it('matches surnames regardless of accents and case', () => {
    const c = classification({ Results: [{ position: '11', status: 'Finished', Driver: { familyName: 'Hülkenberg' } }] })
    expect(c).toEqual([{ family: 'hulkenberg', position: 11, status: 'Finished' }])
  })
  it('maps statuses to outcomes', () => {
    expect(outcomeOf('Finished')).toBe('finished')
    expect(outcomeOf('+1 Lap')).toBe('lapped')
    expect(outcomeOf('+3 Laps')).toBe('lapped')
    expect(outcomeOf('Hydraulics')).toBe('dnf')
    expect(outcomeOf('Did not start')).toBe('dns')
    expect(outcomeOf('')).toBe('unknown')
  })
})

describe('buildRows', () => {
  const strategy = [
    driver('27', 'HUL', 'Nico HULKENBERG', [stint('SOFT', 1, 20), stint('HARD', 21, 57)]),
    driver('1', 'VER', 'Max VERSTAPPEN', [stint('MEDIUM', 1, 30), stint('HARD', 31, 57)]),
    driver('77', 'BOT', 'Valtteri BOTTAS', [stint('SOFT', 1, 7)]),
  ]
  const positions = {
    totalLaps: 57,
    drivers: [{ driverId: '77', dnf: false, dns: false }],
    laps: [{ lap: 57, 1: 2, 27: 1, 77: 3 }],
  }

  it('prefers the official result for order and outcome', () => {
    const result = { Results: [
      { position: '1', status: 'Finished', Driver: { familyName: 'Verstappen' } },
      { position: '2', status: '+1 Lap', Driver: { familyName: 'Hülkenberg' } },
      { position: '20', status: 'Gearbox', Driver: { familyName: 'Bottas' } },
    ] }
    const { rows, totalLaps } = buildRows(strategy, positions, result)
    expect(totalLaps).toBe(57)
    expect(rows.map(r => r.acronym)).toEqual(['VER', 'HUL', 'BOT'])
    expect(rows[1].dnf).toBe(false)
    expect(rows[2]).toMatchObject({ dnf: true, status: 'Gearbox', lastLap: 7, stops: 0 })
  })

  it('falls back to the positions feed and marks drivers far short of the distance as retired', () => {
    const { rows } = buildRows(strategy, positions, null)
    expect(rows.map(r => r.acronym)).toEqual(['HUL', 'VER', 'BOT'])
    expect(rows.find(r => r.acronym === 'BOT').dnf).toBe(true)
    expect(rows.find(r => r.acronym === 'VER').dnf).toBe(false)
  })

  it('survives malformed input', () => {
    expect(buildRows(null, null, null)).toEqual({ rows: [], totalLaps: 0 })
    expect(buildRows([{ driverId: 5, stints: 'nope' }], null, null).rows[0]).toMatchObject({ dns: true, stops: 0 })
  })
})

describe('summary helpers', () => {
  const rows = [
    { acronym: 'A', stops: 1, dns: false, stints: cleanStints([stint('SOFT', 1, 10), stint('HARD', 11, 50)]) },
    { acronym: 'B', stops: 2, dns: false, stints: cleanStints([stint('SOFT', 1, 10), stint('SOFT', 11, 15), stint('MEDIUM', 21, 50)]) },
    { acronym: 'C', stops: 3, dns: false, stints: [] },
    { acronym: 'D', stops: 0, dns: true, stints: [] },
  ]
  it('buckets stops and skips non-starters', () => {
    expect(stopsHistogram(rows)).toEqual({ 0: 0, 1: 1, 2: 1, '3+': 1 })
  })
  it('shares laps by compound, largest first', () => {
    const s = compoundShare(rows)
    expect(s.map(c => c.compound)).toEqual(['HARD', 'MEDIUM', 'SOFT'])
    expect(s.reduce((t, c) => t + c.share, 0)).toBeCloseTo(1, 6)
  })
  it('finds the longest stint', () => {
    expect(longestStint(rows)).toMatchObject({ row: { acronym: 'A' }, stint: { laps: 40 } })
    expect(longestStint([])).toBeNull()
  })
})

describe('cleanPeriods / lap geometry', () => {
  it('keeps valid periods and clamps them to the race', () => {
    const p = cleanPeriods([{ type: 'VSC', lapStart: 40, lapEnd: 70 }, { type: 'X', lapStart: 5, lapEnd: 7 }, { lapStart: 'a', lapEnd: 2 }, { type: 'SC', lapStart: 80, lapEnd: 81 }], 57)
    expect(p).toEqual([{ type: 'VSC', lapStart: 40, lapEnd: 57 }, { type: 'SC', lapStart: 5, lapEnd: 7 }])
  })
  it('places laps on a 1-based axis', () => {
    expect(lapLeft(1, 50)).toBe(0)
    expect(lapWidth(1, 50, 50)).toBe(100)
    expect(lapLeft(26, 50) + lapWidth(26, 50, 50)).toBe(100)
  })
})
