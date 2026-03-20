export default function ConstructorLeaderBanner({ leader, gap, isLive, season }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      padding: '0.65rem 1.1rem', marginBottom: '1rem',
      background: `linear-gradient(135deg, ${leader.color}18, transparent)`,
      border: `1px solid ${leader.color}33`,
      borderLeft: `3px solid ${leader.color}`,
      borderRadius: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: leader.color }} />
        <span style={{ fontWeight: 800, color: leader.color, fontSize: '1rem' }}>{leader.name}</span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {isLive && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.2rem 0.6rem',
            background: 'rgba(225,6,0,0.1)',
            border: '1px solid rgba(225,6,0,0.25)',
            borderRadius: 99,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--f1-red)', animation: 'pulse 2s infinite' }} />
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.65rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(225,6,0,0.85)',
            }}>
              Live Season · Updated weekly
            </span>
          </div>
        )}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: leader.color, fontSize: '1.1rem' }}>{leader.pts} pts</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {isLive ? 'Current leader' : `Champion ${season}`}
          </div>
        </div>
      </div>

      {gap !== null && gap > 0 && (
        <div style={{ padding: '0.3rem 0.7rem', background: 'rgba(28,28,28,0.92)', borderRadius: 6, textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Current lead</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>+{gap} pts</div>
        </div>
      )}
    </div>
  )
}
