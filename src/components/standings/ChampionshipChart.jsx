import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import ChartTooltip from './ChartTooltip'

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
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="card" style={{ padding: '1.25rem 1rem 1rem' }}>
        {loading ? (
          <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Loading season {season}...</p>
          </div>
        ) : !data?.rounds.length ? (
          <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No data for {season}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 80, left: 0, bottom: 5 }}>
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
                width={38}
              />
              <Tooltip
                content={<ChartTooltip rounds={data.rounds} />}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
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
        )}
      </div>

      {data && !!data.rounds.length && (
        <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn btn--ghost"
            style={{ fontSize: '0.82rem', minWidth: 90 }}
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

          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0, minWidth: 150, textAlign: 'right' }}>
            {currentRound ? `R${capped}/${totalRounds} · ${currentRound.raceName}` : '—'}
          </span>
        </div>
      )}
    </div>
  )
}
