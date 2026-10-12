import { useEffect, useState } from 'react'

/** Returns Date.now(), refreshed every `ms` (default 60s) — for coarse "in 2d 3h" labels. */
export function useNow(ms = 60000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}
