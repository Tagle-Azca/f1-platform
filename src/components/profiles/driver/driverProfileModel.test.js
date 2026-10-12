import { describe, it, expect } from 'vitest'
import {
  rangeLabel, seasonsSince2022Label, ageOn, bornLabel, seasonRows, heroMeta, statStrip, timelineSegments,
  bestCircuits, h2hSeasons, parseH2hSeason, h2hView, pct,
} from './driverProfileModel'

describe('rangeLabel / seasonsSince2022Label', () => {
  it('formats ranges', () => {
    expect(rangeLabel('2022', '2026')).toBe('2022–2026')
    expect(rangeLabel(2024, 2024)).toBe('2024')
    expect(rangeLabel(2026, 2022)).toBe('2022–2026')
    expect(rangeLabel(2023, null)).toBe('2023')
    expect(rangeLabel(null, 'x')).toBe('')
  })
  it('reads the span from season rows with a safe default', () => {
    expect(seasonsSince2022Label([{ season: '2023' }, { season: '2025' }])).toBe('2023–2025')
    expect(seasonsSince2022Label([])).toBe('2022–2026')
    expect(seasonsSince2022Label(null)).toBe('2022–2026')
  })
})

describe('age and born', () => {
  const now = new Date('2026-10-11T12:00:00Z')
  it('computes whole years', () => {
    expect(ageOn('1999-11-13T00:00:00.000Z', now)).toBe(26)
    expect(ageOn('1999-10-11T00:00:00.000Z', now)).toBe(27)
    expect(ageOn('1999-10-12T00:00:00.000Z', now)).toBe(26)
  })
  it('rejects bad dates', () => {
    for (const v of [undefined, null, 'nope', 12, '2999-01-01', '1800-01-01']) expect(ageOn(v, now)).toBeNull()
  })
  it('formats the birth date', () => {
    expect(bornLabel('1999-11-13T00:00:00.000Z')).toBe('13 November 1999')
    expect(bornLabel('x')).toBe('')
  })
})

const seasons = [
  { season: '2024', team: 'McLaren', constructorId: 'mclaren', points: 344, wins: 4, podiums: 13, poles: 8, races: 24 },
  { season: '2026', team: 'McLaren', constructorId: 'mclaren', points: 168, wins: 2, podiums: 5, poles: 3, races: 17 },
  { season: '2025', team: 'McLaren', constructorId: 'mclaren', points: 394, wins: 7, podiums: 18, poles: 7, races: 24 },
  { season: '2022', team: 'Alpine', constructorId: 'alpine', points: 100, wins: 0, podiums: 0, poles: 0, races: 22 },
  { season: 'x', team: 'Bad' },
  null,
]

describe('seasonRows', () => {
  it('sorts newest first, drops junk and carries the best points', () => {
    const rows = seasonRows(seasons)
    expect(rows.map((r) => r.season)).toEqual([2026, 2025, 2024, 2022])
    expect(rows.every((r) => r.best === 394)).toBe(true)
    expect(rows[0]).toMatchObject({ team: 'McLaren', points: 168, constructorId: 'mclaren' })
  })
  it('blanks an unsafe constructor id and clamps negatives', () => {
    const [r] = seasonRows([{ season: 2025, constructorId: '<b>', wins: -3, points: '-0' }])
    expect(r.constructorId).toBe('')
    expect(r.wins).toBe(0)
    expect(Object.is(r.points, 0)).toBe(true)
  })
  it('handles non-arrays', () => { expect(seasonRows({})).toEqual([]) })
})

describe('heroMeta', () => {
  const stats = { driver: { givenName: 'Lando', familyName: 'Norris', code: 'NOR', permanentNumber: '4', nationality: 'British', dateOfBirth: '1999-11-13T00:00:00.000Z', photoUrl: 'https://x.test/p.png' }, lastSeason: '2026' }
  it('builds the hero data', () => {
    const m = heroMeta(stats, seasons, new Date('2026-10-11T00:00:00Z'))
    expect(m).toMatchObject({ given: 'Lando', surname: 'Norris', fullName: 'Lando Norris', code: 'NOR', number: '4', art: '4', nationality: 'British', age: 26, born: '13 November 1999', team: 'McLaren', teamId: 'mclaren', lastSeason: 2026, photoUrl: 'https://x.test/p.png' })
  })
  it('falls back from number to code to initials', () => {
    expect(heroMeta({ driver: { givenName: 'A', familyName: 'B', code: 'ABB' } }, []).art).toBe('ABB')
    expect(heroMeta({ driver: { givenName: 'Ann', familyName: 'Bee' } }, []).art).toBe('BEE')
    expect(heroMeta({ driver: {} }, []).art).toBe('')
  })
  it('survives null input', () => {
    const m = heroMeta(null, null)
    expect(m).toMatchObject({ surname: 'Unknown driver', team: '', age: null, born: '', teamId: '' })
    expect(m.lastSeason).toBeNull()
  })
  it('uses stats.lastSeason when there are no season rows', () => {
    expect(heroMeta({ driver: {}, lastSeason: '2024' }, []).lastSeason).toBe(2024)
  })
})

describe('statStrip', () => {
  const s = { points: 1206, wins: 13, podiums: 44, polePositions: 18, races: 109, fastestLaps: 17, pointsPerRace: 11.06, top10Rate: 82.6, dnfRate: 12.8, avgPositionsGained: -1.05 }
  it('formats primary and secondary figures', () => {
    const out = statStrip(s)
    expect(out.primary.map((p) => [p.label, p.value])).toEqual([['Points', 1206], ['Wins', 13], ['Podiums', 44], ['Poles', 18]])
    const by = Object.fromEntries(out.secondary.map((x) => [x.key, x]))
    expect(by.pointsPerRace.text).toBe('11.1')
    expect(by.top10Rate.text).toBe('82.6%')
    expect(by.gained).toMatchObject({ text: '-1.1', dir: 'lost' })
  })
  it('signs gains and treats tiny values as level', () => {
    expect(statStrip({ avgPositionsGained: 2.14 }).secondary[0]).toMatchObject({ text: '+2.1', dir: 'gained' })
    expect(statStrip({ avgPositionsGained: -0.02 }).secondary[0]).toMatchObject({ text: '0.0', dir: 'level' })
    expect(statStrip({ avgPositionsGained: 0 }).secondary[0].text).toBe('0.0')
  })
  it('omits missing and non-finite data, accepts numeric strings', () => {
    expect(statStrip({ points: 'x', wins: '5', podiums: NaN }).primary).toEqual([{ key: 'wins', label: 'Wins', value: 5 }])
    expect(statStrip(null)).toEqual({ primary: [], secondary: [] })
    expect(statStrip({ points: '-0' }).primary[0].value).toBe(0)
    expect(Object.is(statStrip({ points: -0 }).primary[0].value, 0)).toBe(true)
  })
  it('pct keeps one decimal', () => { expect(pct(0)).toBe('0.0%'); expect(pct(12.84)).toBe('12.8%') })
})

describe('timelineSegments', () => {
  it('merges consecutive seasons with the same team, oldest first', () => {
    const segs = timelineSegments(seasons)
    expect(segs).toHaveLength(2)
    expect(segs[0]).toMatchObject({ team: 'Alpine', from: 2022, to: 2022, years: '2022', count: 1 })
    expect(segs[1]).toMatchObject({ team: 'McLaren', from: 2024, to: 2026, years: '2024–2026', count: 3 })
  })
  it('does not merge across a gap year or a team change', () => {
    const segs = timelineSegments([{ season: 2022, constructorId: 'a', team: 'A' }, { season: 2024, constructorId: 'a', team: 'A' }, { season: 2025, constructorId: 'b', team: 'B' }, { season: 2026, constructorId: 'a', team: 'A' }])
    expect(segs.map((s) => s.years)).toEqual(['2022', '2024', '2025', '2026'])
  })
  it('is empty for no data', () => { expect(timelineSegments(undefined)).toEqual([]) })
})

describe('bestCircuits', () => {
  const rows = [
    { _id: 'monza', circuitName: 'Monza', races: 5, points: 56, wins: 0, podiums: 2 },
    { _id: 'a', circuitName: 'Alpha', races: 5, points: 90, wins: 2, podiums: 3 },
    { _id: 'b', circuitName: 'Beta', races: 4, points: 40, wins: 2, podiums: 3 },
    { _id: 'c', circuitName: 'Gamma', races: 5, points: 40, wins: 2, podiums: 3 },
    { _id: 'd', circuitName: 'Delta', races: 1, points: 0, wins: 0, podiums: 0 },
    { _id: '<x>', circuitName: 'Unsafe', races: 2, points: 10, wins: 1, podiums: 1 },
    { circuitName: 'No id', races: 0, wins: 0 },
  ]
  it('ranks by wins, podiums, points per race, then name', () => {
    expect(bestCircuits(rows).map((r) => r.name).slice(0, 4)).toEqual(['Alpha', 'Beta', 'Gamma', 'Unsafe'])
  })
  it('limits the list and carries the top win count', () => {
    const out = bestCircuits(rows, 3)
    expect(out).toHaveLength(3)
    expect(out[0].max).toBe(2)
    expect(out[0].pprText).toBe('18.0')
  })
  it('blanks unsafe ids and guards zero races', () => {
    const all = bestCircuits(rows, 20)
    expect(all.find((r) => r.name === 'Unsafe').id).toBe('')
    expect(all.find((r) => r.name === 'No id').ppr).toBe(0)
    expect(bestCircuits(null)).toEqual([])
  })
})

describe('h2h helpers', () => {
  it('lists seasons newest first and picks a valid param', () => {
    const list = h2hSeasons(seasons)
    expect(list).toEqual([2026, 2025, 2024, 2022])
    expect(parseH2hSeason('2024', list)).toBe(2024)
    expect(parseH2hSeason('2019', list)).toBe(2026)
    expect(parseH2hSeason('abc', list)).toBe(2026)
    expect(parseH2hSeason(null, [])).toBeNull()
  })
  const data = { teammateName: 'Oscar Piastri', racesCompared: 24, qualiCompared: 15, race: { driver: 14, teammate: 10 }, quali: { driver: 6, teammate: 9 } }
  it('builds the view and an sr sentence', () => {
    const v = h2hView(data, { driverName: 'Lando Norris', season: 2025 })
    expect(v).toMatchObject({ status: 'ok', teammate: 'Oscar Piastri', race: { driver: 14, teammate: 10, total: 24 }, quali: { driver: 6, teammate: 9, total: 15 } })
    expect(v.sentence).toBe('In 2025, Lando Norris against Oscar Piastri: Lando Norris led in 14 of 24 races and Oscar Piastri led in 9 of 15 qualifying sessions.')
  })
  it('handles level results and singular sessions', () => {
    const v = h2hView({ teammateName: 'X', racesCompared: 1, qualiCompared: 0, race: { driver: 1, teammate: 1 } }, { driverName: 'Y', season: 2024 })
    expect(v.sentence).toContain('level at 1 of 1 race')
    expect(v.sentence).not.toContain('qualifying')
  })
  it('reports the two no-comparison reasons', () => {
    expect(h2hView({ teammateName: null }, { driverName: 'Y', season: 2024 }).status).toBe('noTeammate')
    expect(h2hView(undefined, { driverName: 'Y', season: 2024 }).status).toBe('noTeammate')
    expect(h2hView({ teammateName: 'Z', racesCompared: 0, qualiCompared: 0 }, { driverName: 'Y', season: 2024 })).toMatchObject({ status: 'noShared', teammate: 'Z' })
  })
  it('tolerates malformed sides and negative counts', () => {
    const v = h2hView({ teammateName: 'Z', racesCompared: 2, qualiCompared: '-0', race: 'x', quali: null }, { driverName: 'Y', season: 2024 })
    expect(v.race).toEqual({ driver: 0, teammate: 0, total: 2 })
    expect(v.quali.total).toBe(0)
  })
})
