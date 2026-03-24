import { useEffect, useState, lazy, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import EmptyState from '../components/ui/EmptyState'
import Panel from '../components/ui/Panel'
import { driversApi, statsApi } from '../services/api'
import { CTOR_COLORS } from '../utils/teamColors'
import { fmtDate } from '../utils/date'

const DriverNetworkSection = lazy(() => import('../components/graph/DriverNetworkSection'))

function teamColor(constructorId) {
  return CTOR_COLORS[constructorId] || '#888'
}

function colorLuminance(hex = '') {
  const c = hex.replace('#', '')
  if (c.length < 6) return 128
  const r = parseInt(c.slice(0,2),16)
  const g = parseInt(c.slice(2,4),16)
  const b = parseInt(c.slice(4,6),16)
  return (r*299 + g*587 + b*114) / 1000
}
// Too light to read against dark bg
function isLight(hex) { return colorLuminance(hex) > 200 }
// Too dark to see against dark bg — boost to a visible fallback
function isInvisible(hex) { return colorLuminance(hex) < 40 }

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border-color)',
      borderRadius: 10, padding: '1rem 1.25rem',
      textAlign: 'center', flex: '1 1 100px',
    }}>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: '2rem', fontWeight: 900,
        color: color || '#fff', lineHeight: 1,
      }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.3rem', fontWeight: 600 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  )
}

export default function DriverProfilePage() {
  const { id } = useParams()
  const [profile, setProfile]   = useState(null)
  const [seasons, setSeasons]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      statsApi.driverStats(id),
      statsApi.driverSeasons(id),
    ])
      .then(([prof, seas]) => { setProfile(prof); setSeasons(seas) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <PageWrapper>
      <EmptyState type="loading" message="Loading driver..." height={120} page />
    </PageWrapper>
  )

  if (error || !profile) return (
    <PageWrapper>
      <Link to="/drivers" className="btn btn--ghost" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>← Back</Link>
      <p style={{ color: 'var(--f1-red)' }}>Driver not found.</p>
    </PageWrapper>
  )

  const { driver, wins, podiums, races, points, polePositions, fastestLaps, teams, firstSeason, lastSeason, totalSeasons } = profile
  const currentTeamSeason = seasons[0]
  const rawAccent    = currentTeamSeason ? teamColor(currentTeamSeason.constructorId) : '#22c55e'
  // Replace nearly-invisible colors with a visible fallback
  const accentColor  = isInvisible(rawAccent) ? '#888888' : rawAccent
  const accentRgb    = hexToRgb(accentColor)
  const lightAccent  = isLight(accentColor)

  return (
    <PageWrapper>
      <Link to="/drivers" style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        fontSize: '0.78rem', color: 'var(--text-secondary)',
        textDecoration: 'none', marginBottom: '1.5rem',
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        ← All Drivers
      </Link>

      {/* ── Hero ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'relative', overflow: 'hidden',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-color)',
          borderTop: `3px solid ${accentColor}`,
          borderRadius: 14,
          marginBottom: '1rem',
          minHeight: 200,
        }}
      >
        {/* Glow background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 30% 50%, rgba(${accentRgb},0.08) 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', display: 'flex', gap: '2rem', padding: '1.75rem 2rem', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Photo */}
          {driver.photoUrl ? (
            <div style={{
              width: 130, height: 160, flexShrink: 0,
              borderRadius: 10, overflow: 'hidden',
              border: `1px solid rgba(${accentRgb},0.25)`,
              boxShadow: `0 8px 32px rgba(${accentRgb},0.15)`,
            }}>
              <img
                src={driver.photoUrl}
                alt={`${driver.givenName} ${driver.familyName}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
              />
            </div>
          ) : (
            <div style={{
              width: 130, height: 160, flexShrink: 0,
              borderRadius: 10,
              border: `1px solid rgba(${accentRgb},0.35)`,
              background: lightAccent
                ? `linear-gradient(160deg, rgba(30,30,30,0.95), rgba(20,20,20,0.98))`
                : `linear-gradient(160deg, rgba(${accentRgb},0.12), rgba(${accentRgb},0.04))`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            }}>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '2.6rem', fontWeight: 900,
                color: lightAccent ? '#fff' : accentColor,
                textShadow: lightAccent ? `0 0 20px rgba(${accentRgb},0.6)` : 'none',
                letterSpacing: '0.05em',
              }}>
                {driver.code || driver.familyName?.slice(0,3).toUpperCase()}
              </span>
              <div style={{ width: 32, height: 2, borderRadius: 1, background: lightAccent ? `rgba(${accentRgb},0.5)` : accentColor, opacity: 0.6 }} />
            </div>
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              {driver.permanentNumber && (
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '1rem', fontWeight: 900,
                  letterSpacing: '0.05em',
                  color: lightAccent ? '#fff' : accentColor,
                  background: lightAccent ? `rgba(${accentRgb},0.15)` : 'transparent',
                  padding: lightAccent ? '0.1rem 0.4rem' : '0',
                  borderRadius: lightAccent ? 4 : 0,
                  border: lightAccent ? `1px solid rgba(${accentRgb},0.4)` : 'none',
                }}>
                  #{driver.permanentNumber}
                </span>
              )}
              {currentTeamSeason && (
                <span style={{
                  padding: '0.2rem 0.65rem', borderRadius: 5,
                  border: `1px solid ${lightAccent ? `rgba(${accentRgb},0.5)` : `rgba(${accentRgb},0.3)`}`,
                  background: lightAccent ? `rgba(${accentRgb},0.12)` : `rgba(${accentRgb},0.1)`,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '0.72rem', fontWeight: 700,
                  color: lightAccent ? '#fff' : accentColor,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {currentTeamSeason.team}
                </span>
              )}
            </div>

            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.03em',
              color: '#fff', lineHeight: 0.95, marginBottom: '0.6rem',
            }}>
              {driver.givenName}<br />{driver.familyName}
            </h1>

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nationality</span>
                <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600 }}>{driver.nationality}</div>
              </div>
              {driver.dateOfBirth && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Born</span>
                  <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600 }}>
                    {fmtDate(driver.dateOfBirth)}
                  </div>
                </div>
              )}
              {firstSeason && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Career</span>
                  <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600 }}>
                    {firstSeason}{firstSeason !== lastSeason ? ` – ${lastSeason}` : ''}
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> ({totalSeasons} seasons)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Number watermark */}
          <div style={{
            position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 'clamp(5rem, 10vw, 9rem)', fontWeight: 900,
            color: `rgba(${accentRgb},0.06)`, lineHeight: 1,
            userSelect: 'none', pointerEvents: 'none',
          }}>
            {driver.permanentNumber || driver.code}
          </div>
        </div>
      </motion.div>

      {/* ── Career Stats ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}
      >
        <StatCard label="Wins"         value={wins}          color={wins > 0 ? accentColor : undefined} />
        <StatCard label="Podiums"      value={podiums} />
        <StatCard label="Poles"        value={polePositions} />
        <StatCard label="Fastest Laps" value={fastestLaps} />
        <StatCard label="Races"        value={races} />
        <StatCard label="Points"       value={points} />
      </motion.div>

      {/* ── Season by Season ─────────────────────────────── */}
      {seasons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-color)',
            borderRadius: 12, overflow: 'hidden',
          }}
        >
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Season by Season
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Season','Team','Races','Wins','Podiums','Poles','Points'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 1rem', textAlign: h === 'Season' || h === 'Team' ? 'left' : 'center', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seasons.map((s, i) => {
                  const color = teamColor(s.constructorId)
                  return (
                    <tr
                      key={s.season}
                      style={{
                        borderBottom: i < seasons.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        background: i === 0 ? `rgba(${hexToRgb(color)},0.04)` : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = i === 0 ? `rgba(${hexToRgb(color)},0.04)` : 'transparent'}
                    >
                      <td style={{ padding: '0.6rem 1rem' }}>
                        <Link to={`/standings?season=${s.season}`} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: i === 0 ? color : '#fff', textDecoration: 'none' }}>
                          {s.season}
                        </Link>
                      </td>
                      <td style={{ padding: '0.6rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
                          <span style={{ color: '#fff', fontSize: '0.83rem' }}>{s.team}</span>
                        </div>
                      </td>
                      {[s.races, s.wins, s.podiums, s.poles, s.points].map((val, vi) => (
                        <td key={vi} style={{ padding: '0.6rem 1rem', textAlign: 'center', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: vi === 1 && val > 0 ? 900 : 600, color: vi === 1 && val > 0 ? color : vi === 4 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {val}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── Career Network (Dgraph) ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.4 }}
        style={{ marginTop: '0' }}
      >
        <Suspense fallback={
          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--border-color)',
            borderTop: '2px solid #ef4444', borderRadius: 12, height: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Loading network...</span>
          </div>
        }>
          <DriverNetworkSection
            driverId={id}
            driverName={`${driver.givenName} ${driver.familyName}`}
          />
        </Suspense>
      </motion.div>

      {/* ── Wikipedia link ───────────────────────────────── */}
      {driver.url && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <a href={driver.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            View on Wikipedia →
          </a>
        </div>
      )}
    </PageWrapper>
  )
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '255,255,255'
}
