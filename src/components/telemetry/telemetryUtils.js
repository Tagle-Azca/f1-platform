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
  const m  = clean.length
  const xs = clean.map((_, i) => i + 1)
  const sumX  = xs.reduce((a, b) => a + b, 0)
  const sumY  = clean.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((s, x, i) => s + x * clean[i], 0)
  const sumXX = xs.reduce((s, x) => s + x * x, 0)
  // Sums are over the cleaned laps, so the count must be too (using n skewed the slope whenever an outlier was dropped)
  return (m * sumXY - sumX * sumY) / (m * sumXX - sumX * sumX) // s/lap
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

/** Signed seconds delta with 3 decimals: "+0.123 s" / "−0.045 s". */
export function fmtDelta(secs) {
  if (secs == null || !Number.isFinite(secs)) return '—'
  const sign = secs > 0 ? '+' : secs < 0 ? '−' : '±'
  return `${sign}${Math.abs(secs).toFixed(3)} s`
}

/** Median of a numeric list (null when empty). */
export function median(values) {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (!v.length) return null
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

/**
 * Race-pace Y range for the lap chart: fastest lap to 108% of the median, so safety car,
 * pit and lap-1 times don't flatten the racing laps. Returns null when no clamp is needed.
 */
export function paceDomain(times) {
  const v = times.filter(t => Number.isFinite(t) && t > 0)
  if (v.length < 3) return null
  const med  = median(v)
  const lo   = Math.min(...v)
  const cap  = med * 1.08
  const over = v.filter(t => t > cap).length
  if (!over) return null
  return { domain: [Math.floor(lo - 0.5), Math.ceil(cap)], over, cap }
}

// A trend steeper than this is a safety car or traffic artifact, not tyre wear
export const DEGRAD_LIMIT_MS = 250

/** Degradation tone: words + token class, never color alone. */
export function degradTone(ms) {
  if (ms == null) return { word: 'Not enough laps', cls: 'text-ink-3' }
  if (Math.abs(ms) > DEGRAD_LIMIT_MS) return { word: 'Disrupted, no trend', cls: 'text-ink-3' }
  if (ms <= 0)    return { word: 'Improving', cls: 'text-pos' }
  if (ms <= 40)   return { word: 'Low', cls: 'text-pos' }
  if (ms <= 80)   return { word: 'Medium', cls: 'text-signal-yellow' }
  return { word: 'High', cls: 'text-neg' }
}
