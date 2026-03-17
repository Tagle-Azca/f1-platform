import { useNavigate } from 'react-router-dom'
import Panel from '../ui/Panel'
import ResultRow from '../ui/ResultRow'
import { PODIUM_COLORS, ctorColor } from '../../utils/teamColors'

const SC_CONFIG = {
  SafetyCar: { label: 'SAFETY CAR',        color: '#f5c518', bg: 'rgba(245,197,24,0.12)', border: 'rgba(245,197,24,0.4)' },
  VSC:       { label: 'VIRTUAL SAFETY CAR',color: '#f5c518', bg: 'rgba(245,197,24,0.12)', border: 'rgba(245,197,24,0.4)' },
  SCEnding:  { label: 'SC ENDING',         color: '#f5c518', bg: 'rgba(245,197,24,0.08)', border: 'rgba(245,197,24,0.3)' },
  Yellow:    { label: 'YELLOW FLAG',       color: '#f5c518', bg: 'rgba(245,197,24,0.08)', border: 'rgba(245,197,24,0.25)' },
  Red:       { label: 'RED FLAG',          color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)'  },
}

export default function LiveRacePanel({ live }) {
  const navigate = useNavigate()
  const scCfg = SC_CONFIG[live.trackStatus] || null

  return (
    <Panel accent="red" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {live.finished ? (
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', color: '#f5c518', textTransform: 'uppercase' }}>
              Race Finished · {live.sessionName}
            </span>
          ) : (
            <>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', color: '#ef4444', textTransform: 'uppercase' }}>
                Live · {live.sessionName}
              </span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
            {live.raceName}
          </span>
          {live.currentLap && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Lap {live.currentLap}{live.totalLaps ? `/${live.totalLaps}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* SC / VSC banner */}
      {scCfg && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          padding: '0.35rem 0.75rem', borderRadius: 6,
          background: scCfg.bg, border: `1px solid ${scCfg.border}`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: scCfg.color, display: 'inline-block', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.14em',
            color: scCfg.color, textTransform: 'uppercase',
          }}>
            {scCfg.label}
          </span>
        </div>
      )}

      {/* Top 5 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {live.top3.map((driver, idx) => {
          const isLeader  = driver.stat === 'LEADER' || driver.statLabel === 'fastest'
          const barColor  = driver.teamColor || '#888'
          const isTop3    = driver.position <= 3
          return (
            <div
              key={driver.driverNum}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.55rem',
                padding: isTop3 ? '0.5rem 0.75rem' : '0.35rem 0.75rem',
                background: isTop3 ? 'var(--surface-2)' : 'rgba(255,255,255,0.02)',
                borderRadius: 7,
                borderLeft: `3px solid ${isTop3 ? barColor : 'rgba(255,255,255,0.08)'}`,
                opacity: isTop3 ? 1 : 0.75,
              }}
            >
              {/* Position */}
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: isTop3 ? '1.1rem' : '0.9rem', fontWeight: 900,
                color: PODIUM_COLORS[driver.position - 1] ?? 'var(--text-muted)',
                width: 20, flexShrink: 0, textAlign: 'center',
              }}>
                {driver.position}
              </span>

              {/* Color bar */}
              {!isTop3 && (
                <div style={{ width: 3, height: 14, borderRadius: 2, background: barColor, flexShrink: 0 }} />
              )}

              {/* Driver name + team */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: isTop3 ? '0.95rem' : '0.82rem',
                  fontWeight: 800, color: '#fff',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {driver.fullName || driver.acronym}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {driver.teamName}
                </div>
              </div>

              {/* Stat */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {isLeader ? (
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#f5c518', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    {live.isRaceType ? 'Leader' : 'Fastest'}
                  </span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
                    {driver.stat && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>
                        {driver.stat}
                      </span>
                    )}
                    {driver.statLabel && driver.statLabel !== 'gap' && driver.statLabel !== 'fastest' && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {driver.statLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          {live.finished ? `${live.totalLaps} laps · Final` : `Live · F1 SignalR · ${new Date(live.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
        </span>
        {!live.finished && (
          <button
            onClick={() => navigate('/live')}
            style={{
              background: 'none', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
              padding: '2px 10px', borderRadius: 5,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.7rem', fontWeight: 700, color: '#ef4444',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
          >
            Full classification →
          </button>
        )}
      </div>
    </Panel>
  )
}
