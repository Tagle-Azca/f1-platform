import { usePreferences } from '../../contexts/PreferencesContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { getTeam } from '../../data/f1Teams'
import ConstructorLogo from '../ui/ConstructorLogo'

export default function ConstructorSpotlightCard({ data, isNarrow = false }) {
  const { isMobile } = useBreakpoint()
  const { prefs } = usePreferences()
  const { favoriteTeam } = prefs

  if (!favoriteTeam) {
    return (
      <div style={{ height: 56, display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Select a team in My Garage</div>
      </div>
    )
  }

  const team       = getTeam(favoriteTeam)
  const teamColor  = team?.color ?? 'var(--accent-color)'
  const ctorData   = data?.constructorStandings?.find(c => c.constructorId === favoriteTeam)
  const leader     = data?.constructorStandings?.[0]
  const isLeader   = ctorData?.position === 1
  const gap        = ctorData && leader && !isLeader ? leader.points - ctorData.points : null
  const remaining  = data ? data.totalRounds - (data.roundsDone ?? 0) : null
  const barPct     = ctorData && leader && leader.points > 0
    ? Math.min(100, Math.round((ctorData.points / leader.points) * 100))
    : 60

  // Both drivers' last-race positions
  const teamDrivers  = team?.drivers ?? []
  const lastResults  = data?.lastRace?.Results ?? []
  const driverSlots  = teamDrivers.map(fullName => {
    const r = lastResults.find(r =>
      `${r.Driver?.givenName ?? ''} ${r.Driver?.familyName ?? ''}`.trim().toLowerCase() === fullName.toLowerCase()
    )
    const pos = r ? parseInt(r.position) : null
    return { surname: fullName.split(' ').pop(), pos }
  })

  // Points contribution per driver from standings
  const driverPts = teamDrivers.map(fullName => {
    const d = (data?.standings ?? []).find(d => d.name.toLowerCase() === fullName.toLowerCase())
    return { surname: fullName.split(' ').pop(), pts: d?.points ?? null }
  })

  const gapLabel = isLeader
    ? `Leading the WCC${remaining ? ` · ${remaining} rounds to defend` : ''}`
    : gap != null
      ? `−${gap} pts to leader${remaining ? ` · ${remaining} rounds left` : ''}`
      : '—'

  return (
    <div style={{ marginBottom: '0.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <ConstructorLogo
          constructorId={favoriteTeam} name={team?.name}
          color={teamColor} size={isMobile ? 48 : 80} radius={10}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: '0.55rem', fontWeight: 700, padding: '2px 7px', borderRadius: 3,
            background: 'rgb(var(--accent-rgb) / 0.14)', color: 'var(--accent-color)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            {isLeader ? 'WCC Leader' : 'Your Team'}
          </span>
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900,
            fontFamily: "'Barlow Condensed', sans-serif",
            color: 'var(--text-primary)', lineHeight: 1, marginTop: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {team?.short ?? team?.name}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {team?.name}
          </div>
        </div>
      </div>

      {/* Championship strip */}
      <div style={{
        background: 'rgba(255,255,255,0.035)', borderRadius: 8,
        padding: isMobile ? '0.5rem 0.65rem' : '0.75rem 0.85rem',
        marginBottom: isMobile ? '0.5rem' : '0.65rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: isMobile ? 7 : 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
            <span style={{
              fontSize: isMobile ? '2rem' : '2.8rem', fontWeight: 900, lineHeight: 1,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: teamColor, transition: 'color 0.4s',
            }}>
              {ctorData?.points ?? 0}
            </span>
            <span style={{ fontSize: isMobile ? '0.5rem' : '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>pts</span>
          </div>
          <span style={{
            fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 900, lineHeight: 1,
            fontFamily: "'Barlow Condensed', sans-serif",
            color: isLeader ? teamColor : 'var(--text-secondary)',
          }}>
            P{ctorData?.position ?? '—'}
          </span>
        </div>
        <div style={{ height: isMobile ? 4 : 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: isMobile ? 5 : 7 }}>
          <div style={{ height: '100%', width: `${barPct}%`, background: teamColor, borderRadius: 3, transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ fontSize: isMobile ? '0.48rem' : '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          {gapLabel}
        </div>
      </div>

      {/* Drivers grid: last race pos + season points */}
      {!isNarrow && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
          {driverSlots.map(({ surname, pos }, idx) => {
            const pts = driverPts[idx]?.pts
            const posColor = pos && pos <= 3 ? '#22c55e' : pos && pos <= 10 ? teamColor : 'var(--text-secondary)'
            return (
              <div key={surname} style={{
                background: 'rgba(255,255,255,0.035)', borderRadius: 6,
                padding: isMobile ? '0.4rem 0.5rem' : '0.5rem 0.65rem',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                <div style={{ fontSize: isMobile ? '0.52rem' : '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {surname}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif", color: posColor, lineHeight: 1 }}>
                    {pos ? `P${pos}` : '—'}
                  </span>
                  {pts != null && (
                    <span style={{ fontSize: '0.6rem', color: teamColor, fontWeight: 700 }}>{pts}pts</span>
                  )}
                </div>
                <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>Last race · Season</div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
