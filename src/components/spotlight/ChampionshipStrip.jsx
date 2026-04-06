export default function ChampionshipStrip({ position, points, wins, spotlightGap, leaderPoints, remaining, teamColor, isMobile }) {
  const isLeader = position === 1 || spotlightGap === null
  const maxTotal  = leaderPoints ? leaderPoints + (remaining ?? 0) * 25 : null
  const barPct    = isLeader
    ? (maxTotal ? Math.min(100, Math.round((points / maxTotal) * 100)) : 60)
    : (leaderPoints ? Math.min(99, Math.round((points / leaderPoints) * 100)) : 50)

  const gapLabel = isLeader
    ? `Leading the championship${remaining ? ` · ${remaining} rounds to defend` : ''}`
    : `−${spotlightGap} pts to leader${remaining ? ` · ${remaining} rounds left` : ''}`

  return (
    <div style={{
      background: 'rgba(255,255,255,0.035)',
      borderRadius: 8, padding: isMobile ? '0.5rem 0.65rem' : '0.75rem 0.85rem',
      marginBottom: isMobile ? '0.5rem' : '0.65rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: isMobile ? 7 : 10 }}>
        {/* Points */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
          <span style={{
            fontSize: isMobile ? '2rem' : '2.8rem', fontWeight: 900, lineHeight: 1,
            fontFamily: "'Barlow Condensed', sans-serif",
            color: teamColor, transition: 'color 0.4s',
          }}>
            {points ?? 0}
          </span>
          <span style={{ fontSize: isMobile ? '0.5rem' : '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            pts
          </span>
        </div>

        {/* Position + wins */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {wins > 0 && (
            <div style={{
              fontSize: isMobile ? '0.48rem' : '0.55rem', fontWeight: 700, letterSpacing: '0.07em',
              textTransform: 'uppercase', padding: isMobile ? '2px 6px' : '3px 8px', borderRadius: 4,
              background: `${teamColor}1A`, color: teamColor,
              border: `1px solid ${teamColor}44`,
            }}>
              {wins} {wins === 1 ? 'Win' : 'Wins'}
            </div>
          )}
          <span style={{
            fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 900, lineHeight: 1,
            fontFamily: "'Barlow Condensed', sans-serif",
            color: isLeader ? teamColor : 'var(--text-secondary)',
            transition: 'color 0.4s',
          }}>
            P{position ?? '—'}
          </span>
        </div>
      </div>

      <div style={{ height: isMobile ? 4 : 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: isMobile ? 5 : 7 }}>
        <div style={{
          height: '100%', width: `${barPct}%`,
          background: teamColor, borderRadius: 3,
          transition: 'width 0.8s ease',
        }} />
      </div>

      <div style={{ fontSize: isMobile ? '0.48rem' : '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
        {gapLabel}
      </div>
    </div>
  )
}
