import { constructorsApi } from '../services/api'
import { isValidEntityId } from '../components/profiles/entityId'
import { createLoader, useLoaded, failStatus } from './entityLoader'

async function fetchConstructor(id) {
  try {
    const data = await constructorsApi.getStats(id)
    if (data === null || typeof data !== 'object' || Array.isArray(data)) return { status: 'notFound', data: null, cacheable: false }
    return { status: 'ready', data, cacheable: true }
  } catch (e) {
    return { status: failStatus(e), data: null, cacheable: false }
  }
}

export const constructorLoader = createLoader(fetchConstructor)

/** Test hook: forget every cached constructor profile. */
export function resetConstructorProfileCache() { constructorLoader.reset() }

/**
 * One constructor's stats and season history (shared by the profile page and the drawer, so opening the page
 * after the drawer costs no request). status: 'loading' | 'ready' | 'notFound' | 'error'. An invalid id makes no request.
 */
export function useConstructorProfile(id, { enabled = true } = {}) {
  const valid = isValidEntityId(id)
  const { value, retry } = useLoaded(constructorLoader, id, valid && enabled)
  if (!valid) return { status: 'notFound', data: null, retry }
  if (!enabled) return { status: 'loading', data: null, retry }
  return { status: value?.status ?? 'loading', data: value?.data ?? null, retry }
}
