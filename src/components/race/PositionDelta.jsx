export function positionDelta(result) {
  const grid   = parseInt(result.grid)
  const finish = parseInt(result.position)
  if (isNaN(grid) || isNaN(finish) || grid === 0) return null
  return grid - finish  // positive = gained, negative = lost
}

export default function Delta({ value }) {
  if (value === null) return <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>—</span>
  if (value === 0)    return <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>·</span>
  const gained = value > 0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 1,
      fontSize: '0.72rem', fontWeight: 700,
      color: gained ? '#22c55e' : '#ef4444',
    }}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 10, height: 10, flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d={gained ? 'm4.5 15.75 7.5-7.5 7.5 7.5' : 'm19.5 8.25-7.5 7.5-7.5-7.5'} />
      </svg>
      {Math.abs(value)}
    </span>
  )
}
