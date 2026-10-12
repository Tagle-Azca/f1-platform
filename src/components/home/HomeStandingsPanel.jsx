import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TabBar from '../ui/TabBar'
import EmptyState from '../ui/EmptyState'
import VizSkeleton from '../viz/VizSkeleton'
import GapBar from '../viz/GapBar'
import TeamBar from '../viz/TeamBar'
import { buttonVariants } from '../ui/button-variants'
import { cn } from '@/lib/utils'
import { statsApi } from '../../services/api'
import { ctorColor } from '../../styles/vizPalette'
import { computePosChanges } from '../../utils/standingsUtils'
import { asObjectArray } from '../../utils/safeArray'
import { safeString, safeText } from '../../utils/safeText'

const ROWS_SHOWN = 10

function Trend({ delta }) {
  if (!delta) return <span aria-hidden="true" className="w-8 shrink-0 text-center text-xs text-ink-3">–</span>
  const up = delta > 0
  const n = Math.abs(delta)
  return (
    <span className={`w-8 shrink-0 text-center text-xs font-semibold ${up ? 'text-pos' : 'text-neg'}`}>
      <span aria-hidden="true">{up ? '▲' : '▼'}{n}</span>
      <span className="sr-only">{up ? 'up' : 'down'} {n} position{n === 1 ? '' : 's'}</span>
    </span>
  )
}

export default function HomeStandingsPanel({ data, loading, error, onRetry, standingsTab, onTabChange, onDriverClick, onConstructorClick }) {
  const [trends, setTrends] = useState({ drivers: {}, constructors: {} })

  useEffect(() => {
    let cancelled = false
    const year = String(new Date().getFullYear())
    Promise.all([statsApi.getSeasonStandings(year), statsApi.getConstructorStandings(year)])
      .then(([ds, cs]) => {
        if (cancelled) return
        const driverTrends = ds?.drivers?.length && ds.rounds?.length
          ? computePosChanges(ds.drivers, (d, idx) => d.cumulative?.[idx] ?? 0, 'driverId')
          : {}
        const ctorTrends = cs?.constructors?.length && cs.rounds?.length
          ? computePosChanges(cs.constructors, (c, idx) => c.cumulative?.[idx] ?? 0, 'constructorId')
          : {}
        setTrends({ drivers: driverTrends, constructors: ctorTrends })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const isDrivers = standingsTab === 'drivers'
  const list = asObjectArray(isDrivers ? data?.standings : data?.constructorStandings).map(r => ({
    position: safeText(r.position), driverId: safeString(r.driverId), constructorId: safeString(r.constructorId),
    name: safeString(r.name), team: safeString(r.team), points: typeof r.points === 'number' && Number.isFinite(r.points) ? r.points : 0,
  }))
  const leaderPts = list[0]?.points ?? 0
  const trendMap = isDrivers ? trends.drivers : trends.constructors

  return (
    <section className="section" aria-labelledby="standings-h">
      <div className="flex flex-wrap items-center justify-between gap-pw-3">
        <h2 id="standings-h" className="text-heading text-ink">Championship standings</h2>
        <TabBar
          className="tab-bar--plain"
          tabs={[{ id: 'drivers', label: 'Drivers' }, { id: 'constructors', label: 'Constructors' }]}
          activeTab={standingsTab}
          onChange={onTabChange}
        />
      </div>
      {data && <p className="num mt-pw-2 text-ink-3">After round {safeString(data.roundsDone, '—')} of {safeString(data.totalRounds, '—')}</p>}

      {loading ? (
        <div className="mt-pw-3"><VizSkeleton variant="rows" name="standings" count={10} /></div>
      ) : error && !list.length ? (
        <div role="alert" className="mt-pw-3">
          <p className="mb-pw-3 text-sm text-ink-2">Standings unavailable.</p>
          <button type="button" className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')} onClick={onRetry}>Try again</button>
        </div>
      ) : !list.length ? (
        <EmptyState type="empty" message="Standings not available yet" height={120} />
      ) : (
        <ol className="mt-pw-3 list-none divide-y divide-edge-soft">
          {list.slice(0, ROWS_SHOWN).map((row, i) => {
            const id = isDrivers ? row.driverId : row.constructorId
            return (
              <li key={id}>
                <button
                  type="button"
                  className="flex min-h-12 w-full cursor-pointer items-center gap-pw-3 border-0 bg-transparent py-pw-2 text-left text-ink [@media(hover:hover)]:hover:bg-hover"
                  onClick={isDrivers
                    ? () => onDriverClick({ driverId: row.driverId, name: row.name })
                    : () => onConstructorClick({ constructorId: row.constructorId, name: row.name })}
                  aria-label={`${row.name}, position ${row.position}, ${row.points} points. Open profile`}
                >
                  <span aria-hidden="true" className="num w-6 shrink-0 text-right text-ink-2">{row.position}</span>
                  <TeamBar color={ctorColor(row.constructorId)} />
                  <span aria-hidden="true" className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{row.name}</span>
                    {isDrivers && <span className="block truncate text-xs leading-4 text-ink-3">{row.team}</span>}
                  </span>
                  <GapBar mode="share" value={row.points} max={leaderPts} color={ctorColor(row.constructorId)} index={i} className="w-12 md:w-14" />
                  <span aria-hidden="true" className="num hidden shrink-0 text-ink-2 sm:inline">{i === 0 ? 'leader' : `−${leaderPts - row.points}`}</span>
                  <span aria-hidden="true" className="num min-w-10 shrink-0 text-right font-medium text-ink">{row.points}</span>
                  <Trend delta={trendMap[id]} />
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <div className="flex items-center justify-end border-t border-edge-soft">
        <Link
          to={isDrivers ? '/standings' : '/standings?view=constructors'}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-steel hover:text-steel-hi no-underline"
        >
          Full standings
        </Link>
      </div>
    </section>
  )
}
