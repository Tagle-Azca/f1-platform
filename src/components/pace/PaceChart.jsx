import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer,
} from 'recharts'
import { AXIS_TICK_NUM, AXIS_LINE, GRID, animationProps } from '../../styles/chartTheme'
import { useReducedMotion } from '../../styles/motion'
import { formatLapTime } from './paceModel'

const BOX = 'min-w-40 rounded-md border border-edge bg-raise px-pw-3 py-pw-2 shadow-lg'

function Swatch({ color, dashed }) {
  return (
    <svg aria-hidden="true" width="18" height="4" className="shrink-0">
      <line x1="0" y1="2" x2="18" y2="2" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '6 3' : undefined} />
    </svg>
  )
}

function PaceTooltip({ active, payload, label, meta }) {
  if (!active || !payload?.length) return null
  return (
    <div className={BOX}>
      <p className="mb-pw-1 text-xs font-semibold text-ink">Lap {label}</p>
      <div className="flex flex-col gap-pw-1">
        {payload.map(p => {
          const m = meta.get(p.dataKey)
          return (
            <div key={p.dataKey} className="flex items-center gap-pw-2 text-xs">
              <Swatch color={m?.color ?? p.color} dashed={m?.dashed} />
              <span className="flex-1 text-ink-2">{p.name}</span>
              <span className="num text-ink">{formatLapTime(p.value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Lap-time lines for the selected drivers: fastest at the top, pit laps dashed, safety-car runs shaded. */
export default function PaceChart({ chartData, driverMeta, pitLines, scPeriods, isMobile, animationId }) {
  const reduced = useReducedMotion()
  const meta = new Map(driverMeta.map(d => [d.driverId, d]))
  return (
    <div role="img" aria-label={`Lap times for ${driverMeta.map(d => d.acronym).join(', ')}, laps 1 to ${chartData.length}. The summary above lists best lap and median.`}>
      <ResponsiveContainer width="100%" height={isMobile ? 280 : 380}>
        <LineChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="lap" tick={AXIS_TICK_NUM} tickLine={false} axisLine={AXIS_LINE} minTickGap={12} />
          <YAxis reversed tickFormatter={formatLapTime} tick={AXIS_TICK_NUM} tickLine={false} axisLine={false} width={64} domain={['auto', 'auto']} />
          <Tooltip content={<PaceTooltip meta={meta} />} cursor={{ stroke: 'var(--viz-baseline)' }} />
          {scPeriods.map(({ x1, x2 }) => (
            <ReferenceArea
              key={`sc-${x1}`} x1={x1} x2={x2} fill="var(--viz-flash-neutral)" fillOpacity={1} stroke="none"
              label={{ value: 'Safety car', position: 'insideTop', fill: 'var(--pw-ink-2)', fontSize: 11 }}
            />
          ))}
          {pitLines.map(lap => (
            <ReferenceLine key={`pit-${lap}`} x={lap} stroke="var(--viz-now)" strokeDasharray="4 3" strokeOpacity={0.5} />
          ))}
          {driverMeta.map(d => (
            <Line
              key={d.driverId} type="monotone" dataKey={d.driverId} name={d.acronym}
              stroke={d.color} strokeWidth={2} strokeDasharray={d.dashed ? '6 3' : undefined}
              dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: d.color }} connectNulls
              {...animationProps(reduced, `${animationId}-${d.driverId}`)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
