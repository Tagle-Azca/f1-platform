import { useState } from 'react'
import SessionTimeline from '../viz/SessionTimeline'
import VizSkeleton from '../viz/VizSkeleton'
import { TZ_OPTIONS, getInitialTZ, saveTZ } from '../../utils/timezone'
import { buildSessionList } from '../../utils/sessionSchedule'
import { useNow } from '../../hooks/useNow'

/**
 * Weekend schedule section: a SessionTimeline plus per-day forecast (Open-Meteo daily data, keyed by date).
 * `weather` is null while loading or when the request failed; `weatherFailed` shows one quiet line.
 */
export default function WeekendSchedulePanel({ schedule, liveKey, nextSessionKey, weather, weatherFailed = false, loading = false }) {
  const [tz, setTz] = useState(getInitialTZ)
  const now = useNow(60000)

  function selectTz(e) {
    setTz(e.target.value)
    saveTZ(e.target.value)
  }

  // The page knows the live and next keys exactly; trust them over the clock-derived status.
  const sessions = (schedule ? buildSessionList(schedule, null) : []).map(s => ({
    ...s,
    status: s.key === liveKey ? 'live' : s.status === 'done' ? 'done' : s.key === nextSessionKey ? 'next' : 'upcoming',
  }))

  return (
    <section className="section" aria-labelledby="schedule-h">
      <div className="flex flex-col gap-pw-2 md:flex-row md:items-center md:justify-between">
        <h2 id="schedule-h" className="text-heading text-ink">Weekend schedule</h2>
        <label className="flex flex-col gap-1 text-xs text-ink-2 md:flex-row md:items-center md:gap-pw-2">
          Times in
          <select
            value={tz}
            onChange={selectTz}
            className="min-h-11 cursor-pointer rounded-md border border-edge bg-panel px-pw-2 text-sm font-medium text-ink md:min-h-9"
          >
            {TZ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>
      {weatherFailed && <p className="mt-pw-2 text-xs text-ink-3">Forecast unavailable</p>}

      <div className="mt-pw-3">
        {loading ? (
          <VizSkeleton variant="timeline" name="schedule" />
        ) : sessions.length ? (
          <SessionTimeline sessions={sessions} tz={tz} now={now} weather={weather} caption />
        ) : (
          <p className="text-sm text-ink-2">Schedule not available yet.</p>
        )}
      </div>
    </section>
  )
}
