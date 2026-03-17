export default function ReliabilityBar({ reliability, total }) {
  if (!total) return null
  const entries = Object.entries(reliability).sort((a, b) => b[1] - a[1])
  const STATUS_COLORS = {
    'Finished': '#22c55e',
    'default':  '#e10600',
  }
  return (
    <div>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
        Retirement Causes
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {entries.map(([status, count]) => {
          const color = status === 'Finished' ? '#22c55e'
            : /accident|collision|crash/i.test(status) ? '#f59e0b'
            : '#e10600'
          return (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <div style={{ width: 80, fontSize: '0.68rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>
                {status}
              </div>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${(count / total) * 100}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color, minWidth: 16, textAlign: 'right' }}>{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
