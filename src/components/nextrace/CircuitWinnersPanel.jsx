import { motion } from 'framer-motion'
import Panel from '../ui/Panel'
import { ctorColor } from '../../utils/teamColors'

function topWinners(races, n = 6) {
  const wins = {}, names = {}, ctors = {}
  for (const r of races) {
    const w = r.Results?.find(res => res.position === '1')
    if (w?.Driver?.driverId) {
      const id = w.Driver.driverId
      wins[id]  = (wins[id]  || 0) + 1
      names[id] = `${w.Driver.givenName} ${w.Driver.familyName}`
      ctors[id] = w.Constructor?.constructorId
    }
  }
  return Object.entries(wins)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, count]) => ({ driverId: id, name: names[id], wins: count, ctor: ctors[id] }))
}

export default function CircuitWinnersPanel({ history }) {
  const races = history?.races || []
  if (!races.length) return null
  const winners = topWinners(races)
  if (!winners.length) return null
  const maxWins = winners[0].wins

  return (
    <Panel padding="none" style={{ padding: '1rem 1.25rem', flex: 1, boxSizing: 'border-box' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        All-time winners
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {winners.map((w, i) => (
          <div key={w.driverId} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.75rem', fontWeight: 700,
              color: i === 0 ? '#e10600' : 'rgba(255,255,255,0.22)',
              width: 14, textAlign: 'right', flexShrink: 0,
            }}>{i + 1}</span>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(w.wins / maxWins) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                style={{ height: '100%', borderRadius: 2, background: i === 0 ? ctorColor(w.ctor) : 'rgba(255,255,255,0.28)' }}
              />
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: i === 0 ? 700 : 400, color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', minWidth: 130 }}>
              {w.name}
            </div>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.85rem', fontWeight: 700, color: i === 0 ? '#e10600' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
              {w.wins}×
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
