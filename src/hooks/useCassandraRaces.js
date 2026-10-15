import { useState, useEffect, useCallback } from 'react'
import { telemetryApi } from '../services/api'

/**
 * Race list with lap data, newest season first and chronological within a season.
 * Session keys are not chronological (a rescheduled race got a later key), so they only break ties when a date is missing.
 * status: 'loading' | 'ready' | 'error'; dbOffline is set when the lap database answered 503 / not connected.
 */
export function sortRaces(data) {
  const when = r => Date.parse(r.date) || Number.MAX_SAFE_INTEGER
  return [...data].filter(r => r && typeof r.raceId === 'string' && /^\d{4}_\d+$/.test(r.raceId)).sort((a, b) => {
    const [ya, ra] = a.raceId.split('_')
    const [yb, rb] = b.raceId.split('_')
    if (ya !== yb) return parseInt(yb) - parseInt(ya)
    return when(a) - when(b) || parseInt(ra) - parseInt(rb)
  })
}

export function useCassandraRaces() {
  const [state, setState] = useState({ races: [], status: 'loading', dbOffline: false })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    telemetryApi.getAvailableRaces()
      .then(data => { if (alive) setState({ races: sortRaces(Array.isArray(data) ? data : []), status: 'ready', dbOffline: false }) })
      .catch(e => {
        if (!alive) return
        const offline = Boolean(e?.message?.includes('503') || e?.message?.includes('not connected'))
        setState({ races: [], status: 'error', dbOffline: offline })
      })
    return () => { alive = false }
  }, [attempt])

  const retry = useCallback(() => { setState(s => ({ ...s, status: 'loading' })); setAttempt(n => n + 1) }, [])
  return { cassRaces: state.races, dbOffline: state.dbOffline, status: state.status, retry }
}
