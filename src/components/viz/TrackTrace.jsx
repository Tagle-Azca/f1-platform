import { useId, useMemo } from 'react'
import { motion } from 'framer-motion'
import { projectCoords, toPath } from '../circuit/CircuitSilhouette'
import { DUR, EASE_INOUT, useReducedMotion } from '../../styles/motion'

import { cleanCoords } from './trackCoords'

/**
 * Circuit outline from real coordinates: 2px stroke, start/finish dot, one draw-in, then a car lapping the outline
 * (core dot plus two fading trail dots, SVG animateMotion). Renders nothing with fewer than 8 finite points. Decorative: aria-hidden.
 * `animate={false}` renders the full outline with no draw-in and no car (catalogue cards); reduced motion also drops the car.
 * `tone` is the stroke (a CSS color or var()).
 */
const LAP_SECONDS = 7

/** One dot following the outline; `lag` (s) puts trail dots slightly behind the car. */
function LapDot({ pathId, r, fill, opacity, lag = 0 }) {
  const begin = `${DUR.draw + lag}s`
  return (
    <circle r={r} fill={fill} opacity="0" data-track-car="">
      <set attributeName="opacity" to={opacity} begin={begin} fill="freeze" />
      <animateMotion dur={`${LAP_SECONDS}s`} repeatCount="indefinite" begin={begin} calcMode="linear" rotate="auto">
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </circle>
  )
}

export default function TrackTrace({ coords, width = 260, height = 170, className = '', animate = true, tone = 'var(--pw-ink-2)' }) {
  const reduced = useReducedMotion()
  const pathId = `track-${useId().replace(/:/g, '')}`
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
      <motion.path id={pathId} d={geo.d} fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...draw} />
      <circle cx={geo.start[0]} cy={geo.start[1]} r="3" fill="var(--pw-steel)" />
      {animate && !reduced && (
        <g>
          <LapDot pathId={pathId} r={2} fill="var(--pw-steel)" opacity="0.35" lag={0.22} />
          <LapDot pathId={pathId} r={2.5} fill="var(--pw-steel)" opacity="0.6" lag={0.12} />
          <LapDot pathId={pathId} r={3.5} fill="var(--pw-ink)" opacity="1" />
        </g>
      )}
    </svg>
  )
}
