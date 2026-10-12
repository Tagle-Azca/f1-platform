import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'
import Select from '../components/ui/Select'
import SegmentedControl from '../components/ui/SegmentedControl'
import EmptyState from '../components/ui/EmptyState'
import DriverDrawer from '../components/ui/DriverDrawer'
import ConstructorDrawer from '../components/ui/ConstructorDrawer'
import VizSkeleton from '../components/viz/VizSkeleton'
import StandingsHero from '../components/standings/StandingsHero'
import ReplayControls from '../components/standings/ReplayControls'
import StandingsChart from '../components/standings/StandingsChart'
import StandingsTable from '../components/standings/StandingsTable'
import {
  normalizeSeries, rankAt, heroModel, seasonStatus, doneAt, roundLabel, roundText, normalizeRounds,
} from '../components/standings/standingsModel'
import { useStandingsData } from '../hooks/useStandingsData'
import { useReplay } from '../hooks/useReplay'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useReducedMotion } from '../styles/motion'

const VIEWS = [{ value: 'drivers', label: 'Drivers' }, { value: 'constructors', label: 'Constructors' }]
const FIRST_SEASON = 1950

/** `?season=` must be a whole year in range; anything else means "the current season". */
function parseSeason(raw, currentYear) {
  if (typeof raw !== 'string' || !/^\d{4}$/.test(raw)) return null
  const n = Number(raw)
  return n >= FIRST_SEASON && n <= currentYear ? n : null
}

/** The drawer object: the id and name as before, plus the season rank and points when the row has them (additive). */
const ctorDrawer = (row, season) => ({
  constructorId: row.id, name: row.name,
  ...(Number.isFinite(season) && Number.isFinite(row.pos) && Number.isFinite(row.pts) ? { season, position: row.pos, points: row.pts } : {}),
})

function ErrorState({ onRetry }) {
  return (
    <EmptyState
      type="error" height={160} message="Standings could not be loaded"
      action={(
        <>
          <p className="text-sm text-ink-2">Check your connection and try again.</p>
          <button type="button" onClick={onRetry} className="btn btn--primary btn--sentence min-h-11">Try again</button>
        </>
      )}
    />
  )
}

export default function StandingsPage() {
  const currentYear = new Date().getFullYear()
  const reduced = useReducedMotion()
  const isWide = useMediaQuery('(min-width: 1024px)')
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'constructors' ? 'constructors' : 'drivers'
  const requested = parseSeason(params.get('season'), currentYear)
  const isDrivers = view === 'drivers'

  const data = useStandingsData({ requested, currentYear })
  const { season, seasons, missing } = data
  const status = data.status !== 'ready' || isDrivers ? data.status : data.ctorStatus // each view loads and fails on its own

  // A season without data in the URL falls back to the latest one; the URL is corrected and a notice explains it.
  useEffect(() => {
    if (missing == null || season == null) return
    const next = new URLSearchParams(params)
    next.set('season', String(season))
    setParams(next, { replace: true, state: { stNotice: { missing, season } } })
  }, [missing, season]) // eslint-disable-line react-hooks/exhaustive-deps
  const notice = location.state?.stNotice

  function writeParams(patch) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) (v == null ? next.delete(k) : next.set(k, v))
    setParams(next, { replace: true }) // no state: clears the fallback notice
  }
  const onSeason = (value) => writeParams({ season: value })
  const onView = (value) => writeParams({ view: value === 'constructors' ? 'constructors' : null })

  const ready = status === 'ready' && season != null && data.drivers && (isDrivers || data.constructors)
  const datasetKey = `${season}-${view}`
  const current = season === currentYear

  const driverSeries = useMemo(() => (ready ? normalizeSeries(data.drivers, 'drivers') : []), [ready, data.drivers])
  const series = useMemo(() => {
    if (!ready) return []
    if (isDrivers) return driverSeries
    return normalizeSeries({ ...data.constructors, rounds: data.drivers.rounds }, 'constructors')
  }, [ready, isDrivers, driverSeries, data.constructors, data.drivers])
  const info = useMemo(() => (ready ? seasonStatus(data.drivers, { current }) : null), [ready, data.drivers, current])
  const rounds = useMemo(() => (ready ? normalizeRounds(data.drivers) : []), [ready, data.drivers])
  const total = series[0]?.cumulative.length ?? 0

  const replay = useReplay(total, datasetKey)
  const round = replay.round
  const rows = useMemo(() => rankAt(series, round), [series, round])
  const hero = useMemo(() => (info ? heroModel(rows, {
    view, season, current, totalRounds: info.knownTotal ? info.totalRounds : null, roundsDone: doneAt(info, round), atEnd: round >= total,
  }) : null), [rows, info, view, season, current, round, total])

  const [mode, setMode] = useState('points')
  const [hoverId, setHoverId] = useState(null)
  const [open, setOpen] = useState(null)
  const [drawerDriver, setDrawerDriver] = useState(null)
  const [drawerCtor, setDrawerCtor] = useState(null)
  const returnFocus = useRef(null)

  // Hover, the open row and any drawer belong to one dataset: drop them when the season or view changes
  const [keyState, setKeyState] = useState(datasetKey)
  if (keyState !== datasetKey) {
    setKeyState(datasetKey)
    setHoverId(null); setOpen(null); setDrawerDriver(null); setDrawerCtor(null)
  }

  const onHover = useCallback((id) => setHoverId(id), [])
  const onOpenChange = useCallback((id) => setOpen(id), [])
  const onOpenProfile = useCallback((row) => {
    returnFocus.current = row.id
    if (row.kind === 'constructor') setDrawerCtor(ctorDrawer(row, season))
    else setDrawerDriver({ driverId: row.id, name: row.name })
  }, [season])
  const onOpenConstructor = useCallback((row) => setDrawerCtor(ctorDrawer(row, season)), [season])
  const closeDrawer = useCallback(() => { setDrawerDriver(null); setDrawerCtor(null) }, [])
  // After a drawer closes (its own focus restore has already run in this commit) focus goes back to the row
  useEffect(() => {
    if (drawerDriver || drawerCtor) return
    const id = returnFocus.current
    returnFocus.current = null
    if (id) document.getElementById(`st-row-${id}`)?.focus()
  }, [drawerDriver, drawerCtor])

  // Screen reader announcements: when playback stops, after a settled keyboard/pointer seek, and when a dataset loads.
  // Never per tick.
  const [message, setMessage] = useState('')
  const lastRef = useRef({ key: null, round: 0, playing: false })
  const leaderName = rows[0]?.name
  const leaderPts = rows[0]?.pts
  const roundDesc = info ? roundText(rounds, round - 1, { sprintOnly: info.sprintOnly }) : ''
  useEffect(() => {
    if (!ready) return
    const prev = lastRef.current
    lastRef.current = { key: datasetKey, round, playing: replay.playing }
    if (replay.playing) return
    let text = null
    let wait = 0
    if (prev.key !== datasetKey) text = `Showing ${isDrivers ? 'driver' : 'constructor'} standings for ${season}, after round ${info.roundsDone}.`
    else if (prev.playing) text = `Replay paused ${roundDesc.replace(/^After/, 'after')}. Leader ${leaderName}, ${leaderPts} points.`
    else if (prev.round !== round) { text = `${roundDesc}. Leader ${leaderName}, ${leaderPts} points.`; wait = 400 }
    if (!text) return
    const t = setTimeout(() => setMessage(text), wait)
    return () => clearTimeout(t)
  }, [ready, datasetKey, round, replay.playing]) // eslint-disable-line react-hooks/exhaustive-deps

  const seasonOptions = useMemo(() => {
    const list = seasons.length || season == null ? seasons : [season]
    const withCurrent = season != null && !list.includes(season) ? [season, ...list].sort((a, b) => b - a) : list
    return withCurrent.map(y => ({ value: String(y), label: String(y) }))
  }, [seasons, season])

  const viewLabel = isDrivers ? 'Drivers' : 'Constructors'
  let subline = ''
  if (ready) {
    subline = current
      ? `${viewLabel}, ${season}. ${info.knownTotal ? `After round ${info.roundsDone} of ${info.totalRounds}.` : `After round ${info.roundsDone}.`}`
      : `${viewLabel}, ${season}. ${info.roundsDone} ${info.roundsDone === 1 ? 'round' : 'rounds'}.`
  } else if (season != null) subline = `${viewLabel}, ${season}.`

  const sprint = info?.sprintOnly
  const compactLabel = ready ? roundLabel(rounds, round - 1, { compact: true, total: info.totalRounds }) : ''
  const longLabel = ready ? roundLabel(rounds, round - 1, { sprintOnly: sprint }) : ''

  return (
    <>
      <PageWrapper stagger className="page--clip">
        <Rise index={0} as="header" className="mb-pw-5">
          <div className="flex flex-col gap-pw-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="text-title text-ink">Standings</h1>
              {subline && <p className="mt-pw-1 text-sm text-ink-2">{subline}</p>}
              {ready && info.chipLabel && (
                <div className="mt-pw-2 flex flex-col items-start gap-pw-1">
                  <span className="inline-flex min-h-6 items-center rounded-pill border border-edge px-pw-3 text-xs font-medium text-ink-2">{info.chipLabel}</span>
                  <p className="text-xs text-ink-3">This season is incomplete in our data, so totals can differ from the official result.</p>
                </div>
              )}
            </div>
            <div className="flex items-end gap-pw-3">
              <div className="flex w-28 shrink-0 flex-col gap-pw-1">
                <label htmlFor="st-season" className="text-xs text-ink-2">Season</label>
                <Select id="st-season" value={season == null ? '' : String(season)} onChange={onSeason} options={seasonOptions} disabled={!seasonOptions.length} placeholder="Season" />
              </div>
              <SegmentedControl
                role="tablist" aria-label="Championship" options={VIEWS} value={view} onChange={onView}
                controls="st-panel" idPrefix="st-tab" fill className="min-w-0 flex-1 md:w-64 md:flex-none"
              />
            </div>
          </div>
        </Rise>

        {notice && Number.isFinite(notice.missing) && Number.isFinite(notice.season) && (
          <p role="status" className="mb-pw-4 rounded-md border border-edge px-pw-4 py-pw-3 text-sm text-ink-2">
            No standings for {notice.missing}. Showing {notice.season} instead.
          </p>
        )}

        <div role="tabpanel" id="st-panel" aria-labelledby={`st-tab-${view}`} tabIndex={-1} className="outline-none" aria-busy={status === 'loading' || undefined}>
          {status === 'error' && <ErrorState onRetry={data.retry} />}
          {status === 'empty' && (
            <EmptyState
              type="empty" height={160} message="No standings available yet."
              action={<p className="text-sm text-ink-3">Standings appear after the first race of a season.</p>}
            />
          )}
          {status === 'loading' && (
            <div className="flex flex-col gap-pw-7 lg:gap-pw-8">
              <VizSkeleton variant="podium" name="title fight" />
              <ReplayControls round={1} total={0} playing={false} atEnd onToggle={() => {}} onSeek={() => {}} valueText="" compactLabel="" longLabel="" sticky={false} />
              <VizSkeleton variant="lines" name="season chart" />
              <VizSkeleton variant="standingsrows" name="standings" count={isDrivers ? 22 : 10} />
            </div>
          )}
          {ready && (
            <motion.div
              key={datasetKey}
              {...(reduced ? { initial: false } : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.16 } })}
              className="flex flex-col gap-pw-7 lg:gap-pw-8"
            >
              <Rise index={1}>
                <StandingsHero
                  view={view} season={season} hero={hero} photos={data.photos} datasetKey={datasetKey}
                  source={replay.source} onOpenConstructor={onOpenConstructor}
                />
              </Rise>
              {/* A direct child of the panel content so the sticky bar can stick for the whole panel height */}
              <ReplayControls
                round={round} total={total} playing={replay.playing} atEnd={replay.atEnd}
                onToggle={replay.toggle} onSeek={replay.seek}
                valueText={roundDesc} compactLabel={compactLabel} longLabel={longLabel}
              />
              {reduced && <p className="-mt-pw-5 text-xs text-ink-3">Reduced motion is on. Rounds change without animation.</p>}
              <Rise index={3}>
                <StandingsChart
                  series={series} rounds={rounds} round={round} view={view} datasetKey={datasetKey}
                  mode={mode} onModeChange={setMode} hoverId={hoverId} onHover={onHover} selectedId={open} sprintOnly={sprint}
                />
              </Rise>
              <Rise index={4}>
                <StandingsTable
                  series={series} rows={rows} view={view} round={round} rounds={rounds} hero={hero} isWide={isWide}
                  open={open} onOpenChange={onOpenChange} hoverId={hoverId} onHover={onHover}
                  source={replay.source} reduced={reduced} entrance={!reduced} onOpenProfile={onOpenProfile}
                />
              </Rise>
            </motion.div>
          )}
        </div>

        <div role="status" aria-live="polite" className="sr-only">{message}</div>
      </PageWrapper>

      <DriverDrawer driver={drawerDriver} onClose={closeDrawer} />
      <ConstructorDrawer constructor={drawerCtor} onClose={closeDrawer} />
    </>
  )
}
