import { useCallback, useEffect, useMemo, useState } from 'react'
import { statsApi, driversApi } from '../services/api'
import { discoverSeasons } from '../components/standings/standingsModel'
import { asArray, asObjectArray } from '../utils/safeArray'
import { safeString } from '../utils/safeText'

/** Number of past seasons probed besides the current one (currentYear down to currentYear - 7: 8 requests). */
export const PROBE_SPAN = 7

// Module-level memos: one probe per season per app session. The probe response doubles as the season's
// drivers payload, so switching to a probed season issues no second standings request.
const probeCache = new Map()
const ctorCache = new Map()
let photoCache = null

/** Test hook: forget everything fetched so far. */
export function resetStandingsCache() {
  probeCache.clear()
  ctorCache.clear()
  photoCache = null
}

/** The current season changes after every race, so its cache entries expire; past seasons stay cached for the session. */
export const CURRENT_TTL_MS = 5 * 60 * 1000

function cached(cache, year, currentYear, load) {
  const hit = cache.get(year)
  if (hit && !(year === currentYear && Date.now() - hit.at > CURRENT_TTL_MS)) return hit.promise
  const promise = settle(Promise.resolve().then(load)).then(r => {
    if (!r.ok) cache.delete(year) // a failure is retried on the next attempt
    return r
  })
  cache.set(year, { promise, at: Date.now() })
  return promise
}

const settle = (promise) => promise.then(payload => ({ ok: true, payload }), () => ({ ok: false, payload: null }))

const getProbe = (year, currentYear) => cached(probeCache, year, currentYear, () => statsApi.getSeasonStandings(year))
const getConstructors = (year, currentYear) => cached(ctorCache, year, currentYear, () => statsApi.getConstructorStandings(year))

/**
 * Constructor standings for one season through the same per-session cache the Standings page uses, so the profile
 * pages share it. Resolves to `{ ok, payload }` and never rejects.
 */
export const getConstructorStandingsCached = (year, currentYear) => getConstructors(year, currentYear)

function getPhotos() {
  if (!photoCache) {
    photoCache = Promise.resolve()
      .then(() => driversApi.getAll())
      .then(list => {
        const map = new Map()
        for (const d of asObjectArray(list)) {
          const id = safeString(d.driverId)
          if (id) map.set(id, { photoUrl: safeString(d.photoUrl) || null, number: safeString(d.permanentNumber), code: safeString(d.code) })
        }
        return map
      })
      .catch(() => { photoCache = null; return new Map() })
  }
  return photoCache
}

const hasData = (r) => Boolean(r?.ok) && asArray(r.payload?.rounds).length > 0

/**
 * Loads the standings for one season, discovering which seasons have data.
 *
 * @param {object} opts
 * @param {number|null} opts.requested  season asked for in the URL (null = the current season)
 * @param {number} opts.currentYear
 * @returns {{
 *   status: 'loading'|'ready'|'empty'|'error' (drivers payload), ctorStatus: same for the constructors payload,
 *   season: number|null, seasons: number[], missing: number|null,
 *   drivers: object|null, constructors: object|null, photos: Map<string, object>, retry: () => void }}
 * `missing` is the requested season that had no data (the hook falls back to the latest season with data).
 */
export function useStandingsData({ requested = null, currentYear }) {
  const [probes, setProbes] = useState({})
  const [ctors, setCtors] = useState({})
  const [photos, setPhotos] = useState(() => new Map())
  const [attempt, setAttempt] = useState(0)

  const years = useMemo(() => Array.from({ length: PROBE_SPAN + 1 }, (_, i) => currentYear - i), [currentYear])

  useEffect(() => {
    let alive = true
    years.forEach(y => getProbe(y, currentYear).then(r => { if (alive) setProbes(p => (p[y] === r ? p : { ...p, [y]: r })) }))
    return () => { alive = false }
  }, [years, attempt, currentYear])

  const settled = years.filter(y => Object.hasOwn(probes, y))
  const allSettled = settled.length === years.length
  const seasons = useMemo(() => discoverSeasons(years.filter(y => hasData(probes[y])).map(y => ({ year: y, payload: probes[y].payload }))), [years, probes])

  const inRange = requested != null && years.includes(requested)
  const target = requested != null && inRange ? requested : currentYear

  // Resolve which season to show, and whether the request fell back to another one.
  let season = null
  let status = 'loading'
  const targetProbe = probes[target]
  if (targetProbe && hasData(targetProbe)) {
    season = target
    status = 'ready'
  } else if (targetProbe && !targetProbe.ok) {
    status = 'error'
  } else if (targetProbe && allSettled) {
    // The target settled without data: show the latest season that has some.
    if (seasons.length) { season = seasons[0]; status = 'ready' } else status = settled.every(y => probes[y].ok) ? 'empty' : 'error'
  }
  const missing = season != null && requested != null && season !== requested ? requested : null
  const drivers = season != null ? probes[season].payload : null

  useEffect(() => {
    if (season == null) return
    let alive = true
    getConstructors(season, currentYear).then(r => { if (alive) setCtors(c => (c[season] === r ? c : { ...c, [season]: r })) })
    return () => { alive = false }
  }, [season, attempt, currentYear])

  const ctorResult = season != null ? ctors[season] : null
  const isCurrent = season === currentYear
  useEffect(() => {
    if (!isCurrent) return
    let alive = true
    getPhotos().then(m => { if (alive) setPhotos(m) })
    return () => { alive = false }
  }, [isCurrent])

  // Each view loads and fails on its own: `status` covers the drivers payload, `ctorStatus` the constructors one
  const ctorStatus = status !== 'ready' ? status : !ctorResult ? 'loading' : ctorResult.ok ? 'ready' : 'error'

  const retry = useCallback(() => {
    // Failed requests were already dropped from the caches, so the next attempt asks the API again.
    setProbes(p => Object.fromEntries(Object.entries(p).filter(([, r]) => r.ok)))
    setCtors(c => Object.fromEntries(Object.entries(c).filter(([, r]) => r.ok)))
    setAttempt(a => a + 1)
  }, [])

  return {
    status, ctorStatus, season, seasons, missing,
    drivers,
    constructors: ctorResult?.ok ? ctorResult.payload : null,
    photos: isCurrent ? photos : EMPTY_PHOTOS,
    retry,
  }
}

const EMPTY_PHOTOS = new Map()
