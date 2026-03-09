import { LEGENDARY, SEASON_STORIES } from '../../utils/teamColors'

export default function StandingsTable({ currentStandings, currentRound, season, loading }) {
  return (
    <div style={{ width: 220, flexShrink: 0 }}>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.7rem' }}>
          STANDINGS{currentRound ? ` · ${currentRound.raceName}` : ''}
        </div>

        {currentStandings.map((d, i) => {
          const prev       = currentStandings[i - 1]
          const gapToPrev  = prev ? prev.pts - d.pts : null
          return (
            <div key={d.driverId} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.38rem 0',
              borderBottom: i < currentStandings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700,
                color: i === 0 ? d.color : 'var(--text-muted)',
                width: 18, textAlign: 'right', flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
              <span style={{
                fontSize: '0.77rem',
                color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: i === 0 ? 700 : 400,
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {d.name.split(' ').pop()}
              </span>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: i === 0 ? d.color : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {d.pts}
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

      {LEGENDARY.has(season) && (
        <div className="card" style={{ padding: '0.85rem', marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
            LEGENDARY SEASON
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {SEASON_STORIES[season] || 'One of the most epic seasons in F1 history.'}
          </p>
        </div>
      )}
    </div>
  )
}
