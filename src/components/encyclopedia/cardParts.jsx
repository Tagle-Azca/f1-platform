import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Link shell shared with CircuitCard so the three hub tabs read as one family. */
export const CARD_LINK =
  'group relative block rounded-md border border-edge bg-panel no-underline outline-none transition-colors duration-150 ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel ' +
  'active:translate-y-px motion-reduce:transition-none [@media(hover:hover)]:hover:bg-raise'

export const WELL_CLASS = 'relative overflow-hidden rounded-md border border-edge-soft bg-bg'

/** "P3" position pill (decorative: the position is in the card description). */
export function PositionChip({ position, className = '' }) {
  return (
    <span aria-hidden="true" className={cn('num inline-flex min-h-6 items-center rounded-pill border border-edge bg-panel px-pw-3 text-xs text-ink-2', className)}>P{position}</span>
  )
}

export function FavouriteChip({ className = '' }) {
  return (
    <span aria-hidden="true" className={cn('inline-flex min-h-6 items-center gap-pw-1 rounded-pill bg-steel-soft px-pw-3 text-xs text-steel', className)}>
      <Star size={12} fill="currentColor" strokeWidth={0} />
      Favourite
    </span>
  )
}

/** Points | Wins footer of the portrait cards. A datum that is missing removes its cell. */
export function Footer({ points, wins }) {
  const cells = [[points, 'Points'], [wins, 'Wins']].filter(([v]) => Number.isFinite(v))
  if (!cells.length) return null
  return (
    <div className="mt-auto pt-pw-3" aria-hidden="true">
      <dl className="grid grid-flow-col auto-cols-fr divide-x divide-edge-soft border-t border-edge-soft pt-pw-3">
        {cells.map(([v, label], i) => (
          <div key={label} className={cn('min-w-0', i === 0 ? 'pr-pw-2' : 'px-pw-2')}>
            <dd className="num text-[15px] font-medium text-ink">{v}</dd>
            <dt className="text-xs text-ink-3">{label}</dt>
          </div>
        ))}
      </dl>
    </div>
  )
}
