import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'
import EmptyState from '../components/ui/EmptyState'
import DriverDrawer from '../components/ui/DriverDrawer'
import { buttonVariants } from '../components/ui/button-variants'
import NextRaceHero from '../components/nextrace/NextRaceHero'
import WeekendSchedulePanel from '../components/nextrace/WeekendSchedulePanel'
import SectionDisclosure from '../components/nextrace/SectionDisclosure'
import SessionResults from '../components/race/SessionResults'
import RaceStatCards from '../components/race/RaceStatCards'
import WeekendSkeleton from '../components/race/WeekendSkeleton'
import { CircuitFacts, MapAndDna } from '../components/race/WeekendSections'
import { toWeekend, neighbours } from '../components/race/weekendModel'
import { analysisHref } from '../components/analysis/analysisRace'
import { useRaceWeekend, useWeekendWeather, useAnalysisRace } from '../hooks/useRaceWeekend'
import { useCountdown } from '../hooks/useCountdown'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useNow } from '../hooks/useNow'
import { getCircuitSpecs } from '../utils/circuitSpecs'
import { countryFlag } from '../utils/flags'
import { cn } from '@/lib/utils'

const NAV_LINK = cn(buttonVariants({ variant: 'outline' }), 'min-h-11 no-underline')

function dateLabelOf(date) {
  const t = Date.parse(`${date}T00:00:00Z`)
  return Number.isFinite(t) ? new Date(t).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''
}

function RoundLink({ round, name, season, dir }) {
  const prev = dir === 'prev'
  const Icon = prev ? ChevronLeft : ChevronRight
  return (
    <Link to={`/races/${season}/${round}`} aria-label={`${prev ? 'Previous' : 'Next'} round, ${name || `round ${round}`}`} className={NAV_LINK}>
      {prev && <Icon aria-hidden="true" size={16} />}
      <span className="hidden sm:inline">Round&nbsp;</span><span className="num">{round}</span>
      {!prev && <Icon aria-hidden="true" size={16} />}
    </Link>
  )
}

/**
 * One page for every round: a preview before the weekend, live state during it and the results afterwards.
 * URL: /races/:season/:round (optional ?session= picks the results table).
 */
export default function RaceWeekendPage() {
  const { season, round } = useParams()
  // One instance per round: the open driver drawer and any local state never leak into the next weekend
  return <Weekend key={`${season}/${round}`} season={season} round={round} />
}

function Weekend({ season, round }) {
  const now = useNow(60000)
  const wide = useMediaQuery('(min-width: 768px)')
  const w = useRaceWeekend(season, round)
  const [driver, setDriver] = useState(null)

  const weekend = useMemo(() => toWeekend(w.race, w.dashNext, now), [w.race, w.dashNext, now])
  const phase = weekend?.phase
  const { weather, failed: weatherFailed } = useWeekendWeather(w.circuit, weekend?.schedule, Boolean(weekend) && phase !== 'results')
  const analysisRace = useAnalysisRace(season, round, phase === 'results')
  const live = phase === 'live' ? weekend.currentSession : null
  const target = weekend && phase !== 'results' && !live ? (weekend.nextSession?.dateTime || weekend.hero.raceDateTime || null) : null
  const countdown = useCountdown(target)
  const nav = useMemo(() => neighbours(w.calendar, round), [w.calendar, round])
  const specs = weekend?.circuitId ? getCircuitSpecs(weekend.circuitId) : null

  useEffect(() => {
    document.title = weekend ? `${weekend.hero.raceName} ${weekend.hero.season} · Pitwall` : 'Race weekend · Pitwall'
  }, [weekend])

  if (w.status === 'loading') return <WeekendSkeleton />
  if (w.status === 'invalid' || w.status === 'notFound' || (w.status === 'ready' && !weekend)) {
    return (
      <PageWrapper stagger>
        <h1 className="text-title mb-pw-3 text-ink">Race weekend</h1>
        <EmptyState
          type="empty" height={160} message="That race weekend does not exist"
          action={<Link to="/calendar" className={cn(buttonVariants(), 'min-h-11 no-underline')}>Back to the calendar</Link>}
        />
      </PageWrapper>
    )
  }
  if (w.status === 'error') {
    return (
      <PageWrapper stagger>
        <h1 className="text-title mb-pw-3 text-ink">Race weekend</h1>
        <EmptyState
          type="error" height={160} message="We couldn't load this race weekend"
          action={(
            <div className="flex flex-wrap items-center justify-center gap-pw-3">
              <button type="button" onClick={w.retry} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')}>Try again</button>
              <Link to="/calendar" className={cn(buttonVariants(), 'min-h-11 no-underline')}>Back to the calendar</Link>
            </div>
          )}
        />
      </PageWrapper>
    )
  }

  const { hero, schedule } = weekend
  const hasSchedule = Boolean(schedule && Object.keys(schedule).length)
  const showResults = phase === 'results' || (phase === 'live' && weekend.hasSessionResults)
  const dateLabel = dateLabelOf(hero.date)
  const scheduleNode = hasSchedule && (
    <WeekendSchedulePanel
      schedule={schedule} liveKey={live?.key} nextSessionKey={weekend.nextSession?.key}
      weather={weather} weatherFailed={weatherFailed && !weather} bare={phase === 'results'}
    />
  )
  const facts = (specs || w.history) ? <CircuitFacts specs={specs} history={phase === 'results' ? null : w.history} /> : null
  const status = phase === 'results' ? `${hero.raceName}, results` : phase === 'live' ? `${hero.raceName}, live now` : `${hero.raceName}, preview`

  return (
    <>
      <PageWrapper stagger>
        <div className="flex flex-col gap-pw-7 lg:gap-pw-8" data-phase={phase}>
          <Rise index={0} as="nav" aria-label="Race weekend navigation" className="flex flex-wrap items-center justify-between gap-pw-3">
            <Link to={`/calendar?season=${encodeURIComponent(hero.season)}`} className="inline-flex min-h-11 items-center gap-pw-1 text-sm text-ink-2 no-underline hover:text-ink">
              <ChevronLeft aria-hidden="true" size={16} />
              Calendar {hero.season}
            </Link>
            <div className="flex items-center gap-pw-2">
              {nav.prev && <RoundLink dir="prev" round={nav.prev.round} name={nav.prev.name} season={hero.season} />}
              {nav.next && <RoundLink dir="next" round={nav.next.round} name={nav.next.name} season={hero.season} />}
            </div>
          </Rise>

          <Rise index={1}>
            <NextRaceHero
              race={hero} circuit={w.circuit} live={live} countdown={countdown} flagUrl={countryFlag(hero.country)}
              phase={phase} winner={weekend.winner} analysisTo={analysisHref(analysisRace)} dateLabel={dateLabel}
            />
          </Rise>

          {phase === 'preview' && (
            <>
              {scheduleNode && <Rise index={2}>{scheduleNode}</Rise>}
              {showResults && <Rise index={2}><SessionResults race={w.race} season={hero.season} round={hero.round} now={now} onDriverClick={wide ? setDriver : undefined} /></Rise>}
              {facts && <Rise index={3}>{facts}</Rise>}
              <Rise index={4}><MapAndDna circuit={w.circuit} circuitId={weekend.circuitId} /></Rise>
            </>
          )}

          {phase === 'live' && (
            <>
              {scheduleNode && <Rise index={2}>{scheduleNode}</Rise>}
              {showResults && <Rise index={2}><SessionResults race={w.race} season={hero.season} round={hero.round} now={now} onDriverClick={wide ? setDriver : undefined} /></Rise>}
              {facts && <Rise index={3}><SectionDisclosure title="Circuit and last race here" alwaysCollapsible>{facts}</SectionDisclosure></Rise>}
              <Rise index={4}><MapAndDna circuit={w.circuit} circuitId={weekend.circuitId} collapsible /></Rise>
            </>
          )}

          {phase === 'results' && (
            <>
              <Rise index={2}><SessionResults race={w.race} season={hero.season} round={hero.round} now={now} onDriverClick={wide ? setDriver : undefined} /></Rise>
              <Rise index={3}><RaceStatCards results={w.race.Results} qualifyingResults={w.race.QualifyingResults} raceSnapshot={w.race.raceSnapshot} /></Rise>
              {scheduleNode && <Rise index={4}><SectionDisclosure title="Weekend schedule" alwaysCollapsible>{scheduleNode}</SectionDisclosure></Rise>}
              <Rise index={5}><MapAndDna circuit={w.circuit} circuitId={weekend.circuitId} collapsible /></Rise>
            </>
          )}
        </div>
        <p role="status" aria-live="polite" className="sr-only">{status}</p>
      </PageWrapper>
      {wide && <DriverDrawer driver={driver} onClose={() => setDriver(null)} />}
    </>
  )
}
