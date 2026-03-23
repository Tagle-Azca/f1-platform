import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useBreakpoint } from '../../hooks/useBreakpoint'

export default function NavbarDesktopCountdown({ nextRace, live, countdown, isUrgent, flagUrl }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { isTablet } = useBreakpoint()
  const isHome    = location.pathname === '/'
  const [hover, setHover] = useState(false)

  if (!nextRace || (!live && !countdown)) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => navigate(live ? '/live' : '/next-race')}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.65rem',
          background: isUrgent
            ? 'rgba(225,6,0,0.07)'
            : hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isUrgent ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 8,
          padding: '0.35rem 0.75rem',
          marginLeft: '0.5rem',
          transition: 'background 0.15s',
          animation: isUrgent ? 'urgent-glow 1.8s ease-in-out infinite' : 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      >
        {flagUrl && (
          <img src={flagUrl} alt={nextRace.country}
            style={{ width: 26, height: 'auto', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.5)', flexShrink: 0 }}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontWeight: 600 }}>
            {nextRace.raceName?.replace(' Grand Prix', ' GP')}
          </div>
          {live ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 4, padding: '2px 8px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', letterSpacing: '0.08em' }}>LIVE · {live.label}</span>
            </div>
          ) : countdown ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.75rem', fontWeight: 900, color: 'var(--f1-red)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {nextRace.nextSession?.label || 'Race'} in:
              </span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.05rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', lineHeight: 1, whiteSpace: 'nowrap', letterSpacing: '0.02em', animation: isUrgent ? 'urgent-num 1.8s ease-in-out infinite' : 'none', color: '#fff' }}>
                {String(countdown.d).padStart(2,'0')}<span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>d</span>{String(countdown.h).padStart(2,'0')}<span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>h</span>{String(countdown.m).padStart(2,'0')}<span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>m</span>{String(countdown.s).padStart(2,'0')}<span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>s</span>
              </span>
              {isHome && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth={2.5} stroke="currentColor"
                  style={{ width: 13, height: 13, color: 'var(--f1-red)', flexShrink: 0, animation: 'cd-bounce 1.4s ease-in-out infinite' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </div>
          ) : null}
        </div>
      </button>

      {/* Tooltip — desktop only (no hover on touch) */}
      {!live && countdown && hover && !isTablet && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          background: 'rgba(15,15,15,0.97)',
          border: '1px solid rgba(225,6,0,0.3)',
          borderRadius: 8, padding: '0.5rem 0.75rem',
          whiteSpace: 'nowrap', pointerEvents: 'none',
          zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          <div style={{ position: 'absolute', top: -5, right: 16, width: 9, height: 9, background: 'rgba(15,15,15,0.97)', border: '1px solid rgba(225,6,0,0.3)', borderRight: 'none', borderBottom: 'none', transform: 'rotate(45deg)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#e10600" style={{ width: 14, height: 14, flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              View next session details
            </span>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.38)', marginTop: '0.2rem', paddingLeft: 18 }}>
            Full schedule · circuit · weather
          </div>
        </div>
      )}
    </div>
  )
}
