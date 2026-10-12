import { motion } from 'framer-motion'
import { DUR, EASE_OUT, useReducedMotion } from '../../styles/motion'

const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null }

/**
 * Race distance bar. The text "Lap 31 of 70" is the accessible content; the svg is decorative.
 * The width follows the feed directly (no animation per poll); only the first mount draws in.
 * Hidden when the total number of laps is unknown.
 */
export default function LapProgress({ lap, total, className = '' }) {
  const reduced = useReducedMotion()
  const l = toNum(lap), t = toNum(total)
  if (l === null || t === null || t <= 0 || l < 0) return null
  const pct = Math.min(100, (l / t) * 100)
  const grow = reduced ? { initial: false } : { initial: { scaleX: 0 }, animate: { scaleX: 1 }, transition: { duration: DUR.bars, ease: EASE_OUT } }
  return (
    <div className={className}>
      <svg aria-hidden="true" focusable="false" width="100%" height="4" className="block h-[3px] w-full lg:h-1">
        <rect x="0" y="0" width="100%" height="4" rx="2" fill="var(--viz-track)" />
        <motion.rect x="0" y="0" width={`${pct}%`} height="4" rx="2" fill="var(--pw-steel)" className="viz-grow" {...grow} />
      </svg>
      <span className="sr-only">Lap {l} of {t}</span>
    </div>
  )
}
