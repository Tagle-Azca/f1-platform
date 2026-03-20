import { ctorColor } from '../../utils/teamColors'

function formatSessionDT(dateStr, timeStr) {
  if (!dateStr) return ''
  const dt = new Date(`${dateStr}T${(timeStr || '00:00:00').replace(/Z$/i, '')}Z`)
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
    + (timeStr ? ' · ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' local' : '')
}

export default function QualifyingTable({ qualifyingResults, isMobile, onDriverClick, schedule }) {
  if (!qualifyingResults.length) {
    return (
      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>Qualifying results not available yet</p>
        {schedule?.qualifying && (
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem' }}>
            {formatSessionDT(schedule.qualifying.date, schedule.qualifying.time)}
          </p>
        )}
      </div>
    )
  }

  return (
    <div style={{ minWidth: 480 }}>
      <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '2.5rem 1.5rem 1fr 1fr 4.5rem 4.5rem 4.5rem', gap: '0 0.75rem', padding: '0.45rem 1.25rem' }}>
        <span>Pos</span><span>No.</span><span>Driver</span><span>Constructor</span>
        <span style={{ textAlign: 'right' }}>Q1</span><span style={{ textAlign: 'right' }}>Q2</span><span style={{ textAlign: 'right' }}>Q3</span>
      </div>
      {qualifyingResults.map((r, i) => {
        const color = ctorColor(r.Constructor?.constructorId)
        const isFirst = i === 0
        return (
          <div
            key={r.Driver?.driverId || i}
            style={{
              display: 'grid',
              gridTemplateColumns: '2.5rem 1.5rem 1fr 1fr 4.5rem 4.5rem 4.5rem',
              gap: '0 0.75rem',
              padding: '0.55rem 1.25rem',
              alignItems: 'center',
              borderBottom: i < qualifyingResults.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              background: isFirst ? 'var(--surface-3)' : 'transparent',
              borderLeft: isFirst ? `3px solid ${color}` : '3px solid transparent',
            }}
          >
            <span style={{ fontFamily: 'var(--font-condensed)', fontSize: '1rem', fontWeight: 900, color: isFirst ? color : 'var(--text-muted)' }}>
              {r.position}
            </span>
            <span style={{ fontFamily: 'var(--font-condensed)', fontSize: '0.75rem', fontWeight: 700, color, opacity: 0.8 }}>
              {r.Driver?.permanentNumber || r.Driver?.code || '—'}
            </span>
            <div
              onClick={!isMobile && r.Driver?.driverId ? () => onDriverClick({ driverId: r.Driver.driverId, name: `${r.Driver.givenName} ${r.Driver.familyName}` }) : undefined}
              style={{ cursor: !isMobile && r.Driver?.driverId ? 'pointer' : undefined }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: isFirst ? 700 : 500 }}>{r.Driver?.givenName} {r.Driver?.familyName}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{r.Driver?.nationality}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 3, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{r.Constructor?.name || '—'}</span>
            </div>
            {['Q1', 'Q2', 'Q3'].map(q => (
              <span
                key={q}
                style={{
                  fontSize: '0.78rem',
                  textAlign: 'right',
                  color: r[q] ? (isFirst && q === 'Q3' ? color : 'var(--text-primary)') : 'var(--text-muted)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {r[q] || '—'}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}
