import { useState, useEffect } from 'react'
import { safeHttpsUrl } from '../../utils/safeUrl'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { statsApi, dashboardApi } from '../../services/api'
import { ctorColor, tint, lift } from '../../utils/teamColors'
import { useFocusTrap } from '../../hooks/useFocusTrap'

const STAT_TILES = [
  { key: 'wins',          label: 'wins' },
  { key: 'podiums',       label: 'podiums' },
  { key: 'races',         label: 'races' },
  { key: 'points',        label: 'points' },
  { key: 'polePositions', label: 'poles' },
  { key: 'fastestLaps',   label: 'fastest laps' },
]

function useDriverData(driverId) {
  const [stats, setStats] = useState(null)
  const [dash,  setDash]  = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!driverId) return
    // Fetch effect: reset previous driver's data before loading the next one.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(null)
    setError(false)
    Promise.all([statsApi.driverStats(driverId), dashboardApi.get()])
      .then(([s, d]) => { setStats(s); setDash(d) })
      .catch(() => setError(true))
  }, [driverId])

  return { stats, dash, error }
}

export default function DriverDrawer({ driver, onClose }) {
  const navigate = useNavigate()
  const { stats, dash, error } = useDriverData(driver?.driverId)
  const containerRef = useFocusTrap(!!driver, onClose)

  const row = dash?.standings?.find(d => d.driverId === driver?.driverId)
  const color = row ? ctorColor(row.constructorId) : '#8fb4d8'
  const leaderPts = dash?.standings?.[0]?.points
  const lastResult = dash?.lastRace?.Results?.find(r => {
    const full = `${r.Driver?.givenName ?? ''} ${r.Driver?.familyName ?? ''}`.trim().toLowerCase()
    return full && driver?.name && full === driver.name.toLowerCase()
  })

  return (
    <AnimatePresence>
      {driver && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,11,13,.66)', backdropFilter: 'blur(2px)' }}
          />

          <motion.aside
            key="drawer"
            ref={containerRef}
            role="dialog" aria-modal="true" aria-label={`${driver.name} — driver profile`}
            tabIndex={-1}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
              width: 'min(450px, 100vw)',
              background: 'var(--pw-panel)',
              borderLeft: '1px solid var(--pw-edge)',
              overflowY: 'auto', padding: 24,
              boxShadow: '-18px 0 46px rgba(0,0,0,.42)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--pw-ink-3)' }}>Driver profile</span>
              <button
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                  display: 'grid', placeItems: 'center',
                  background: 'rgba(255,255,255,.05)', border: '1px solid var(--pw-edge-soft)',
                  color: 'var(--pw-ink-2)', cursor: 'pointer', fontSize: 13,
                }}
              >
                ✕
              </button>
            </div>

            {error ? (
              <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--pw-ink-3)', fontSize: 14 }}>Couldn't load this driver's profile.</div>
            ) : !stats ? (
              <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--pw-ink-3)', fontSize: 14 }}>Loading…</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 104, height: 128, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: tint(color, .12), border: '1px solid var(--pw-edge-soft)', display: 'grid', placeItems: 'center' }}>
                    {safeHttpsUrl(stats.driver.photoUrl) ? (
                      <img src={safeHttpsUrl(stats.driver.photoUrl)} referrerPolicy="no-referrer" alt={driver.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
                    ) : (
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: lift(color) }}>
                        {stats.driver.givenName?.[0]}{stats.driver.familyName?.[0]}
                      </span>
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, flexWrap: 'wrap' }}>
                      {stats.driver.code && (
                        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 9px', borderRadius: 99, background: tint(color, .16), color: lift(color) }}>
                          {stats.driver.code}
                        </span>
                      )}
                      {stats.driver.permanentNumber && <span style={{ fontSize: 12, color: 'var(--pw-ink-3)' }}>Car {stats.driver.permanentNumber}</span>}
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 29, lineHeight: 1.04, color: 'var(--pw-ink)' }}>
                      {driver.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--pw-ink-2)', marginTop: 8 }}>
                      {[stats.driver.nationality, stats.driver.dateOfBirth && new Date(stats.driver.dateOfBirth).getFullYear(), stats.firstSeason && stats.lastSeason && `${stats.firstSeason}–${stats.lastSeason}`].filter(Boolean).join(' · ')}
                    </div>
                    {row?.team && <div style={{ fontSize: 12.5, color: 'var(--pw-ink-3)', marginTop: 3 }}>{row.team}</div>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 9, marginTop: 22 }}>
                  {STAT_TILES.map(t => (
                    <div key={t.key} style={{ borderRadius: 12, padding: '13px 12px', background: t.key === 'wins' ? 'rgba(143,180,216,.1)' : 'rgba(255,255,255,.045)' }}>
                      <div style={{ fontFamily: 'var(--pw-mono)', fontSize: 21, lineHeight: 1, color: t.key === 'wins' ? 'var(--pw-steel)' : 'var(--pw-ink)' }}>{stats[t.key]}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--pw-ink-3)', marginTop: 7 }}>{t.label}</div>
                    </div>
                  ))}
                </div>

                {row && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pw-ink-2)', margin: '24px 0 10px' }}>Season {stats.lastSeason}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[
                        ['Championship', `P${row.position} · ${row.points} pts`],
                        ['Gap to leader', row.position === 1 ? 'Leader' : `−${leaderPts - row.points}`],
                        lastResult && ['Last race', `P${lastResult.position}${lastResult.status && !/^(Finished|\+\d+\s*Lap)/.test(lastResult.status) ? ` (${lastResult.status})` : ''}`],
                      ].filter(Boolean).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '10px 11px', borderRadius: 10, background: 'rgba(255,255,255,.035)' }}>
                          <span style={{ fontSize: 13.5, color: 'var(--pw-ink-2)' }}>{k}</span>
                          <span style={{ fontFamily: 'var(--pw-mono)', fontSize: 12.5, color: 'var(--pw-ink)' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 22 }}>
                  <button
                    onClick={() => navigate(`/drivers/${driver.driverId}`)}
                    style={{ flex: '1 1 auto', padding: '11px 16px', borderRadius: 11, background: 'var(--pw-steel)', color: '#12161b', border: 0, cursor: 'pointer', fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 600 }}
                  >
                    Full profile
                  </button>
                  <button
                    onClick={() => navigate('/teammates')}
                    style={{ flex: '1 1 auto', padding: '11px 16px', borderRadius: 11, background: 'rgba(255,255,255,.05)', color: 'var(--pw-ink)', border: '1px solid var(--pw-edge)', cursor: 'pointer', fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 500 }}
                  >
                    Compare
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
