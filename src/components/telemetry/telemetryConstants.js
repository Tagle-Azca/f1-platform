export const COLORS = { lap: '#e10600', s1: '#a855f7', s2: '#22c55e', s3: '#3b82f6' }
export const COLOR_B = '#3b82f6'
export const TELEMETRY_CUTOFF = 2023

export const COMPOUND_COLORS = {
  SOFT:         '#ef4444',
  MEDIUM:       '#eab308',
  HARD:         '#e5e7eb',
  INTERMEDIATE: '#22c55e',
  WET:          '#3b82f6',
  UNKNOWN:      '#6b7280',
}
export const COMPOUND_LABEL = { SOFT: 'S', MEDIUM: 'M', HARD: 'H', INTERMEDIATE: 'I', WET: 'W', UNKNOWN: '?' }

// All F1 seasons for historical mode
export const HISTORICAL_YEARS = Array.from(
  { length: TELEMETRY_CUTOFF - 1950 },
  (_, i) => String(TELEMETRY_CUTOFF - 1 - i),
)

// Race name → MongoDB circuit ID mapping
export const RACE_TO_CIRCUIT = {
  bahrain: 'bahrain', saudi: 'jeddah', jeddah: 'jeddah',
  australian: 'albert_park', japanese: 'suzuka', chinese: 'shanghai',
  miami: 'miami', 'emilia romagna': 'imola', imola: 'imola',
  monaco: 'monaco', canadian: 'villeneuve', spanish: 'catalunya',
  austrian: 'red_bull_ring', british: 'silverstone', hungarian: 'hungaroring',
  belgian: 'spa', dutch: 'zandvoort', italian: 'monza',
  azerbaijan: 'baku', singapore: 'marina_bay',
  'united states': 'americas', mexico: 'rodriguez',
  'são paulo': 'interlagos', brazil: 'interlagos',
  'las vegas': 'las_vegas', qatar: 'losail', 'abu dhabi': 'yas_marina',
}
