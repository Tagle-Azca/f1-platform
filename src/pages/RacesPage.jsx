import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import { racesApi } from '../services/api'

const SEASONS = ['2024', '2023', '2022', '2021', '2020']

export default function RacesPage() {
  const [races,   setRaces]   = useState([])
  const [season,  setSeason]  = useState('2024')
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    racesApi.getBySeason(season)
      .then(setRaces)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [season])

  return (
    <PageWrapper>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <h1 className="page__title" style={{ marginBottom: 0 }}>Races</h1>
        <select
          className="input"
          style={{ width: 120 }}
          value={season}
          onChange={(e) => setSeason(e.target.value)}
        >
          {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <p className="page__subtitle">Season calendar stored in MongoDB</p>

      {loading && <p>Loading races...</p>}
      {error   && <p style={{ color: 'var(--f1-red)' }}>Error: {error}</p>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {races.length === 0 && <p>No races found for {season}.</p>}
          {races.map((race, i) => (
            <motion.div
              key={race._id || `${race.season}-${race.round}`}
              className="card card--mongo"
              style={{ display: 'grid', gridTemplateColumns: '3rem 1fr auto', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-muted)' }}>
                {race.round}
              </span>
              <div>
                <h3 style={{ marginBottom: '0.15rem' }}>{race.raceName}</h3>
                <p style={{ fontSize: '0.8rem' }}>
                  {race.Circuit?.circuitName || race.circuit} — {race.date}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="db-badge db-badge--mongo">MongoDB</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
