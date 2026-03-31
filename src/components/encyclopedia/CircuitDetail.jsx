import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { statsApi } from '../../services/api'

export default function CircuitDetail({ circuitId }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    statsApi.circuitHistory(circuitId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [circuitId])

  if (loading) return <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading circuit...</p>
  if (!data)   return <p style={{ color: 'var(--f1-red)', padding: '1rem' }}>Circuit not found</p>

  const { circuit, races } = data

  const wins = {}
  for (const race of races) {
    const winner = race.Results?.[0]?.Driver
    if (!winner) continue
    const name = `${winner.givenName} ${winner.familyName}`
    wins[name] = (wins[name] || 0) + 1
  }
  const topWinners = Object.entries(wins).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(34,197,94,0.08), transparent)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderLeft: '3px solid #22c55e',
        borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Circuit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              {circuit.circuitName}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {circuit.Location?.locality}, {circuit.Location?.country}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>View race</span>
            <select
              className="input"
              style={{ width: 90 }}
              defaultValue=""
              onChange={e => {
                if (!e.target.value) return
                const race = races.find(r => r.season === e.target.value)
                if (race) navigate(`/races/${race.season}/${race.round}`)
              }}
            >
              <option value="">— year —</option>
              {races.map(r => (
                <option key={r.season} value={r.season}>{r.season}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div className="card" style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>{races.length}</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 3 }}>Grands Prix</div>
        </div>
        <div className="card" style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {races.length ? races[0].season : '—'}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 3 }}>Last Race</div>
        </div>
        <div className="card" style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {races.length ? races[races.length - 1].season : '—'}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 3 }}>First Race</div>
        </div>
      </div>

      {/* Top winners */}
      {topWinners.length > 0 && (
        <div className="card" style={{ padding: '0.9rem 1rem', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
            MOST WINS AT THIS CIRCUIT
          </div>
          {topWinners.map(([name, count], i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.3rem 0', borderBottom: i < topWinners.length - 1 ? '1px solid rgba(255,255,255,0.09)' : 'none' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: 16, textAlign: 'right' }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: i === 0 ? 700 : 400, color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{name}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: i === 0 ? '#f59e0b' : 'var(--text-muted)' }}>{count}×</span>
            </div>
          ))}
        </div>
      )}

      {/* Race history */}
      <div className="card" style={{ padding: '0.9rem 1rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
          RACE HISTORY · {races.length} GPs
        </div>
        <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {races.map(race => {
            const winner = race.Results?.[0]
            return (
              <div
                key={`${race.season}-${race.round}`}
                onClick={() => navigate(`/races/${race.season}/${race.round}`)}
                style={{
                  display: 'grid', gridTemplateColumns: '3rem 1fr 1fr auto', gap: '0.5rem',
                  alignItems: 'center', padding: '0.3rem 0.25rem',
                  borderBottom: '1px solid rgba(255,255,255,0.15)', fontSize: '0.78rem',
                  cursor: 'pointer', borderRadius: 4,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,35,35,0.95)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: 'var(--text-muted)' }}>{race.season}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {winner ? `${winner.Driver?.givenName} ${winner.Driver?.familyName}` : '—'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {winner?.Constructor?.name || '—'}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>→</span>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
