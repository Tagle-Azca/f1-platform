import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer,
} from 'recharts'
import Panel from '../ui/Panel'
import EmptyState from '../ui/EmptyState'

function formatTime(secs) {
  if (!secs || secs <= 0) return '—'
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

function PaceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(8,8,8,0.97)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.65rem 0.9rem', minWidth: 160 }}>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>Lap {label}</p>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: '#fff', flex: 1 }}>{p.name}</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: p.color, fontVariantNumeric: 'tabular-nums' }}>{formatTime(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function PaceChart({ chartData, driverMeta, pitLines, scPeriods, loading, isMobile }) {
  return (
    <Panel padding="none" className="card" style={{ padding: '1.25rem 1rem 1rem', overflow: isMobile ? 'auto' : 'visible' }}>
      {loading ? (
        <EmptyState type="loading" message="Loading pace data..." height={420} />
      ) : !chartData.length ? (
        <EmptyState type="empty" message="Select a race and drivers to compare" height={420} />
      ) : (
        <>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.06em' }}>
            DASHED LINES = pit stop laps · anomalous laps (SC/pit in-out) hidden for clarity
          </div>
          <div style={{ minWidth: isMobile ? 520 : 0 }}>
            <ResponsiveContainer width="100%" height={isMobile ? 320 : 420}>
              <LineChart data={chartData} margin={{ top: 5, right: 16, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="lap" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} label={{ value: 'Lap', position: 'insideBottomRight', offset: -5, fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                <YAxis reversed tickFormatter={formatTime} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} tickLine={false} axisLine={false} width={52} domain={['auto', 'auto']} />
                <Tooltip content={<PaceTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} wrapperStyle={{ zIndex: 9999 }} />
                {scPeriods.map(({ x1, x2 }) => (
                  <ReferenceArea key={`sc-${x1}`} x1={x1} x2={x2} fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.3)" strokeWidth={1} label={{ value: 'SC/VSC', position: 'insideTop', fill: 'rgba(245,158,11,0.75)', fontSize: 9, fontWeight: 700 }} />
                ))}
                {pitLines.map(lap => (
                  <ReferenceLine key={`pit-${lap}`} x={lap} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 3" label={{ value: 'PIT', position: 'top', fill: 'rgba(255,255,255,0.2)', fontSize: 8 }} />
                ))}
                {driverMeta.map(d => (
                  <Line key={d.driverId} type="monotone" dataKey={d.driverId} name={d.acronym} stroke={d.color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: d.color }} connectNulls isAnimationActive={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Panel>
  )
}
