import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import { dashboardApi } from '../services/api'

const SECTOR_COLORS = {
  purple: { fg: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.35)' },
  green:  { fg: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)'    },
  yellow: { fg: '#f5c518', bg: 'rgba(245,197,24,0.08)',  border: 'rgba(245,197,24,0.25)'  },
}

const TRACK_STATUS_CONFIG = {
  SafetyCar:  { label: 'SAFETY CAR',          color: '#f5c518', bg: 'rgba(245,197,24,0.12)', border: 'rgba(245,197,24,0.4)' },
  VSC:        { label: 'VIRTUAL SAFETY CAR',   color: '#f5c518', bg: 'rgba(245,197,24,0.12)', border: 'rgba(245,197,24,0.4)' },
  SCEnding:   { label: 'SC ENDING',            color: '#f5c518', bg: 'rgba(245,197,24,0.08)', border: 'rgba(245,197,24,0.3)' },
  Yellow:     { label: 'YELLOW FLAG',          color: '#f5c518', bg: 'rgba(245,197,24,0.08)', border: 'rgba(245,197,24,0.25)' },
  Red:        { label: 'RED FLAG',             color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)'  },
  Chequered:  { label: 'CHEQUERED FLAG',       color: '#fff',    bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.2)' },
}

function TrackStatusBanner({ status }) {
  const cfg = TRACK_STATUS_CONFIG[status]
  if (!cfg) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
      padding: '0.5rem 1rem', borderRadius: 8, marginBottom: '0.75rem',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, display: 'inline-block', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: '0.82rem', fontWeight: 900, letterSpacing: '0.14em',
        color: cfg.color, textTransform: 'uppercase',
      }}>
        {cfg.label}
      </span>
    </div>
  )
}

function DriverRow({ driver, isRaceType, idx }) {
  const isLeader  = driver.stat === 'LEADER' || driver.statLabel === 'fastest'
  const barColor  = driver.teamColor || '#555'
  const isTop3    = driver.position <= 3
  const posColor  = driver.position === 1 ? '#f5c518' : driver.position === 2 ? '#c0c0c0' : driver.position === 3 ? '#cd7f32' : 'var(--text-muted)'

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '32px 4px 1fr auto auto',
      alignItems: 'start',
      gap: '0.6rem',
      padding: isTop3 ? '0.55rem 0.75rem' : '0.38rem 0.75rem',
      borderRadius: 7,
      background: isTop3 ? 'var(--surface-2)' : idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
      opacity: driver.retired ? 0.4 : 1,
      transition: 'background 0.15s',
    }}>
      {/* Position */}
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: isTop3 ? '1.2rem' : '0.95rem',
        fontWeight: 900, color: posColor,
        textAlign: 'center', lineHeight: 1,
      }}>
        {driver.retired ? 'OUT' : driver.position}
      </span>

      {/* Team color bar */}
      <div style={{ width: 3, height: isTop3 ? 38 : 30, borderRadius: 2, background: barColor, flexShrink: 0, alignSelf: 'center' }} />

      {/* Driver info + sectors */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: isTop3 ? '1rem' : '0.88rem',
          fontWeight: 800, color: '#fff',
          letterSpacing: '0.03em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {driver.fullName || driver.acronym}
        </div>
        {/* Sector times row */}
        {driver.sectors?.some(s => s.value) ? (
          <div style={{ display: 'flex', gap: '0.2rem', marginTop: '0.18rem', flexWrap: 'nowrap' }}>
            {driver.sectors.map((s, i) => {
              const cfg = s.status ? SECTOR_COLORS[s.status] : null
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.15rem',
                  padding: '1px 5px', borderRadius: 3,
                  background: cfg ? cfg.bg : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${cfg ? cfg.border : 'rgba(255,255,255,0.06)'}`,
                }}>
                  <span style={{ fontSize: '0.52rem', color: cfg ? cfg.fg : 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>
                    S{i + 1}
                  </span>
                  <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: cfg ? cfg.fg : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {s.value}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {driver.teamName}
          </div>
        )}
      </div>

      {/* Last lap */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 72 }}>
        {driver.lastLap && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
            {driver.lastLap}
          </div>
        )}
        {isRaceType && driver.inPit && (
          <div style={{ fontSize: '0.58rem', color: '#f97316', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            IN PIT
          </div>
        )}
      </div>

      {/* Gap / time */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
        {isLeader ? (
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, color: '#f5c518',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: "'Barlow Condensed', sans-serif",
          }}>
            {isRaceType ? 'LEADER' : 'FASTEST'}
          </span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            {driver.stat && (
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
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
}

export default function LivePage() {
  const navigate  = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const poll = () => {
      dashboardApi.getLive()
        .then(d => { if (!cancelled) setData(d?.isLive ? d : null) })
        .catch(() => { if (!cancelled) setError(true) })
    }
    poll()
    const id = setInterval(poll, 2000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  if (data === null && !error) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.2 }}>📡</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No session currently live</p>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '1.5rem', padding: '0.5rem 1.25rem', borderRadius: 7,
              background: 'var(--surface-2)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem',
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </PageWrapper>
    )
  }

  if (!data) return null

  const sc = data.trackStatus
  const isSCActive = sc === 'SafetyCar' || sc === 'VSC' || sc === 'SCEnding' || sc === 'Yellow' || sc === 'Red'

  return (
    <PageWrapper>
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
            display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em',
            color: '#ef4444', textTransform: 'uppercase',
          }}>
            LIVE · {data.sessionName}
          </span>
          {data.currentLap && (
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.8rem', fontWeight: 700,
              color: 'var(--text-secondary)', letterSpacing: '0.06em',
            }}>
              Lap {data.currentLap}{data.totalLaps ? `/${data.totalLaps}` : ''}
            </span>
          )}
        </div>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
          fontWeight: 900, letterSpacing: '0.04em',
          textTransform: 'uppercase', lineHeight: 1, color: '#fff',
          margin: 0,
        }}>
          {data.raceName}
        </h1>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Updated {new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Track status banner */}
      {isSCActive && <TrackStatusBanner status={sc} />}

      {/* Classification table */}
      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-color)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 4px 1fr auto auto',
          gap: '0.6rem',
          padding: '0.4rem 0.75rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--surface-2)',
        }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>POS</span>
          <span />
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>DRIVER</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>LAST LAP</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>
            {data.isRaceType ? 'GAP' : 'BEST LAP'}
          </span>
        </div>

        {/* Rows */}
        <div style={{ padding: '0.35rem' }}>
          {(data.classification || []).map((driver, idx) => (
            <DriverRow key={driver.driverNum} driver={driver} isRaceType={data.isRaceType} idx={idx} />
          ))}
          {(!data.classification || data.classification.length === 0) && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Waiting for data...
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          Live · F1 SignalR · Auto-refresh 2s
        </span>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.06em',
          }}
        >
          ← Dashboard
        </button>
      </div>
    </PageWrapper>
  )
}
