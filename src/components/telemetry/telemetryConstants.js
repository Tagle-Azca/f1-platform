export const TELEMETRY_CUTOFF = 2023

// Grid vs result bars (historical view); tyre and team colors come from styles/vizPalette.js
export const GRID_FILL = 'var(--viz-axis)'
export const RESULT_FILL = { gained: 'var(--pw-pos)', lost: 'var(--pw-neg)', same: 'var(--pw-steel)' }

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
