/**
 * StatCard — label / value / optional sub-value card.
 *
 * Props:
 *   label   string
 *   value   string | number
 *   sub?    string
 *   accent? string   — color (data) for the left border accent, via --accent-bar
 *   size?   'sm' | 'md'   default 'sm'
 */
export default function StatCard({ label, value, sub, accent, size = 'sm' }) {
  return (
    <div
      className={`panel panel--sm ${accent ? 'border-l-[3px] border-l-[var(--accent-bar)]' : ''}`}
      style={accent ? { '--accent-bar': accent } : undefined}
    >
      <div className="label mb-pw-2">{label}</div>
      <div className={`value ${size === 'md' ? 'text-2xl' : 'text-base'}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-ink-3 mt-pw-1">{sub}</div>}
    </div>
  )
}
