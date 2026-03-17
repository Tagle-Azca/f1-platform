import { useState, useEffect } from 'react'

export function useCountdown(isoTarget) {
  const [parts, setParts] = useState(null)
  useEffect(() => {
    if (!isoTarget) return
    const tick = () => {
      const diff = new Date(isoTarget) - Date.now()
      if (diff <= 0) { setParts(null); return }
      setParts({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isoTarget])
  return parts
}
