import { describe, it, expect } from 'vitest'
import {
  teamMeta, titlesLine, kpis, seasonHistory, seasonList, parseSeasonParam, latestDrivers, tenureRows,
  dnaScores, progressSeries, lapLabel, paceChart,
} from './constructorProfileModel'

const seasons = [
  { season: '2024', wins: 6, points: 666, races: 24, champion: true, drivers: [{ id: 'norris', name: 'Lando Norris', wins: 4, points: 374 }, { id: 'piastri', name: 'Oscar Piastri', wins: 2, points: 292 }] },
  { season: '2022', wins: 0, points: 159, races: 22, champion: false, drivers: [{ id: 'ricciardo', name: 'Daniel Ricciardo', wins: 0, points: 37 }, { id: 'norris', name: 'Lando Norris', wins: 0, points: 122 }] },
  { season: '2026', wins: 2, points: 339, races: 17, champion: false, drivers: [{ id: 'norris', name: 'Lando Norris', wins: 2, points: 201 }, { id: 'piastri', name: 'Oscar Piastri', wins: 0, points: 138 }] },
  { season: '2023', wins: 0, points: 302, races: 22, drivers: [{ id: '<x>', name: 'Odd Name', points: 5 }, { id: 'norris', name: 'Lando Norris', points: 205 }] },
  { season: 'x' }, null,
]

describe('teamMeta', () => {
  it('builds code, colour and range', () => {
    expect(teamMeta({ constructorId: 'mclaren', name: 'McLaren', stats: { firstSeason: '2022', lastSeason: '2026' } })).toMatchObject({ id: 'mclaren', code: 'MCL', color: '#FF8000', range: '2022–2026' })
  })
  it('uses initials and grey for unknown teams and survives junk', () => {
    expect(teamMeta({ constructorId: 'zed_racing', name: 'Zed Racing Team' })).toMatchObject({ code: 'ZRT', color: '#888' })
    expect(teamMeta(null, 'abc')).toMatchObject({ id: 'abc', name: 'Unknown team', range: '' })
  })
})

describe('titlesLine', () => {
  it('lists title years', () => {
    expect(titlesLine({ championships: 2, championSeasons: ['2024', '2025', 'bad'] })).toEqual({ count: 2, years: ['2024', '2025'], text: "Constructors' titles since 2022: 2", yearsText: '(2024, 2025)' })
  })
  it('says none for zero and omits when unknown', () => {
    expect(titlesLine({ championships: 0 }).text).toBe("No constructors' titles since 2022.")
    expect(titlesLine({})).toBeNull()
    expect(titlesLine(null)).toBeNull()
    expect(titlesLine({ championships: 1 }).yearsText).toBe('')
  })
})

describe('kpis', () => {
  it('formats the figures and the finish rate', () => {
    const k = kpis({ championships: 2, wins: 22, podiums: 53, poles: 17, seasons: 5, races: 109, points: 2299, reliability: 85.8 })
    expect(k.primary.map((p) => p.value)).toEqual([2, 22, 53, 17])
    expect(k.secondary.map((s) => s.text)).toEqual(['5', '109', '2299', '85.8%'])
    expect(k.secondary.at(-1).label).toBe('Finish rate')
  })
  it('omits missing data and clamps', () => {
    expect(kpis({ wins: 'x' })).toEqual({ primary: [], secondary: [] })
    expect(kpis({ reliability: 140 }).secondary[0].text).toBe('100.0%')
    expect(kpis(undefined).primary).toEqual([])
    expect(kpis({ wins: -0 }).primary[0].value).toBe(0)
  })
})

describe('seasonHistory / seasonList / parseSeasonParam', () => {
  it('sorts newest first with the best points', () => {
    const h = seasonHistory(seasons)
    expect(h.map((r) => r.season)).toEqual([2026, 2024, 2023, 2022])
    expect(h[0].best).toBe(666)
    expect(h[1].champion).toBe(true)
    expect(h[2].champion).toBe(false)
  })
  it('picks a valid season param', () => {
    const list = seasonList(seasons)
    expect(parseSeasonParam('2023', list)).toBe(2023)
    expect(parseSeasonParam('2019', list)).toBe(2026)
    expect(parseSeasonParam(undefined, list)).toBe(2026)
    expect(parseSeasonParam('2023', [])).toBeNull()
  })
  it('handles junk', () => { expect(seasonHistory('x')).toEqual([]) })
})

describe('latestDrivers', () => {
  it('lists the newest season drivers by points', () => {
    expect(latestDrivers(seasons)).toMatchObject({ season: 2026, drivers: [{ name: 'Lando Norris' }, { name: 'Oscar Piastri' }] })
    expect(latestDrivers([])).toEqual({ season: null, drivers: [] })
  })
})

describe('tenureRows', () => {
  const t = tenureRows(seasons)
  it('has one column per season, oldest first', () => { expect(t.columns).toEqual([2022, 2023, 2024, 2026]) })
  it('orders lanes by first season then points and builds spans', () => {
    expect(t.rows.map((r) => r.name)).toEqual(['Lando Norris', 'Daniel Ricciardo', 'Odd Name', 'Oscar Piastri'])
    expect(t.rows[0].spans).toEqual([{ start: 0, len: 4 }])
    const piastri = t.rows.find((r) => r.id === 'piastri')
    expect(piastri.spans).toEqual([{ start: 2, len: 2 }])
  })
  it('splits a lane on a gap year and blanks unsafe ids', () => {
    const gap = tenureRows([{ season: 2022, drivers: [{ id: 'a', name: 'A', points: 1 }] }, { season: 2023, drivers: [] }, { season: 2024, drivers: [{ id: 'a', name: 'A', points: 2 }] }])
    expect(gap.rows[0].spans).toEqual([{ start: 0, len: 1 }, { start: 2, len: 1 }])
    expect(t.rows.find((r) => r.name === 'Odd Name').id).toBe('')
  })
  it('is empty for no seasons', () => { expect(tenureRows(null)).toEqual({ columns: [], rows: [] }) })
})

describe('dnaScores', () => {
  const stats = { races: 109, poles: 17, wins: 22, podiums: 53, reliability: 85.8 }
  it('returns four literal rates', () => {
    const rows = dnaScores(stats)
    expect(rows.map((r) => r.key)).toEqual(['pole', 'win', 'podium', 'finish'])
    expect(rows[0].value).toBe(15.6)
    expect(rows[1].value).toBe(20.2)
    expect(rows[3].value).toBe(85.8)
    expect(rows[0].detail).toBe('17 of 109 races')
  })
  it('needs at least five races', () => {
    expect(dnaScores({ ...stats, races: 4 })).toBeNull()
    expect(dnaScores({ ...stats, races: 5 })).not.toBeNull()
    expect(dnaScores({})).toBeNull()
    expect(dnaScores(null)).toBeNull()
  })
  it('clamps and drops unknown rates', () => {
    const rows = dnaScores({ races: 10, wins: 30, poles: 'x' })
    expect(rows.find((r) => r.key === 'win').value).toBe(100)
    expect(rows.some((r) => r.key === 'pole')).toBe(false)
    expect(dnaScores({ races: 10, wins: 0 })[0].value).toBe(0) // zero-valued rates still count
    expect(dnaScores({ races: 10 })).toBeNull()
  })
})

describe('progressSeries', () => {
  const cur = { rounds: [{ round: '1', raceName: 'A GP' }, { round: '2', raceName: 'B GP' }, { round: '3' }], constructors: [{ constructorId: 'mclaren', cumulative: [10, 30, null] }] }
  const prev = { constructors: [{ constructorId: 'mclaren', cumulative: [5, 20, 25, 40] }] }
  it('pairs the two seasons by round', () => {
    const p = progressSeries(cur, prev, 'mclaren')
    expect(p.rows).toEqual([
      { round: '1', name: 'A GP', current: 10, previous: 5 },
      { round: '2', name: 'B GP', current: 30, previous: 20 },
      { round: '3', name: '', current: 30, previous: 25 },
    ])
    expect(p).toMatchObject({ roundsDone: 3, currentFinal: 30, previousAtSame: 25, diff: 5, hasPrevious: true })
  })
  it('works without a previous season', () => {
    const p = progressSeries(cur, null, 'mclaren')
    expect(p).toMatchObject({ hasPrevious: false, diff: null, previousAtSame: null })
    expect(p.rows[0].previous).toBeNull()
  })
  it('returns null for a missing team or empty line', () => {
    expect(progressSeries(cur, prev, 'ferrari')).toBeNull()
    expect(progressSeries({ constructors: [{ constructorId: 'x', cumulative: [] }] }, null, 'x')).toBeNull()
    expect(progressSeries({ constructors: [{ constructorId: 'x', cumulative: [null] }] }, null, 'x')).toBeNull()
    expect(progressSeries(null, null, 'x')).toBeNull()
  })
})

describe('lapLabel', () => {
  it('formats m:ss.s', () => {
    expect(lapLabel(84.936)).toBe('1:24.9')
    expect(lapLabel(65)).toBe('1:05.0')
    expect(lapLabel(59.96)).toBe('0:60.0')
  })
  it('rejects bad values', () => { for (const v of [0, -1, 'x', null, NaN]) expect(lapLabel(v)).toBe('') })
})

describe('paceChart', () => {
  const data = {
    raceId: '2026_11234', raceName: 'Melbourne',
    availableRaces: [{ raceId: '2026_11234', raceName: 'Melbourne' }, { raceId: 'bad', raceName: 'Nope' }, { raceId: '2026_11245', raceName: '' }],
    drivers: [
      { acronym: 'NOR', laps: [{ lap: 2, time: 86.8 }, { lap: 3, time: 85.8 }, { lap: 4, time: null }, { lap: 0, time: 80 }] },
      { acronym: 'PIA', laps: [{ lap: 3, time: 86.1 }] },
      { acronym: 'EXT', laps: [{ lap: 3, time: 90 }] },
    ],
  }
  it('merges the two drivers by lap and drops invalid laps and options', () => {
    const c = paceChart(data)
    expect(c.drivers).toEqual([{ acronym: 'NOR' }, { acronym: 'PIA' }])
    expect(c.rows).toEqual([{ lap: 2, NOR: 86.8 }, { lap: 3, NOR: 85.8, PIA: 86.1 }])
    expect(c.races).toEqual([{ raceId: '2026_11234', raceName: 'Melbourne' }])
    expect(c.min).toBe(84)
    expect(c.max).toBe(88)
    expect(c.raceName).toBe('Melbourne')
  })
  it('drops drivers with no laps and reports an empty race', () => {
    const c = paceChart({ raceId: '2026_11261', raceName: 'Sakhir', drivers: [{ acronym: 'NOR', laps: [] }] })
    expect(c).toMatchObject({ drivers: [], rows: [], raceName: 'Sakhir' })
  })
  it('returns null for no payload', () => {
    expect(paceChart(null)).toBeNull()
    expect(paceChart('x')).toBeNull()
    expect(paceChart({}).drivers).toEqual([])
  })
  it('names drivers without an acronym', () => {
    expect(paceChart({ drivers: [{ laps: [{ lap: 1, time: 80 }] }] }).drivers).toEqual([{ acronym: 'D1' }])
  })
})
