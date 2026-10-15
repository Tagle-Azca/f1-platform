// Pure race-pace model (no React): lap-time statistics and the chart rows for the Pace view.
import { teamNameToColor } from '../../utils/teamColors'
import { teamMark, BASE } from '../../styles/vizPalette'

export const MAX_PACE_DRIVERS = 5
const VALID_LAP = (t) => typeof t === 'number' && t > 10 && t < 200

export function median(arr) {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function stdDev(arr) {
  if (arr.length < 2) return 0
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - avg) ** 2, 0) / arr.length)
}

export function formatLapTime(secs) {
  if (!secs || secs <= 0 || !Number.isFinite(secs)) return '-'
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

/** Series style for a driver: team colour as a contrast-safe mark, the second driver of a team dashed. */
export function seriesFor(teamName, seenTeams, index) {
  const hex = teamNameToColor(teamName)
  const dashed = Boolean(teamName) && seenTeams.has(teamName)
  if (teamName) seenTeams.add(teamName)
  return {
    color: hex ? teamMark(hex, BASE.panel) : (index % 2 === 0 ? 'var(--viz-series-1)' : 'var(--viz-series-2)'),
    dashed,
  }
}

/** Default selection: the first three drivers of the race. */
export const defaultPaceDrivers = (drivers) => (Array.isArray(drivers) ? drivers.slice(0, 3).map(d => d.driverId) : [])

/** Toggle with a cap of MAX_PACE_DRIVERS; adding past the cap is ignored. */
export function toggleDriver(selected, id) {
  if (selected.includes(id)) return selected.filter(d => d !== id)
  return selected.length >= MAX_PACE_DRIVERS ? selected : [...selected, id]
}

/**
 * @param paceData  [{ driverId, laps: [{ lap, time, isPit }] }]
 * @param allDrivers [{ driverId, acronym, teamName }]
 * @returns {{ chartData, driverMeta, pitLines, scPeriods }}
 * Laps shown are those that are not pit laps, the lap after a pit lap, or slower than 135% of the driver median.
 * A safety-car period is a run of >= 2 laps where at least 60% of drivers (and 2) were > 10% slower than their median.
 */
export function buildPace(paceData, allDrivers) {
  if (!Array.isArray(paceData) || !paceData.length) return { chartData: [], driverMeta: [], pitLines: [], scPeriods: [] }
  const byId = new Map((allDrivers ?? []).map(d => [d.driverId, d]))
  const maxLap = Math.max(...paceData.map(d => d.laps.length))
  const pitLines = new Set()
  const seen = new Set()

  const driverMeta = paceData.map((d, i) => {
    const validTimes = d.laps.map(l => l.time).filter(VALID_LAP)
    const med = median(validTimes)
    d.laps.forEach(l => { if (l.isPit) pitLines.add(l.lap) })
    const info = byId.get(d.driverId)
    return {
      driverId: d.driverId,
      ...seriesFor(info?.teamName || '', seen, i),
      acronym: info?.acronym || d.driverId,
      teamName: info?.teamName || '',
      median: med,
      best: validTimes.length ? Math.min(...validTimes) : 0,
      consistency: stdDev(validTimes),
      laps: d.laps,
    }
  })

  const hiddenLaps = new Map()
  for (const d of driverMeta) {
    const hide = new Set()
    for (const l of d.laps) {
      if (l.isPit) { hide.add(l.lap); hide.add(l.lap + 1) }
      if (l.time > d.median * 1.35) hide.add(l.lap)
    }
    hiddenLaps.set(d.driverId, hide)
  }

  const chartData = Array.from({ length: maxLap }, (_, i) => {
    const lap = i + 1
    const row = { lap }
    for (const d of driverMeta) {
      const lapData = d.laps.find(l => l.lap === lap)
      if (lapData && lapData.time > 10) {
        row[d.driverId] = hiddenLaps.get(d.driverId).has(lap) ? null : lapData.time
        row[`${d.driverId}_raw`] = lapData.time
      }
    }
    return row
  })

  const flags = Array.from({ length: maxLap }, (_, i) => {
    const lap = i + 1
    let slow = 0, pit = 0
    for (const d of driverMeta) {
      const l = d.laps.find(x => x.lap === lap)
      if (!l || l.time <= 10) continue
      if (l.isPit) { pit++; continue }
      if (l.time > d.median * 1.10) slow++
    }
    return pit === 0 && slow >= Math.max(2, Math.ceil(driverMeta.length * 0.6))
  })
  const scPeriods = []
  let start = null
  for (let i = 0; i < flags.length; i++) {
    if (flags[i] && start === null) start = i + 1
    if (!flags[i] && start !== null) {
      if (i + 1 - start >= 2) scPeriods.push({ x1: start, x2: i })
      start = null
    }
  }
  if (start !== null && maxLap - start >= 1) scPeriods.push({ x1: start, x2: maxLap })

  return { chartData, driverMeta, pitLines: [...pitLines], scPeriods }
}
