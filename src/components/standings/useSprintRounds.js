import { useEffect, useState } from 'react'
import { racesApi } from '../../services/api'
import { asObjectArray } from '../../utils/safeArray'

// One request per season per session: sprint weekends never change once the calendar is set.
const cache = new Map()

/** 1-based round numbers with a sprint, from the season calendar (`hasSprint` per round). */
export function sprintRoundsOf(races) {
  return asObjectArray(races)
    .filter((r) => r.hasSprint === true)
    .map((r) => Number(r.round))
    .filter((n) => Number.isInteger(n) && n > 0)
}

export const loadSprintRounds = (season) => {
  if (!cache.has(season)) {
    const p = Promise.resolve().then(() => racesApi.getBySeason(season)).then(sprintRoundsOf)
    cache.set(season, p)
    p.catch(() => cache.delete(season)) // a failure is retried next time
  }
  return cache.get(season)
}

/** Test hook: forget the cached calendars. */
export const resetSprintRoundsCache = () => cache.clear()

/**
 * Sprint rounds for a season. `ready` is false only while loading; on failure it is true with `rounds` undefined,
 * so the clinch maths runs without sprint points (clinchModel reports `sprintsKnown: false`).
 */
export function useSprintRounds(season) {
  const [res, setRes] = useState({ season: null, rounds: undefined })
  useEffect(() => {
    let alive = true
    loadSprintRounds(season).then((rounds) => alive && setRes({ season, rounds }), () => alive && setRes({ season, rounds: undefined }))
    return () => { alive = false }
  }, [season])
  return { ready: res.season === season, rounds: res.season === season ? res.rounds : undefined }
}
