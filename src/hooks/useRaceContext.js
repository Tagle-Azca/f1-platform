import { useState, useEffect } from 'react'
import { dashboardApi } from '../services/api'
import { NAVBAR_POLL_INTERVAL } from '../constants'
import { safeText } from '../utils/safeText'
import { normalizeNextRace } from '../utils/normalizeDashboard'

export { normalizeNextRace }

/**
 * Global race-weekend identity for the persistent RaceContextBar — nextRace
 * + round info, polled the same way the old useNavbar did. Countdown state
 * lives only in the dashboard hero now (single source of truth).
 */
export function useRaceContext() {
  const [nextRace,    setNextRace]    = useState(null)
  const [totalRounds, setTotalRounds] = useState(null)
  const [roundsDone,  setRoundsDone]  = useState(null)
  const [loaded,      setLoaded]      = useState(false)
  const [failed,      setFailed]      = useState(false)

  useEffect(() => {
    let cancelled = false
    const poll = () => dashboardApi.get()
      .then(d => {
        if (cancelled) return
        setNextRace(normalizeNextRace(d?.nextRace))
        setTotalRounds(safeText(d?.totalRounds))
        setRoundsDone(safeText(d?.roundsDone))
        setFailed(false)
        setLoaded(true)
      })
      .catch(() => { if (!cancelled) { setFailed(true); setLoaded(true) } })
    poll()
    const id = setInterval(poll, NAVBAR_POLL_INTERVAL)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return { nextRace, totalRounds, roundsDone, loaded, failed }
}
