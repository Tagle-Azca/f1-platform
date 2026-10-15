// Mocks every /api/** call so the UI specs need no backend. Unknown routes answer 503 (backend-down path).

// Fixtures are relative to `base` (default: now). Baseline specs freeze the page clock at FIXED_NOW and pass it here.
export const FIXED_NOW = Date.parse('2026-10-09T10:00:00Z')
let BASE = null
const iso = (ms) => new Date((BASE ?? Date.now()) + ms).toISOString()
const H = 3600_000, D = 24 * H

export function dashboardFixture(base = null) {
  BASE = base
  const sched = (ms) => { const t = iso(ms); return { date: t.slice(0, 10), time: t.slice(11, 19) + 'Z', dateTime: t } }
  const drivers = [
    ['max_verstappen', 'Max Verstappen', 'Red Bull', 'red_bull', 380],
    ['norris', 'Lando Norris', 'McLaren', 'mclaren', 361],
    ['leclerc', 'Charles Leclerc', 'Ferrari', 'ferrari', 322],
    ['piastri', 'Oscar Piastri', 'McLaren', 'mclaren', 301],
    ['russell', 'George Russell', 'Mercedes', 'mercedes', 250],
    ['hamilton', 'Lewis Hamilton', 'Ferrari', 'ferrari', 231],
    ['alonso', 'Fernando Alonso', 'Aston Martin', 'aston_martin', 120],
    ['gasly', 'Pierre Gasly', 'Alpine', 'alpine', 90],
    ['albon', 'Alexander Albon', 'Williams', 'williams', 60],
    ['hulkenberg', 'Nico Hulkenberg', 'Audi', 'audi', 40],
  ]
  const numbers = { max_verstappen: '1', norris: '4', leclerc: '16' }
  return {
    season: '2026', totalRounds: 24, roundsDone: 12,
    nextRace: {
      raceName: 'Hungarian Grand Prix', round: '13', season: '2026', country: 'Hungary', locality: 'Budapest',
      circuit: 'Hungaroring', circuitId: 'hungaroring',
      schedule: { fp1: sched(1 * D), fp2: sched(1 * D + 4 * H), fp3: sched(2 * D), qualifying: sched(2 * D + 4 * H), race: sched(3 * D + 4 * H) },
      currentSession: null,
      nextSession: { key: 'fp1', label: 'Practice 1', dateTime: iso(1 * D) },
      raceDateTime: iso(3 * D + 4 * H),
    },
    standings: drivers.map(([driverId, name, team, constructorId, points], i) => ({ position: i + 1, driverId, name, team, constructorId, points, permanentNumber: numbers[driverId] })),
    constructorStandings: [
      { position: 1, constructorId: 'mclaren', name: 'McLaren', points: 662 },
      { position: 2, constructorId: 'ferrari', name: 'Ferrari', points: 553 },
      { position: 3, constructorId: 'red_bull', name: 'Red Bull', points: 380 },
    ],
    lastSession: {
      sessionType: 'Race', sessionLabel: 'Race', date: '2026-07-26', season: '2026', round: '12',
      podium: [
        { position: 1, driverId: 'norris', name: 'Lando Norris', constructorId: 'mclaren', time: '1:32:10.4' },
        { position: 2, driverId: 'piastri', name: 'Oscar Piastri', constructorId: 'mclaren', time: '+2.1s' },
        { position: 3, driverId: 'leclerc', name: 'Charles Leclerc', constructorId: 'ferrari', time: '+5.9s' },
      ],
      fastestLap: { name: 'Max Verstappen', time: '1:21.040' },
    },
  }
}

export function trackCoordsFixture() {
  // A closed, non-convex loop (finite, >= 8 points) so TrackTrace renders in baselines.
  return Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2
    const r = 1 + 0.35 * Math.sin(3 * a) + 0.2 * Math.cos(2 * a)
    return [19.2486 + Math.cos(a) * r * 0.004, 47.5789 + Math.sin(a) * r * 0.0028]
  })
}

// ── Circuits fixtures ───────────────────────────────────────────────────────
// Seven circuits in /api/circuits (one without an outline, one with a very long name, `vegas` for the id alias) and a
// calendar that adds a calendar-only `sepang`. hungaroring keeps answering exactly as before for Home and Next race.
const WIKI = (name) => `https://en.wikipedia.org/wiki/${name}`
const loopAt = (lng, lat, k = 1) => Array.from({ length: 60 }, (_, i) => {
  const a = (i / 60) * Math.PI * 2
  const r = 1 + 0.3 * Math.sin((2 + k) * a) + 0.18 * Math.cos(3 * a)
  return [lng + Math.cos(a) * r * 0.01, lat + Math.sin(a) * r * 0.007]
})
const loc = (lat, long, locality, country) => ({ lat: String(lat), long: String(long), locality, country })
const RAW_CIRCUITS = [
  { circuitId: 'monza', circuitName: 'Autodromo Nazionale di Monza', url: WIKI('Monza_Circuit'), Location: loc(45.6156, 9.28111, 'Monza', 'Italy'), trackCoords: loopAt(9.28, 45.61, 1), raceCount: 5, lastRaceName: 'Italian Grand Prix', lastSeason: 2026 },
  { circuitId: 'marina_bay', circuitName: 'Marina Bay Street Circuit', url: WIKI('Marina_Bay_Street_Circuit'), Location: loc(1.2914, 103.864, 'Marina Bay', 'Singapore'), trackCoords: loopAt(103.86, 1.29, 2), raceCount: 5, lastRaceName: 'Singapore Grand Prix', lastSeason: 2026 },
  { circuitId: 'vegas', circuitName: 'Las Vegas Strip Street Circuit', url: WIKI('Las_Vegas_Grand_Prix'), Location: loc(36.1147, -115.173, 'Las Vegas', 'USA'), trackCoords: loopAt(-115.17, 36.11, 3), raceCount: 3, lastRaceName: 'Las Vegas Grand Prix', lastSeason: 2025 },
  { circuitId: 'hungaroring', circuitName: 'Hungaroring', url: WIKI('Hungaroring'), Location: loc(47.5789, 19.2486, 'Budapest', 'Hungary'), trackCoords: trackCoordsFixture(), raceCount: 5, lastRaceName: 'Hungarian Grand Prix', lastSeason: 2026 },
  { circuitId: 'imola', circuitName: 'Autodromo Internazionale Enzo e Dino Ferrari', url: WIKI('Imola_Circuit'), Location: loc(44.3439, 11.7167, 'Imola', 'Italy'), trackCoords: loopAt(11.71, 44.34, 4), raceCount: 3, lastRaceName: 'Emilia Romagna Grand Prix', lastSeason: 2025 },
  { circuitId: 'monaco', circuitName: 'Circuit de Monaco', url: WIKI('Circuit_de_Monaco'), Location: loc(43.7347, 7.42056, 'Monte Carlo', 'Monaco'), trackCoords: loopAt(7.42, 43.73, 5), raceCount: 5, lastRaceName: 'Monaco Grand Prix', lastSeason: 2026 },
  { circuitId: 'ricard', circuitName: 'Circuit Paul Ricard', url: WIKI('Circuit_Paul_Ricard'), Location: loc(43.2506, 5.79167, 'Le Castellet', 'France'), trackCoords: null, raceCount: 1, lastRaceName: 'French Grand Prix', lastSeason: 2022 },
]
const SEPANG = { circuitId: 'sepang', circuitName: 'Sepang International Circuit', url: WIKI('Sepang_International_Circuit'), Location: loc(2.76083, 101.738, 'Kuala Lumpur', 'Malaysia') }

export function circuitsFixture() { return RAW_CIRCUITS.map((c) => ({ ...c })) }

/** Calendar for any season: monaco, hungaroring and monza are past; marina_bay, sepang (calendar-only) and vegas upcoming. */
export function calendarFixture(season = 2026) {
  const rd = (round, c, date, raceName, flags = {}) => ({
    round: String(round), season: String(season), date, time: '13:00:00Z', raceName,
    Circuit: { circuitId: c.circuitId, circuitName: c.circuitName, Location: c.Location },
    isUpcoming: false, isCurrentWeekend: false, ...flags,
  })
  const by = Object.fromEntries(RAW_CIRCUITS.map((c) => [c.circuitId, c]))
  return [
    rd(6, by.monaco, `${season}-05-24`, 'Monaco Grand Prix'),
    rd(13, by.hungaroring, `${season}-07-26`, 'Hungarian Grand Prix'),
    rd(14, by.monza, `${season}-09-06`, 'Italian Grand Prix'),
    rd(16, by.marina_bay, `${season}-10-11`, 'Singapore Grand Prix', { isUpcoming: true }),
    rd(17, SEPANG, `${season}-10-25`, 'Malaysian Grand Prix', { isUpcoming: true }),
    rd(19, by.vegas, `${season}-11-22`, 'Las Vegas Grand Prix', { isUpcoming: true }),
  ]
}

const GRID_DRIVERS = [
  ['max_verstappen', 'Max', 'Verstappen', 'red_bull', 'Red Bull'], ['norris', 'Lando', 'Norris', 'mclaren', 'McLaren'],
  ['piastri', 'Oscar', 'Piastri', 'mclaren', 'McLaren'], ['leclerc', 'Charles', 'Leclerc', 'ferrari', 'Ferrari'],
  ['hamilton', 'Lewis', 'Hamilton', 'ferrari', 'Ferrari'], ['russell', 'George', 'Russell', 'mercedes', 'Mercedes'],
  ['perez', 'Sergio', 'Perez', 'red_bull', 'Red Bull'], ['alonso', 'Fernando', 'Alonso', 'aston_martin', 'Aston Martin'],
]
/** One race at a circuit: finishing order is a rotation of the grid so winners, podiums, gains and DNFs vary by season. */
function raceAt(season, round, raceName, k) {
  const results = GRID_DRIVERS.map(([driverId, givenName, familyName, constructorId, name], i) => {
    const pos = ((i + k) % 8) + 1
    const dnf = i === 7
    return {
      position: String(pos), grid: String(i === 3 && k % 2 ? 0 : i + 1), points: '0', laps: '53',
      status: dnf ? 'Engine' : pos > 6 ? '+1 Lap' : 'Finished',
      Driver: { driverId, givenName, familyName }, Constructor: { constructorId, name },
    }
  }).sort((a, b) => Number(a.position) - Number(b.position))
  return { season: String(season), round: String(round), raceName, date: `${season}-09-0${1 + (k % 8)}`, QualifyingResults: [], Results: results }
}
const HISTORY_SEASONS = { monza: [2022, 2023, 2024, 2025, 2026], marina_bay: [2022, 2023, 2024, 2025, 2026], vegas: [2023, 2024, 2025], imola: [2022, 2023, 2025], monaco: [2022, 2023, 2024, 2025, 2026], ricard: [2022] }
const CASSANDRA = { monza: '2025_9912', marina_bay: '2025_9930', vegas: '2025_9940', imola: '2025_9920' }

/** /api/stats/circuit/:id body, or null for an id the fixture does not know. */
export function circuitHistoryFixture(id) {
  if (id === 'hungaroring') return { races: [] }
  if (id === 'sepang') return { circuit: null, races: [], lastRace: null, cassandraRaceId: null }
  const seasons = HISTORY_SEASONS[id]
  const raw = RAW_CIRCUITS.find((c) => c.circuitId === id)
  if (!seasons || !raw) return null
  const races = seasons.map((y, k) => raceAt(y, 14 - (k % 3), raw.lastRaceName, k))
  return { circuit: { circuitId: id, circuitName: raw.circuitName }, races, lastRace: races.at(-1), cassandraRaceId: CASSANDRA[id] ?? null }
}

/** /api/circuits/:id body, or null for unknown ids. hungaroring stays byte-identical to the original catch-all. */
export function circuitByIdFixture(id, rich = false) {
  if (id === 'hungaroring') return { circuitId: 'hungaroring', circuitName: 'Hungaroring', Location: { lat: '47.5789', long: '19.2486' }, trackCoords: rich ? trackCoordsFixture() : [] }
  if (id === 'sepang') return { ...SEPANG, trackCoords: null, trackFetched: false, isNew: true }
  const raw = RAW_CIRCUITS.find((c) => c.circuitId === id)
  if (!raw) return null
  const { raceCount, lastRaceName, lastSeason, ...rest } = raw
  void raceCount; void lastRaceName; void lastSeason
  return rest
}

/** Open-Meteo `daily` payload for the requested start/end dates. */
export function weatherFixture(start, end) {
  const days = []
  for (let t = Date.parse(start); t <= Date.parse(end); t += D) days.push(new Date(t).toISOString().slice(0, 10))
  return {
    daily: {
      time: days,
      temperature_2m_max: days.map((_, i) => 24 + i),
      temperature_2m_min: days.map((_, i) => 14 + i),
      precipitation_probability_max: days.map((_, i) => 10 * (i + 1)),
      weathercode: days.map(() => 2),
    },
  }
}

/** Season performance for the title-fight VS card; deterministic per driverId. */
export function perfFixture(driverId) {
  const lead = driverId === 'max_verstappen' || driverId === 'lando'
  const races = Array.from({ length: 12 }, (_, i) => ({
    round: i + 1, raceName: `Round ${i + 1} GP`, grid: lead ? (i % 3) + 1 : (i % 4) + 2,
    position: lead ? (i % 4) + 1 : (i % 5) + 2, status: 'Finished', points: 10, finished: true,
  }))
  return { races, stats: { wins: lead ? 6 : 3, podiums: lead ? 9 : 7, poles: lead ? 5 : 2, fastestLaps: lead ? 4 : 3 }, reliability: {} }
}

// ── Standings fixtures ──────────────────────────────────────────────────────
// Default 2026 keeps the original 3-driver, 3-round payload (the shell rail on the Dashboard baselines renders it);
// `standings: 'rich'` switches 2026 to a full grid whose last entry is a sprint-only round.
const TEAM_ORDER = [['red_bull', 'Red Bull'], ['mclaren', 'McLaren'], ['ferrari', 'Ferrari'], ['mercedes', 'Mercedes'], ['aston_martin', 'Aston Martin'],
  ['alpine', 'Alpine'], ['williams', 'Williams'], ['haas', 'Haas'], ['rb', 'RB'], ['audi', 'Audi']]
const GP_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1]
const NAMES = ['Max Verstappen', 'Yuki Tsunoda', 'Lando Norris', 'Oscar Piastri', 'Charles Leclerc', 'Lewis Hamilton', 'George Russell', 'Kimi Antonelli',
  'Fernando Alonso', 'Lance Stroll', 'Pierre Gasly', 'Franco Colapinto', 'Alexander Albon', 'Carlos Sainz', 'Oliver Bearman', 'Esteban Ocon',
  'Liam Lawson', 'Isack Hadjar', 'Nico Hulkenberg', 'Gabriel Bortoleto']

/** Rounds per season: [entries, complete, totalRounds, sprintOnlyLast] */
const SEASONS = { 2022: [22, 22, 22, false], 2023: [20, 20, 22, false], 2024: [24, 24, 24, false], 2025: [24, 24, 24, false], 2026: [17, 16, 23, true] }

function build(year) {
  const [entries, complete, total, sprintLast] = SEASONS[year]
  const rounds = Array.from({ length: entries }, (_, i) => ({ round: String(i + 1), raceName: `Round ${i + 1} GP`, date: `${year}-03-${String((i % 27) + 1).padStart(2, '0')}`, complete: i < complete }))
  const drivers = NAMES.map((name, i) => {
    const [teamId, team] = TEAM_ORDER[Math.floor(i / 2)]
    let sum = 0
    const cumulative = rounds.map((r, k) => {
      if (!r.complete) sum += SPRINT_POINTS[(i * 3 + k) % 12] ?? 0
      else sum += GP_POINTS[Math.min(19, Math.floor((((i * 7 + k * 3 + year) % 20) + i) / 2))] ?? 0
      return sum
    })
    const id = name.toLowerCase().replace(/[^a-z]+/g, '_')
    return { driverId: id, name, team, teamId, wins: i < 4 ? 4 - i : 0, number: String(i + 1), finalPoints: sum, officialPosition: 0, cumulative }
  })
  const constructors = TEAM_ORDER.map(([constructorId, name], t) => {
    const mine = drivers.filter(d => d.teamId === constructorId)
    const cumulative = rounds.map((_, k) => mine.reduce((n, d) => n + d.cumulative[k], 0))
    return { constructorId, name, wins: Math.max(0, 5 - t), finalPoints: cumulative.at(-1), officialPosition: t + 1, cumulative }
  })
  void sprintLast
  return { season: String(year), rounds, totalRounds: total, drivers, constructors }
}

export function seasonStandingsFixture(year = 2026, rich = false) {
  if (year === 2026 && !rich) {
    const rounds = [1, 2, 3].map(n => ({ round: String(n), raceName: `Round ${n} GP`, complete: true }))
    const mk = (id, name, team, teamId, pts) => ({ driverId: id, name, team, teamId, cumulative: pts })
    return {
      season: '2026', rounds, totalRounds: 24,
      drivers: [
        mk('max_verstappen', 'Max Verstappen', 'Red Bull', 'red_bull', [25, 43, 68]),
        mk('norris', 'Lando Norris', 'McLaren', 'mclaren', [18, 43, 61]),
        mk('leclerc', 'Charles Leclerc', 'Ferrari', 'ferrari', [15, 30, 50]),
      ],
    }
  }
  if (!Object.hasOwn(SEASONS, year)) return { rounds: [], drivers: [], totalRounds: 0 }
  const { constructors, ...rest } = build(year)
  void constructors
  return rest
}

export function ctorStandingsFixture(year = 2026, rich = false) {
  if (year === 2026 && !rich) {
    return {
      season: '2026', rounds: [1, 2, 3].map(n => ({ round: String(n), raceName: `Round ${n} GP`, complete: true })), totalRounds: 24,
      constructors: [
        { constructorId: 'mclaren', name: 'McLaren', cumulative: [30, 70, 100] },
        { constructorId: 'ferrari', name: 'Ferrari', cumulative: [20, 50, 80] },
      ],
    }
  }
  if (!Object.hasOwn(SEASONS, year)) return { rounds: [], constructors: [], totalRounds: 0 }
  const { drivers, ...rest } = build(year)
  void drivers
  return rest
}

/** Current-grid drivers with headshots for the top three (the image host is stubbed in installMockApi). */
export function driversFixture() {
  return NAMES.map((name, i) => ({
    driverId: name.toLowerCase().replace(/[^a-z]+/g, '_'), givenName: name.split(' ')[0], familyName: name.split(' ').slice(1).join(' '),
    code: name.split(' ').pop().slice(0, 3).toUpperCase(), permanentNumber: String(i + 1),
    photoUrl: i < 6 ? `https://media.formula1.com/drivers/${i}.png` : undefined,
  }))
}


// ── Encyclopedia fixtures (driver and constructor profiles, search, graphs, pace) ─────────────────────────────
const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, '_')
const KNOWN_DRIVERS = new Map([...NAMES.map((n, i) => [slug(n), { name: n, team: TEAM_ORDER[Math.floor(i / 2)] }]), ['norris', { name: 'Lando Norris', team: ['mclaren', 'McLaren'] }], ['piastri', { name: 'Oscar Piastri', team: ['mclaren', 'McLaren'] }], ['leclerc', { name: 'Charles Leclerc', team: ['ferrari', 'Ferrari'] }]])
const KNOWN_TEAMS = new Map(TEAM_ORDER)

export function driverStatsFixture(id) {
  const d = KNOWN_DRIVERS.get(id)
  if (!d) return null
  const [given, ...rest] = d.name.split(' ')
  return {
    driver: { driverId: id, givenName: given, familyName: rest.join(' '), code: rest.join(' ').slice(0, 3).toUpperCase(), permanentNumber: '4', nationality: 'British', dateOfBirth: '1999-11-13T00:00:00.000Z', photoUrl: 'https://media.formula1.com/drivers/1.png' },
    wins: 13, podiums: 44, races: 109, points: 1206, polePositions: 18, fastestLaps: 17, teams: [d.team[1]], firstSeason: '2022', lastSeason: '2026', totalSeasons: 5,
    top10s: 90, dnfs: 14, pointsPerRace: 11.06, top10Rate: 82.6, dnfRate: 12.8, avgPositionsGained: -1.05,
  }
}
export function driverSeasonsFixture(id) {
  const d = KNOWN_DRIVERS.get(id)
  return [2026, 2025, 2024, 2023, 2022].map((y, i) => ({ season: String(y), team: d.team[1], constructorId: d.team[0], points: 100 + i * 50, wins: 5 - i, podiums: 9 - i, poles: 3, races: 22 }))
}
export function driverCircuitsFixture() {
  return [['monza', 'Autodromo Nazionale di Monza', 2, 4], ['hungaroring', 'Hungaroring', 2, 3], ['monaco', 'Circuit de Monaco', 1, 1], ['imola', 'Imola', 0, 2]]
    .map(([id, name, wins, podiums]) => ({ _id: id, circuitName: name, races: 5, points: 40 + wins * 10, wins, podiums }))
}
export function constructorStatsFixture(id) {
  if (!KNOWN_TEAMS.has(id)) return null
  const drivers = [{ id: 'norris', name: 'Lando Norris', wins: 2, points: 201 }, { id: 'piastri', name: 'Oscar Piastri', wins: 0, points: 138 }]
  return {
    constructorId: id, name: KNOWN_TEAMS.get(id),
    stats: { seasons: 5, firstSeason: '2022', lastSeason: '2026', races: 109, wins: 22, podiums: 53, poles: 17, points: 2299, championships: 2, championSeasons: ['2024', '2025'], reliability: 85.8 },
    seasons: [2026, 2025, 2024, 2023, 2022].map((y, i) => ({ season: String(y), wins: 5 - i, points: 300 + i * 90, races: 22, champion: y === 2025, drivers })),
  }
}
export function searchFixture(q) {
  const t = q.toLowerCase()
  const rows = [
    { type: 'race', id: '2025-9', label: '2025 Italian Grand Prix', season: '2025', round: '9', circuitName: 'Monza' },
    { type: 'driver', id: 'norris', label: 'Lando Norris', nationality: 'British', number: '4' },
    { type: 'constructor', id: 'mclaren', label: 'McLaren' },
    { type: 'circuit', id: 'monza', label: 'Autodromo Nazionale di Monza', country: 'Italy', locality: 'Monza' },
  ]
  return rows.filter((r) => r.label.toLowerCase().includes(t) || (t === 'mo' && r.id === 'monza') || (t === 'ma' && r.id === 'mclaren'))
}
export function egoFixture(id, isTeam) {
  if (isTeam) {
    return { nodes: [{ id: `team_${id}`, name: 'McLaren', type: 'Team', isSelf: true }, { id: 'driver_norris', name: 'Lando Norris', type: 'Driver', seasons: ['2022', '2023'] }, { id: 'driver_piastri', name: 'Oscar Piastri', type: 'Driver', seasons: ['2023'] }], links: [{ source: `team_${id}`, target: 'driver_norris', rel: 'drove_for' }, { source: `team_${id}`, target: 'driver_piastri', rel: 'drove_for' }] }
  }
  return { nodes: [{ id: `driver_${id}`, name: 'Lando Norris', type: 'Driver', isSelf: true }, { id: 'team_mclaren', name: 'McLaren', type: 'Team', seasons: ['2022', '2023'] }, { id: 'teammate_piastri', name: 'Oscar Piastri', type: 'Teammate', seasons: ['2023'] }], links: [{ source: `driver_${id}`, target: 'team_mclaren', rel: 'drove_for' }, { source: 'teammate_piastri', target: 'team_mclaren', rel: 'teammate' }] }
}
export function teamPaceFixture(year, raceId) {
  if (Number(year) !== 2026) return null
  const laps = (base) => Array.from({ length: 30 }, (_, i) => ({ lap: i + 2, time: base + (i % 5) * 0.2, compound: 'MEDIUM' }))
  return {
    raceId: raceId || '2026_11234', raceName: raceId === '2026_11245' ? 'Shanghai' : 'Melbourne',
    availableRaces: [{ raceId: '2026_11234', raceName: 'Melbourne' }, { raceId: '2026_11245', raceName: 'Shanghai' }],
    drivers: [{ driverId: '1', acronym: 'NOR', laps: laps(85) }, { driverId: '81', acronym: 'PIA', laps: laps(85.4) }],
  }
}

// ── Race weekend + Race analysis fixtures (navigation 14 -> 8) ──────────────────────────────────────────
const ANALYSIS_RACES = [
  { raceId: '2026_9913', raceName: 'Hungarian Grand Prix', round: 13, date: '2026-07-26T13:00:00Z', circuitId: 'hungaroring' },
  { raceId: '2026_9906', raceName: 'Monaco Grand Prix', round: 6, date: '2026-05-24T13:00:00Z', circuitId: 'monaco' },
  { raceId: '2025_9912', raceName: 'Italian Grand Prix', round: 14, date: '2025-09-07T13:00:00Z', circuitId: 'monza' },
  { raceId: '2025_9911', raceName: 'Dutch Grand Prix', round: 15, date: '2025-08-31T13:00:00Z', circuitId: 'zandvoort' },
]
const CASS_DRIVERS = [
  { driverId: '1', acronym: 'VER', fullName: 'Max Verstappen', teamName: 'Red Bull Racing' },
  { driverId: '4', acronym: 'NOR', fullName: 'Lando Norris', teamName: 'McLaren' },
  { driverId: '81', acronym: 'PIA', fullName: 'Oscar Piastri', teamName: 'McLaren' },
  { driverId: '16', acronym: 'LEC', fullName: 'Charles Leclerc', teamName: 'Ferrari' },
  { driverId: '44', acronym: 'HAM', fullName: 'Lewis Hamilton', teamName: 'Ferrari' },
  { driverId: '63', acronym: 'RUS', fullName: 'George Russell', teamName: 'Mercedes' },
]

/** GET /api/telemetry/races */
export function analysisRacesFixture() { return ANALYSIS_RACES.map((r) => ({ ...r })) }
/** GET /api/telemetry/drivers/:raceId */
export function analysisDriversFixture() { return CASS_DRIVERS.map((d) => ({ ...d })) }
/** GET /api/telemetry/pace/:raceId?drivers=a,b */
export function analysisPaceFixture(ids) {
  return ids.map((driverId, k) => ({ driverId, laps: Array.from({ length: 40 }, (_, i) => ({ lap: i + 1, time: 90 + k * 0.3 + (i % 4) * 0.15, isPit: i === 19 + k })) }))
}
/** GET /api/telemetry/positions/:raceId */
export function analysisPositionsFixture() {
  const ids = CASS_DRIVERS.map((d) => d.driverId)
  const laps = Array.from({ length: 40 }, (_, i) => Object.fromEntries([['lap', i + 1], ...ids.map((id, k) => [id, ((k + Math.floor(i / 13)) % ids.length) + 1])]))
  return { totalLaps: 40, drivers: CASS_DRIVERS.map((d) => ({ driverId: d.driverId, acronym: d.acronym, pitLaps: [20], dnf: false, dns: false, lastLap: 40 })), laps }
}
/** GET /api/telemetry/strategy/:raceId */
export function analysisStrategyFixture() {
  return CASS_DRIVERS.map((d, k) => ({ ...d, stints: [{ compound: 'MEDIUM', lapStart: 1, lapEnd: 19 + k, tyreAge: 0 }, { compound: k % 2 ? 'HARD' : 'SOFT', lapStart: 20 + k, lapEnd: 40, tyreAge: 0 }] }))
}
/** GET /api/telemetry/laps/:raceId/:driverId */
export function analysisLapsFixture() {
  return Array.from({ length: 40 }, (_, i) => ({ lap_number: i + 1, lap_time: 90 + (i % 4) * 0.2, compound: i < 20 ? 'MEDIUM' : 'HARD', sector1: 28 + (i % 3) * 0.1, sector2: 35 + (i % 2) * 0.1, sector3: 27 + (i % 5) * 0.05 }))
}

/**
 * GET /api/races/:season/:round. Rounds 1-12 of a season are done (with results and a qualifying order); round 13 of 2026 is the
 * dashboard's upcoming Hungarian GP (schedule relative to `base`); round 99 does not exist. Seasons before 2022 have no circuit or schedule.
 */
export function raceRoundFixture(season, round, base = null) {
  BASE = base
  const s = Number(season), r = Number(round)
  if (!Number.isInteger(s) || !Number.isInteger(r) || r < 1 || r > 30) return null
  if (s === 2026 && r === 13) {
    const d = dashboardFixture(base).nextRace
    return { season: '2026', round: '13', raceName: d.raceName, date: d.schedule.race.date, time: d.schedule.race.time, Circuit: { circuitId: 'hungaroring', circuitName: 'Hungaroring', Location: { locality: 'Budapest', country: 'Hungary', lat: '47.5789', long: '19.2486' } }, schedule: d.schedule, Results: [] }
  }
  const race = raceAt(s, r, `Round ${r} Grand Prix`, r)
  race.Results = race.Results.map((x, i) => ({ ...x, points: String(GP_POINTS[i] ?? 0), Time: { time: i === 0 ? '1:31:44.2' : `+${(i * 4.3).toFixed(1)}s` }, Driver: { ...x.Driver, code: x.Driver.familyName.slice(0, 3).toUpperCase(), permanentNumber: String(i + 1) } }))
  race.QualifyingResults = race.Results.map((x, i) => ({ position: String(i + 1), Q1: `1:2${i}.1`, Q2: `1:1${9 - Math.min(i, 8)}.4`, Q3: i < 5 ? `1:1${8 - i}.9` : '', Driver: x.Driver, Constructor: x.Constructor }))
  if (s >= 2022) {
    race.Circuit = { circuitId: 'monza', circuitName: 'Autodromo Nazionale di Monza', Location: { locality: 'Monza', country: 'Italy', lat: '45.62', long: '9.28' } }
    const day = (n) => `${s}-0${1 + (r % 8)}-${String(10 + n).padStart(2, '0')}`
    race.schedule = { fp1: { date: day(0), time: '11:30:00Z' }, fp2: { date: day(0), time: '15:00:00Z' }, fp3: { date: day(1), time: '10:30:00Z' }, qualifying: { date: day(1), time: '14:00:00Z' }, race: { date: day(2), time: '13:00:00Z' } }
    race.date = day(2)
  } else race.date = `${s}-05-${String(10 + (r % 15)).padStart(2, '0')}`
  return race
}

/** GET /api/drivers/featured?season= : a short line-up per season (seasons before the standings data). */
export function featuredDriversFixture(season) {
  return [
    { driverId: 'senna', givenName: 'Ayrton', familyName: 'Senna', constructorId: 'mclaren', constructorName: 'McLaren', permanentNumber: '12', code: 'SEN', nationality: 'Brazilian' },
    { driverId: 'prost', givenName: 'Alain', familyName: 'Prost', constructorId: 'ferrari', constructorName: 'Ferrari', permanentNumber: '1', code: 'PRO', nationality: 'French' },
    { driverId: 'alesi', givenName: 'Jean', familyName: 'Alesi', constructorId: 'ferrari', constructorName: 'Ferrari', code: 'ALE', nationality: 'French', season: String(season) },
  ]
}

export function liveFixture(overrides = {}, count = 5) {
  const mk = (n, pos, acronym, full, team, color, extra = {}) => ({
    driverNum: String(n), position: pos, acronym, fullName: full, teamName: team, teamColor: color,
    stat: pos === 1 ? 'LEADER' : `+${(pos * 1.37).toFixed(3)}`, statLabel: 'gap',
    lastLap: `1:2${pos}.${100 + pos}`, sectors: [{ value: '28.1', status: 'green' }, { value: '31.4', status: 'purple' }, { value: '', status: null }],
    inPit: false, retired: false, ...extra,
  })
  return {
    isLive: true, isRaceType: true, sessionName: 'Race', raceName: 'Hungarian Grand Prix',
    currentLap: 31, totalLaps: 70, trackStatus: null, updatedAt: new Date().toISOString(),
    classification: [
      mk(1, 1, 'VER', 'Max Verstappen', 'Red Bull', '#3671C6'),
      mk(4, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000'),
      mk(16, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#E8002D'),
      mk(81, 4, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', { inPit: true }),
      mk(63, 5, 'RUS', 'George Russell', 'Mercedes', '#27F4D2'),
      ...Array.from({ length: Math.max(0, count - 5) }, (_, i) => mk(30 + i, 6 + i, `D${String(i + 6).padStart(2, '0')}`, `Driver ${i + 6}`, 'Haas', '#B6BABD', { compound: ['SOFT', 'MEDIUM', 'HARD'][i % 3] })),
    ],
    ...overrides,
  }
}

/**
 * @param page   Playwright page
 * @param opts   { live?: boolean, counters?: object, base?: number (fixture time origin), rich?: boolean (non-empty
 *               trackCoords + fulfilled Open-Meteo), hang?: string[] (paths that never answer), fail?: string[] (paths that answer 503),
 *               liveCount?: number (rows in the live classification), standings?: 'rich' (full 2026 grid with a sprint-only last round) }
 */
export async function installMockApi(page, opts = {}) {
  const counters = opts.counters ?? {}
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const p = url.pathname
    counters[p] = (counters[p] ?? 0) + 1
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (opts.hang?.includes(p)) return new Promise(() => {})
    if (opts.failAfter && Object.hasOwn(opts.failAfter, p) && counters[p] > opts.failAfter[p]) return json({ message: 'mocked failure' }, 503)
    if (opts.fail?.includes(p)) return json({ message: 'mocked failure' }, 503)

    if (p === '/api/dashboard/live/status') {
      return route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
        body: `retry: 60000\ndata: ${JSON.stringify({ available: !!opts.live, sessionName: opts.live ? 'Race' : null, raceName: 'Hungarian Grand Prix', isRaceType: true })}\n\n`,
      })
    }
    if (p === '/api/dashboard/live') return json(opts.live ? (opts.liveBody ?? liveFixture({ updatedAt: new Date(opts.base ?? Date.now()).toISOString() }, opts.liveCount ?? 5)) : { isLive: false })
    if (p === '/api/dashboard') return json(dashboardFixture(opts.base ?? null))
    if (p.startsWith('/api/stats/standings/')) return json(seasonStandingsFixture(Number(p.split('/').pop()), opts.standings === 'rich'))
    if (p.startsWith('/api/stats/constructor-standings/')) return json(ctorStandingsFixture(Number(p.split('/').pop()), opts.standings === 'rich'))
    if (p === '/api/drivers') return json(driversFixture())
    if (p === '/api/telemetry/timing-tower') return json(null)
    if (p.startsWith('/api/auth/')) {
      if (opts.auth) return opts.auth(route, p)
      return json({ message: 'Invalid credentials' }, 401)
    }
    if (p === '/api/circuits') return json(opts.circuits ?? circuitsFixture())
    if (p === '/api/races' && url.searchParams.has('season')) return json(opts.calendar ?? calendarFixture(Number(url.searchParams.get('season'))))
    if (p.startsWith('/api/circuits/')) {
      const body = circuitByIdFixture(decodeURIComponent(p.split('/').pop()), opts.rich)
      return body ? json(body) : json({ message: 'Circuit not found' }, 404)
    }
    if (p.startsWith('/api/stats/circuit/')) {
      const body = circuitHistoryFixture(decodeURIComponent(p.split('/').pop()))
      return body ? json(body) : json({ message: 'Circuit not found' }, 404)
    }
    if (p === '/api/stats/historical-performance') return json(perfFixture(url.searchParams.get('driverId')))
    if (p.startsWith('/api/stats/driver/')) {
      const parts = p.split('/').slice(4)
      const id = decodeURIComponent(parts[0] ?? '')
      const stats = driverStatsFixture(id)
      if (!stats) return json({ message: 'Driver not found' }, 404)
      if (parts[1] === 'seasons') return json(driverSeasonsFixture(id))
      if (parts[1] === 'circuits') return json(driverCircuitsFixture())
      return json(stats)
    }
    if (p.startsWith('/api/stats/constructor/')) {
      const body = constructorStatsFixture(decodeURIComponent(p.split('/').pop()))
      return body ? json(body) : json({ message: 'Constructor not found' }, 404)
    }
    if (p === '/api/races/2026/99' || /^\/api\/races\/\d+\/\d+$/.test(p)) {
      const [, , , season, round] = p.split('/')
      const body = raceRoundFixture(season, round, opts.base ?? null)
      return body ? json(body) : json({ message: 'Race not found' }, 404)
    }
    if (p === '/api/drivers/featured') return json(featuredDriversFixture(url.searchParams.get('season')))
    if (p === '/api/telemetry/races') return json(analysisRacesFixture())
    if (p.startsWith('/api/telemetry/drivers/')) return json(analysisDriversFixture())
    if (p.startsWith('/api/telemetry/pace/')) return json(analysisPaceFixture((url.searchParams.get('drivers') ?? '').split(',').filter(Boolean)))
    if (p.startsWith('/api/telemetry/positions/')) return json(analysisPositionsFixture())
    if (p.startsWith('/api/telemetry/strategy/')) return json(analysisStrategyFixture())
    if (p.startsWith('/api/telemetry/safety-car/')) return json([])
    if (p.startsWith('/api/telemetry/race-info/')) return json({ totalLaps: 40, driverStatuses: {} })
    if (p.startsWith('/api/telemetry/laps/')) return json(analysisLapsFixture())
    if (p.startsWith('/api/telemetry/pitstops/')) return json([{ stop_number: 1, lap: 20, duration: 22.4 }])
    if (p === '/api/dashboard/h2h') return json({ driverName: url.searchParams.get('driver'), teammateName: 'Oscar Piastri', season: url.searchParams.get('season'), racesCompared: 16, qualiCompared: 15, race: { driver: 9, teammate: 7 }, quali: { driver: 6, teammate: 9 } })
    if (p === '/api/search') return json(searchFixture(url.searchParams.get('q') ?? ''))
    if (p.startsWith('/api/graph/driver/') && p.endsWith('/ego')) return json(egoFixture(p.split('/')[4], false))
    if (p.startsWith('/api/graph/constructor/')) return json(egoFixture(p.split('/').pop(), true))
    if (p === '/api/telemetry/team-pace') return json(teamPaceFixture(url.searchParams.get('year'), url.searchParams.get('raceId')))
    return json({ message: 'mocked backend unavailable' }, 503)
  })
  // Third-party hosts the app touches: keep the tests hermetic.
  await page.route('https://media.formula1.com/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') }))
  await page.route('https://flagcdn.com/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') }))
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }))
  await page.route('https://fonts.gstatic.com/**', r => r.abort())
  await page.route('https://accounts.google.com/**', r => r.abort())
  await page.route('https://api.open-meteo.com/**', (r) => {
    if (!opts.rich) return r.abort()
    const u = new URL(r.request().url())
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(weatherFixture(u.searchParams.get('start_date'), u.searchParams.get('end_date'))) })
  })
  await page.route('https://www.openstreetmap.org/**', r => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body style="background:#222"></body></html>' }))
  // Map tiles: never reach CARTO from a test
  await page.route('**/*.basemaps.cartocdn.com/**', r => r.abort())
  await page.route('**/_vercel/**', r => r.abort())
}
