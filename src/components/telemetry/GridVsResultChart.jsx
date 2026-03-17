import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'

export default function GridVsResultChart({ races }) {
  if (!races.length) return null
  const data = races.map(r => ({
    name: r.raceName,
    Grid: r.grid,
    Result: r.position,
  })).filter(r => r.Grid != null || r.Result != null)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 60 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          interval={0}
          angle={-45}
          textAnchor="end"
        />
        <YAxis
          reversed
          tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={22}
          domain={[1, 'dataMax']}
          label={{ value: 'Pos', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{ background: 'rgba(10,10,10,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
          labelStyle={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 4 }}
          formatter={(v, name) => [v != null ? `P${v}` : '—', name]}
        />
        <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }} />
        <Bar dataKey="Grid"   fill="#f59e0b" name="Grid"   radius={[3,3,0,0]} maxBarSize={18} />
        <Bar dataKey="Result" fill="#e10600" name="Result" radius={[3,3,0,0]} maxBarSize={18}>
          {data.map((entry, i) => {
            const gained = entry.Grid != null && entry.Result != null ? entry.Grid - entry.Result : 0
            return <Cell key={i} fill={gained > 0 ? '#22c55e' : gained < 0 ? '#e10600' : '#a855f7'} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
