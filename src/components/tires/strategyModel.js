// Pure helpers for the tire strategy page. Inputs come from the feed, so every
// field is checked before use and nothing here throws on malformed data.
import { asObjectArray } from '../../utils/safeArray'

const KNOWN = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET']

/** Upper-cased compound key, or 'UNKNOWN'. */
export function compoundKey(raw) {
  const k = typeof raw === 'string' ? raw.toUpperCase() : ''
  return KNOWN.includes(k) ? k : 'UNKNOWN'
}

const fin = (n) => (Number.isFinite(n) ? n : null)

/** Stints with finite lap bounds, sorted by start lap; lap counts added. */
export function cleanStints(stints) {
  return asObjectArray(stints)
    .map(s => ({
      compound: compoundKey(s.compound),
      lapStart: fin(Number(s.lapStart)),
      lapEnd: fin(Number(s.lapEnd)),
      tyreAge: fin(Number(s.tyreAge)) ?? 0,
    }))
    .filter(s => s.lapStart != null && s.lapEnd != null && s.lapEnd >= s.lapStart)
    .sort((a, b) => a.lapStart - b.lapStart)
    .map(s => ({ ...s, laps: s.lapEnd - s.lapStart + 1 }))
}

/** Final classification from the positions feed: driverId -> position at the last recorded lap. */
export function finalPositions(positions) {
  const laps = asObjectArray(positions?.laps)
  const last = laps[laps.length - 1]
  const out = new Map()
  if (!last) return out
  for (const [id, pos] of Object.entries(last)) {
    if (id !== 'lap' && Number.isFinite(pos)) out.set(id, pos)
  }
  return out
}

const norm = (s) => (typeof s === 'string' ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '')

/**
 * Official classification from the stored race result, keyed for matching OpenF1 drivers:
 * OpenF1 has "Max VERSTAPPEN", the result has familyName "Verstappen" (accents and case differ).
 */
export function classification(result) {
  return asObjectArray(result?.Results).map(r => ({
    family: norm(r.Driver?.familyName),
    position: fin(Number(r.position)),
    status: typeof r.status === 'string' ? r.status : '',
  })).filter(r => r.family)
}

const LAPPED = /^\+\d+ laps?$/i
const NOT_STARTED = /did not start|withdrew|not classified.*start/i

/** Outcome from an official status string. */
export function outcomeOf(status) {
  if (!status) return 'unknown'
  if (status === 'Finished') return 'finished'
  if (LAPPED.test(status)) return 'lapped'
  if (NOT_STARTED.test(status)) return 'dns'
  return 'dnf'
}

/**
 * Driver rows ready to draw, in finishing order. The official result (when stored) gives
 * position and outcome; otherwise the positions feed gives the order and a driver more than
 * 3 laps short of the distance counts as retired.
 */
export function buildRows(strategy, positions, result) {
  const finals = finalPositions(positions)
  const meta = new Map(asObjectArray(positions?.drivers).map(d => [String(d.driverId), d]))
  const official = classification(result)
  const totalLaps = fin(Number(positions?.totalLaps))

  const rows = asObjectArray(strategy).map(d => {
    const id = String(d.driverId ?? '')
    const stints = cleanStints(d.stints)
    const lastLap = stints.length ? stints[stints.length - 1].lapEnd : 0
    const m = meta.get(id)
    const fullName = typeof d.fullName === 'string' ? d.fullName : ''
    const off = official.find(o => norm(fullName).endsWith(o.family))
    const outcome = off ? outcomeOf(off.status) : 'unknown'
    return {
      driverId: id,
      acronym: typeof d.acronym === 'string' ? d.acronym : '',
      fullName,
      teamName: typeof d.teamName === 'string' ? d.teamName : '',
      stints,
      lastLap,
      stops: Math.max(0, stints.length - 1),
      position: off ? off.position : (finals.get(id) ?? null),
      status: off?.status ?? '',
      official: Boolean(off),
      dnf: outcome === 'dnf' || (outcome === 'unknown' && m?.dnf === true),
      dns: outcome === 'dns' || (outcome === 'unknown' && (m?.dns === true || stints.length === 0)),
    }
  })

  const raceLaps = totalLaps ?? Math.max(0, ...rows.map(r => r.lastLap))
  // No official result for this driver: far short of the distance means retired
  for (const r of rows) if (!r.official && !r.dns && r.lastLap < raceLaps - 3) r.dnf = true

  rows.sort((a, b) =>
    (a.position ?? Infinity) - (b.position ?? Infinity)
    || b.lastLap - a.lastLap
    || a.acronym.localeCompare(b.acronym))
  return { rows, totalLaps: raceLaps }
}

/** How many drivers made 0, 1, 2 and 3+ stops (classified and retired alike). */
export function stopsHistogram(rows) {
  const h = { 0: 0, 1: 0, 2: 0, '3+': 0 }
  for (const r of rows) {
    if (r.dns) continue
    h[r.stops >= 3 ? '3+' : r.stops] += 1
  }
  return h
}

/** Share of all laps run on each compound, largest first. */
export function compoundShare(rows) {
  const laps = {}
  let total = 0
  for (const r of rows) for (const s of r.stints) { laps[s.compound] = (laps[s.compound] ?? 0) + s.laps; total += s.laps }
  return Object.entries(laps)
    .map(([compound, n]) => ({ compound, laps: n, share: total ? n / total : 0 }))
    .sort((a, b) => b.laps - a.laps)
}

/** The longest single stint in the race. */
export function longestStint(rows) {
  let best = null
  for (const r of rows) for (const s of r.stints) {
    if (!best || s.laps > best.stint.laps) best = { row: r, stint: s }
  }
  return best
}

/** Safety car / VSC periods with finite bounds inside the race. */
export function cleanPeriods(periods, totalLaps) {
  return asObjectArray(periods)
    .map(p => ({ type: p.type === 'VSC' ? 'VSC' : 'SC', lapStart: Number(p.lapStart), lapEnd: Number(p.lapEnd) }))
    .filter(p => Number.isFinite(p.lapStart) && Number.isFinite(p.lapEnd) && p.lapEnd >= p.lapStart && p.lapStart <= totalLaps)
    .map(p => ({ ...p, lapEnd: Math.min(p.lapEnd, totalLaps) }))
}

/** Percent position helpers for a 1-based lap axis. */
export const lapLeft = (lapStart, totalLaps) => ((lapStart - 1) / totalLaps) * 100
export const lapWidth = (lapStart, lapEnd, totalLaps) => ((lapEnd - lapStart + 1) / totalLaps) * 100
