import { useState, useEffect } from 'react'
import { telemetryApi } from '../services/api'
import { TELEMETRY_CUTOFF } from '../components/telemetry/telemetryConstants'

export function useCassandraRaces(onInit) {
  const [cassRaces, setCassRaces] = useState([])
  const [dbOffline, setDbOffline] = useState(false)

  useEffect(() => {
    telemetryApi.getAvailableRaces()
      .then(data => {
        setCassRaces(data)
        const years = [...new Set(data.map(r => r.raceId.split('_')[0]))].sort((a, b) => b - a)
        if (years.length) {
          const first = data.find(r => r.raceId.startsWith(years[0] + '_'))
          onInit(years, first?.raceId ?? '')
        }
      })
      .catch(e => {
        if (e.message?.includes('503') || e.message?.includes('not connected')) setDbOffline(true)
        // Still allow historical mode even if Cassandra is offline
        onInit([], String(TELEMETRY_CUTOFF - 1))
      })
  }, [])

  return { cassRaces, dbOffline }
}
