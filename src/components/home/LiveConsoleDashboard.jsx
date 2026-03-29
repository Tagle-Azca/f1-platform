import { useState } from 'react'
import CircuitRadarCanvas from './CircuitRadarCanvas'
import LiveTelemetryStrip from './LiveTelemetryStrip'

// ── Shared helpers from LiveTimingBanner ──────────────────────────────────

const COMPOUND_STYLE = {
  SOFT:         { bg: '#ef4444', color: '#fff' },
  MEDIUM:       { bg: '#eab308', color: '#000' },
  HARD:         { bg: '#e5e7eb', color: '#000' },
  INTERMEDIATE: { bg: '#22c55e', color: '#fff' },
  WET:          { bg: '#3b82f6', color: '#fff' },
}

const SECTOR_COLOR = { purple: '#a855f7', green: '#22c55e' }

function Compound({ c }) {
  if (!c || c === 'UNKNOWN') return <span style={{ width: 20 }} />
  const s = COMPOUND_STYLE[c] || { bg: 'rgba(255,255,255,0.15)', color: '#fff' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 15, height: 15, borderRadius: '50%',
      background: s.bg, color: s.color,
      fontSize: '0.5rem', fontWeight: 900, flexShrink: 0,
    }}>
      {c[0]}
    </span>
  )
}

function Sector({ s }) {
  if (!s) return <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.62rem', fontVariantNumeric: 'tabular-nums' }}>—</span>
  const color = SECTOR_COLOR[s.color] || 'rgba(255,255,255,0.45)'
  const val   = typeof s.time === 'number' ? s.time.toFixed(3) : s.time
  return (
    <span style={{ color, fontSize: '0.62rem', fontWeight: s.color ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>
      {val}
    </span>
  )
}

function Gear({ g }) {
  if (g == null) return <span />
  const label = g === 0 ? 'N' : String(g)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 15, height: 15, borderRadius: 3,
      background: 'rgba(255,255,255,0.07)',
      fontSize: '0.5rem', fontWeight: 800,
      color: g === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.65)',
    }}>
      {label}
    </span>
  )
}

function TBBar({ value, color }) {
  return (
    <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ width: `${value ?? 0}%`, height: '100%', background: color, transition: 'width 0.3s ease' }} />
    </div>
  )
}

// ── Column definitions ─────────────────────────────────────────────────────
// P | bar | cmp | driver | best | laps | S1 | S2 | S3 | gap | gear | T/B
const COLS = '26px 3px 18px 1fr 72px 26px 48px 48px 48px 52px 18px 52px'

function ColLbl({ children, style }) {
  return (
    <span style={{
      fontSize: '0.52rem', color: 'rgba(255,255,255,0.22)',
      fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      ...style,
    }}>
      {children}
    </span>
  )
}

// ── Global header ─────────────────────────────────────────────────────────

function LiveHeader({ tower }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.55rem',
      padding: '0.5rem 0.9rem',
      background: 'rgba(225,6,0,0.04)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Single global pulsing dot */}
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: '#e10600', flexShrink: 0,
        boxShadow: '0 0 6px #e10600',
        animation: 'pulse-dot 2s ease-in-out infinite',
      }} />
      <span style={{
        fontFamily: "'Barlow Condensed'", fontSize: '0.65rem',
        fontWeight: 700, letterSpacing: '0.14em', color: '#e10600',
        textTransform: 'uppercase',
      }}>
        Session Live
      </span>
      <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
      <span style={{
        fontFamily: "'Barlow Condensed'", fontSize: '0.65rem',
        fontWeight: 700, letterSpacing: '0.1em',
        color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase',
      }}>
        {tower.sessionName}
      </span>
      <span style={{
        fontFamily: "'Barlow Condensed'", fontSize: '0.88rem',
        fontWeight: 700, color: '#fff',
      }}>
        {tower.raceName}
      </span>
    </div>
  )
}

// ── Driver row ────────────────────────────────────────────────────────────

function DriverRow({ driver: d, isEven, isSelected, isMobile, onClick }) {
  const isLeader = d.position === 1
  const color    = d.teamColor || '#444'

  if (isMobile) {
    // Mobile: simplified 4-column row
    return (
      <div
        onClick={onClick}
        style={{
          display: 'grid',
          gridTemplateColumns: '22px 3px 1fr 76px',
          gap: '0 0.4rem', alignItems: 'center',
          padding: '0.32rem 0.75rem',
          cursor: 'pointer',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: isSelected
            ? `${color}18`
            : isEven ? 'transparent' : 'rgba(255,255,255,0.012)',
          borderLeft: `2px solid ${isSelected ? color : 'transparent'}`,
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        <span style={{ fontFamily: "'Barlow Condensed'", fontSize: '0.78rem', fontWeight: 700, color: isLeader ? '#f5c518' : 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
          {d.position}
        </span>
        <div style={{ width: 3, height: 20, borderRadius: 2, background: color }} />
        <div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>{d.acronym}</div>
          <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.teamName}</div>
        </div>
        <span style={{ fontFamily: "'Barlow Condensed'", fontSize: '0.82rem', fontWeight: 700, color: isLeader ? '#a855f7' : '#fff', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
          {d.bestLapStr || '—'}
        </span>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid', gridTemplateColumns: COLS,
        gap: '0 0.4rem', alignItems: 'center',
        padding: '0.26rem 0.9rem',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: isSelected
          ? `${color}18`
          : isEven ? 'transparent' : 'rgba(255,255,255,0.012)',
        borderLeft: `2px solid ${isSelected ? color : 'transparent'}`,
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {/* P */}
      <span style={{ fontFamily: "'Barlow Condensed'", fontSize: '0.72rem', fontWeight: 700, color: isLeader ? '#f5c518' : 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
        {d.position}
      </span>
      {/* Team bar */}
      <div style={{ width: 3, height: 20, borderRadius: 2, background: color }} />
      {/* Compound */}
      <div style={{ display: 'flex', justifyContent: 'center' }}><Compound c={d.compound} /></div>
      {/* Driver */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: '0.8rem', fontWeight: 800, color: '#fff', letterSpacing: '0.03em' }}>{d.acronym}</div>
        <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.teamName}</div>
      </div>
      {/* Best lap */}
      <span style={{ fontFamily: "'Barlow Condensed'", fontSize: '0.76rem', fontWeight: 700, color: isLeader ? '#a855f7' : '#fff', fontVariantNumeric: 'tabular-nums' }}>
        {d.bestLapStr || '—'}
      </span>
      {/* Laps */}
      <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
        {d.laps ?? '—'}
      </span>
      {/* S1 S2 S3 */}
      <Sector s={d.s1} />
      <Sector s={d.s2} />
      <Sector s={d.s3} />
      {/* Gap */}
      <span style={{
        fontSize: '0.66rem', fontVariantNumeric: 'tabular-nums',
        color: (d.gapStr === 'LEADER' || d.gapStr === 'fastest') ? '#f5c518' : 'rgba(255,255,255,0.4)',
        fontWeight: (d.gapStr === 'LEADER' || d.gapStr === 'fastest') ? 700 : 400,
      }}>
        {d.gapStr}
      </span>
      {/* Gear */}
      <div style={{ display: 'flex', justifyContent: 'center' }}><Gear g={d.gear} /></div>
      {/* T/B */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TBBar value={d.throttle} color='#22c55e' />
        <TBBar value={d.brake}    color='#ef4444' />
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────

export default function LiveConsoleDashboard({ tower, isMobile }) {
  const [selectedNum, setSelectedNum] = useState(null)
  const toggle = (num) => setSelectedNum(prev => prev === num ? null : num)

  const selectedDriver = selectedNum
    ? tower.drivers.find(d => d.driverNum === selectedNum)
    : null

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: isMobile ? 'auto' : 520,
      background: '#000',
      border: '1px solid rgba(225,6,0,0.2)',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: '1rem',
    }}>

      {/* ── Left: Timing Table ───────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <LiveHeader tower={tower} />

        {/* Column headers */}
        {!isMobile && (
          <div style={{
            display: 'grid', gridTemplateColumns: COLS,
            gap: '0 0.4rem', alignItems: 'center',
            padding: '0.28rem 0.9rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.015)',
          }}>
            <ColLbl style={{ textAlign: 'center' }}>P</ColLbl>
            <span /><span />
            <ColLbl>Driver</ColLbl>
            <ColLbl>Best</ColLbl>
            <ColLbl style={{ textAlign: 'right' }}>L</ColLbl>
            <ColLbl>S1</ColLbl>
            <ColLbl>S2</ColLbl>
            <ColLbl>S3</ColLbl>
            <ColLbl>Gap</ColLbl>
            <ColLbl style={{ textAlign: 'center' }}>G</ColLbl>
            <ColLbl>T/B</ColLbl>
          </div>
        )}

        {/* Rows */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: isMobile ? 320 : undefined }}>
          {tower.drivers.map((d, i) => (
            <DriverRow
              key={d.driverNum}
              driver={d}
              isEven={i % 2 === 0}
              isSelected={d.driverNum === selectedNum}
              isMobile={isMobile}
              onClick={() => toggle(d.driverNum)}
            />
          ))}
        </div>

        {/* Legend */}
        {!isMobile && (
          <div style={{
            display: 'flex', gap: '1rem', padding: '0.35rem 0.9rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.3)',
          }}>
            {[['#a855f7', 'Session best'], ['#22c55e', 'Personal best']].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: color }} />
                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)' }}>{label}</span>
              </div>
            ))}
            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.12)', marginLeft: 'auto' }}>
              Click row to highlight on radar
            </span>
          </div>
        )}
      </div>

      {/* ── Right: Circuit Radar ─────────────────────────── */}
      <div style={{
        width:       isMobile ? '100%' : 280,
        height:      isMobile ? 200    : undefined,
        flexShrink:  0,
        borderLeft:  isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)',
        borderTop:   isMobile ? '1px solid rgba(255,255,255,0.05)' : 'none',
        display:     'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '6px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          fontSize: '0.52rem', fontWeight: 700,
          letterSpacing: '1.2px', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.2)',
        }}>
          Track Radar
        </div>
        <div style={{ flex: 1 }}>
          <CircuitRadarCanvas
            drivers={tower.drivers}
            selectedDriverNum={selectedNum}
          />
        </div>
        {selectedNum && (
          <LiveTelemetryStrip
            driverNum={selectedNum}
            teamColor={selectedDriver?.teamColor || null}
          />
        )}
      </div>
    </div>
  )
}
