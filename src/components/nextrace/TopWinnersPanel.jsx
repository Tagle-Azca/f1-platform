import Panel from '../ui/Panel'

export default function TopWinnersPanel({ topWinners }) {
  if (!topWinners?.length) return null

  return (
    <Panel padding="none" style={{ padding: '1rem 1.25rem' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
        Most Wins Here
      </div>
      {topWinners.map(([name, wins], i) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem 0', borderBottom: i < topWinners.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 900, color: 'var(--text-muted)', width: 20, textAlign: 'center' }}>
            {i + 1}
          </span>
          <span style={{ flex: 1, fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>{name}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e8002d' }}>{wins}x</span>
        </div>
      ))}
    </Panel>
  )
}
