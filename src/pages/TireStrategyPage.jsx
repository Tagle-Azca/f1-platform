import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import PageHeader from '../components/layout/PageHeader'
import ControlGroup from '../components/ui/ControlGroup'
import DbOfflineBanner from '../components/ui/DbOfflineBanner'
import AccentBanner from '../components/ui/AccentBanner'
import { telemetryApi } from '../services/api'
import CompoundLegend from '../components/tires/CompoundLegend'
import StrategyChart from '../components/tires/StrategyChart'

export default function TireStrategyPage() {
  const [races,    setRaces]    = useState([])
  const [year,     setYear]     = useState('')
  const [raceId,   setRaceId]   = useState('')
  const [strategy, setStrategy] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [dbOffline,setDbOffline]= useState(false)

  useEffect(() => {
    telemetryApi.getAvailableRaces()
      .then(data => {
        setRaces(data)
        const years = [...new Set(data.map(r => r.raceId.split('_')[0]))].sort((a,b) => b-a)
        if (years.length) {
          setYear(years[0])
          const first = data.filter(r => r.raceId.startsWith(years[0]))[0]
          if (first) setRaceId(first.raceId)
        }
      })
      .catch(e => { if (e.message?.includes('503')) setDbOffline(true) })
  }, [])

  function handleYearChange(y) {
    setYear(y)
    const first = races.filter(r => r.raceId.startsWith(y + '_'))[0]
    if (first) setRaceId(first.raceId)
  }

  const years      = [...new Set(races.map(r => r.raceId.split('_')[0]))].sort((a,b) => b-a)
  const racesOfYear = races.filter(r => r.raceId.startsWith(year + '_'))

  useEffect(() => {
    if (!raceId) return
    setLoading(true)
    setStrategy([])
    telemetryApi.getTireStrategy(raceId)
      .then(setStrategy)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [raceId])

  const totalLaps = strategy.length
    ? Math.max(...strategy.flatMap(d => d.stints.map(s => s.lapEnd)))
    : 0

  return (
    <PageWrapper>
      <PageHeader
        title="Tire Strategy"
        subtitle="Compound stints per driver · full race at a glance"
        badge="cassandra"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <ControlGroup label="Season" width={90}>
              <select className="input" style={{ width: 90 }} value={year} onChange={e => handleYearChange(e.target.value)}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </ControlGroup>
            <ControlGroup label="Race" width={200}>
              <select className="input" style={{ width: 200 }} value={raceId} onChange={e => setRaceId(e.target.value)}>
                {racesOfYear.map(r => <option key={r.raceId} value={r.raceId}>{r.raceName}</option>)}
              </select>
            </ControlGroup>
          </div>
        }
      />

      <AccentBanner color="var(--cassandra-color)" padding="sm" radius={8}
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}
      >
        <span style={{ color: 'var(--cassandra-color)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.06em' }}>DATA AVAILABILITY</span>
        Tire strategy data is available from the 2023 season onward via OpenF1.
      </AccentBanner>

      {dbOffline && (
        <div style={{ marginBottom: '1rem' }}>
          <DbOfflineBanner db="cassandra" message={<>Database not running. Start Cassandra and run <code style={{ color: 'var(--cassandra-color)' }}>npm run seed -- --cassandra</code></>} />
        </div>
      )}

      <CompoundLegend />

      <StrategyChart
        strategy={strategy}
        totalLaps={totalLaps}
        loading={loading}
        dbOffline={dbOffline}
      />
    </PageWrapper>
  )
}
