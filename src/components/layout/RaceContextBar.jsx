import { useEffect, useId, useRef, useState } from 'react'
import { useRace } from '../../contexts/raceContextStore'
import { formatEta } from '../../utils/eta'
import { safeString } from '../../utils/safeText'
import { useLiveStatus } from '../../contexts/LiveStatusContext'
import { useNow } from '../../hooks/useNow'
import { Check } from 'lucide-react'
import { countryFlag, countryCode } from '../../utils/flags'
import { buildSessionList, getFeaturedSession } from '../../utils/sessionSchedule'
import { TZ_OPTIONS, tzAbbr } from '../../utils/timezone'
import { useTimezone } from '../../hooks/useTimezone'
import { features } from '../../config/features'
import LivePill from '../ui/LivePill'
import { Skeleton } from '../ui/skeleton'

/** Flag image with an outlined ISO-code fallback (never a filled box) when the code is unknown or the image fails. */
function RaceFlag({ country }) {
  const [failed, setFailed] = useState(false)
  const url = countryFlag(country)
  if (url && !failed) {
    return <img src={url} alt="" width="28" height="20" className="h-5 w-7 shrink-0 rounded-[2px] object-cover" onError={() => setFailed(true)} />
  }
  const code = (countryCode(country) ?? safeString(country).slice(0, 2)).toUpperCase()
  if (!code) return null
  return <span aria-hidden="true" className="inline-flex h-5 w-7 shrink-0 items-center justify-center rounded-[2px] border border-edge font-mono text-xs text-ink-2">{code}</span>
}

const CHIP_STATUS_TEXT = { done: 'completed', next: 'next', live: 'live now', upcoming: 'upcoming' }

function SessionState({ loaded, failed, nextRace, now }) {
  const { available: liveAvailable, sessionName } = useLiveStatus() ?? {}

  if (liveAvailable) {
    return (
      <>
        <LivePill>Live</LivePill>
        <span className="truncate font-display text-base font-semibold text-ink">{safeString(sessionName, 'Session') || 'Session'}</span>
      </>
    )
  }
  if (!loaded) return <Skeleton className="h-5 w-[120px]" aria-label="Loading session" />
  if (failed && !nextRace) return <span className="text-sm text-ink-3">Session data unavailable</span>

  const featured = nextRace ? getFeaturedSession(nextRace.schedule, nextRace.currentSession) : null
  if (!featured) return <span className="text-sm text-ink-3">No session scheduled</span>

  return (
    <>
      <span className="truncate font-display text-base font-semibold text-ink">{featured.label}</span>
      <span className="shrink-0 text-sm text-ink-2">
        <span className="sr-only">Upcoming, </span>{formatEta(featured.dateTime, now)}
      </span>
    </>
  )
}

function TimezonePicker() {
  const [tz, setTz] = useTimezone()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus() } }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen(v => !v)}
        className="min-h-10 px-pw-3 rounded-md bg-white/5 border border-edge-soft text-ink-2 text-sm font-medium cursor-pointer hover:text-ink"
      >
        <span className="sr-only">Time zone: </span>Times in {tzAbbr(tz)}
      </button>
      {open && (
        <ul
          id={listId}
          className="absolute right-0 top-[calc(100%+6px)] z-[60] min-w-56 max-h-72 overflow-y-auto list-none rounded-md bg-panel border border-edge shadow-float"
        >
          {TZ_OPTIONS.map(opt => (
            <li key={opt.value}>
              <button
                type="button"
                aria-pressed={tz === opt.value}
                onClick={() => { setTz(opt.value); setOpen(false); btnRef.current?.focus() }}
                className={[
                  'w-full text-left min-h-11 px-pw-3 border-0 border-b border-edge-soft text-sm cursor-pointer',
                  tz === opt.value ? 'bg-steel-soft text-steel font-semibold' : 'bg-transparent text-ink-2 hover:text-ink',
                ].join(' ')}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Persistent top bar. Mobile: one line (session name + LivePill or countdown).
 * md+: race identity, session chips (text states, not color only), time zone, action slot.
 */
export default function RaceContextBar() {
  const { nextRace, totalRounds, loaded, failed } = useRace()
  const now = useNow(60000)

  const sessions = nextRace ? buildSessionList(nextRace.schedule, nextRace.currentSession) : []

  return (
    <header className="sticky top-0 z-40 flex items-center gap-pw-3 px-pw-4 md:px-pw-6 min-h-header bg-bg border-b border-edge-soft">
      {/* Mobile: compact state line */}
      <div className="md:hidden flex flex-1 min-w-0 items-center gap-pw-2" role="status">
        <SessionState loaded={loaded} failed={failed} nextRace={nextRace} now={now} />
      </div>

      {/* md+: identity + chips */}
      <div className="hidden md:flex flex-1 min-w-0 items-center gap-pw-4">
        {nextRace && (
          <>
            <RaceFlag country={nextRace.country} />
            <div className="min-w-0">
              <p className="font-display text-base font-semibold leading-tight text-ink truncate">{safeString(nextRace.raceName)}</p>
              <p className="text-xs text-ink-3 truncate">
                Round {safeString(nextRace.round, '—')} of {safeString(totalRounds, '—')}{safeString(nextRace.locality) ? ` · ${safeString(nextRace.locality)}` : ''}
              </p>
            </div>
            <ul className="flex items-center gap-pw-2 list-none">
              {sessions.map(s => (
                <li
                  key={s.key}
                  className={[
                    'inline-flex min-h-8 items-center gap-1 whitespace-nowrap rounded-pill px-pw-3 text-xs font-medium border',
                    s.status === 'next' ? 'border-transparent bg-steel text-bg' : '',
                    s.status === 'live' ? 'border-live bg-live-soft text-ink' : '',
                    s.status === 'done' ? 'border-transparent text-ink-3' : '',
                    s.status === 'upcoming' ? 'border-edge text-ink-2' : '',
                  ].join(' ')}
                >
                  {s.status === 'done' && <Check aria-hidden="true" className="size-3" />}
                  {s.status === 'live' && <span aria-hidden="true" className="size-1.5 rounded-full bg-live" />}
                  {s.chip}<span className="sr-only"> ({CHIP_STATUS_TEXT[s.status]})</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {!nextRace && (
          <div className="flex items-center gap-pw-2 min-w-0" role="status">
            <SessionState loaded={loaded} failed={failed} nextRace={nextRace} now={now} />
          </div>
        )}
      </div>

      <div className="hidden md:block"><TimezonePicker /></div>

      {/* Reserved action slot: notifications / share (gated by features.social) */}
      {features.social && <div data-slot="topbar-actions" className="flex items-center gap-pw-2" />}
    </header>
  )
}
