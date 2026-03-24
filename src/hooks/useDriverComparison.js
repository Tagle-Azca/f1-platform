import { useState, useEffect } from 'react'
import { telemetryApi } from '../services/api'

export function useDriverComparison(raceId, driverIdB, isHistorical) {
  const [lapsB,       setLapsB]       = useState([])
  const [pitStopsB,   setPitStopsB]   = useState([])
  const [loadingB,    setLoadingB]    = useState(false)
  const [lapsBLoaded, setLapsBLoaded] = useState(false)

  useEffect(() => {
    if (!driverIdB || isHistorical || !raceId) return
    setLoadingB(true)
    setLapsBLoaded(false)
    setLapsB([])
    setPitStopsB([])
    Promise.all([
      telemetryApi.getLapTimes(raceId, driverIdB),
      telemetryApi.getPitStops(raceId, driverIdB),
    ])
      .then(([lapData, pitData]) => { setLapsB(lapData); setPitStopsB(pitData) })
      .catch(() => {})
      .finally(() => { setLoadingB(false); setLapsBLoaded(true) })
  }, [driverIdB, raceId])

  return { lapsB, pitStopsB, loadingB, lapsBLoaded }
}
