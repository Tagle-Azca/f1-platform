import { useMemo } from 'react'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import CircuitSilhouette from '../circuit/CircuitSilhouette'
import SectorTooltip from './SectorTooltip'
import Panel from '../ui/Panel'
import { COLORS } from './telemetryConstants'

const SECTOR_KEYS = ['sector1', 'sector2', 'sector3']

// Sector summary card shown in compare mode
function SectorDeltaCard({ label, color, bestA, bestB, acronymA, acronymB, colorA, colorB }) {
  if (bestA == null || bestB == null) return null
  const delta = bestB - bestA  // positive = A faster
  const fmtS  = v => v != null ? `${v.toFixed(3)}s` : '—'
  const aFaster = delta > 0
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}30`,
      borderTop: `2px solid ${color}`,
      borderRadius: 8, padding: '0.6rem 0.75rem',
    }}>
      <div style={{ fontSize: '0.6rem', color, fontWeight: 800, letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>{acronymA}</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: aFaster ? colorA : 'var(--text-secondary)' }}>{fmtS(bestA)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>{acronymB}</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: !aFaster ? colorB : 'var(--text-secondary)' }}>{fmtS(bestB)}</span>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>Δ best</span>
          <span style={{
            fontSize: '0.72rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
            color: aFaster ? colorA : colorB,
          }}>
            {aFaster ? `${acronymA} +` : `${acronymB} +`}{Math.abs(delta * 1000).toFixed(0)}ms
          </span>
        </div>
      </div>
    </div>
  )
}

export default function SectorChart({
  validLaps,
  validLapsB,
  bestS1, bestS2, bestS3,
  activeSector,
  onSectorEnter,
  onSectorLeave,
  circuitCoords,
  isMobile,
  isComparing,
  driverA,
  driverB,
  colorA = '#e10600',
  colorB = '#3b82f6',
}) {
  // Merged per-lap sector data for comparison chart
  const mergedSectorData = useMemo(() => {
    if (!isComparing || !validLapsB?.length) return null
    const mapA = new Map(validLaps.map(l => [l.lap_number, l]))
    const mapB = new Map(validLapsB.map(l => [l.lap_number, l]))
    const allLaps = [...new Set([...mapA.keys(), ...mapB.keys()])].sort((a, b) => a - b)
    return allLaps.map(lap => {
      const a = mapA.get(lap)
      const b = mapB.get(lap)
      return {
        lap_number: lap,
        s1_a: a?.sector1 > 0 ? a.sector1 : null,
        s2_a: a?.sector2 > 0 ? a.sector2 : null,
        s3_a: a?.sector3 > 0 ? a.sector3 : null,
        s1_b: b?.sector1 > 0 ? b.sector1 : null,
        s2_b: b?.sector2 > 0 ? b.sector2 : null,
        s3_b: b?.sector3 > 0 ? b.sector3 : null,
      }
    })
  }, [isComparing, validLaps, validLapsB])

  // Best sector per driver for the summary cards
  const bestOf = (laps, key) => {
    const vals = laps?.filter(l => l[key] > 0).map(l => l[key]) || []
    return vals.length ? Math.min(...vals) : null
  }
  const bestA = { s1: bestOf(validLaps, 'sector1'), s2: bestOf(validLaps, 'sector2'), s3: bestOf(validLaps, 'sector3') }
  const bestB = { s1: bestOf(validLapsB, 'sector1'), s2: bestOf(validLapsB, 'sector2'), s3: bestOf(validLapsB, 'sector3') }

  const chartData  = isComparing ? mergedSectorData : validLaps
  const chartWidth = isMobile ? Math.max(560, (chartData?.length || 0) * (isComparing ? 20 : 14)) : undefined

  return (
    <Panel accent="cassandra" className="card" style={{ marginBottom: '0.85rem', borderTop: '2px solid rgba(168,85,247,0.35)', position: 'relative' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sector Times</h2>
          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            {isComparing
              ? `${driverA?.acronym} (solid) vs ${driverB?.acronym} (faded) · best sector Δ below`
              : 'Hover a bar to highlight sector on track · Purple = personal best'}
          </p>
          {!isComparing && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              {[['S1', COLORS.s1], ['S2', COLORS.s2], ['S3', COLORS.s3]].map(([s, c]) => (
                <span key={s} style={{
                  fontSize: '0.68rem', fontWeight: 700, color: c, padding: '1px 7px', borderRadius: 4,
                  background: activeSector === s ? `${c}30` : `${c}10`,
                  border: `1px solid ${activeSector === s ? `${c}80` : `${c}30`}`,
                  transition: 'all 0.12s',
                }}>{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Mini circuit map — single-driver mode only */}
        {!isComparing && circuitCoords?.length && (
          <div style={{ flexShrink: 0 }}>
            <CircuitSilhouette
              coords={circuitCoords}
              color="rgba(255,255,255,0.25)"
              width={110} height={70}
              strokeWidth={2}
              animate={false}
              activeSector={activeSector}
            />
          </div>
        )}
      </div>

      {/* Sector best-time summary in compare mode */}
      {isComparing && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <SectorDeltaCard label="S1" color={COLORS.s1} bestA={bestA.s1} bestB={bestB.s1} acronymA={driverA?.acronym} acronymB={driverB?.acronym} colorA={colorA} colorB={colorB} />
          <SectorDeltaCard label="S2" color={COLORS.s2} bestA={bestA.s2} bestB={bestB.s2} acronymA={driverA?.acronym} acronymB={driverB?.acronym} colorA={colorA} colorB={colorB} />
          <SectorDeltaCard label="S3" color={COLORS.s3} bestA={bestA.s3} bestB={bestB.s3} acronymA={driverA?.acronym} acronymB={driverB?.acronym} colorA={colorA} colorB={colorB} />
        </div>
      )}

      {/* Bar chart */}
      <div style={isMobile ? { overflowX: 'auto', marginLeft: '-0.25rem', marginRight: '-0.25rem' } : {}}>
        <div style={isMobile ? { minWidth: chartWidth } : {}}>
          <ResponsiveContainer width="100%" height={220}>
            {isComparing ? (
              <BarChart data={mergedSectorData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barCategoryGap="20%" barGap={1}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="lap_number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} width={42} tickFormatter={v => `${v.toFixed(0)}s`} />
                <Tooltip content={<SectorTooltip isComparing driverA={driverA} driverB={driverB} />} />
                {/* Driver A stacked group */}
                <Bar dataKey="s1_a" stackId="a" fill={COLORS.s1} name="S1-A" radius={[0,0,0,0]} />
                <Bar dataKey="s2_a" stackId="a" fill={COLORS.s2} name="S2-A" radius={[0,0,0,0]} />
                <Bar dataKey="s3_a" stackId="a" fill={COLORS.s3} name="S3-A" radius={[2,2,0,0]} />
                {/* Driver B stacked group — same colors, lower opacity */}
                <Bar dataKey="s1_b" stackId="b" fill={COLORS.s1} fillOpacity={0.45} name="S1-B" radius={[0,0,0,0]} />
                <Bar dataKey="s2_b" stackId="b" fill={COLORS.s2} fillOpacity={0.45} name="S2-B" radius={[0,0,0,0]} />
                <Bar dataKey="s3_b" stackId="b" fill={COLORS.s3} fillOpacity={0.45} name="S3-B" radius={[2,2,0,0]} />
              </BarChart>
            ) : (
              <BarChart data={validLaps} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="lap_number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} width={42} tickFormatter={v => `${v.toFixed(0)}s`} />
                <Tooltip content={<SectorTooltip />} />
                <Bar dataKey="sector1" stackId="a" name="S1" radius={[0,0,0,0]}
                  onMouseEnter={() => onSectorEnter('S1')} onMouseLeave={onSectorLeave}>
                  {validLaps.map((lap, idx) => (
                    <Cell key={idx} fill={bestS1 && lap.sector1 > 0 && lap.sector1 === bestS1 ? '#a855f7' : COLORS.s1} />
                  ))}
                </Bar>
                <Bar dataKey="sector2" stackId="a" name="S2" radius={[0,0,0,0]}
                  onMouseEnter={() => onSectorEnter('S2')} onMouseLeave={onSectorLeave}>
                  {validLaps.map((lap, idx) => (
                    <Cell key={idx} fill={bestS2 && lap.sector2 > 0 && lap.sector2 === bestS2 ? '#a855f7' : COLORS.s2} />
                  ))}
                </Bar>
                <Bar dataKey="sector3" stackId="a" name="S3" radius={[2,2,0,0]}
                  onMouseEnter={() => onSectorEnter('S3')} onMouseLeave={onSectorLeave}>
                  {validLaps.map((lap, idx) => (
                    <Cell key={idx} fill={bestS3 && lap.sector3 > 0 && lap.sector3 === bestS3 ? '#a855f7' : COLORS.s3} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </Panel>
  )
}
