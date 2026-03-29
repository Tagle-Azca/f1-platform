export default function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'rgba(8,8,8,0.97)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'0.6rem 0.85rem', minWidth:150 }}>
      <p style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginBottom:5 }}>Lap {label}</p>
      {[...payload].sort((a,b)=>a.value-b.value).map(p => (
        <div key={p.dataKey} style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:2 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:p.color, flexShrink:0 }} />
          <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.8)', flex:1 }}>{p.name}</span>
          <span style={{ fontSize:'0.75rem', fontWeight:700, color:p.color, fontVariantNumeric:'tabular-nums' }}>
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}
