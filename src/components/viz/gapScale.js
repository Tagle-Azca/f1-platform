// Pure helpers for gap bars: parsing feed strings, the sqrt scale and the quantized, monotonic max.
import { useState } from 'react'

export const RACE_STEPS = [10, 30, 60, 120, 300]
export const TIMED_STEPS = [1, 2, 3, 5, 10]

/** "+2.740", "2.740", "1:02.345" -> seconds. Returns null when not a plain time. */
export function parseSeconds(v) {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? v : null
  if (typeof v !== 'string') return null
  const m = /^\+?\s*(?:(\d{1,2}):)?(\d{1,4}(?:\.\d+)?)\s*s?$/i.exec(v.trim())
  if (!m) return null
  const sec = (m[1] ? Number(m[1]) * 60 : 0) + Number(m[2])
  return Number.isFinite(sec) ? sec : null
}

/**
 * Classify one timing-tower gap.
 * Race: `stat` is "LEADER", "+2.740" or "+1 LAP". Timed sessions: `statLabel` is "fastest" or "+0.345".
 * Returns { kind: 'leader' | 'gap' | 'lapped' | 'none', seconds?, laps? }.
 */
export function classifyGap(row, isRaceType) {
  const stat = typeof row?.stat === 'string' ? row.stat.trim() : ''
  const label = typeof row?.statLabel === 'string' ? row.statLabel.trim() : ''
  if (stat === 'LEADER' || label === 'fastest') return { kind: 'leader' }
  const text = isRaceType ? stat : label
  const lap = /^\+?\s*(\d+)\s*L(?:AP)?S?$/i.exec(text)
  if (lap) return { kind: 'lapped', laps: Math.max(1, Number(lap[1])) }
  const seconds = parseSeconds(text)
  return seconds === null ? { kind: 'none' } : { kind: 'gap', seconds }
}

/** Smallest step >= needed (the last step when needed exceeds all of them). */
export function quantizeMax(needed, steps) {
  const n = Number.isFinite(needed) && needed > 0 ? needed : 0
  return steps.find((s) => s >= n) ?? steps[steps.length - 1]
}

/** Pure form of the monotonic rule: the max only grows within a session. */
export function nextMax(prev, needed, steps) {
  const q = quantizeMax(needed, steps)
  return prev == null ? q : Math.max(prev, q)
}

/** Bar fraction 0..1 for a value; sqrt keeps the front of the field visible. */
export function fraction(value, max, scale = 'sqrt') {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0 || value <= 0) return 0
  const r = Math.min(1, value / max)
  return scale === 'sqrt' ? Math.sqrt(r) : r
}

/**
 * Quantized max that only grows within `sessionKey`, and resets when the key changes.
 * Uses the "adjust state while rendering" pattern, so no ref is written during render.
 */
export function useGapMax(neededSeconds, steps, sessionKey) {
  const q = quantizeMax(neededSeconds, steps)
  const [st, setSt] = useState({ key: sessionKey, max: q })
  if (st.key !== sessionKey) {
    setSt({ key: sessionKey, max: q })
    return q
  }
  if (q > st.max) {
    setSt({ key: sessionKey, max: q })
    return q
  }
  return st.max
}
