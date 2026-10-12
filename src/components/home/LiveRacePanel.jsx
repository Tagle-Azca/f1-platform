import { Link } from 'react-router-dom'
import DataRow from '../ui/DataRow'
import LivePill from '../ui/LivePill'
import TrackStatusBanner from '../live/TrackStatusBanner'
import { asObjectArray } from '../../utils/safeArray'

export default function LiveRacePanel({ live }) {
  const updated = live.updatedAt
    ? new Date(live.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <section className="section flex flex-col" aria-labelledby="live-race-h">
      <div className="flex flex-wrap items-center justify-between gap-pw-2">
        <h2 id="live-race-h" className="text-heading flex items-center gap-pw-2 text-ink">
          {live.finished ? <span>Race finished, {live.sessionName}</span> : <><LivePill>Live</LivePill><span>{live.sessionName}</span></>}
        </h2>
        <p className="num text-ink-2">
          <span className="font-medium text-ink">{live.raceName}</span>
          {live.currentLap ? <span>, lap {live.currentLap}{live.totalLaps ? `/${live.totalLaps}` : ''}</span> : null}
        </p>
      </div>

      {live.trackStatus && <TrackStatusBanner status={live.trackStatus} className="mt-pw-3" />}

      <ol className="mt-pw-3 list-none">
        {asObjectArray(live.top3).map((driver, i) => {
          const isLeader = driver.stat === 'LEADER' || driver.statLabel === 'fastest'
          return (
            <li key={driver.driverNum}>
              <DataRow
                pos={driver.position}
                teamColor={driver.teamColor}
                label={driver.fullName || driver.acronym}
                sub={driver.teamName}
                value={isLeader ? (live.isRaceType ? 'Leader' : 'Fastest') : driver.stat}
                highlight={i === 0}
              />
            </li>
          )
        })}
      </ol>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-pw-2 border-t border-edge-soft pt-pw-2">
        <span className="text-xs text-ink-3">
          {live.finished ? `${live.totalLaps} laps, final` : `F1 live timing${updated ? `, ${updated}` : ''}`}
        </span>
        {!live.finished && (
          <Link to="/live" className="inline-flex min-h-11 items-center text-sm font-semibold text-steel hover:text-steel-hi no-underline">
            Full classification
          </Link>
        )}
      </div>
    </section>
  )
}
