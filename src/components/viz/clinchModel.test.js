import { describe, it, expect } from 'vitest'
import { clinchModel } from './clinchModel'

// Cumulative helper: points per round -> running totals
const cum = (...pts) => pts.reduce((a, p) => [...a, (a.at(-1) ?? 0) + p], [])
const A = (...p) => ({ id: 'a', name: 'Ann Alpha', cumulative: cum(...p) })
const B = (...p) => ({ id: 'b', name: 'Bob Beta', cumulative: cum(...p) })

describe('clinchModel', () => {
  it('clinches early at the first round the lead beats what is left', () => {
    // 5-round 2025 season (25/GP): after R3 lead is 75-0=75 > 2*25
    const r = clinchModel({ series: [A(25, 25, 25, 0, 0), B(0, 0, 0, 25, 25)], totalRounds: 5, season: 2025 })
    expect(r).toMatchObject({ status: 'clinched', clinched: true, clinchRound: 3, racesEarly: 2, margin: 25 })
    expect(r.champion).toEqual({ id: 'a', name: 'Ann Alpha' })
    expect(r.runnerUp.id).toBe('b')
    expect(r.pointsToClinch).toBeNull()
    expect(r.leadSeries.map((p) => p.lead)).toEqual([25, 50, 75, 50, 25])
  })

  it('is decided on the final race', () => {
    const r = clinchModel({ series: [A(10, 10, 10, 10), B(10, 10, 10, 0)], totalRounds: 4, season: 2025 })
    // R3: lead 0; R4: lead 10 with nothing left
    expect(r).toMatchObject({ clinched: true, clinchRound: 4, racesEarly: 0, margin: 10 })
  })

  it('stays open mid-season and reports what the leader needs', () => {
    const r = clinchModel({ series: [A(25, 25), B(18, 18), { id: 'c', name: 'Cy', cumulative: cum(0, 0) }], totalRounds: 5, season: 2025 })
    // lead 14, 3 races left = 75 available -> needs 75 + 1 - 14 = 62 more
    expect(r).toMatchObject({ status: 'open', clinched: false, champion: null, clinchRound: null, margin: 14, pointsToClinch: 62, roundsDone: 2 })
    expect(r.alive.map((x) => x.id)).toEqual(['b', 'c'])
  })

  it('drops rivals who are mathematically out from alive', () => {
    const r = clinchModel({ series: [A(25, 25, 25), B(18, 18, 18), { id: 'c', name: 'Cy', cumulative: cum(0, 0, 0) }], totalRounds: 4, season: 2025 })
    expect(r.alive.map((x) => x.id)).toEqual(['b']) // C: 0 + 25 < 75
  })

  it('does not clinch when the lead equals what is left, and settles a final tie by input order', () => {
    expect(clinchModel({ series: [A(25, 25), B(0, 0)], totalRounds: 4, season: 2025 }).clinched).toBe(false) // 50 == 2*25
    const tie = clinchModel({ series: [A(25, 0), B(0, 25)], totalRounds: 2, season: 2025 })
    expect(tie).toMatchObject({ clinched: true, clinchRound: 2, margin: 0 })
    expect(tie.champion.id).toBe('a')
  })

  it('handles missing, empty and hostile data without throwing', () => {
    for (const bad of [undefined, {}, { series: [], totalRounds: 5 }, { series: [A(1)], totalRounds: 5 }, { series: [A(1), B(1)], totalRounds: 0 },
      { series: 'x', totalRounds: 'y' }, { series: [{ cumulative: 'z' }, null], totalRounds: 3 }]) {
      expect(clinchModel(bad)).toMatchObject({ status: 'no-data', clinched: false, champion: null })
    }
    expect(clinchModel({ series: [A(1), B(1)], totalRounds: 3, complete: [false, false] }).status).toBe('no-data')
    const holes = clinchModel({ series: [{ id: 'a', cumulative: [10, null, NaN, 40] }, { id: 'b', cumulative: [0, 0] }], totalRounds: 4, season: 2025 })
    expect(holes.leadSeries.map((p) => p.lead)).toEqual([10, 10, 10, 40])
  })

  it('uses the 26-point rule up to 2024 and 25 from 2025', () => {
    // 2 races left, lead 51: 2*26 = 52 -> open in 2024; 2*25 = 50 -> clinched in 2025
    const series = [A(51), B(0)]
    expect(clinchModel({ series, totalRounds: 3, season: 2024 }).clinched).toBe(false)
    expect(clinchModel({ series, totalRounds: 3, season: 2025 }).clinched).toBe(true)
  })

  it('counts sprint points only for sprints still to run, and 15 for constructors', () => {
    // 2025, 3 rounds, after R1 lead 51 vs 2*25 = 50
    expect(clinchModel({ series: [A(51), B(0)], totalRounds: 3, season: 2025 }).clinched).toBe(true)
    const withSprint = clinchModel({ series: [A(51), B(0)], totalRounds: 3, season: 2025, sprintRounds: [2] })
    expect(withSprint).toMatchObject({ clinched: false, sprintsKnown: true, pointsToClinch: 8 })
    const past = clinchModel({ series: [A(51), B(0)], totalRounds: 3, season: 2025, sprintRounds: [1] }) // sprint already run
    expect(past.clinched).toBe(true)
    // constructors: per GP 43, sprint 15; lead 87 beats 2*43 = 86 but not 86 + 15
    const ctor = { series: [A(87), B(0)], totalRounds: 3, season: 2025, kind: 'constructor' }
    expect(clinchModel(ctor).clinched).toBe(true)
    expect(clinchModel({ ...ctor, sprintRounds: [3] }).clinched).toBe(false)
  })

  it('skips incomplete (sprint-only) rounds when evaluating', () => {
    const r = clinchModel({ series: [A(8, 25), B(0, 0)], totalRounds: 20, season: 2025, complete: [true, false] })
    expect(r.roundsDone).toBe(1)
    expect(r.leadSeries).toEqual([{ round: 1, lead: 8 }])
  })
})
