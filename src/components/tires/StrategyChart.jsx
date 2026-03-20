import Panel from '../ui/Panel'
import EmptyState from '../ui/EmptyState'

const COMPOUND_COLOR = {
  SOFT:         { bg: '#e8002d', label: '#fff' },
  MEDIUM:       { bg: '#ffd600', label: '#111' },
  HARD:         { bg: '#e0e0e0', label: '#111' },
  INTERMEDIATE: { bg: '#39b54a', label: '#fff' },
  WET:          { bg: '#0067ff', label: '#fff' },
  UNKNOWN:      { bg: 'repeating-linear-gradient(45deg,#444 0px,#444 4px,#2a2a2a 4px,#2a2a2a 8px)', label: 'rgba(255,255,255,0.55)' },
}

const COMPOUND_ABBR = {
  SOFT: 'S', MEDIUM: 'M', HARD: 'H', INTERMEDIATE: 'I', WET: 'W', UNKNOWN: '?',
}

function compound(raw = '') {
  const key = raw.toUpperCase()
  return COMPOUND_COLOR[key] ? key : 'UNKNOWN'
}

export default function StrategyChart({ strategy, totalLaps, loading, dbOffline }) {
  return (
    <Panel padding="none" className="card" style={{ padding: '1rem 1.25rem', overflowX: 'auto' }}>
      {loading && <EmptyState type="loading" message="Loading strategy..." height={200} />}
      {!loading && !strategy.length && !dbOffline && <EmptyState type="empty" message="Select a race to view tire strategy" height={200} />}

      {!loading && strategy.length > 0 && (
        <div style={{ minWidth: 600 }}>
          {/* Lap axis header */}
          <div style={{ display: 'flex', marginBottom: '0.5rem', paddingLeft: 72 }}>
            <div style={{ flex: 1, position: 'relative', height: 16 }}>
              {Array.from({ length: Math.ceil(totalLaps / 10) }, (_, i) => {
                const lap = (i + 1) * 10
                if (lap > totalLaps) return null
                return (
                  <span key={lap} style={{ position: 'absolute', left: `${(lap / totalLaps) * 100}%`, transform: 'translateX(-50%)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums' }}>
                    {lap}
                  </span>
                )
              })}
              <span style={{ position: 'absolute', right: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)' }}>
                L{totalLaps}
              </span>
            </div>
          </div>

          {/* Driver rows */}
          {strategy.map(driver => {
            const lastLap = Math.max(...driver.stints.map(s => s.lapEnd))
            const dnf     = lastLap < totalLaps - 1
            return (
              <div key={driver.driverId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div style={{ width: 64, flexShrink: 0, textAlign: 'right', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                  {driver.acronym}
                </div>
                <div style={{ flex: 1, height: 28, position: 'relative', background: 'rgba(22,22,22,0.9)', borderRadius: 5, overflow: 'hidden', opacity: dnf ? 0.75 : 1 }}>
                  {dnf && (
                    <div style={{ position: 'absolute', left: `${(lastLap / totalLaps) * 100}%`, top: 0, bottom: 0, width: 2, background: 'rgba(239,68,68,0.7)', zIndex: 2 }} />
                  )}
                  {driver.stints.map(stint => {
                    const cKey  = compound(stint.compound)
                    const color = COMPOUND_COLOR[cKey]
                    const left  = ((stint.lapStart - 1) / totalLaps) * 100
                    const width = ((stint.lapEnd - stint.lapStart + 1) / totalLaps) * 100
                    const laps  = stint.lapEnd - stint.lapStart + 1
                    return (
                      <div
                        key={stint.stintNumber}
                        title={`${cKey} · Laps ${stint.lapStart}–${stint.lapEnd} (${laps} laps)${stint.tyreAge > 0 ? ` · Tyre age: ${stint.tyreAge} laps` : ''}`}
                        style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, top: 0, bottom: 0, background: color.bg, borderRight: '2px solid rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', transition: 'filter 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                        onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                      >
                        {width > 5 && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: color.label, letterSpacing: '0.04em', pointerEvents: 'none', userSelect: 'none' }}>
                            {COMPOUND_ABBR[cKey]}{laps > 4 ? ` ${laps}` : ''}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div style={{ width: 36, flexShrink: 0, textAlign: 'left' }}>
                  {dnf ? (
                    <span title={`Retired on lap ${lastLap}`} style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em', color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 3, padding: '1px 4px' }}>DNF</span>
                  ) : (
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums' }}>{driver.stints.length}</span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Bottom label */}
          <div style={{ paddingLeft: 72, paddingTop: '0.5rem', fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }}>
            Lap · {strategy.length} drivers · {totalLaps} total laps
          </div>
        </div>
      )}
    </Panel>
  )
}
