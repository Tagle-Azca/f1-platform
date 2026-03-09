import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import { driversApi } from '../services/api'

function DriverCard({ driver, index }) {
  return (
    <motion.div
      className="card card--mongo"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ marginBottom: '0.2rem' }}>
            {driver.givenName} {driver.familyName}
          </h3>
          <p style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            {driver.nationality}
          </p>
        </div>
        <span style={{
          fontSize: '1.6rem',
          fontWeight: '900',
          color: 'rgba(255,255,255,0.08)',
          lineHeight: 1,
        }}>
          #{driver.permanentNumber || '—'}
        </span>
      </div>

      {driver.dateOfBirth && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          DOB: {new Date(driver.dateOfBirth).toLocaleDateString()}
        </p>
      )}

      <div className="db-footer">
        <span className="db-badge db-badge--mongo">MongoDB</span>
        {driver.driverId && (
          <span style={{ marginLeft: 'auto' }}>{driver.driverId}</span>
        )}
      </div>
    </motion.div>
  )
}

export default function DriversPage() {
  const [drivers, setDrivers]   = useState([])
  const [search,  setSearch]    = useState('')
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState(null)

  useEffect(() => {
    driversApi.getAll()
      .then(setDrivers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = drivers.filter((d) =>
    `${d.givenName} ${d.familyName} ${d.nationality}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <PageWrapper>
      <h1 className="page__title">Drivers</h1>
      <p className="page__subtitle">All F1 drivers stored in MongoDB</p>

      <input
        className="input"
        style={{ maxWidth: 360, marginBottom: '1.5rem' }}
        placeholder="Search by name or nationality..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Loading drivers...</p>}
      {error   && <p style={{ color: 'var(--f1-red)' }}>Error: {error}</p>}

      {!loading && !error && (
        <div className="grid-3">
          {filtered.length > 0
            ? filtered.map((d, i) => <DriverCard key={d._id || d.driverId} driver={d} index={i} />)
            : <p>No drivers found.</p>
          }
        </div>
      )}
    </PageWrapper>
  )
}
