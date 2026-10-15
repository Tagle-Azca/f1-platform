import { useEffect, useState } from 'react'
import { dashboardApi, racesApi, circuitsApi, statsApi, telemetryApi } from '../services/api'
import { normalizeNextRace } from '../utils/normalizeDashboard'
import { isValidCircuitId } from '../utils/circuitId'
import { asObjectArray } from '../utils/safeArray'
import { withinForecast } from '../components/race/weekendModel'
import { isValidWeekendParams } from '../utils/weekendPath'
import { sortRaces } from './useCassandraRaces'
import { analysisRaceFor } from '../components/analysis/analysisRace'
import { createLoader, useLoaded, failStatus } from './entityLoader'

/** Next round from the dashboard, shared by the /next-race redirect and the weekend page (one request, 30 s memo). */
export const nextRaceLoader = createLoader(async () => {
  try {
    const d = await dashboardApi.get()
    return { status: 'ready', nextRace: normalizeNextRace(d?.nextRace), cacheable: true }
  } catch {
    return { status: 'error', nextRace: null, cacheable: false }
  }
}, 30_000)

const weekendLoader = createLoader(async (key) => {
  const [season, round] = key.split('/')
  try {
    const race = await racesApi.getByRound(season, round)
    if (race === null || typeof race !== 'object' || Array.isArray(race)) return { status: 'notFound', race: null, cacheable: false }
    return { status: 'ready', race, cacheable: true }
  } catch (e) {
    return { status: failStatus(e), race: null, cacheable: false }
  }
}, 60_000)

const calendarLoader = createLoader(async (season) => {
  try { return { status: 'ready', list: asObjectArray(await racesApi.getBySeason(season)), cacheable: true } } catch { return { status: 'error', list: [], cacheable: false } }
})
const circuitLoader = createLoader(async (id) => {
  try { return { status: 'ready', circuit: await circuitsApi.getById(id), cacheable: true } } catch { return { status: 'error', circuit: null, cacheable: false } }
})
const historyLoader = createLoader(async (id) => {
  try { return { status: 'ready', history: await statsApi.circuitHistory(id), cacheable: true } } catch { return { status: 'error', history: null, cacheable: false } }
})

const raceListLoader = createLoader(async () => {
  try { return { status: 'ready', races: sortRaces(await telemetryApi.getAvailableRaces()), cacheable: true } } catch { return { status: 'error', races: [], cacheable: false } }
})

/** The lap-data race of a round (for the "Analyse this race" link), or null. Makes no request unless `enabled`. */
export function useAnalysisRace(season, round, enabled) {
  const { value } = useLoaded(raceListLoader, 'all', enabled && Number(season) >= 2023)
  return value?.status === 'ready' ? analysisRaceFor(value.races, season, round) : null
}

/** Test hook: forget everything the weekend page cached. */
export function resetRaceWeekendCache() { [nextRaceLoader, weekendLoader, calendarLoader, circuitLoader, historyLoader, raceListLoader].forEach((l) => l.reset()) }

/**
 * Everything the race weekend page reads: the round itself, and (best effort, never blocking) the dashboard next round
 * for live/next session, the season calendar for the previous/next links, and the circuit and its history.
 * status: 'invalid' | 'loading' | 'ready' | 'notFound' | 'error'.
 */
export function useRaceWeekend(season, round) {
  const valid = isValidWeekendParams(season, round)
  const key = `${season}/${round}`
  const { value, retry } = useLoaded(weekendLoader, key, valid)
  const ready = value?.status === 'ready'
  const currentSeason = Number(season) === new Date().getFullYear()
  const dash = useLoaded(nextRaceLoader, 'next', valid && currentSeason)
  const cal = useLoaded(calendarLoader, String(season), valid && ready)
  const circuitId = ready ? String(value.race?.Circuit?.circuitId ?? '') : ''
  const circuitOk = isValidCircuitId(circuitId)
  const circuit = useLoaded(circuitLoader, circuitId, circuitOk)
  // The previous race at this circuit is only shown while the weekend has no results of its own
  const wantHistory = ready && !(Array.isArray(value.race?.Results) && value.race.Results.length)
  const history = useLoaded(historyLoader, circuitId, circuitOk && wantHistory)

  const status = !valid ? 'invalid' : (value?.status ?? 'loading')
  return {
    status, race: ready ? value.race : null, retry,
    // The dashboard answer only matters when it has loaded; until then the schedule alone decides.
    dashNext: dash.value?.status === 'ready' ? dash.value.nextRace : null,
    calendar: cal.value?.status === 'ready' ? cal.value.list : null,
    circuit: circuit.value?.status === 'ready' ? circuit.value.circuit : null,
    history: history.value?.status === 'ready' ? history.value.history : null,
  }
}

/** Open-Meteo daily forecast for the weekend's dates, only when the weekend is within 16 days. Silent on failure. */
export function useWeekendWeather(circuit, schedule, enabled) {
  const [state, setState] = useState({ key: '', weather: null, failed: false })
  const lat = circuit?.Location?.lat
  const lng = circuit?.Location?.long
  const win = enabled && lat && lng ? withinForecast(schedule) : null
  const key = win ? `${lat}|${lng}|${win.start}|${win.end}` : ''

  useEffect(() => {
    if (!win) return undefined
    let alive = true
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&start_date=${win.start}&end_date=${win.end}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return
        if (!data?.daily) { setState({ key, weather: null, failed: true }); return }
        const map = {}
        data.daily.time.forEach((date, i) => {
          map[date] = {
            tempMax: Math.round(data.daily.temperature_2m_max[i]), tempMin: Math.round(data.daily.temperature_2m_min[i]),
            precipProb: data.daily.precipitation_probability_max[i], code: data.daily.weathercode[i],
          }
        })
        setState({ key, weather: map, failed: false })
      })
      .catch(() => { if (alive) setState({ key, weather: null, failed: true }) })
    return () => { alive = false }
  // `key` encodes every input of the request
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const mine = state.key === key ? state : null
  return { weather: mine?.weather ?? null, failed: Boolean(mine?.failed) }
}
