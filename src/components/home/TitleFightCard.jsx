export default function TitleFightCard({ data }) {
  const leader      = data.standings?.[0]
  const p2          = data.standings?.[1]
  const remaining   = data.totalRounds && data.roundsDone != null ? data.totalRounds - data.roundsDone : null
  const maxPossible = remaining ? remaining * 25 : null
  const gapPts      = leader && p2 ? leader.points - p2.points : null
  const gapPct      = gapPts != null && maxPossible ? Math.min(100, Math.round((gapPts / maxPossible) * 100)) : null

  const fightColor  = gapPct == null ? 'var(--accent-color)' : gapPct < 35 ? '#22c55e' : gapPct < 65 ? '#f59e0b' : '#e10600'
  const fightNote   = gapPct == null ? null : gapPct < 35 ? 'Championship is wide open' : gapPct < 65 ? 'Gap is narrowing' : 'Leader pulling away'

  const fl          = data.lastSession?.fastestLap ?? data.lastRace?.fastestLap
  const flRaceName  = (data.lastSession?.raceName ?? data.lastRace?.raceName)?.replace(' Grand Prix', '')
  const momentum    = data.lastRace?.podium?.[0]?.name ?? data.lastRace?.winner?.name ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
      {gapPts != null && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Title Gap</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: fightColor, fontVariantNumeric: 'tabular-nums', fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1, transition: 'color 0.4s' }}>
              −{gapPts} pts
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${gapPct ?? 0}%`, background: fightColor, borderRadius: 4, transition: 'width 0.8s ease, background 0.4s' }} />
          </div>
          {fightNote && <div style={{ fontSize: '0.56rem', color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>{fightNote}</div>}
        </div>
      )}

      {momentum && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Momentum</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-color)', textAlign: 'right' }}>{momentum} · won last race</span>
        </div>
      )}

      {fl && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Fastest</span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-color)', fontFamily: "'JetBrains Mono', monospace" }}>{fl.time}</span>
            {(fl.name || flRaceName) && (
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 1 }}>
                {fl.name?.split(' ').pop()}{flRaceName ? ` · ${flRaceName}` : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {remaining != null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rounds Left</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-color)', fontVariantNumeric: 'tabular-nums' }}>{remaining} of {data.totalRounds}</span>
        </div>
      )}
    </div>
  )
}
