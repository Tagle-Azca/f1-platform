import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'
import EmptyState from '../components/ui/EmptyState'
import { buttonVariants } from '../components/ui/button-variants'
import EncyclopediaToolbar from '../components/encyclopedia/EncyclopediaToolbar'
import HubGrid from '../components/encyclopedia/HubGrid'
import HubSkeleton from '../components/encyclopedia/HubSkeleton'
import {
  FIRST_PLAUSIBLE_SEASON, parseHubParams, cleanHubParams, buildDriverCards, buildConstructorCards, matchFavorites, resultLine,
} from '../components/encyclopedia/encyclopediaModel'
import { seasonStatus } from '../components/standings/standingsModel'
import { rangeLabel } from '../components/profiles/driver/driverProfileModel'
import { useStandingsData, PROBE_SPAN } from '../hooks/useStandingsData'
import { useFeaturedDrivers } from '../hooks/useFeaturedDrivers'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { usePreferences } from '../contexts/PreferencesContext'
import { useReducedMotion } from '../styles/motion'
import { cn } from '@/lib/utils'

const NOUN = { drivers: 'drivers', constructors: 'constructors' }

/** The old `?view=circuits` hub tab now lives on the Circuits page. */
export default function DriversTeamsRoute() {
  const [params] = useSearchParams()
  if (params.get('view') === 'circuits') return <Navigate replace to="/circuits" />
  return <DriversTeamsPage />
}

function DriversTeamsPage() {
  const currentYear = new Date().getFullYear()
  const reduced = useReducedMotion()
  const wide = useMediaQuery('(min-width: 640px)')
  const prefs = usePreferences()?.prefs
  const [params, setParams] = useSearchParams()
  const parsed = useMemo(() => parseHubParams(params, { currentYear }), [params, currentYear])
  const { view } = parsed

  const data = useStandingsData({ requested: parsed.season, currentYear })
  const { seasons } = data
  // A season before the standings data (1950 to 2021) has no standings: drivers come from the featured list, teams are not covered.
  const legacy = parsed.season != null && (parsed.season < currentYear - PROBE_SPAN || (data.missing != null && data.missing === parsed.season))
  const season = legacy ? parsed.season : data.season
  const isCurrent = season === currentYear
  const featured = useFeaturedDrivers(parsed.season, { enabled: legacy && view === 'drivers' })
  const firstData = seasons.length ? Math.min(...seasons) : 2022

  useEffect(() => { document.title = 'Drivers & teams · Pitwall' }, [])

  // Invalid ?view= / ?season= values and a season without data are dropped with replace: no extra history entry.
  useEffect(() => {
    if (!parsed.dirty) return
    setParams(cleanHubParams(params, parsed), { replace: true })
  }, [parsed.dirty]) // eslint-disable-line react-hooks/exhaustive-deps

  const push = useCallback((patch) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) (v == null ? next.delete(k) : next.set(k, v))
    setParams(next) // a user choice is a history entry, so Back restores the previous tab and season
  }, [params, setParams])
  const onView = useCallback((v) => push({ view: v, season: season != null ? String(season) : params.get('season') }), [push, season, params])
  const onSeason = useCallback((v) => push({ season: v, view }), [push, view])

  const dStatus = data.status
  let status
  if (legacy) status = view === 'drivers' ? (featured.status === 'idle' ? 'loading' : featured.status === 'empty' ? 'ready' : featured.status) : 'ready'
  else status = view === 'constructors' ? (dStatus !== 'ready' ? dStatus : data.ctorStatus) : dStatus
  const retry = legacy && view === 'drivers' ? featured.retry : data.retry

  const driverCards = useMemo(() => (legacy ? featured.cards : buildDriverCards(data.drivers, data.photos)), [legacy, featured.cards, data.drivers, data.photos])
  const ctorCards = useMemo(() => (legacy ? [] : buildConstructorCards(data.constructors)), [legacy, data.constructors])
  const cards = view === 'drivers' ? driverCards : ctorCards
  const fav = useMemo(() => matchFavorites(cards, prefs, view), [cards, prefs, view])
  const info = useMemo(() => (!legacy && data.drivers ? seasonStatus(data.drivers, { current: isCurrent }) : null), [legacy, data.drivers, isCurrent])

  const count = cards.length
  const legacyTeams = legacy && view === 'constructors'
  const ready = status === 'ready' && season != null
  const empty = ready && count === 0 && !legacyTeams
  const showGrid = ready && count > 0 && !legacyTeams
  const line = ready && !legacy ? resultLine(view, { count, season, roundsDone: info?.roundsDone ?? 0, current: isCurrent }) : null

  const seasonList = Array.from({ length: currentYear - FIRST_PLAUSIBLE_SEASON + 1 }, (_, i) => currentYear - i)
  const shownSeason = season ?? parsed.season
  const range = seasons.length ? rangeLabel(Math.min(...seasons), Math.max(...seasons)) : `${firstData}–${currentYear}`
  const latest = seasons[0] ?? currentYear

  // Screen reader announcement once a tab or season has settled; never per keystroke
  const [message, setMessage] = useState('')
  const lastKey = useRef(null)
  const key = showGrid ? `${view}|${season}|${count}` : null
  useEffect(() => {
    if (!key || key === lastKey.current) return undefined
    const first = lastKey.current === null
    lastKey.current = key
    if (first) return undefined
    const t = setTimeout(() => setMessage(`Showing ${count} ${NOUN[view]} for ${season}.`), 300)
    return () => clearTimeout(t)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const linkState = useMemo(() => ({ from: `/drivers?view=${view}${shownSeason != null ? `&season=${shownSeason}` : ''}` }), [view, shownSeason])
  const [entrance, setEntrance] = useState(true)
  useEffect(() => {
    if (!showGrid) return undefined
    const t = setTimeout(() => setEntrance(false), 1500)
    return () => clearTimeout(t)
  }, [showGrid])

  let panel
  if (status === 'loading') {
    panel = <HubSkeleton wide={wide} name={NOUN[view]} />
  } else if (legacyTeams) {
    panel = (
      <EmptyState
        type="empty" height={200} message={`Team standings cover ${range}`}
        action={(
          <>
            <p className="text-sm text-ink-2">Switch to Drivers to browse the {season} line-up, or pick a later season.</p>
            <button type="button" onClick={() => onSeason(String(latest))} className={cn(buttonVariants({ size: 'lg' }))}>Show {latest}</button>
          </>
        )}
      />
    )
  } else if (status === 'error' || status === 'empty' || (status === 'ready' && season == null)) {
    const text = season == null ? "We couldn't load the seasons" : `We couldn't load the ${season} ${NOUN[view]}`
    panel = status === 'empty'
      ? <EmptyState type="empty" height={200} message="No seasons with data yet" action={<p className="text-sm text-ink-2">Pitwall standings cover {range}.</p>} />
      : (
        <EmptyState
          type="error" height={200} message={text}
          action={<button type="button" onClick={retry} className={cn(buttonVariants({ size: 'lg' }))}>Try again</button>}
        />
      )
  } else if (empty) {
    const title = legacy ? `No drivers listed for ${season}` : `No ${NOUN[view]} in the ${season} standings yet`
    panel = (
      <EmptyState
        type="empty" height={200} message={title}
        action={(
          <>
            <p className="text-sm text-ink-2">Pick another season.</p>
            {latest != null && latest !== season && (
              <button type="button" onClick={() => onSeason(String(latest))} className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>Show {latest} season</button>
            )}
          </>
        )}
      />
    )
  } else {
    panel = (
      <motion.div
        key={`${view}-${season}`}
        {...(reduced ? { initial: false } : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } })}
      >
        <HubGrid
          view={view} season={season} layout={wide ? 'portrait' : 'row'} entrance={entrance && !reduced} linkState={linkState}
          pinned={fav.pinned} rest={fav.rest}
        />
      </motion.div>
    )
  }

  return (
    <PageWrapper stagger>
      <Rise index={0} as="header" className="mb-pw-5">
        <h1 className="text-title text-ink">Drivers &amp; teams</h1>
        <p className="mt-pw-1 min-h-5 text-sm text-ink-2">Every driver and team from 1950 to today. Search any era, or browse a season.</p>
      </Rise>

      <Rise index={1}>
        <EncyclopediaToolbar
          view={view} onView={onView} season={shownSeason} seasons={seasonList} onSeason={onSeason}
          seasonDisabled={status === 'loading' && season == null}
        />
      </Rise>

      <p className="mt-pw-3 text-sm text-ink-2 sm:text-right">
        Looking for a track?{' '}
        <Link to="/circuits" className="inline-flex min-h-11 items-center text-steel hover:text-steel-hi">Circuits</Link>
      </p>

      <div className="min-h-10">
        {legacy && view === 'drivers' && ready && (
          <p className="text-xs text-ink-3">Line-ups before {firstData} are listed by surname; points are not shown.</p>
        )}
        {line && (
          <>
            <p className="text-sm text-ink-2"><span className="num">{line.head.split(' ')[0]}</span> {line.head.split(' ').slice(1).join(' ')}</p>
            {line.note && <p className="text-xs text-ink-3">{line.note}</p>}
          </>
        )}
      </div>

      <div id="drivers-panel" role="tabpanel" aria-labelledby={`drivers-tab-${view}`} tabIndex={-1} aria-busy={status === 'loading' || undefined} className="mt-pw-4 outline-none">
        {panel}
      </div>

      <div role="status" aria-live="polite" className="sr-only">{message}</div>
    </PageWrapper>
  )
}
