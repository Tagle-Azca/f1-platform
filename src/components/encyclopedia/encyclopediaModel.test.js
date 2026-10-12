import { describe, it, expect } from 'vitest'
import {
  parseHubParams, cleanHubParams, splitName, buildDriverCards, buildConstructorCards, matchFavorites,
  describeCard, resultLine, groupSearchResults, flattenGroups, splitMatch,
} from './encyclopediaModel'

const sp = (s) => new URLSearchParams(s)

describe('parseHubParams / cleanHubParams', () => {
  it('defaults to drivers and no season', () => {
    expect(parseHubParams(sp(''), { currentYear: 2026 })).toEqual({ view: 'drivers', season: null, dirty: false })
  })
  it('reads valid values', () => {
    expect(parseHubParams(sp('view=circuits&season=2024'), { currentYear: 2026 })).toEqual({ view: 'circuits', season: 2024, dirty: false })
  })
  it('flags invalid values and the cleaned copy drops them', () => {
    for (const q of ['view=nope', 'season=abc', 'season=1950', 'season=2099', 'season=20260', 'season=', 'view=DRIVERS']) {
      const p = parseHubParams(sp(q), { currentYear: 2026 })
      expect(p.dirty).toBe(true)
      expect(cleanHubParams(sp(q), p).toString()).toBe('')
    }
  })
  it('keeps the valid half of a mixed URL', () => {
    const q = sp('view=constructors&season=zzz&x=1')
    const p = parseHubParams(q, { currentYear: 2026 })
    expect(p.view).toBe('constructors')
    expect(cleanHubParams(q, p).toString()).toBe('view=constructors&x=1')
  })
  it('survives a missing params object', () => {
    expect(parseHubParams(null, { currentYear: 2026 }).view).toBe('drivers')
  })
})

describe('splitName', () => {
  it('splits given and surname', () => {
    expect(splitName('Lando Norris')).toEqual({ given: 'Lando', surname: 'Norris' })
    expect(splitName('Andrea Kimi Antonelli')).toEqual({ given: 'Andrea Kimi', surname: 'Antonelli' })
    expect(splitName('Pele')).toEqual({ given: '', surname: 'Pele' })
    expect(splitName('  ')).toEqual({ given: '', surname: 'Unknown' })
    expect(splitName(null)).toEqual({ given: '', surname: 'Unknown' })
  })
})

const payload = {
  drivers: [
    { driverId: 'b', name: 'Bee Two', team: 'McLaren', teamId: 'mclaren', wins: 1, finalPoints: 50, officialPosition: 2 },
    { driverId: 'a', name: 'Ann One', team: 'Ferrari', teamId: 'ferrari', wins: 3, finalPoints: 50, officialPosition: 1, number: '7' },
    { driverId: 'c', name: 'Cee Three', teamId: 'mystery', cumulative: [3, 9] },
    { driverId: '<x>', name: 'Evil', finalPoints: 999 },
    { driverId: 'a', name: 'Dup', finalPoints: 1 },
    { driverId: 'z', name: 'Zed', finalPoints: '-0', wins: -2, cumulative: 'x' },
    null, 'str',
  ],
}

describe('buildDriverCards', () => {
  const photos = new Map([['a', { photoUrl: 'https://x.test/a.png', number: '1', code: 'ANN' }], ['c', { photoUrl: null, number: '33', code: '' }]])
  const cards = buildDriverCards(payload, photos)
  it('ranks by points, then official position, and drops bad ids and duplicates', () => {
    expect(cards.map((c) => c.id)).toEqual(['a', 'b', 'c', 'z'])
    expect(cards.map((c) => c.position)).toEqual([1, 2, 3, 4])
  })
  it('fills fields with fallbacks', () => {
    expect(cards[0]).toMatchObject({ number: '7', code: 'ANN', photoUrl: 'https://x.test/a.png', given: 'Ann', surname: 'One', points: 50, wins: 3 })
    expect(cards[2]).toMatchObject({ points: 9, number: '33', code: 'THR', color: '#888' })
  })
  it('never yields -0 or negative values', () => {
    expect(Object.is(cards[3].points, 0)).toBe(true)
    expect(cards[3].wins).toBe(0)
  })
  it('handles hostile payloads', () => {
    expect(buildDriverCards(null)).toEqual([])
    expect(buildDriverCards({ drivers: 'x' })).toEqual([])
    expect(buildDriverCards({ drivers: [{ driverId: 'a' }] }, 'not a map')[0].points).toBe(0)
  })
})

describe('buildConstructorCards', () => {
  it('ranks, codes and colours teams', () => {
    const cards = buildConstructorCards({ constructors: [
      { constructorId: 'ferrari', name: 'Ferrari', finalPoints: 100, wins: 2 },
      { constructorId: 'mclaren', name: 'McLaren', finalPoints: 200, wins: 1 },
      { constructorId: 'new_team', name: 'New Team Racing', cumulative: [5] },
      { constructorId: 'BAD ID', name: 'x' },
    ] })
    expect(cards.map((c) => c.id)).toEqual(['mclaren', 'ferrari', 'new_team'])
    expect(cards[0]).toMatchObject({ code: 'MCL', position: 1 })
    expect(cards[2]).toMatchObject({ code: 'NTR', points: 5, color: '#888' })
  })
  it('tolerates junk', () => {
    expect(buildConstructorCards(undefined)).toEqual([])
    expect(buildConstructorCards({ constructors: [{ constructorId: 'a' }, { constructorId: 'a' }] })).toHaveLength(1)
  })
})

describe('matchFavorites', () => {
  const cards = buildDriverCards({ drivers: [
    { driverId: 'a', name: 'Andrea Kimi Antonelli', finalPoints: 9 }, { driverId: 'b', name: 'Nico Hülkenberg', finalPoints: 5 }, { driverId: 'c', name: 'Cee', finalPoints: 1 },
  ] })
  it('pins a driver by folded name and keeps the true rank', () => {
    const r = matchFavorites(cards, { favoriteDriver: 'Nico Hulkenberg' }, 'drivers')
    expect(r.pinned.map((c) => c.id)).toEqual(['b'])
    expect(r.pinned[0].position).toBe(2)
    expect(r.rest.map((c) => c.id)).toEqual(['a', 'c'])
  })
  it('matches a short preference name against a longer standings name', () => {
    expect(matchFavorites(cards, { favoriteDriver: 'Kimi Antonelli' }, 'drivers').pinned[0].id).toBe('a')
  })
  it('pins a team by id, with the racing_bulls alias', () => {
    const teams = buildConstructorCards({ constructors: [{ constructorId: 'rb', name: 'RB', finalPoints: 3 }, { constructorId: 'haas', name: 'Haas', finalPoints: 9 }] })
    expect(matchFavorites(teams, { favoriteTeam: 'racing_bulls' }, 'constructors').pinned[0].id).toBe('rb')
    expect(matchFavorites(teams, { favoriteTeam: 'haas' }, 'constructors').rest.map((c) => c.id)).toEqual(['rb'])
  })
  it('pins nothing when absent, empty, or the wrong tab', () => {
    expect(matchFavorites(cards, { favoriteDriver: 'Nobody' }, 'drivers').pinned).toEqual([])
    expect(matchFavorites(cards, { favoriteDriver: '  ' }, 'drivers').pinned).toEqual([])
    expect(matchFavorites(cards, { favoriteDriver: 'Cee' }, 'circuits')).toEqual({ pinned: [], rest: cards })
    expect(matchFavorites(null, null, 'drivers')).toEqual({ pinned: [], rest: [] })
    expect(matchFavorites(cards, { favoriteTeam: 5 }, 'constructors').pinned).toEqual([])
  })
})

describe('describeCard / resultLine', () => {
  it('writes ordinals and plurals', () => {
    expect(describeCard({ position: 3, points: 408, wins: 7, team: 'McLaren' }, { kind: 'driver', season: 2026 })).toBe('3rd in the 2026 standings with 408 points and 7 wins. McLaren.')
    expect(describeCard({ position: 11, points: 1, wins: 1 }, { kind: 'constructor', season: 2025, favourite: true })).toBe("Favourite. 11th in the 2025 constructors' standings with 1 point and 1 win.")
    expect(describeCard({ position: 22, points: 0, wins: 0 }, { kind: 'driver', season: 2025 })).toContain('22nd')
    expect(describeCard({ position: 2, points: 0, wins: 0 }, { kind: 'driver', season: 2025 })).toContain('2nd')
  })
  it('describes the ordering by season state', () => {
    expect(resultLine('drivers', { count: 22, season: 2026, roundsDone: 16, current: true })).toEqual({ head: '22 drivers', note: 'Order shows the standings after round 16.' })
    expect(resultLine('drivers', { count: 1, season: 2024 })).toEqual({ head: '1 driver', note: 'Order shows the final 2024 standings.' })
    expect(resultLine('constructors', { count: 11, season: 2026, current: true, roundsDone: 0 }).note).toBe('')
    expect(resultLine('circuits', { count: 24, season: 2026 })).toEqual({ head: '24 circuits', note: '24 circuits on the 2026 calendar, in race order.' })
    expect(resultLine('circuits', { count: 1, season: 2026 }).head).toBe('1 circuit')
  })
})

describe('groupSearchResults', () => {
  const rows = [
    ...Array.from({ length: 8 }, (_, i) => ({ type: 'race', id: `202${i % 5}-${i + 1}`, label: `Race ${i}`, circuitName: 'Monza' })),
    { type: 'circuit', id: 'imola', label: 'Imola', locality: 'Imola', country: 'Italy' },
    { type: 'constructor', id: 'ferrari', label: 'Ferrari', nationality: 'Italian' },
    { type: 'driver', id: 'leclerc', label: 'Charles Leclerc', nationality: 'Monegasque', number: '16' },
    { type: 'driver', id: 'leclerc', label: 'Charles Leclerc again' },
    { type: 'driver', id: '<img>', label: 'Bad' },
    { type: 'driver', id: 'nolabel', label: '  ' },
    { type: 'race', id: 'garbage', label: 'x' },
    { type: 'mystery', id: 'x', label: 'x' },
    null,
  ]
  const groups = groupSearchResults(rows)
  it('orders groups and caps each at five', () => {
    expect(groups.map((g) => g.key)).toEqual(['drivers', 'constructors', 'circuits', 'races'])
    expect(groups[3].items).toHaveLength(5)
  })
  it('builds canonical hrefs and drops unsafe rows', () => {
    const flat = flattenGroups(groups)
    expect(flat.map((i) => i.href).slice(0, 3)).toEqual(['/drivers/leclerc', '/constructors/ferrari', '/circuits/imola'])
    expect(flat.find((i) => i.type === 'race').href).toMatch(/^\/races\/\d{4}\/\d+$/)
    expect(flat.some((i) => /img|garbage|nolabel/.test(i.href))).toBe(false)
    expect(groups[0].items).toHaveLength(1)
    expect(groups[0].items[0].meta).toBe('Monegasque · No. 16')
    expect(groups[2].items[0].meta).toBe('Imola, Italy')
  })
  it('returns nothing for junk', () => {
    expect(groupSearchResults(null)).toEqual([])
    expect(groupSearchResults('x')).toEqual([])
  })
})

describe('splitMatch', () => {
  it('splits around the match, ignoring case and accents', () => {
    expect(splitMatch('Sergio Pérez', 'perez')).toEqual(['Sergio ', 'Pérez', ''])
    expect(splitMatch('Ferrari', 'ERR')).toEqual(['F', 'err', 'ari'])
  })
  it('returns the label whole when nothing matches', () => {
    expect(splitMatch('Ferrari', 'zz')).toEqual(['Ferrari', '', ''])
    expect(splitMatch('Ferrari', '')).toEqual(['Ferrari', '', ''])
    expect(splitMatch(null, 'x')).toEqual(['', '', ''])
  })
})
