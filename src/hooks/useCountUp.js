import { useEffect, useState } from 'react'
import { useReducedMotion } from '../styles/motion'

/**
 * Counts from 0 to `target` once (ease-out), then follows target changes instantly.
 * Reduced motion and non-finite targets render the final value straight away.
 */
export function useCountUp(target, duration = 900) {
  const reduced = useReducedMotion()
  const final = Number.isFinite(target) ? target : 0
  const [shown, setShown] = useState(reduced ? final : 0)
  const [done, setDone] = useState(reduced)

  useEffect(() => {
    if (done) return
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      setShown(Math.round(final * (1 - (1 - t) ** 3)))
      if (t < 1) raf = requestAnimationFrame(tick)
      else setDone(true)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [done, final, duration])

  return done ? final : shown
}
