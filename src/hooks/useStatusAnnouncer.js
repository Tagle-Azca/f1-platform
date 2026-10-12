import { useEffect, useRef, useState } from 'react'
import { trackStatusInfo } from '../components/live/trackStatus'
import { asObjectArray } from '../utils/safeArray'

/**
 * Pure: what changed between two live snapshots, as a sentence for a screen reader.
 * Only STATUS changes are announced (session start/end, flag, leader). Never tick data (lap times, gaps).
 */
export function diffStatus(prev, next) {
  if (!next) return prev ? 'Live session ended' : null
  if (!prev) return `Live session started: ${next.sessionName ?? 'session'}`
  if (prev.trackStatus !== next.trackStatus) {
    const label = trackStatusInfo(next.trackStatus)?.label
    return label ? `${label}` : 'Track clear'
  }
  const a = asObjectArray(prev.classification)[0]?.driverNum
  const b = asObjectArray(next.classification)[0]?.driverNum
  if (a && b && a !== b) {
    const lead = asObjectArray(next.classification)[0]
    return `New leader: ${lead.fullName || lead.acronym}`
  }
  return null
}

const MIN_GAP_MS = 5000

/** Returns the current announcement text, updated at most once per 5 seconds. */
export function useStatusAnnouncer(data) {
  const [message, setMessage] = useState('')
  const prevRef = useRef(null)
  const lastAtRef = useRef(0)
  const timerRef = useRef(null)
  const pendingRef = useRef(null)

  useEffect(() => {
    const msg = diffStatus(prevRef.current, data)
    prevRef.current = data ? { trackStatus: data.trackStatus, sessionName: data.sessionName, classification: asObjectArray(data.classification).slice(0, 1) } : null
    if (!msg) return
    const wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastAtRef.current))
    pendingRef.current = msg
    if (timerRef.current) return
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      lastAtRef.current = Date.now()
      setMessage(pendingRef.current)
    }, wait)
  }, [data])

  useEffect(() => () => clearTimeout(timerRef.current), [])
  return message
}
