import { useState, useEffect } from 'react'
import { searchApi } from '../../services/api'

export default function DriverSearch({ inputRef, onSelect, resetKey }) {
  const [query,       setQuery]       = useState('')
  const [suggestions, setSuggestions] = useState([])

  // Reset when parent requests it (e.g. after selecting a driver or resetting)
  useEffect(() => {
    setQuery('')
    setSuggestions([])
  }, [resetKey])

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    const t = setTimeout(() => {
      searchApi.search(query, 8)
        .then(results => setSuggestions(results.filter(r => r.type === 'driver')))
        .catch(() => setSuggestions([]))
    }, 220)
    return () => clearTimeout(t)
  }, [query])

  function handleSelect(r) {
    setQuery('')
    setSuggestions([])
    onSelect(r)
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        className="input"
        style={{ width: '100%', fontSize: '0.95rem' }}
        placeholder="Search a driver to explore their full career..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && suggestions.length) handleSelect(suggestions[0])
          if (e.key === 'Escape') { setQuery(''); setSuggestions([]) }
        }}
        autoFocus
      />

      {suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
          background: 'rgba(10,10,10,0.97)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderTop: 'none', borderRadius: '0 0 8px 8px',
          overflow: 'hidden',
        }}>
          {suggestions.map((r, i) => (
            <button
              key={r.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                width: '100%', textAlign: 'left', padding: '0.55rem 0.9rem',
                background: 'none', border: 'none',
                color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(225,6,0,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
              onClick={() => handleSelect(r)}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e10600', flexShrink: 0 }} />
              <span>{r.label}</span>
              {r.nationality && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {r.nationality}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
