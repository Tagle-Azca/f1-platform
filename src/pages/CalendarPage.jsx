import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { buttonVariants } from '../components/ui/button-variants'
import { cn } from '@/lib/utils'
import CalendarHero from '../components/calendar/CalendarHero'
import CalendarToolbar from '../components/calendar/CalendarToolbar'
import CalendarSkeleton from '../components/calendar/CalendarSkeleton'
import MonthGroup from '../components/calendar/MonthGroup'
import { SEASON_NOTE, parseSeason, seasonOptions, markRounds, groupByMonth, heroState } from '../components/calendar/calendarModel'
import { racesApi } from '../services/api'
import { useNow } from '../hooks/useNow'
import { useTimezone } from '../hooks/useTimezone'
import { asObjectArray } from '../utils/safeArray'
import { riseProps, useReducedMotion } from '../styles/motion'
import { useMediaQuery } from '../hooks/useMediaQuery'

const CURRENT_YEAR = new Date().getFullYear()
const SEASONS = seasonOptions(CURRENT_YEAR)

export default function CalendarPage() {
  const reduced = useReducedMotion()
  const [params, setParams] = useSearchParams()
  const raw = params.get('season')
  const parsed = parseSeason(raw, CURRENT_YEAR)
  const season = parsed ?? String(CURRENT_YEAR)
  const current = season === String(CURRENT_YEAR)
  const [tz, setTz] = useTimezone()
  const now = useNow(60000)
  const isLg = useMediaQuery('(min-width: 1024px)')
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ key: '', races: null, error: false })
  const key = `${season}:${attempt}`

  // An invalid ?season= is corrected in place (replace); a user choice is always a push.
  useEffect(() => { if (raw !== null && parsed === null) setParams({ season: String(CURRENT_YEAR) }, { replace: true }) }, [raw, parsed, setParams])

  useEffect(() => {
    let live = true
    racesApi.getBySeason(season)
      .then((races) => { if (live) setResult({ key, races: asObjectArray(races), error: false }) })
      .catch(() => { if (live) setResult({ key, races: null, error: true }) })
    return () => { live = false }
  }, [season, key])

  const loading = result.key !== key
  const marked = useMemo(() => (result.races ? markRounds(result.races, now, { current }) : []), [result.races, now, current])
  const groups = useMemo(() => groupByMonth(marked, tz), [marked, tz])
  const hero = useMemo(() => heroState(marked, now, { current }), [marked, now, current])
  const target = current ? marked.find((m) => m.status === 'live' || m.status === 'next') : null
  const noSchedule = !current && marked.length > 0

  const jump = useCallback(() => {
    if (!target) return
    const li = document.getElementById(`round-${target.race.round}`)
    if (!li) return
    li.scrollIntoView?.({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
    document.getElementById(`round-link-${target.race.round}`)?.focus({ preventScroll: true })
  }, [target, reduced])

  const rise = (i) => (reduced ? { initial: false } : riseProps(i, false))

  return (
    <PageWrapper stagger>
      <PageHeader title="Season calendar" subtitle="Every round of the season, with session times for the current one." />
      <div className="flex flex-col gap-pw-6">
        {!loading && !result.error && <CalendarHero hero={hero} season={season} tz={tz} now={now} />}

        <CalendarToolbar
          season={season}
          seasons={SEASONS}
          onSeason={(v) => setParams({ season: v })}
          tz={tz}
          onTz={setTz}
          canJump={!loading && !!target}
          onJump={jump}
        />
        {noSchedule && <p className="text-sm text-ink-2">{SEASON_NOTE}</p>}

        {loading && <CalendarSkeleton />}
        {!loading && result.error && (
          <EmptyState
            type="error"
            message="Could not load the calendar"
            height={120}
            action={<button type="button" className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11 cursor-pointer gap-pw-2 px-pw-3')} onClick={() => setAttempt((n) => n + 1)}>Try again</button>}
          />
        )}
        {!loading && !result.error && marked.length === 0 && (
          <p className="text-sm text-ink-2">No rounds found for {season}.</p>
        )}
        {!loading && !result.error && marked.length > 0 && (
          <motion.section aria-labelledby="calendar-rounds-h" className="flex flex-col gap-pw-6" {...rise(1)}>
            <h2 id="calendar-rounds-h" className="text-heading text-ink">Rounds</h2>
            {groups.map((g) => (
              <MonthGroup
                key={g.key}
                group={g}
                season={season}
                tz={tz}
                now={now}
                current={current}
                defaultOpenKey={isLg && target ? target.race.round : null}
              />
            ))}
          </motion.section>
        )}
      </div>
    </PageWrapper>
  )
}
