import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCountdown } from '../../hooks/useCountdown'
import { useNow } from '../../hooks/useNow'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { getFeaturedSession, buildSessionList } from '../../utils/sessionSchedule'
import { getInitialTZ } from '../../utils/timezone'
import { formatSessionWhen } from '../../utils/sessionWhen'
import { countryFlag } from '../../utils/flags'
import { circuitsApi } from '../../services/api'
import CircuitLink from '../circuits/CircuitLink'
import { useLiveStatus } from '../../contexts/LiveStatusContext'
import Panel from '../ui/Panel'
import LivePill from '../ui/LivePill'
import CountdownDisplay from '../ui/CountdownDisplay'
import VizSkeleton from '../viz/VizSkeleton'
import SessionTimeline from '../viz/SessionTimeline'
import TrackTrace from '../viz/TrackTrace'
import { cleanCoords } from '../viz/trackCoords'
import { buttonVariants } from '../ui/button-variants'
import { cn } from '@/lib/utils'
import { safeString } from '../../utils/safeText'
import { weekendPathFor } from '../../utils/weekendPath'
import { heroChildProps, useReducedMotion, DUR } from '../../styles/motion'

/**
 * Circuit outline for the hero: ONE getById per mount, at lg+ only (where the trace renders), no retry, no polling.
 * Silent on failure. Fewer than 8 finite points renders nothing.
 */
function useHeroTrace(circuitId, enabled) {
  const [coords, setCoords] = useState(null)
  const askedFor = useRef(null)
  useEffect(() => {
    // Never reset: crossing the lg breakpoint back and forth must not refetch (one request per mount and circuit).
    if (!enabled || typeof circuitId !== 'string' || !circuitId || askedFor.current === circuitId) return
    askedFor.current = circuitId
    circuitsApi.getById(circuitId)
      .then((c) => { const clean = cleanCoords(c?.trackCoords ?? null); setCoords(clean.length >= 8 ? clean : null) })
      .catch(() => {})
  }, [circuitId, enabled])
  return coords
}

export default function HomeHero({ race, loading, error, onRetry }) {
  const { available: liveAvailable, sessionName } = useLiveStatus() ?? {}
  const reduced = useReducedMotion()
  const tz = getInitialTZ()
  const now = useNow(60000)
  const isLg = useMediaQuery('(min-width: 1024px)')
  const weekendTo = weekendPathFor(race)
  const featured = race ? getFeaturedSession(race.schedule, race.currentSession) : null
  const ladder   = race ? buildSessionList(race.schedule, race.currentSession) : []
  const countdown = useCountdown(featured?.dateTime ?? null)
  const coords = useHeroTrace(race?.circuitId, isLg && !loading)

  if (loading) {
    return (
      <Panel as="section" aria-label="Next session">
        <VizSkeleton variant="hero" name="next session" />
      </Panel>
    )
  }
  if (error && !race) {
    return (
      <Panel as="section" aria-labelledby="hero-title" role="alert">
        <h2 id="hero-title" className="text-heading mb-pw-2 text-ink">Next session</h2>
        <p className="text-sm text-ink-2 mb-pw-3">Session data unavailable.</p>
        <button type="button" className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')} onClick={onRetry}>Try again</button>
      </Panel>
    )
  }
  if (!race) {
    return (
      <Panel as="section" aria-labelledby="hero-title">
        <h2 id="hero-title" className="text-heading mb-pw-2 text-ink">Next session</h2>
        <p className="text-base text-ink-2 mb-pw-3">No upcoming session.</p>
        <Link to="/calendar" className="inline-flex min-h-11 items-center text-steel font-semibold hover:text-steel-hi">Browse races</Link>
      </Panel>
    )
  }

  const flagUrl = countryFlag(race.country)
  const locationLabel = [safeString(race.locality), safeString(race.country)].filter(Boolean).join(', ')
  const headline = liveAvailable ? (sessionName || featured?.label || safeString(race.raceName)) : (featured?.label ?? safeString(race.raceName))
  const child = (i) => heroChildProps(i, reduced)

  return (
    <Panel as="section" aria-labelledby="hero-title" className="grid grid-cols-1 gap-pw-6 lg:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-pw-4 lg:col-span-7">
        <motion.div className="flex flex-wrap items-center gap-pw-2" {...child(0)}>
          {liveAvailable
            ? <LivePill>Live now</LivePill>
            : <span className="inline-flex min-h-6 items-center rounded-pill bg-steel-soft px-pw-3 text-xs font-semibold text-steel">Next session</span>}
          {!liveAvailable && featured && <span className="text-sm text-ink-2">{formatSessionWhen(featured.dateTime, tz)}</span>}
        </motion.div>

        <motion.h2 id="hero-title" className="text-hero text-ink [overflow-wrap:anywhere]" {...child(1)}>
          {headline}
        </motion.h2>

        {(flagUrl || locationLabel) && (
          <motion.p className="flex items-center gap-pw-2 text-sm text-ink-2" {...child(2)}>
            {flagUrl && <img src={flagUrl} alt="" width="22" height="16" className="h-4 w-[22px] shrink-0 rounded-[2px] object-cover" />}
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {safeString(race.raceName)}{locationLabel ? ', ' : ''}
              {locationLabel && (
                <CircuitLink circuitId={race.circuitId}>{locationLabel}</CircuitLink>
              )}
            </span>
          </motion.p>
        )}

        {!liveAvailable && countdown && (
          <motion.div {...child(3)}>
            <CountdownDisplay parts={countdown} size="lg" label={`${featured?.label ?? 'Session'} starts in`} />
          </motion.div>
        )}

        <motion.div className="flex flex-col gap-pw-2 sm:flex-row" {...child(4)}>
          {liveAvailable ? (
            <>
              <Link to="/live" className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto no-underline')}>Open live timing</Link>
              <Link to={weekendTo} className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'w-full sm:w-auto no-underline text-ink')}>Weekend schedule</Link>
            </>
          ) : (
            <Link to={weekendTo} className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto no-underline')}>Weekend schedule</Link>
          )}
        </motion.div>
      </div>

      {/* Reserved at lg+ so the trace arriving later shifts nothing; below lg there is no trace and no request. */}
      <div className="hidden items-center justify-center lg:col-span-5 lg:flex" aria-hidden="true">
        {coords && (
          <motion.div
            className="w-full"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ duration: DUR.routeIn }}
          >
            <TrackTrace coords={coords} className="h-auto w-full" />
          </motion.div>
        )}
      </div>

      {ladder.length > 0 && (
        <div className="min-w-0 lg:col-span-12">
          <SessionTimeline sessions={ladder} tz={tz} now={now} />
        </div>
      )}
    </Panel>
  )
}
