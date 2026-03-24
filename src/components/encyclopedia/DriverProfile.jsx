import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, CircleMarker, Tooltip as MapTooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { statsApi } from '../../services/api'
import { COVERAGE } from '../../constants'

// Era-level banners — shown when a driver's career falls in a known gap
const ERA_NOTICES = [
  {
    before: 1960,
    label:  'Pre-1960 era',
    text:   'Digital records for this era are extremely limited. Statistics like fastest laps, pole positions and qualifying data were not systematically tracked and are largely absent from historical databases.',
  },
  {
    before: 1980,
    label:  '1960s–70s era',
    text:   'Fastest lap and qualifying records for this period are incomplete in the Jolpica dataset. Wins, podiums and race counts are generally reliable but other stats may show 0 due to missing data, not absence of achievement.',
  },
  {
    before: 1994,
    label:  '1980s–early 90s era',
    text:   'Fastest lap data is not available for this era. Pole positions may be partially incomplete. Wins and points are reliable.',
  },
  {
    before: 2004,
    label:  'Pre-2004 era',
    text:   'Fastest lap tracking is not available before the 2004 season in this dataset. All other statistics are reliable.',
  },
]

const STAT_CONFIG = [
  { key: 'wins',          label: 'Wins',         accent: true },
  { key: 'podiums',       label: 'Podiums' },
  { key: 'races',         label: 'Races' },
  { key: 'points',        label: 'Points' },
  { key: 'polePositions', label: 'Poles' },
  { key: 'fastestLaps',   label: 'Fastest Laps' },
]

function NoPhoto({ driver }) {
  const initials = `${driver.givenName?.[0] || ''}${driver.familyName?.[0] || ''}`
  const hue = (driver.driverId?.charCodeAt(0) || 0) * 47 % 360
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{
        width: 120, height: 120, borderRadius: 16, flexShrink: 0,
        background: `hsl(${hue},40%,14%)`,
        border: `2px dashed hsl(${hue},40%,30%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.2rem', fontWeight: 900, color: `hsl(${hue},50%,55%)`,
      }}>
        {initials}
      </div>
      <span style={{
        fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.05em',
        background: 'var(--surface-2)', padding: '2px 8px',
        borderRadius: 99, border: '1px solid var(--border-strong)',
        whiteSpace: 'nowrap',
      }}>
        No photo on record
      </span>
    </div>
  )
}

function DataNotice({ lastSeason }) {
  const year = parseInt(lastSeason)
  const notice = ERA_NOTICES.find(n => year < n.before)
  if (!notice) return null
  return (
    <div style={{
      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
      padding: '0.75rem 1rem', marginBottom: '0.75rem',
      background: 'rgba(245,158,11,0.06)',
      border: '1px solid rgba(245,158,11,0.2)',
      borderLeft: '3px solid rgba(245,158,11,0.7)',
      borderRadius: 8,
    }}>
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,158,11,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(245,158,11,0.9)', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
          LIMITED HISTORICAL DATA · {notice.label.toUpperCase()}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          {notice.text}
        </p>
      </div>
    </div>
  )
}

export default function DriverProfile({ driverId }) {
  const [stats,    setStats]    = useState(null)
  const [circuits, setCircuits] = useState([])
  const [loading,  setLoad]     = useState(true)
  const [imgErr,   setImgErr]   = useState(false)

  useEffect(() => {
    setLoad(true)
    setImgErr(false)
    setCircuits([])
    Promise.all([
      statsApi.driverStats(driverId),
      statsApi.driverCircuits(driverId),
    ])
      .then(([s, c]) => { setStats(s); setCircuits(c) })
      .catch(() => setStats(null))
      .finally(() => setLoad(false))
  }, [driverId])

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
      Loading driver...
    </div>
  )
  if (!stats) return (
    <p style={{ color: 'var(--f1-red)', padding: '1rem' }}>Driver not found</p>
  )

  const { driver, wins, podiums, races, points, polePositions, fastestLaps, teams, firstSeason, lastSeason, totalSeasons } = stats
  const statValues = { wins, podiums, races, points, polePositions, fastestLaps }

  const lastYear  = parseInt(lastSeason)
  const birthYear = driver.dateOfBirth ? new Date(driver.dateOfBirth).getFullYear() : null
  const hasPhoto  = driver.photoUrl && !imgErr
  const currentYear = new Date().getFullYear()
  const lastLabel   = lastYear >= currentYear ? 'Present' : lastSeason
  const seasons     = firstSeason === lastSeason && lastLabel === lastSeason
    ? firstSeason
    : `${firstSeason} – ${lastLabel}`

  function displayValue(key, value) {
    const threshold = COVERAGE[key]
    if (threshold && lastYear < threshold && value === 0) return '—'
    if (key === 'points') return Number.isInteger(value) ? value : value.toFixed(2).replace(/\.?0+$/, '')
    return value
  }

  function isUnavailable(key, value) {
    const threshold = COVERAGE[key]
    return threshold && lastYear < threshold && value === 0
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

      {/* ── Data notice banner ───────────────────────────── */}
      <DataNotice lastSeason={lastSeason} />

      {/* ── Hero ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(225,6,0,0.08) 0%, transparent 100%)',
        border: '1px solid rgba(225,6,0,0.2)',
        borderRadius: 14, padding: '1.5rem', marginBottom: '0.75rem',
        display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
      }}>
        {driver.permanentNumber && (
          <div style={{
            position: 'absolute', right: '-0.5rem', top: '-1rem',
            fontSize: '9rem', fontWeight: 900, lineHeight: 1,
            color: 'rgba(225,6,0,0.07)', userSelect: 'none', pointerEvents: 'none',
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-4px',
          }}>
            {driver.permanentNumber}
          </div>
        )}

        <div style={{ flexShrink: 0, zIndex: 1 }}>
          {hasPhoto ? (
            <img
              src={driver.photoUrl}
              alt={`${driver.givenName} ${driver.familyName}`}
              onError={() => setImgErr(true)}
              style={{
                width: 120, height: 120, borderRadius: 16,
                objectFit: 'cover', objectPosition: 'top',
                border: '2px solid rgba(225,6,0,0.35)',
                boxShadow: '0 4px 24px rgba(225,6,0,0.2)',
              }}
            />
          ) : (
            <NoPhoto driver={driver} />
          )}
        </div>

        <div style={{ flex: 1, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
            
            {driver.code && (
              <span style={{
                fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em',
                color: 'rgba(225,6,0,0.9)', background: 'rgba(225,6,0,0.1)',
                border: '1px solid rgba(225,6,0,0.25)',
                padding: '2px 8px', borderRadius: 5,
              }}>
                {driver.code}
              </span>
            )}
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.05, margin: 0 }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{driver.givenName} </span>
            {driver.familyName}
          </h2>

          <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {driver.nationality && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {driver.nationality}
                {birthYear && <span style={{ color: 'var(--text-muted)' }}> · b. {birthYear}</span>}
              </span>
            )}
            {firstSeason && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {seasons}
                <span style={{ marginLeft: '0.4rem', color: 'rgba(225,6,0,0.7)', fontWeight: 600 }}>
                  · {totalSeasons} season{totalSeasons !== 1 ? 's' : ''}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats grid ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.4rem', marginBottom: '0.75rem' }}>
        {STAT_CONFIG.map(({ key, label, accent }) => {
          const val       = statValues[key]
          const display   = displayValue(key, val)
          const missing   = isUnavailable(key, val)
          const highlight = accent && val > 0

          return (
            <div key={key} className="card" style={{
              padding: '0.75rem 0.5rem', textAlign: 'center',
              border: highlight
                ? '1px solid rgba(245,158,11,0.3)'
                : missing ? '1px solid var(--border-subtle)' : undefined,
              background: highlight
                ? 'rgba(245,158,11,0.05)'
                : missing ? 'var(--surface-1)' : undefined,
              opacity: missing ? 0.6 : 1,
            }}>
              <div style={{
                fontSize: String(display).length >= 6 ? '1.2rem' : String(display).length >= 4 ? '1.4rem' : '1.7rem',
                fontWeight: 900, lineHeight: 1,
                color: highlight ? '#f59e0b' : missing ? 'var(--text-muted)' : 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {display}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {label}
              </div>
              {missing && (
                <div style={{ fontSize: '0.52rem', color: 'rgba(245,158,11,0.5)', marginTop: 3, letterSpacing: '0.04em' }}>
                  no record
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Teams ────────────────────────────────────────── */}
      {teams.length > 0 && (
        <div className="card" style={{ padding: '0.9rem 1rem', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
            TEAMS · {teams.length}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {teams.map(t => (
              <span key={t} style={{
                fontSize: '0.77rem', padding: '0.25rem 0.7rem', borderRadius: 99,
                background: 'var(--surface-3)', border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Circuits map ─────────────────────────────────── */}
      {circuits.length > 0 && (() => {
        const maxRaces = Math.max(...circuits.map(c => c.races))
        const validCircuits = circuits.filter(c => c.lat && c.long)
        return (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
                CIRCUITS RACED · {validCircuits.length}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {circuits.reduce((s, c) => s + c.races, 0)} total race entries
              </span>
            </div>

            <div style={{ height: 380, position: 'relative' }}>
              <MapContainer
                center={[20, 10]}
                zoom={2}
                style={{ height: '100%', width: '100%', background: '#0d0d0d' }}
                attributionControl={false}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {validCircuits.map(c => {
                  const lat  = parseFloat(c.lat)
                  const lng  = parseFloat(c.long)
                  const r    = 3 + Math.round((c.races / maxRaces) * 5)
                  const pts  = Math.round(c.points * 10) / 10
                  return (
                    <CircleMarker
                      key={c._id}
                      center={[lat, lng]}
                      radius={r}
                      pathOptions={{
                        color:       c.wins > 0 ? '#f59e0b' : '#e8002d',
                        fillColor:   c.wins > 0 ? '#f59e0b' : '#e8002d',
                        fillOpacity: 0.75,
                        weight:      1.5,
                      }}
                    >
                      <MapTooltip direction="top" offset={[0, -r]} opacity={1}>
                        <div style={{ fontFamily: 'sans-serif', minWidth: 160 }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>{c.circuitName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: 6 }}>
                            {c.locality}, {c.country}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '0.78rem' }}>
                            <span style={{ color: '#888' }}>Races</span>
                            <span style={{ fontWeight: 700 }}>{c.races}</span>
                            <span style={{ color: '#888' }}>Points</span>
                            <span style={{ fontWeight: 700 }}>{pts}</span>
                            <span style={{ color: '#888' }}>Wins</span>
                            <span style={{ fontWeight: 700, color: c.wins > 0 ? '#f59e0b' : '#fff' }}>{c.wins}</span>
                            <span style={{ color: '#888' }}>Podiums</span>
                            <span style={{ fontWeight: 700 }}>{c.podiums}</span>
                          </div>
                        </div>
                      </MapTooltip>
                    </CircleMarker>
                  )
                })}
              </MapContainer>
            </div>

            {/* Legend */}
            <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1.25rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e8002d', display: 'inline-block' }} />
                Raced (no win)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                Win at this circuit
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                Dot size = number of races
              </span>
            </div>
          </div>
        )
      })()}
    </motion.div>
  )
}
