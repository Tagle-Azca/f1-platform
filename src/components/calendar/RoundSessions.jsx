import SessionTimeline from '../viz/SessionTimeline'
import { sessionsAt } from './calendarModel'
import { tzAbbr } from '../../utils/timezone'

/** Expanded body of a round: session caption in the selected zone plus the weekend timeline. */
export default function RoundSessions({ schedule, tz, now }) {
  const sessions = sessionsAt(schedule, now)
  if (!sessions.length) return null
  return (
    <div className="pb-pw-3 pt-pw-1">
      <p className="text-xs text-ink-3">Times in {tzAbbr(tz)}</p>
      <SessionTimeline sessions={sessions} tz={tz} now={now} />
    </div>
  )
}
