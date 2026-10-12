import { useEffect, useRef, useState } from 'react'
import { cubicBezier } from 'framer-motion'
import { EASE_OUT, useReducedMotion } from '../styles/motion'

const ease = cubicBezier(...EASE_OUT)

/**
 * Eases the shown number toward `target` (EASE_OUT), rounded to integers.
 *  - first mount, and whenever `datasetKey` changes: counts up from `startAt` (0) over `enterDuration` (900ms)
 *  - any other target change (replay following a round): eases from the shown value over `duration` (320ms)
 *  - reduced motion and non-finite targets: snaps to the final value
 * `useCountUp` (Dashboard) is a separate hook and is not touched.
 */
export function useTweenedNumber(target, { datasetKey = 'once', duration = 320, enterDuration = 900, startAt = 0 } = {}) {
  const reduced = useReducedMotion()
  const final = Number.isFinite(target) ? target : 0
  const [shown, setShown] = useState(reduced ? final : startAt)
  const shownRef = useRef(reduced ? final : startAt)
  const keyRef = useRef(null)

  useEffect(() => {
    if (reduced) { keyRef.current = datasetKey; return }
    const fresh = keyRef.current !== datasetKey
    keyRef.current = datasetKey
    const from = fresh ? startAt : shownRef.current
    const span = fresh ? enterDuration : duration
    if (from === final) { shownRef.current = final; return }
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / span)
      const v = Math.round(from + (final - from) * ease(t))
      shownRef.current = v
      setShown(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [final, datasetKey, reduced, duration, enterDuration, startAt])

  return reduced ? final : shown
}
