import { useCallback, useEffect, useRef, useState } from 'react'

export const REPLAY_MS = 520

const clamp = (r, total) => Math.min(Math.max(1, Math.floor(Number.isFinite(r) ? r : 1)), Math.max(1, total))

/**
 * Season replay controller.
 *  - starts on the last round, paused
 *  - play from the last round restarts at round 1; play stops itself on the last round
 *  - `source` is 'play' while the interval is stepping and 'seek' after any manual move
 *    (rows animate only for 'play')
 *  - one interval, cleared on pause, on reset (`resetKey` / `total` change) and on unmount
 * @param {number} total number of rounds
 * @param {string} resetKey change it (season, view) to return to the last round, paused
 */
export function useReplay(total, resetKey = '', interval = REPLAY_MS) {
  const [state, setState] = useState({ key: `${resetKey}|${total}`, round: total, playing: false, source: 'seek' })
  const key = `${resetKey}|${total}`
  // "Adjust state while rendering": a new dataset resets the replay without an extra effect pass.
  let cur = state
  if (state.key !== key) {
    cur = { key, round: total, playing: false, source: 'seek' }
    setState(cur)
  }
  const roundRef = useRef(cur.round)
  roundRef.current = cur.round // eslint-disable-line react-hooks/refs

  useEffect(() => {
    if (!cur.playing) return
    const id = setInterval(() => {
      const next = roundRef.current + 1
      roundRef.current = next
      setState(s => ({ ...s, round: next, playing: next < total, source: 'play' }))
    }, interval)
    return () => clearInterval(id)
  }, [cur.playing, key, total, interval])

  const toggle = useCallback(() => {
    if (total < 2) return
    setState(s => {
      if (s.playing) return { ...s, playing: false }
      return { ...s, round: s.round >= total ? 1 : s.round, playing: true, source: 'play' }
    })
  }, [total])

  const seek = useCallback((r) => {
    setState(s => ({ ...s, round: clamp(r, total), playing: false, source: 'seek' }))
  }, [total])

  const reset = useCallback(() => {
    setState(s => ({ ...s, round: total, playing: false, source: 'seek' }))
  }, [total])

  return { round: clamp(cur.round, total), playing: cur.playing, source: cur.source, atEnd: cur.round >= total, toggle, seek, reset }
}
