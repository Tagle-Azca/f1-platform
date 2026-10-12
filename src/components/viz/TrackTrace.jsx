import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { projectCoords, toPath } from '../circuit/CircuitSilhouette'
import { DUR, EASE_INOUT, useReducedMotion } from '../../styles/motion'

import { cleanCoords } from './trackCoords'

/**
 * Circuit outline from real coordinates: static 2px stroke, start/finish dot, one draw-in. No glow, no looping car.
 * Renders nothing with fewer than 8 finite points. Decorative: aria-hidden.
 * `animate={false}` renders the full outline with no draw-in (catalogue cards); `tone` is the stroke (a CSS color or var()).
 */
export default function TrackTrace({ coords, width = 260, height = 170, className = '', animate = true, tone = 'var(--pw-ink-2)' }) {
  const reduced = useReducedMotion()
  const clean = useMemo(() => cleanCoords(coords), [coords])
  const geo = useMemo(() => {
    if (clean.length < 8) return null
    const pts = projectCoords(clean, width, height)
    return { d: toPath(pts), start: pts[0] }
  }, [clean, width, height])
  if (!geo) return null
  const draw = reduced || !animate
    ? { initial: false }
    : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: DUR.draw, ease: EASE_INOUT } }
  return (
    <svg aria-hidden="true" focusable="false" viewBox={`0 0 ${width} ${height}`} className={className} data-track-trace {...(animate ? {} : { 'data-static': '' })}>
      <motion.path d={geo.d} fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...draw} />
      <circle cx={geo.start[0]} cy={geo.start[1]} r="3" fill="var(--pw-steel)" />
    </svg>
  )
}
