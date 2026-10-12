// Pure presentation helpers for circuit cards, the fallback tile and the detail hero.
import { getCircuitSpecs } from '../../utils/circuitSpecs'
import { TYPE_LABELS } from './constants'

const letters = (w) => [...w].filter((ch) => /\p{L}/u.test(ch))
const isFiller = (w) => w.length <= 2 && w === w.toLowerCase()
const initialsOf = (text) => {
  const words = (typeof text === 'string' ? text : '').split(/\s+/).map((w) => letters(w).join('')).filter((w) => w && !isFiller(w))
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
  if (words.length === 1) return [...words[0]].slice(0, 2).join('').toUpperCase()
  return ''
}

/** Fallback-tile monogram: locality initials ("Kuala Lumpur" -> KL, "Monza" -> MO), else the circuit name, else a dash. */
export const monogram = (locality, name) => initialsOf(locality) || initialsOf(name) || '–'

const fmt = (n, axis) => `${Math.abs(n).toFixed(2)}° ${axis}`
/** "2.76° N · 101.74° E"; null when either value is not finite. */
export function formatCoords(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return `${fmt(lat, lat >= 0 ? 'N' : 'S')} · ${fmt(lng, lng >= 0 ? 'E' : 'W')}`
}

/** Locator frame geometry (equirectangular, viewBox 120 x 60). */
export const LOCATOR = { w: 120, h: 60, inset: 6 }

/** Dot position for lat/long in the locator frame; clamped so extreme values never clip the dot. */
export function locatorPoint(lat, lng) {
  const { w, h, inset } = LOCATOR
  const clamp = (v, max) => Math.min(max - inset, Math.max(inset, v))
  return {
    cx: clamp(((Math.max(-180, Math.min(180, lng)) + 180) / 360) * w, w),
    cy: clamp(((90 - Math.max(-90, Math.min(90, lat))) / 180) * h, h),
  }
}

/** Card footer cells in order: Length, Turns, Races held. A missing figure drops its cell; calendar-only circuits have no races cell. */
export function cardSpecs(circuit) {
  const specs = getCircuitSpecs(circuit.id)
  const out = []
  if (specs && Number.isFinite(specs.length)) out.push({ key: 'length', label: 'Length', value: specs.length.toFixed(1), unit: 'km' })
  if (specs && Number.isFinite(specs.turns)) out.push({ key: 'turns', label: 'Turns', value: String(specs.turns), unit: '' })
  if (!circuit.calendarOnly && circuit.raceCount > 0) out.push({ key: 'races', label: 'Races', value: String(circuit.raceCount), unit: '' })
  return out
}

export const NOT_IN_DATA = 'Not in the 2022 to 2026 race data.'

/** One-line spec string for the row card, e.g. "5.8 km · 11 turns · 5 races". */
export function specsLine(circuit) {
  if (circuit.calendarOnly) return NOT_IN_DATA
  return cardSpecs(circuit)
    // Non-breaking space inside each spec so a narrow card wraps between specs, never "5 / races"
    .map((s) => (s.key === 'length' ? `${s.value}\u00a0km` : s.key === 'turns' ? `${s.value}\u00a0turns` : `${s.value}\u00a0${s.value === '1' ? 'race' : 'races'}`))
    .join(' · ')
}

export const circuitTitle = (circuit) => circuit.name || 'Unknown circuit'
export const placeLine = (circuit) => [circuit.locality, circuit.country].filter(Boolean).join(', ')

/** Screen-reader description for a card, so the link's accessible name stays just the circuit name. */
export function describeCircuit(circuit, season, outline) {
  const parts = [`${TYPE_LABELS[circuit.type]}${circuit.country ? `, ${circuit.country}` : ''}.`]
  if (circuit.calendarOnly) parts.push(NOT_IN_DATA)
  else {
    if (circuit.lastSeason) parts.push(`Last GP ${circuit.lastSeason}.`)
    if (circuit.raceCount > 0) parts.push(`${circuit.raceCount} ${circuit.raceCount === 1 ? 'race' : 'races'}.`)
  }
  if (circuit.calendarRound != null) parts.push(`Round ${circuit.calendarRound} of the ${season} calendar.`)
  if (!outline) parts.push('No track outline available.')
  return parts.join(' ')
}

/** True when the circuit has enough clean points to draw an outline. */
export const hasOutline = (circuit) => Array.isArray(circuit.coords) && circuit.coords.length >= 8
