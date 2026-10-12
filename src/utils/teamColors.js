export const PODIUM_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

export const CTOR_COLORS = {
  red_bull:       '#0600EF',
  mercedes:       '#27F4D2',
  ferrari:        '#E8002D',
  mclaren:        '#FF8000',
  alpine:         '#0090FF',
  aston_martin:   '#006F62',
  williams:       '#00A0DE',
  rb:             '#6692FF',
  alphatauri:     '#6692FF',
  alpha_tauri:    '#6692FF',
  sauber:         '#52E252',
  alfa:           '#52E252',
  haas:           '#B6BABD',
  audi:           '#F1011C',
  cadillac:       '#C0C0C0',
  renault:        '#FFD700',
  racing_point:   '#F596C8',
  toro_rosso:     '#469BFF',
  force_india:    '#F596C8',
  lotus_f1:       '#B5A225',
  lotus:          '#B5A225',
  benetton:       '#25A617',
  jordan:         '#EDA120',
  bar:            '#AAAAAA',
  jaguar:         '#228B22',
  minardi:        '#999966',
  arrows:         '#F68020',
  tyrrell:        '#1E90FF',
  brabham:        '#DDDD22',
  march:          '#CC4444',
  ligier:         '#4444FF',
  wolf:           '#888800',
  shadow:         '#888888',
  fittipaldi:     '#994400',
  surtees:        '#CC0000',
}

export function driverColor(teamId, idx) {
  return CTOR_COLORS[teamId] || `hsl(${(idx * 53 + 20) % 360}, 65%, 58%)`
}

export function ctorColor(constructorId) {
  return CTOR_COLORS[constructorId] || '#888'
}

// Curated 3-letter codes for the current grid — team names commonly end in
// "F1 Team"/"Racing", so a last-word-of-name fallback collapses several of
// them onto the same code (e.g. "RB F1 Team" and "Haas F1 Team" -> "TEA").
const CTOR_CODES = {
  red_bull: 'RBR', mercedes: 'MER', ferrari: 'FER', mclaren: 'MCL',
  alpine: 'ALP', aston_martin: 'AMR', williams: 'WIL', rb: 'RB',
  sauber: 'SAU', haas: 'HAA', audi: 'AUD', cadillac: 'CAD',
}

export function ctorCode(constructorId) {
  return CTOR_CODES[constructorId] ?? null
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Team hex at a given alpha, as an rgba() string — for tinted chip/row backgrounds. */
export function tint(hex, alpha) {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Lifts a team hex 52% toward white so it stays legible as small text on its
 * own tinted chip background — the raw hex fails contrast for darker teams
 * (Red Bull ~3:1, Ferrari ~3.35:1); lifting brings every team to 6:1+.
 */
export function lift(hex) {
  const [r, g, b] = hexToRgb(hex)
  const m = c => Math.round(c + (255 - c) * 0.52)
  return `rgb(${m(r)},${m(g)},${m(b)})`
}

/**
 * Maps an OpenF1 / Ergast team name string (fuzzy) to a team color.
 * e.g. "Aston Martin Aramco F1 Team" → '#229971'
 */
export function teamNameToColor(teamName) {
  if (!teamName) return null
  const t = teamName.toLowerCase()
  if (t.includes('red bull'))                                  return CTOR_COLORS.red_bull
  if (t.includes('ferrari'))                                   return CTOR_COLORS.ferrari
  if (t.includes('mercedes'))                                  return CTOR_COLORS.mercedes
  if (t.includes('mclaren'))                                   return CTOR_COLORS.mclaren
  if (t.includes('aston'))                                     return CTOR_COLORS.aston_martin
  if (t.includes('alpine'))                                    return CTOR_COLORS.alpine
  if (t.includes('williams'))                                  return CTOR_COLORS.williams
  if (t.includes('racing bulls') || t.includes('rb f1') || t.includes('alphatauri') || t.includes('alpha tauri') || t.includes('toro rosso')) return CTOR_COLORS.rb
  if (t.includes('sauber') || t.includes('kick'))             return CTOR_COLORS.sauber
  if (t.includes('haas'))                                      return CTOR_COLORS.haas
  if (t.includes('renault'))                                   return CTOR_COLORS.renault
  if (t.includes('racing point'))                              return CTOR_COLORS.racing_point
  if (t.includes('force india'))                               return CTOR_COLORS.force_india
  if (t.includes('lotus'))                                     return CTOR_COLORS.lotus_f1
  return null
}
