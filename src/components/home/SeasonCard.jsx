export default function SeasonCard({ data }) {
  const leader = data.standings?.[0]
  const wcc    = data.constructorStandings?.[0]
  const p2     = data.standings?.[1]
  const gap    = leader && p2 ? leader.points - p2.points : null
  const pct    = data.totalRounds ? Math.round((data.roundsDone / data.totalRounds) * 100) : 0

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Season Progress</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{data.roundsDone}/{data.totalRounds} races</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, marginBottom: '0.75rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent-color), rgb(var(--accent-rgb) / 0.5))', borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>

      {leader && (
        <div style={{ marginBottom: '0.45rem' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>WDC Leader</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif" }}>{leader.name}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-color)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{leader.points} pts</span>
          </div>
          {gap !== null && (
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: 1 }}>+{gap} pts ahead of P2</div>
          )}
        </div>
      )}

      {wcc && (
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>WCC Leader</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{wcc.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{wcc.points} pts</span>
          </div>
        </div>
      )}
    </div>
  )
}
