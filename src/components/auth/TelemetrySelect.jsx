import { useState } from 'react'

export default function TelemetrySelect({ value, onChange, options, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value} onChange={onChange} required
        style={{
          width: '100%', background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 6, padding: '0.5rem 1.75rem 0.5rem 0.65rem',
          color: value ? 'var(--text-primary)' : 'rgba(255,255,255,0.3)',
          fontSize: '0.8rem', fontFamily: "'Barlow Condensed', monospace",
          fontWeight: 700, letterSpacing: '0.06em',
          outline: 'none', cursor: 'pointer', appearance: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}
            style={{ background: '#111', color: '#f0f0f0' }}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      <svg
        style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.4)" strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}
