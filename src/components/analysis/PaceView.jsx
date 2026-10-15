import { useState, useEffect, useMemo } from 'react'
import Rise from '../layout/Rise'
import EmptyState from '../ui/EmptyState'
import VizSkeleton from '../viz/VizSkeleton'
import { buttonVariants } from '../ui/button-variants'
import TelemetrySection, { Legend, LineSwatch, BlockSwatch } from '../telemetry/TelemetrySection'
import PaceDriverSelector from '../pace/PaceDriverSelector'
import PaceDriverStats from '../pace/PaceDriverStats'
import PaceChart from '../pace/PaceChart'
import PositionChart from './PositionChart'
import { buildPace, defaultPaceDrivers, toggleDriver, MAX_PACE_DRIVERS } from '../pace/paceModel'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { telemetryApi } from '../../services/api'
import { cn } from '@/lib/utils'

const retryBtn = (onClick) => (
  <button type="button" onClick={onClick} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')}>Try again</button>
)

/**
 * Pace view of Race analysis: lap times for up to five drivers, then the position-by-lap chart for the whole field.
 * Driver list, selection and pace data are local to the race; changing the race starts again from the first three drivers.
 */
export default function PaceView({ raceId }) {
  const { isMobile } = useBreakpoint()
  const [drivers, setDrivers] = useState({ raceId: '', status: 'loading', list: [] })
  const [selection, setSelection] = useState({ raceId: '', ids: [] })
  const [pace, setPace] = useState({ key: '', status: 'loading', data: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    telemetryApi.getRaceDrivers(raceId)
      .then(list => {
        if (!alive) return
        const clean = Array.isArray(list) ? list : []
        setDrivers({ raceId, attempt, status: clean.length ? 'ready' : 'empty', list: clean })
        setSelection({ raceId, ids: defaultPaceDrivers(clean) })
      })
      .catch(() => { if (alive) setDrivers({ raceId, attempt, status: 'error', list: [] }) })
    return () => { alive = false }
  }, [raceId, attempt])

  const driversNow = drivers.raceId === raceId && drivers.attempt === attempt ? drivers : null
  const ids = selection.raceId === raceId ? selection.ids : []
  const key = `${raceId}|${ids.join(',')}`

  useEffect(() => {
    if (!ids.length) return undefined
    let alive = true
    telemetryApi.getRacePace(raceId, ids)
      .then(data => { if (alive) setPace({ key, status: 'ready', data: Array.isArray(data) ? data : [] }) })
      .catch(() => { if (alive) setPace({ key, status: 'error', data: [] }) })
    return () => { alive = false }
  // key already encodes raceId and ids
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  const paceNow = pace.key === key ? pace : null
  const model = useMemo(() => buildPace(paceNow?.data ?? [], driversNow?.list ?? []), [paceNow, driversNow])

  if (!driversNow) return <div aria-busy="true" className="flex flex-col gap-pw-6"><VizSkeleton variant="rows" name="drivers" count={3} /><VizSkeleton variant="hero" name="lap times" /></div>
  if (driversNow.status === 'error') {
    return <EmptyState type="error" height={160} message="We couldn't load the drivers for this race" action={retryBtn(() => setAttempt(a => a + 1))} />
  }
  if (driversNow.status === 'empty') return <EmptyState type="empty" height={120} message="No lap data was recorded for this race" />

  const legend = [
    { key: 'pit', swatch: <LineSwatch color="var(--viz-now)" dashed />, label: 'Pit lap' },
    ...(model.scPeriods.length ? [{ key: 'sc', swatch: <BlockSwatch color="var(--viz-flash-neutral)" />, label: 'Safety car' }] : []),
  ]
  const loadingPace = ids.length > 0 && !paceNow

  return (
    <div className="flex flex-col gap-pw-7">
      <TelemetrySection
        id="pace-drivers-h" title="Drivers"
        caption={`Pick up to ${MAX_PACE_DRIVERS}. The first three are selected. ${ids.length} selected.`}
      >
        <PaceDriverSelector
          allDrivers={driversNow.list} selectedDrivers={ids}
          onToggle={(id) => setSelection({ raceId, ids: toggleDriver(ids, id) })}
        />
      </TelemetrySection>

      <Rise index={0} className="flex flex-col gap-pw-7">
        {loadingPace && <VizSkeleton variant="rows" name="lap times" count={4} />}
        {paceNow?.status === 'error' && (
          <EmptyState type="error" height={160} message="We couldn't load the lap times" action={retryBtn(() => setAttempt(a => a + 1))} />
        )}
        {!ids.length && <EmptyState type="empty" height={120} message="Pick a driver to see lap times" />}
        {paceNow?.status === 'ready' && (model.chartData.length === 0
          ? <EmptyState type="empty" height={120} message="No lap times for these drivers" />
          : (
            <>
              <PaceDriverStats driverMeta={model.driverMeta} />
              <TelemetrySection
                id="pace-laps-h" title="Lap times"
                caption="Fastest at the top. Pit laps, the lap after and unusually slow laps are left out of the lines."
                aside={<Legend items={legend} />}
              >
                <PaceChart
                  chartData={model.chartData} driverMeta={model.driverMeta} pitLines={model.pitLines} scPeriods={model.scPeriods}
                  isMobile={isMobile} animationId={key}
                />
              </TelemetrySection>
            </>
          ))}
      </Rise>

      <TelemetrySection id="pace-positions-h" title="Position by lap" caption="The whole field, lap by lap. Dashed lines are the second driver of a team.">
        <PositionChart raceId={raceId} allDrivers={driversNow.list} isMobile={isMobile} />
      </TelemetrySection>
    </div>
  )
}
