import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { AXIS_TICK, AXIS_TICK_NUM, AXIS_LINE, GRID, TOOLTIP, animationProps } from '../../styles/chartTheme'
import { useReducedMotion } from '../../styles/motion'
import { GRID_FILL, RESULT_FILL } from './telemetryConstants'

export default function GridVsResultChart({ races, animationId = 'grid' }) {
  const reduced = useReducedMotion()
  if (!races.length) return null
  const data = races
    .map(r => ({ name: r.raceName?.replace(/ Grand Prix$/, ''), Grid: r.grid, Result: r.position }))
    .filter(r => r.Grid != null || r.Result != null)

  return (
    <div role="img" aria-label={`Grid and finishing position for ${data.length} races`}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 56 }} barGap={2}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} interval={0} angle={-45} textAnchor="end" />
          <YAxis reversed tick={AXIS_TICK_NUM} tickLine={false} axisLine={false} width={28} domain={[1, 'dataMax']} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'var(--pw-hover)' }}
            {...TOOLTIP}
            formatter={(v, name) => [v != null ? `P${v}` : '—', name === 'Grid' ? 'Started' : 'Finished']}
          />
          <Bar dataKey="Grid" fill={GRID_FILL} radius={[2, 2, 0, 0]} maxBarSize={16} {...animationProps(reduced, `${animationId}-g`)} />
          <Bar dataKey="Result" radius={[2, 2, 0, 0]} maxBarSize={16} {...animationProps(reduced, `${animationId}-r`)}>
            {data.map((d, i) => {
              const gained = d.Grid != null && d.Result != null ? d.Grid - d.Result : 0
              return <Cell key={i} fill={gained > 0 ? RESULT_FILL.gained : gained < 0 ? RESULT_FILL.lost : RESULT_FILL.same} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
