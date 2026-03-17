import { useState, useEffect, useRef } from 'react'
import { driversApi } from '../../services/api'

function flag(_nat) { return '' }

// Colored placeholder when no photo available
function Avatar({ driver, size = 80 }) {
  const initials = `${driver.givenName?.[0] || ''}${driver.familyName?.[0] || ''}`
  // Generate a consistent color from name
  const hue = (driver.driverId?.charCodeAt(0) || 0) * 47 % 360
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue}, 60%, 25%)`,
      border: `2px solid hsl(${hue}, 60%, 40%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 800, color: `hsl(${hue}, 60%, 80%)`,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function DriverCard({ driver, onClick }) {
  const [imgError, setImgError] = useState(false)

  return (
    <button
      onClick={() => onClick(driver)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '0.75rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        width: 110,
        flexShrink: 0,
        transition: 'all 0.2s',
        textAlign: 'center',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--mongo-color)'
        e.currentTarget.style.background  = 'rgba(34,197,94,0.07)'
        e.currentTarget.style.transform   = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background  = 'var(--bg-surface)'
        e.currentTarget.style.transform   = 'none'
      }}
    >
      {driver.photoUrl && !imgError ? (
        <img
          src={driver.photoUrl}
          alt={`${driver.givenName} ${driver.familyName}`}
          onError={() => setImgError(true)}
          style={{
            width: 72, height: 72, borderRadius: '50%',
            objectFit: 'cover', objectPosition: 'top',
            border: '2px solid var(--border)',
          }}
        />
      ) : (
        <Avatar driver={driver} size={72} />
      )}

      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {driver.givenName}
        </div>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {driver.familyName}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {flag(driver.nationality)}
          {driver.permanentNumber && (
            <span style={{ marginLeft: 4, color: 'var(--mongo-color)', fontWeight: 700 }}>
              #{driver.permanentNumber}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export default function DriverBanner({ onDriverSelect, season }) {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef()

  useEffect(() => {
    setLoading(true)
    driversApi.getFeatured(undefined, season)
      .then(setDrivers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [season])

  if (loading) return (
    <div style={{ padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      Loading drivers...
    </div>
  )

  if (drivers.length === 0) return null

  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' })
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Drivers · {season}
          </h3>
          <p style={{ margin: 0, fontSize: '0.90rem', color: 'var(--text-muted)' }}>
            Click to view full profile
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['<', '>'].map((arrow, i) => (
            <button
              key={arrow}
              onClick={() => scroll(i === 0 ? -1 : 1)}
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem',
              }}
            >
              {arrow}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          scrollbarWidth: 'none',
        }}
      >
        {drivers.map((d) => (
          <DriverCard
            key={d.driverId}
            driver={d}
            onClick={(driver) => onDriverSelect({ type: 'driver', id: driver.driverId, label: `${driver.givenName} ${driver.familyName}` })}
          />
        ))}
      </div>
    </div>
  )
}
