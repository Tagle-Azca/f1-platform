import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

function ProgressTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.55rem 0.8rem', fontSize: '0.72rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.1rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{p.value} pts</span>
        </div>
      ))}
    </div>
  )
}

export default function ConstructorPointsProgress({ constructorId, currentStandings, prevStandings, currentYear, color }) {
  if (!currentStandings) return null

  const prevYear = String(parseInt(currentYear) - 1)

  const curEntry  = currentStandings.constructors?.find(c => c.constructorId === constructorId)
  const prevEntry = prevStandings?.constructors?.find(c => c.constructorId === constructorId)

  if (!curEntry?.cumulative?.length) return null

  const rounds   = currentStandings.rounds || []
  const prevRnds = prevStandings?.rounds   || []

  const chartData = curEntry.cumulative.map((pts, i) => ({
    name:    rounds[i] ? rounds[i].raceName.replace(' Grand Prix', '').replace(' GP', '') : `R${i + 1}`,
    current: pts,
    prev:    prevEntry?.cumulative?.[i] ?? null,
  }))

  const trend = curEntry.cumulative.length >= 2
    ? curEntry.cumulative[curEntry.cumulative.length - 1] - (prevEntry?.cumulative?.[curEntry.cumulative.length - 1] ?? 0)
    : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Points Progression</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentYear} vs {prevYear}</div>
        </div>
        {trend !== null && (
          <div style={{
            fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 5,
            background: trend >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            color: trend >= 0 ? '#22c55e' : '#ef4444',
            border: `1px solid ${trend >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            {trend >= 0 ? '+' : ''}{trend} pts vs {prevYear}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-cur-${constructorId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--fill-color)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--fill-color)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
          <Tooltip content={<ProgressTooltip />} />
          {prevEntry && (
            <Area dataKey="prev" name={prevYear} stroke="rgba(255,255,255,0.2)" fill="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="4 3" dot={false} />
          )}
          <Area dataKey="current" name={currentYear} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
