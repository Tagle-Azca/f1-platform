import { useState, useEffect, useRef } from 'react'
import { usePreferences } from '../contexts/PreferencesContext'
import { F1_TEAMS } from '../data/f1Teams'
import { dashboardApi } from '../services/api'
import { predictFinish, confidenceFor, buildInsight } from '../utils/spotlightUtils'

export function useSpotlightData(data) {
  const { prefs } = usePreferences()
  const favoriteDriver = prefs.favoriteDriver
  const driverTeam = favoriteDriver ? F1_TEAMS.find(t => t.drivers.includes(favoriteDriver)) : null

  const fromStandings = data && favoriteDriver
    ? (data.standings ?? []).find(d => d.name.toLowerCase() === favoriteDriver.toLowerCase())
    : data?.standings?.[0]

  const spotlight = fromStandings ?? (favoriteDriver
    ? { name: favoriteDriver, team: driverTeam?.name ?? '—', points: 0, wins: 0, position: null }
    : null)

  // Pulse when driver changes
  const [pulseKey, setPulseKey] = useState(0)
  const prevNameRef = useRef(null)
  useEffect(() => {
    if (prevNameRef.current !== null && prevNameRef.current !== spotlight?.name)
      setPulseKey(k => k + 1)
    prevNameRef.current = spotlight?.name ?? null
  }, [spotlight?.name])

  // H2H fetch
  const [h2h, setH2h] = useState(null)
  useEffect(() => {
    if (!favoriteDriver || !data) return
    dashboardApi.getTeammateH2H(favoriteDriver, String(new Date().getFullYear()))
      .then(setH2h)
      .catch(() => setH2h(null))
  }, [favoriteDriver, data?.roundsDone])

  // Derived values
  const leader       = data?.standings?.[0]
  const remaining    = data ? data.totalRounds - (data.roundsDone ?? 0) : null
  const spotlightGap = spotlight && leader && spotlight.name !== leader.name && leader.points > 0
    ? leader.points - (spotlight.points ?? 0) : null

  const surname      = spotlight?.name?.split(' ').pop() ?? ''
  const predicted    = predictFinish(spotlight?.points, data?.roundsDone)
  const confidence   = confidenceFor(predicted, data?.roundsDone)
  const insight      = buildInsight({ surname, position: spotlight?.position, wins: spotlight?.wins ?? 0, spotlightGap, remaining })

  const lastResults    = data?.lastRace?.Results ?? []
  const myLastResult   = spotlight ? lastResults.find(r =>
    `${r.Driver?.givenName ?? ''} ${r.Driver?.familyName ?? ''}`.trim().toLowerCase() === spotlight.name.toLowerCase()
  ) : null
  const lastPos        = myLastResult ? parseInt(myLastResult.position) : null
  const isDNF          = myLastResult && !/^(Finished|\+\d+\s*Lap)/.test(myLastResult.status || '')
  const trend          = isDNF ? '↓' : lastPos && lastPos <= 5 ? '↑' : lastPos && lastPos > 10 ? '↓' : '→'
  const trendColor     = trend === '↑' ? '#22c55e' : trend === '↓' ? '#e10600' : '#f59e0b'
  const lastRaceName   = data?.lastRace?.raceName?.split(' ')[0] ?? null

  const mateName    = h2h?.teammateName ?? (driverTeam?.drivers.find(d => d !== favoriteDriver) ?? null)
  const mateSurname = mateName?.split(' ').pop() ?? null
  const h2hRows     = [
    h2h?.race  && { label: 'RACE',  mine: h2h.race.driver,  theirs: h2h.race.teammate  },
    h2h?.quali && { label: 'QUALI', mine: h2h.quali.driver, theirs: h2h.quali.teammate },
  ].filter(Boolean)

  return {
    spotlight,
    driverTeam,
    isYourDriver: !!favoriteDriver,
    pulseKey,
    // header
    driverPhoto:  favoriteDriver ? (h2h?.driverPhotoUrl ?? null) : (spotlight?.photoUrl ?? null),
    teamColor:    driverTeam?.color ?? 'var(--accent-color)',
    trend, trendColor, showTrend: !!myLastResult,
    // prediction row
    predicted, confidence, lastPos, lastRaceName,
    qualiGap: h2h?.avgQualiGapSeconds ?? null,
    mateSurname,
    // championship strip
    spotlightGap,
    leaderPoints: leader?.points ?? null,
    remaining,
    // insight
    insight,
    // h2h
    h2hRows,
  }
}
