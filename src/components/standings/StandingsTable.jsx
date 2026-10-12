import { useMemo } from 'react'
import TelemetrySection from '../telemetry/TelemetrySection'
import StandingsRow from './StandingsRow'
import { rowDetail } from './standingsModel'

/**
 * The full standings list (every entry, no truncation). Each row is a disclosure; one is open at a time.
 * The open row persists across replay ticks and its detail follows the round.
 */
export default function StandingsTable({
  series, rows, view, round, rounds, hero, isWide, open, onOpenChange, hoverId, onHover, source, reduced, entrance, onOpenProfile, captionExtra,
}) {
  const isDrivers = view !== 'constructors'
  const leaderPts = rows[0]?.pts ?? 0
  const tick = hero.marksOut && leaderPts > 0 ? Math.min(1, Math.max(0, (leaderPts - hero.inPlay) / leaderPts)) : null
  const detail = useMemo(() => (open ? rowDetail(series, open, round) : null), [series, open, round])
  const flip = !reduced && source === 'play'

  return (
    <TelemetrySection
      id="rows-h"
      title="Standings"
      caption={`After round ${round}. Select a row for details.`}
    >
      <div className="mb-pw-3 flex flex-col gap-pw-1 text-xs text-ink-3">
        {hero.marksOut
          ? <p>Bar: share of the leader&rsquo;s points. Tick: the lowest total that can still catch the leader.</p>
          : <p>Bar: share of the leader&rsquo;s points.</p>}
        {isDrivers && <p>Dashed stripe: second teammate.</p>}
        {captionExtra}
      </div>
      {isWide && (
        <div
          aria-hidden="true"
          className={`grid items-center gap-x-pw-3 px-pw-3 pb-pw-2 text-xs font-medium text-ink-3 ${isDrivers
            ? 'grid-cols-[1.5rem_2.5rem_4px_minmax(0,1.4fr)_minmax(0,1fr)_3rem_8rem_4.5rem_1.25rem]'
            : 'grid-cols-[1.5rem_2.5rem_4px_minmax(0,1.4fr)_3rem_8rem_4.5rem_1.25rem]'}`}
        >
          <span className="text-right">Pos</span><span /><span />
          <span>{isDrivers ? 'Driver' : 'Team'}</span>
          {isDrivers && <span>Team</span>}
          <span className="text-right">Wins</span><span>Gap to leader</span><span className="text-right">Points</span><span />
        </div>
      )}
      <ul aria-label={`${isDrivers ? 'Driver' : 'Constructor'} standings after round ${round}`} className="m-0 list-none border-y border-edge-soft p-0">
        {rows.map((row, i) => (
          <StandingsRow
            key={row.id}
            row={row}
            index={i}
            isWide={isWide}
            isLeader={row.pos === 1}
            leaderPts={leaderPts}
            showDelta={round > 1}
            round={round}
            open={open === row.id}
            hovered={hoverId === row.id}
            marksOut={hero.marksOut}
            isOut={!hero.contenders.has(row.id)}
            tick={tick}
            detail={open === row.id ? detail : null}
            rounds={rounds}
            onToggle={onOpenChange}
            onHover={onHover}
            onOpenProfile={onOpenProfile}
            flip={flip}
            entrance={entrance}
          />
        ))}
      </ul>
    </TelemetrySection>
  )
}
