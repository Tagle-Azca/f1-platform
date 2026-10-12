import { useState, useEffect, useMemo } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'
import DbOfflineBanner from '../components/ui/DbOfflineBanner'
import Select from '../components/ui/Select'
import VizSkeleton from '../components/viz/VizSkeleton'
import TelemetrySection from '../components/telemetry/TelemetrySection'
import CompoundLegend from '../components/tires/CompoundLegend'
import StrategyChart from '../components/tires/StrategyChart'
import StrategySummary from '../components/tires/StrategySummary'
import { buildRows, cleanPeriods } from '../components/tires/strategyModel'
import { useCassandraRaces } from '../hooks/useCassandraRaces'
import { telemetryApi, racesApi } from '../services/api'

const isPastRace = (r) => r.isLive || !r.date || new Date(r.date) <= new Date()

export default function TireStrategyPage() {
  const [year,   setYear]   = useState('')
  const [raceId, setRaceId] = useState('')
  // Result for one race: { raceId, strategy, positions, periods } or { raceId, failed: true }.
  // Loading is derived: the selected race has no result yet.
  const [data, setData] = useState(null)

  const { cassRaces, dbOffline } = useCassandraRaces((years, lastRaceId) => {
    if (years.length) { setYear(years[0]); setRaceId(lastRaceId) }
  })

  const years       = [...new Set(cassRaces.map(r => r.raceId.split('_')[0]))].sort((a, b) => b - a)
  const racesOfYear = cassRaces.filter(r => r.raceId.startsWith(year + '_') && isPastRace(r))
  const race        = cassRaces.find(r => r.raceId === raceId)

  function handleYearChange(y) {
    setYear(y)
    const past = cassRaces.filter(r => r.raceId.startsWith(y + '_') && isPastRace(r))
    setRaceId(past[past.length - 1]?.raceId ?? '')
  }

  useEffect(() => {
    if (!raceId) return
    let cancelled = false
    const meta = cassRaces.find(r => r.raceId === raceId)
    const season = raceId.split('_')[0]
    Promise.all([
      telemetryApi.getTireStrategy(raceId),
      telemetryApi.getRacePositions(raceId).catch(() => null),
      telemetryApi.getSafetyCar(raceId).catch(() => []),
      // Official classification (sprints have no round in the race list)
      meta?.round ? racesApi.getByRound(season, meta.round).catch(() => null) : Promise.resolve(null),
    ])
      .then(([strategy, positions, periods, result]) => { if (!cancelled) setData({ raceId, strategy, positions, periods, result }) })
      .catch(() => { if (!cancelled) setData({ raceId, failed: true }) })
    return () => { cancelled = true }
  // cassRaces only fills once; the round lookup needs it, the fetch must not re-run on it
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceId])

  const current = data?.raceId === raceId ? data : null
  const loading = Boolean(raceId) && !current
  const failed  = Boolean(current?.failed)

  const model = useMemo(() => {
    if (!current || current.failed) return null
    const { rows, totalLaps } = buildRows(current.strategy, current.positions, current.result)
    if (!rows.length || !totalLaps) return { rows: [], totalLaps: 0, periods: [], compounds: [] }
    const periods = cleanPeriods(current.periods, totalLaps)
    const compounds = [...new Set(rows.flatMap(r => r.stints.map(s => s.compound)))]
    return { rows, totalLaps, periods, compounds }
  }, [current])

  return (
    <PageWrapper stagger>
      <header className="mb-pw-5">
        <div className="flex flex-col gap-pw-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-title text-ink">Tire strategy</h1>
            <p className="mt-pw-1 text-sm text-ink-2">Every driver&rsquo;s stints in one race, in finishing order.</p>
          </div>
          <span className="inline-flex min-h-6 items-center self-start rounded-pill border border-edge px-pw-3 text-xs font-medium text-ink-2 md:self-auto">
            Data from 2023 onwards
          </span>
        </div>
      </header>

      {dbOffline && (
        <div className="mb-pw-4">
          <DbOfflineBanner db="cassandra" message={<>Cassandra is not running. Start it and run <code>npm run seed -- --cassandra</code>.</>} />
        </div>
      )}

      <Rise index={0} className="grid grid-cols-1 gap-pw-3 md:flex md:items-end">
        <div className="flex flex-col gap-pw-1 md:w-28">
          <label htmlFor="ts-season" className="text-xs text-ink-2">Season</label>
          <Select id="ts-season" value={year} onChange={handleYearChange} options={years.map(y => ({ value: y, label: y }))} disabled={!years.length} />
        </div>
        <div className="flex flex-col gap-pw-1 md:w-72">
          <label htmlFor="ts-race" className="text-xs text-ink-2">Race</label>
          <Select
            id="ts-race" value={raceId} onChange={setRaceId} placeholder="Select a race" disabled={!racesOfYear.length}
            options={racesOfYear.map(r => ({ value: r.raceId, label: r.raceName }))}
          />
        </div>
      </Rise>

      <div className="mt-pw-6">
        {loading ? (
          <div className="flex flex-col gap-pw-6">
            <VizSkeleton variant="hero" name="strategy summary" />
            <VizSkeleton variant="rows" name="tyre stints" count={10} />
          </div>
        ) : failed ? (
          <p className="rounded-md border border-edge px-pw-4 py-pw-4 text-sm text-ink-2">Strategy data for this race could not be loaded. Try again in a moment.</p>
        ) : model && model.rows.length ? (
          <div className="flex flex-col gap-pw-7">
            <Rise index={1}>
              <StrategySummary raceName={race?.raceName} season={year} rows={model.rows} />
            </Rise>
            <Rise index={2}>
              <TelemetrySection
                id="stints-h"
                title="Stints"
                caption={`${model.rows.length} drivers, ${model.totalLaps} laps. Each bar is one set of tyres; the number is laps on that set. Hover a stint for details.`}
                aside={<CompoundLegend compounds={model.compounds} periods={model.periods} />}
              >
                <StrategyChart rows={model.rows} totalLaps={model.totalLaps} periods={model.periods} />
              </TelemetrySection>
            </Rise>
          </div>
        ) : !dbOffline && (
          <p className="rounded-md border border-edge px-pw-4 py-pw-4 text-sm text-ink-2">
            {raceId ? 'No tyre data was recorded for this race.' : 'Loading the race list.'}
          </p>
        )}
      </div>
    </PageWrapper>
  )
}
