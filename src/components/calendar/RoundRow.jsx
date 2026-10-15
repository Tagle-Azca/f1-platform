import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import CircuitLink from '../circuits/CircuitLink'
import CalendarFlag from './CalendarFlag'
import StatusChip from './StatusChip'
import RoundSessions from './RoundSessions'
import { hasSchedule, isThisWeekend, resultsPath, winnerName } from './calendarModel'
import { safeString } from '../../utils/safeText'
import { DUR, EASE_OUT, useReducedMotion } from '../../styles/motion'

const LINK = 'min-h-11 inline-flex items-center rounded-md font-display text-base font-semibold leading-5 outline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-steel'

/** One round: date stub, identity, sprint mark, winner, status and (current season with times) a session disclosure. */
export default function RoundRow({ row, season, tz, now, current, defaultOpen = false }) {
  const { race, status, date } = row
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(defaultOpen)
  const uid = useId()
  const nameId = `round-link-${race.round}`
  const panelId = `${uid}-sessions`

  const name = safeString(race.raceName, 'Grand Prix')
  const loc = race.Circuit?.Location ?? {}
  const locality = safeString(loc.locality)
  const circuitName = safeString(race.Circuit?.circuitName)
  const winner = status === 'done' ? winnerName(race.winner) : ''
  const expandable = current && hasSchedule(race)
  const emphasis = status === 'next' || status === 'live'
  const to = status === 'done' || race.hasResults ? resultsPath(season, race.round) : emphasis && current ? '/next-race' : null

  const nameCls = status === 'done' ? 'text-ink-2' : 'text-ink'
  const nameNode = to
    ? <Link id={nameId} to={to} className={`${LINK} ${nameCls}`}><span className="truncate">{name}</span></Link>
    : <span id={nameId} className={`inline-flex min-h-11 items-center font-display text-base font-semibold leading-5 ${nameCls}`}><span className="truncate">{name}</span></span>

  return (
    <li
      id={`round-${race.round}`}
      aria-current={emphasis ? 'true' : undefined}
      data-status={status}
      className={`border-b border-edge-soft py-pw-2 pr-pw-2 ${emphasis ? 'border-l-2 border-l-steel bg-steel-soft pl-pw-3' : 'pl-pw-1'}`}
    >
      <div className="grid grid-cols-[3rem_minmax(0,1fr)_2.75rem] items-center gap-x-pw-3 gap-y-pw-1 md:grid-cols-[4rem_minmax(0,1fr)_auto_minmax(0,10rem)_auto_2.75rem]">
        <div className="text-center md:text-left">
          {date ? (
            <time dateTime={date.iso} className="block">
              <span className="block font-display text-heading text-ink">{date.day}</span>
              <span className="block text-xs text-ink-3">{date.weekday} {date.month}</span>
            </time>
          ) : <span className="text-xs text-ink-3">TBC</span>}
        </div>

        <div className="flex min-w-0 items-center gap-pw-3">
          <CalendarFlag country={loc.country} />
          <div className="min-w-0">
            {nameNode}
            <p className="truncate text-xs text-ink-3">
              Round {safeString(race.round, '-')}{locality ? `, ${locality}` : ''}
              {circuitName ? <>{', '}<CircuitLink circuitId={race.Circuit?.circuitId}>{circuitName}</CircuitLink></> : null}
            </p>
          </div>
        </div>

        {expandable && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`Show sessions for ${name}`}
            onClick={() => setOpen((v) => !v)}
            className="col-start-3 row-start-1 inline-flex size-11 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-ink-2 outline-offset-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-steel md:col-start-6"
          >
            <ChevronDown aria-hidden="true" className={`size-4 motion-safe:transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}

        <div className="col-start-2 col-span-2 flex flex-wrap items-center gap-pw-2 md:contents">
          {race.hasSprint ? (
            <span className="inline-flex min-h-6 shrink-0 items-center rounded-pill border border-edge px-pw-3 text-xs text-ink-2">Sprint</span>
          ) : <span aria-hidden="true" className="hidden md:block" />}
          {winner ? (
            <p className="min-w-0 shrink text-sm text-ink"><span className="text-xs text-ink-3">Winner </span><span className="truncate">{winner}</span></p>
          ) : <span aria-hidden="true" className="hidden md:block" />}
          <StatusChip status={status} weekend={status === 'next' && isThisWeekend(race, now)} />
        </div>
      </div>

      {expandable && (
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="sessions"
              id={panelId}
              role="region"
              aria-labelledby={nameId}
              className="overflow-hidden"
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }}
              transition={{ duration: reduced ? 0 : DUR.base, ease: EASE_OUT }}
            >
              <RoundSessions schedule={race.schedule} tz={tz} now={now} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </li>
  )
}
