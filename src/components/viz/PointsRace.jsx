import { Link } from 'react-router-dom'
import GapBar from './GapBar'
import TeamBar from './TeamBar'
import { ctorColor } from '../../styles/vizPalette'
import { titleFightModel } from './pointsModel'

const ORD = ['first', 'second', 'third']
function RowShell({ d, onSelect, children }) {
  const cls = 'flex min-h-16 w-full items-center gap-pw-3 py-pw-3 text-left no-underline text-ink'
  return d.driverId
    ? <Link to={`/drivers/${encodeURIComponent(d.driverId)}`} className={cls} onClick={onSelect ? () => onSelect(d) : undefined}>{children}</Link>
    : <div className={cls}>{children}</div>
}

/**
 * Points gap against points still available, on one shared [0, inPlay] scale.
 * Leader row shows points only; each chaser has a track (= points available) filled by the gap.
 */
export default function PointsRace({ standings, totalRounds, roundsDone, season, onSelect }) {
  const { rows, inPlay, final, decided } = titleFightModel(standings, totalRounds, roundsDone, season)
  if (rows.length < 2) return null
  const leader = rows[0]
  const showTracks = !final && inPlay > 0
  return (
    <>
      <ol className="list-none divide-y divide-edge-soft">
        {rows.map((d, i) => {
          const behind = leader.points - d.points
          const aria = i === 0
            ? `${d.name}, ${d.points} points, ${ORD[i]}`
            : `${d.name}, ${behind} points behind, ${ORD[i]}`
          return (
            <li key={d.driverId ?? `${d.name}-${i}`}>
              <RowShell d={d} onSelect={onSelect}>
                <TeamBar color={ctorColor(d.constructorId)} />
                <span className="sr-only">{aria}</span>
                <span aria-hidden="true" className="flex min-w-0 flex-1 flex-col gap-pw-1 lg:flex-row lg:items-center lg:gap-pw-3">
                  <span className="min-w-0 lg:w-40 lg:shrink-0">
                    <span className="block truncate text-base font-medium text-ink">{d.name}</span>
                    <span className="block truncate text-xs text-ink-3">{d.team}</span>
                  </span>
                  {i > 0 && showTracks && (
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <GapBar value={decided ? inPlay : behind} max={inPlay} scale="linear" color={ctorColor(d.constructorId)} height={8} index={i} />
                      {i === 1 && <span className="num text-xs text-ink-3">{inPlay} available</span>}
                    </span>
                  )}
                </span>
                <span aria-hidden="true" className={i === 0 ? 'text-stat shrink-0 text-ink' : 'num shrink-0 text-ink lg:w-14 lg:text-right'}>
                  {i === 0 ? <>{d.points}<span className="ml-1 text-sm font-medium text-ink-3">pts</span></> : `-${behind}`}
                </span>
              </RowShell>
            </li>
          )
        })}
      </ol>
      {decided && !final && <p className="mt-pw-2 text-sm font-medium text-ink">Title decided</p>}
    </>
  )
}
