import SeasonCard from './SeasonCard'
import DriverSpotlightCard from './DriverSpotlightCard'
import TitleFightCard from './TitleFightCard'

export default function DbCardBody({ db, data }) {
  if (!data) {
    return (
      <div style={{ height: 72, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading…</div>
      </div>
    )
  }

  if (db === 'mongo')     return <SeasonCard data={data} />
  if (db === 'cassandra') return <DriverSpotlightCard data={data} />
  if (db === 'dgraph')    return <TitleFightCard data={data} />

  return null
}
