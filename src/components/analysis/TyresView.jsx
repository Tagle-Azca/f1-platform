import { useState, useEffect, useMemo } from 'react'
import Rise from '../layout/Rise'
import VizSkeleton from '../viz/VizSkeleton'
import EmptyState from '../ui/EmptyState'
import TelemetrySection from '../telemetry/TelemetrySection'
import CompoundLegend from '../tires/CompoundLegend'
import StrategyChart from '../tires/StrategyChart'
import StrategySummary from '../tires/StrategySummary'
import { buildRows, cleanPeriods } from '../tires/strategyModel'
import { buttonVariants } from '../ui/button-variants'
import { cn } from '@/lib/utils'
import { telemetryApi, racesApi } from '../../services/api'

/**
 * Tyres view of Race analysis: every driver's stints in finishing order. Loading is derived (no result yet for the race).
 * `race` is the race-list entry (its round finds the official classification; sprints have none).
 */
export default function TyresView({ raceId, race, season }) {
  // { raceId, strategy, positions, periods, result } or { raceId, failed: true }
  const [data, setData] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const round = race?.round

  useEffect(() => {
    if (!raceId) return undefined
    let cancelled = false
    const year = raceId.split('_')[0]
    Promise.all([
      telemetryApi.getTireStrategy(raceId),
      telemetryApi.getRacePositions(raceId).catch(() => null),
      telemetryApi.getSafetyCar(raceId).catch(() => []),
      round ? racesApi.getByRound(year, round).catch(() => null) : Promise.resolve(null),
    ])
      .then(([strategy, positions, periods, result]) => { if (!cancelled) setData({ raceId, attempt, strategy, positions, periods, result }) })
      .catch(() => { if (!cancelled) setData({ raceId, attempt, failed: true }) })
    return () => { cancelled = true }
  }, [raceId, round, attempt])

  const current = data?.raceId === raceId && data?.attempt === attempt ? data : null
  const loading = Boolean(raceId) && !current
  const failed = Boolean(current?.failed)

  const model = useMemo(() => {
    if (!current || current.failed) return null
    const { rows, totalLaps } = buildRows(current.strategy, current.positions, current.result)
    if (!rows.length || !totalLaps) return { rows: [], totalLaps: 0, periods: [], compounds: [] }
    const periods = cleanPeriods(current.periods, totalLaps)
    const compounds = [...new Set(rows.flatMap(r => r.stints.map(s => s.compound)))]
    return { rows, totalLaps, periods, compounds }
  }, [current])

  if (loading) {
    return (
      <div className="flex flex-col gap-pw-6" aria-busy="true">
        <VizSkeleton variant="hero" name="strategy summary" />
        <VizSkeleton variant="rows" name="tyre stints" count={10} />
      </div>
    )
  }
  if (failed) {
    return (
      <EmptyState
        type="error" height={160} message="We couldn't load the tyre strategy for this race"
        action={<button type="button" onClick={() => { setData(null); setAttempt(a => a + 1) }} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')}>Try again</button>}
      />
    )
  }
  if (!model || !model.rows.length) {
    return <EmptyState type="empty" height={120} message={raceId ? 'No tyre data was recorded for this race.' : 'No race selected.'} />
  }
  return (
    <div className="flex flex-col gap-pw-7">
      <Rise index={0}>
        <StrategySummary raceName={race?.raceName} season={season} rows={model.rows} />
      </Rise>
      <Rise index={1}>
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
  )
}
