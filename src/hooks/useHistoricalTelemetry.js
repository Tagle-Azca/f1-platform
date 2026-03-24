import { useState, useEffect } from 'react'
import { statsApi } from '../services/api'

export function useHistoricalTelemetry(year, driverId, isHistorical) {
  const [histDrivers, setHistDrivers] = useState([])
  const [histData,    setHistData]    = useState(null)
  const [loadingHist, setLoadingHist] = useState(false)
  const [error,       setError]       = useState(null)

  // Load drivers when year changes
  useEffect(() => {
    if (!isHistorical || !year) return
    setHistDrivers([])
    setHistData(null)
    statsApi.seasonDrivers(year)
      .then(list => {
        setHistDrivers(list)
      })
      .catch(() => {})
  }, [year, isHistorical])

  // Auto-load when driver ready
  useEffect(() => {
    if (!isHistorical || !driverId || !year) return
    load()
  }, [driverId, isHistorical])

  function load() {
    if (!driverId || !year) return
    setLoadingHist(true)
    setHistData(null)
    setError(null)
    statsApi.historicalPerformance(driverId, year)
      .then(setHistData)
      .catch(e => setError(e.message))
      .finally(() => setLoadingHist(false))
  }

  return { histDrivers, histData, loadingHist, error, load }
}
