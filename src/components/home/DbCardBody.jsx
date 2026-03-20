function statBox(label, value, color) {
  return (
    <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '0.3rem 0.5rem' }}>
      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: color || 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value ?? '—'}</div>
    </div>
  )
}

export default function DbCardBody({ db, data }) {
  if (!data) {
    return (
      <div style={{ height: 72, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading…</div>
      </div>
    )
  }

  const leader = data.standings?.[0]
  const p2     = data.standings?.[1]
  const wcc    = data.constructorStandings?.[0]
  const gap    = (leader && p2) ? leader.points - p2.points : null
  const pct    = data.totalRounds ? Math.round((data.roundsDone / data.totalRounds) * 100) : 0

  // ── Card 1: Season at a Glance ─────────────────────────
  if (db === 'mongo') {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Season Progress</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{data.roundsDone}/{data.totalRounds} races</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, marginBottom: '0.75rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#22c55e,#86efac)', borderRadius: 3, transition: 'width 0.6s ease' }} />
        </div>
        {leader && (
          <div style={{ marginBottom: '0.45rem' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>WDC Leader</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif" }}>{leader.name}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#22c55e', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{leader.points} pts</span>
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
              <span style={{ fontSize: '0.75rem', color: '#22c55e', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{wcc.points} pts</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Card 2: Driver Spotlight ────────────────────────────
  if (db === 'cassandra') {
    const fl = data.lastSession?.fastestLap
    return (
      <div style={{ marginBottom: '1rem' }}>
        {leader && (
          <>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Championship Leader</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif", marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
              {leader.name}
              <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{leader.team}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', marginBottom: fl ? '0.6rem' : 0 }}>
              {statBox('Points', leader.points, '#a855f7')}
              {statBox('Wins', leader.wins, '#a855f7')}
              {statBox('Gap to P2', gap !== null ? `+${gap}` : '—')}
            </div>
          </>
        )}
        {fl && (
          <div style={{ background: 'rgba(168,85,247,0.08)', borderRadius: 5, padding: '0.4rem 0.55rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Last Fastest Lap</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{fl.driver}</div>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#a855f7', fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>{fl.time}</div>
          </div>
        )}
      </div>
    )
  }

  // ── Card 3: Season Records ──────────────────────────────
  const fl = data.lastSession?.fastestLap
  const rows = [
    leader && { label: 'Most Wins',        value: `${leader.name} · ${leader.wins ?? 0}W` },
    wcc    && { label: 'Constructors Lead', value: wcc.name },
    fl     && { label: 'Last Fastest Lap',  value: fl.time, accent: '#ef4444', mono: true },
    data.roundsDone != null && { label: 'Races Completed', value: `${data.roundsDone} of ${data.totalRounds}` },
  ].filter(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Season Highlights</div>
      {rows.map(({ label, value, accent, mono }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, color: accent || 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums', textAlign: 'right',
            fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
          }}>{value}</span>
        </div>
      ))}
    </div>
  )
}
