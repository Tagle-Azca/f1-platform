import { useState, useEffect, useRef } from 'react'
import { telemetryApi, circuitsApi, racesApi } from '../services/api'
import { raceToCircuitId } from '../components/telemetry/telemetryUtils'

export function useDriverTelemetry(raceId, driverId, cassRaces, isHistorical) {
  const [laps,           setLaps]           = useState([])
  const [pitStops,       setPitStops]       = useState([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [telemetryLoaded, setTelemetryLoaded] = useState(false)
  const [totalLaps,      setTotalLaps]      = useState(null)
  const [raceResult,     setRaceResult]     = useState(null)
  const [driverStatuses, setDriverStatuses] = useState({})
  const [scPeriods,      setScPeriods]      = useState([])
  const [circuitCoords,  setCircuitCoords]  = useState(null)
  const autoLoadedRef = useRef(false)

  // Auto-load telemetry when race + driver are ready
  useEffect(() => {
    if (isHistorical || autoLoadedRef.current || !raceId || !driverId) return
    autoLoadedRef.current = true
    load()
  }, [raceId, driverId])

  // Reset autoload ref when raceId changes
  useEffect(() => {
    autoLoadedRef.current = false
  }, [raceId])

  // Circuit coords for sector mini-map
  useEffect(() => {
    if (!raceId || isHistorical) return
    const race      = cassRaces.find(r => r.raceId === raceId)
    const circuitId = raceToCircuitId(race?.raceName)
    if (!circuitId) { setCircuitCoords(null); return }
    circuitsApi.getById(circuitId)
      .then(c => setCircuitCoords(c?.trackCoords ?? null))
      .catch(() => setCircuitCoords(null))
  }, [raceId, cassRaces])

  function load() {
    if (!raceId || !driverId) return
    setLoading(true)
    setError(null)
    setTelemetryLoaded(false)
    setLaps([])
    setPitStops([])
    setScPeriods([])
    const [season, round] = [raceId.split('_')[0], parseInt(raceId.split('_')[1])]
    Promise.all([
      telemetryApi.getLapTimes(raceId, driverId),
      telemetryApi.getPitStops(raceId, driverId),
      telemetryApi.getSafetyCar(raceId).catch(() => []),
      telemetryApi.getRaceInfo(raceId).catch(() => ({ totalLaps: null })),
      racesApi.getByRound(season, round).catch(() => null),
    ])
      .then(([lapData, pitData, scData, infoData, raceData]) => {
        setLaps(lapData)
        setPitStops(pitData)
        setScPeriods(scData)
        setRaceResult(raceData)
        setDriverStatuses(infoData.driverStatuses ?? {})
        const mongoTotal = raceData?.Results?.length
          ? Math.max(...raceData.Results.map(r => parseInt(r.laps) || 0))
          : null
        setTotalLaps(mongoTotal ?? infoData.totalLaps)
      })
      .catch(e => setError(e.message))
      .finally(() => { setLoading(false); setTelemetryLoaded(true) })
  }

  return { laps, pitStops, loading, error, telemetryLoaded, totalLaps, raceResult, driverStatuses, scPeriods, circuitCoords, load }
}
