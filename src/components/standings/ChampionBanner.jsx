export default function ChampionBanner({ champion, gap, season }) {
  if (!champion) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      padding: '0.65rem 1.1rem', marginBottom: '1rem',
      background: `linear-gradient(135deg, ${champion.color}18, transparent)`,
      border: `1px solid ${champion.color}33`,
      borderLeft: `3px solid ${champion.color}`,
      borderRadius: 8,
    }}>
      <div>
        <span style={{ fontWeight: 800, color: champion.color, fontSize: '1rem' }}>
          {champion.name}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.6rem' }}>
          {champion.team}
        </span>
      </div>

      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
        <div style={{ fontWeight: 700, color: champion.color, fontSize: '1.1rem' }}>
          {champion.finalPoints} pts
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Champion {season}
        </div>
      </div>

      {gap !== null && gap > 0 && (
        <div style={{
          padding: '0.3rem 0.7rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 6, textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Current lead</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>+{gap} pts</div>
        </div>
      )}
    </div>
  )
}
