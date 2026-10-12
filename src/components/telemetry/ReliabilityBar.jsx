import { safeString } from '../../utils/safeText'

const toneOf = (status) =>
  status === 'Finished' ? 'var(--pw-pos)'
    : /accident|collision|crash|spun/i.test(status) ? 'var(--pw-orange)'
      : 'var(--pw-neg)'

/** How each race ended, as share bars with the count beside them. */
export default function ReliabilityBar({ reliability, total }) {
  if (!total) return null
  const entries = Object.entries(reliability).sort((a, b) => b[1] - a[1])
  return (
    <ul className="flex flex-col">
      {entries.map(([status, count]) => (
        <li key={status} className="grid grid-cols-[minmax(0,8rem)_1fr_2rem] items-center gap-pw-3 border-b border-edge-soft py-pw-2 last:border-b-0">
          <span className="truncate text-sm text-ink-2">{safeString(status)}</span>
          <span className="h-1.5 rounded-[2px] bg-[var(--viz-track)]" aria-hidden="true">
            <span className="block h-full rounded-[2px]" style={{ width: `${(count / total) * 100}%`, background: toneOf(status) }} />
          </span>
          <span className="num text-right text-ink">{count}</span>
        </li>
      ))}
    </ul>
  )
}
