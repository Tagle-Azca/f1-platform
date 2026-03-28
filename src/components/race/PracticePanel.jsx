import { useState, useEffect } from 'react'
import { racesApi } from '../../services/api'

const FP_LABEL    = { fp1: 'Practice 1', fp2: 'Practice 2', fp3: 'Practice 3' }
const FP_DURATION = 60 * 60 * 1000

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

const P_COLORS = ['#f5c518', '#c0c0c0', '#cd7f32']

function SessionClassification({ snapshot }) {
  const top = snapshot.classification.slice(0, 10)
  if (!top.length) return null

  return (
    <div style={{
      flex: 1, minWidth: 260,
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.6rem 0.9rem',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
          Final Classification
        </span>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>
          {new Date(snapshot.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Rows */}
      {top.map((d, i) => {
        const isP1    = i === 0
        const pColor  = P_COLORS[i] || 'rgba(255,255,255,0.35)'
        const gap     = isP1
          ? null
          : (d.statLabel && d.statLabel !== 'gap' ? d.statLabel : d.stat)

        return (
          <div key={d.driverNum || i} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.32rem 0.9rem',
            borderBottom: i < top.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
          }}>
            {/* P */}
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.82rem',
              fontWeight: 800, color: pColor, width: 20, textAlign: 'center', flexShrink: 0,
            }}>
              {d.position}
            </span>

            {/* Team bar */}
            <div style={{ width: 3, height: 20, borderRadius: 2, background: d.teamColor || '#444', flexShrink: 0 }} />

            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
                fontSize: '0.82rem', color: '#fff', letterSpacing: '0.03em',
              }}>
                {d.acronym}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)', marginLeft: '0.4rem' }}>
                {d.teamName}
              </span>
            </div>

            {/* Gap */}
            {gap && (
              <span style={{
                fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)',
                fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                fontFamily: "'Barlow Condensed', sans-serif",
              }}>
                {gap}
              </span>
            )}

            {/* Best lap */}
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.78rem',
              fontWeight: 700, color: isP1 ? '#a855f7' : 'rgba(255,255,255,0.7)',
              fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: 64, textAlign: 'right',
            }}>
              {d.bestLap || '—'}
            </span>
          </div>
        )
      })}

      {/* Footer */}
      {snapshot.classification.length > 10 && (
        <div style={{
          padding: '0.3rem 0.9rem',
          fontSize: '0.58rem', color: 'rgba(255,255,255,0.18)',
          background: 'rgba(0,0,0,0.2)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          + {snapshot.classification.length - 10} more drivers
        </div>
      )}
    </div>
  )
}

export default function PracticePanel({ sessionKey, scheduleEntry, season, round, onGoTelemetry }) {
  const label       = FP_LABEL[sessionKey] || sessionKey.toUpperCase()
  const isModernEra = parseInt(season) >= 2023

  const [snapshot,        setSnapshot]        = useState(null)
  const [snapshotLoading, setSnapshotLoading] = useState(false)

  const status = getSessionStatus(scheduleEntry?.date, scheduleEntry?.time)

  useEffect(() => {
    if (status !== 'completed' || !isModernEra || !round) return
    setSnapshotLoading(true)
    racesApi.getSessionSnapshot(season, round, sessionKey)
      .then(s => setSnapshot(s || null))
      .catch(() => {})
      .finally(() => setSnapshotLoading(false))
  }, [season, round, sessionKey, status, isModernEra])

  if (!scheduleEntry) {
    return (
      <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        Schedule information not available for this session.
      </div>
    )
  }

  const { date, time } = scheduleEntry
  const startDt = new Date(`${date}T${(time || '00:00:00').replace(/Z$/i, '')}Z`)

  const STATUS_CFG = {
    upcoming:  { label: 'Upcoming',  bg: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: 'rgba(255,255,255,0.1)', dot: false },
    live:      { label: 'LIVE',      bg: 'rgba(225,6,0,0.12)',     color: '#e10600',               border: 'rgba(225,6,0,0.35)',   dot: true  },
    completed: { label: 'Completed', bg: 'rgba(34,197,94,0.1)',    color: '#22c55e',               border: 'rgba(34,197,94,0.25)', dot: false },
    unknown:   { label: '—',         bg: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',      border: 'rgba(255,255,255,0.1)', dot: false },
  }
  const sc = STATUS_CFG[status]

  const localTime = time ? startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' local' : null
  const utcTime   = time ? startDt.toISOString().slice(11, 16) + ' UTC' : null

  return (
    <div style={{ padding: '1.5rem 1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

      {/* Left: session metadata */}
      <div style={{ flex: '0 0 230px' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
          {label}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <InfoRow label="Date" value={
            startDt.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
          } />
          {localTime && <InfoRow label="Time" value={`${localTime} · ${utcTime}`} />}
          <InfoRow label="Duration" value="60 minutes" />
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 68, flexShrink: 0 }}>Status</span>
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px', borderRadius: 4,
              background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            }}>
              {sc.dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e10600', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />}
              {sc.label}
            </span>
          </div>
        </div>

        {/* Telemetry link — only when no snapshot to show */}
        {isModernEra && status !== 'upcoming' && !snapshot && !snapshotLoading && (
          <button
            onClick={onGoTelemetry}
            style={{
              marginTop: '1.2rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.4rem 0.9rem', borderRadius: 6, cursor: 'pointer',
              background: 'rgba(168,85,247,0.12)', color: '#a855f7',
              border: '1px solid rgba(168,85,247,0.3)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
            }}
          >
            Performance Hub →
          </button>
        )}
      </div>

      {/* Right: classification or info box */}
      {snapshotLoading ? (
        <div style={{ flex: 1, minWidth: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', padding: '2rem' }}>
          Loading classification…
        </div>
      ) : snapshot ? (
        <SessionClassification snapshot={snapshot} />
      ) : (
        <div style={{
          flex: 1, minWidth: 260,
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '1.25rem',
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
            {status === 'upcoming' ? 'Data Coming Soon' : 'Telemetry Data'}
          </div>
          {!isModernEra ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>Telemetry not available for this era</strong>
              <span style={{ color: 'var(--text-muted)' }}>Practice session data prior to 2023 is not stored in this platform.</span>
            </p>
          ) : status === 'upcoming' ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              <span style={{ color: 'var(--text-muted)' }}>Lap times and session data will appear here once the session has taken place.</span>
            </p>
          ) : (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              <span style={{ color: 'var(--text-muted)' }}>Classification not yet available for this session. Check Performance Hub for lap telemetry.</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
