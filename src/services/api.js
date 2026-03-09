const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
  getFeatured: (seasons = 10) => request(`/api/drivers/featured?seasons=${seasons}`),
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
  getLapTimes: (raceId, driverId) =>
    request(`/api/telemetry/laps/${raceId}/${driverId}`),
  getPitStops: (raceId, driverId) =>
    request(`/api/telemetry/pitstops/${raceId}/${driverId}`),
  getAvailableRaces: () => request('/api/telemetry/races'),
}

// ── Dgraph ───────────────────────────────────────────────
export const graphApi = {
  getDriverNetwork:     (season)   => request(`/api/graph/drivers${season ? `?season=${season}` : ''}`),
  getDriverEgoGraph:    (driverId) => request(`/api/graph/driver/${driverId}/ego`),
  getDriverNode:        (driverId) => request(`/api/graph/driver/${driverId}`),
  getDriverConnections: (driverId) => request(`/api/graph/driver/${driverId}/connections`),
}

// ── Search (MongoDB) ─────────────────────────────────────
export const searchApi = {
  search: (q, limit = 12) =>
    request(`/api/search?${new URLSearchParams({ q, limit })}`),
}

// ── Stats (MongoDB aggregations) ────────────────────────
export const statsApi = {
  driverStats:       (id)     => request(`/api/stats/driver/${id}`),
  circuitHistory:    (id)     => request(`/api/stats/circuit/${id}`),
  getSeasonStandings:(season) => request(`/api/stats/standings/${season}`),
}
