import StatCard from '../ui/StatCard'
import { ctorColor } from '../../utils/teamColors'

export default function RaceStatCards({ results, qualifyingResults, raceSnapshot, isMobile }) {
  const winner     = results.find(r => r.position === '1') || results[0]
  const pole       = qualifyingResults[0] ?? results.find(r => r.grid === '1')
  const fastestLap = results.find(r => r.FastestLap?.rank != null && String(r.FastestLap.rank) === '1')
  const dnfCount   = results.filter(r => r.status !== 'Finished' && !r.status?.startsWith('+')).length
  const totalLaps  = winner?.laps ? `${winner.laps} laps` : null

  // Fallback to live timing snapshot when Jolpica results aren't published yet
  const snapWinner = !winner && raceSnapshot?.classification?.[0]
  const snapLaps   = !winner && raceSnapshot?.totalLaps ? `${raceSnapshot.totalLaps} laps` : null

  const winnerValue = winner
    ? `${winner.Driver.givenName} ${winner.Driver.familyName}`
    : snapWinner ? (snapWinner.fullName || snapWinner.acronym) : '—'
  const winnerSub   = winner?.Constructor?.name || snapWinner?.teamName
  const winnerColor = winner
    ? ctorColor(winner.Constructor?.constructorId)
    : snapWinner?.teamColor ? `#${snapWinner.teamColor}` : undefined

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: '0.75rem',
      marginBottom: '1.25rem',
    }}>
      <StatCard
        label="Winner"
        value={winnerValue}
        sub={winnerValue !== '—' ? (winnerSub || (snapWinner ? 'Live Timing' : undefined)) : undefined}
        accent={winnerColor}
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
        value={dnfCount > 0 ? String(dnfCount) : (totalLaps || snapLaps || '—')}
        sub={dnfCount > 0 ? (totalLaps || `${results.length} classified`) : (results.length ? `${results.length} classified` : (snapWinner ? 'Live Timing' : undefined))}
      />
    </div>
  )
}
