import { useRef, useState } from 'react'
import TeamBar from '../viz/TeamBar'
import { tyre } from '../../styles/vizPalette'
import { teamNameToColor } from '../../utils/teamColors'
import { lapLeft, lapWidth } from './strategyModel'

const BAND = { SC: 'var(--pw-orange)', VSC: 'var(--pw-yellow)' }
const UNKNOWN_FILL = 'repeating-linear-gradient(45deg, var(--pw-edge) 0 4px, transparent 4px 8px)'
// Label column | lane | outcome column. The SC overlay is offset by the same widths + gaps.
const GRID = 'grid grid-cols-[4.5rem_minmax(0,1fr)_3.75rem] items-center gap-x-pw-2 md:grid-cols-[6rem_minmax(0,1fr)_4.5rem]'
const OVERLAY = 'pointer-events-none absolute inset-y-0 left-[calc(4.5rem+8px)] right-[calc(3.75rem+8px)] md:left-[calc(6rem+8px)] md:right-[calc(4.5rem+8px)]'

const nameOf = (c) => tyre(c)?.name ?? 'Unknown'
const stintText = (r, s) => `${r.acronym}: ${nameOf(s.compound)}, laps ${s.lapStart}–${s.lapEnd} (${s.laps} ${s.laps === 1 ? 'lap' : 'laps'})${s.tyreAge > 0 ? `, fitted ${s.tyreAge} laps old` : ''}`

function LapAxis({ totalLaps, periods, position }) {
  const ticks = []
  for (let lap = 10; lap < totalLaps; lap += 10) ticks.push(lap)
  return (
    <div className={GRID} aria-hidden="true">
      <span className="text-right text-xs text-ink-3">{position === 'top' ? 'Lap' : ''}</span>
      <div className="relative h-5">
        {position === 'top' && periods.map((p, i) => (
          <span
            key={i}
            className="absolute top-0 text-xs font-medium text-ink-2"
            style={{ left: `${lapLeft(p.lapStart, totalLaps)}%` }}
          >
            {p.type}
          </span>
        ))}
        {position === 'bottom' && (
          <>
            <span className="num absolute left-0 text-ink-3">1</span>
            {ticks.filter(lap => totalLaps - lap >= totalLaps * 0.12).map(lap => (
              <span key={lap} className="num absolute -translate-x-1/2 text-ink-3" style={{ left: `${lapLeft(lap + 1, totalLaps)}%` }}>{lap}</span>
            ))}
            <span className="num absolute right-0 text-ink-3">{totalLaps}</span>
          </>
        )}
      </div>
      <span />
    </div>
  )
}

/**
 * One row per driver in finishing order: stints as compound-colored segments on a shared
 * lap axis, SC/VSC periods as bands behind every row. Hover shows stint details; the same
 * data is in an sr-only table, so nothing depends on hover or color.
 */
export default function StrategyChart({ rows, totalLaps, periods }) {
  const lanesRef = useRef(null)
  const [tip, setTip] = useState(null)

  function show(e, text) {
    const box = lanesRef.current?.getBoundingClientRect()
    const seg = e.currentTarget.getBoundingClientRect()
    if (!box) return
    setTip({ text, x: seg.left + seg.width / 2 - box.left, y: seg.top - box.top })
  }

  return (
    <div>
      <LapAxis totalLaps={totalLaps} periods={periods} position="top" />

      <div ref={lanesRef} className="relative" onMouseLeave={() => setTip(null)}>
        {/* Safety car / VSC bands behind every row */}
        <div className={OVERLAY} aria-hidden="true">
          {periods.map((p, i) => (
            <div
              key={i}
              className="absolute inset-y-0 opacity-[0.14]"
              style={{ left: `${lapLeft(p.lapStart, totalLaps)}%`, width: `${lapWidth(p.lapStart, p.lapEnd, totalLaps)}%`, background: BAND[p.type] }}
            />
          ))}
        </div>

        <ol aria-hidden="true" className="relative flex flex-col gap-pw-1">
          {rows.map(r => (
            <li key={r.driverId} className={`${GRID} min-h-8 rounded-[2px] hover:bg-hover`}>
              <span className="flex min-w-0 items-center justify-end gap-pw-2">
                <span className="num w-5 text-right text-ink-3">{r.position ?? '–'}</span>
                <TeamBar color={teamNameToColor(r.teamName) ?? '#888888'} height={16} width={3} />
                <span className="w-9 text-sm font-semibold text-ink">{r.acronym}</span>
              </span>

              <div className="relative h-6 rounded-[2px] bg-[var(--viz-track)]">
                {r.stints.map((s, i) => {
                  const t = tyre(s.compound)
                  const w = lapWidth(s.lapStart, s.lapEnd, totalLaps)
                  return (
                    <div
                      key={i}
                      className="absolute inset-y-0 flex items-center justify-center overflow-hidden border-r-2 border-bg last:border-r-0 hover:brightness-110"
                      style={{ left: `${lapLeft(s.lapStart, totalLaps)}%`, width: `${w}%`, background: t?.css ?? UNKNOWN_FILL }}
                      onMouseEnter={e => show(e, stintText(r, s))}
                    >
                      {w >= 7 && (
                        <span className="select-none text-xs font-bold text-[color:var(--viz-tyre-ink)]">
                          {t?.letter ?? '?'}{w >= 11 ? ` ${s.laps}` : ''}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <span className="text-xs">
                {r.dns ? <span className="font-medium text-neg">DNS</span>
                  : r.dnf ? <span className="font-medium text-neg" title={r.status || undefined}>DNF L{r.lastLap}</span>
                    : <span className="text-ink-2">{r.stops} {r.stops === 1 ? 'stop' : 'stops'}</span>}
              </span>
            </li>
          ))}
        </ol>

        {tip && (
          <div
            role="presentation"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-edge bg-raise px-pw-3 py-pw-1 text-xs text-ink shadow-lg"
            style={{ left: tip.x, top: tip.y - 6 }}
          >
            {tip.text}
          </div>
        )}
      </div>

      <LapAxis totalLaps={totalLaps} periods={periods} position="bottom" />

      {/* Screen-reader version of the chart */}
      <table className="sr-only">
        <caption>Tyre stints by driver, in finishing order</caption>
        <thead><tr><th scope="col">Position</th><th scope="col">Driver</th><th scope="col">Stints</th><th scope="col">Outcome</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.driverId}>
              <td>{r.position ?? 'Not classified'}</td>
              <td>{r.fullName || r.acronym}</td>
              <td>{r.stints.map(s => `${nameOf(s.compound)} laps ${s.lapStart} to ${s.lapEnd}`).join('; ')}</td>
              <td>{r.dns ? 'Did not start' : r.dnf ? `Retired on lap ${r.lastLap}${r.status ? ` (${r.status})` : ''}` : `${r.stops} stops`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
