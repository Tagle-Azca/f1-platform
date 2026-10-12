import { motion } from 'framer-motion'
import Panel from '../ui/Panel'
import TyreBadge from '../ui/TyreBadge'
import TeamBar from '../viz/TeamBar'
import { tyre } from '../../styles/vizPalette'
import { teamNameToColor } from '../../utils/teamColors'
import { heroChildProps, useReducedMotion } from '../../styles/motion'
import { stopsHistogram, compoundShare, longestStint } from './strategyModel'

const UNKNOWN_FILL = 'repeating-linear-gradient(45deg, var(--pw-edge) 0 4px, transparent 4px 8px)'

function Block({ label, children }) {
  return (
    <div className="min-w-0">
      <h3 className="mb-pw-2 text-xs text-ink-3">{label}</h3>
      {children}
    </div>
  )
}

/** Race hero: winner's strategy, how many stops the field made, longest stint, compound usage. */
export default function StrategySummary({ raceName, season, rows }) {
  const reduced = useReducedMotion()
  const child = (i) => heroChildProps(i, reduced)
  const winner = rows.find(r => r.position === 1) ?? null
  const hist = stopsHistogram(rows)
  const share = compoundShare(rows)
  const longest = longestStint(rows)
  const maxBucket = Math.max(1, ...Object.values(hist))

  return (
    <Panel as="section" aria-labelledby="strategy-race" className="flex flex-col gap-pw-6">
      <motion.div {...child(0)}>
        <p className="text-sm text-ink-2">{season} season</p>
        <h2 id="strategy-race" className="text-title mt-pw-1 text-ink [overflow-wrap:anywhere]">{raceName || 'Race'}</h2>
      </motion.div>

      <motion.div className="grid grid-cols-1 gap-pw-6 md:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-edge-soft" {...child(1)}>
        <Block label="Winning strategy">
          {winner ? (
            <>
              <p className="mb-pw-2 flex items-center gap-pw-2 text-sm font-medium text-ink">
                <TeamBar color={teamNameToColor(winner.teamName) ?? '#888888'} height={16} width={3} />
                {winner.fullName || winner.acronym}
              </p>
              <ol className="flex flex-wrap items-center gap-pw-1" aria-label={`${winner.stops} stops`}>
                {winner.stints.map((s, i) => (
                  <li key={i} className="flex items-center gap-pw-1">
                    {i > 0 && <span aria-hidden="true" className="text-ink-3">→</span>}
                    <TyreBadge compound={s.compound} />
                    <span className="num text-ink-2">{s.laps}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : <p className="text-sm text-ink-3">Classification not available.</p>}
        </Block>

        <Block label="Stops across the field">
          <ul className="flex flex-col gap-pw-1 xl:pl-pw-4">
            {Object.entries(hist).map(([k, n]) => (
              <li key={k} className="grid grid-cols-[3.5rem_1fr_1.5rem] items-center gap-pw-2 text-xs text-ink-2">
                <span>{k} {k === '1' ? 'stop' : 'stops'}</span>
                <span className="h-1.5 rounded-[2px] bg-[var(--viz-track)]" aria-hidden="true">
                  <span className="block h-full rounded-[2px] bg-steel" style={{ width: `${(n / maxBucket) * 100}%` }} />
                </span>
                <span className="num text-right text-ink">{n}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block label="Longest stint">
          {longest ? (
            <div className="xl:pl-pw-4">
              <p className="text-stat text-ink">{longest.stint.laps}<span className="ml-1 text-sm font-medium text-ink-3">laps</span></p>
              <p className="mt-pw-1 flex items-center gap-pw-2 text-sm text-ink-2">
                <TyreBadge compound={longest.stint.compound} />
                {longest.row.acronym}, laps {longest.stint.lapStart}–{longest.stint.lapEnd}
              </p>
            </div>
          ) : <p className="text-sm text-ink-3">No stints recorded.</p>}
        </Block>

        <Block label="Laps by compound">
          <div className="xl:pl-pw-4">
            <div className="flex h-2.5 overflow-hidden rounded-[2px]" aria-hidden="true">
              {share.map(c => (
                <span key={c.compound} className="h-full border-r-2 border-panel last:border-r-0" style={{ width: `${c.share * 100}%`, background: tyre(c.compound)?.css ?? UNKNOWN_FILL }} />
              ))}
            </div>
            <ul className="mt-pw-2 flex flex-col gap-pw-1">
              {share.map(c => (
                <li key={c.compound} className="flex items-center gap-pw-2 text-xs text-ink-2">
                  <TyreBadge compound={c.compound} />
                  <span>{tyre(c.compound)?.name ?? 'Not recorded'}</span>
                  <span className="num ml-auto text-ink">{Math.round(c.share * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Block>
      </motion.div>
    </Panel>
  )
}
