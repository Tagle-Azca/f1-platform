import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import TelemetrySection, { Legend, LineSwatch } from '../../telemetry/TelemetrySection'
import { SectionError } from '../ProfileLinks'
import { ChartSkeleton } from '../ProfileSkeleton'
import { getConstructorStandingsCached } from '../../../hooks/useStandingsData'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { progressSeries } from './constructorProfileModel'
import { AXIS_TICK_NUM, AXIS_LINE, GRID, TOOLTIP, animationProps } from '../../../styles/chartTheme'
import { teamMark, BASE } from '../../../styles/vizPalette'
import { useReducedMotion } from '../../../styles/motion'

const PREV = 'var(--viz-series-2)'

/** Standings payloads for the season and the one before it, through the shared per-session cache. */
function useProgressData(season) {
  const currentYear = new Date().getFullYear()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ key: '', status: 'loading', current: null, previous: null })
  const key = `${season}|${attempt}`
  useEffect(() => {
    if (!Number.isFinite(season)) return undefined
    let alive = true
    Promise.all([getConstructorStandingsCached(season, currentYear), getConstructorStandingsCached(season - 1, currentYear)]).then(([cur, prev]) => {
      if (!alive) return
      setState({ key, status: cur.ok ? 'ready' : 'error', current: cur.ok ? cur.payload : null, previous: prev.ok ? prev.payload : null })
    })
    return () => { alive = false }
  }, [season, attempt, currentYear, key])
  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...(state.key === key ? state : { status: 'loading', current: null, previous: null }), retry }
}

function endLabel(lastIndex, color, text) {
  return ({ x, y, index, value }) => (index === lastIndex && Number.isFinite(value) && Number.isFinite(x) && Number.isFinite(y) ? (
    <text x={x + 6} y={y} dy={4} fontSize="12" fontFamily="var(--pw-mono)" fill={color === PREV ? 'var(--pw-ink-2)' : 'var(--pw-ink)'}>{text}</text>
  ) : null)
}

function DataTable({ series, season, previousSeason, name }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className="mt-pw-3">
      <button
        type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 cursor-pointer items-center gap-pw-2 border-0 bg-transparent p-0 text-sm font-semibold text-steel hover:text-steel-hi"
      >
        View data table
        <ChevronDown aria-hidden="true" size={16} className={`transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      <div id={id} hidden={!open} className="mt-pw-2 max-h-72 overflow-y-auto">
        <table className="w-full border-collapse">
          <caption className="sr-only">Cumulative points by round for {name}</caption>
          <thead>
            <tr className="border-b border-edge text-xs text-ink-3">
              <th scope="col" className="py-pw-2 text-left font-medium">Round</th>
              <th scope="col" className="py-pw-2 text-right font-medium">{season}</th>
              {series.hasPrevious && <th scope="col" className="py-pw-2 text-right font-medium">{previousSeason}</th>}
            </tr>
          </thead>
          <tbody>
            {series.rows.map((r) => (
              <tr key={r.round} className="border-b border-edge-soft">
                <th scope="row" className="num py-pw-1 text-left font-normal text-ink-2">{r.round}</th>
                <td className="num py-pw-1 text-right text-ink">{r.current}</td>
                {series.hasPrevious && <td className="num py-pw-1 text-right text-ink-2">{r.previous ?? '-'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Cumulative points by round for the selected season (solid, team colour) against the previous one (dashed). */
export default function PointsProgress({ constructorId, name, season, color }) {
  const reduced = useReducedMotion()
  const md = useMediaQuery('(min-width: 768px)')
  const xl = useMediaQuery('(min-width: 1280px)')
  const data = useProgressData(season)
  const { status, current, previous, retry } = data
  const series = useMemo(() => (status === 'ready' ? progressSeries(current, previous, constructorId) : null), [status, current, previous, constructorId])
  const mark = teamMark(color, BASE.panel)
  const prevYear = season - 1
  const height = xl ? 320 : md ? 280 : 240

  let caption = 'Points after each round. The dashed line is the previous season.'
  if (series && !series.hasPrevious) caption = `No ${prevYear} season in Pitwall data.`

  let body
  if (status === 'error') body = <SectionError what="points progress" onRetry={retry} />
  else if (status === 'loading') body = <ChartSkeleton />
  else if (!series) body = <p className="text-sm text-ink-2">No points for {name} in {season} yet.</p>
  else {
    const last = series.rows.length - 1
    const summary = series.diff === null
      ? `After ${series.roundsDone} rounds ${name} has ${series.currentFinal} points in ${season}.`
      : `After ${series.roundsDone} rounds ${name} has ${series.currentFinal} points, ${Math.abs(series.diff)} ${series.diff >= 0 ? 'more' : 'fewer'} than at the same point in ${prevYear}.`
    body = (
      <>
        <p className="sr-only">{summary}</p>
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={series.rows} margin={{ top: 12, right: 44, left: 0, bottom: 4 }} accessibilityLayer={false}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="round" tick={AXIS_TICK_NUM} tickLine={false} axisLine={AXIS_LINE} minTickGap={12} />
              <YAxis tick={AXIS_TICK_NUM} tickLine={false} axisLine={false} width={44} />
              <Tooltip {...TOOLTIP} cursor={{ stroke: 'var(--viz-baseline)' }} labelFormatter={(r) => `Round ${r}`} />
              {series.hasPrevious && (
                <Line
                  type="monotone" dataKey="previous" name={String(prevYear)} stroke={PREV} strokeWidth={2} strokeDasharray="6 3" dot={false}
                  connectNulls label={endLabel(last, PREV, `${prevYear}`)} {...animationProps(reduced, `pp-prev-${season}`)}
                />
              )}
              <Line
                type="monotone" dataKey="current" name={String(season)} stroke={mark} strokeWidth={2} dot={false}
                label={endLabel(last, mark, `${season}`)} {...animationProps(reduced, `pp-cur-${season}`)}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <DataTable series={series} season={season} previousSeason={prevYear} name={name} />
      </>
    )
  }

  const legend = series ? [
    { key: 'c', swatch: <LineSwatch color={mark} />, label: String(season) },
    ...(series.hasPrevious ? [{ key: 'p', swatch: <LineSwatch color={PREV} dashed />, label: String(prevYear) }] : []),
  ] : []

  return (
    <TelemetrySection id="cp-progress" title="Points progress" caption={caption} aside={legend.length ? <Legend items={legend} /> : null}>
      {body}
    </TelemetrySection>
  )
}
