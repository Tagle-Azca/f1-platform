import { motion } from 'framer-motion'
import GapBar from '../../viz/GapBar'
import { TeamLink, TeamStripe, SectionError } from '../ProfileLinks'
import { teamMark, BASE } from '../../../styles/vizPalette'
import { growProps, useReducedMotion } from '../../../styles/motion'
import { rangeLabel } from './driverProfileModel'

/** One 8px bar split by team: width follows the number of seasons, 2px gaps in the page colour. Decorative. */
function Ribbon({ segments }) {
  const reduced = useReducedMotion()
  const total = segments.reduce((n, s) => n + s.count, 0) || 1
  const widths = segments.map((s) => (s.count / total) * 100)
  const starts = widths.map((_, i) => widths.slice(0, i).reduce((n, w) => n + w, 0))
  return (
    <svg aria-hidden="true" focusable="false" width="100%" height="8" className="block w-full overflow-hidden rounded-pill">
      <rect width="100%" height="8" fill="var(--viz-track)" />
      {segments.map((s, i) => (
        <motion.rect
          key={`${s.constructorId}-${s.from}`} x={`${starts[i]}%`} y="0" width={`${widths[i]}%`} height="8"
          fill={teamMark(s.color, BASE.bg)} stroke="var(--pw-bg)" strokeWidth="2" className="viz-grow" {...growProps(i, reduced)}
        />
      ))}
    </svg>
  )
}

const Cell = ({ children, className = '' }) => <td className={`num py-pw-2 pl-pw-3 text-right text-ink ${className}`}>{children}</td>

function TeamCell({ row }) {
  return (
    <span className="flex min-w-0 items-center gap-pw-2">
      <TeamStripe color={teamMark(row.color, BASE.bg)} />
      <TeamLink id={row.constructorId} className="min-w-0 truncate">{row.team || 'Unknown team'}</TeamLink>
    </span>
  )
}

/**
 * Seasons: a team ribbon (consecutive seasons merged by team) with a text legend, then the season table, newest first.
 * Below 640 each season is a two-line row. Points carry a share bar against the driver's best season.
 */
export default function SeasonTimeline({ rows, segments, status, onRetry }) {
  const first = rows.length ? rows[rows.length - 1].season : null
  const last = rows.length ? rows[0].season : null
  return (
    <section className="section" aria-labelledby="dp-seasons">
      <div className="flex items-baseline justify-between gap-pw-3">
        <h2 id="dp-seasons" className="text-heading text-ink">Seasons</h2>
        {rows.length > 0 && <span className="num text-xs text-ink-3">{rangeLabel(first, last)}</span>}
      </div>
      {status === 'error' ? (
        <div className="mt-pw-4"><SectionError what="seasons" onRetry={onRetry} /></div>
      ) : rows.length === 0 ? (
        <p className="mt-pw-3 text-sm text-ink-2">No seasons in Pitwall data yet.</p>
      ) : (
        <>
          <div className="mt-pw-4 flex flex-col gap-pw-3">
            <Ribbon segments={segments} />
            <ul className="flex flex-wrap gap-x-pw-4 gap-y-pw-1">
              {segments.map((s) => (
                <li key={`${s.constructorId}-${s.from}`} className="flex items-center gap-pw-2 text-sm">
                  <TeamStripe color={teamMark(s.color, BASE.bg)} />
                  <TeamLink id={s.constructorId}>{s.team || 'Unknown team'}</TeamLink>
                  <span className="num text-xs text-ink-3">{s.years}</span>
                </li>
              ))}
            </ul>
          </div>

          <table className="mt-pw-4 hidden w-full border-collapse sm:table">
            <caption className="sr-only">Seasons in Pitwall data, newest first</caption>
            <thead>
              <tr className="border-b border-edge text-left text-xs font-medium text-ink-3">
                <th scope="col" className="py-pw-2 pr-pw-3 font-medium">Season</th>
                <th scope="col" className="py-pw-2 font-medium">Team</th>
                {['Races', 'Wins', 'Podiums', 'Poles'].map((h) => <th key={h} scope="col" className="py-pw-2 pl-pw-3 text-right font-medium">{h}</th>)}
                <th scope="col" className="py-pw-2 pl-pw-3 text-right font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.season} className="border-b border-edge-soft [@media(hover:hover)]:hover:bg-hover">
                  <th scope="row" className="num py-pw-2 pr-pw-3 text-left font-normal text-ink">{r.season}</th>
                  <td className="py-pw-2"><TeamCell row={r} /></td>
                  <Cell>{r.races}</Cell><Cell>{r.wins}</Cell><Cell>{r.podiums}</Cell><Cell>{r.poles}</Cell>
                  <td className="py-pw-2 pl-pw-3">
                    <span className="flex items-center justify-end gap-pw-3">
                      <span className="w-24"><GapBar value={r.points} max={r.best} mode="share" color={r.color} index={i} /></span>
                      <span className="num w-12 text-right text-ink">{r.points}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="mt-pw-4 flex flex-col sm:hidden">
            {rows.map((r, i) => (
              <li key={r.season} className="flex flex-col gap-pw-1 border-b border-edge-soft py-pw-3">
                <div className="flex items-center gap-pw-3">
                  <span className="num text-ink">{r.season}</span>
                  <span className="min-w-0 flex-1"><TeamCell row={r} /></span>
                  <span className="num text-ink">{r.points}<span className="ml-1 font-sans text-xs text-ink-3">pts</span></span>
                </div>
                <p className="num text-xs text-ink-2">{r.races} races · {r.wins} wins · {r.podiums} podiums · {r.poles} poles</p>
                <GapBar value={r.points} max={r.best} mode="share" color={r.color} index={i} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
