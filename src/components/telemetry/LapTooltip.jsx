const COLORS = { lap: '#e10600' }

function fmtLap(secs) {
  if (!secs || secs <= 0) return '—'
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

export default function LapTooltip({ active, payload, label, pitStops }) {
  if (!active || !payload?.length) return null
  const isPit = pitStops?.some(p => p.lap === label)
  return (
    <div style={{
      background: 'rgba(8,8,8,0.98)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 8, padding: '0.55rem 0.8rem', minWidth: 130,
    }}>
      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>Lap {label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: COLORS.lap, fontVariantNumeric: 'tabular-nums' }}>
        {fmtLap(payload[0]?.value)}
      </div>
      {isPit && (
        <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />
          <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.06em' }}>PIT STOP</span>
        </div>
      )}
    </div>
  )
}
