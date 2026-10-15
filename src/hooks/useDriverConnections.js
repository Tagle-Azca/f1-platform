import { graphApi } from '../services/api'
import { isValidEntityId } from '../components/profiles/entityId'
import { createLoader, useLoaded } from './entityLoader'

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

async function fetchConnections(id) {
  try {
    const d = await graphApi.getDriverConnections(id)
    const data = isObject(d)
      ? { teams: Array.isArray(d.teams) ? d.teams : [], teammates: Array.isArray(d.teammates) ? d.teammates : [], debut: isObject(d.debut) ? d.debut : null, stats: isObject(d.stats) ? d.stats : null }
      : { teams: [], teammates: [], debut: null, stats: null }
    return { status: 'ready', data, cacheable: true }
  } catch {
    return { status: 'error', data: null, cacheable: false }
  }
}

export const connectionsLoader = createLoader(fetchConnections)

/** Test hook: forget every cached answer. */
export function resetDriverConnectionsCache() { connectionsLoader.reset() }

/**
 * Career connections of one driver (teams, teammates, stats), cached per id.
 * status: 'idle' (no valid id) | 'loading' | 'ready' | 'error'. A driver the API does not know is 'ready' with `stats: null`.
 */
export function useDriverConnections(id) {
  const valid = isValidEntityId(id)
  const { value, retry } = useLoaded(connectionsLoader, id, valid)
  if (!valid) return { status: 'idle', data: null, retry }
  return { status: value?.status ?? 'loading', data: value?.data ?? null, retry }
}
