import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCassandraRaces } from './useCassandraRaces'
import { TELEMETRY_CUTOFF } from '../components/telemetry/telemetryConstants'

export const ANALYSIS_VIEWS = ['pace', 'tyres', 'telemetry']
const RACE_RE = /^\d{4}_\d+$/
const YEAR_RE = /^\d{4}$/
const yearOf = (raceId) => raceId.split('_')[0]

const isPast = (r, now) => r.isLive || !r.date || new Date(r.date) <= now

/** Past (or live) races of one season, in the order the list gives them (chronological). */
export function pastRacesOf(races, season, now = new Date()) {
  return races.filter(r => yearOf(r.raceId) === String(season) && isPast(r, now))
}

/** Seasons present in the race list, newest first. */
export const seasonsOf = (races) => [...new Set(races.map(r => yearOf(r.raceId)))].sort((a, b) => b - a)

/** Seasons before lap-level data exist: only the Telemetry season view has something to show. */
export const isHistoricalSeason = (season) => season !== '' && Number(season) < TELEMETRY_CUTOFF

/**
 * Pure reading of `?view=&race=&season=` against the race list.
 *  view    pace | tyres | telemetry (missing or invalid = pace)
 *  season  explicit valid year, else the year of a valid race, else the newest season in the list
 *  raceId  the requested race when it is in the list and belongs to the season, else the season's latest past race;
 *          '' for a season before lap data and when the list has no race for it
 * `dirty` says the URL holds a value that was corrected; the page then replaces the entry with cleanAnalysisParams.
 * A race is only judged against the list once the list is known (`races.length > 0`).
 */
export function parseAnalysisParams(params, races, { now = new Date() } = {}) {
  const rawView = params?.get?.('view') ?? null
  const rawRace = params?.get?.('race') ?? null
  const rawSeason = params?.get?.('season') ?? null
  const view = ANALYSIS_VIEWS.includes(rawView) ? rawView : 'pace'
  const known = races.length > 0
  const raceKnown = rawRace !== null && RACE_RE.test(rawRace) && races.some(r => r.raceId === rawRace)
  const seasonValid = rawSeason !== null && YEAR_RE.test(rawSeason)

  const season = seasonValid ? rawSeason : raceKnown ? yearOf(rawRace) : (seasonsOf(races)[0] ?? '')
  let raceId = ''
  if (season !== '' && !isHistoricalSeason(season)) {
    if (raceKnown && yearOf(rawRace) === season) raceId = rawRace
    else {
      const past = pastRacesOf(races, season, now)
      raceId = past[past.length - 1]?.raceId ?? ''
    }
  }

  const badView = rawView !== null && !ANALYSIS_VIEWS.includes(rawView)
  const badSeason = rawSeason !== null && !seasonValid
  const badRace = rawRace !== null && (!RACE_RE.test(rawRace) || (known && (!raceKnown || yearOf(rawRace) !== season || isHistoricalSeason(season))))
  return { view, season, raceId, dirty: badView || badSeason || badRace, badView, badSeason, badRace }
}

/** Copy of `params` with every corrected value fixed: bad view/season dropped, a bad race replaced by the resolved one. */
export function cleanAnalysisParams(params, parsed) {
  const next = new URLSearchParams(params)
  if (parsed.badView) next.delete('view')
  if (parsed.badSeason) next.delete('season')
  if (parsed.badRace) { if (parsed.raceId) next.set('race', parsed.raceId); else next.delete('race') }
  return next
}

/** Params for a user choice. Season is only written when it cannot be derived from the race (seasons before lap data). */
export function withChoice(params, patch, races, now = new Date()) {
  const next = new URLSearchParams(params)
  if ('view' in patch) { if (patch.view === 'pace') next.delete('view'); else next.set('view', patch.view) }
  if ('race' in patch) { next.set('race', patch.race); next.delete('season') }
  if ('season' in patch) {
    const y = String(patch.season)
    if (isHistoricalSeason(y)) { next.set('season', y); next.delete('race') } else {
      const past = pastRacesOf(races, y, now)
      next.delete('season')
      const last = past[past.length - 1]?.raceId
      if (last) next.set('race', last); else { next.delete('race'); next.set('season', y) }
    }
  }
  return next
}

/**
 * URL-backed state of the Race analysis page on top of the single race-list fetch.
 * User choices push a history entry, normalisation replaces.
 */
export function useAnalysisParams() {
  const [params, setParams] = useSearchParams()
  const cass = useCassandraRaces()
  const { cassRaces } = cass
  const parsed = useMemo(() => parseAnalysisParams(params, cassRaces), [params, cassRaces])

  const setView = useCallback((view) => setParams(withChoice(params, { view }, cassRaces)), [params, cassRaces, setParams])
  const setSeason = useCallback((season) => setParams(withChoice(params, { season }, cassRaces)), [params, cassRaces, setParams])
  const setRace = useCallback((race) => setParams(withChoice(params, { race }, cassRaces)), [params, cassRaces, setParams])
  const normalise = useCallback(() => setParams(cleanAnalysisParams(params, parsed), { replace: true }), [params, parsed, setParams])
  const goLatest = useCallback(() => {
    const y = seasonsOf(cassRaces)[0]
    if (y) setParams(withChoice(params, { season: y }, cassRaces))
  }, [params, cassRaces, setParams])

  return { ...parsed, cass, races: cassRaces, setView, setSeason, setRace, normalise, goLatest }
}
