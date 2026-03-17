import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { statsApi } from '../../services/api'
import { CTOR_COLORS, driverColor } from '../../utils/teamColors'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const SIDEBAR_W = 192

function teamColor(constructorId) {
  return CTOR_COLORS[constructorId] || '#888'
}

function DriverRow({ entry, i }) {
  const color = teamColor(entry.constructorId)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.45rem',
      padding: '0.3rem 0.75rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: '0.75rem', fontWeight: 700,
        color: i === 0 ? color : 'rgba(255,255,255,0.22)',
        width: 16, textAlign: 'right', flexShrink: 0,
      }}>
        {i + 1}
      </span>
      <div style={{ width: 3, height: 20, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.76rem', fontWeight: i === 0 ? 700 : 500,
          color: i === 0 ? '#fff' : 'rgba(255,255,255,0.75)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.2,
        }}>
          {entry.name.split(' ').slice(-1)[0]}
        </div>
        <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {entry.team}
        </div>
      </div>
      <span style={{
        fontSize: '0.76rem', fontWeight: 700,
        color: i === 0 ? color : 'rgba(255,255,255,0.5)',
        fontVariantNumeric: 'tabular-nums', flexShrink: 0,
      }}>
        {entry.points}
      </span>
    </div>
  )
}

function CtorRow({ entry, i }) {
  const color = teamColor(entry.constructorId)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.45rem',
      padding: '0.36rem 0.75rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: '0.75rem', fontWeight: 700,
        color: i === 0 ? color : 'rgba(255,255,255,0.22)',
        width: 16, textAlign: 'right', flexShrink: 0,
      }}>
        {i + 1}
      </span>
      <div style={{ width: 3, height: 20, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{
        flex: 1, fontSize: '0.76rem', fontWeight: i === 0 ? 700 : 500,
        color: i === 0 ? '#fff' : 'rgba(255,255,255,0.75)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {entry.name}
      </span>
      <span style={{
        fontSize: '0.76rem', fontWeight: 700,
        color: i === 0 ? color : 'rgba(255,255,255,0.5)',
        fontVariantNumeric: 'tabular-nums', flexShrink: 0,
      }}>
        {entry.points}
      </span>
    </div>
  )
}

export default function StandingsSidebar() {
  const location = useLocation()
  const { isTablet } = useBreakpoint()

  // On mobile/tablet the sidebar lives inside the Navbar drawer — hide here
  if (isTablet) return null
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem('standings-sidebar') !== 'closed' } catch { return true }
  })
  const [tab,     setTab]     = useState('drivers')
  const [drivers, setDrivers] = useState([])
  const [ctors,   setCtors]   = useState([])
  const [season,  setSeason]  = useState('')
  const [loading, setLoading] = useState(true)

  const year = String(new Date().getFullYear())

  useEffect(() => {
    Promise.all([
      statsApi.getSeasonStandings(year),
      statsApi.getConstructorStandings(year),
    ])
      .then(([ds, cs]) => {
        // ── Drivers ──────────────────────────────────────────────
        if (ds?.drivers && ds.rounds?.length) {
          const lastIdx = ds.rounds.length - 1
          const sorted = ds.drivers
            .map(d => ({
              driverId:      d.driverId,
              name:          d.name,
              team:          d.team   || '',
              constructorId: d.teamId || '',
              points:        Math.round((d.cumulative?.[lastIdx] ?? 0) * 10) / 10,
            }))
            .sort((a, b) => b.points - a.points)
          setDrivers(sorted)
          setSeason(ds.season || year)
        }

        // ── Constructors ─────────────────────────────────────────
        if (cs?.constructors && cs.rounds?.length) {
          const lastIdx = cs.rounds.length - 1
          const sorted = cs.constructors
            .map(c => ({
              constructorId: c.constructorId,
              name:          c.name,
              points:        Math.round((c.cumulative?.[lastIdx] ?? 0) * 10) / 10,
            }))
            .sort((a, b) => b.points - a.points)
          setCtors(sorted)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function toggle() {
    setOpen(v => {
      const next = !v
      try { localStorage.setItem('standings-sidebar', next ? 'open' : 'closed') } catch {}
      return next
    })
  }

  // Hidden on dashboard — standings are already shown there
  if (location.pathname === '/') return null

  const list = tab === 'drivers' ? drivers : ctors

  return (
    <>
      {/* ── Sidebar panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sidebar"
            initial={{ x: -SIDEBAR_W - 8 }}
            animate={{ x: 0 }}
            exit={{ x: -SIDEBAR_W - 8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            style={{
              position: 'fixed',
              left: 0,
              top: 'var(--navbar-height)',
              bottom: 0,
              width: SIDEBAR_W,
              background: 'rgba(12,12,12,0.97)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              zIndex: 49,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '0.65rem 0.75rem 0.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              flexShrink: 0,
            }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)',
                marginBottom: '0.45rem',
              }}>
                Championship {season}
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[['drivers','WDC'],['constructors','WCC']].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    style={{
                      flex: 1, padding: '0.28rem 0',
                      borderRadius: 6,
                      border: `1px solid ${tab === key ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      background: tab === key ? 'rgba(225,6,0,0.12)' : 'transparent',
                      color: tab === key ? '#e10600' : 'rgba(255,255,255,0.38)',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '0.72rem', fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* List — scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {loading ? (
                <div style={{ padding: '1rem 0.75rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>
                  Loading...
                </div>
              ) : list.length === 0 ? (
                <div style={{ padding: '1rem 0.75rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>
                  No data
                </div>
              ) : (
                list.map((entry, i) =>
                  tab === 'drivers'
                    ? <DriverRow key={entry.driverId}      entry={entry} i={i} />
                    : <CtorRow   key={entry.constructorId} entry={entry} i={i} />
                )
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '0.5rem 0.75rem',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              flexShrink: 0,
            }}>
              <Link
                to={tab === 'drivers' ? '/standings' : '/constructor-standings'}
                style={{
                  display: 'block', textAlign: 'center',
                  fontSize: '0.65rem', fontWeight: 700,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: 'rgba(225,6,0,0.7)', textDecoration: 'none',
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                Full standings →
              </Link>
            </div>

            {/* Collapse button — right edge, outside overflow */}
            <button
              onClick={toggle}
              title="Hide standings"
              style={{
                position: 'fixed',
                left: SIDEBAR_W, top: '50%', transform: 'translateY(-50%)',
                width: 24, height: 64,
                background: 'rgba(225,6,0,0.9)',
                border: '1px solid rgba(225,6,0,0.7)',
                borderLeft: 'none',
                borderRadius: '0 10px 10px 0',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', fontWeight: 900,
                transition: 'background 0.15s, width 0.15s',
                zIndex: 50,
                boxShadow: '3px 0 12px rgba(225,6,0,0.35)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e10600'; e.currentTarget.style.width = '28px' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(225,6,0,0.9)'; e.currentTarget.style.width = '24px' }}
            >
              ‹
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab when hidden ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="tab"
            initial={{ x: -60 }}
            animate={{ x: 0 }}
            exit={{ x: -60 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            onClick={toggle}
            title="Show standings"
            style={{
              position: 'fixed',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 49,
              background: 'rgba(12,12,12,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderLeft: 'none',
              borderRadius: '0 10px 10px 0',
              padding: '0.9rem 0.38rem',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '0.45rem',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,28,28,0.99)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(12,12,12,0.97)'}
          >
            <span style={{ fontSize: '0.72rem' }}>🏆</span>
            {['S','T','A','N','D','I','N','G','S'].map((c, i) => (
              <span key={i} style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.05em',
                color: 'rgba(255,255,255,0.35)',
                lineHeight: 1,
              }}>
                {c}
              </span>
            ))}
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.22)', marginTop: '0.1rem' }}>›</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
