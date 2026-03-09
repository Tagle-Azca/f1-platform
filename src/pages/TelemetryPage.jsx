import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import PageWrapper from '../components/layout/PageWrapper'
import { telemetryApi } from '../services/api'

const CHART_COLORS = { lap: '#e10600', s1: '#a855f7', s2: '#22c55e', s3: '#3b82f6' }

export default function TelemetryPage() {
  const [races,     setRaces]     = useState([])
  const [raceId,    setRaceId]    = useState('')
  const [driverId,  setDriverId]  = useState('')
  const [laps,      setLaps]      = useState([])
  const [pitStops,  setPitStops]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const [dbOffline, setDbOffline] = useState(false)

  useEffect(() => {
    telemetryApi.getAvailableRaces()
      .then((data) => {
        setRaces(data)
        if (data.length > 0) setRaceId(data[0].raceId)
      })
      .catch((e) => {
        if (e.message?.includes('not connected') || e.message?.includes('503')) setDbOffline(true)
      })
  }, [])

  function loadTelemetry() {
    if (!raceId || !driverId) return
    setLoading(true)
    setError(null)
    Promise.all([
      telemetryApi.getLapTimes(raceId, driverId),
      telemetryApi.getPitStops(raceId, driverId),
    ])
      .then(([lapData, pitData]) => {
        setLaps(lapData)
        setPitStops(pitData)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  return (
    <PageWrapper>
      <h1 className="page__title">Telemetry</h1>
      <p className="page__subtitle">Lap times and pit stops — Cassandra time-series data</p>

      {dbOffline && (
        <div className="card card--cassandra" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="db-badge db-badge--cassandra">Cassandra</span>
          <span style={{ fontSize: '0.88rem' }}>
            Database not running. Start Cassandra and run the seed script to load telemetry data.
          </span>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 220 }} value={raceId} onChange={(e) => setRaceId(e.target.value)}>
          <option value="">Select race…</option>
          {races.map((r) => (
            <option key={r.raceId} value={r.raceId}>{r.raceName}</option>
          ))}
        </select>
        <input
          className="input"
          style={{ width: 180 }}
          placeholder="Driver ID (e.g. hamilton)"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
        />
        <button className="btn btn--primary" onClick={loadTelemetry} disabled={!raceId || !driverId}>
          Load Telemetry
        </button>
      </div>

      {loading && <p>Loading telemetry...</p>}
      {error   && <p style={{ color: 'var(--f1-red)' }}>Error: {error}</p>}

      {laps.length > 0 && (
        <>
          {/* Lap times chart */}
          <div className="card card--cassandra" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Lap Times</h2>
              <span className="db-badge db-badge--cassandra">Cassandra</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={laps}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="lap_number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid var(--border)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="lap_time" stroke={CHART_COLORS.lap} dot={false} name="Lap Time (s)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sector times */}
          <div className="card card--cassandra" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Sector Times</h2>
              <span className="db-badge db-badge--cassandra">Cassandra</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={laps}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="lap_number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sector1" fill={CHART_COLORS.s1} name="S1" />
                <Bar dataKey="sector2" fill={CHART_COLORS.s2} name="S2" />
                <Bar dataKey="sector3" fill={CHART_COLORS.s3} name="S3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Pit stops */}
      {pitStops.length > 0 && (
        <div className="card card--cassandra">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Pit Stops</h2>
            <span className="db-badge db-badge--cassandra">Cassandra</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Stop', 'Lap', 'Duration (s)', 'Time'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pitStops.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.5rem' }}>{p.stop_number}</td>
                  <td style={{ padding: '0.5rem' }}>{p.lap}</td>
                  <td style={{ padding: '0.5rem' }}>{p.duration}</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{p.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  )
}
