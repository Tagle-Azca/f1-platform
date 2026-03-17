import AccentBanner from '../ui/AccentBanner'
import StatCard from '../ui/StatCard'
import LivePill from '../ui/LivePill'

const currentYear = String(new Date().getFullYear())

export default function ChampionBanner({ champion, gap, season }) {
  if (!champion) return null
  const isLive = season === currentYear

  return (
    <AccentBanner
      color={champion.color}
      padding="sm"
      radius={8}
      style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {champion.number && (
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '1.4rem', fontWeight: 900, lineHeight: 1,
            color: champion.color, opacity: 0.7,
          }}>
            #{champion.number}
          </span>
        )}
        <div>
          <span style={{ fontWeight: 800, color: champion.color, fontSize: '1rem' }}>
            {champion.name}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.6rem' }}>
            {champion.team}
          </span>
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {isLive && (
          <LivePill>Live Season · Updated weekly</LivePill>
        )}

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: champion.color, fontSize: '1.1rem' }}>
            {champion.finalPoints} pts
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {isLive ? 'Current leader' : `Champion ${season}`}
          </div>
        </div>
      </div>

      {gap !== null && gap > 0 && (
        <StatCard label="Current lead" value={`+${gap} pts`} />
      )}
    </AccentBanner>
  )
}
