// Single source for data-encoding colors (team, tyre, sector, flash, track status).
// CSS mirrors these as --viz-* in src/index.css (a unit test keeps both in sync).
// Feed-keyed lookups use own-property checks only.
import { CTOR_COLORS, ctorColor, tint, lift } from '../utils/teamColors.js'
import { safeColor } from '../utils/safeUrl.js'

export { CTOR_COLORS, ctorColor, tint, lift }

export const BASE = { bg: '#121418', panel: '#191c21', raise: '#1e2329' }

/** Hex mirror of the --viz-* tokens that are literal colors (the rest alias --pw-*). */
export const VIZ_HEX = {
  tyreSoft: '#ef4444', tyreMedium: '#eab308', tyreHard: '#e5e7eb', tyreInter: '#22c55e', tyreWet: '#60a5fa', tyreInk: '#121418',
}

/** Circuit-type tones (graphics only, never text colour): CSS var refs and the hex mirror of --viz-type-*. */
export const TYPE_TONES = { permanent: 'var(--viz-type-permanent)', street: 'var(--viz-type-street)', hybrid: 'var(--viz-type-hybrid)' }
export const TYPE_HEX = { permanent: '#5cc8c4', street: '#ec8fb4', hybrid: '#d2b98c' }

/** Own-property lookup: feed strings such as "__proto__" never resolve to Object.prototype. */
export const own = (map, key) => (typeof key === 'string' && Object.hasOwn(map, key) ? map[key] : undefined)

// ── contrast helpers (WCAG 2.x) ──
const toRgb = (hex) => {
  let h = hex.replace('#', '')
  if (h.length <= 4) h = h.slice(0, 3).split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const lin = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
export function contrastRatio(a, b) {
  const [hi, lo] = [lum(toRgb(a)), lum(toRgb(b))].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const toHex = ([r, g, b]) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`

/**
 * Team color as a chart/bar mark: the raw hex when it reaches `min`:1 against `bg`,
 * otherwise lifted toward white in 4% steps (capped at 60%). Invalid input falls back to grey.
 */
export function teamMark(hex, bg = BASE.panel, min = 3) {
  const safe = safeColor(hex)
  if (!safe) return '#888888'
  const base = toRgb(safe)
  let cur = toHex(base)
  if (contrastRatio(cur, bg) >= min) return cur
  for (let t = 0.04; t <= 0.6001; t += 0.04) {
    cur = toHex(base.map((c) => Math.round(c + (255 - c) * t)))
    if (contrastRatio(cur, bg) >= min) return cur
  }
  return cur
}

// ── tyres ──
export const TYRES = {
  SOFT: { name: 'Soft', letter: 'S', css: 'var(--viz-tyre-soft)', hex: VIZ_HEX.tyreSoft },
  MEDIUM: { name: 'Medium', letter: 'M', css: 'var(--viz-tyre-medium)', hex: VIZ_HEX.tyreMedium },
  HARD: { name: 'Hard', letter: 'H', css: 'var(--viz-tyre-hard)', hex: VIZ_HEX.tyreHard },
  INTERMEDIATE: { name: 'Intermediate', letter: 'I', css: 'var(--viz-tyre-inter)', hex: VIZ_HEX.tyreInter },
  WET: { name: 'Wet', letter: 'W', css: 'var(--viz-tyre-wet)', hex: VIZ_HEX.tyreWet },
}
export const tyre = (compound) => own(TYRES, typeof compound === 'string' ? compound.toUpperCase() : compound)

// ── sector tones: color + glyph + text, never color alone ──
export const SECTOR_TONES = {
  purple: { cls: 'text-violet', hint: 'session best', glyph: 'diamond' },
  green: { cls: 'text-pos', hint: 'personal best', glyph: 'circle' },
  yellow: { cls: 'text-signal-yellow', hint: 'slower', glyph: 'dash' },
}
export const sectorTone = (status) => own(SECTOR_TONES, status)

// ── value flash tints (opacity-only animation via data-flash) ──
export const FLASH = { gain: 'var(--viz-flash-gain)', loss: 'var(--viz-flash-loss)', neutral: 'var(--viz-flash-neutral)' }
export const FLASH_HEX = { gain: 'rgba(111,206,154,.18)', loss: 'rgba(224,133,133,.18)' }

// ── track status tones (always paired with the status word) ──
export const TRACK_TONES = { green: 'var(--pw-pos)', yellow: 'var(--pw-yellow)', red: 'var(--pw-red)', neutral: 'var(--pw-orange)' }

/** Team mark for a constructor id (own-property lookup through ctorColor). */
export const constructorMark = (constructorId, bg) => teamMark(ctorColor(typeof constructorId === 'string' ? constructorId : ''), bg)
