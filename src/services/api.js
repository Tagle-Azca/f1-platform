const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8741'

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'Request failed')
  }
  return res.json()
}

// ── MongoDB ──────────────────────────────────────────────
export const driversApi = {
  getAll:      (params = {}) => request(`/api/drivers?${new URLSearchParams(params)}`),
  getById:     (id)          => request(`/api/drivers/${id}`),
  getFeatured: (seasons, season) => {
    const params = season ? `season=${season}` : `seasons=${seasons ?? 10}`
    return request(`/api/drivers/featured?${params}`)
  },
}

export const racesApi = {
  getAll: (params = {}) =>
    request(`/api/races?${new URLSearchParams(params)}`),
  getBySeason: (season) => request(`/api/races?season=${season}`),
  getByRound: (season, round) => request(`/api/races/${season}/${round}`),
}

export const circuitsApi = {
  getAll: () => request('/api/circuits'),
  getById: (id) => request(`/api/circuits/${id}`),
}

// ── Cassandra ────────────────────────────────────────────
export const telemetryApi = {
  getLapTimes:       (raceId, driverId) => request(`/api/telemetry/laps/${raceId}/${driverId}`),
  getPitStops:       (raceId, driverId) => request(`/api/telemetry/pitstops/${raceId}/${driverId}`),
  getAvailableRaces: ()                 => request('/api/telemetry/races'),
  getRaceDrivers:    (raceId)           => request(`/api/telemetry/drivers/${raceId}`),
  getRacePace:       (raceId, drivers)  => request(`/api/telemetry/pace/${raceId}?drivers=${drivers.join(',')}`),
  getTireStrategy:   (raceId)           => request(`/api/telemetry/strategy/${raceId}`),
  getRacePositions:  (raceId)           => request(`/api/telemetry/positions/${raceId}`),
  getTeamPace:       (teamName, year, raceId) => request(`/api/telemetry/team-pace?teamName=${encodeURIComponent(teamName)}&year=${year}${raceId ? `&raceId=${raceId}` : ''}`),
}

// ── Dgraph ───────────────────────────────────────────────
export const graphApi = {
  getDriverNetwork:       (season)        => request(`/api/graph/drivers${season ? `?season=${season}` : ''}`),
  getDriverEgoGraph:      (driverId)      => request(`/api/graph/driver/${driverId}/ego`),
  getDriverNode:          (driverId)      => request(`/api/graph/driver/${driverId}`),
  getDriverConnections:   (driverId)      => request(`/api/graph/driver/${driverId}/connections`),
  getConstructorEgoGraph: (constructorId) => request(`/api/graph/constructor/${constructorId}`),
}

// ── Search (MongoDB) ─────────────────────────────────────
export const searchApi = {
  search: (q, limit = 12) =>
    request(`/api/search?${new URLSearchParams({ q, limit })}`),
}

// ── Dashboard ────────────────────────────────────────────
export const dashboardApi = {
  get:               () => request('/api/dashboard'),
  getLive:           () => request('/api/dashboard/live'),
  getClassification: () => request('/api/dashboard/live'),
}

// ── Constructors (MongoDB aggregations) ─────────────────
export const constructorsApi = {
  getStats: (id) => request(`/api/stats/constructor/${id}`),
}

// ── Stats (MongoDB aggregations) ────────────────────────
export const statsApi = {
  driverStats:              (id)              => request(`/api/stats/driver/${id}`),
  driverSeasons:            (id)              => request(`/api/stats/driver/${id}/seasons`),
  driverCircuits:           (id)              => request(`/api/stats/driver/${id}/circuits`),
  circuitHistory:           (id)              => request(`/api/stats/circuit/${id}`),
  getSeasonStandings:       (season)          => request(`/api/stats/standings/${season}`),
  getConstructorStandings:  (season)          => request(`/api/stats/constructor-standings/${season}`),
  seasonDrivers:            (season)          => request(`/api/stats/season-drivers/${season}`),
  historicalPerformance:    (driverId, year)  => request(`/api/stats/historical-performance?driverId=${driverId}&year=${year}`),
}
