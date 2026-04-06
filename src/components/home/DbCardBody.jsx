import SeasonCard from './SeasonCard'
import DriverSpotlightCard from './DriverSpotlightCard'
import TitleFightCard from './TitleFightCard'
import ConstructorSpotlightCard from './ConstructorSpotlightCard'

export default function DbCardBody({ db, data, isNarrow = false }) {
  if (!data) {
    return (
      <div style={{ height: 72, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading…</div>
      </div>
    )
  }

  if (db === 'mongo')     return <SeasonCard data={data} />
  if (db === 'cassandra') return <DriverSpotlightCard data={data} isNarrow={isNarrow} />
  if (db === 'dgraph')    return <TitleFightCard data={data} />
  if (db === 'team')      return <ConstructorSpotlightCard data={data} isNarrow={isNarrow} />

  return null
}
