import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import CalendarFlag from './CalendarFlag'
import { sessionClock, resultsPath, winnerName } from './calendarModel'
import LivePill from '../ui/LivePill'
import { buttonVariants } from '../ui/button-variants'
import { formatEta } from '../../utils/eta'
import { safeString } from '../../utils/safeText'
import { tzAbbr } from '../../utils/timezone'
import { riseProps, useReducedMotion } from '../../styles/motion'

const CTA = buttonVariants({ variant: 'default' })

function announcement(h) {
  if (h.kind === 'live' && h.live) return `Live now: ${h.live.label}, ${safeString(h.race.raceName)}`
  if (h.kind === 'next' && h.next) return `Next: ${h.next.label}, ${safeString(h.race.raceName)}`
  return ''
}

/** The round that matters now (live, else next), or a season summary. Unboxed: one steel accent, no panel. */
export default function CalendarHero({ hero, season, tz, now }) {
  const reduced = useReducedMotion()
  const rise = reduced ? { initial: false } : riseProps(0, false)

  if (hero.kind === 'empty') return null

  if (hero.kind === 'summary') {
    return (
      <motion.section className="section" aria-labelledby="calendar-hero-h" {...rise}>
        <p className="text-xs text-ink-3">{season} season</p>
        <h2 id="calendar-hero-h" className="text-title text-ink">{hero.rounds} {hero.rounds === 1 ? 'round' : 'rounds'}</h2>
        <p className="mt-pw-2 text-sm text-ink-2">{hero.sprints} sprint {hero.sprints === 1 ? 'weekend' : 'weekends'}</p>
      </motion.section>
    )
  }

  if (hero.kind === 'complete') {
    const path = resultsPath(season, hero.race.round)
    const winner = winnerName(hero.race.winner)
    return (
      <motion.section className="section" aria-labelledby="calendar-hero-h" {...rise}>
        <p className="text-xs text-ink-3">Season complete</p>
        <h2 id="calendar-hero-h" className="text-title text-ink">{hero.rounds} rounds done</h2>
        <p className="mt-pw-2 text-sm text-ink-2">
          Last round: {safeString(hero.race.raceName)}{winner ? `, won by ${winner}` : ''}
        </p>
        {path && <Link to={path} className={`${CTA} mt-pw-3`}>Open last round results</Link>}
      </motion.section>
    )
  }

  const { race, live, next, upcoming } = hero
  const loc = race.Circuit?.Location ?? {}
  const zone = tzAbbr(tz)
  const isLive = hero.kind === 'live'

  return (
    <motion.section className="section" aria-labelledby="calendar-hero-h" {...rise}>
      <p role="status" className="sr-only">{announcement(hero)}</p>
      <div className="grid gap-pw-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0">
          {isLive ? <LivePill>Live now{live ? `: ${live.label}` : ''}</LivePill> : <p className="text-xs text-ink-3">{hero.thisWeekend ? 'This weekend' : 'Next round'}</p>}
          <h2 id="calendar-hero-h" className="mt-pw-1 text-title text-ink">{safeString(race.raceName, 'Grand Prix')}</h2>
          <p className="mt-pw-2 flex items-center gap-pw-2 text-sm text-ink-2">
            <CalendarFlag country={loc.country} />
            <span className="min-w-0 truncate">Round {safeString(race.round, '-')} of {hero.rounds}{safeString(loc.locality) ? `, ${safeString(loc.locality)}` : ''}</span>
          </p>
          {isLive && live && <p className="mt-pw-3 text-sm text-ink-2">Ends about <span className="num">{sessionClock(new Date(live.end).toISOString(), tz).time}</span> {zone}</p>}
          {!isLive && next && (
            <p className="mt-pw-3">
              <span className="text-count text-ink">{formatEta(next.dateTime, now)}</span>
              <span className="mt-pw-1 block text-sm text-ink-2">{next.label}</span>
            </p>
          )}
          {hero.unpublished && <p className="mt-pw-3 text-sm text-ink-2">Session times not published yet.</p>}
        </div>

        <div className="min-w-0">
          {upcoming.length > 0 && (
            <>
              <h3 className="text-xs text-ink-3">Next sessions ({zone})</h3>
              <ul className="mt-pw-2 list-none">
                {upcoming.map((s) => {
                  const c = sessionClock(s.dateTime, tz)
                  return (
                    <li key={s.key} className="flex min-h-9 items-baseline gap-pw-3 border-b border-edge-soft text-sm">
                      <span className="num w-20 shrink-0 text-ink-2">{c.day} {c.time}</span>
                      <span className="text-ink">{s.label}</span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
          <Link to="/next-race" className={`${CTA} mt-pw-4`}>Open race weekend</Link>
        </div>
      </div>
    </motion.section>
  )
}
