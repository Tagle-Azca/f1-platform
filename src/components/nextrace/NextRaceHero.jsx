import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import Panel from '../ui/Panel'
import LivePill from '../ui/LivePill'
import CountdownDisplay from '../ui/CountdownDisplay'
import TrackTrace from '../viz/TrackTrace'
import CircuitLink from '../circuits/CircuitLink'
import { buttonVariants } from '../ui/button-variants'
import { teamMark, BASE } from '../../styles/vizPalette'
import { safeString } from '../../utils/safeText'
import { cn } from '@/lib/utils'
import { heroChildProps, useReducedMotion } from '../../styles/motion'

/**
 * Hero of a race weekend. `phase` picks what sits under the title: preview = countdown (or the date when there is no
 * schedule), live = Live now + a link to live timing, results = the winner + an optional "Analyse this race" link.
 */
export default function NextRaceHero({ race, circuit, live, countdown, flagUrl, phase = 'preview', winner = null, analysisTo = null, dateLabel = '' }) {
  const reduced = useReducedMotion()
  const child = (i) => heroChildProps(i, reduced)
  const nextLabel = safeString(race.nextSession?.label)

  return (
    <Panel as="section" aria-labelledby="race-title" className="grid grid-cols-1 gap-pw-6 md:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-pw-4 md:col-span-7">
        <motion.div className="flex items-center gap-pw-3" {...child(0)}>
          {flagUrl && <img src={flagUrl} alt="" width="64" height="43" className="h-auto w-11 shrink-0 rounded-[2px] md:w-16" />}
          <p className="text-sm text-ink-2">Round {safeString(race.round)}, {safeString(race.season)}{phase === 'results' && dateLabel ? ` · ${dateLabel}` : ''}</p>
        </motion.div>

        <motion.div {...child(1)}>
          <h1 id="race-title" className="text-hero text-ink [overflow-wrap:anywhere]">{safeString(race.raceName)}</h1>
          <p className="mt-pw-2 text-sm text-ink-2">
            <CircuitLink circuitId={race.circuitId}>{safeString(circuit?.circuitName) || safeString(race.circuit)}</CircuitLink>, {safeString(race.locality)}, {safeString(race.country)}
          </p>
        </motion.div>

        {phase === 'results' ? (
          <motion.div className="flex flex-col items-start gap-pw-3" {...child(2)}>
            {winner?.name && (
              <p className="flex min-w-0 items-center gap-pw-2 text-sm text-ink-2">
                <svg aria-hidden="true" focusable="false" width="3" height="14" className="shrink-0"><rect width="3" height="14" rx="1.5" fill={teamMark(winner.color, BASE.panel)} /></svg>
                <span>Winner: <span className="font-semibold text-ink">{winner.name}</span>{winner.team ? `, ${winner.team}` : ''}</span>
              </p>
            )}
            {analysisTo && (
              <Link to={analysisTo} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11 no-underline')}>
                <Activity aria-hidden="true" size={16} />
                Analyse this race
              </Link>
            )}
          </motion.div>
        ) : live ? (
          <motion.div className="flex flex-col items-start gap-pw-3" {...child(2)}>
            <div className="flex flex-col items-start gap-pw-2">
              <p className="text-sm font-medium text-ink-2">{safeString(live.label)}</p>
              <LivePill>Live now</LivePill>
            </div>
            {phase === 'live' && (
              <Link to="/live" className={cn(buttonVariants(), 'min-h-11 no-underline')}>Open live timing</Link>
            )}
          </motion.div>
        ) : countdown ? (
          <motion.div className="flex flex-col gap-pw-1" {...child(2)}>
            {nextLabel && <p className="text-sm font-medium text-ink-2">{nextLabel} starts in</p>}
            <CountdownDisplay parts={countdown} size="lg" label={`${nextLabel || 'Next session'} starts in`} />
          </motion.div>
        ) : dateLabel ? (
          <motion.p className="text-sm text-ink-2" {...child(2)}>{dateLabel}</motion.p>
        ) : null}
      </div>

      <div className="hidden items-center justify-center md:col-span-5 md:flex" aria-hidden="true">
        <TrackTrace coords={circuit?.trackCoords} className="h-auto w-full max-w-72 opacity-[0.35]" />
      </div>
    </Panel>
  )
}
