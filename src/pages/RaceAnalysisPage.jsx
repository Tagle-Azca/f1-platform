import { Suspense, lazy, useEffect, useMemo, useRef } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'
import DbOfflineBanner from '../components/ui/DbOfflineBanner'
import EmptyState from '../components/ui/EmptyState'
import Select from '../components/ui/Select'
import SegmentedControl from '../components/ui/SegmentedControl'
import VizSkeleton from '../components/viz/VizSkeleton'
import { buttonVariants } from '../components/ui/button-variants'
import { HISTORICAL_YEARS } from '../components/telemetry/telemetryConstants'
import { useAnalysisParams, pastRacesOf, seasonsOf, isHistoricalSeason } from '../hooks/useAnalysisParams'
import { cn } from '@/lib/utils'

const PaceView = lazy(() => import('../components/analysis/PaceView'))
const TyresView = lazy(() => import('../components/analysis/TyresView'))
const TelemetryView = lazy(() => import('../components/analysis/TelemetryView'))

const VIEW_OPTIONS = [
  { value: 'pace', label: 'Pace' },
  { value: 'tyres', label: 'Tyres' },
  { value: 'telemetry', label: 'Telemetry' },
]
const VIEW_NOUN = { pace: 'pace', tyres: 'tyre strategy', telemetry: 'telemetry' }
const SOLID = (cls) => cn(buttonVariants(), 'min-h-11', cls)

const raceLabel = (r) => (r.round ? `R${r.round} ${r.raceName}` : r.raceName)

function ViewFallback() {
  return (
    <div aria-busy="true" className="min-h-80">
      <VizSkeleton variant="hero" name="analysis" />
    </div>
  )
}

/** Race analysis: one season and race picker for the Pace, Tyres and Telemetry views. URL: ?view=&race=&season= */
export default function RaceAnalysisPage() {
  const a = useAnalysisParams()
  const { view, season, raceId, cass, races, dirty } = a
  const telemetryMemo = useRef({}) // driver selection kept while another view is open

  useEffect(() => { document.title = 'Race analysis · Pitwall' }, [])
  // A corrected URL value is replaced, never pushed
  useEffect(() => { if (dirty) a.normalise() }, [dirty]) // eslint-disable-line react-hooks/exhaustive-deps

  const loading = cass.status === 'loading'
  const historical = isHistoricalSeason(season)
  const race = useMemo(() => races.find(r => r.raceId === raceId) ?? null, [races, raceId])
  const raceOptions = useMemo(() => (historical || !season ? [] : pastRacesOf(races, season).map(r => ({ value: r.raceId, label: raceLabel(r) }))), [races, season, historical])
  const seasonOptions = useMemo(() => {
    const years = [...new Set([...seasonsOf(races), ...HISTORICAL_YEARS])]
    return years.map(y => ({ value: y, label: y }))
  }, [races])

  const listFailed = cass.status === 'error' && !(view === 'telemetry' && historical)
  const seasonEntered = season !== ''
  const latest = seasonsOf(races)[0] ?? null

  const goTelemetry = () => a.setView('telemetry')
  const message = loading ? 'Loading races'
    : race ? `${VIEW_NOUN[view][0].toUpperCase()}${VIEW_NOUN[view].slice(1)} for ${race.raceName}, ${season}`
      : historical ? `Season ${season}` : ''

  let body
  if (loading) {
    body = <ViewFallback />
  } else if (listFailed) {
    body = (
      <EmptyState
        type="error" height={200} message="We couldn't load the race list"
        action={<button type="button" onClick={cass.retry} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')}>Try again</button>}
      />
    )
  } else if (historical && view !== 'telemetry') {
    body = (
      <EmptyState
        type="empty" height={220} message="Lap data starts in 2023"
        action={(
          <>
            <p className="text-sm text-ink-2">Pick a 2023 or later race to see {VIEW_NOUN[view]}.</p>
            <div className="flex flex-wrap justify-center gap-pw-3">
              {latest && <button type="button" onClick={a.goLatest} className={SOLID()}>Go to latest race</button>}
              <button type="button" onClick={goTelemetry} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')}>Open season view</button>
            </div>
          </>
        )}
      />
    )
  } else if (!historical && !race) {
    body = (
      <EmptyState
        type="empty" height={200} message={seasonEntered ? `No races with lap data in ${season}` : 'No races with lap data yet'}
        action={latest && latest !== season ? <button type="button" onClick={a.goLatest} className={SOLID()}>Go to latest race</button> : undefined}
      />
    )
  } else {
    body = (
      <Suspense fallback={<ViewFallback />}>
        {view === 'pace' && <PaceView key={raceId} raceId={raceId} />}
        {view === 'tyres' && <TyresView key={raceId} raceId={raceId} race={race} season={season} />}
        {view === 'telemetry' && <TelemetryView season={season} raceId={raceId} cassRaces={races} dbOffline={cass.dbOffline} memo={telemetryMemo} />}
      </Suspense>
    )
  }

  return (
    <PageWrapper stagger>
      <Rise index={0} as="header" className="mb-pw-5">
        <div className="flex flex-col gap-pw-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-title text-ink">Race analysis</h1>
            <p className="mt-pw-1 text-sm text-ink-2">Pick one race, then switch between pace, tyres and telemetry.</p>
          </div>
          <span className="inline-flex min-h-6 items-center self-start rounded-pill border border-edge px-pw-3 text-xs text-ink-2 md:self-auto">
            Data from 2023 onwards
          </span>
        </div>
      </Rise>

      {cass.dbOffline && (
        <div className="mb-pw-4">
          <DbOfflineBanner db="cassandra" message={<>Cassandra is not running. Start it and run <code>npm run seed -- --cassandra</code>.</>} />
        </div>
      )}

      <Rise index={1} className="flex flex-wrap items-end gap-x-pw-4 gap-y-pw-4">
        <div className="flex w-full flex-col gap-pw-1 md:w-36">
          <label htmlFor="analysis-season" className="text-xs text-ink-2">Season</label>
          <Select
            id="analysis-season" value={season} onChange={a.setSeason} options={seasonOptions}
            placeholder={loading ? 'Loading races' : 'Season'} disabled={loading || !seasonOptions.length}
          />
        </div>
        <div className="flex w-full flex-col gap-pw-1 md:w-72">
          <label htmlFor="analysis-race" className="text-xs text-ink-2">Race</label>
          <Select
            id="analysis-race" value={raceId} onChange={a.setRace} options={raceOptions}
            placeholder={loading ? 'Loading races' : historical ? 'Season view' : 'Select a race'}
            disabled={loading || !raceOptions.length}
            aria-describedby={historical && view === 'telemetry' ? 'analysis-race-help' : undefined}
          />
        </div>
        <SegmentedControl
          role="tablist" aria-label="Analysis view" options={VIEW_OPTIONS} value={view} onChange={a.setView}
          controls="analysis-panel" idPrefix="analysis-tab" fill className="min-w-0 max-sm:w-full sm:w-80"
        />
      </Rise>
      {historical && view === 'telemetry' && (
        <p id="analysis-race-help" className="mt-pw-2 text-xs text-ink-3">Lap-level comparison starts in 2023. Showing the season view.</p>
      )}

      <p role="status" aria-live="polite" className="sr-only">{message}</p>

      <div id="analysis-panel" role="tabpanel" aria-labelledby={`analysis-tab-${view}`} tabIndex={-1} aria-busy={loading || undefined} className="mt-pw-6 outline-none">
        {body}
      </div>
    </PageWrapper>
  )
}
