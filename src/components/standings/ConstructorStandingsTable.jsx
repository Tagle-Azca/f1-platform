export default function ConstructorStandingsTable({ currentStandings, currentRound, loading }) {
  return (
    <div style={{ width: 220, flexShrink: 0 }}>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.7rem' }}>
          CONSTRUCTORS{currentRound ? ` · ${currentRound.raceName}` : ''}
        </div>
        {currentStandings.map((c, i) => {
          const prev      = currentStandings[i - 1]
          const gapToPrev = prev ? prev.pts - c.pts : null
          return (
            <div key={c.driverId} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.38rem 0',
              borderBottom: i < currentStandings.length - 1 ? '1px solid rgba(255,255,255,0.09)' : 'none',
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: i === 0 ? c.color : 'var(--text-muted)', width: 18, textAlign: 'right', flexShrink: 0 }}>
                {i + 1}
              </span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
              <span style={{
                fontSize: '0.77rem',
                color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: i === 0 ? 700 : 400,
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {c.name}
              </span>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: i === 0 ? c.color : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {c.pts}
                </div>
                {gapToPrev !== null && gapToPrev > 0 && (
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    -{gapToPrev}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {!currentStandings.length && !loading && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No data</p>
        )}
      </div>
    </div>
  )
}
