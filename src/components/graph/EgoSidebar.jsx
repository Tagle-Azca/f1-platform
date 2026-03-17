import { COLOR, seasonRange } from '../../utils/graphLayout'

const sectionLabel = {
  fontSize:      '0.65rem',
  color:         'var(--text-muted)',
  fontWeight:    700,
  letterSpacing: '0.06em',
  marginBottom:  '0.5rem',
  textTransform: 'uppercase',
}

export default function EgoSidebar({ activeDriver, egoData, loading, isMobile = false }) {
  const stats = egoData?.stats
  const debut = egoData?.debut

  return (
    <div style={{ width: isMobile ? '100%' : 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: isMobile ? 'none' : 620, overflowY: isMobile ? 'visible' : 'auto' }}>

      {!activeDriver && (
        <div className="card card--dgraph" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            HOW TO USE
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            1. Type a driver name<br />
            2. Select from the dropdown<br />
            3. Explore their full network of teams and teammates across their career
          </p>
        </div>
      )}

      {activeDriver && loading && (
        <div className="card card--dgraph" style={{ padding: '1rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading network...</p>
        </div>
      )}

      {activeDriver && stats && (
        <>
          {/* Driver header + career stats */}
          <div className="card card--dgraph" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: COLOR.Driver,
              }} />
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {activeDriver.name}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {stats.firstSeason}–{stats.lastSeason} · {stats.seasons} season{stats.seasons !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div style={sectionLabel}>CAREER</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : '1fr 1fr', gap: '0.4rem' }}>
              {[
                { label: 'Races',        value: stats.races },
                { label: 'Wins',         value: stats.wins,        hi: true },
                { label: 'Podiums',      value: stats.podiums },
                { label: 'Points',       value: stats.points },
                { label: 'Poles',        value: stats.poles },
                { label: 'Fastest Laps', value: stats.fastestLaps },
              ].map(({ label, value, hi }) => (
                <div key={label} style={{ background: 'var(--surface-2)', borderRadius: 6, padding: isMobile ? '0.5rem 0.6rem' : '0.3rem 0.45rem' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontSize: isMobile ? '1.15rem' : '0.9rem', fontWeight: 700, color: hi ? '#f59e0b' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Debut */}
          {debut && (
            <div className="card card--dgraph" style={{ padding: '1rem' }}>
              <div style={sectionLabel}>DEBUT</div>
              <p style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {debut.raceName}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                {debut.season}{debut.circuitName ? ` · ${debut.circuitName}` : ''}
              </p>
              {debut.position && (
                <span style={{ display: 'inline-block', marginTop: 5, fontSize: '0.72rem', fontWeight: 700, color: '#e10600', background: 'rgba(225,6,0,0.12)', padding: '2px 7px', borderRadius: 4 }}>
                  P{debut.position}
                </span>
              )}
            </div>
          )}

          {/* Teams */}
          {egoData?.nodes?.filter(n => n.type === 'Team').length > 0 && (
            <div className="card card--dgraph" style={{ padding: '1rem' }}>
              <div style={sectionLabel}>
                TEAMS ({egoData.nodes.filter(n => n.type === 'Team').length})
              </div>
              {egoData.nodes
                .filter(n => n.type === 'Team')
                .sort((a, b) => (a.seasons?.[0] ?? '9999').localeCompare(b.seasons?.[0] ?? '9999'))
                .map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.22rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 240 : 135 }}>
                      {t.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#f59e0b', flexShrink: 0, marginLeft: 6, fontVariantNumeric: 'tabular-nums' }}>
                      {seasonRange(t.seasons)}
                    </span>
                  </div>
                ))
              }
            </div>
          )}

          {/* Teammates */}
          {egoData?.nodes?.filter(n => n.type === 'Teammate').length > 0 && (
            <div className="card card--dgraph" style={{ padding: '1rem' }}>
              <div style={sectionLabel}>
                TEAMMATES ({egoData.nodes.filter(n => n.type === 'Teammate').length})
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto', paddingRight: 2 }}>
                {egoData.nodes
                  .filter(n => n.type === 'Teammate')
                  .sort((a, b) => b.seasons.length - a.seasons.length)
                  .map((t, i, arr) => (
                    <div key={t.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                      padding: '0.28rem 0',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}>
                      <span style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 260 : 140 }}>
                        {t.name}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>
                        {seasonRange(t.seasons)}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
