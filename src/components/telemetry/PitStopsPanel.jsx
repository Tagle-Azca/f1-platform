import Panel from '../ui/Panel'
import StatCard from '../ui/StatCard'
import { COLORS } from './telemetryConstants'

function PitColumn({ stops, acronym, color, opposingStops }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 800, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        {acronym}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {stops.map(p => {
          const opp     = opposingStops?.find(o => o.stop_number === p.stop_number)
          const dur     = p.duration ?? null
          const durOpp  = opp?.duration ?? null
          const faster  = dur != null && durOpp != null ? dur < durOpp : null
          return (
            <div key={p.stop_number} style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${faster === true ? `${color}50` : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 8, padding: '0.5rem 0.75rem',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: `${color}20`, border: `1.5px solid ${color}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, color }}>{p.stop_number}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '1.05rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                  color: faster === true ? color : 'var(--text-primary)', lineHeight: 1,
                }}>
                  {dur != null ? `${dur.toFixed(1)}s` : '—'}
                </div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 1 }}>Lap {p.lap}</div>
              </div>
              {faster === true && (
                <span style={{ fontSize: '0.55rem', fontWeight: 800, color, background: `${color}18`, padding: '1px 5px', borderRadius: 3 }}>
                  +{((durOpp - dur) * 1000).toFixed(0)}ms
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PitStopsPanel({ pitStops, pitStopsB, isComparing, driverA, driverB, colorA = COLORS.lap, colorB = '#3b82f6' }) {
  const hasBStops = isComparing && pitStopsB?.length > 0

  return (
    <Panel accent="cassandra" className="card" style={{ borderTop: '2px solid rgba(168,85,247,0.35)' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pit Stops</h2>
        {hasBStops && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorA }} />
              <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>{driverA?.acronym}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorB }} />
              <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>{driverB?.acronym}</span>
            </div>
          </div>
        )}
      </div>

      {hasBStops ? (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <PitColumn stops={pitStops} acronym={driverA?.acronym || 'A'} color={colorA} opposingStops={pitStopsB} />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
          <PitColumn stops={pitStopsB} acronym={driverB?.acronym || 'B'} color={colorB} opposingStops={pitStops} />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {pitStops.map((p, i) => (
            <StatCard key={i} label={`Stop ${p.stop_number}`} value={p.duration?.toFixed(1) ?? '—'} sub={`Lap ${p.lap}`} accent="var(--cassandra-color)" />
          ))}
        </div>
      )}
    </Panel>
  )
}
