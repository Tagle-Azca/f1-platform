import Panel from '../ui/Panel'
import { COMPOUND_COLORS, COMPOUND_LABEL } from './telemetryConstants'

export default function TyreAnalysisPanel({ stintAnalysis }) {
  return (
    <Panel accent="cassandra" className="card" style={{ marginBottom: '0.85rem', borderTop: '2px solid rgba(168,85,247,0.35)' }}>
      <div style={{ marginBottom: '0.85rem' }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tyre Analysis</h2>
        <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          Degradation = linear lap-time trend per lap · outliers excluded
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {stintAnalysis.map(s => {
          const color  = COMPOUND_COLORS[s.compound] || '#6b7280'
          const label  = COMPOUND_LABEL[s.compound]  || '?'
          const dms    = s.degradMs
          const maxDeg = 200 // ms — scale bar against this ceiling
          const pct    = dms != null ? Math.min(100, Math.abs(dms) / maxDeg * 100) : 0
          const degradColor = dms == null ? '#6b7280' : dms > 80 ? '#ef4444' : dms > 40 ? '#f59e0b' : '#22c55e'
          return (
            <div key={s.index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Compound badge */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: s.compound === 'HARD' ? '#111' : '#fff' }}>{label}</span>
              </div>

              {/* Stint info */}
              <div style={{ minWidth: 130 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Stint {s.index} · Laps {s.lapStart}–{s.lapEnd}
                </div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{s.lapCount} laps · {s.compound}</div>
              </div>

              {/* Degradation bar + value */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: degradColor, borderRadius: 2, transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: '0.62rem', color: degradColor, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {dms == null
                    ? 'insufficient data'
                    : dms > 0
                      ? `+${dms}ms/lap`
                      : `${dms}ms/lap (improving)`}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
