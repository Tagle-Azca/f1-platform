import { motion } from 'framer-motion'
import { DUR, EASE_OUT, useReducedMotion } from '../../styles/motion'

const W = 100
const H = 40

/**
 * Lead over P2 after each round (data only, no projection). A dashed marker shows the clinch round.
 * Decorative SVG (aria-hidden): `label` is the accessible description of the whole figure.
 * `points` = [{ round, lead }], `total` = rounds in the season, `clinchRound` = 1-based or null.
 */
export default function LeadChart({ points, total, clinchRound = null, color, label, className = '' }) {
  const reduced = useReducedMotion()
  const list = Array.isArray(points) ? points.filter(p => Number.isFinite(p?.round) && Number.isFinite(p?.lead)) : []
  if (list.length < 2) return null
  const span = Math.max(total - 1, list[list.length - 1].round - 1, 1)
  const max = Math.max(1, ...list.map(p => p.lead))
  const x = (round) => ((round - 1) / span) * W
  const y = (lead) => H - (Math.max(0, lead) / max) * (H - 2) - 1
  const d = list.map((p, i) => `${i ? 'L' : 'M'}${x(p.round).toFixed(2)} ${y(p.lead).toFixed(2)}`).join(' ')
  const hasMark = Number.isFinite(clinchRound) && clinchRound >= 1 && clinchRound <= span + 1
  return (
    <figure role="img" aria-label={label} className={`m-0 ${className}`}>
      {hasMark && (
        <svg aria-hidden="true" focusable="false" width="100%" height="16" className="block">
          <text x={`${Math.min(92, Math.max(8, (x(clinchRound) / W) * 100))}%`} y="12" textAnchor="middle" fontSize="12" fill="var(--pw-ink-2)">Clinched</text>
        </svg>
      )}
      <div className="relative">
        <svg aria-hidden="true" focusable="false" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-24 w-full md:h-32" data-lead-chart>
          <line x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} stroke="var(--viz-grid)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={`${d} L${x(list[list.length - 1].round)} ${H} L${x(list[0].round)} ${H} Z`} fill={color} fillOpacity="0.14" />
          <motion.path
            d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
            {...(reduced ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: DUR.draw, ease: EASE_OUT } })}
          />
          {hasMark && <line x1={x(clinchRound)} x2={x(clinchRound)} y1="0" y2={H} stroke="var(--pw-ink)" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
        </svg>
      </div>
      <div aria-hidden="true" className="mt-pw-1 flex justify-between text-xs text-ink-3"><span>R1</span><span>R{span + 1}</span></div>
    </figure>
  )
}
