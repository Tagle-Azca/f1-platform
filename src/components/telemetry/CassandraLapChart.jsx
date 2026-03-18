import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import Panel from '../ui/Panel'
import LapTooltip from './LapTooltip'
import { COLORS, COLOR_B, COMPOUND_COLORS } from './telemetryConstants'
import { fmtLap } from './telemetryUtils'

// Compound-colored dot — hidden on mobile to keep the chart readable
function CompoundDot({ cx, cy, payload, compoundKey, isMobile }) {
  if (isMobile) return null
  const compound = payload?.[compoundKey]
  if (!compound || cx == null || cy == null) return null
  const color = COMPOUND_COLORS[compound] || '#6b7280'
  return <circle cx={cx} cy={cy} r={3.5} fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth={0.5} />
}

export default function CassandraLapChart({
  mergedLaps,
  scPeriods,
  pitStops,
  pitStopsB,
  avgLap,
  isComparing,
  driverIdB,
  driverA,
  driverB,
  stintAnalysis,
  isMobile,
}) {
  return (
    <Panel accent="cassandra" className="card" style={{ marginBottom: '0.85rem', borderTop: '2px solid rgba(168,85,247,0.35)' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lap Times</h2>
          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            {isComparing
              ? 'Solid = Driver A · Dashed = Driver B · hover for Δ delta'
              : isMobile
                ? 'Orange band = SC · Yellow band = VSC'
                : 'Dots colored by tyre compound · Orange band = SC · Yellow band = VSC'}
          </p>
        </div>

        {/* Compound legend — single-driver desktop mode */}
        {!isComparing && !isMobile && stintAnalysis.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {stintAnalysis.map(s => (
              <div key={s.index} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COMPOUND_COLORS[s.compound] || '#6b7280', flexShrink: 0 }} />
                <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.45)' }}>{s.compound}</span>
              </div>
            ))}
          </div>
        )}

        {/* Driver legend — compare mode */}
        {isComparing && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 18, height: 2.5, background: COLORS.lap, borderRadius: 1 }} />
              <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)' }}>{driverA?.acronym}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke={COLOR_B} strokeWidth="2.5" strokeDasharray="4 3" /></svg>
              <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)' }}>{driverB?.acronym}</span>
            </div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={mergedLaps} margin={{ top: 8, right: 24, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="lap_number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} label={{ value: 'Lap', position: 'insideBottomRight', fill: 'rgba(255,255,255,0.3)', fontSize: 10, offset: -4 }} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} width={55} domain={['auto', 'auto']} tickFormatter={fmtLap} />
          <Tooltip content={<LapTooltip pitStops={pitStops} pitStopsB={pitStopsB} driverA={driverA} driverB={isComparing ? driverB : null} />} />

          {/* SC / VSC bands */}
          {scPeriods.map((p, i) => (
            <ReferenceArea key={i} x1={p.lapStart} x2={p.lapEnd}
              fill={p.type === 'SC' ? '#f59e0b' : '#facc15'} fillOpacity={0.10}
              stroke={p.type === 'SC' ? '#f59e0b' : '#facc15'} strokeOpacity={0.3} strokeWidth={1}
              label={{ value: p.type, position: 'insideTop', fill: p.type === 'SC' ? '#f59e0b' : '#facc15', fontSize: 9, fontWeight: 700 }}
            />
          ))}

          {/* Avg line — single-driver only */}
          {!isComparing && avgLap && (
            <ReferenceLine y={avgLap} stroke="rgba(255,255,255,0.28)" strokeDasharray="6 4"
              label={{ value: `Avg ${fmtLap(avgLap)}`, position: 'insideTopRight', fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
            />
          )}

          {/* Pit markers */}
          {pitStops.map(p => (
            <ReferenceLine key={`a-${p.stop_number}`} x={p.lap} stroke="#fbbf2466" strokeWidth={1.5} strokeDasharray="4 3"
              label={{ value: `P${p.stop_number}`, position: 'top', fill: '#fbbf24', fontSize: 9 }} />
          ))}
          {isComparing && pitStopsB.map(p => (
            <ReferenceLine key={`b-${p.stop_number}`} x={p.lap} stroke={`${COLOR_B}55`} strokeWidth={1.5} strokeDasharray="4 3" />
          ))}

          {/* Driver A — solid */}
          <Line
            type="monotone" dataKey="a" name={driverA?.acronym || 'A'}
            stroke={COLORS.lap}
            dot={<CompoundDot compoundKey="compound_a" isMobile={isMobile} />}
            strokeWidth={2} activeDot={{ r: 5, fill: COLORS.lap, strokeWidth: 0 }}
            connectNulls={false}
          />
          {/* Driver B — dashed */}
          {driverIdB && (
            <Line
              type="monotone" dataKey="b" name={driverB?.acronym || 'B'}
              stroke={COLOR_B}
              dot={<CompoundDot compoundKey="compound_b" isMobile={isMobile} />}
              strokeWidth={2} strokeDasharray="5 4"
              activeDot={{ r: 5, fill: COLOR_B, strokeWidth: 0 }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Panel>
  )
}
