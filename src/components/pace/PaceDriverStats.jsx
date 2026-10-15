import { formatLapTime } from './paceModel'

function Stripe({ color, dashed }) {
  return (
    <svg aria-hidden="true" focusable="false" width="3" height="16" className="shrink-0">
      <rect width="3" height="16" rx="1.5" fill={color} fillOpacity={dashed ? 0.55 : 1} />
    </svg>
  )
}

/** Best lap, median, consistency and lap count for every selected driver, one block each. */
export default function PaceDriverStats({ driverMeta }) {
  if (!driverMeta.length) return null
  return (
    <ul className="grid list-none grid-cols-1 gap-pw-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Pace summary">
      {driverMeta.map(d => (
        <li key={d.driverId} className="min-w-0 rounded-md border border-edge bg-panel p-pw-3">
          <p className="flex min-w-0 items-center gap-pw-2">
            <Stripe color={d.color} dashed={d.dashed} />
            <span className="font-display text-base font-semibold text-ink">{d.acronym}</span>
            {d.teamName && <span className="min-w-0 truncate text-xs text-ink-3">{d.teamName}</span>}
          </p>
          <dl className="m-0 mt-pw-3 grid grid-cols-2 gap-x-pw-4 gap-y-pw-2">
            {[
              ['Best lap', formatLapTime(d.best)],
              ['Median', formatLapTime(d.median)],
              ['Consistency', `±${d.consistency.toFixed(2)} s`],
              ['Laps', String(d.laps.length)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-ink-3">{label}</dt>
                <dd className="num m-0 text-sm text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  )
}
