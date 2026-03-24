import { useState, useEffect, useRef } from 'react'
import Panel from '../ui/Panel'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const cellStyle  = { padding: '0.28rem 0', borderBottom: '1px solid var(--border-subtle)' }
const labelStyle = { fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }

const ESTIMATED_LABELS = {
  'Tire stress': 'Stress levels are calculated based on historical race data and 2026 technical projections.',
  'Braking':     'Braking intensity is estimated based on circuit layout and historical race data.',
}

function EstimatedLabel({ name, tooltip }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('touchstart', handleClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [open])

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
      <span style={labelStyle}>{name}</span>
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
          width: 220, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          <div style={{ position: 'absolute', bottom: -5, left: 12, width: 8, height: 8,
            background: 'rgba(15,15,15,0.97)', border: '1px solid rgba(255,255,255,0.1)',
            borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)' }} />
          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>
            {tooltip}
          </p>
        </div>
      )}
    </span>
  )
}

function Label({ name }) {
  const tooltip = ESTIMATED_LABELS[name]
  if (tooltip) return <EstimatedLabel name={name} tooltip={tooltip} />
  return <span style={labelStyle}>{name}</span>
}

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

// Heroicons
function IconWrench() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 11, height: 11 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 1 1-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 0 1 6.336-4.486l-3.276 3.276a3.004 3.004 0 0 0 2.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852Z" />
    </svg>
  )
}

function IconBolt() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 11, height: 11 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  )
}

function IconMap() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 11, height: 11 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
    </svg>
  )
}

function CategoryHeader({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem', marginTop: '1.25rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
      <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  )
}

function StatRow({ name, val, last }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center',
      padding: '0.85rem 0', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
      <Label name={name} />
      <Value v={val} />
    </div>
  )
}

export default function PoleRecordPanel({ specs }) {
  const { isMobile } = useBreakpoint()
  if (!specs) return null

  const raceDist = (specs.length * specs.laps).toFixed(1)

  const carDemand = [
    ['Tire stress',  `${specs.tireStress}/10`],
    ['Braking',      `${specs.braking}/10`],
  ]
  const performance = [
    ['Top speed',    `${specs.topSpeed} km/h`],
    ['Max G-force',  `${specs.gforce}G`],
    ['Full throttle',`${specs.throttle}%`],
  ]
  const circuit = [
    ['Lap length',   `${specs.length.toFixed(1)} km`],
    ['Race dist.',   `${raceDist} km`],
    ['Laps',          specs.laps],
    ['Turns',         specs.turns],
    ['Gear changes', `${specs.gearChanges}/lap`],
  ]

  if (isMobile) {
    const flat = [...carDemand, ...performance, ...circuit]
    return (
      <Panel padding="none" style={{ padding: '1rem 1.25rem', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          Track Specs
        </div>
        <div>
          {flat.map(([name, val], i) => (
            <StatRow key={name} name={name} val={val} last={i === flat.length - 1} />
          ))}
        </div>
      </Panel>
    )
  }

  // Flat 2-col grid: each pair (left, right) shares the same grid row for perfect alignment
  // Layout: Car Demand (2 rows) + Performance (3 rows) on left; Circuit (5 rows) on right
  // Row mapping: headers aligned at row 1, first data rows aligned at row 2, Performance header at row 4 with empty right
  const P = '0.75rem' // padding around divider

  return (
    <Panel padding="none" style={{ padding: '1rem 1.25rem', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
        Track Specs
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative' }}>
        {/* Continuous vertical divider */}
        <div style={{
          position: 'absolute', left: '50%', top: 0, bottom: 0,
          width: 1, background: 'var(--border-subtle)',
          transform: 'translateX(-0.5px)',
        }} />

        {/* Row 1: section headers */}
        <div style={{ paddingRight: P }}><CategoryHeader icon={<IconWrench />} label="Car Demand" /></div>
        <div style={{ paddingLeft: P }}><CategoryHeader icon={<IconMap />} label="Circuit" /></div>

        {/* Row 2 */}
        <div style={{ paddingRight: P }}><StatRow name="Tire stress" val={`${specs.tireStress}/10`} /></div>
        <div style={{ paddingLeft: P }}><StatRow name="Lap length" val={`${specs.length.toFixed(1)} km`} /></div>

        {/* Row 3 */}
        <div style={{ paddingRight: P }}><StatRow name="Braking" val={`${specs.braking}/10`} /></div>
        <div style={{ paddingLeft: P }}><StatRow name="Race dist." val={`${raceDist} km`} /></div>

        {/* Row 4: Performance header left | empty right (visual section break) */}
        <div style={{ paddingRight: P }}><CategoryHeader icon={<IconBolt />} label="Performance" /></div>
        <div style={{ paddingLeft: P }} />

        {/* Row 5 */}
        <div style={{ paddingRight: P }}><StatRow name="Top speed" val={`${specs.topSpeed} km/h`} /></div>
        <div style={{ paddingLeft: P }}><StatRow name="Laps" val={specs.laps} /></div>

        {/* Row 6 */}
        <div style={{ paddingRight: P }}><StatRow name="Max G-force" val={`${specs.gforce}G`} /></div>
        <div style={{ paddingLeft: P }}><StatRow name="Turns" val={specs.turns} /></div>

        {/* Row 7: last in both columns */}
        <div style={{ paddingRight: P }}><StatRow name="Full throttle" val={`${specs.throttle}%`} last /></div>
        <div style={{ paddingLeft: P }}><StatRow name="Gear changes" val={`${specs.gearChanges}/lap`} last /></div>
      </div>
    </Panel>
  )
}
