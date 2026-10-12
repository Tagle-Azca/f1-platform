import { useCallback, useEffect, useState } from 'react'
import { circuitsApi, statsApi } from '../services/api'
import { normalizeCircuit, isValidCircuitId } from '../components/circuits/circuitIndexModel'
import { normalizeRaces } from '../components/circuits/circuitHistoryModel'
import { peekCircuitsIndex } from './useCircuitsIndex'

const RACE_ID_RE = /^\d{4}_\d+$/

// In-flight requests per circuit and attempt: a re-run effect (StrictMode, fast remount) joins the
// pending request instead of firing a second one. Entries go away once settled.
const inflight = new Map()
function loadDetail(id, attempt) {
  const key = `${id}|${attempt}`
  if (!inflight.has(key)) {
    const p = Promise.allSettled([circuitsApi.getById(id), statsApi.circuitHistory(id)])
    inflight.set(key, p)
    p.finally(() => inflight.delete(key))
  }
  return inflight.get(key)
}

/**
 * One circuit plus its race history.
 * status: 'loading' | 'ready' | 'notFound' | 'error'. `circuit` is available while loading when the index cache seeded it.
 * historyStatus: 'loading' | 'ready' | 'error' (a history failure leaves the circuit usable).
 */
export function useCircuitDetail(id) {
  const valid = isValidCircuitId(id)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null) // { id, attempt, ... } of the latest settled request

  useEffect(() => {
    if (!valid) return undefined
    let alive = true
    loadDetail(id, attempt).then(([c, h]) => {
      if (!alive) return
      const seed = peekCircuitsIndex()?.circuits.find((x) => x.id === id) ?? null
      let status = 'ready'
      let circuit = seed
      if (c.status === 'rejected') status = c.reason?.status === 404 ? 'notFound' : 'error'
      else if (c.value === null || typeof c.value !== 'object' || Array.isArray(c.value)) status = 'notFound'
      else {
        const fetched = normalizeCircuit(c.value)
        circuit = seed ? { ...seed, ...fetched, coords: fetched.coords.length ? fetched.coords : seed.coords, raceCount: seed.raceCount, calendarRound: seed.calendarRound, calendarDate: seed.calendarDate, calendarRaceName: seed.calendarRaceName, calendarOnly: seed.calendarOnly } : fetched
        if (!circuit.id) circuit = { ...circuit, id }
      }
      let historyStatus = 'ready'
      let races = []
      let cassandraRaceId = null
      if (h.status === 'fulfilled' && h.value && typeof h.value === 'object') {
        races = normalizeRaces(h.value.races)
        cassandraRaceId = typeof h.value.cassandraRaceId === 'string' && RACE_ID_RE.test(h.value.cassandraRaceId) ? h.value.cassandraRaceId : null
      } else if (!(h.status === 'rejected' && h.reason?.status === 404)) historyStatus = 'error'
      setResult({ id, attempt, status, circuit, races, cassandraRaceId, historyStatus })
    })
    return () => { alive = false }
  }, [id, valid, attempt])

  const retry = useCallback(() => { setResult(null); setAttempt((n) => n + 1) }, [])

  if (!valid) return { circuit: null, races: [], cassandraRaceId: null, status: 'notFound', historyStatus: 'ready', retry }
  if (result && result.id === id && result.attempt === attempt) {
    return { circuit: result.circuit, races: result.races, cassandraRaceId: result.cassandraRaceId, status: result.status, historyStatus: result.historyStatus, retry }
  }
  const seed = peekCircuitsIndex()?.circuits.find((x) => x.id === id) ?? null
  return { circuit: seed, races: [], cassandraRaceId: null, status: seed ? 'ready' : 'loading', historyStatus: 'loading', retry }
}
