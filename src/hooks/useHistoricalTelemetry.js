import { useState, useEffect } from 'react'
import { statsApi } from '../services/api'

export function useHistoricalTelemetry(year, driverId, isHistorical) {
  const [histDrivers, setHistDrivers] = useState([])
  const [histData,    setHistData]    = useState(null)
  const [loadingHist, setLoadingHist] = useState(false)
  const [error,       setError]       = useState(null)
  // Year whose driver list has finished loading (empty list = no results stored for that season)
  const [driversYear, setDriversYear] = useState(null)

  // Load drivers when year changes
  useEffect(() => {
    if (!isHistorical || !year) return
    setHistDrivers([])
    setHistData(null)
    setDriversYear(null)
    statsApi.seasonDrivers(year)
      .then(list => {
        setHistDrivers(list)
      })
      .catch(() => {})
      .finally(() => setDriversYear(year))
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

  const noSeasonData = isHistorical && driversYear === year && histDrivers.length === 0
  return { histDrivers, histData, loadingHist, error, load, noSeasonData }
}
