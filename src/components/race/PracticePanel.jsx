import Panel from '../ui/Panel'
import { SESSION_LABELS } from '../../utils/sessionConfig'

const FP_LABEL    = { fp1: 'Practice 1', fp2: 'Practice 2', fp3: 'Practice 3' }
const FP_DURATION = 60 * 60 * 1000 // 60 min in ms

function getSessionStatus(dateStr, timeStr) {
  if (!dateStr) return 'unknown'
  const start = new Date(`${dateStr}T${(timeStr || '00:00:00').replace(/Z$/i, '')}Z`)
  const end   = new Date(start.getTime() + FP_DURATION)
  const now   = new Date()
  if (now < start) return 'upcoming'
  if (now <= end)  return 'live'
  return 'completed'
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 68, flexShrink: 0, paddingTop: 2 }}>
        {label}
      </span>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>
        {value}
      </span>
    </div>
  )
}

export default function PracticePanel({ sessionKey, scheduleEntry, season, onGoTelemetry }) {
  const label       = FP_LABEL[sessionKey] || sessionKey.toUpperCase()
  const isModernEra = parseInt(season) >= 2023

  if (!scheduleEntry) {
    return (
      <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        Schedule information not available for this session.
      </div>
    )
  }

  const { date, time } = scheduleEntry
  const startDt = new Date(`${date}T${(time || '00:00:00').replace(/Z$/i, '')}Z`)
  const status  = getSessionStatus(date, time)

  const STATUS_CFG = {
    upcoming:  { label: 'Upcoming',  bg: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: 'rgba(255,255,255,0.1)', dot: false },
    live:      { label: 'LIVE',      bg: 'rgba(225,6,0,0.12)',     color: '#e10600',               border: 'rgba(225,6,0,0.35)',   dot: true  },
    completed: { label: 'Completed', bg: 'rgba(34,197,94,0.1)',    color: '#22c55e',               border: 'rgba(34,197,94,0.25)', dot: false },
    unknown:   { label: '—',         bg: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',      border: 'rgba(255,255,255,0.1)', dot: false },
  }
  const sc = STATUS_CFG[status]

  const localTime = time
    ? startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' local'
    : null
  const utcTime = time
    ? startDt.toISOString().slice(11, 16) + ' UTC'
    : null

  return (
    <div style={{ padding: '1.5rem 1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

      {/* Left: session metadata */}
      <div style={{ flex: '0 0 260px' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
          {label}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <InfoRow label="Date" value={
            startDt.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
          } />
          {localTime && (
            <InfoRow label="Time" value={`${localTime} · ${utcTime}`} />
          )}
          <InfoRow label="Duration" value="60 minutes" />
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 68, flexShrink: 0 }}>Status</span>
            <span style={{
              fontSize: '0.72rem', fontWeight: 700,
              padding: '2px 9px', borderRadius: 4,
              background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            }}>
              {sc.dot && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e10600', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
              )}
              {sc.label}
            </span>
          </div>
        </div>
      </div>

      {/* Right: telemetry info box */}
      <div style={{
        flex: 1, minWidth: 260,
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10, padding: '1.25rem',
      }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
          Telemetry Data
        </div>
        {isModernEra ? (
          status === 'upcoming' ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                Data coming soon
              </strong>
              <span style={{ color: 'var(--text-muted)' }}>
                Lap times and session telemetry will be available here once this practice session has taken place.
              </span>
            </p>
          ) : (
            <>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 1rem' }}>
                {season} race telemetry is available in the Performance Hub — lap times, pit stops and tire strategy for the full race weekend.
              </p>
              <button
                onClick={onGoTelemetry}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0.45rem 1rem', borderRadius: 6, cursor: 'pointer',
                  background: 'rgba(168,85,247,0.12)', color: '#a855f7',
                  border: '1px solid rgba(168,85,247,0.3)',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em',
                  textTransform: 'uppercase', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.22)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.12)' }}
              >
                View in Performance Hub
              </button>
            </>
          )
        ) : (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
              Telemetry not available for this era
            </strong>
            <span style={{ color: 'var(--text-muted)' }}>
              Practice session data prior to 2023 is not stored in this platform. Race results and qualifying are available from 1950.
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
