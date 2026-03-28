import { useState, useEffect, useRef } from 'react'
import { telemetryApi } from '../../services/api'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const POLL_MS = 3000

const COMPOUND_STYLE = {
  SOFT:         { bg: '#ef4444', color: '#fff' },
  MEDIUM:       { bg: '#eab308', color: '#000' },
  HARD:         { bg: '#e5e7eb', color: '#000' },
  INTERMEDIATE: { bg: '#22c55e', color: '#fff' },
  WET:          { bg: '#3b82f6', color: '#fff' },
}

const SECTOR_COLOR = {
  purple: '#a855f7',
  green:  '#22c55e',
}

// Desktop: P | bar | cmp | driver | best | laps | S1 | S2 | S3 | gap | gear | throttle/brake
const COLS_DESKTOP = '28px 3px 20px 1fr 76px 28px 52px 52px 52px 56px 20px 56px'
// Mobile: P | bar | driver | best lap
const COLS_MOBILE  = '24px 3px 1fr 80px'

function Compound({ c }) {
  if (!c || c === 'UNKNOWN') return <span style={{ width: 20 }} />
  const s = COMPOUND_STYLE[c] || { bg: 'rgba(255,255,255,0.15)', color: '#fff' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 16, height: 16, borderRadius: '50%',
      background: s.bg, color: s.color,
      fontSize: '0.55rem', fontWeight: 900, flexShrink: 0,
    }}>
      {c[0]}
    </span>
  )
}

function Sector({ s }) {
  if (!s) return <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.66rem', fontVariantNumeric: 'tabular-nums' }}>—</span>
  const color = SECTOR_COLOR[s.color] || 'rgba(255,255,255,0.5)'
  const val   = typeof s.time === 'number' ? s.time.toFixed(3) : s.time
  return (
    <span style={{ color, fontSize: '0.66rem', fontWeight: s.color ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>
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
      width: 16, height: 16, borderRadius: 3,
      background: 'rgba(255,255,255,0.08)',
      fontSize: '0.55rem', fontWeight: 800,
      color: g === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {label}
    </span>
  )
}

function ThrottleBrake({ throttle, brake }) {
  if (throttle == null && brake == null) return (
    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.6rem' }}>—</span>
  )
  const t = throttle ?? 0
  const b = brake    ?? 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      {/* Throttle — green */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <div style={{ width: 3, fontSize: '0.48rem', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>T</div>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ width: `${t}%`, height: '100%', background: '#22c55e', borderRadius: 2, transition: 'width 0.3s ease' }} />
        </div>
      </div>
      {/* Brake — red */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <div style={{ width: 3, fontSize: '0.48rem', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>B</div>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ width: `${b}%`, height: '100%', background: '#ef4444', borderRadius: 2, transition: 'width 0.3s ease' }} />
        </div>
      </div>
    </div>
  )
}

const P_COLORS = ['#f5c518', '#c0c0c0', '#cd7f32']  // gold, silver, bronze

function CompletedSummary({ tower, isMobile }) {
  const top = tower.drivers.slice(0, isMobile ? 5 : 8)
  const leader = top[0]

  return (
    <div>
      {/* Top drivers */}
      {top.map((d, i) => {
        const isP1    = i === 0
        const pColor  = P_COLORS[i] || 'rgba(255,255,255,0.35)'
        const gap     = isP1 ? null : d.gapStr

        return (
          <div key={d.driverNum} style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: isMobile ? '0.45rem 0.9rem' : '0.38rem 0.9rem',
            borderBottom: i < top.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
          }}>
            {/* Position */}
            <span style={{
              fontFamily: "'Barlow Condensed'", fontSize: isMobile ? '1rem' : '0.9rem',
              fontWeight: 800, color: pColor, width: 22, textAlign: 'center', flexShrink: 0,
            }}>
              {d.position}
            </span>

            {/* Team bar */}
            <div style={{ width: 3, height: 24, borderRadius: 2, background: d.teamColor || '#444', flexShrink: 0 }} />

            {/* Compound */}
            {!isMobile && <Compound c={d.compound} />}

            {/* Driver name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'Barlow Condensed'", fontWeight: 800,
                fontSize: isMobile ? '0.95rem' : '0.88rem', color: '#fff', letterSpacing: '0.03em',
              }}>
                {d.acronym}
              </div>
              <div style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {d.teamName}
              </div>
            </div>

            {/* Gap */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {isP1 ? (
                <span style={{ fontFamily: "'Barlow Condensed'", fontSize: '0.72rem', fontWeight: 700, color: '#a855f7' }}>
                  FASTEST
                </span>
              ) : (
                <span style={{ fontFamily: "'Barlow Condensed'", fontSize: '0.72rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>
                  +{gap?.replace(/^\+/, '') || '—'}
                </span>
              )}
            </div>

            {/* Best lap */}
            <div style={{
              fontFamily: "'Barlow Condensed'", fontSize: isMobile ? '0.9rem' : '0.82rem',
              fontWeight: 700, color: isP1 ? '#fff' : 'rgba(255,255,255,0.65)',
              fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: 72, textAlign: 'right',
            }}>
              {d.bestLapStr || '—'}
            </div>
          </div>
        )
      })}

      {/* Footer: total drivers */}
      {tower.drivers.length > top.length && (
        <div style={{
          padding: '0.35rem 0.9rem',
          fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          + {tower.drivers.length - top.length} more drivers · Final classification
        </div>
      )}
    </div>
  )
}

function ColHeader({ children, style }) {
  return (
    <span style={{
      fontSize: '0.56rem', color: 'rgba(255,255,255,0.28)',
      fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      ...style,
    }}>
      {children}
    </span>
  )
}

export default function LiveTimingBanner() {
  const [tower,   setTower]   = useState(null)
  const [updated, setUpdated] = useState(null)
  const cancelled             = useRef(false)
  const { isMobile }          = useBreakpoint()

  useEffect(() => {
    cancelled.current = false
    const poll = () => {
      telemetryApi.getTimingTower()
        .then(d => { if (!cancelled.current) { setTower(d); if (d) setUpdated(new Date()) } })
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled.current = true; clearInterval(id) }
  }, [])

  if (!tower) return null

  const cols = isMobile ? COLS_MOBILE : COLS_DESKTOP

  return (
    <div style={{
      background: 'rgba(10,10,10,0.97)',
      border: `1px solid ${tower?.completed ? 'rgba(255,255,255,0.1)' : 'rgba(168,85,247,0.35)'}`,
      borderRadius: 10,
      marginBottom: '1rem',
      overflow: 'hidden',
    }}>
      {/* Session header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.4rem',
        padding: '0.55rem 0.9rem',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: tower?.completed ? 'rgba(255,255,255,0.02)' : 'rgba(168,85,247,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {tower.completed ? (
            <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 6px' }}>
              Completed
            </span>
          ) : (
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: '#a855f7',
              display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0,
            }} />
          )}
          <span style={{ fontFamily: "'Barlow Condensed'", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', color: tower.completed ? 'rgba(255,255,255,0.45)' : '#a855f7', textTransform: 'uppercase' }}>
            {tower.completed ? tower.sessionName : `Live · ${tower.sessionName}`}
          </span>
          <span style={{ fontFamily: "'Barlow Condensed'", fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            {tower.raceName}
          </span>
        </div>
        {updated && !isMobile && (
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>
            {updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {/* Body: compact summary when completed, full table when live */}
      {tower.completed ? (
        <CompletedSummary tower={tower} isMobile={isMobile} />
      ) : (
        <>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: cols,
            gap: '0 0.45rem', alignItems: 'center',
            padding: '0.3rem 0.9rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <ColHeader style={{ textAlign: 'center' }}>P</ColHeader>
            <span />
            {!isMobile && <span />}
            <ColHeader>Driver</ColHeader>
            <ColHeader>Best</ColHeader>
            {!isMobile && <ColHeader style={{ textAlign: 'right' }}>L</ColHeader>}
            {!isMobile && <ColHeader>S1</ColHeader>}
            {!isMobile && <ColHeader>S2</ColHeader>}
            {!isMobile && <ColHeader>S3</ColHeader>}
            {!isMobile && <ColHeader>Gap</ColHeader>}
            {!isMobile && <ColHeader style={{ textAlign: 'center' }}>G</ColHeader>}
            {!isMobile && <ColHeader>T/B</ColHeader>}
          </div>

          {/* Rows */}
          <div style={{ maxHeight: isMobile ? 320 : 400, overflowY: 'auto' }}>
            {tower.drivers.map((d, i) => (
              <div key={d.driverNum} style={{
                display: 'grid', gridTemplateColumns: cols,
                gap: '0 0.45rem', alignItems: 'center',
                padding: '0.28rem 0.9rem',
                borderBottom: i < tower.drivers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
              }}>
                <span style={{ fontFamily: "'Barlow Condensed'", fontSize: '0.75rem', fontWeight: 700, color: d.position === 1 ? '#f5c518' : 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
                  {d.position}
                </span>
                <div style={{ width: 3, height: 22, borderRadius: 2, background: d.teamColor || '#444' }} />
                {!isMobile && <div style={{ display: 'flex', justifyContent: 'center' }}><Compound c={d.compound} /></div>}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: isMobile ? '0.82rem' : '0.8rem', fontWeight: 800, color: '#fff', letterSpacing: '0.03em' }}>{d.acronym}</div>
                  {!isMobile && <div style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.teamName}</div>}
                </div>
                <span style={{ fontFamily: "'Barlow Condensed'", fontSize: '0.78rem', fontWeight: 700, color: d.position === 1 ? '#a855f7' : '#fff', fontVariantNumeric: 'tabular-nums' }}>{d.bestLapStr || '—'}</span>
                {!isMobile && <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{d.laps ?? '—'}</span>}
                {!isMobile && <Sector s={d.s1} />}
                {!isMobile && <Sector s={d.s2} />}
                {!isMobile && <Sector s={d.s3} />}
                {!isMobile && <span style={{ fontSize: '0.68rem', fontVariantNumeric: 'tabular-nums', color: d.gapStr === 'LEADER' || d.gapStr === 'fastest' ? '#f5c518' : 'rgba(255,255,255,0.45)', fontWeight: d.gapStr === 'LEADER' || d.gapStr === 'fastest' ? 700 : 400 }}>{d.gapStr}</span>}
                {!isMobile && <div style={{ display: 'flex', justifyContent: 'center' }}><Gear g={d.gear} /></div>}
                {!isMobile && <ThrottleBrake throttle={d.throttle} brake={d.brake} />}
              </div>
            ))}
          </div>

          {/* Legend */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: '1rem', padding: '0.4rem 0.9rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.25)' }}>
              {[['#a855f7', 'Session best'], ['#22c55e', 'Personal best']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: '0.59rem', color: 'rgba(255,255,255,0.28)' }}>{label}</span>
                </div>
              ))}
              <span style={{ fontSize: '0.59rem', color: 'rgba(255,255,255,0.15)', marginLeft: 'auto' }}>
                {updated?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
