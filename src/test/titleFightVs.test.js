import { describe, it, expect } from 'vitest'
import { headToHead, statRows, neededPerRound, pointsShare } from '../components/home/titleFightVs'

const race = (round, position, grid, finished = true) => ({ round, position, grid, finished })

describe('headToHead', () => {
  it('counts finishing and starting order in shared rounds', () => {
    const a = [race(1, 1, 2), race(2, 3, 1), race(3, null, 5, false), race(4, 2, 0)]
    const b = [race(1, 2, 1), race(2, 1, 3), race(3, 4, 4), race(5, 1, 1)]
    // R1 A ahead/B on grid; R2 B ahead/A on grid; R3 A retired → B ahead, B on grid; R4/R5 not shared
    expect(headToHead(a, b)).toEqual({ race: [1, 2], quali: [1, 2] })
  })
  it('skips double retirements and equal grids; pit-lane start counts as behind', () => {
    const a = [race(1, null, 3, false), race(2, 5, 0)]
    const b = [race(1, null, 3, false), race(2, 6, 18)]
    expect(headToHead(a, b)).toEqual({ race: [1, 0], quali: [0, 1] })
  })
  it('handles malformed input', () => {
    expect(headToHead(null, 'x')).toEqual({ race: [0, 0], quali: [0, 0] })
  })
})

describe('statRows', () => {
  it('builds the comparison rows and drops empty ones', () => {
    const perfA = { stats: { wins: 8, podiums: 13, poles: 6, fastestLaps: null }, races: [race(1, 1, 1)] }
    const perfB = { stats: { wins: 3, podiums: 8, poles: 5 }, races: [race(1, 2, 2)] }
    const rows = statRows(perfA, perfB)
    expect(rows.map(r => r.key)).toEqual(['wins', 'podiums', 'poles', 'ahead', 'grid'])
    expect(rows[0]).toMatchObject({ label: 'Grand Prix wins', a: 8, b: 3 })
  })
  it('works with missing payloads', () => {
    expect(statRows(null, undefined)).toEqual([])
  })
})

describe('neededPerRound / pointsShare', () => {
  it('rounds the per-round deficit up', () => {
    expect(neededPerRound(89, 7)).toBe(13)
    expect(neededPerRound(0, 7)).toBeNull()
    expect(neededPerRound(10, 0)).toBeNull()
  })
  it('splits combined points', () => {
    expect(pointsShare(325, 236)).toBeCloseTo(0.579, 3)
    expect(pointsShare(0, 0)).toBe(0.5)
    expect(pointsShare(-5, 10)).toBe(0)
  })
})
