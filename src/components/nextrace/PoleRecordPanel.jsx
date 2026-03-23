import { useState, useEffect, useRef } from 'react'
import Panel from '../ui/Panel'

const cellStyle  = { padding: '0.3rem 0', borderBottom: '1px solid var(--border-subtle)' }
const labelStyle = { fontSize: '0.7rem', color: 'var(--text-secondary)' }

function TireStressLabel() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [open])

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
      <span style={labelStyle}>Tire stress</span>
      <svg
        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
        onClick={() => setOpen(v => !v)}
        style={{ width: 12, height: 12, color: open ? '#fff' : 'var(--text-muted)', flexShrink: 0, cursor: 'pointer' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
          background: 'rgba(15,15,15,0.97)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 7, padding: '0.45rem 0.65rem',
          width: 220, zIndex: 50,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          <div style={{ position: 'absolute', bottom: -5, left: 12, width: 8, height: 8,
            background: 'rgba(15,15,15,0.97)', border: '1px solid rgba(255,255,255,0.1)',
            borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)' }} />
          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>
            Stress levels are calculated based on historical race data and 2026 technical projections.
          </p>
        </div>
      )}
    </span>
  )
}

// Splits "307.8 km" → ["307.8", " km"] so number and unit can be styled separately
function Value({ v }) {
  const str   = String(v)
  const match = str.match(/^([\d.]+)(.*)$/)
  if (!match) return <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{str}</span>
  const [, num, unit] = match
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{num}</span>
      {unit && <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 1 }}>{unit}</span>}
    </span>
  )
}

export default function PoleRecordPanel({ specs }) {
  if (!specs) return null

  const raceDist = (specs.length * specs.laps).toFixed(1)

  const rows = [
    ['Circuit length',  `${raceDist} km`,         'Full throttle', `${specs.throttle}%`],
    ['Full race dist.', `${specs.length} km`,      'Top speed',     `${specs.topSpeed} km/h`],
    ['Laps',             specs.laps,               'Max G-force',   `${specs.gforce}G`],
    ['Turns',            specs.turns,              'Gear changes',  `${specs.gearChanges}/lap`],
    ['Tire stress',      `${specs.tireStress}/10`,  'Braking',       `${specs.braking}/10`],
  ]

  return (
    <Panel padding="none" style={{ padding: '1rem 1.25rem' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        Track Specs
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 2rem 1fr auto', alignItems: 'center' }}>
        {rows.map(([lL, vL, lR, vR]) => (
          <>
            <div key={lL + 'l'} style={cellStyle}>
              {lL === 'Tire stress' ? <TireStressLabel /> : <span style={labelStyle}>{lL}</span>}
            </div>
            <div key={lL + 'v'} style={{ ...cellStyle, textAlign: 'right' }}><Value v={vL} /></div>
            <div key={lL + 'd'} style={cellStyle} />
            <div key={lR + 'l'} style={cellStyle}><span style={labelStyle}>{lR}</span></div>
            <div key={lR + 'v'} style={{ ...cellStyle, textAlign: 'right' }}><Value v={vR} /></div>
          </>
        ))}
      </div>
    </Panel>
  )
}
