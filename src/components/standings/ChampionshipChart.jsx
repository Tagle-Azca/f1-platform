import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import ChartTooltip from './ChartTooltip'
import { useBreakpoint } from '../../hooks/useBreakpoint'

function EndLabel({ viewBox, color, name }) {
  if (!viewBox) return null
  const { x, y } = viewBox
  return (
    <text x={x + 6} y={y + 4} fill={color} fontSize={9} fontWeight={600} dominantBaseline="middle">
      {name?.split(' ').pop()}
    </text>
  )
}

export default function ChampionshipChart({
  chartData,
  fullChartData,
  drivers,
  data,
  loading,
  season,
  isPlaying,
  capped,
  totalRounds,
  currentRound,
  onPlayPause,
  onScrub,
}) {
  const { isMobile } = useBreakpoint()
  const [tooltipPos, setTooltipPos] = useState(undefined)
  const chartHeight = isMobile
    ? Math.round(window.innerHeight * 0.42)
    : 400

  // Always render full season data so Recharts never re-animates from scratch.
  // The HTML curtain div handles hiding future rounds.
  const renderData = fullChartData?.length ? fullChartData : chartData

  // Chart margins — must match what we pass to LineChart
  const marginRight = isMobile ? 28 : 80
  const yAxisWidth  = 38
  const fraction    = totalRounds > 0 ? Math.min(capped / totalRounds, 1) : 1

  // Curtain sits between the Y-axis and the right label area.
  // `left` is calculated as: yAxisWidth + chartArea * fraction
  // `right` is the right margin (label area stays visible)
  const curtainLeft = `calc(${yAxisWidth}px + (100% - ${yAxisWidth + marginRight}px) * ${fraction})`

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="card" style={{ padding: isMobile ? '0.75rem 0.5rem 0.75rem' : '1.25rem 1rem 1rem', overflow: 'visible' }}>
        {loading ? (
          <div style={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Loading season {season}...</p>
          </div>
        ) : !data?.rounds.length ? (
          <div style={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No data for {season}</p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart
                data={renderData}
                margin={{ top: 5, right: marginRight, left: 0, bottom: 5 }}
                onMouseMove={state => {
                  if (state?.isTooltipActive && state.chartX != null) {
                    const w = state.viewBox?.width ?? 500
                    setTooltipPos(state.chartX > w * 0.55
                      ? { x: state.chartX - 230, y: 10 }
                      : undefined)
                  }
                }}
                onMouseLeave={() => setTooltipPos(undefined)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="_round"
                  type="number"
                  domain={[1, totalRounds]}
                  tickCount={Math.min(totalRounds, 20)}
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickFormatter={v => `R${v}`}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={yAxisWidth}
                />
                <Tooltip
                  content={<ChartTooltip rounds={data.rounds} cappedRound={capped} />}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                  position={tooltipPos}
                  wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
                />
                {drivers.map((d, i) => (
                  <Line
                    key={d.driverId}
                    type="monotone"
                    dataKey={d.driverId}
                    name={d.name}
                    stroke={d.color}
                    strokeWidth={i === 0 ? 3 : i < 3 ? 2 : 1.5}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: d.color }}
                    strokeOpacity={i < 3 ? 1 : 0.55}
                    isAnimationActive={false}
                    label={i < 5 ? <EndLabel color={d.color} name={d.name} /> : false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* ── HTML curtain: hides future rounds, retreats smoothly ── */}
            {fraction < 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: 5,
                  bottom: 5,
                  left: curtainLeft,
                  right: 0,
                  background: `linear-gradient(to right,
                    transparent,
                    rgba(22,22,22,0.85) 18%,
                    rgba(22,22,22,0.98) 40%,
                    rgb(22,22,22) 60%
                  )`,
                  transition: isPlaying ? 'left 620ms linear' : 'none',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              />
            )}
          </div>
        )}
      </div>

      {data && !!data.rounds.length && (
        <div className="card" style={{ padding: '0.65rem 0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              className="btn btn--ghost"
              style={{ fontSize: '0.78rem', minWidth: isMobile ? 64 : 90, padding: '0.25rem 0.6rem', flexShrink: 0 }}
              onClick={onPlayPause}
            >
              {isPlaying ? 'Pause' : capped >= totalRounds ? 'Replay' : 'Play'}
            </button>

            <input
              type="range"
              min={1}
              max={totalRounds}
              value={capped}
              onChange={e => onScrub(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--f1-red)', cursor: 'pointer' }}
            />

            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              R{capped}/{totalRounds}
            </span>
          </div>

          {currentRound && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem', paddingLeft: isMobile ? 72 : 98, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentRound.raceName}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
