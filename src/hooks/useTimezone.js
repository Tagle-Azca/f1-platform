import { useCallback, useEffect, useState } from 'react'
import { TZ_LS_KEY, TZ_OPTIONS, getInitialTZ, saveTZ } from '../utils/timezone'

/** Same-tab broadcast; the browser `storage` event only reaches other tabs. */
export const TZ_EVENT = 'pitwall:timezone'

const isKnown = (v) => typeof v === 'string' && TZ_OPTIONS.some(o => o.value === v)

/**
 * The user's time zone preference (same `f1_tz` key as utils/timezone). Every subscriber updates at once
 * when any of them calls the setter (custom window event) and when another tab changes it (storage event).
 * Returns [tz, setTz].
 */
export function useTimezone() {
  const [tz, setTzState] = useState(getInitialTZ)

  useEffect(() => {
    const onCustom = (e) => setTzState(isKnown(e.detail) ? e.detail : getInitialTZ())
    const onStorage = (e) => { if (e.key === null || e.key === TZ_LS_KEY) setTzState(getInitialTZ()) }
    window.addEventListener(TZ_EVENT, onCustom)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(TZ_EVENT, onCustom)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const setTz = useCallback((value) => {
    if (!isKnown(value)) return
    saveTZ(value)
    setTzState(value)
    window.dispatchEvent(new CustomEvent(TZ_EVENT, { detail: value }))
  }, [])

  return [tz, setTz]
}
