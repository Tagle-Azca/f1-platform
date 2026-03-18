const COLOR_A = '#e10600'
const COLOR_B = '#3b82f6'

function fmtLap(secs) {
  if (!secs || secs <= 0) return '—'
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

// Single-driver mode (original)
function SingleTooltip({ payload, label, pitStops }) {
  const isPit = pitStops?.some(p => p.lap === label)
  return (
    <div style={{
      background: 'rgba(8,8,8,0.98)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 8, padding: '0.55rem 0.8rem', minWidth: 130,
    }}>
      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>Lap {label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: COLOR_A, fontVariantNumeric: 'tabular-nums' }}>
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

// Comparison mode
function CompareTooltip({ payload, label, pitStops, pitStopsB, driverA, driverB }) {
  const isPitA = pitStops?.some(p => p.lap === label)
  const isPitB = pitStopsB?.some(p => p.lap === label)
  const timeA  = payload.find(p => p.dataKey === 'a')?.value
  const timeB  = payload.find(p => p.dataKey === 'b')?.value
  const deltaMs = timeA && timeB ? Math.round((timeB - timeA) * 1000) : null

  return (
    <div style={{
      background: 'rgba(8,8,8,0.98)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 8, padding: '0.6rem 0.85rem', minWidth: 170,
    }}>
      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Lap {label}</div>

      {/* Driver A */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{ width: 14, height: 2.5, background: COLOR_A, borderRadius: 1, flexShrink: 0 }} />
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', width: 28 }}>{driverA?.acronym}</span>
        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: COLOR_A, fontVariantNumeric: 'tabular-nums' }}>
          {fmtLap(timeA)}
        </span>
        {isPitA && <span style={{ fontSize: '0.55rem', color: '#fbbf24', fontWeight: 700, marginLeft: 'auto' }}>PIT</span>}
      </div>

      {/* Driver B */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ width: 14, height: 2.5, background: COLOR_B, borderRadius: 1, flexShrink: 0, opacity: 0.85 }} />
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', width: 28 }}>{driverB?.acronym}</span>
        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: COLOR_B, fontVariantNumeric: 'tabular-nums' }}>
          {fmtLap(timeB)}
        </span>
        {isPitB && <span style={{ fontSize: '0.55rem', color: '#fbbf24', fontWeight: 700, marginLeft: 'auto' }}>PIT</span>}
      </div>

      {/* Delta */}
      {deltaMs != null && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 5,
          display: 'flex', alignItems: 'baseline', gap: 5,
        }}>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>Δ</span>
          <span style={{
            fontSize: '0.88rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
            color: deltaMs > 0 ? COLOR_A : COLOR_B,
          }}>
            {deltaMs > 0 ? '+' : ''}{deltaMs}ms
          </span>
          <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)' }}>
            {deltaMs > 0
              ? `${driverA?.acronym} faster`
              : deltaMs < 0
                ? `${driverB?.acronym} faster`
                : 'dead heat'}
          </span>
        </div>
      )}
    </div>
  )
}

export default function LapTooltip({ active, payload, label, pitStops, pitStopsB, driverA, driverB }) {
  if (!active || !payload?.length) return null
  if (driverB) {
    return <CompareTooltip payload={payload} label={label} pitStops={pitStops} pitStopsB={pitStopsB} driverA={driverA} driverB={driverB} />
  }
  return <SingleTooltip payload={payload} label={label} pitStops={pitStops} />
}
