import { teamMark, BASE } from '../../styles/vizPalette'
import { cn } from '@/lib/utils'

/**
 * Constructor art: the oversized team code in the team mark colour with a 3px team stripe along the bottom edge.
 * No asset and no request (the constructor twin of DriverPortrait: same viewBox, same weight). Decorative: the team
 * name is always next to it. `color` is the raw team hex; `well` draws the bordered surface (cards), omit it for the hero.
 */
export default function TeamMark({ code, color, className = '', well = false, stripe = true }) {
  const mark = teamMark(color, BASE.bg)
  const label = typeof code === 'string' ? code.slice(0, 3).toUpperCase() : ''
  const size = label.length <= 2 ? 112 : 78
  return (
    <div aria-hidden="true" data-team-mark className={cn('relative overflow-hidden', well && 'rounded-md border border-edge-soft bg-bg', className)}>
      {label && (
        <svg viewBox="0 0 200 130" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" focusable="false">
          <text x="100" y="98" textAnchor="middle" fontSize={size} fontWeight="800" className="font-display" fill={mark} fillOpacity="0.9">{label}</text>
        </svg>
      )}
      {stripe && (
        <svg focusable="false" className="absolute inset-x-0 bottom-0 block h-[3px] w-full"><rect width="100%" height="3" fill={mark} /></svg>
      )}
    </div>
  )
}
