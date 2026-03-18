import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchApi } from '../services/api'

export default function NotFoundPage() {
  const navigate    = useNavigate()
  const inputRef    = useRef(null)
  const [q,         setQ]        = useState('')
  const [results,   setResults]  = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    const t = setTimeout(() => {
      setSearching(true)
      searchApi.search(q, 6)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  function goTo(r) {
    setQ(''); setResults([])
    if (r.type === 'driver')       navigate(`/drivers/${r.id}`)
    else if (r.type === 'circuit') navigate('/circuits')
    else if (r.type === 'race')    navigate(`/races/${r.season}/${r.round}`)
    else navigate('/')
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, minHeight: '70vh' }}>

      {/* Header panel */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(225,6,0,0.08), transparent)',
        border: '1px solid rgba(225,6,0,0.25)',
        borderLeft: '3px solid var(--f1-red)',
        borderRadius: 14, padding: '2rem 2.5rem',
        width: '100%', maxWidth: 520, textAlign: 'center', marginBottom: '0.75rem',
      }}>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.18em', color: 'var(--f1-red)', fontWeight: 700, marginBottom: '0.5rem', fontFamily: "'Barlow Condensed', sans-serif" }}>
          ⚑ YELLOW FLAG · TRACK LIMITS EXCEEDED
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(4rem,12vw,6rem)', fontWeight: 900,
          color: 'var(--text-primary)', lineHeight: 0.9,
          letterSpacing: '-0.02em',
        }}>
          ERROR<br />
          <span style={{ color: 'var(--f1-red)' }}>404</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
          This page is outside the track limits. Rejoin from the pit lane.
        </p>
      </div>

      {/* Search */}
      <div style={{ width: '100%', maxWidth: 520, position: 'relative', marginBottom: '0.75rem' }}>
        <input
          ref={inputRef}
          className="input"
          style={{ width: '100%', paddingRight: '2.5rem' }}
          placeholder="Search driver, circuit or race…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        {searching && (
          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>…</span>
        )}
        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
            background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => goTo(r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  width: '100%', padding: '0.6rem 0.9rem', textAlign: 'left',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: i < results.length - 1 ? '1px solid var(--border-color)' : 'none',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', width: 46, flexShrink: 0 }}>{r.type}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: 520 }}>
        <button
          className="btn"
          style={{ flex: 1, background: 'var(--f1-red)', color: '#fff', border: 'none', fontWeight: 700 }}
          onClick={() => navigate('/')}
        >
          Rejoin Track
        </button>
        <button
          className="btn"
          style={{ flex: 1 }}
          onClick={() => window.history.back()}
        >
          Back to Garage
        </button>
      </div>

    </div>
  )
}
