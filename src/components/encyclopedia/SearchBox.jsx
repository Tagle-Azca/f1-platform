import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchApi } from '../../services/api'

export default function SearchBox({ onSelect }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    const t = setTimeout(() => {
      searchApi.search(query)
        .then(r => { setResults(r); setOpen(true) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function handleClick(e) { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(item) {
    setQuery(item.label)
    setOpen(false)
    onSelect(item)
  }

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: '1.5rem' }}>
      <input
        className="input"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search for a Grand Prix, driver or circuit... (e.g. Monaco, Hamilton, Spa)"
        style={{ fontSize: '0.95rem', padding: '0.75rem 1rem' }}
      />
      {loading && (
        <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          ...
        </span>
      )}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
              background: '#1a1a1a', border: '1px solid var(--border)', borderRadius: 10,
              overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {results.map(r => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => select(r)}
                style={{
                  width: '100%', padding: '0.65rem 1rem', background: 'transparent',
                  border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {r.type === 'race'    && r.circuitName}
                    {r.type === 'driver'  && r.nationality}
                    {r.type === 'circuit' && `${r.locality}, ${r.country}`}
                  </div>
                </div>
                <span style={{
                  marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 600,
                  padding: '0.15rem 0.5rem', borderRadius: 99,
                  background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                }}>
                  {r.type}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
