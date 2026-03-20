export default function ChartTooltip({ active, payload, label, rounds, cappedRound }) {
  if (!active || !payload?.length) return null
  // Don't show tooltip for rounds beyond the current playback position
  if (cappedRound != null && label > cappedRound) return null
  const all      = [...payload].filter(p => p.value != null).sort((a, b) => b.value - a.value)
  const sorted   = all.some(p => p.value > 0) ? all.filter(p => p.value > 0) : all
  const raceName = rounds?.[label - 1]?.raceName ?? `Round ${label}`

  return (
    <div style={{
      background: 'rgba(8,8,8,0.97)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 8, padding: '0.75rem 1rem', minWidth: 210,
    }}>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Round {label}</p>
      <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700, marginBottom: '0.55rem' }}>
        {raceName}
      </p>
      {sorted.map((entry, i) => (
        <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', width: 22, textAlign: 'right', flexShrink: 0 }}>
            P{i + 1}
          </span>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.78rem', color: '#fff', flex: 1 }}>{entry.name}</span>
          <span style={{ fontSize: '0.8rem', color: entry.color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}
