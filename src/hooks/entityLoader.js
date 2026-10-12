import { useCallback, useEffect, useState } from 'react'

/** The current season changes after every race, so cached profiles expire like the standings cache does. */
export const ENTITY_TTL_MS = 5 * 60 * 1000

/**
 * A keyed loader with an in-flight map (a re-run effect, StrictMode or a drawer plus a page join one request)
 * and a per-session cache. `fetcher(key)` must never reject: it resolves to `{ cacheable, ...value }`.
 */
export function createLoader(fetcher, ttl = ENTITY_TTL_MS) {
  const cache = new Map()
  const inflight = new Map()
  return {
    peek(key) {
      const hit = cache.get(key)
      if (!hit) return null
      if (Date.now() - hit.at > ttl) { cache.delete(key); return null }
      return hit.value
    },
    load(key, attempt = 0) {
      const k = `${key}|${attempt}`
      if (!inflight.has(k)) {
        const p = Promise.resolve().then(() => fetcher(key)).then((value) => {
          if (value?.cacheable) cache.set(key, { value, at: Date.now() })
          return value
        })
        inflight.set(k, p)
        p.finally(() => inflight.delete(k))
      }
      return inflight.get(k)
    },
    forget(key) { cache.delete(key) },
    reset() { cache.clear(); inflight.clear() },
  }
}

/**
 * Subscribes a component to a loader. `value` is null while loading (or when the key is not valid).
 * `retry` forgets the cached entry and asks again. `enabled` false skips the request entirely.
 */
export function useLoaded(loader, key, enabled = true) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!enabled) return undefined
    if (attempt === 0 && loader.peek(key)) return undefined
    let alive = true
    loader.load(key, attempt).then((value) => { if (alive) setResult({ key, attempt, value }) })
    return () => { alive = false }
  }, [loader, key, enabled, attempt])

  const retry = useCallback(() => { loader.forget(key); setResult(null); setAttempt((n) => n + 1) }, [loader, key])

  if (!enabled) return { value: null, retry }
  const own = result && result.key === key && result.attempt === attempt ? result.value : null
  return { value: own ?? (attempt === 0 ? loader.peek(key) : null), retry }
}

/** A request error as a status: 404 is "not found", anything else is "error". */
export const failStatus = (reason) => (reason?.status === 404 ? 'notFound' : 'error')
