import { motion } from 'framer-motion'

export default function DriverCard({ driver, onRemove, onAddTeammate, existingIds }) {
  const { color, name, data, loading } = driver

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      className="card"
      style={{
        borderTop: `3px solid ${color}`,
        background: `linear-gradient(160deg, ${color}0d, transparent 60%)`,
        minWidth: 0, width: '100%', maxWidth: 420, flex: '1 1 260px',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Card header */}
      <div style={{ padding: '0.85rem 1rem 0.7rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '1.1rem', fontWeight: 900, color,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {name}
          </div>
          <button
            onClick={onRemove}
            style={{
              background: 'var(--surface-3)', border: '1px solid var(--border-color)',
              borderRadius: 6, padding: '0.2rem 0.5rem', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.72rem', lineHeight: 1, flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {loading && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Loading...</p>
        )}

        {data?.stats && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Races',   value: data.stats.races   },
              { label: 'Wins',    value: data.stats.wins    },
              { label: 'Podiums', value: data.stats.podiums },
              { label: 'Seasons', value: data.stats.seasons },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teams + teammates */}
      {data && (
        <div style={{ padding: '0.7rem 1rem 0.85rem', flex: 1, overflowY: 'auto', maxHeight: 420 }}>
          {data.teams.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No team data found</p>
          )}
          {data.teams.map(team => {
            const teamTms = data.teammates.filter(tm => tm.teams.includes(team.name))
            const seasonRange = team.seasons.length > 1
              ? `${team.seasons[0]}–${team.seasons[team.seasons.length - 1]}`
              : team.seasons[0]

            return (
              <div key={team.constructorId} style={{ marginBottom: '0.9rem' }}>
                <div style={{
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color, marginBottom: '0.3rem',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                  <span>{team.name}</span>
                  <span style={{ opacity: 0.55, fontWeight: 400 }}>{seasonRange}</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {teamTms.length === 0 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No teammate data</span>
                  )}
                  {teamTms.map(tm => {
                    const isAlready = existingIds.includes(tm.driverId)
                    const sharedSeasons = tm.seasons.filter(s => team.seasons.includes(s))
                    const tmRange = sharedSeasons.length > 1
                      ? `${sharedSeasons[0]}–${sharedSeasons[sharedSeasons.length - 1]}`
                      : sharedSeasons[0] || tm.seasons[0]
                    const lastName = tm.name.split(' ').slice(-1)[0]

                    return (
                      <button
                        key={tm.driverId}
                        onClick={() => !isAlready && onAddTeammate(tm)}
                        title={isAlready ? `${tm.name} already shown` : `Add ${tm.name} to view`}
                        style={{
                          padding: '0.22rem 0.55rem', borderRadius: 99,
                          border: `1px solid ${isAlready ? 'var(--border-subtle)' : 'var(--border-strong)'}`,
                          background: isAlready ? 'var(--surface-2)' : 'var(--surface-3)',
                          color: isAlready ? 'var(--text-muted)' : 'var(--text-secondary)',
                          cursor: isAlready ? 'default' : 'pointer',
                          fontSize: '0.72rem', fontWeight: 600,
                          transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                        }}
                        onMouseEnter={e => { if (!isAlready) { e.currentTarget.style.background = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
                        onMouseLeave={e => { if (!isAlready) { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
                      >
                        {lastName}
                        <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{tmRange}</span>
                        {!isAlready && <span style={{ fontSize: '0.6rem', opacity: 0.4 }}>+</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
