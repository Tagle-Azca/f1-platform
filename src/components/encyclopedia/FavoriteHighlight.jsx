import { useState, useEffect } from 'react'
import { usePreferences } from '../../contexts/PreferencesContext'
import { driversApi, statsApi } from '../../services/api'
import { F1_TEAMS, getTeam } from '../../data/f1Teams'
import ConstructorLogo from '../ui/ConstructorLogo'

const CY = String(new Date().getFullYear())

function PinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" style={{ width: 10, height: 10 }}>
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
    </svg>
  )
}

function PinnedDriverCard({ driver, teamColor, onSelect }) {
  const [imgError, setImgError] = useState(false)
  const name = `${driver.givenName} ${driver.familyName}`

  return (
    <button
      onClick={() => onSelect({ type: 'driver', id: driver.driverId, label: name })}
      style={{
        background: `${teamColor}0D`,
        border: `1.5px solid ${teamColor}55`,
        borderRadius: 12, padding: '0.75rem',
        cursor: 'pointer', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '0.5rem',
        width: 110, flexShrink: 0, textAlign: 'center',
        transition: 'all 0.2s',
        boxShadow: `0 0 16px ${teamColor}1A`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = teamColor
        e.currentTarget.style.background  = `${teamColor}22`
        e.currentTarget.style.transform   = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `${teamColor}55`
        e.currentTarget.style.background  = `${teamColor}0D`
        e.currentTarget.style.transform   = 'none'
      }}
    >
      {driver.photoUrl && !imgError ? (
        <img
          src={driver.photoUrl} alt={name} onError={() => setImgError(true)}
          style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: `2px solid ${teamColor}` }}
        />
      ) : (
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: `${teamColor}22`, border: `2px solid ${teamColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', fontWeight: 900, color: teamColor,
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>
          {driver.givenName?.[0]}{driver.familyName?.[0]}
        </div>
      )}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{driver.givenName}</div>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{driver.familyName}</div>
        {driver.permanentNumber && (
          <div style={{ fontSize: '0.65rem', color: teamColor, fontWeight: 700, marginTop: 2 }}>#{driver.permanentNumber}</div>
        )}
      </div>
    </button>
  )
}

function PinnedCtorCard({ ctor, teamColor, onSelect }) {
  return (
    <button
      onClick={() => onSelect({ type: 'constructor', id: ctor.constructorId, label: ctor.name })}
      style={{
        background: `${teamColor}0D`,
        border: `1.5px solid ${teamColor}55`,
        borderRadius: 12, padding: '0.75rem',
        cursor: 'pointer', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '0.5rem',
        width: 110, flexShrink: 0, textAlign: 'center',
        transition: 'all 0.2s',
        boxShadow: `0 0 16px ${teamColor}1A`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = teamColor
        e.currentTarget.style.background  = `${teamColor}22`
        e.currentTarget.style.transform   = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `${teamColor}55`
        e.currentTarget.style.background  = `${teamColor}0D`
        e.currentTarget.style.transform   = 'none'
      }}
    >
      <ConstructorLogo constructorId={ctor.constructorId} name={ctor.name} color={teamColor} size={72} radius={10} />
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{ctor.name}</div>
      {ctor.finalPoints != null && (
        <div style={{ fontSize: '0.65rem', color: teamColor, fontWeight: 700 }}>{ctor.finalPoints} pts</div>
      )}
    </button>
  )
}

export default function FavoriteHighlight({ onSelect }) {
  const { prefs } = usePreferences()
  const { favoriteDriver, favoriteTeam } = prefs

  const [driverData, setDriverData] = useState(null)
  const [ctorData,   setCtorData]   = useState(null)

  useEffect(() => {
    if (!favoriteDriver) { setDriverData(null); return }
    const lower = favoriteDriver.toLowerCase()
    driversApi.getFeatured(undefined, CY)
      .then(list => setDriverData(list.find(d => `${d.givenName} ${d.familyName}`.toLowerCase() === lower) ?? null))
      .catch(() => setDriverData(null))
  }, [favoriteDriver])

  useEffect(() => {
    if (!favoriteTeam) { setCtorData(null); return }
    statsApi.getConstructorStandings(CY)
      .then(data => setCtorData((data.constructors || []).find(c => c.constructorId === favoriteTeam) ?? null))
      .catch(() => setCtorData(null))
  }, [favoriteTeam])

  if (!driverData && !ctorData) return null

  const driverTeam  = favoriteDriver ? F1_TEAMS.find(t => t.drivers.includes(favoriteDriver)) : null
  const driverColor = driverTeam?.color ?? 'var(--accent-color)'
  const ctorTeam    = favoriteTeam ? getTeam(favoriteTeam) : null
  const ctorColor   = ctorTeam?.color ?? 'var(--accent-color)'

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
        <PinIcon />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Pinned · Your Favorites
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {driverData  && <PinnedDriverCard driver={driverData}  teamColor={driverColor} onSelect={onSelect} />}
        {ctorData    && <PinnedCtorCard   ctor={ctorData}      teamColor={ctorColor}   onSelect={onSelect} />}
      </div>
    </div>
  )
}
