import { Link } from 'react-router-dom'
import { Diamond } from 'lucide-react'
import VizSkeleton from '../viz/VizSkeleton'
import GapBar from '../viz/GapBar'
import TeamBar from '../viz/TeamBar'
import { parseSeconds, quantizeMax, RACE_STEPS } from '../viz/gapScale'
import { buttonVariants } from '../ui/button-variants'
import { cn } from '@/lib/utils'
import { ctorColor } from '../../styles/vizPalette'
import { normalizeLastSession } from '../../utils/normalizeDashboard'

/** One result row. The whole row is the link/button; its accessible name is "{driver}, position {n}, {time}". */
function ResultRow({ driver, gap, max, onDriverClick }) {
  const time = driver.time || (driver.points ? `+${driver.points} pts` : '—')
  const name = `${driver.name}, position ${driver.position}, ${time}`
  const body = (
    <>
      <span aria-hidden="true" className="num w-5 shrink-0 text-right text-ink-2">{driver.position}</span>
      <TeamBar color={ctorColor(driver.constructorId)} />
      <span aria-hidden="true" className="min-w-0 flex-1 truncate text-base font-medium text-ink">{driver.name}</span>
      {gap !== null && <GapBar value={gap} max={max} color={ctorColor(driver.constructorId)} className="w-12 md:w-16" />}
      <span aria-hidden="true" className="num min-w-14 shrink-0 text-right text-ink">{time}</span>
    </>
  )
  const cls = 'flex min-h-12 w-full items-center gap-pw-3 py-pw-2 text-left text-ink no-underline [@media(hover:hover)]:hover:bg-hover'
  if (onDriverClick && driver.driverId) {
    return (
      <button type="button" aria-label={name} className={cn(cls, 'cursor-pointer border-0 bg-transparent')} onClick={() => onDriverClick({ driverId: driver.driverId, name: driver.name })}>
        {body}
      </button>
    )
  }
  return <div role="group" aria-label={name} className={cls}>{body}</div>
}

export default function LastSessionPanel({ session: rawSession, loading, error, onRetry, onDriverClick }) {
  const session = normalizeLastSession(rawSession)
  if (loading) {
    return (
      <section className="section" aria-label="Last session">
        <h2 className="text-heading mb-pw-4 text-ink">Last session</h2>
        <VizSkeleton variant="rows" name="last session" count={3} />
      </section>
    )
  }
  if (error && !session) {
    return (
      <section className="section" aria-labelledby="last-session-h" role="alert">
        <h2 id="last-session-h" className="text-heading mb-pw-3 text-ink">Last session</h2>
        <p className="mb-pw-3 text-sm text-ink-2">Last session unavailable.</p>
        <button type="button" className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')} onClick={onRetry}>Try again</button>
      </section>
    )
  }
  if (!session) {
    return (
      <section className="section" aria-labelledby="last-session-h">
        <h2 id="last-session-h" className="text-heading mb-pw-3 text-ink">Last session</h2>
        <p className="text-sm text-ink-2">Results appear after the first session.</p>
      </section>
    )
  }

  const isPodiumType = session.sessionType === 'Race' || session.sessionType === 'Sprint'
  const isQualiType  = session.sessionType === 'Qualifying' || session.sessionType === 'Sprint Qualifying'
  const isPractice   = ['FP1', 'FP2', 'FP3'].includes(session.sessionType)
  const rows = isPodiumType ? session.podium : isQualiType ? session.top3 : null
  const gaps = isPodiumType && rows ? rows.map((d, i) => (i === 0 ? null : parseSeconds(d.time))) : (rows ?? []).map(() => null)
  const max = quantizeMax(Math.max(0, ...gaps.filter((g) => g !== null)), RACE_STEPS)
  const dateLabel = session.date ? new Date(session.date + 'T12:00:00Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }) : null

  return (
    <section className="section flex flex-col" aria-labelledby="last-session-h">
      <div className="flex items-baseline justify-between gap-pw-3">
        <h2 id="last-session-h" className="text-heading text-ink">Last session</h2>
        <span className="num text-ink-3">{session.sessionLabel}{dateLabel ? `, ${dateLabel}` : ''}</span>
      </div>

      {rows && rows.length > 0 ? (
        <ol className="mt-pw-3 list-none divide-y divide-edge-soft">
          {rows.map((driver, i) => (
            <li key={driver.driverId ?? i}>
              <ResultRow driver={driver} gap={gaps[i]} max={max} onDriverClick={onDriverClick} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-pw-3 text-sm text-ink-2">
          {session.resultsPending ? 'Results pending' : isPractice ? `${session.sessionLabel} completed` : 'No results yet'}
        </p>
      )}

      {isPodiumType && session.fastestLap && (
        <p className="mt-pw-1 flex min-h-11 items-center gap-pw-2 border-t border-edge-soft text-sm">
          <Diamond aria-hidden="true" className="size-3.5 shrink-0 fill-current text-violet" />
          <span className="font-semibold text-violet">Fastest lap</span>
          <span className="min-w-0 flex-1 truncate font-medium text-ink">{session.fastestLap.name}</span>
          <span className="num text-violet">{session.fastestLap.time}</span>
        </p>
      )}

      {session.season && session.round && (
        <Link
          to={`/races/${encodeURIComponent(session.season)}/${encodeURIComponent(session.round)}`}
          className="mt-auto inline-flex min-h-11 items-center self-start text-sm font-semibold text-steel hover:text-steel-hi no-underline"
        >
          Full results
        </Link>
      )}
    </section>
  )
}
