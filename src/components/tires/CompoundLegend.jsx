const COMPOUND_COLOR = {
  SOFT:         { bg: '#e8002d', label: '#fff' },
  MEDIUM:       { bg: '#ffd600', label: '#111' },
  HARD:         { bg: '#e0e0e0', label: '#111' },
  INTERMEDIATE: { bg: '#39b54a', label: '#fff' },
  WET:          { bg: '#0067ff', label: '#fff' },
  UNKNOWN:      { bg: 'repeating-linear-gradient(45deg,#444 0px,#444 4px,#2a2a2a 4px,#2a2a2a 8px)', label: 'rgba(255,255,255,0.55)' },
}

export default function CompoundLegend() {
  return (
    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
      {Object.entries(COMPOUND_COLOR).map(([key, { bg }]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <div style={{ width: 22, height: 14, borderRadius: 3, background: bg, border: '1px solid rgba(255,255,255,0.12)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            {key === 'UNKNOWN' ? '? Not recorded' : key.charAt(0) + key.slice(1).toLowerCase()}
          </span>
        </div>
      ))}
    </div>
  )
}
