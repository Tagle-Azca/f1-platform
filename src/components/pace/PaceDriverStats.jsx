import Panel from '../ui/Panel'

function formatTime(secs) {
  if (!secs || secs <= 0) return '—'
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

export default function PaceDriverStats({ driverMeta, isMobile }) {
  if (!driverMeta.length) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${driverMeta.length}, 1fr)`, gap: '0.6rem', marginBottom: '0.75rem' }}>
      {driverMeta.map(d => (
        <Panel key={d.driverId} padding="sm" className="card" style={{ borderTop: `3px solid ${d.color}`, background: `linear-gradient(135deg, ${d.color}10, transparent)` }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 900, color: d.color, marginBottom: '0.5rem' }}>
            {d.acronym}
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '0.4rem', fontWeight: 400 }}>{d.teamName}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 0.75rem' }}>
            {[
              { label: 'Best Lap',    value: formatTime(d.best) },
              { label: 'Median',      value: formatTime(d.median) },
              { label: 'Consistency', value: `±${d.consistency.toFixed(2)}s` },
              { label: 'Laps',        value: d.laps.length },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  )
}
