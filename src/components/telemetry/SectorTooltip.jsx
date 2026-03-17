export default function SectorTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(8,8,8,0.98)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 8, padding: '0.55rem 0.8rem', minWidth: 120,
    }}>
      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Lap {label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: 2 }}>
          <span style={{ fontSize: '0.72rem', color: p.fill, fontWeight: 700 }}>{p.name}</span>
          <span style={{ fontSize: '0.72rem', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{p.value > 0 ? `${p.value.toFixed(3)}s` : '—'}</span>
        </div>
      ))}
    </div>
  )
}
