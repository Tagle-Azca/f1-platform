import { useId } from 'react'
import { motion } from 'framer-motion'
import { fraction } from './gapScale'
import { teamMark } from '../../styles/vizPalette'
import { growProps, useReducedMotion } from '../../styles/motion'
import { safeColor } from '../../utils/safeUrl'

/**
 * Horizontal gap bar. Decorative (aria-hidden): the numeric value is always rendered next to it by the caller,
 * or passed as `srText`. Geometry is expressed in SVG attributes (percent widths), never inline styles.
 *
 *  mode 'gap'   value = seconds behind; scale sqrt (default) against `max`
 *  mode 'share' value / max linear from 0 (standings points)
 *  lapped       N laps down: no fill, hatched stub only
 */
export default function GapBar({
  value, max, scale, mode = 'gap', color, height = 6, lapped = 0, srText = null, animate = true, index = 0, className = 'w-full',
}) {
  const reduced = useReducedMotion()
  const uid = useId().replace(/:/g, '')
  const kind = scale ?? (mode === 'share' ? 'linear' : 'sqrt')
  const f = lapped > 0 ? 0 : fraction(value, max, kind)
  const pct = f > 0 ? Math.max(f, 0.03) * 100 : 0
  const fill = mode === 'share' && !safeColor(color) ? 'var(--viz-series-1)' : teamMark(color)
  const motionProps = animate ? growProps(index, reduced, 0.04) : { initial: false }

  return (
    <>
      <svg aria-hidden="true" focusable="false" width="100%" height={height} className={`block shrink-0 ${className}`} data-gapbar={lapped > 0 ? 'lapped' : mode}>
        <rect x="0" y="0" width="100%" height={height} rx="2" fill="var(--viz-track)" />
        {lapped > 0 ? (
          <>
            <defs>
              <pattern id={`hatch-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="2.5" height="6" fill="var(--viz-baseline)" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="28%" height={height} rx="2" fill={`url(#hatch-${uid})`} />
          </>
        ) : pct > 0 ? (
          <motion.rect x="0" y="0" width={`${pct}%`} height={height} rx="2" fill={fill} className="viz-grow" {...motionProps} />
        ) : null}
      </svg>
      {srText && <span className="sr-only">{srText}</span>}
    </>
  )
}
