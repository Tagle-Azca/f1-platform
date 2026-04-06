import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useNavbar } from '../../hooks/useNavbar'
import NavbarDesktopCountdown from './NavbarDesktopCountdown'
import NavbarMobileDrawer from './NavbarMobileDrawer'
import GuestProfile from '../auth/GuestProfile'

const I = (d) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const TABS = [
  { path: '/',             label: 'Dashboard',    color: '#ffffff',  icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' },
  { path: '/races',        label: 'Calendar',        color: '#22c55e',  icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z' },
  { path: '/standings',    label: 'Standings',    color: '#ffb700',  icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z' },
  { path: '/encyclopedia', label: 'Encyclopedia', color: '#94a3b8',  icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25' },
  { path: '/circuits',     label: 'Circuits',     color: '#3b82f6',  icon: 'm6.115 5.19.319 1.913A6 6 0 0 0 8.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 0 0 2.288-4.042 1.087 1.087 0 0 0-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 0 1-.98-.314l-.295-.295a1.125 1.125 0 0 1 0-1.591l.13-.132a1.125 1.125 0 0 1 1.3-.21l.603.302a.809.809 0 0 0 1.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 0 0 1.528-1.732l.146-.292M6.115 5.19A9 9 0 1 0 17.18 4.64M6.115 5.19A8.965 8.965 0 0 1 12 3c1.929 0 3.716.607 5.18 1.64' },
  { path: '/telemetry',    label: 'Telemetry',    color: '#a855f7',  icon: 'M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25' },
  { path: '/teammates',    label: 'Rivalries',    color: '#f87171',  icon: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' },
]

export default function Navbar() {
  const location   = useLocation()
  const navigate   = useNavigate()
  const { isTablet } = useBreakpoint()
  const isHome     = location.pathname === '/'
  const [menuOpen, setMenuOpen] = useState(false)

  const { nextRace, standings, constructorStandings, live, countdown, isUrgent, flagUrl } = useNavbar()

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <nav style={{
        height: 'var(--navbar-height)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.25rem',
        background: 'var(--surface-1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky', top: 0, zIndex: 40,
        gap: '0.75rem',
      }}>

        {/* Logo */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', flexShrink: 0 }}>
          <img src="/favicon.png" alt="PITWALL INTELLIGENCE" style={{ width: 34, height: 34, borderRadius: 6, flexShrink: 0, objectFit: 'cover' }} />
          {!isTablet && (
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
                PITWALL<span style={{ color: 'var(--f1-red)' }}>INTELLIGENCE</span>
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
                Every Lap. Every Era. One Grid.
              </div>
            </div>
          )}
        </NavLink>

        {/* Desktop tabs */}
        {!isTablet && (
          <div style={{ display: 'flex', gap: '0.25rem', flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {TABS.map(({ path, label, icon, color }) => {
              const ring     = color + '33'
              const bg       = color + '14'
              const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
              return (
                <NavLink
                  key={path} to={path} end={path === '/'}
                  onClick={() => {
                    if (isActive) {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                      navigate(path, { state: { reset: Date.now() } })
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.4rem 0.75rem', borderRadius: 7,
                    border: `1px solid ${isActive ? color : 'transparent'}`,
                    background: isActive ? bg : 'transparent',
                    color: isActive ? color : 'var(--text-muted)',
                    textDecoration: 'none',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '0.82rem', fontWeight: isActive ? 800 : 600,
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                    whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: isActive ? `0 0 14px ${ring}, 0 4px 12px rgba(0,0,0,0.4)` : 'none',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                    userSelect: 'none',
                  }}
                  onMouseEnter={e => { if (!e.currentTarget.style.boxShadow.includes('14px')) e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { if (!e.currentTarget.style.boxShadow.includes('14px')) e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  {I(icon)}{label}
                </NavLink>
              )
            })}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>

          {/* Countdown — same component for all screen sizes */}
          <NavbarDesktopCountdown
            nextRace={nextRace} live={live} countdown={countdown}
            isUrgent={isUrgent} flagUrl={flagUrl}
          />

          <GuestProfile />

          {/* Hamburger */}
          {isTablet && (
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 5, width: 38, height: 38,
                background: menuOpen ? 'var(--surface-3)' : 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8, cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
              }}
            >
              <span style={{ display: 'block', width: 18, height: 2, borderRadius: 1, background: menuOpen ? 'var(--f1-red)' : 'var(--text-secondary)', transition: 'transform 0.2s, opacity 0.2s', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
              <span style={{ display: 'block', width: 18, height: 2, borderRadius: 1, background: menuOpen ? 'var(--f1-red)' : 'var(--text-secondary)', transition: 'opacity 0.2s', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: 18, height: 2, borderRadius: 1, background: menuOpen ? 'var(--f1-red)' : 'var(--text-secondary)', transition: 'transform 0.2s, opacity 0.2s', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
            </button>
          )}
        </div>
      </nav>

      <NavbarMobileDrawer
        open={menuOpen} onClose={() => setMenuOpen(false)}
        nextRace={nextRace} live={live} countdown={countdown}
        isUrgent={isUrgent} flagUrl={flagUrl}
        standings={standings} constructorStandings={constructorStandings}
      />
    </>
  )
}
