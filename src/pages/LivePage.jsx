import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import LivePill from '../components/ui/LivePill'
import EmptyState from '../components/ui/EmptyState'
import VizSkeleton from '../components/viz/VizSkeleton'
import LapProgress from '../components/viz/LapProgress'
import TimingTower from '../components/live/TimingTower'
import TrackStatusBanner from '../components/live/TrackStatusBanner'
import { isStatusActive } from '../components/live/trackStatus'
import { dashboardApi } from '../services/api'
import { useLiveStatus } from '../contexts/LiveStatusContext'
import { useRace } from '../contexts/raceContextStore'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useStatusAnnouncer } from '../hooks/useStatusAnnouncer'
import { useNow } from '../hooks/useNow'
import { getFeaturedSession } from '../utils/sessionSchedule'
import { formatEta } from '../utils/eta'
import { asObjectArray } from '../utils/safeArray'
import { safeString, safeText } from '../utils/safeText'
import ShellBoundary from '../components/layout/ShellBoundary'

const POLL_MS = 2000
const fmtTime = (iso) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function NoLiveSession() {
  const { nextRace } = useRace()
  const now = useNow(60000)
  const featured = nextRace ? getFeaturedSession(nextRace.schedule, nextRace.currentSession) : null
  return (
    <div className="panel panel--md text-center">
      <p className="text-lg font-semibold text-ink">No live session</p>
      {featured && (
        <p className="mt-pw-2 text-base text-ink-2">
          Next: {featured.label} <span className="text-ink">{formatEta(featured.dateTime, now)}</span>
        </p>
      )}
      <Link to="/next-race" className="btn btn--primary mt-pw-4 no-underline">See the weekend schedule</Link>
    </div>
  )
}

export default function LivePage() {
  const [rawData, setData]   = useState(null)
  const [rawStale, setStale] = useState(false)
  const [lastOk, setLastOk] = useState(null)
  const [connecting, setConnecting] = useState(true)
  const { available: liveAvailable } = useLiveStatus() ?? {}
  const isDesktop = useMediaQuery('(min-width: 768px)')
  // Without a live session nothing from a previous session may linger.
  const data = liveAvailable ? rawData : null
  const stale = liveAvailable && rawStale
  const announcement = useStatusAnnouncer(data)

  // Only poll the classification endpoint while the SSE status says a session is live.
  // Endpoint and 2s cadence are unchanged from before the redesign.
  useEffect(() => {
    if (!liveAvailable) return
    let cancelled = false
    const poll = () => {
      dashboardApi.getLive()
        .then(d => { if (!cancelled) { setData(d?.isLive ? d : null); setStale(false); setLastOk(Date.now()); setConnecting(false) } })
        .catch(() => { if (!cancelled) { setStale(true); setConnecting(false) } })
    }
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [liveAvailable])

  const sc = data?.trackStatus
  const classification = asObjectArray(data?.classification)

  return (
    <PageWrapper stagger>
      {/* One polite live region: status changes only, at most one announcement per 5s */}
      <div className="sr-only-live" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>

      {stale && (
        <p role="status" className="mb-pw-3 rounded-md border border-edge bg-panel px-pw-4 py-pw-3 text-sm text-ink">
          Live feed interrupted, retrying{lastOk ? `. Last update ${fmtTime(lastOk)}` : ''}.
        </p>
      )}

      {!data ? (
        liveAvailable && connecting ? (
          <div>
            <h1 className="text-title mb-pw-1 text-ink">Live timing</h1>
            <p className="mb-pw-3 text-sm text-ink-2">Connecting</p>
            <VizSkeleton variant="tower" name="live timing" count={20} />
          </div>
        ) : (
          <>
            <h1 className="text-title mb-pw-3 text-ink">Live timing</h1>
            <NoLiveSession />
          </>
        )
      ) : (
        <div>
          <header className="mb-pw-4">
            <div className="mb-pw-2 flex flex-wrap items-center gap-pw-2">
              <LivePill>Live</LivePill>
              <span className="inline-flex min-h-6 items-center rounded-pill border border-edge px-pw-3 text-xs font-medium text-ink-2">{safeString(data.sessionName)}</span>
            </div>
            <div className="flex flex-col gap-pw-2 lg:flex-row lg:items-end lg:justify-between lg:gap-pw-6">
              <h1 className="text-title min-w-0 text-ink [overflow-wrap:anywhere]">{safeString(data.raceName)}</h1>
              <div className="flex flex-col gap-pw-2 lg:w-72 lg:shrink-0">
                <p className="num flex items-center justify-between gap-pw-3 text-ink-2">
                  {safeText(data.currentLap) ? <span>Lap {safeText(data.currentLap)}{safeText(data.totalLaps) ? `/${safeText(data.totalLaps)}` : ''}</span> : <span />}
                  <span className="text-ink-3">Updated {fmtTime(data.updatedAt)}</span>
                </p>
                <LapProgress lap={data.currentLap} total={data.totalLaps} />
              </div>
            </div>
          </header>

          {isStatusActive(sc) && <TrackStatusBanner status={sc} className="mb-pw-3" />}

          {classification.length ? (
            <ShellBoundary
              resetKey={safeString(data.updatedAt)}
              fallback={<EmptyState type="empty" message="Timing data is being refreshed" height={120} />}
            >
              <TimingTower classification={classification} isRaceType={data.isRaceType === true} expandable={!isDesktop} stale={stale} sessionKey={safeString(data.sessionName)} />
            </ShellBoundary>
          ) : (
            <EmptyState type="empty" message="Waiting for data" height={120} />
          )}

          <p className="mt-pw-3 text-xs text-ink-3">Live feed, refreshes every 2 seconds</p>
        </div>
      )}
    </PageWrapper>
  )
}
