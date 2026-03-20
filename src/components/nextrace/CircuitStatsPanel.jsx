import Panel from '../ui/Panel'

export default function CircuitStatsPanel({ history, race, circuit, isMobile }) {
  if (!history) return null

  const lastWinner = history.races?.[0]?.Results?.[0]?.Driver

  const stats = [
    { label: 'Races held',  value: history.races?.length ?? '—' },
    { label: 'Last winner', value: lastWinner ? `${lastWinner.givenName} ${lastWinner.familyName}` : '—' },
    { label: 'Country',     value: race.country },
    { label: 'Circuit',     value: circuit?.circuitName || race.circuit },
  ]

  return (
    <Panel padding="none" style={{ padding: '1rem 1.25rem' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
        Circuit Stats
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.5rem' }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '0.75rem 0.9rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>{label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{value}</div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
