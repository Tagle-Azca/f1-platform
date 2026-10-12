import { useMemo } from 'react'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import CircuitSilhouette from '../circuit/CircuitSilhouette'
import TeamBar from '../viz/TeamBar'
import SectorTooltip from './SectorTooltip'
import TelemetrySection, { Legend, BlockSwatch } from './TelemetrySection'
import { fmtDelta } from './telemetryUtils'
import { AXIS_TICK_NUM, AXIS_LINE, GRID, animationProps } from '../../styles/chartTheme'
import { useReducedMotion } from '../../styles/motion'
import { safeString } from '../../utils/safeText'

// Three steps of one hue so the stack reads as one lap; session best stands out in violet
const SECTOR_FILL = { S1: 'var(--pw-steel-hi)', S2: 'var(--pw-steel)', S3: 'var(--viz-axis)' }
const BEST_FILL = 'var(--viz-sector-best)'

const bestOf = (laps, key) => {
  const vals = laps?.filter(l => l[key] > 0).map(l => l[key]) || []
  return vals.length ? Math.min(...vals) : null
}

/** Best-sector comparison as a 3-up hairline strip (compare mode). */
function SectorDeltaStrip({ validLaps, validLapsB, driverA, driverB, colorA, colorB }) {
  const rows = ['sector1', 'sector2', 'sector3'].map((k, i) => ({ label: `Sector ${i + 1}`, a: bestOf(validLaps, k), b: bestOf(validLapsB, k) }))
  return (
    <dl className="mb-pw-5 grid grid-cols-1 gap-y-pw-3 sm:grid-cols-3 sm:divide-x sm:divide-edge-soft">
      {rows.map((r, i) => {
        const d = r.a != null && r.b != null ? r.b - r.a : null
        const faster = d == null ? null : d > 0 ? driverA : d < 0 ? driverB : null
        return (
          <div key={r.label} className={`min-w-0 ${i === 0 ? 'sm:pr-pw-4' : 'sm:px-pw-4'}`}>
            <dt className="text-xs text-ink-3">{r.label} best</dt>
            <dd className="mt-pw-1 flex flex-col gap-pw-1">
              <span className="flex items-center gap-pw-2 text-xs text-ink-2"><TeamBar color={colorA} height={12} width={3} />{safeString(driverA?.acronym)}<span className="num ml-auto text-ink">{r.a?.toFixed(3) ?? '—'}</span></span>
              <span className="flex items-center gap-pw-2 text-xs text-ink-2"><TeamBar color={colorB} height={12} width={3} />{safeString(driverB?.acronym)}<span className="num ml-auto text-ink">{r.b?.toFixed(3) ?? '—'}</span></span>
              {d != null && (
                <span className="text-xs text-ink-2">
                  {faster ? <>{safeString(faster.acronym)} faster by <span className="num text-ink">{fmtDelta(Math.abs(d)).slice(1)}</span></> : 'Same time'}
                </span>
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

export default function SectorChart({
  validLaps, validLapsB,
  bestS1, bestS2, bestS3,
  activeSector, onSectorEnter, onSectorLeave,
  circuitCoords, isMobile, isComparing,
  driverA, driverB, colorA, colorB, animationId,
}) {
  const reduced = useReducedMotion()

  const mergedSectorData = useMemo(() => {
    if (!isComparing || !validLapsB?.length) return null
    const mapA = new Map(validLaps.map(l => [l.lap_number, l]))
    const mapB = new Map(validLapsB.map(l => [l.lap_number, l]))
    const allLaps = [...new Set([...mapA.keys(), ...mapB.keys()])].sort((a, b) => a - b)
    const v = (x) => (x > 0 ? x : null)
    return allLaps.map(lap => {
      const a = mapA.get(lap), b = mapB.get(lap)
      return {
        lap_number: lap,
        s1_a: v(a?.sector1), s2_a: v(a?.sector2), s3_a: v(a?.sector3),
        s1_b: v(b?.sector1), s2_b: v(b?.sector2), s3_b: v(b?.sector3),
      }
    })
  }, [isComparing, validLaps, validLapsB])

  const chartData  = isComparing ? mergedSectorData : validLaps
  const chartWidth = isMobile ? Math.max(560, (chartData?.length || 0) * (isComparing ? 20 : 14)) : undefined
  const best = { sector1: bestS1, sector2: bestS2, sector3: bestS3 }
  const anim = (k) => animationProps(reduced, `${animationId}-${k}`)

  const legend = [
    ...['S1', 'S2', 'S3'].map((s, i) => ({ key: s, swatch: <BlockSwatch color={SECTOR_FILL[s]} />, label: `Sector ${i + 1}` })),
    ...(isComparing ? [] : [{ key: 'best', swatch: <BlockSwatch color={BEST_FILL} />, label: 'Best of race' }]),
  ]

  return (
    <TelemetrySection
      id="sectors-h"
      title="Sectors"
      caption={isComparing
        ? `Each lap shows ${safeString(driverA?.acronym)} (left, full) and ${safeString(driverB?.acronym)} (right, faded).`
        : 'Each bar is one lap split into its three sectors. Hover a sector to find it on the track.'}
      aside={(
        <div className="flex items-center gap-pw-4">
          <Legend items={legend} />
          {!isComparing && circuitCoords?.length > 0 && (
            <div className="hidden shrink-0 md:block" aria-hidden="true">
              <CircuitSilhouette coords={circuitCoords} color="var(--pw-ink-3)" width={96} height={60} strokeWidth={2} animate={false} activeSector={activeSector} />
            </div>
          )}
        </div>
      )}
    >
      {isComparing && (
        <SectorDeltaStrip validLaps={validLaps} validLapsB={validLapsB} driverA={driverA} driverB={driverB} colorA={colorA} colorB={colorB} />
      )}

      <div className={isMobile ? '-mx-pw-1 overflow-x-auto' : ''}>
        <div style={isMobile ? { minWidth: chartWidth } : undefined}>
          <ResponsiveContainer width="100%" height={220}>
            {isComparing ? (
              <BarChart data={mergedSectorData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} barCategoryGap="20%" barGap={1}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="lap_number" tick={AXIS_TICK_NUM} tickLine={false} axisLine={AXIS_LINE} minTickGap={12} />
                <YAxis tick={AXIS_TICK_NUM} tickLine={false} axisLine={false} width={44} tickFormatter={v => `${v.toFixed(0)} s`} />
                <Tooltip cursor={{ fill: 'var(--pw-hover)' }} content={<SectorTooltip driverA={driverA} driverB={driverB} />} />
                <Bar dataKey="s1_a" stackId="a" fill={SECTOR_FILL.S1} {...anim('s1a')} />
                <Bar dataKey="s2_a" stackId="a" fill={SECTOR_FILL.S2} {...anim('s2a')} />
                <Bar dataKey="s3_a" stackId="a" fill={SECTOR_FILL.S3} radius={[2, 2, 0, 0]} {...anim('s3a')} />
                <Bar dataKey="s1_b" stackId="b" fill={SECTOR_FILL.S1} fillOpacity={0.4} {...anim('s1b')} />
                <Bar dataKey="s2_b" stackId="b" fill={SECTOR_FILL.S2} fillOpacity={0.4} {...anim('s2b')} />
                <Bar dataKey="s3_b" stackId="b" fill={SECTOR_FILL.S3} fillOpacity={0.4} radius={[2, 2, 0, 0]} {...anim('s3b')} />
              </BarChart>
            ) : (
              <BarChart data={validLaps} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} barCategoryGap="20%">
                <CartesianGrid {...GRID} />
                <XAxis dataKey="lap_number" tick={AXIS_TICK_NUM} tickLine={false} axisLine={AXIS_LINE} minTickGap={12} />
                <YAxis tick={AXIS_TICK_NUM} tickLine={false} axisLine={false} width={44} tickFormatter={v => `${v.toFixed(0)} s`} />
                <Tooltip cursor={{ fill: 'var(--pw-hover)' }} content={<SectorTooltip />} />
                {[['sector1', 'S1'], ['sector2', 'S2'], ['sector3', 'S3']].map(([key, s], i) => (
                  <Bar
                    key={key} dataKey={key} stackId="a" radius={i === 2 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                    onMouseEnter={() => onSectorEnter(s)} onMouseLeave={onSectorLeave} {...anim(key)}
                  >
                    {validLaps.map((lap, idx) => (
                      <Cell key={idx} fill={best[key] && lap[key] > 0 && lap[key] === best[key] ? BEST_FILL : SECTOR_FILL[s]} />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </TelemetrySection>
  )
}
