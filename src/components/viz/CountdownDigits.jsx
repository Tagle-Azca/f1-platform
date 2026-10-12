import { countdownGroups, countdownSpoken } from './countdownFormat'

/**
 * Unboxed tabular numerals. The digits are aria-hidden; one static sr-only label carries the meaning
 * (not a live region). Under 10 minutes the numerals turn steel-hi (no blink, no glow).
 */
const int = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0)

export default function CountdownDigits({ parts, label = 'Starts in', size = 'lg', className = '' }) {
  if (!parts) return null
  const total = int(parts.d) * 1440 + int(parts.h) * 60 + int(parts.m)
  const urgent = total < 10
  const numCls = size === 'lg' ? 'text-count' : 'text-heading'
  return (
    <div className={className}>
      <span className="sr-only-live">{`${label} ${countdownSpoken(parts)}`}</span>
      <p aria-hidden="true" className={`flex flex-wrap items-baseline gap-x-pw-2 ${urgent ? 'text-steel-hi' : 'text-ink'}`} data-countdown>
        {countdownGroups(parts).map(([n, u]) => (
          <span key={u} className="inline-flex items-baseline">
            <span className={numCls}>{n}</span>
            <span className="ml-0.5 text-sm font-medium text-ink-3">{u}</span>
          </span>
        ))}
      </p>
    </div>
  )
}
