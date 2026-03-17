import { useState } from 'react'

const STORAGE_KEY = id => `hint_seen_${id}`

const DefaultIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
  </svg>
)

export default function PageHint({ id, title, text, icon }) {
  const resolvedIcon = icon ?? <DefaultIcon />
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem(STORAGE_KEY(id)) }
    catch { return false }
  })
  const [fading, setFading] = useState(false)

  if (!visible) return null

  function dismiss() {
    setFading(true)
    setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY(id), '1') } catch {}
      setVisible(false)
    }, 250)
  }

  return (
    <div
      style={{
        marginBottom: '1rem',
        padding: '0.75rem 1rem',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderLeft: '3px solid rgba(245,197,24,0.6)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.65rem',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.25s ease',
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: 'rgba(245,197,24,0.75)' }}>{resolvedIcon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '0.78rem', fontWeight: 700,
          color: '#fff', letterSpacing: '0.03em',
          marginRight: '0.4rem',
        }}>
          {title}
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {text}
        </span>
      </div>

      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.72rem', fontWeight: 700,
          color: 'var(--text-muted)',
          padding: '0.1rem 0.35rem', borderRadius: 4,
          flexShrink: 0, lineHeight: 1.4,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
        aria-label="Dismiss hint"
      >
        Got it <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 11, height: 11, verticalAlign: 'middle' }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
      </button>
    </div>
  )
}
