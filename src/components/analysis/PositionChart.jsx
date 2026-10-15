import { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { telemetryApi } from '../../services/api'
import EmptyState from '../ui/EmptyState'
import { buttonVariants } from '../ui/button-variants'
import { cn } from '@/lib/utils'
import VizSkeleton from '../viz/VizSkeleton'
import { seriesFor } from '../pace/paceModel'
import { AXIS_TICK_NUM, AXIS_LINE, GRID, animationProps } from '../../styles/chartTheme'
import { useReducedMotion } from '../../styles/motion'

const BOX = 'min-w-40 rounded-md border border-edge bg-raise px-pw-3 py-pw-2 shadow-lg'

function Swatch({ color, dashed, faded }) {
  return (
    <svg aria-hidden="true" width="18" height="4" className="shrink-0">
      <line x1="0" y1="2" x2="18" y2="2" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '6 3' : undefined} strokeOpacity={faded ? 0.55 : 1} />
    </svg>
  )
}

/** Hover card: running order at the lap, then retired and non-starting drivers with a word each. */
function PositionTooltip({ active, payload, label, meta }) {
  if (!active) return null
  const byId = new Map(meta.map(d => [d.driverId, d]))
  const present = (payload || []).slice().sort((a, b) => a.value - b.value)
  const presentSet = new Set(present.map(p => p.dataKey))
  const retired = meta.filter(d => !d.dns && !presentSet.has(d.driverId) && d.lastLap != null && d.lastLap < label)
  const dns = meta.filter(d => d.dns)
  if (!present.length && !retired.length && !dns.length) return null
  return (
    <div className={BOX}>
      <p className="mb-pw-1 text-xs font-semibold text-ink">Lap {label}</p>
      <div className="flex flex-col gap-pw-1">
        {present.map(p => (
          <div key={p.dataKey} className="flex items-center gap-pw-2 text-xs">
            <Swatch color={byId.get(p.dataKey)?.color ?? p.color} dashed={byId.get(p.dataKey)?.dashed} />
            <span className="flex-1 text-ink-2">{p.name}</span>
            <span className="num text-ink">P{p.value}</span>
          </div>
        ))}
        {retired.map(d => (
          <div key={d.driverId} className="flex items-center gap-pw-2 text-xs text-ink-3">
            <Swatch color={d.color} dashed={d.dashed} faded />
            <span className="flex-1">{d.acronym}</span>
            <span className="num text-signal-yellow">Out lap {d.lastLap}</span>
          </div>
        ))}
        {dns.map(d => (
          <div key={d.driverId} className="flex items-center gap-pw-2 text-xs text-ink-3">
            <Swatch color="var(--pw-ink-3)" faded />
            <span className="flex-1">{d.acronym}</span>
            <span>Did not start</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Position by lap for the whole field (moved from the old race page). `allDrivers` supplies the team of each driver for
 * colour; the second driver of a team is dashed. A hidden table lists the start and finish order for non-visual users.
 */
export default function PositionChart({ raceId, allDrivers, isMobile }) {
  const reduced = useReducedMotion()
  const [state, setState] = useState({ raceId: '', status: 'loading', data: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    telemetryApi.getRacePositions(raceId)
      .then(data => { if (alive) setState({ raceId, attempt, status: 'ready', data }) })
      .catch(() => { if (alive) setState({ raceId, attempt, status: 'error', data: null }) })
    return () => { alive = false }
  }, [raceId, attempt])

  const current = state.raceId === raceId && state.attempt === attempt ? state : null
  const data = current?.data
  const { driverMeta, activeDrivers, chartData } = useMemo(() => {
    if (!data?.drivers?.length || !data?.laps?.length) return { driverMeta: [], activeDrivers: [], chartData: [] }
    const teams = new Map((allDrivers ?? []).map(d => [d.driverId, d.teamName || '']))
    const seen = new Set()
    const driverMeta = data.drivers.map((d, i) => ({
      ...d,
      ...(d.dns ? { color: 'var(--pw-ink-3)', dashed: false } : seriesFor(teams.get(d.driverId) || '', seen, i)),
      pitLapSet: new Set(d.pitLaps || []),
    }))
    return { driverMeta, activeDrivers: driverMeta.filter(d => !d.dns), chartData: data.laps }
  }, [data, allDrivers])
  if (!current) return <VizSkeleton variant="rows" name="position chart" count={6} />
  if (current.status === 'error') {
    return (
      <EmptyState
        type="error" height={160} message="We couldn't load the position chart"
        action={<button type="button" onClick={() => setAttempt(a => a + 1)} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')}>Try again</button>}
      />
    )
  }
  if (!chartData.length) return <EmptyState type="empty" height={160} message="No position data for this race" />

  const activeCount = activeDrivers.length
  const lastRow = chartData[chartData.length - 1]
  const firstRow = chartData[0]
  const finishers = activeDrivers.filter(d => !d.dnf)

  return (
    <div className="flex flex-col gap-pw-3">
      <div role="img" aria-label={`Position by lap for ${activeCount} drivers over ${data.totalLaps || chartData.length} laps. The table after the chart lists start and finish order.`}>
        <ResponsiveContainer width="100%" height={isMobile ? 320 : 400}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="lap" tick={AXIS_TICK_NUM} tickLine={false} axisLine={AXIS_LINE} minTickGap={12} />
            <YAxis
              reversed domain={[1, activeCount + 1]} allowDecimals={false}
              ticks={[1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21].filter(n => n <= activeCount)}
              tickFormatter={v => `P${v}`} tick={AXIS_TICK_NUM} tickLine={false} axisLine={false} width={40}
            />
            <Tooltip content={<PositionTooltip meta={driverMeta} />} cursor={{ stroke: 'var(--viz-baseline)' }} />
            {activeDrivers.flatMap(d => [...d.pitLapSet].map(lap => (
              <ReferenceLine key={`${d.driverId}-${lap}`} x={lap} stroke="var(--viz-grid)" strokeDasharray="3 3" />
            )))}
            {activeDrivers.map(d => (
              <Line
                key={d.driverId} type="monotone" dataKey={d.driverId} name={d.acronym}
                stroke={d.color} strokeWidth={d.dnf ? 1 : 1.5} strokeOpacity={d.dnf ? 0.55 : 1} strokeDasharray={d.dashed ? '6 3' : undefined}
                dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: d.color }} connectNulls
                {...animationProps(reduced, `pos-${raceId}`)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex flex-wrap gap-x-pw-4 gap-y-pw-2" aria-label="Position chart legend">
        {finishers.map(d => (
          <li key={d.driverId} className="flex items-center gap-pw-2 text-xs text-ink-2">
            <Swatch color={d.color} dashed={d.dashed} />
            <span className="font-display font-semibold tracking-[0.02em]">{d.acronym}</span>
          </li>
        ))}
        {driverMeta.filter(d => d.dnf).map(d => (
          <li key={d.driverId} className="flex items-center gap-pw-2 text-xs text-ink-3">
            <Swatch color={d.color} dashed={d.dashed} faded />
            <span className="font-display font-semibold tracking-[0.02em] line-through">{d.acronym}</span>
            <span className="num text-signal-yellow">Out lap {d.lastLap}</span>
          </li>
        ))}
        {driverMeta.filter(d => d.dns).map(d => (
          <li key={d.driverId} className="flex items-center gap-pw-2 text-xs text-ink-3">
            <Swatch color="var(--pw-ink-3)" faded />
            <span className="font-display font-semibold tracking-[0.02em]">{d.acronym}</span>
            <span>Did not start</span>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>Start and finish position by driver</caption>
        <thead><tr><th scope="col">Driver</th><th scope="col">Lap 1</th><th scope="col">Final lap</th></tr></thead>
        <tbody>
          {activeDrivers.map(d => (
            <tr key={d.driverId}>
              <th scope="row">{d.acronym}</th>
              <td>{firstRow?.[d.driverId] != null ? `P${firstRow[d.driverId]}` : 'none'}</td>
              <td>{d.dnf ? `Out on lap ${d.lastLap}` : lastRow?.[d.driverId] != null ? `P${lastRow[d.driverId]}` : 'none'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
