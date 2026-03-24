import StatCard from '../ui/StatCard'
import { ctorColor } from '../../utils/teamColors'

export default function RaceStatCards({ results, qualifyingResults, isMobile }) {
  const winner     = results.find(r => r.position === '1') || results[0]
  const pole       = qualifyingResults[0] ?? results.find(r => r.grid === '1')
  const fastestLap = results.find(r => r.FastestLap?.rank != null && String(r.FastestLap.rank) === '1')
  const dnfCount   = results.filter(r => r.status !== 'Finished' && !r.status?.startsWith('+')).length
  const totalLaps  = winner?.laps ? `${winner.laps} laps` : null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: '0.75rem',
      marginBottom: '1.25rem',
    }}>
      <StatCard
        label="Winner"
        value={winner ? `${winner.Driver.givenName} ${winner.Driver.familyName}` : '—'}
        sub={winner?.Constructor?.name}
        accent={winner ? ctorColor(winner.Constructor?.constructorId) : undefined}
      />
      <StatCard
        label="Pole Position"
        value={pole ? `${pole.Driver.givenName} ${pole.Driver.familyName}` : '—'}
        sub={pole?.Constructor?.name}
        accent={pole ? ctorColor(pole.Constructor?.constructorId) : undefined}
      />
      <StatCard
        label="Fastest Lap"
        value={fastestLap ? `${fastestLap.Driver.givenName} ${fastestLap.Driver.familyName}` : '—'}
        sub={fastestLap?.FastestLap?.Time?.time}
      />
      <StatCard
        label={dnfCount > 0 ? 'DNFs' : 'Race Laps'}
        value={dnfCount > 0 ? String(dnfCount) : (totalLaps || '—')}
        sub={dnfCount > 0 ? (totalLaps || `${results.length} classified`) : `${results.length} classified`}
      />
    </div>
  )
}
