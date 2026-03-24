import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function StatBar({ label, drivers }) {
  const max = Math.max(...drivers.map(d => d.value || 0), 1)
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
        {label}
      </div>
      {drivers.map(d => (
        <div key={d.driverId} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
          <div style={{ width: 52, flexShrink: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: d.color, textAlign: 'right', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.name.split(' ').slice(-1)[0]}
          </div>
          <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((d.value || 0) / max) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ height: '100%', background: d.color, borderRadius: 4 }}
            />
          </div>
          <div style={{ width: 36, flexShrink: 0, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
            {d.value ?? '—'}
          </div>
        </div>
      ))}
    </div>
  )
}

const STATS = [
  { key: 'races',   label: 'Races'   },
  { key: 'wins',    label: 'Wins'    },
  { key: 'podiums', label: 'Podiums' },
  { key: 'seasons', label: 'Seasons' },
]

export default function ComparisonPanel({ drivers }) {
  const ready = drivers.filter(d => d.data?.stats)

  const commonTeammates = useMemo(() => {
    if (ready.length < 2) return []
    const sets = ready.map(d => new Set(d.data.teammates.map(t => t.driverId)))
    const [, ...rest] = sets
    return ready[0].data.teammates.filter(tm => rest.every(s => s.has(tm.driverId)))
  }, [ready])

  const commonTeams = useMemo(() => {
    if (ready.length < 2) return []
    const [dA, dB] = ready
    return dA.data.teams.filter(teamA => {
      const teamB = dB.data.teams.find(t => t.constructorId === teamA.constructorId)
      if (!teamB) return false
      const seasonsA = new Set(teamA.seasons)
      return teamB.seasons.some(s => seasonsA.has(s))
    })
  }, [ready])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Stats comparison */}
      <div className="card" style={{ padding: '1rem 1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {ready.length >= 2 ? 'Stats Comparison' : 'Career Stats'}
          </span>
          <AnimatePresence>
            {ready.length >= 2 && (
              <motion.span
                key={commonTeams.length > 0 ? 'teammate' : 'cross-era'}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                style={{
                  fontSize: '0.52rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: commonTeams.length > 0 ? '#27F4D2' : '#a855f7',
                  border: `1px solid ${commonTeams.length > 0 ? 'rgba(39,244,210,0.3)' : 'rgba(168,85,247,0.3)'}`,
                  borderRadius: 4,
                  padding: '0.15rem 0.45rem',
                }}
              >
                {commonTeams.length > 0 ? 'Direct Teammate Comparison' : 'Cross-Era Legacy Analysis'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {ready.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Loading driver data…</p>
        ) : (
          STATS.map(({ key, label }) => (
            <StatBar
              key={key}
              label={label}
              drivers={ready.map(d => ({ driverId: d.driverId, name: d.name, color: d.color, value: d.data.stats[key] }))}
            />
          ))
        )}
      </div>

      {/* Common teammates */}
      {ready.length >= 2 && (
        <div className="card" style={{ padding: '1rem 1.1rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            Common Teammates
          </div>
          {commonTeammates.length === 0 ? (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
              Historical Mapping: No direct teammate overlap found between these two career networks.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {commonTeammates.slice(0, 8).map((tm, i) => (
                <div key={tm.driverId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', borderBottom: i < Math.min(commonTeammates.length, 8) - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>{tm.name}</span>
                </div>
              ))}
              {commonTeammates.length > 8 && (
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0.3rem 0 0', textAlign: 'right' }}>
                  +{commonTeammates.length - 8} more
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Common teams */}
      {ready.length >= 2 && commonTeams.length > 0 && (
        <div className="card" style={{ padding: '1rem 1.1rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            Same Team
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {commonTeams.map(team => (
              <div key={team.constructorId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{team.name}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {team.seasons[team.seasons.length - 1]}–{team.seasons[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint when only 1 driver */}
      {ready.length === 1 && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Add a second driver to compare stats and find shared teammates
          </p>
        </div>
      )}
    </div>
  )
}
