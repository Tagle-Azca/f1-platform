const iso = (ms) => new Date(Date.now() + ms).toISOString()
const D = 86400000, H = 3600000
const sched = (ms) => { const t = iso(ms); return { date: t.slice(0, 10), time: t.slice(11, 19) + 'Z', dateTime: t } }

export const nextRace = () => ({
  raceName: 'Hungarian Grand Prix', round: '13', season: '2026', country: 'Hungary', locality: 'Budapest',
  circuit: 'Hungaroring', circuitId: 'hungaroring',
  schedule: { fp1: sched(-D), fp2: sched(D), fp3: sched(2 * D), qualifying: sched(2 * D + 4 * H), race: sched(3 * D) },
  currentSession: null, nextSession: { key: 'fp2', label: 'Practice 2', dateTime: iso(D) }, raceDateTime: iso(3 * D),
})

export const dashboard = () => ({
  totalRounds: 24, roundsDone: 12, nextRace: nextRace(),
  standings: [
    { position: 1, driverId: 'max', name: 'Max Verstappen', team: 'Red Bull', constructorId: 'red_bull', points: 380 },
    { position: 2, driverId: 'lando', name: 'Lando Norris', team: 'McLaren', constructorId: 'mclaren', points: 361 },
    { position: 3, driverId: 'charles', name: 'Charles Leclerc', team: 'Ferrari', constructorId: 'ferrari', points: 322 },
  ],
  constructorStandings: [{ position: 1, constructorId: 'mclaren', name: 'McLaren', points: 600 }, { position: 2, constructorId: 'ferrari', name: 'Ferrari', points: 500 }],
  lastSession: {
    sessionType: 'Race', sessionLabel: 'Race', date: '2026-07-26', season: '2026', round: '12',
    podium: [{ position: 1, driverId: 'lando', name: 'Lando Norris', constructorId: 'mclaren', time: '1:32:10' }, { position: 2, driverId: 'oscar', name: 'Oscar Piastri', constructorId: 'mclaren', points: 18 }],
    fastestLap: { name: 'Max Verstappen', time: '1:21.0' },
  },
})

export const seasonStandings = () => ({
  season: '2026', rounds: [1, 2],
  drivers: [
    { driverId: 'max', name: 'Max Verstappen', team: 'Red Bull', teamId: 'red_bull', cumulative: [25, 50] },
    { driverId: 'lando', name: 'Lando Norris', team: 'McLaren', teamId: 'mclaren', cumulative: [18, 43] },
  ],
})
export const ctorStandings = () => ({
  season: '2026', rounds: [1, 2],
  constructors: [{ constructorId: 'mclaren', name: 'McLaren', cumulative: [30, 70] }, { constructorId: 'ferrari', name: 'Ferrari', cumulative: [20, 50] }],
})

export const live = (over = {}) => ({
  isLive: true, isRaceType: true, sessionName: 'Race', raceName: 'Hungarian Grand Prix', currentLap: 5, totalLaps: 70,
  trackStatus: 'Yellow', updatedAt: new Date().toISOString(),
  classification: [
    { driverNum: '1', position: 1, acronym: 'VER', fullName: 'Max Verstappen', teamName: 'RB', teamColor: '#3671C6', stat: 'LEADER', statLabel: 'gap', lastLap: '1:21.0', sectors: [{ value: '28', status: 'purple' }], inPit: false },
    { driverNum: '4', position: 2, acronym: 'NOR', fullName: 'Lando Norris', teamName: 'McLaren', teamColor: '#FF8000', stat: '+1.0', statLabel: 'gap', lastLap: '1:21.5', sectors: [], inPit: true },
  ],
  top3: [
    { driverNum: '1', position: 1, acronym: 'VER', fullName: 'Max Verstappen', teamName: 'RB', teamColor: '#3671C6', stat: 'LEADER', statLabel: 'gap' },
    { driverNum: '4', position: 2, acronym: 'NOR', fullName: 'Lando Norris', teamName: 'McLaren', teamColor: '#FF8000', stat: '+1.0', statLabel: 'gap' },
  ],
  ...over,
})

export const tower = () => ({
  completed: false, sessionName: 'Race', raceName: 'Hungarian Grand Prix', updatedAt: new Date().toISOString(),
  drivers: [
    { driverNum: '1', position: 1, acronym: 'VER', teamName: 'RB', teamColor: '#3671C6', compound: 'SOFT', bestLapStr: '1:20.0', laps: 5, gapStr: 'LEADER', gear: 7, throttle: 80, brake: 0, s1: { time: 28.1, color: 'purple' }, s2: { time: 31, color: 'green' }, s3: null },
    { driverNum: '4', position: 2, acronym: 'NOR', teamName: 'McLaren', teamColor: '#FF8000', compound: 'HARD', bestLapStr: '1:20.5', laps: 5, gapStr: '+1.0', gear: 0, throttle: null, brake: null, s1: { time: '28.3' }, s2: null, s3: null },
  ],
})
