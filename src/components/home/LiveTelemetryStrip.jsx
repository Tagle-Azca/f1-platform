import { useEffect, useRef, useState } from 'react'
import { telemetryApi } from '../../services/api'

const MAX_RPM = 15000
const POLL_MS = 1000

// RPM colour zones (2026-style)
// Green: 0–9000 | Red: 9000–11000 | Blue blink: >11000
function rpmColor(rpm, blink) {
  if (rpm > 11000) return blink ? '#60a5fa' : 'rgba(96,165,250,0.3)'   // blue pulsing
  if (rpm > 9000)  return '#ef4444'  // red
  return '#22c55e'                   // green
}

export default function LiveTelemetryStrip({ driverNum, teamColor }) {
  const [data,  setData]  = useState(null)
  const [blink, setBlink] = useState(false)

  // Blue-blink timer when RPM > 11k
  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 180)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!driverNum) { setData(null); return }
    let cancelled = false

    const poll = async () => {
      try {
        const resp = await telemetryApi.getCarData()
        if (cancelled) return
        const t = resp?.telemetry?.[driverNum]
        if (t) setData(t)
      } catch { /* keep last known */ }
    }

    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [driverNum])

  if (!driverNum) return null

  const gear     = data?.gear     ?? null
  const rpm      = data?.rpm      ?? 0
  const throttle = data?.throttle ?? 0
  const brake    = data?.brake    ?? 0

  const rpmPct   = Math.min(100, (rpm / MAX_RPM) * 100)
  const barColor = rpmColor(rpm, blink)

  return (
    <div style={{
      padding: '0.55rem 0.9rem 0.6rem',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(0,0,0,0.45)',
    }}>

      {/* ── RPM bar (full width, top) ─────────────────────── */}
      <div style={{ marginBottom: '0.45rem' }}>
        <div style={{
          height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            width:       `${rpmPct}%`,
            height:      '100%',
            background:  barColor,
            borderRadius: 2,
            transition:  rpm > 11000 ? 'background 0.18s' : 'width 0.2s ease, background 0.4s ease',
            boxShadow:   rpm > 9000 ? `0 0 5px ${barColor}` : 'none',
          }} />
        </div>
        {/* Zone markers */}
        <div style={{ display: 'flex', marginTop: 2, position: 'relative' }}>
          <span style={{ ...ZONE_LABEL, color: '#22c55e' }}>0</span>
          <span style={{ ...ZONE_LABEL, position: 'absolute', left: `${(9000/MAX_RPM)*100}%`, color: '#ef4444' }}>9k</span>
          <span style={{ ...ZONE_LABEL, position: 'absolute', left: `${(11000/MAX_RPM)*100}%`, color: '#60a5fa' }}>11k</span>
          <span style={{ ...ZONE_LABEL, marginLeft: 'auto', color: 'rgba(255,255,255,0.2)' }}>
            {rpm ? `${rpm.toLocaleString()} RPM` : '—'}
          </span>
        </div>
      </div>

      {/* ── Main row: throttle | gear | brake ─────────────── */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.6rem', height: 54 }}>

        {/* Throttle — vertical bar, left */}
        <VerticalBar
          value={throttle}
          color='#22c55e'
          label='T'
        />

        {/* Gear — large number, center */}
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: "'Barlow Condensed'", fontSize: '2.4rem', fontWeight: 900,
            lineHeight: 1,
            color: gear == null
              ? 'rgba(255,255,255,0.1)'
              : gear === 0 ? 'rgba(255,255,255,0.25)' : (teamColor || '#a855f7'),
            textShadow: gear != null && gear > 0 ? `0 0 12px ${teamColor || '#a855f7'}55` : 'none',
          }}>
            {gear == null ? '—' : gear === 0 ? 'N' : gear}
          </span>
          <span style={{ fontSize: '0.44rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>GEAR</span>
        </div>

        {/* Brake — vertical bar, right */}
        <VerticalBar
          value={brake}
          color='#ef4444'
          label='B'
        />

      </div>

    </div>
  )
}

// ── Vertical bar ────────────────────────────────────────────────────────────

function VerticalBar({ value, color, label }) {
  const pct = Math.min(100, value ?? 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 16 }}>
      <span style={{ fontSize: '0.44rem', fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.25)' }}>
        {label}
      </span>
      {/* Track */}
      <div style={{
        flex: 1, width: 5, borderRadius: 3,
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        overflow: 'hidden',
      }}>
        {/* Fill grows from bottom */}
        <div style={{
          width: '100%',
          height: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: 'height 0.15s ease',
          boxShadow: pct > 60 ? `0 0 4px ${color}` : 'none',
        }} />
      </div>
      <span style={{ fontSize: '0.42rem', fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.25)' }}>
        {pct ? `${Math.round(pct)}` : '0'}
      </span>
    </div>
  )
}

const ZONE_LABEL = {
  fontSize: '0.42rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  lineHeight: 1,
}
