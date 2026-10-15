import { cn } from '@/lib/utils'
import { MAX_PACE_DRIVERS, seriesFor } from './paceModel'

// One-row touch carousel on phones (no wrap, hidden scrollbar); wraps from md.
const ROW = 'flex snap-x gap-pw-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible'

function Stripe({ color, dashed }) {
  return (
    <svg aria-hidden="true" focusable="false" width="3" height="14" className="shrink-0">
      <rect width="3" height="14" rx="1.5" fill={color} fillOpacity={dashed ? 0.55 : 1} />
    </svg>
  )
}

/** Driver toggles (max 5): team stripe + code, aria-pressed. Selected drivers show a tick word for assistive tech, never colour alone. */
export default function PaceDriverSelector({ allDrivers, selectedDrivers, onToggle }) {
  const seen = new Set()
  const marks = new Map(allDrivers.map((d, i) => [d.driverId, seriesFor(d.teamName || '', seen, i)]))
  const full = selectedDrivers.length >= MAX_PACE_DRIVERS
  return (
    <ul className={ROW} aria-label={`Drivers, up to ${MAX_PACE_DRIVERS}`}>
      {allDrivers.map((d) => {
        const on = selectedDrivers.includes(d.driverId)
        const m = marks.get(d.driverId)
        return (
          <li key={d.driverId} className="shrink-0 snap-start">
            <button
              type="button" aria-pressed={on} disabled={!on && full} onClick={() => onToggle(d.driverId)}
              className={cn(
                'inline-flex min-h-11 cursor-pointer items-center gap-pw-2 whitespace-nowrap rounded-pill border px-pw-3 text-sm outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-steel disabled:cursor-not-allowed disabled:opacity-60',
                on ? 'border-steel bg-steel-soft text-ink' : 'border-edge bg-transparent text-ink-2 hover:bg-hover',
              )}
            >
              <Stripe color={m.color} dashed={m.dashed} />
              <span className="font-display font-semibold tracking-[0.02em]">{d.acronym}</span>
              {d.teamName && <span className="hidden text-xs text-ink-3 sm:inline">{d.teamName.split(' ')[0]}</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
