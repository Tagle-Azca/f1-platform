import { usePreferences } from '../../contexts/PreferencesContext'
import { F1_TEAMS } from '../../data/f1Teams'
import ConstructorLogo from '../ui/ConstructorLogo'
import { useBreakpoint } from '../../hooks/useBreakpoint'

function statBox(label, value, isMobile) {
  return (
    <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: isMobile ? '0.4rem 0.6rem' : '0.3rem 0.5rem' }}>
      <div style={{ fontSize: isMobile ? '0.62rem' : '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: isMobile ? '1rem' : '0.85rem', fontWeight: 700, color: 'var(--accent-color)', fontVariantNumeric: 'tabular-nums', transition: 'color 0.4s' }}>{value ?? '—'}</div>
    </div>
  )
}

export default function DbCardBody({ db, data }) {
  const { prefs } = usePreferences()
  const { isMobile } = useBreakpoint()

  if (!data) {
    return (
      <div style={{ height: 72, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading…</div>
      </div>
    )
  }

  const leader = data.standings?.[0]
  const wcc    = data.constructorStandings?.[0]
  const p2     = data.standings?.[1]
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
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent-color), rgb(var(--accent-rgb) / 0.5))', borderRadius: 3, transition: 'width 0.6s ease, background 0.4s ease' }} />
        </div>
        {leader && (
          <div style={{ marginBottom: '0.45rem' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>WDC Leader</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif" }}>{leader.name}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-color)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, transition: 'color 0.4s' }}>{leader.points} pts</span>
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
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, transition: 'color 0.4s' }}>{wcc.points} pts</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Card 2: Driver Spotlight ────────────────────────────
  if (db === 'cassandra') {
    const favoriteDriver = prefs.favoriteDriver

    // Case-insensitive name match (handles minor spacing/casing differences)
    const fromStandings = favoriteDriver
      ? (data.standings ?? []).find(
          d => d.name.toLowerCase() === favoriteDriver.toLowerCase()
        )
      : leader

    // Fallback: driver selected but not yet in standings (0 races / 0 pts)
    const driverTeamFromF1 = favoriteDriver
      ? F1_TEAMS.find(t => t.drivers.includes(favoriteDriver))
      : null

    const spotlight = fromStandings ?? (favoriteDriver ? {
      name:     favoriteDriver,
      team:     driverTeamFromF1?.name ?? '—',
      points:   0,
      wins:     0,
      position: null,
    } : null)

    const isYourDriver = !!favoriteDriver
    const spotlightGap = spotlight && leader && spotlight.name !== leader?.name && leader.points > 0
      ? leader.points - (spotlight.points ?? 0)
      : null

    // Last race fastest lap + where it happened
    const fl    = data.lastRace?.fastestLap ?? data.lastSession?.fastestLap
    const flRace = data.lastRace?.raceName?.replace(' Grand Prix', ' GP')
                ?? data.lastSession?.raceName?.replace(' Grand Prix', ' GP')
                ?? null

    return (
      <div style={{ marginBottom: '1rem' }}>
        {spotlight ? (
          <>
            {/* Header: logo left + label/name stacked right */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.65rem' }}>
              <ConstructorLogo
                constructorId={spotlight.constructorId ?? driverTeamFromF1?.id}
                name={spotlight.team}
                color={driverTeamFromF1?.color ?? '#888'}
                size={isMobile ? 54 : 72}
                radius={10}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? '0.6rem' : '0.52rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.2rem' }}>
                  {isYourDriver ? 'Your Driver' : 'Championship Leader'}
                </div>
                <div style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.04em', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {spotlight.name}
                </div>
                <div style={{ fontSize: isMobile ? '0.65rem' : '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {spotlight.position ? `P${spotlight.position} · Championship` : 'Season not started'}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', marginBottom: '0.5rem' }}>
              {statBox('Points', spotlight.points ?? 0, isMobile)}
              {statBox('Wins',   spotlight.wins   ?? 0, isMobile)}
              {statBox('Gap to P1', spotlightGap !== null ? `+${spotlightGap}` : '—', isMobile)}
            </div>
          </>
        ) : (
          <div style={{ height: 72, display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select a driver in My Garage</div>
          </div>
        )}
        {fl && (
          <div style={{ background: 'rgb(var(--accent-rgb) / 0.08)', borderRadius: 5, padding: '0.4rem 0.55rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', transition: 'background 0.4s' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: isMobile ? '0.62rem' : '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                Last Fastest Lap{flRace ? ` · ${flRace}` : ''}
              </div>
              <div style={{ fontSize: isMobile ? '0.82rem' : '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fl.name ?? fl.driver}</div>
            </div>
            <div style={{ fontSize: isMobile ? '0.95rem' : '0.88rem', fontWeight: 800, color: 'var(--accent-color)', fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, transition: 'color 0.4s' }}>{fl.time}</div>
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
    fl     && { label: 'Last Fastest Lap',  value: fl.time, mono: true },
    data.roundsDone != null && { label: 'Races Completed', value: `${data.roundsDone} of ${data.totalRounds}` },
  ].filter(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Season Highlights</div>
      {rows.map(({ label, value, mono }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-color)',
            fontVariantNumeric: 'tabular-nums', textAlign: 'right',
            fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
            transition: 'color 0.4s',
          }}>{value}</span>
        </div>
      ))}
    </div>
  )
}
