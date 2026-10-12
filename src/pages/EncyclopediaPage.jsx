import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'
import EmptyState from '../components/ui/EmptyState'
import { buttonVariants } from '../components/ui/button-variants'
import EncyclopediaToolbar from '../components/encyclopedia/EncyclopediaToolbar'
import HubGrid from '../components/encyclopedia/HubGrid'
import HubSkeleton from '../components/encyclopedia/HubSkeleton'
import {
  parseHubParams, cleanHubParams, buildDriverCards, buildConstructorCards, matchFavorites, resultLine,
} from '../components/encyclopedia/encyclopediaModel'
import { seasonStatus } from '../components/standings/standingsModel'
import { rangeLabel } from '../components/profiles/driver/driverProfileModel'
import { useStandingsData } from '../hooks/useStandingsData'
import { useSeasonCircuits } from '../hooks/useSeasonCircuits'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { usePreferences } from '../contexts/PreferencesContext'
import { useReducedMotion } from '../styles/motion'
import { cn } from '@/lib/utils'

const NOUN = { drivers: 'drivers', constructors: 'constructors', circuits: 'circuits' }

export default function EncyclopediaPage() {
  const currentYear = new Date().getFullYear()
  const reduced = useReducedMotion()
  const wide = useMediaQuery('(min-width: 640px)')
  const prefs = usePreferences()?.prefs
  const [params, setParams] = useSearchParams()
  const parsed = useMemo(() => parseHubParams(params, { currentYear }), [params, currentYear])
  const { view } = parsed

  const data = useStandingsData({ requested: parsed.season, currentYear })
  const { season, seasons, missing } = data
  const isCurrent = season === currentYear
  const circuits = useSeasonCircuits(season, { enabled: view === 'circuits' && season != null, isCurrent })

  useEffect(() => { document.title = 'Encyclopedia · Pitwall' }, [])

  // Invalid ?view= / ?season= values and a season without data are dropped with replace: no extra history entry.
  useEffect(() => {
    if (!parsed.dirty) return
    setParams(cleanHubParams(params, parsed), { replace: true })
  }, [parsed.dirty]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (missing == null) return
    const next = new URLSearchParams(params)
    next.delete('season')
    setParams(next, { replace: true })
  }, [missing]) // eslint-disable-line react-hooks/exhaustive-deps

  const push = useCallback((patch) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) (v == null ? next.delete(k) : next.set(k, v))
    setParams(next) // a user choice is a history entry, so Back restores the previous tab and season
  }, [params, setParams])
  const onView = useCallback((v) => push({ view: v, season: season != null ? String(season) : params.get('season') }), [push, season, params])
  const onSeason = useCallback((v) => push({ season: v, view }), [push, view])

  const dStatus = data.status
  const status = view === 'circuits'
    ? (season == null ? dStatus : circuits.status === 'idle' ? 'loading' : circuits.status)
    : view === 'constructors' ? (dStatus !== 'ready' ? dStatus : data.ctorStatus) : dStatus
  const retry = view === 'circuits' && season != null && dStatus === 'ready' ? circuits.retry : data.retry

  const driverCards = useMemo(() => buildDriverCards(data.drivers, data.photos), [data.drivers, data.photos])
  const ctorCards = useMemo(() => buildConstructorCards(data.constructors), [data.constructors])
  const cards = view === 'drivers' ? driverCards : ctorCards
  const fav = useMemo(() => (view === 'circuits' ? { pinned: [], rest: [] } : matchFavorites(cards, prefs, view)), [cards, prefs, view])
  const info = useMemo(() => (data.drivers ? seasonStatus(data.drivers, { current: isCurrent }) : null), [data.drivers, isCurrent])

  const count = view === 'circuits' ? circuits.circuits.length : cards.length
  const ready = status === 'ready' && season != null
  const empty = ready && count === 0
  const showGrid = ready && count > 0
  const line = ready ? resultLine(view, { count, season, roundsDone: info?.roundsDone ?? 0, current: isCurrent }) : null

  const seasonList = seasons.length ? seasons : season != null ? [season] : parsed.season != null ? [parsed.season] : []
  const shownSeason = season ?? parsed.season
  const range = seasons.length ? rangeLabel(Math.min(...seasons), Math.max(...seasons)) : ''
  const latest = seasons[0] ?? null

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

  const linkState = useMemo(() => ({ from: `/encyclopedia?view=${view}${shownSeason != null ? `&season=${shownSeason}` : ''}` }), [view, shownSeason])
  const [entrance, setEntrance] = useState(true)
  useEffect(() => {
    if (!showGrid) return undefined
    const t = setTimeout(() => setEntrance(false), 1500)
    return () => clearTimeout(t)
  }, [showGrid])

  let panel
  if (status === 'loading') {
    panel = <HubSkeleton wide={wide} name={NOUN[view]} />
  } else if (status === 'error' || status === 'empty' || (status === 'ready' && season == null)) {
    const text = season == null ? "We couldn't load the seasons" : `We couldn't load the ${season} ${NOUN[view]}`
    panel = status === 'empty'
      ? <EmptyState type="empty" height={200} message="No seasons with data yet" action={<p className="text-sm text-ink-2">Pitwall data covers 2022–2026.</p>} />
      : (
        <EmptyState
          type="error" height={200} message={text}
          action={<button type="button" onClick={retry} className={cn(buttonVariants({ size: 'lg' }))}>Try again</button>}
        />
      )
  } else if (empty) {
    const title = view === 'circuits' ? `No calendar for ${season}` : `No ${NOUN[view]} in the ${season} standings yet`
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
          pinned={fav.pinned} rest={fav.rest} circuits={circuits.circuits} nextId={circuits.nextId}
        />
      </motion.div>
    )
  }

  return (
    <PageWrapper stagger>
      <Rise index={0} as="header" className="mb-pw-5">
        <h1 className="text-title text-ink">Encyclopedia</h1>
        <p className="mt-pw-1 min-h-5 text-sm text-ink-2">Drivers, teams and circuits{range && <> · <span className="num">{range}</span></>}</p>
      </Rise>

      <Rise index={1}>
        <EncyclopediaToolbar
          view={view} onView={onView} season={shownSeason} seasons={seasonList} onSeason={onSeason}
          seasonDisabled={status === 'loading' && season == null}
        />
      </Rise>

      <div className="mt-pw-4 min-h-10">
        {line && (
          <>
            <p className="text-sm text-ink-2"><span className="num">{line.head.split(' ')[0]}</span> {line.head.split(' ').slice(1).join(' ')}</p>
            {line.note && <p className="text-xs text-ink-3">{line.note}</p>}
          </>
        )}
      </div>

      <div id="encyclopedia-panel" role="tabpanel" aria-labelledby={`enc-tab-${view}`} tabIndex={-1} aria-busy={status === 'loading' || undefined} className="mt-pw-4 outline-none">
        {panel}
      </div>

      <div role="status" aria-live="polite" className="sr-only">{message}</div>
    </PageWrapper>
  )
}
