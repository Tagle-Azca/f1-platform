import { useState, useEffect } from 'react'
import { telemetryApi } from '../services/api'
import { TELEMETRY_CUTOFF } from '../components/telemetry/telemetryConstants'

export function useCassandraRaces(onInit) {
  const [cassRaces, setCassRaces] = useState([])
  const [dbOffline, setDbOffline] = useState(false)

  useEffect(() => {
    telemetryApi.getAvailableRaces()
      .then(data => {
        // Sort by year DESC, then round ASC within each year
        const sorted = [...data].sort((a, b) => {
          const [ya, ra] = a.raceId.split('_')
          const [yb, rb] = b.raceId.split('_')
          if (ya !== yb) return parseInt(yb) - parseInt(ya)
          return parseInt(ra) - parseInt(rb)
        })
        setCassRaces(sorted)
        const years = [...new Set(sorted.map(r => r.raceId.split('_')[0]))].sort((a, b) => b - a)
        if (years.length) {
          // Auto-select the LAST (most recent) past race of the latest year
          const now = new Date()
          const isPast = r => r.isLive || !r.date || new Date(r.date) <= now
          const racesOfLatest = sorted.filter(r => r.raceId.startsWith(years[0] + '_') && isPast(r))
          const last = racesOfLatest[racesOfLatest.length - 1]
          onInit(years, last?.raceId ?? '')
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
