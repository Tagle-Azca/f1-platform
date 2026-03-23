import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import MiniStandings from './MiniStandings'
import DriverDrawer from '../ui/DriverDrawer'
import ConstructorDrawer from '../ui/ConstructorDrawer'

const I = (d) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const TABS = [
  { path: '/',             label: 'Dashboard',    color: '#ffffff',  icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' },
  { path: '/races',        label: 'Races',        color: '#22c55e',  icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z' },
  { path: '/standings',    label: 'Standings',    color: '#ffb700',  icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z' },
  { path: '/encyclopedia', label: 'Encyclopedia', color: '#94a3b8',  icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25' },
  { path: '/circuits',     label: 'Circuits',     color: '#3b82f6',  icon: 'm6.115 5.19.319 1.913A6 6 0 0 0 8.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 0 0 2.288-4.042 1.087 1.087 0 0 0-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 0 1-.98-.314l-.295-.295a1.125 1.125 0 0 1 0-1.591l.13-.132a1.125 1.125 0 0 1 1.3-.21l.603.302a.809.809 0 0 0 1.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 0 0 1.528-1.732l.146-.292M6.115 5.19A9 9 0 1 0 17.18 4.64M6.115 5.19A8.965 8.965 0 0 1 12 3c1.929 0 3.716.607 5.18 1.64' },
  { path: '/telemetry',    label: 'Telemetry',    color: '#a855f7',  icon: 'M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25' },
  { path: '/teammates',    label: 'Teammates',    color: '#f87171',  icon: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' },
]

export default function NavbarMobileDrawer({ open, onClose, nextRace, live, countdown, isUrgent, flagUrl, standings, constructorStandings }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [selectedDriver,      setSelectedDriver]      = useState(null)
  const [selectedConstructor, setSelectedConstructor] = useState(null)

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              style={{ position: 'fixed', inset: 0, top: 'var(--navbar-height)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 98 }}
            />

            <motion.div
              key="drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 260 }}
              style={{
                position: 'fixed', top: 'var(--navbar-height)', right: 0, bottom: 0,
                width: Math.min(320, window.innerWidth),
                background: 'rgba(10,10,10,0.98)', backdropFilter: 'blur(20px)',
                borderLeft: '1px solid var(--border-color)',
                zIndex: 99, overflowY: 'auto',
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
                      const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
                      return (
                        <NavLink
                          key={path} to={path} end={path === '/'}
                          onClick={() => {
                            onClose()
                            if (isActive) {
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                              navigate(path, { state: { reset: Date.now() } })
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.65rem',
                            padding: '0.65rem 0.85rem', borderRadius: 8,
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
                          {I(icon)}{label}
                        </NavLink>
                      )
                    })}
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--border-color)', margin: '1rem 0' }} />

                {/* Next race */}
                {nextRace && (live || countdown) && (
                  <>
                    <button
                      onClick={() => navigate(live ? '/live' : '/next-race')}
                      style={{
                        width: '100%',
                        background: live ? 'rgba(239,68,68,0.08)' : isUrgent ? 'rgba(225,6,0,0.07)' : 'var(--surface-2)',
                        border: `1px solid ${live ? 'rgba(239,68,68,0.3)' : isUrgent ? 'rgba(225,6,0,0.5)' : 'var(--border-subtle)'}`,
                        borderRadius: 8, padding: '0.65rem 0.85rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer',
                        animation: isUrgent && !live ? 'urgent-glow 1.8s ease-in-out infinite' : 'none',
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
                              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.95rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#fff', animation: isUrgent ? 'urgent-num 1.8s ease-in-out infinite' : 'none' }}>
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
                      onClose()
                      setTimeout(() => {
                        if (tab === 'constructors') setSelectedConstructor({ constructorId: entry.constructorId, name: entry.name })
                        else setSelectedDriver({ driverId: entry.driverId, name: entry.name })
                      }, 250)
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {[{ to: '/standings', label: 'Driver standings' }, { to: '/constructor-standings', label: 'Constructor standings' }].map(({ to, label }) => (
                      <NavLink
                        key={to} to={to}
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
