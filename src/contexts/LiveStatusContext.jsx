import { createContext, useContext, useEffect, useState } from 'react'
import { safeText } from '../utils/safeText'
import { features } from '../config/features'

const LiveStatusContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components -- hook shares the context defined here
export const useLiveStatus = () => useContext(LiveStatusContext)

const BASE_URL = import.meta.env.VITE_API_URL || ''

const DEFAULT_STATUS = { available: false, sessionName: null, raceName: null, isRaceType: null }

/**
 * Single SSE connection to /api/dashboard/live/status, shared app-wide via
 * context so every consumer (sidebar, hero button, live pages) reacts to
 * the same push instead of each polling "is there a live session?" on its own.
 */
export function LiveStatusProvider({ children }) {
  const [status, setStatus] = useState(DEFAULT_STATUS)

  useEffect(() => {
    if (!features.liveTiming) return   // flag off: no stream, status stays unavailable everywhere
    const es = new EventSource(`${BASE_URL}/api/dashboard/live/status`)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setStatus({
          available:   data?.available === true,
          sessionName: safeText(data?.sessionName),
          raceName:    safeText(data?.raceName),
          isRaceType:  typeof data?.isRaceType === 'boolean' ? data.isRaceType : null,
        })
      } catch { /* ignore malformed SSE payloads */ }
    }

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        console.warn('Live status SSE connection closed')
      }
    }

    return () => es.close()
  }, [])

  return (
    <LiveStatusContext.Provider value={status}>
      {children}
    </LiveStatusContext.Provider>
  )
}
