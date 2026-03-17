import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import PageHeader from '../components/layout/PageHeader'
import { driversApi } from '../services/api'
import { CTOR_COLORS } from '../utils/teamColors'

const CY = new Date().getFullYear()
const YEAR_TABS = [CY, CY - 1, CY - 2]
const OLDER_YEARS = Array.from({ length: CY - 3 - 1949 }, (_, i) => String(CY - 3 - i))

function teamColor(constructorId) {
  return CTOR_COLORS[constructorId] || '#888'
}

function DriverCard({ driver, index }) {
  const color = teamColor(driver.constructorId)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.025, duration: 0.25 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
    >
      <Link to={`/drivers/${driver.driverId}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{
          position: 'relative', overflow: 'hidden',
          borderRadius: 12,
          height: 280,
          background: 'var(--surface-2)',
          border: '1px solid var(--border-color)',
          borderTop: `3px solid ${color}`,
          cursor: 'pointer',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = `${color}66`
            e.currentTarget.style.boxShadow = `0 12px 36px rgba(0,0,0,0.4), 0 0 0 1px ${color}33`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {/* Photo */}
          {driver.photoUrl ? (
            <img
              src={driver.photoUrl}
              alt={`${driver.givenName} ${driver.familyName}`}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'top center',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--surface-2)',
            }}>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '4rem', fontWeight: 900,
                color: `${color}55`, letterSpacing: '0.05em',
              }}>
                {driver.code || driver.familyName?.slice(0, 3).toUpperCase()}
              </span>
            </div>
          )}

          {/* Gradient overlay — stronger at bottom */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.6) 40%, rgba(8,8,8,0.1) 70%, transparent 100%)',
          }} />

          {/* Number — top right */}
          <span style={{
            position: 'absolute', top: 8, right: 10,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '4rem', fontWeight: 900, lineHeight: 1,
            color: `${color}22`, userSelect: 'none',
          }}>
            {driver.permanentNumber || ''}
          </span>

          {/* Bottom info */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '0.9rem 0.85rem 0.85rem',
          }}>
            {/* Team badge */}
            {driver.constructorName && (
              <div style={{
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: color,
                marginBottom: '0.3rem', opacity: 0.85,
              }}>
                {driver.constructorName}
              </div>
            )}

            {/* Name */}
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.02em', lineHeight: 1.05,
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                {driver.givenName}
              </div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {driver.familyName}
              </div>
            </div>

            {/* Nationality + code */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {driver.nationality}
              </span>
              {driver.code && (
                <>
                  <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--border-strong)', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.7rem', fontWeight: 700, color: color, letterSpacing: '0.08em' }}>
                    {driver.code}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function DriversPage() {
  const [year,    setYear]    = useState(String(CY))
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    setLoading(true)
    setSearch('')
    driversApi.getFeatured(null, year)
      .then(setDrivers)
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false))
  }, [year])

  const filtered = useMemo(() =>
    drivers.filter(d =>
      `${d.givenName} ${d.familyName} ${d.nationality} ${d.code || ''}`
        .toLowerCase().includes(search.toLowerCase())
    ), [drivers, search])

  return (
    <PageWrapper>
      {/* Header */}
      <PageHeader
        title="Drivers"
        subtitle={loading ? 'Loading...' : `${filtered.length} drivers · ${year} season · MongoDB`}
        badge="mongo"
        actions={
          <input
            className="input"
            style={{ maxWidth: 240 }}
            placeholder="Search driver..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        }
      />

      {/* Year tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {YEAR_TABS.map(y => (
          <button
            key={y}
            onClick={() => setYear(String(y))}
            style={{
              padding: '0.35rem 1rem', borderRadius: 7, cursor: 'pointer',
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.9rem', fontWeight: 700,
              letterSpacing: '0.06em',
              background: year === String(y) ? 'rgba(34,197,94,0.15)' : 'var(--surface-2)',
              color: year === String(y) ? '#22c55e' : 'var(--text-secondary)',
              border: `1px solid ${year === String(y) ? 'rgba(34,197,94,0.35)' : 'var(--border-subtle)'}`,
              transition: 'all 0.15s',
            }}
          >
            {y}
          </button>
        ))}

        {/* Older years dropdown */}
        <select
          className="input"
          style={{ width: 110, fontSize: '0.82rem' }}
          value={YEAR_TABS.includes(Number(year)) ? '' : year}
          onChange={e => e.target.value && setYear(e.target.value)}
        >
          <option value="">Older...</option>
          {OLDER_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '0.75rem' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ height: 280, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border-color)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>
          {search ? `No drivers matching "${search}"` : `No data for ${year}`}
        </p>
      ) : (
        <motion.div
          layout
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '0.75rem' }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((d, i) => (
              <DriverCard key={d.driverId} driver={d} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </PageWrapper>
  )
}
