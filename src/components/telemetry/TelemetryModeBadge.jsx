export default function TelemetryModeBadge({ isHistorical }) {
  const color  = isHistorical ? '#22c55e' : '#a855f7'
  const bgRgb  = isHistorical ? '34,197,94' : '168,85,247'

  return (
    <div className="flex-center" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.25rem 0.7rem', borderRadius: 99,
        background: `rgba(${bgRgb},0.12)`,
        border: `1px solid rgba(${bgRgb},0.35)`,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color }}>
          {isHistorical ? 'Historical Mode' : 'Live Telemetry'}
        </span>
      </div>
      {isHistorical && (
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Select 2023 or later for live telemetry data
        </span>
      )}
    </div>
  )
}
