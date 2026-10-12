import { useCallback, useEffect, useState } from 'react'
import { circuitsApi, racesApi } from '../services/api'
import { asArray, asObjectArray } from '../utils/safeArray'
import { normalizeCircuit, nextRoundId, isValidCircuitId } from '../components/circuits/circuitIndexModel'
import { ENTITY_TTL_MS } from './entityLoader'

const calendars = new Map() // season -> { at, races }
let baseCache = null // { at, circuits }
const inflight = new Map()

/** Test hook: forget the cached calendars and circuits. */
export function resetSeasonCircuitsCache() { calendars.clear(); baseCache = null; inflight.clear() }

const fresh = (hit) => hit && Date.now() - hit.at <= ENTITY_TTL_MS

function memo(key, run) {
  if (!inflight.has(key)) {
    const p = run().finally(() => inflight.delete(key))
    inflight.set(key, p)
  }
  return inflight.get(key)
}

const loadCalendar = (season) => (fresh(calendars.get(season))
  ? Promise.resolve(calendars.get(season).races)
  : memo(`cal|${season}`, async () => {
    const races = asObjectArray(await racesApi.getBySeason(season))
    calendars.set(season, { at: Date.now(), races })
    return races
  }))

// The circuits list only adds outlines and specs: a failure leaves the cards without them instead of failing the tab.
const loadBase = () => (fresh(baseCache)
  ? Promise.resolve(baseCache.circuits)
  : memo('base', async () => {
    try {
      const circuits = asObjectArray(await circuitsApi.getAll())
      baseCache = { at: Date.now(), circuits }
      return circuits
    } catch { return [] }
  }))

/**
 * The season's calendar as CircuitCard props, in race order. Circuits the circuits collection has keep their
 * outline and specs; calendar-only circuits are appended in place. One card per circuit (a repeat keeps its first round).
 */
export function calendarCircuits(rawCircuits, races) {
  const byId = new Map()
  for (const raw of asObjectArray(rawCircuits)) {
    const c = normalizeCircuit(raw)
    if (isValidCircuitId(c.id)) byId.set(c.id, c)
  }
  const out = []
  const seen = new Set()
  for (const race of asObjectArray(races)) {
    const cal = normalizeCircuit(null, race)
    if (!isValidCircuitId(cal.id) || seen.has(cal.id)) continue
    seen.add(cal.id)
    const base = byId.get(cal.id)
    out.push(base
      ? { ...base, calendarRound: cal.calendarRound, calendarDate: cal.calendarDate, calendarRaceName: cal.calendarRaceName, calendarOnly: false }
      : cal)
  }
  return out.sort((a, b) => (a.calendarRound ?? 1e9) - (b.calendarRound ?? 1e9))
}

/**
 * Circuits on one season's calendar for the hub's Circuits tab. Nothing is requested until `enabled` is true.
 * status: 'idle' | 'loading' | 'ready' | 'error'. `nextId` is set only when `isCurrent` (the "Next" emphasis).
 */
export function useSeasonCircuits(season, { enabled = true, isCurrent = false } = {}) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)
  const on = enabled && Number.isFinite(season)

  useEffect(() => {
    if (!on) return undefined
    let alive = true
    Promise.all([loadCalendar(season), loadBase()]).then(
      ([races, base]) => {
        if (!alive) return
        setResult({ season, attempt, status: 'ready', circuits: calendarCircuits(base, races), nextId: isCurrent ? nextRoundId(asArray(races)) : null })
      },
      () => { if (alive) setResult({ season, attempt, status: 'error', circuits: [], nextId: null }) },
    )
    return () => { alive = false }
  }, [on, season, attempt, isCurrent])

  const retry = useCallback(() => { calendars.delete(season); setResult(null); setAttempt((n) => n + 1) }, [season])

  if (!on) return { status: 'idle', circuits: [], nextId: null, retry }
  if (result && result.season === season && result.attempt === attempt) return { ...result, retry }
  return { status: 'loading', circuits: [], nextId: null, retry }
}
