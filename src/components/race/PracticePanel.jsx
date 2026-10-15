import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import VizSkeleton from '../viz/VizSkeleton'
import SessionTable from './SessionTable'
import { snapshotRows } from './resultsModel'
import { sessionClock, sessionsAt } from '../calendar/calendarModel'
import { normalizeSchedule } from '../../utils/normalizeDashboard'
import { useTimezone } from '../../hooks/useTimezone'
import { racesApi } from '../../services/api'
import { useMediaQuery } from '../../hooks/useMediaQuery'

const KEYS = ['fp1', 'fp2', 'fp3']
const SHOWN = 10
const STATUS_WORD = { live: 'Live', done: 'Done', upcoming: 'Upcoming', next: 'Upcoming' }

/** One practice session: header with time and status, then the live-timing classification when the backend saved one. */
function Session({ session, season, round, defaultOpen, tz }) {
  const wide = useMediaQuery('(min-width: 768px)')
  const modern = parseInt(season, 10) >= 2023
  const wanted = session.status === 'done' && modern && Boolean(round)
  const [snap, setSnap] = useState({ key: '', status: 'idle', data: null })
  const key = `${season}|${round}|${session.key}`

  useEffect(() => {
    if (!wanted) return undefined
    let alive = true
    racesApi.getSessionSnapshot(season, round, session.key)
      .then((s) => { if (alive) setSnap({ key, status: 'ready', data: s || null }) })
      .catch(() => { if (alive) setSnap({ key, status: 'error', data: null }) })
    return () => { alive = false }
  }, [wanted, season, round, session.key, key])

  const current = snap.key === key ? snap : null
  const loading = wanted && !current
  const classification = Array.isArray(current?.data?.classification) ? current.data.classification : []
  const clock = sessionClock(session.dateTime, tz)

  let body
  if (loading) body = <VizSkeleton variant="rows" name={`${session.label} classification`} count={5} />
  else if (classification.length) {
    body = (
      <>
        <SessionTable
          kind="snapshot" rows={snapshotRows({ ...current.data, classification: classification.slice(0, SHOWN) }, { column: 'bestLap' })}
          wide={wide} label={`${session.label} classification`} lastLabel="Best lap"
        />
        {classification.length > SHOWN && <p className="px-pw-3 py-pw-2 text-xs text-ink-3">And {classification.length - SHOWN} more drivers.</p>}
      </>
    )
  } else {
    body = (
      <p className="px-pw-3 py-pw-3 text-sm text-ink-2">
        {!modern ? 'Practice data before 2023 is not stored in Pitwall.'
          : session.status === 'upcoming' || session.status === 'next' ? 'Lap times appear here once the session has run.'
            : 'No classification was saved for this session.'}
      </p>
    )
  }

  return (
    <details open={defaultOpen} className="group border-b border-edge-soft last:border-b-0">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-pw-3 px-pw-3 py-pw-2 text-ink outline-offset-[-2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-steel [&::-webkit-details-marker]:hidden [@media(hover:hover)]:hover:bg-hover">
        <span className="font-display text-base font-semibold">{session.label}</span>
        <span className="num text-xs text-ink-3">{clock.day} {clock.time}</span>
        <span className="ml-auto inline-flex min-h-6 items-center rounded-pill border border-edge px-pw-2 text-xs text-ink-2">{STATUS_WORD[session.status]}</span>
        <ChevronDown aria-hidden="true" size={16} className="shrink-0 text-ink-3 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div>{body}</div>
    </details>
  )
}

/** Free practice sessions that have started, newest open. Times are shown in the visitor's chosen zone. */
export default function PracticePanel({ schedule, season, round, now }) {
  const [tz] = useTimezone()
  const sessions = useMemo(
    () => sessionsAt(normalizeSchedule(schedule), now).filter((s) => KEYS.includes(s.key) && s.start <= now),
    [schedule, now],
  )
  if (!sessions.length) return <p className="px-pw-3 py-pw-4 text-sm text-ink-2">No practice sessions have run yet.</p>
  const lastDone = [...sessions].reverse().find((s) => s.status === 'done')?.key ?? sessions[sessions.length - 1].key
  return (
    <div>
      {sessions.map((s) => <Session key={s.key} session={s} season={season} round={round} tz={tz} defaultOpen={s.key === lastDone} />)}
    </div>
  )
}
