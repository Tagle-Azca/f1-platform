import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchApi } from '../../services/api'

export default function DriverSearch({ onAdd, disabledIds, disabled = false }) {
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
        .then(r => {
          const drivers = r.filter(x => x.type === 'driver' && !disabledIds.includes(x.id))
          setResults(drivers)
          setOpen(true)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query, disabledIds.join(',')])

  useEffect(() => {
    function handleClick(e) { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(item) {
    setQuery('')
    setOpen(false)
    onAdd({ driverId: item.id, name: item.label })
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <input
        className="input"
        value={query}
        onChange={e => !disabled && setQuery(e.target.value)}
        onFocus={() => !disabled && results.length > 0 && setOpen(true)}
        placeholder={disabled ? 'Both slots filled — click a slot above to remove' : 'Search driver name...'}
        disabled={disabled}
        style={{ width: '100%', opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : undefined }}
      />
      {loading && (
        <span style={{
          position: 'absolute', right: '0.75rem', top: '50%',
          transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem',
        }}>
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
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
              background: 'var(--surface-2)', border: '1px solid var(--border-color)', borderRadius: 10,
              overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {results.map(r => (
              <button
                key={r.id}
                onClick={() => select(r)}
                style={{
                  width: '100%', padding: '0.6rem 1rem', background: 'transparent',
                  border: 'none', borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{r.nationality}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
