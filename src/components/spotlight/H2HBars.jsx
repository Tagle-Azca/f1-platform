export default function H2HBars({ rows, mateSurname, teamColor }) {
  if (!rows.length || !mateSurname) return null

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
        H2H vs {mateSurname}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {rows.map(({ label, mine, theirs }) => {
          const total = mine + theirs
          const pct   = total > 0 ? Math.round((mine / total) * 100) : 50
          const ahead = mine >= theirs

          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', width: 34, flexShrink: 0 }}>
                {label}
              </span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: ahead ? teamColor : 'rgba(255,255,255,0.18)',
                  transition: 'width 0.7s ease',
                }} />
                <div style={{
                  height: '100%', flex: 1,
                  background: ahead ? 'rgba(255,255,255,0.1)' : 'rgba(225,6,0,0.5)',
                }} />
              </div>
              <span style={{
                fontSize: '0.75rem', fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                color: ahead ? 'var(--accent-color)' : 'var(--text-muted)',
                flexShrink: 0, minWidth: 32, textAlign: 'right',
                transition: 'color 0.4s',
              }}>
                {mine}–{theirs}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
