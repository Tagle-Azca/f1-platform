import { useState, useEffect } from 'react'
import { dashboardApi } from '../services/api'
import { countryFlag } from '../utils/flags'

function useCountdown(isoTarget) {
  const [parts, setParts] = useState(null)
  useEffect(() => {
    if (!isoTarget) return
    const tick = () => {
      const diff = new Date(isoTarget) - Date.now()
      if (diff <= 0) { setParts(null); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setParts({ d, h, m, s })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isoTarget])
  return parts
}

export function useNavbar() {
  const [nextRace,              setNextRace]              = useState(null)
  const [standings,             setStandings]             = useState([])
  const [constructorStandings,  setConstructorStandings]  = useState([])
  const [raceFinished,          setRaceFinished]          = useState(false)

  const fetchDashboard = () => dashboardApi.get()
    .then(d => {
      setNextRace(d?.nextRace || null)
      setStandings(d?.standings || [])
      setConstructorStandings(d?.constructorStandings || [])
    })
    .catch(() => {})

  useEffect(() => { fetchDashboard() }, [])

  useEffect(() => {
    let cancelled = false
    let prevFinished = false
    const poll = () => dashboardApi.getLive()
      .then(d => {
        if (cancelled) return
        const finished = !!(d?.finished)
        setRaceFinished(finished)
        if (finished && !prevFinished) fetchDashboard()
        prevFinished = finished
      })
      .catch(() => {})
    poll()
    const id = setInterval(poll, 30000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const liveActive = !raceFinished && (nextRace?.currentSession?.isLive ?? false)
  const live       = liveActive ? nextRace.currentSession : null
  const countdown  = useCountdown(!live ? (nextRace?.nextSession?.dateTime ?? nextRace?.raceDateTime) : null)
  const isUrgent   = !live && !!countdown && countdown.d === 0 && countdown.h === 0
  const flagUrl    = nextRace ? countryFlag(nextRace.country) : null

  return { nextRace, standings, constructorStandings, live, countdown, isUrgent, flagUrl }
}
