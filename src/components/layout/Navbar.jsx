import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { dashboardApi } from '../../services/api'
import { countryFlag } from '../../utils/flags'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { CTOR_COLORS } from '../../utils/teamColors'
import DriverDrawer from '../ui/DriverDrawer'
import ConstructorDrawer from '../ui/ConstructorDrawer'

function useCountdown(isoTarget) {
  const [parts, setParts] = useState(null)
  useEffect(() => {
    if (!isoTarget) return
    const tick = () => {
      const diff = new Date(isoTarget) - Date.now()
      if (diff <= 0) { setParts(null); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setParts({ d, h, m, s })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isoTarget])
  return parts
}

const I = (d) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const ICONS = {
  dashboard:    'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
  races:        'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z',
  standings:    'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
  encyclopedia: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
  circuits:     'm6.115 5.19.319 1.913A6 6 0 0 0 8.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 0 0 2.288-4.042 1.087 1.087 0 0 0-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 0 1-.98-.314l-.295-.295a1.125 1.125 0 0 1 0-1.591l.13-.132a1.125 1.125 0 0 1 1.3-.21l.603.302a.809.809 0 0 0 1.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 0 0 1.528-1.732l.146-.292M6.115 5.19A9 9 0 1 0 17.18 4.64M6.115 5.19A8.965 8.965 0 0 1 12 3c1.929 0 3.716.607 5.18 1.64',
  telemetry:    'M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25',
  teammates:    'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244',
}

const TABS = [
  { path: '/',             label: 'Dashboard',    icon: ICONS.dashboard,    color: '#ffffff' }, 
  { path: '/races',        label: 'Races',        icon: ICONS.races,        color: '#22c55e' }, 
  { path: '/standings',    label: 'Standings',    icon: ICONS.standings,    color: '#ffb700' }, 
  { path: '/encyclopedia', label: 'Encyclopedia', icon: ICONS.encyclopedia, color: '#94a3b8' }, 
  { path: '/circuits',     label: 'Circuits',     icon: ICONS.circuits,     color: '#3b82f6' }, 
  { path: '/telemetry',    label: 'Telemetry',    icon: ICONS.telemetry,    color: '#a855f7' }, 
  { path: '/teammates',    label: 'Teammates',    icon: ICONS.teammates,    color: '#f87171' }, 
]

function teamColor(constructorId) {
  return CTOR_COLORS[constructorId] || '#888'
}

function MiniStandings({ standings, constructorStandings, onSelect }) {
  const [tab, setTab] = useState('drivers')
  const list = tab === 'drivers' ? standings : constructorStandings
  if (!list?.length) return null

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
        {[['drivers', 'WDC'], ['constructors', 'WCC']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '0.3rem 0',
              borderRadius: 6,
              border: `1px solid ${tab === key ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
              background: tab === key ? 'rgba(225,6,0,0.12)' : 'transparent',
              color: tab === key ? '#e10600' : 'rgba(255,255,255,0.38)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        {list.map((entry, i) => {
          const color = teamColor(entry.constructorId)
          return (
            <div key={i}
              onClick={() => onSelect(entry, tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.4rem 0.75rem',
                borderBottom: i < list.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: i === 0 ? 'rgba(225,6,0,0.04)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = i === 0 ? 'rgba(225,6,0,0.04)' : 'transparent'}
            >
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.78rem', fontWeight: 700,
                color: i === 0 ? color : 'rgba(255,255,255,0.25)',
                width: 16, textAlign: 'right', flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.82rem', fontWeight: i === 0 ? 700 : 500,
                  color: i === 0 ? '#fff' : 'rgba(255,255,255,0.75)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {tab === 'drivers'
                    ? entry.name.split(' ').slice(-1)[0]
                    : entry.name}
                </div>
                {tab === 'drivers' && (
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.team}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: '0.82rem', fontWeight: 700,
                color: i === 0 ? color : 'rgba(255,255,255,0.5)',
                fontVariantNumeric: 'tabular-nums', flexShrink: 0,
              }}>
                {entry.points}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Navbar() {
  const location   = useLocation()
  const navigate   = useNavigate()
  const { isTablet } = useBreakpoint()
  const isHome     = location.pathname === '/'

  const [nextRace, setNextRace] = useState(null)
  const [standings, setStandings] = useState([])
  const [constructorStandings, setConstructorStandings] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [raceFinished, setRaceFinished] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [selectedConstructor, setSelectedConstructor] = useState(null)
  const [cdHover, setCdHover] = useState(false)

  const liveActive = !raceFinished && (nextRace?.currentSession?.isLive ?? false)
  const live       = liveActive ? nextRace.currentSession : null
  const countdown  = useCountdown(!live ? (nextRace?.nextSession?.dateTime ?? nextRace?.raceDateTime) : null)
  const flagUrl   = nextRace ? countryFlag(nextRace.country) : null

  const fetchDashboard = () => dashboardApi.get()
    .then(d => {
      setNextRace(d?.nextRace || null)
      setStandings(d?.standings || [])
      setConstructorStandings(d?.constructorStandings || [])
    })
    .catch(() => {})

  useEffect(() => { fetchDashboard() }, [])

  // Poll getLive every 30s; when race finishes, re-fetch dashboard to get next GP
  useEffect(() => {
    let cancelled = false
    let prevFinished = false
    const poll = () => dashboardApi.getLive()
      .then(d => {
        if (cancelled) return
        const finished = !!(d?.finished)
        setRaceFinished(finished)
        if (finished && !prevFinished) fetchDashboard()
        prevFinished = finished
      })
      .catch(() => {})
    poll()
    const id = setInterval(poll, 30000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Lock body scroll when menu open
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
        position: 'sticky', top: 0, zIndex: 100,
        gap: '0.75rem',
      }}>

        {/* Logo */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', flexShrink: 0 }}>
          <img
            src="/favicon.png"
            alt="PITWALL INTELLIGENCE"
            style={{ width: 34, height: 34, borderRadius: 6, flexShrink: 0, objectFit: 'cover' }}
          />
          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)',
              letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1,
            }}>
              PITWALL<span style={{ color: 'var(--f1-red)' }}>INTELLIGENCE</span>
            </div>
            {!isTablet && (
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
                Every Lap. Every Era. One Grid.
              </div>
            )}
          </div>
        </NavLink>

        {/* Desktop tabs */}
        {!isTablet && (
          <div style={{ display: 'flex', gap: '0.25rem', flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {TABS.map(({ path, label, icon, color }) => {
              const ring = color + '33'
              const bg   = color + '14'
              const isActive = path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(path)
              return (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  onClick={() => {
                    if (isActive) {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                      navigate(path, { state: { reset: Date.now() } })
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 7,
                    border: `1px solid ${isActive ? color : 'transparent'}`,
                    background: isActive ? bg : 'transparent',
                    color: isActive ? color : 'var(--text-muted)',
                    textDecoration: 'none',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 800 : 600,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: isActive ? `0 0 14px ${ring}, 0 4px 12px rgba(0,0,0,0.4)` : 'none',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                    userSelect: 'none',
                  }}
                  onMouseEnter={e => {
                    if (!e.currentTarget.style.boxShadow.includes('14px')) {
                      e.currentTarget.style.color = '#fff'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!e.currentTarget.style.boxShadow.includes('14px')) {
                      e.currentTarget.style.color = 'var(--text-muted)'
                    }
                  }}
                >
                  {I(icon)}
                  {label}
                </NavLink>
              )
            })}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>

          {/* Live / countdown — desktop only */}
          {!isTablet && nextRace && (live || countdown) && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => navigate(live ? '/live' : '/next-race')}
                onMouseEnter={() => setCdHover(true)}
                onMouseLeave={() => setCdHover(false)}
                style={{
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  background: cdHover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '0.35rem 0.75rem',
                  marginLeft: '0.5rem',
                  transition: 'background 0.15s, border-color 0.15s',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.68rem', fontWeight: 800, color: 'var(--f1-red)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Next {nextRace.nextSession?.label || 'Race'}
                      </span>
                      <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'baseline' }}>
                        {[['d','D'],['h','H'],['m','M'],['s','S']].map(([k, lbl]) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
                            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                              {String(countdown[k]).padStart(2, '0')}
                            </span>
                            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{lbl}</span>
                          </div>
                        ))}
                      </div>
                      {/* Arrow hint — only on dashboard */}
                      {isHome && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                          strokeWidth={2.5} stroke="currentColor"
                          style={{
                            width: 13, height: 13, color: 'var(--f1-red)', flexShrink: 0,
                            animation: 'cd-bounce 1.4s ease-in-out infinite',
                          }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      )}
                    </div>
                  ) : null}
                </div>
              </button>

              {/* Tooltip — desktop, on hover */}
              {!live && countdown && cdHover && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: 'rgba(15,15,15,0.97)',
                  border: '1px solid rgba(225,6,0,0.3)',
                  borderRadius: 8,
                  padding: '0.5rem 0.75rem',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 200,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}>
                  {/* Arrow */}
                  <div style={{
                    position: 'absolute', top: -5, right: 16,
                    width: 9, height: 9,
                    background: 'rgba(15,15,15,0.97)',
                    border: '1px solid rgba(225,6,0,0.3)',
                    borderRight: 'none', borderBottom: 'none',
                    transform: 'rotate(45deg)',
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#e10600" style={{ width: 14, height: 14, flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                    </svg>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                      Ver detalles de la próxima sesión
                    </span>
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.38)', marginTop: '0.2rem', paddingLeft: 18 }}>
                    Horario completo · circuito · clima
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile: live badge or countdown (compact) */}
          {isTablet && live && (
            <button
              onClick={() => navigate('/live')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 5, padding: '4px 10px', cursor: 'pointer',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', letterSpacing: '0.08em', fontFamily: "'Barlow Condensed', sans-serif" }}>LIVE</span>
            </button>
          )}
          {isTablet && !live && countdown && (
            <motion.button
              onClick={() => navigate('/next-race')}
              whileTap={{ scale: 0.93 }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 7,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.2rem',
                padding: '5px 9px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              {[['d','D'],['h','H'],['m','M']].map(([k, lbl]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {String(countdown[k]).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{lbl}</span>
                </div>
              ))}
              {isHome && (
                <svg
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth={2.5} stroke="currentColor"
                  style={{ width: 11, height: 11, color: 'var(--f1-red)', flexShrink: 0, marginLeft: 2, animation: 'cd-bounce 1.4s ease-in-out infinite' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </motion.button>
          )}

          {/* Hamburger — mobile/tablet only */}
          {isTablet && (
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 5, width: 38, height: 38,
                background: menuOpen ? 'var(--surface-3)' : 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                transition: 'background 0.15s',
              }}
            >
              <span style={{
                display: 'block', width: 18, height: 2, borderRadius: 1,
                background: menuOpen ? 'var(--f1-red)' : 'var(--text-secondary)',
                transition: 'transform 0.2s, opacity 0.2s',
                transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
              }} />
              <span style={{
                display: 'block', width: 18, height: 2, borderRadius: 1,
                background: menuOpen ? 'var(--f1-red)' : 'var(--text-secondary)',
                transition: 'opacity 0.2s',
                opacity: menuOpen ? 0 : 1,
              }} />
              <span style={{
                display: 'block', width: 18, height: 2, borderRadius: 1,
                background: menuOpen ? 'var(--f1-red)' : 'var(--text-secondary)',
                transition: 'transform 0.2s, opacity 0.2s',
                transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
              }} />
            </button>
          )}
        </div>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isTablet && menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                top: 'var(--navbar-height)',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 98,
              }}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 260 }}
              style={{
                position: 'fixed',
                top: 'var(--navbar-height)', right: 0, bottom: 0,
                width: Math.min(320, window.innerWidth),
                background: 'rgba(10,10,10,0.98)',
                backdropFilter: 'blur(20px)',
                borderLeft: '1px solid var(--border-color)',
                zIndex: 99,
                overflowY: 'auto',
                display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{ padding: '1.25rem 1rem', flex: 1 }}>

                {/* Nav links */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', paddingLeft: '0.25rem' }}>
                    Navigation
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {TABS.map(({ path, label, icon, color }) => {
                      const isActive = path === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(path)
                      return (
                        <NavLink
                          key={path}
                          to={path}
                          end={path === '/'}
                          onClick={() => {
                            setMenuOpen(false)
                            if (isActive) {
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                              navigate(path, { state: { reset: Date.now() } })
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.65rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 8,
                            border: `1px solid ${isActive ? color + '55' : 'transparent'}`,
                            background: isActive ? color + '18' : 'transparent',
                            color: isActive ? color : 'var(--text-secondary)',
                            textDecoration: 'none',
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: '1rem', fontWeight: isActive ? 800 : 600,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            transition: 'background 0.15s',
                          }}
                        >
                          {I(icon)}
                          {label}
                        </NavLink>
                      )
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border-color)', margin: '1rem 0' }} />

                {/* Next race / countdown */}
                {nextRace && (live || countdown) && (
                  <>
                    <button
                      onClick={() => navigate(live ? '/live' : '/next-race')}
                      style={{
                        width: '100%', background: live ? 'rgba(239,68,68,0.08)' : 'var(--surface-2)',
                        border: `1px solid ${live ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
                        borderRadius: 8, padding: '0.65rem 0.85rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {flagUrl && <img src={flagUrl} alt={nextRace.country} style={{ width: 22, borderRadius: 2 }} />}
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                            {live ? `LIVE · ${live.label}` : `Next ${nextRace.nextSession?.label || 'Race'}`}
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', fontFamily: "'Barlow Condensed', sans-serif" }}>
                            {nextRace.raceName?.replace(' Grand Prix', ' GP')}
                          </div>
                        </div>
                      </div>
                      {live ? (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0 }} />
                      ) : countdown ? (
                        <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'baseline' }}>
                          {[['d','D'],['h','H'],['m','M'],['s','S']].map(([k, lbl]) => (
                            <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
                              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                                {String(countdown[k]).padStart(2, '0')}
                              </span>
                              <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{lbl}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </button>
                    <div style={{ height: 1, background: 'var(--border-color)', margin: '1rem 0' }} />
                  </>
                )}

                {/* Mini standings */}
                <div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', paddingLeft: '0.25rem' }}>
                    Championship
                  </div>
                  <MiniStandings
                    standings={standings}
                    constructorStandings={constructorStandings}
                    onSelect={(entry, tab) => {
                      setMenuOpen(false)
                      setTimeout(() => {
                        if (tab === 'constructors') setSelectedConstructor({ constructorId: entry.constructorId, name: entry.name })
                        else setSelectedDriver({ driverId: entry.driverId, name: entry.name })
                      }, 250)
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {[{ to: '/standings', label: 'Driver standings' }, { to: '/constructor-standings', label: 'Constructor standings' }].map(({ to, label }) => (
                      <NavLink
                        key={to}
                        to={to}
                        style={{ flex: 1, padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', borderRadius: 7, border: '1px solid var(--border-subtle)', background: 'var(--surface-2)', color: 'var(--text-secondary)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none' }}
                      >
                        {label} {I('m8.25 4.5 7.5 7.5-7.5 7.5')}
                      </NavLink>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DriverDrawer driver={selectedDriver} onClose={() => setSelectedDriver(null)} />
      <ConstructorDrawer constructor={selectedConstructor} onClose={() => setSelectedConstructor(null)} />
    </>
  )
}
