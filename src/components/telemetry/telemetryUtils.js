import { RACE_TO_CIRCUIT } from './telemetryConstants'

export function fmtLap(secs) {
  if (!secs || secs <= 0) return '—'
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

// Linear regression slope (seconds per lap within a stint)
export function stintSlope(lapTimes) {
  const n = lapTimes.length
  if (n < 3) return null
  // Exclude outliers (SC laps etc.) — keep laps within 110% of stint median
  const sorted = [...lapTimes].sort((a, b) => a - b)
  const median = sorted[Math.floor(n / 2)]
  const clean  = lapTimes.filter(t => t <= median * 1.10)
  if (clean.length < 3) return null
  const xs = clean.map((_, i) => i + 1)
  const sumX  = xs.reduce((a, b) => a + b, 0)
  const sumY  = clean.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((s, x, i) => s + x * clean[i], 0)
  const sumXX = xs.reduce((s, x) => s + x * x, 0)
  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) // s/lap
}

// Group consecutive laps into stints by compound
export function buildStints(validLaps) {
  const stints = []
  let current  = null
  for (const lap of validLaps) {
    const cmp = lap.compound || 'UNKNOWN'
    if (!current || current.compound !== cmp) {
      if (current) stints.push(current)
      current = { compound: cmp, laps: [] }
    }
    current.laps.push(lap)
  }
  if (current) stints.push(current)
  return stints
}

export function raceToCircuitId(raceName) {
  if (!raceName) return null
  const lower = raceName.toLowerCase()
  for (const [key, id] of Object.entries(RACE_TO_CIRCUIT)) {
    if (lower.includes(key)) return id
  }
  return null
}
