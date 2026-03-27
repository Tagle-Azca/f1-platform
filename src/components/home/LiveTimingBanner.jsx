import { useState, useEffect, useRef } from 'react'
import { telemetryApi } from '../../services/api'

const POLL_MS = 8000

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

function Compound({ c }) {
  if (!c || c === 'UNKNOWN') return <span style={{ width: 16 }} />
  const style = COMPOUND_STYLE[c] || { bg: 'rgba(255,255,255,0.15)', color: '#fff' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 16, height: 16, borderRadius: '50%',
      background: style.bg, color: style.color,
      fontSize: '0.58rem', fontWeight: 900, flexShrink: 0,
    }}>
      {c[0]}
    </span>
  )
}

function SectorCell({ s }) {
  if (!s) return <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.68rem' }}>—</span>
  const color = SECTOR_COLOR[s.color] || 'rgba(255,255,255,0.55)'
  const display = typeof s.time === 'number' ? s.time.toFixed(3) : s.time
  return (
    <span style={{ color, fontSize: '0.68rem', fontWeight: s.color ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>
      {display}
    </span>
  )
}

export default function LiveTimingBanner() {
  const [tower,   setTower]   = useState(null)
  const [updated, setUpdated] = useState(null)
  const cancelled = useRef(false)

  useEffect(() => {
    cancelled.current = false
    const poll = () => {
      telemetryApi.getTimingTower()
        .then(d => {
          if (cancelled.current) return
          setTower(d)
          if (d) setUpdated(new Date())
        })
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled.current = true; clearInterval(id) }
  }, [])

  if (!tower) return null

  const sessionLabel = tower.sessionName?.toUpperCase()
  const isFP = tower.sessionName?.startsWith('Practice')

  return (
    <div style={{
      background: 'rgba(10,10,10,0.97)',
      border: '1px solid rgba(168,85,247,0.35)',
      borderRadius: 10,
      marginBottom: '1rem',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.6rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(168,85,247,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#a855f7', display: 'inline-block',
            animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
            color: '#a855f7', textTransform: 'uppercase',
          }}>
            Live · {sessionLabel}
          </span>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '0.85rem', fontWeight: 700, color: '#fff',
          }}>
            {tower.raceName}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isFP
              ? '28px 38px 1fr 60px 32px 72px 60px'
              : '28px 38px 1fr 60px 32px 72px',
            gap: '0 0.5rem',
            alignItems: 'center',
            width: isFP ? 380 : 320,
          }}>
            {['P', 'DRV', '', isFP ? 'BEST' : 'GAP', 'LAPS', 'S1·S2·S3', isFP ? 'GAP' : ''].filter(Boolean).map((h, i) => (
              <span key={i} style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.06em', textAlign: i === 0 ? 'center' : 'left' }}>
                {h}
              </span>
            ))}
          </div>
          {updated && (
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>
              {updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Timing rows */}
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {tower.drivers.map((d, i) => (
          <div key={d.driverNum} style={{
            display: 'grid',
            gridTemplateColumns: '28px 4px 38px 1fr 60px 32px 38px 38px 38px 60px',
            gap: '0 0.45rem',
            alignItems: 'center',
            padding: '0.3rem 1rem',
            borderBottom: i < tower.drivers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
          }}>
            {/* Position */}
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.75rem', fontWeight: 700,
              color: d.position === 1 ? '#f5c518' : 'rgba(255,255,255,0.5)',
              textAlign: 'center',
            }}>
              {d.position}
            </span>

            {/* Team color bar */}
            <div style={{ width: 3, height: 24, borderRadius: 2, background: d.teamColor || 'rgba(255,255,255,0.2)', flexShrink: 0 }} />

            {/* Compound */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compound c={d.compound} />
            </div>

            {/* Acronym + team */}
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.8rem', fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>
                {d.acronym}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>
                {d.teamName?.split(' ').slice(0, 2).join(' ')}
              </div>
            </div>

            {/* Best lap */}
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.78rem', fontWeight: 700,
              color: d.position === 1 ? '#a855f7' : '#fff',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {d.bestLapStr || '—'}
            </span>

            {/* Laps */}
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>
              {d.laps ?? '—'}
            </span>

            {/* Sectors */}
            <SectorCell s={d.s1} />
            <SectorCell s={d.s2} />
            <SectorCell s={d.s3} />

            {/* Gap */}
            <span style={{
              fontSize: '0.68rem',
              color: d.gap === null ? '#f5c518' : 'rgba(255,255,255,0.5)',
              fontWeight: d.gap === null ? 700 : 400,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {d.gapStr}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '1rem', padding: '0.45rem 1rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.3)',
      }}>
        {[['#a855f7', 'Session best'], ['#22c55e', 'Personal best']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>{label}</span>
          </div>
        ))}
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.15)', marginLeft: 'auto' }}>
          Updates every {POLL_MS / 1000}s
        </span>
      </div>
    </div>
  )
}
