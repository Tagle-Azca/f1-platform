import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { racesApi } from '../../services/api'
import { statusColor, isFinished } from '../../utils/raceUtils'
import Podium from './Podium'

export default function RaceDetail({ season, round }) {
  const [race,    setRace]  = useState(null)
  const [loading, setLoad]  = useState(true)

  useEffect(() => {
    setLoad(true)
    racesApi.getByRound(season, round)
      .then(setRace)
      .catch(() => setRace(null))
      .finally(() => setLoad(false))
  }, [season, round])

  if (loading) return <p style={{ padding: '2rem', textAlign: 'center' }}>Loading race...</p>
  if (!race)   return <p style={{ color: 'var(--f1-red)', padding: '1rem' }}>Race not found</p>

  const incidents = (race.Results || []).filter(r => !isFinished(r.status))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="db-badge db-badge--mongo">MongoDB</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Season {season} · Round {round}</span>
          {race.date && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{race.date}</span>}
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {race.raceName}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          {race.Circuit?.circuitName} — {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country}
        </p>
      </div>

      {race.Results?.length > 0 && <Podium results={race.Results} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="card" style={{ padding: '0.75rem 1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>CIRCUIT</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{race.Circuit?.circuitName}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{race.Circuit?.Location?.country}</div>
        </div>
        <div className="card" style={{ padding: '0.75rem 1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>WINNER</div>
          {race.Results?.[0] && (
            <>
              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                {race.Results[0].Driver?.givenName} {race.Results[0].Driver?.familyName}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {race.Results[0].Constructor?.name} · {race.Results[0].laps} laps
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          CLASSIFICATION
        </div>
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {(race.Results || []).filter(isFinished).map(r => (
            <div key={r.Driver?.driverId} style={{
              display: 'grid', gridTemplateColumns: '2rem 1fr auto auto',
              gap: '0.5rem', alignItems: 'center', padding: '0.3rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              fontSize: '0.82rem',
            }}>
              <span style={{ fontWeight: 700, color: r.position <= 3 ? '#ffd700' : 'var(--text-muted)' }}>
                {r.position}
              </span>
              <span>{r.Driver?.familyName}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.Constructor?.name}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--f1-red)', fontWeight: 600 }}>+{r.points}pts</span>
            </div>
          ))}
        </div>
      </div>

      {incidents.length > 0 && (
        <div className="card" style={{ padding: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            INCIDENTS / RETIREMENTS
          </div>
          {incidents.map(r => (
            <div key={r.Driver?.driverId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0', fontSize: '0.8rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(r.status), flexShrink: 0 }} />
              <span style={{ fontWeight: 600 }}>{r.Driver?.familyName}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{r.status}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.72rem' }}>V{r.laps}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
