import { driversApi } from '../services/api'
import { buildFeaturedDriverCards } from '../components/encyclopedia/encyclopediaModel'
import { createLoader, useLoaded } from './entityLoader'

async function fetchFeatured(season) {
  try {
    const cards = buildFeaturedDriverCards(await driversApi.getFeatured(null, season))
    return { status: cards.length ? 'ready' : 'empty', cards, cacheable: true }
  } catch {
    return { status: 'error', cards: [], cacheable: false }
  }
}

const loader = createLoader(fetchFeatured)

/** Test hook: forget every cached season line-up. */
export function resetFeaturedDriversCache() { loader.reset() }

/**
 * The line-up of a season before the standings data (1950 to 2021), from /api/drivers/featured?season=.
 * Makes no request while `enabled` is false. status: 'idle' | 'loading' | 'ready' | 'empty' | 'error'.
 */
export function useFeaturedDrivers(season, { enabled = true } = {}) {
  const on = enabled && Number.isInteger(season)
  const { value, retry } = useLoaded(loader, season, on)
  if (!on) return { status: 'idle', cards: [], retry }
  return { status: value?.status ?? 'loading', cards: value?.cards ?? [], retry }
}
