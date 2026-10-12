import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, usePlotArea, useXAxisScale, useYAxisScale } from 'recharts'
import TelemetrySection, { Legend, LineSwatch } from '../telemetry/TelemetrySection'
import SegmentedControl from '../ui/SegmentedControl'
import StandingsTooltip from './StandingsTooltip'
import { positionsByRound, chartCap, rankAt, roundText, roundLabel } from './standingsModel'
import { xTicks, rankTicks, pointsAxis, spreadLabels, positionHeight } from './chartLayout'
import { AXIS_TICK_NUM, AXIS_LINE, GRID, MUTED_OPACITY, EMPTY_TEXT, animationProps } from '../../styles/chartTheme'
import { teamMark, BASE } from '../../styles/vizPalette'
import { useReducedMotion } from '../../styles/motion'
import { useMediaQuery } from '../../hooks/useMediaQuery'

const TOP = 5
const MODES = [{ value: 'points', label: 'Points' }, { value: 'position', label: 'Position' }]

/** Replay marker cap + a dot and an end label for each highlighted entry, drawn from the chart's own scales. */
function MarkerLayer({ items, round, span, lookup, onHover }) {
  const plot = usePlotArea()
  const xs = useXAxisScale()
  const ys = useYAxisScale()
  if (!plot || !xs || !ys) return null
  const x = xs(round)
  const placed = items.map(it => ({ ...it, y: ys(it.value) })).filter(it => Number.isFinite(it.y))
  const labelY = spreadLabels(placed.map(p => p.y), 13, plot.y + 6, plot.y + plot.height - 2)
  return (
    <g>
      <circle cx={x} cy={plot.y} r="3" fill="var(--viz-now)" />
      {placed.map((p, i) => (
        <g key={p.id}>
          <circle cx={x} cy={p.y} r="3" fill={p.color} stroke={BASE.bg} strokeWidth="1.5" />
          <text
            x={plot.x + plot.width + 6} y={labelY[i]} dominantBaseline="middle" fontSize="12" fontWeight="600"
            className="font-display" fill={p.color}
          >
            {p.code}
          </text>
        </g>
      ))}
      <rect
        x={plot.x} y={plot.y} width={plot.width} height={plot.height} fill="transparent" pointerEvents="all"
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect()
          const r = Math.min(span, Math.max(1, Math.round(1 + ((e.clientX - box.left) / Math.max(1, box.width)) * (span - 1))))
          const py = e.clientY - box.top + plot.y
          let best = null
          for (const c of lookup(r)) {
            const d = Math.abs(ys(c.value) - py)
            if (d <= 16 && (!best || d < best.d)) best = { id: c.id, d }
          }
          onHover(best ? best.id : null)
        }}
        onMouseLeave={() => onHover(null)}
      />
    </g>
  )
}

/**
 * Season progress: Points (cumulative) or Position (bump chart).
 * The whole dataset is drawn once; the replay only moves the marker and the future overlay, so a tick never
 * recomputes or re-animates the lines.
 */
export default function StandingsChart({
  series, rounds, round, view, datasetKey, mode, onModeChange, hoverId, onHover, selectedId, sprintOnly,
}) {
  const reduced = useReducedMotion()
  const isMd = useMediaQuery('(min-width: 768px)')
  const isLg = useMediaQuery('(min-width: 1024px)')
  const isDrivers = view !== 'constructors'
  const n = series[0]?.cumulative.length ?? 0

  // "Show all" resets with the dataset (adjust state while rendering)
  const [showAllState, setShowAllState] = useState({ key: datasetKey, on: false })
  const showAll = showAllState.key === datasetKey && showAllState.on

  const positions = useMemo(() => positionsByRound(series), [series])
  const rows = useMemo(() => rankAt(series, round), [series, round])
  const highlight = useMemo(() => {
    const ids = new Set(rows.slice(0, TOP).map(r => r.id))
    if (hoverId) ids.add(hoverId)
    if (selectedId) ids.add(selectedId)
    return ids
  }, [rows, hoverId, selectedId])

  const capEnabled = isDrivers && !isMd && mode === 'position'
  const cap = useMemo(
    () => chartCap(series, { cap: capEnabled ? 10 : series.length, showAll, selectedId, positions }),
    [series, capEnabled, showAll, selectedId, positions],
  )

  // Static data: one row per round with every entry's points and rank
  const data = useMemo(() => Array.from({ length: n }, (_, r) => ({
    round: r + 1, v: series.map(s => s.cumulative[r]), p: positions.map(p => p.positions[r]),
  })), [series, positions, n])

  const maxPts = useMemo(() => series.reduce((m, s) => Math.max(m, s.total), 0), [series])
  const axis = useMemo(() => pointsAxis(maxPts, isDrivers ? 50 : 100), [maxPts, isDrivers])

  const keyFns = useMemo(
    () => series.map((_, i) => (mode === 'position' ? (d) => (d.p[i] <= cap.max ? d.p[i] : null) : (d) => d.v[i])),
    [series, mode, cap.max],
  )

  // Draw-in runs once per dataset and per toggle; later renders never re-animate
  const animationId = `${datasetKey}-${mode}`
  const [drawn, setDrawn] = useState(null)
  useEffect(() => {
    const t = setTimeout(() => setDrawn(animationId), 1000)
    return () => clearTimeout(t)
  }, [animationId])
  const animating = !reduced && drawn !== animationId
  const anim = animationProps(!animating, animationId)

  const height = mode === 'position' ? positionHeight(cap.max, { isDrivers, compact: !isMd }) : (isLg ? 340 : 260)
  const ticks = xTicks(n, !isMd)
  const marginRight = isMd ? 52 : 44

  const idxOf = useMemo(() => new Map(series.map((s, i) => [s.id, i])), [series])
  const valueAt = (id, r) => (mode === 'position' ? positions[idxOf.get(id)].positions[r - 1] : series[idxOf.get(id)].cumulative[r - 1])
  const items = [...highlight].filter(id => idxOf.has(id)).map(id => {
    const s = series[idxOf.get(id)]
    return { id, code: s.code, value: valueAt(id, round), color: teamMark(s.color, BASE.bg) }
  }).filter(it => mode !== 'position' || it.value <= cap.max)

  // Entries that can be hovered at round r (those inside the visible rank domain)
  const lookup = (r) => series
    .map((sr, i) => ({ id: sr.id, value: mode === 'position' ? positions[i].positions[r - 1] : sr.cumulative[r - 1] }))
    .filter(c => mode !== 'position' || c.value <= cap.max)

  // Tooltip rows at any round: the highlighted entries, best first
  const rowsAt = (r) => rankAt(series, Math.round(r)).filter(x => highlight.has(x.id) && (mode !== 'position' || x.pos <= cap.max))
  const title = (r) => roundLabel(rounds, Math.round(r) - 1, { sprintOnly })

  const caption = `${roundText(rounds, round - 1, { sprintOnly })}. The top ${TOP} are highlighted; hover a row or line to add one.`
  const leader = rows[0]
  const second = rows[1]
  const summary = n === 0 ? '' : `${mode === 'position' ? 'Position' : 'Points'} chart. ${roundText(rounds, round - 1, { sprintOnly })}. Leader ${leader?.name}, ${leader?.pts} points.${second ? ` Second ${second.name}, ${second.pts} points.` : ''}`

  const legend = [
    { key: 'hi', swatch: <LineSwatch color="var(--pw-ink-2)" />, label: 'Highlighted' },
    ...(isDrivers ? [{ key: 'dash', swatch: <LineSwatch color="var(--pw-ink-2)" dashed />, label: 'Second teammate' }] : []),
    { key: 'now', swatch: <svg aria-hidden="true" width="4" height="14" className="shrink-0"><rect width="2" x="1" height="14" fill="var(--viz-now)" /></svg>, label: 'Replay position' },
  ]

  const ordered = [...series.keys()].sort((a, b) => Number(highlight.has(series[a].id)) - Number(highlight.has(series[b].id)))

  return (
    <TelemetrySection
      id="chart-h"
      title="Season progress"
      caption={caption}
      aside={(
        <div className="flex flex-col gap-pw-2 md:items-end">
          <SegmentedControl role="radiogroup" aria-label="Chart type" options={MODES} value={mode} onChange={onModeChange} />
          <Legend items={legend} />
        </div>
      )}
    >
      {n < 1 ? (
        <p className="flex items-center justify-center rounded-md border border-edge text-sm text-ink-3" role="status">{EMPTY_TEXT}</p>
      ) : (
        <>
          <p className="sr-only">{summary}</p>
          <div aria-hidden="true">
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={data} margin={{ top: 12, right: marginRight, left: 0, bottom: 4 }} accessibilityLayer={false}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="round" type="number" domain={[1, Math.max(n, 2)]} ticks={ticks} tick={AXIS_TICK_NUM} tickLine={false} axisLine={AXIS_LINE} allowDecimals={false} />
                {mode === 'position' ? (
                  <YAxis
                    type="number" reversed domain={[0.5, cap.max + 0.5]} ticks={rankTicks(cap.max)} allowDecimals={false}
                    tick={AXIS_TICK_NUM} tickLine={false} axisLine={false} width={34} tickFormatter={v => `P${v}`}
                  />
                ) : (
                  <YAxis type="number" domain={[0, axis.top]} ticks={axis.ticks} tick={AXIS_TICK_NUM} tickLine={false} axisLine={false} width={34} />
                )}
                <Tooltip
                  cursor={{ stroke: 'var(--viz-baseline)' }}
                  content={<StandingsTooltip rowsAt={rowsAt} title={title} mode={mode} hoverId={hoverId} />}
                />
                {ordered.map(i => {
                  const s = series[i]
                  const hi = highlight.has(s.id)
                  const color = teamMark(s.color, BASE.bg)
                  return (
                    <Line
                      key={s.id}
                      dataKey={keyFns[i]}
                      type={mode === 'position' ? 'monotone' : 'linear'}
                      stroke={color}
                      strokeWidth={hi ? 2 : 1}
                      strokeOpacity={hi ? 1 : MUTED_OPACITY}
                      strokeDasharray={s.dash ? '6 3' : undefined}
                      strokeLinejoin="round"
                      className="st-line"
                      dot={hi && mode === 'position' ? { r: 3, fill: color, stroke: 'none' } : false}
                      activeDot={false}
                      connectNulls={false}
                      tooltipType="none"
                      {...anim}
                    />
                  )
                })}
                {round < n && <ReferenceArea x1={round} x2={n} fill="var(--pw-bg)" fillOpacity={0.5} stroke="none" ifOverflow="hidden" />}
                <ReferenceLine x={round} stroke="var(--viz-now)" strokeWidth={1.5} />
                <MarkerLayer items={items} round={round} span={n} lookup={lookup} onHover={onHover} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {capEnabled && cap.total > 10 && (
            <button
              type="button"
              aria-pressed={showAll}
              onClick={() => setShowAllState({ key: datasetKey, on: !showAll })}
              className="mt-pw-2 min-h-11 cursor-pointer border-0 bg-transparent p-0 text-sm text-steel"
            >
              {showAll ? 'Show the top 10' : `Showing the top ${cap.max}. Show all ${cap.total}`}
            </button>
          )}
        </>
      )}
    </TelemetrySection>
  )
}
