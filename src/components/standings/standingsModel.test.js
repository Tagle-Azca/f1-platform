import { describe, it, expect } from 'vitest'
import {
  normalizeSeries, normalizeRounds, rankAt, positionsByRound, pointsPerRound, hasPenalty, rowDetail, heroModel,
  seasonStatus, doneAt, roundLabel, roundText, chartCap, discoverSeasons, surnameOf, gapLabel,
} from './standingsModel'
import { titleFightModel, maxDriverPointsPerGp, maxConstructorPointsPerGp } from '../viz/pointsModel'

const rounds = [
  { round: '1', raceName: 'Australian GP', date: '2026-03-08', complete: true },
  { round: '2', raceName: 'Chinese GP', date: '2026-03-15', complete: true },
  { round: '3', raceName: 'Japanese GP', date: '2026-03-29', complete: true },
]
const payload = (over = {}) => ({
  rounds,
  totalRounds: 5,
  drivers: [
    { driverId: 'ver', name: 'Max Verstappen', team: 'Red Bull', teamId: 'red_bull', wins: 2, number: '1', cumulative: [25, 43, 68] },
    { driverId: 'tsu', name: 'Yuki Tsunoda', team: 'Red Bull', teamId: 'red_bull', wins: 0, number: '22', cumulative: [10, 20, 30] },
    { driverId: 'nor', name: 'Lando Norris', team: 'McLaren', teamId: 'mclaren', wins: 1, number: '4', cumulative: [18, 43, 61] },
    { driverId: 'lec', name: 'Charles Leclerc', team: 'Ferrari', teamId: 'ferrari', wins: 0, number: '16', cumulative: [15, 30, 50] },
  ],
  constructors: [
    { constructorId: 'mclaren', name: 'McLaren', wins: 1, cumulative: [30, 70, 100] },
    { constructorId: 'ferrari', name: 'Ferrari', wins: 0, cumulative: [20, 50, 80] },
    { constructorId: 'red_bull', name: 'Red Bull', wins: 2, cumulative: [35, 63, 98] },
  ],
  ...over,
})
const drivers = () => normalizeSeries(payload(), 'drivers')
const ctors = () => normalizeSeries(payload(), 'constructors')

describe('normalizeSeries', () => {
  it('produces the same shape for drivers and constructors', () => {
    const d = drivers()[0]
    const c = ctors()[0]
    expect(Object.keys(d).sort()).toEqual(Object.keys(c).sort())
    expect(d).toMatchObject({ id: 'ver', kind: 'driver', surname: 'Verstappen', code: 'VER', team: 'Red Bull', teamKey: 'red_bull', wins: 2, number: '1', total: 68 })
    expect(c).toMatchObject({ id: 'mclaren', kind: 'constructor', name: 'McLaren', surname: 'McLaren', code: 'MCL', teamKey: 'mclaren', total: 100, dash: false })
  })
  it('marks the lower-scoring teammate as dashed (drivers only)', () => {
    const d = drivers()
    expect(d.find(s => s.id === 'tsu').dash).toBe(true)
    expect(d.find(s => s.id === 'ver').dash).toBe(false)
    expect(ctors().every(s => !s.dash)).toBe(true)
  })
  it('handles empty and hostile input', () => {
    expect(normalizeSeries(null)).toEqual([])
    expect(normalizeSeries({ drivers: 'abc' })).toEqual([])
    expect(normalizeSeries({ constructors: { length: 2 } }, 'constructors')).toEqual([])
    const hostile = normalizeSeries({
      rounds: [{}, {}],
      drivers: [
        { driverId: 7, name: 12, team: { a: 1 }, teamId: ['x'], wins: 'many', number: {}, cumulative: [5, 'x'] },
        { driverId: 7, name: '   ', team: 'T', teamId: '__proto__', cumulative: 'no' },
        { driverId: 'constructor', name: 'Z', teamId: 'constructor', cumulative: [1, null, NaN] },
        null, 5, 'x',
      ],
    })
    expect(hostile).toHaveLength(3)
    expect(hostile[0]).toMatchObject({ id: '7', name: '12', team: '', teamKey: '', wins: 0, number: '', cumulative: [5, 5] })
    expect(hostile[1].id).toBe('7-1')
    expect(hostile[1]).toMatchObject({ name: 'Unknown', cumulative: [0, 0] })
    expect(typeof hostile[1].color).toBe('string')
    expect(typeof hostile[2].color).toBe('string')
    expect(hostile[2].cumulative).toEqual([1, 1])
    const ctor = normalizeSeries({ constructors: [{ constructorId: 'weird_team', name: 'Weird', cumulative: [1] }, { name: 'No id', cumulative: [2] }] }, 'constructors')
    expect(ctor[0].code).toBe('WEI')
    expect(ctor[1].id).toBe('constructor-1')
  })
  it('sizes cumulative to the number of rounds, or to the longest series without rounds', () => {
    const a = normalizeSeries({ rounds: [{}, {}, {}], drivers: [{ driverId: 'a', cumulative: [1, 2, 3, 4, 5] }, { driverId: 'b', cumulative: [1] }] })
    expect(a.map(s => s.cumulative)).toEqual([[1, 2, 3], [1, 1, 1]])
    const b = normalizeSeries({ drivers: [{ driverId: 'a', cumulative: [1, 2] }, { driverId: 'b', cumulative: [1] }] })
    expect(b.map(s => s.cumulative)).toEqual([[1, 2], [1, 1]])
    const none = normalizeSeries({ drivers: [{ driverId: 'a' }] })
    expect(none[0]).toMatchObject({ cumulative: [], total: 0 })
  })
  it('surnameOf', () => {
    expect(surnameOf('Andrea Kimi Antonelli')).toBe('Antonelli')
    expect(surnameOf('')).toBe('Unknown')
    expect(surnameOf(null)).toBe('Unknown')
  })
})

describe('rankAt', () => {
  it('ranks, computes the gap and the place change, and clamps the round', () => {
    const s = drivers()
    const r3 = rankAt(s, 3)
    expect(r3.map(r => r.id)).toEqual(['ver', 'nor', 'lec', 'tsu'])
    expect(r3.map(r => r.gap)).toEqual([0, 7, 18, 38])
    expect(r3.map(r => r.pos)).toEqual([1, 2, 3, 4])
    expect(rankAt(s, 99)).toBe(r3)
    expect(rankAt(s, 0)).toBe(rankAt(s, 1))
    expect(rankAt(s, NaN)).toBe(rankAt(s, 1))
  })
  it('delta is the places gained since the previous round (0 at round 1)', () => {
    const s = drivers()
    expect(rankAt(s, 1).every(r => r.delta === 0)).toBe(true)
    // round 1: ver 25, nor 18, lec 15, tsu 10. round 2: ver 43, nor 43 -> tie, ver wins on total.
    expect(rankAt(s, 2).map(r => [r.id, r.delta])).toEqual([['ver', 0], ['nor', 0], ['lec', 0], ['tsu', 0]])
    const swap = normalizeSeries({ rounds: [{}, {}], drivers: [{ driverId: 'a', name: 'A', cumulative: [10, 11] }, { driverId: 'b', name: 'B', cumulative: [5, 20] }] })
    expect(rankAt(swap, 2).map(r => [r.id, r.delta])).toEqual([['b', 1], ['a', -1]])
  })
  it('breaks ties on points, then the final total, then the name, then the id', () => {
    const t = normalizeSeries({
      rounds: [{}, {}],
      drivers: [
        { driverId: 'z', name: 'Zed', cumulative: [10, 10] },
        { driverId: 'a', name: 'Amy', cumulative: [10, 10] },
        { driverId: 'q', name: 'Amy', cumulative: [10, 10] },
        { driverId: 'big', name: 'Big', cumulative: [2, 10] },
        { driverId: 'late', name: 'Late', cumulative: [10, 10, ].slice(0, 2) },
      ],
    })
    // identical points and totals: name, then id
    expect(rankAt(t, 2).map(r => r.id)).toEqual(['a', 'q', 'big', 'late', 'z'])
    const totals = normalizeSeries({ rounds: [{}, {}], drivers: [{ driverId: 'low', name: 'A', cumulative: [10, 10] }, { driverId: 'high', name: 'B', cumulative: [10, 12] }] })
    expect(rankAt(totals, 1).map(r => r.id)).toEqual(['high', 'low'])
    expect(rankAt(t, 2).map(r => r.pos)).toEqual([1, 2, 3, 4, 5])
  })
  it('handles empty input and a single round', () => {
    expect(rankAt([], 1)).toEqual([])
    const one = normalizeSeries({ rounds: [{}], drivers: [{ driverId: 'a', name: 'A', cumulative: [3] }, { driverId: 'b', name: 'B', cumulative: [7] }] })
    expect(rankAt(one, 1).map(r => [r.id, r.delta])).toEqual([['b', 0], ['a', 0]])
    expect(rankAt(one, 5)).toBe(rankAt(one, 1))
  })
  it('works for series with no cumulative data', () => {
    const e = normalizeSeries({ drivers: [{ driverId: 'a' }] })
    expect(rankAt(e, 1)[0]).toMatchObject({ pts: 0, pos: 1 })
  })
})

describe('positionsByRound', () => {
  it('returns one rank per round per entry', () => {
    const p = positionsByRound(drivers())
    expect(p.find(x => x.id === 'ver').positions).toEqual([1, 1, 1])
    expect(p.find(x => x.id === 'tsu').positions).toEqual([4, 4, 4])
    expect(positionsByRound([])).toEqual([])
  })
})

describe('pointsPerRound', () => {
  it('returns per-round deltas and clamps negatives to 0', () => {
    expect(pointsPerRound([25, 43, 68])).toEqual([25, 18, 25])
    expect(pointsPerRound([25, 20, 30])).toEqual([25, 0, 10])
    expect(hasPenalty([25, 20, 30])).toBe(true)
    expect(hasPenalty([25, 43])).toBe(false)
    expect(pointsPerRound(null)).toEqual([])
    expect(pointsPerRound([1, 'x', 3])).toEqual([1, 0, 3])
    expect(hasPenalty(undefined)).toBe(false)
  })
})

describe('rowDetail', () => {
  it('drivers: sparkline data, best round, last 5 and the teammate', () => {
    const d = rowDetail(drivers(), 'ver')
    expect(d.perRound).toEqual([25, 18, 25])
    expect(d.bestRound).toEqual({ round: 1, pts: 25 })
    expect(d.last5).toEqual([25, 18, 25])
    expect(d.last5Sum).toBe(68)
    expect(d.teammate).toMatchObject({ id: 'tsu', surname: 'Tsunoda', pts: 30, diff: 38 })
    expect(d.ahead).toBeNull()
    expect(d.penalty).toBe(false)
  })
  it('follows the replay round', () => {
    const d = rowDetail(drivers(), 'ver', 2)
    expect(d.last5).toEqual([25, 18])
    expect(d.bestRound).toEqual({ round: 1, pts: 25 })
    expect(d.teammate.pts).toBe(20)
    expect(rowDetail(drivers(), 'ver', 99).last5Sum).toBe(68)
  })
  it('last 5 keeps only the five newest rounds', () => {
    const s = normalizeSeries({ rounds: Array.from({ length: 7 }, () => ({})), drivers: [{ driverId: 'a', name: 'A', cumulative: [1, 2, 3, 4, 5, 6, 7] }] })
    expect(rowDetail(s, 'a').last5).toEqual([1, 1, 1, 1, 1])
    expect(rowDetail(s, 'a').teammate).toBeNull()
  })
  it('constructors: gap to the team ahead, null for the leader, no teammate', () => {
    const c = ctors()
    expect(rowDetail(c, 'red_bull').ahead).toEqual({ id: 'mclaren', name: 'McLaren', gap: 2 })
    expect(rowDetail(c, 'red_bull').teammate).toBeNull()
    expect(rowDetail(c, 'mclaren').ahead).toBeNull()
    expect(rowDetail(c, 'ferrari').ahead).toEqual({ id: 'red_bull', name: 'Red Bull', gap: 18 })
  })
  it('a driver without a team has no teammate; unknown ids and empty series give null; penalties flag', () => {
    const s = normalizeSeries({ rounds: [{}, {}], drivers: [{ driverId: 'a', name: 'A', cumulative: [5, 3] }, { driverId: 'b', name: 'B', cumulative: [1, 2] }] })
    expect(rowDetail(s, 'a').teammate).toBeNull()
    expect(rowDetail(s, 'a').penalty).toBe(true)
    expect(rowDetail(s, 'nope')).toBeNull()
    const empty = normalizeSeries({ drivers: [{ driverId: 'a' }] })
    expect(rowDetail(empty, 'a')).toMatchObject({ perRound: [], bestRound: null, last5: [], last5Sum: 0 })
  })
  it('with a mid-season swap the teammate is whoever has more points at that round', () => {
    const s = normalizeSeries({ rounds: [{}, {}], drivers: [
      { driverId: 'a', name: 'A', teamId: 'ferrari', cumulative: [10, 30] },
      { driverId: 'b', name: 'B', teamId: 'ferrari', cumulative: [8, 9] },
      { driverId: 'c', name: 'C', teamId: 'ferrari', cumulative: [1, 20] },
      { name: 'No id', teamId: 'ferrari', cumulative: [0, 0] },
    ] })
    expect(s[3].id).toBe('driver-3')
    expect(rowDetail(s, 'a').teammate.id).toBe('c')
    expect(rowDetail(s, 'a', 1).teammate.id).toBe('b')
  })
  it('best round ties resolve to the earliest round', () => {
    const s = normalizeSeries({ rounds: [{}, {}], drivers: [{ driverId: 'a', name: 'A', cumulative: [10, 20] }] })
    expect(rowDetail(s, 'a').bestRound).toEqual({ round: 1, pts: 10 })
  })
})

describe('seasonStatus', () => {
  it('counts complete rounds and the remaining Grands Prix', () => {
    const st = seasonStatus(payload(), { current: true })
    expect(st).toMatchObject({ roundsDone: 3, totalRounds: 5, knownTotal: true, remaining: 2, partial: false, chipLabel: null, count: 3 })
  })
  it('a past season that is short of the calendar is partial with a chip', () => {
    const st = seasonStatus(payload(), { current: false })
    expect(st.partial).toBe(true)
    expect(st.chipLabel).toBe('3 of 5 rounds')
  })
  it('an old backend (no totalRounds, no complete) shows no chip and counts every round', () => {
    const old = { rounds: rounds.map(({ round, raceName }) => ({ round, raceName })), drivers: payload().drivers }
    const st = seasonStatus(old, { current: false })
    expect(st).toMatchObject({ roundsDone: 3, totalRounds: 3, knownTotal: false, remaining: 0, partial: false, chipLabel: null })
    expect(seasonStatus(old).partial).toBe(false)
    expect(seasonStatus({ ...old, totalRounds: 'x' }).knownTotal).toBe(false)
  })
  it('a sprint-only last entry does not count as a done round and is flagged', () => {
    const p = payload({
      rounds: [...rounds, { round: '4', raceName: 'Singapore GP', complete: false }],
      drivers: payload().drivers.map(d => ({ ...d, cumulative: [...d.cumulative, d.cumulative[2] + 6] })),
    })
    const st = seasonStatus(p, { current: true })
    expect(st.roundsDone).toBe(3)
    expect(st.remaining).toBe(2)
    expect([...st.sprintOnly]).toEqual([3])
    expect(doneAt(st, 4)).toBe(3)
    expect(doneAt(st, 3)).toBe(3)
  })
  it('an incomplete entry without points is not a sprint-only entry', () => {
    const p = payload({ rounds: [...rounds, { round: '4', raceName: 'Future GP', complete: false }], drivers: payload().drivers.map(d => ({ ...d, cumulative: [...d.cumulative, d.cumulative[2]] })) })
    expect(seasonStatus(p).sprintOnly.size).toBe(0)
  })
  it('empty and hostile payloads', () => {
    expect(seasonStatus(null)).toMatchObject({ roundsDone: 0, totalRounds: 0, remaining: 0, partial: false, count: 0 })
    expect(seasonStatus({ rounds: 'x', drivers: { length: 3 }, totalRounds: -4 })).toMatchObject({ roundsDone: 0, knownTotal: false })
    const odd = seasonStatus({ rounds: [{}, null, { complete: 'no' }], drivers: [{ cumulative: [1, 2, 3] }, null] })
    expect(odd.roundsDone).toBe(2)
    expect(normalizeRounds({ rounds: [{ round: 3, raceName: 4 }] })[0]).toMatchObject({ round: '3', raceName: '4' })
    expect(normalizeRounds({ rounds: [{}] })[0].round).toBe('1')
  })
  it('doneAt', () => {
    const st = seasonStatus(payload())
    expect(doneAt(st, 0)).toBe(0)
    expect(doneAt(st, 2)).toBe(2)
    expect(doneAt(st, 50)).toBe(3)
    expect(doneAt(seasonStatus(null), 3)).toBe(0)
  })
})

describe('roundLabel and roundText', () => {
  const rs = [{ round: '12', raceName: 'British GP' }, { round: '17', raceName: 'Singapore GP' }, { round: '18' }]
  it('compact, full, sprint and missing-name forms', () => {
    expect(roundLabel(rs, 0, { compact: true, total: 22 })).toBe('R12/22')
    expect(roundLabel(rs, 0, { compact: true })).toBe('R12/3')
    expect(roundLabel(rs, 0)).toBe('R12 · British GP')
    expect(roundLabel(rs, 1, { sprintOnly: new Set([1]) })).toBe('R17 · Singapore GP, sprint')
    expect(roundLabel(rs, 1, { compact: true, total: 24, sprintOnly: new Set([1]) })).toBe('R17/24')
    expect(roundLabel(rs, 2)).toBe('R18')
    expect(roundLabel(rs, 9)).toBe('')
    expect(roundLabel([{}], 0)).toBe('R1')
    expect(roundLabel(null, 0)).toBe('')
  })
  it('aria text', () => {
    expect(roundText(rs, 0)).toBe('After round 12, British GP')
    expect(roundText(rs, 1, { sprintOnly: new Set([1]) })).toBe('After round 17, Singapore GP, sprint')
    expect(roundText(rs, 2)).toBe('After round 18')
    expect(roundText([{}], 0)).toBe('After round 1')
    expect(roundText(rs, 7)).toBe('')
  })
})

describe('heroModel', () => {
  const rowsAt = (r) => rankAt(drivers(), r)
  it('fight mid-season: remaining from complete rounds, in play from the per-season rule', () => {
    const h = heroModel(rowsAt(3), { season: 2026, current: true, totalRounds: 4, roundsDone: 3 })
    expect(h).toMatchObject({ kind: 'fight', remaining: 1, perGp: 25, inPlay: 25, gap: 7, margin: 7, decided: false, marksOut: true })
    expect(h.podium.map(r => r.id)).toEqual(['ver', 'nor', 'lec'])
    expect([...h.contenders]).toEqual(['ver', 'nor', 'lec'])
    expect(h.contenders.has('tsu')).toBe(false)
  })
  it('uses 26 for 2022-2024 and +18 for constructors', () => {
    expect(heroModel(rowsAt(3), { season: 2024, current: true, totalRounds: 5, roundsDone: 3 }).perGp).toBe(26)
    const c = heroModel(rankAt(ctors(), 3), { view: 'constructors', season: 2026, current: true, totalRounds: 5, roundsDone: 3 })
    expect(c.perGp).toBe(43)
    expect(c.inPlay).toBe(86)
    expect(heroModel(rankAt(ctors(), 3), { view: 'constructors', season: 2023, totalRounds: 5, roundsDone: 3 }).perGp).toBe(44)
  })
  it('champion only at the end of a finished season', () => {
    const base = { season: 2025, current: false, totalRounds: 3, roundsDone: 3 }
    expect(heroModel(rowsAt(3), { ...base, atEnd: true }).kind).toBe('champion')
    expect(heroModel(rowsAt(3), base).kind).toBe('champion')
    expect(heroModel(rowsAt(2), { ...base, roundsDone: 2, atEnd: false }).kind).toBe('fight')
    expect(heroModel(rowsAt(3), { ...base, atEnd: false }).kind).toBe('fight')
    expect(heroModel(rowsAt(3), { ...base, current: true }).kind).toBe('fight')
    // past season short of the calendar is not a finished season
    expect(heroModel(rowsAt(3), { ...base, totalRounds: 5 }).kind).toBe('fight')
    // no known total: any past season is finished
    expect(heroModel(rowsAt(3), { season: 2025, totalRounds: null, roundsDone: 3 }).kind).toBe('champion')
    expect(heroModel(rowsAt(3), { season: 2025, current: true, totalRounds: null }).kind).toBe('fight')
  })
  it('inPlay equal to the gap: decided is true and the runner-up is still a contender', () => {
    const rows = rankAt(normalizeSeries({ rounds: [{}], drivers: [{ driverId: 'a', name: 'A', cumulative: [75] }, { driverId: 'b', name: 'B', cumulative: [25] }, { driverId: 'c', name: 'C', cumulative: [24] }] }), 1)
    const h = heroModel(rows, { season: 2026, current: true, totalRounds: 3, roundsDone: 1 })
    expect(h.inPlay).toBe(50)
    expect(h.gap).toBe(50)
    expect(h.decided).toBe(true)
    expect(h.contenders.has('b')).toBe(true)
    expect(h.contenders.has('c')).toBe(false)
  })
  it('marks nobody out when nothing is in play', () => {
    const h = heroModel(rowsAt(3), { season: 2026, current: true, totalRounds: 3, roundsDone: 3 })
    expect(h.inPlay).toBe(0)
    expect(h.marksOut).toBe(false)
    expect(h.contenders.size).toBe(4)
  })
  it('copes with one entry, none, and defaults', () => {
    const one = heroModel(rowsAt(3).slice(0, 1), { totalRounds: 5, roundsDone: 1 })
    expect(one).toMatchObject({ gap: 0, decided: false })
    expect(heroModel([], {}).podium).toEqual([])
    expect(heroModel([]).kind).toBe('champion')
    expect(heroModel(rowsAt(3), { totalRounds: 2, roundsDone: 9 }).remaining).toBe(0)
  })
  it('parity: same inPlay and decided as the Dashboard titleFightModel', () => {
    const rows = rowsAt(3)
    const standings = rows.map(r => ({ driverId: r.id, name: r.name, points: r.pts }))
    for (const [season, total, done] of [[2026, 24, 17], [2024, 24, 12], [2026, 5, 3], [2026, 3, 3], [2025, 4, 3]]) {
      const hero = heroModel(rows, { season, current: true, totalRounds: total, roundsDone: done })
      const dash = titleFightModel(standings, total, done, season)
      expect(hero.inPlay).toBe(dash.inPlay)
      expect(hero.decided).toBe(dash.decided)
      expect(hero.remaining).toBe(dash.remaining)
    }
    // the documented example: 7 rounds left in 2026 is 175 points in play
    expect(heroModel(rows, { season: 2026, current: true, totalRounds: 24, roundsDone: 17 }).inPlay).toBe(175)
  })
})

describe('points per Grand Prix', () => {
  it('drivers: 26 for 2022-2024, 25 from 2025 and when missing or invalid', () => {
    for (const y of [2022, 2023, 2024, '2024']) expect(maxDriverPointsPerGp(y)).toBe(26)
    for (const y of [2025, 2026, '2026', undefined, null, '', ' ', 'abc', NaN, 2025.5, 1900, {}]) expect(maxDriverPointsPerGp(y)).toBe(25)
  })
  it('constructors: the driver value + 18', () => {
    expect(maxConstructorPointsPerGp(2024)).toBe(44)
    expect(maxConstructorPointsPerGp(2026)).toBe(43)
    expect(maxConstructorPointsPerGp()).toBe(43)
  })
})

describe('chartCap', () => {
  const twenty = normalizeSeries({
    rounds: [{}, {}, {}],
    drivers: Array.from({ length: 20 }, (_, i) => ({
      driverId: `d${i}`, name: `Driver ${String.fromCharCode(65 + i)}`,
      // d19 starts last but drops to the very bottom later; d12 is 13th at the end
      cumulative: [100 - i * 3, 200 - i * 3, 300 - i * 3],
    })),
  })
  it('caps at 10 by default and for a small field returns everything', () => {
    expect(chartCap(twenty, {})).toEqual({ max: 10, total: 20, capped: true })
    expect(chartCap(twenty.slice(0, 8), {})).toEqual({ max: 8, total: 8, capped: false })
    expect(chartCap(twenty, { showAll: true })).toEqual({ max: 20, total: 20, capped: false })
    expect(chartCap([], {})).toEqual({ max: 0, total: 0, capped: false })
  })
  it('widens to the selected entry worst rank; hover is not an input', () => {
    const w = chartCap(twenty, { selectedId: 'd12' })
    expect(w).toEqual({ max: 13, total: 20, capped: true })
    expect(chartCap(twenty, { selectedId: 'd2' }).max).toBe(10)
    expect(chartCap(twenty, { selectedId: 'd19' })).toEqual({ max: 20, total: 20, capped: false })
    expect(chartCap(twenty, { selectedId: 'nobody' }).max).toBe(10)
    expect(chartCap(twenty, { hoverId: 'd15' }).max).toBe(10)
    expect(chartCap(twenty, { selectedId: 'd12', positions: positionsByRound(twenty) }).max).toBe(13)
  })
})

describe('discoverSeasons', () => {
  it('keeps years that have rounds, newest first', () => {
    const probes = [
      { year: 2020, payload: { rounds: [], drivers: [] } },
      { year: 2026, payload: { rounds: [{}] } },
      { year: 2022, payload: { rounds: [{}, {}] } },
      { year: '2024', payload: { rounds: [{}] } },
      { year: 2025, payload: null },
      { year: 'x', payload: { rounds: [{}] } },
      null,
    ]
    expect(discoverSeasons(probes)).toEqual([2026, 2024, 2022])
    expect(discoverSeasons(null)).toEqual([])
  })
})

describe('ties on points', () => {
  const tied = (extra = {}) => normalizeSeries({
    rounds: [{}, {}],
    drivers: [
      { driverId: 'a', name: 'Aaa', wins: 0, cumulative: [50, 50], ...extra.a },
      { driverId: 'b', name: 'Bbb', wins: 4, cumulative: [50, 50], ...extra.b },
      { driverId: 'c', name: 'Ccc', wins: 2, cumulative: [50, 50], ...extra.c },
    ],
  })
  it('uses the official order, then wins, instead of an arbitrary order', () => {
    expect(rankAt(tied(), 2).map(r => r.id)).toEqual(['b', 'c', 'a'])
    expect(rankAt(tied({ a: { officialPosition: 1 }, b: { officialPosition: 3 }, c: { officialPosition: 2 } }), 2).map(r => r.id)).toEqual(['a', 'c', 'b'])
    // an invalid official position is ignored
    expect(rankAt(tied({ a: { officialPosition: 0 }, b: { officialPosition: 'x' } }), 2).map(r => r.id)).toEqual(['b', 'c', 'a'])
  })
  it('never prints -0', () => {
    expect(gapLabel(0)).toBe('0')
    expect(gapLabel(8)).toBe('-8')
    expect(rankAt(tied(), 2).map(r => gapLabel(r.gap))).toEqual(['0', '0', '0'])
  })
})
