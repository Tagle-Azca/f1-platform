import { statsApi } from '../services/api'
import { isValidEntityId } from '../components/profiles/entityId'
import { createLoader, useLoaded, failStatus } from './entityLoader'

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

async function fetchDriver(id) {
  const [stats, seasons, circuits] = await Promise.allSettled([statsApi.driverStats(id), statsApi.driverSeasons(id), statsApi.driverCircuits(id)])
  if (stats.status === 'rejected') return { status: failStatus(stats.reason), stats: null, seasons: [], circuits: [], seasonsStatus: 'error', circuitsStatus: 'error', cacheable: false }
  if (!isObject(stats.value) || !isObject(stats.value.driver)) return { status: 'notFound', stats: null, seasons: [], circuits: [], seasonsStatus: 'ready', circuitsStatus: 'ready', cacheable: false }
  const seasonsOk = seasons.status === 'fulfilled' && Array.isArray(seasons.value)
  const circuitsOk = circuits.status === 'fulfilled' && Array.isArray(circuits.value)
  return {
    status: 'ready', stats: stats.value,
    seasons: seasonsOk ? seasons.value : [], circuits: circuitsOk ? circuits.value : [],
    seasonsStatus: seasonsOk ? 'ready' : 'error', circuitsStatus: circuitsOk ? 'ready' : 'error',
    cacheable: seasonsOk && circuitsOk,
  }
}

export const driverLoader = createLoader(fetchDriver)

/** Test hook: forget every cached driver profile. */
export function resetDriverProfileCache() { driverLoader.reset() }

const LOADING = { status: 'loading', stats: null, seasons: [], circuits: [], seasonsStatus: 'loading', circuitsStatus: 'loading' }
const NOT_FOUND = { status: 'notFound', stats: null, seasons: [], circuits: [], seasonsStatus: 'ready', circuitsStatus: 'ready' }

/**
 * One driver: stats, seasons and circuits in parallel.
 * status: 'loading' | 'ready' | 'notFound' | 'error'. A failure in seasons or circuits only marks that section
 * ('seasonsStatus' / 'circuitsStatus' = 'error'); `retry` re-asks for all three. An invalid id makes no request.
 */
export function useDriverProfile(id) {
  const valid = isValidEntityId(id)
  const { value, retry } = useLoaded(driverLoader, id, valid)
  if (!valid) return { ...NOT_FOUND, retry }
  return { ...(value ?? LOADING), retry }
}
