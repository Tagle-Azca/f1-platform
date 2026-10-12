import { useState } from 'react'
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import TyreBadge from '../ui/TyreBadge'
import LapTooltip from './LapTooltip'
import TelemetrySection, { Legend, LineSwatch, BlockSwatch } from './TelemetrySection'
import { fmtLap, paceDomain } from './telemetryUtils'
import { AXIS_TICK_NUM, AXIS_LINE, GRID, animationProps } from '../../styles/chartTheme'
import { tyre } from '../../styles/vizPalette'
import { useReducedMotion } from '../../styles/motion'
import { safeString } from '../../utils/safeText'

const BAND = { SC: 'var(--pw-orange)', VSC: 'var(--pw-yellow)' }

// Compound-colored dot; hidden on mobile where 50+ dots turn into noise
function CompoundDot({ cx, cy, payload, compoundKey, isMobile }) {
  if (isMobile) return null
  const t = tyre(payload?.[compoundKey])
  if (!t || cx == null || cy == null) return null
  return <circle cx={cx} cy={cy} r={3.5} fill={t.css} stroke="var(--pw-panel)" strokeWidth={1} />
}

export default function CassandraLapChart({
  mergedLaps, scPeriods, pitStops, pitStopsB, avgLap,
  isComparing, driverIdB, driverA, driverB, stintAnalysis, isMobile,
  colorA, colorB, animationId,
}) {
  const reduced = useReducedMotion()
  // 'all' = every lap on a full scale; 'pace' = scale cut at 108% of the median so racing laps are readable
  const [view, setView] = useState('all')

  const times = mergedLaps.flatMap(l => [l.a, l.b])
  const clamp = paceDomain(times)
  const clamped = Boolean(clamp) && view === 'pace'

  const maxLap = mergedLaps.length ? mergedLaps[mergedLaps.length - 1].lap_number : 0
  const minLap = mergedLaps.length ? mergedLaps[0].lap_number : 0
  const bands = scPeriods.filter(p => p.lapStart <= maxLap && p.lapEnd >= minLap)

  const compounds = [...new Set(stintAnalysis.map(s => s.compound))].filter(c => tyre(c))
  const legend = isComparing
    ? [
        { key: 'a', swatch: <LineSwatch color={colorA} />, label: safeString(driverA?.acronym) },
        { key: 'b', swatch: <LineSwatch color={colorB} dashed />, label: safeString(driverB?.acronym) },
      ]
    : isMobile ? [] : compounds.map(c => ({ key: c, swatch: <TyreBadge compound={c} />, label: tyre(c).name }))
  if (bands.length) legend.push({ key: 'sc', swatch: <BlockSwatch color="var(--pw-orange)" />, label: 'Safety car' })

  const lapsWord = (n) => `${n} ${n === 1 ? 'lap' : 'laps'}`
  const caption = clamped
    ? `Racing laps only. ${lapsWord(clamp.over)} slower than ${fmtLap(clamp.cap)} (start, pit stops, safety car) are above the chart.`
    : `Every lap${clamp ? ', including the start, pit stops and safety car laps' : ''}. ${isComparing ? 'Hover a lap for the gap between the two drivers.' : 'Dots show the tyre compound.'}`

  return (
    <TelemetrySection
      id="laps-h"
      title={clamped ? 'Race pace' : 'Lap times'}
      caption={caption}
      aside={(
        <div className="flex flex-wrap items-center gap-pw-3">
          {legend.length > 0 && <Legend items={legend} />}
          {clamp && (
            <div role="group" aria-label="Lap chart view" className="inline-flex rounded-md border border-edge p-0.5">
              {[['all', 'All laps'], ['pace', 'Race pace']].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={view === key}
                  onClick={() => setView(key)}
                  className={`min-h-9 cursor-pointer rounded-[10px] px-pw-3 text-xs font-medium transition-colors duration-150 motion-reduce:transition-none ${
                    view === key ? 'bg-steel-soft text-steel' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    >
      <div role="img" aria-label={`${clamped ? 'Race pace' : 'Lap times'} for ${safeString(driverA?.fullName) || 'the driver'}${isComparing ? ` and ${safeString(driverB?.fullName)}` : ''}, laps ${minLap} to ${maxLap}`}>
        <ResponsiveContainer width="100%" height={isMobile ? 240 : 300}>
          <LineChart data={mergedLaps} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="lap_number" tick={AXIS_TICK_NUM} tickLine={false} axisLine={AXIS_LINE} minTickGap={12} />
            <YAxis
              tick={AXIS_TICK_NUM} tickLine={false} axisLine={false} width={64} tickFormatter={v => fmtLap(v).replace(/\.\d+$/, '')}
              domain={clamped ? clamp.domain : ['auto', 'auto']} allowDataOverflow={Boolean(clamped)}
            />
            <Tooltip
              cursor={{ stroke: 'var(--viz-baseline)' }}
              content={<LapTooltip pitStops={pitStops} pitStopsB={pitStopsB} driverA={driverA} driverB={isComparing ? driverB : null} colorA={colorA} colorB={colorB} />}
            />

            {/* SC / VSC bands, clamped to the driver's lap range so a DNF isn't washed to the edge */}
            {bands.map((p, i) => (
              <ReferenceArea
                key={i} x1={Math.max(p.lapStart, minLap)} x2={Math.min(p.lapEnd, maxLap)}
                fill={BAND[p.type] ?? BAND.SC} fillOpacity={0.1} stroke="none" ifOverflow="hidden"
                label={{ value: p.type, position: 'insideTop', fill: 'var(--pw-ink-2)', fontSize: 11 }}
              />
            ))}

            {!isComparing && avgLap && (!clamped || avgLap <= clamp.cap) && (
              <ReferenceLine
                y={avgLap} stroke="var(--viz-baseline)" strokeDasharray="6 4"
                label={{ value: `Average ${fmtLap(avgLap)}`, position: 'insideBottomRight', fill: 'var(--pw-ink-3)', fontSize: 11 }}
              />
            )}

            {pitStops.map(p => (
              <ReferenceLine
                key={`a-${p.stop_number}`} x={p.lap} stroke="var(--viz-axis)" strokeDasharray="3 3"
                label={{ value: `Pit ${p.stop_number}`, position: 'top', fill: 'var(--pw-ink-3)', fontSize: 11 }}
              />
            ))}
            {isComparing && pitStopsB.map(p => (
              <ReferenceLine key={`b-${p.stop_number}`} x={p.lap} stroke={colorB} strokeOpacity={0.4} strokeDasharray="3 3" />
            ))}

            <Line
              type="monotone" dataKey="a" name={driverA?.acronym || 'A'} stroke={colorA} strokeWidth={2}
              dot={<CompoundDot compoundKey="compound_a" isMobile={isMobile} />}
              activeDot={{ r: 5, fill: colorA, strokeWidth: 0 }} connectNulls={false}
              {...animationProps(reduced, `${animationId}-a`)}
            />
            {driverIdB && (
              <Line
                type="monotone" dataKey="b" name={driverB?.acronym || 'B'} stroke={colorB} strokeWidth={2} strokeDasharray="6 3"
                dot={<CompoundDot compoundKey="compound_b" isMobile={isMobile} />}
                activeDot={{ r: 5, fill: colorB, strokeWidth: 0 }} connectNulls={false}
                {...animationProps(reduced, `${animationId}-b`)}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </TelemetrySection>
  )
}
