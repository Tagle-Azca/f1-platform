import { useCallback, useEffect, useState } from 'react'
import { circuitsApi, racesApi } from '../services/api'
import { asArray, asObjectArray } from '../utils/safeArray'
import { normalizeCircuit, mergeCalendar, nextRoundId, isValidCircuitId } from '../components/circuits/circuitIndexModel'

/** Index data is cached at module level so index -> detail -> Back does not refetch. */
export const INDEX_TTL_MS = 5 * 60 * 1000

let cache = null // { at, value }
let inflight = null

/** Test hook: forget the cached index. */
export function resetCircuitsIndexCache() { cache = null; inflight = null }

/** The cached index when still fresh, else null. Used to seed the detail page header. */
export function peekCircuitsIndex() {
  return cache && Date.now() - cache.at <= INDEX_TTL_MS ? cache.value : null
}

async function loadCalendar(year) {
  let season = year
  let races = asArray(await racesApi.getBySeason(season))
  if (races.length === 0) { // the new season's calendar may not be published yet
    season -= 1
    races = asArray(await racesApi.getBySeason(season))
  }
  if (races.length === 0) throw new Error('empty calendar')
  return { season, races }
}

async function load() {
  const year = new Date().getUTCFullYear()
  const [circuits, calendar] = await Promise.allSettled([circuitsApi.getAll(), loadCalendar(year)])
  if (circuits.status !== 'fulfilled') throw circuits.reason
  const base = asObjectArray(circuits.value).map((raw) => normalizeCircuit(raw)).filter((c) => isValidCircuitId(c.id))
  const cal = calendar.status === 'fulfilled' ? calendar.value : null
  const merged = cal ? mergeCalendar(base, cal.races).filter((c) => isValidCircuitId(c.id)) : base
  return {
    circuits: merged,
    hasCalendar: Boolean(cal),
    season: cal ? cal.season : year,
    nextId: cal ? nextRoundId(cal.races) : null,
  }
}

function fetchIndex() {
  if (!inflight) {
    inflight = load()
      .then((value) => { cache = { at: Date.now(), value }; return value })
      .finally(() => { inflight = null })
  }
  return inflight
}

/** Circuits list merged with the current calendar. A calendar failure degrades (hasCalendar false); a circuits failure is an error. */
export function useCircuitsIndex() {
  const [state, setState] = useState(() => {
    const hit = peekCircuitsIndex()
    return hit ? { status: 'ready', ...hit } : { status: 'loading' }
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (peekCircuitsIndex()) return undefined
    let alive = true
    fetchIndex().then(
      (value) => { if (alive) setState({ status: 'ready', ...value }) },
      () => { if (alive) setState({ status: 'error' }) },
    )
    return () => { alive = false }
  }, [attempt])

  const retry = useCallback(() => {
    cache = null
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return {
    circuits: state.circuits ?? [],
    status: state.status,
    retry,
    hasCalendar: state.hasCalendar ?? false,
    season: state.season ?? new Date().getUTCFullYear(),
    nextId: state.nextId ?? null,
  }
}
