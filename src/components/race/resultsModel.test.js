import { describe, it, expect } from 'vitest'
import { statusWord, positionDelta, deltaSpoken, raceRows, qualiRows, snapshotRows, statCards } from './resultsModel'

const r = (over = {}) => ({
  position: '1', grid: '2', points: '25', status: 'Finished', laps: '57', Time: { time: '1:31:44.2' },
  Driver: { driverId: 'norris', givenName: 'Lando', familyName: 'Norris', code: 'NOR', permanentNumber: '4' },
  Constructor: { constructorId: 'mclaren', name: 'McLaren' }, ...over,
})

describe('statusWord', () => {
  it('words for finished, laps down and the DNF family; only DNF and DSQ are bad', () => {
    expect(statusWord('Finished')).toMatchObject({ label: 'Finished', tone: 'ok' })
    expect(statusWord('+1 Lap')).toMatchObject({ label: '+1 lap', tone: 'ok' })
    expect(statusWord('+3 Laps')).toMatchObject({ label: '+3 laps' })
    expect(statusWord('Engine')).toMatchObject({ label: 'DNF', tone: 'bad', spoken: 'did not finish' })
    expect(statusWord('Disqualified')).toMatchObject({ label: 'DSQ', tone: 'bad' })
    expect(statusWord('Did not start')).toMatchObject({ label: 'DNS', tone: 'plain' })
    expect(statusWord('Some very long unknown reason')).toMatchObject({ label: 'DNF' })
    expect(statusWord('Lapped')).toMatchObject({ label: 'Lapped', tone: 'plain' })
    expect(statusWord(null)).toMatchObject({ label: '-', tone: 'none' })
    expect(statusWord({ x: 1 })).toMatchObject({ label: '-' })
  })
  it('does not resolve inherited keys', () => { expect(statusWord('__proto__').label).toBe('__proto__') })
})

describe('positionDelta', () => {
  it('positive when gained, null for the pit lane or junk', () => {
    expect(positionDelta('3', '1')).toBe(2)
    expect(positionDelta('1', '4')).toBe(-3)
    expect(positionDelta('0', '4')).toBeNull()
    expect(positionDelta('x', '4')).toBeNull()
    expect(deltaSpoken(2)).toBe('gained 2 places')
    expect(deltaSpoken(-1)).toBe('lost 1 place')
    expect(deltaSpoken(0)).toBe('kept their grid place')
    expect(deltaSpoken(null)).toBe('')
  })
})

describe('raceRows', () => {
  it('builds one row per result with the winner as leader and a spoken summary', () => {
    const rows = raceRows([r(), r({ position: '\\N', grid: '0', status: 'Engine', Time: undefined, points: '0', Driver: { driverId: 'b', familyName: 'Bee' } })])
    expect(rows[0]).toMatchObject({ key: 'norris', pos: '1', isLeader: true, code: 'NOR', family: 'Norris', number: '4', team: 'McLaren', grid: '2', delta: 1, timeText: '1:31:44.2', points: '25' })
    expect(rows[0].spoken).toBe('Position 1, Lando Norris, McLaren, started P2, gained 1 place, time 1:31:44.2, 25 points')
    expect(rows[1]).toMatchObject({ pos: 'DNF', grid: 'PL', delta: null, points: '', code: 'BEE' })
    expect(rows[1].status.label).toBe('DNF')
    expect(rows[1].spoken).toContain('started from the pit lane')
    expect(rows[1].spoken).toContain('did not finish')
  })
  it('survives junk entries and hostile fields', () => {
    expect(raceRows(null)).toEqual([])
    const rows = raceRows([null, 5, { Driver: 'x', Constructor: [], position: { a: 1 } }])
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('Unknown')
    expect(JSON.stringify(rows)).not.toContain('[object')
  })
})

describe('qualiRows', () => {
  it('Q1 to Q3 for qualifying and SQ for the shootout', () => {
    const q = qualiRows([{ ...r(), Q1: '1:20.1', Q2: '1:19.9', Q3: '1:19.5' }])
    expect(q[0].q).toEqual(['1:20.1', '1:19.9', '1:19.5'])
    expect(q[0].spoken).toContain('best time 1:19.5')
    const sq = qualiRows([{ ...r(), SQ1: '1:30.0', SQ2: '', SQ3: '' }], { shootout: true })
    expect(sq[0].q).toEqual(['1:30.0', '', ''])
    expect(qualiRows([{ ...r() }])[0].spoken).toContain('no time set')
  })
})

describe('snapshotRows', () => {
  const snap = { classification: [
    { position: 1, driverNum: '4', fullName: 'Lando Norris', acronym: 'NOR', teamName: 'McLaren', teamColor: 'ff8000', bestLap: '1:20.0' },
    { position: 2, driverNum: '81', acronym: 'PIA', teamName: 'McLaren', teamColor: 'zzz', stat: '+1.2', statLabel: 'gap', bestLap: '1:20.4' },
  ] }
  it('gap column: Leader first, then the gap; colour only when it is a hex colour', () => {
    const rows = snapshotRows(snap)
    expect(rows[0]).toMatchObject({ value: 'Leader', color: '#ff8000', code: 'NOR', isLeader: true })
    expect(rows[1]).toMatchObject({ value: '+1.2', color: '', name: 'PIA' })
  })
  it('best lap column', () => { expect(snapshotRows(snap, { column: 'bestLap' }).map((x) => x.value)).toEqual(['1:20.0', '1:20.4']) })
  it('empty and hostile snapshots', () => { expect(snapshotRows(null)).toEqual([]); expect(snapshotRows({ classification: 'x' })).toEqual([]) })
})

describe('statCards', () => {
  it('winner, pole, fastest lap and the DNF count', () => {
    const res = [r(), r({ position: '2', status: '+1 Lap', Driver: { driverId: 'p', givenName: 'O', familyName: 'P' }, FastestLap: { rank: '1', Time: { time: '1:21.0' } } }), r({ position: '3', status: 'Engine' })]
    const c = statCards(res, [{ ...r({ Driver: { driverId: 'v', givenName: 'Max', familyName: 'V' } }) }], null)
    expect(c.winner.value).toBe('Lando Norris')
    expect(c.pole.value).toBe('Max V')
    expect(c.fastest).toMatchObject({ value: 'O P', sub: '1:21.0' })
    expect(c.dnfs).toEqual({ count: 1, laps: '57 laps', classified: 3 })
  })
  it('falls back to the live-timing snapshot winner and has no fastest lap when absent', () => {
    const c = statCards([], [], { totalLaps: 70, classification: [{ fullName: 'Lando Norris', teamName: 'McLaren' }] })
    expect(c.winner).toMatchObject({ value: 'Lando Norris', sub: 'McLaren' })
    expect(c.pole).toBeNull()
    expect(c.fastest).toBeNull()
    expect(c.dnfs.laps).toBe('70 laps')
  })
  it('is all empty for nothing', () => {
    expect(statCards(null, null, null)).toMatchObject({ winner: null, pole: null, fastest: null })
  })
})
