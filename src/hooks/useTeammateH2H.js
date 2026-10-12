import { dashboardApi } from '../services/api'
import { createLoader, useLoaded } from './entityLoader'

async function fetchH2H(key) {
  const i = key.lastIndexOf('|')
  const name = key.slice(0, i)
  const season = key.slice(i + 1)
  try {
    const data = await dashboardApi.getTeammateH2H(name, season)
    return { status: 'ready', data: data !== null && typeof data === 'object' ? data : null, cacheable: true }
  } catch {
    return { status: 'error', data: null, cacheable: false }
  }
}

export const h2hLoader = createLoader(fetchH2H)

/** Test hook: forget every cached comparison. */
export function resetTeammateH2HCache() { h2hLoader.reset() }

/**
 * Teammate head to head for one driver and season, loaded lazily and cached per `name|season`.
 * `fullName` must be exactly "{givenName} {familyName}" as the driver endpoint returns it (accents included):
 * the API matches the exact name, not the id. status: 'idle' | 'loading' | 'ready' | 'error'.
 */
export function useTeammateH2H(fullName, season) {
  const enabled = typeof fullName === 'string' && fullName.trim() !== '' && Number.isFinite(season)
  const key = enabled ? `${fullName}|${season}` : ''
  const { value, retry } = useLoaded(h2hLoader, key, enabled)
  if (!enabled) return { status: 'idle', data: null, retry }
  return { status: value?.status ?? 'loading', data: value?.data ?? null, retry }
}
