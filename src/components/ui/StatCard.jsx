/**
 * StatCard — label / value / optional sub-value card.
 * Used in race detail stats (Winner, Pole, Fastest Lap, DNFs).
 *
 * Props:
 *   label   string
 *   value   string | number
 *   sub?    string
 *   accent? string   — hex color for left border accent
 *   size?   'sm' | 'md'   default 'sm'
 */
export default function StatCard({ label, value, sub, accent, size = 'sm' }) {
  return (
    <div
      className="panel panel--sm"
      style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}
    >
      <div className="label" style={{ marginBottom: '0.35rem' }}>{label}</div>
      <div
        className="value"
        style={{ fontSize: size === 'md' ? '1.5rem' : '0.95rem' }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          {sub}
        </div>
      )}
    </div>
  )
}
