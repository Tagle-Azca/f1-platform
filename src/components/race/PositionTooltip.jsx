export default function PositionTooltip({ active, payload, label, driverMetaRef }) {
  if (!active) return null
  const lap = label
  const meta = driverMetaRef.current || []

  const presentSet = new Set(payload?.map(p => p.dataKey) || [])
  const present = (payload || []).slice().sort((a, b) => a.value - b.value)

  const retired = meta.filter(d =>
    !d.dns && !presentSet.has(d.driverId) && d.lastLap != null && d.lastLap < lap
  )
  const dns = meta.filter(d => d.dns)

  if (!present.length && !retired.length && !dns.length) return null

  return (
    <div style={{ background:'rgba(8,8,8,0.97)', border:'1px solid var(--border-color)', borderRadius:8, padding:'0.6rem 0.85rem', minWidth:160 }}>
      <p style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginBottom:5, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.06em' }}>
        LAP {lap}
      </p>
      {present.map(p => (
        <div key={p.dataKey} style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:2 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:p.color, flexShrink:0 }} />
          <span style={{ fontSize:'0.72rem', color:'var(--text-primary)', flex:1 }}>{p.name}</span>
          <span style={{ fontSize:'0.75rem', fontWeight:700, color:p.color, fontVariantNumeric:'tabular-nums' }}>P{p.value}</span>
        </div>
      ))}
      {retired.map(d => (
        <div key={d.driverId} style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:2, opacity:0.6 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:d.color, flexShrink:0 }} />
          <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', flex:1 }}>{d.acronym}</span>
          <span style={{ fontSize:'0.68rem', fontWeight:700, color:'#f59e0b' }}>DNF L{d.lastLap}</span>
        </div>
      ))}
      {dns.map(d => (
        <div key={d.driverId} style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:2, opacity:0.5 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--text-muted)', flexShrink:0 }} />
          <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', flex:1 }}>{d.acronym}</span>
          <span style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--text-muted)' }}>DNS</span>
        </div>
      ))}
    </div>
  )
}
