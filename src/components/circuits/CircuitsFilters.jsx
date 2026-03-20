import { CONTINENT_FILTERS, TYPE_FILTERS, TYPE_COLORS } from './constants'

export default function CircuitsFilters({ contFilter, onContFilter, typeFilter, onTypeFilter, search, onSearch }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {CONTINENT_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => onContFilter(f)}
            style={{
              padding: '0.28rem 0.8rem', borderRadius: 99, border: '1px solid',
              borderColor: contFilter === f ? 'var(--f1-red)' : 'var(--border-color)',
              background:  contFilter === f ? 'rgba(225,6,0,0.12)' : 'transparent',
              color:       contFilter === f ? 'var(--f1-red)' : 'var(--text-muted)',
              fontFamily:  "'Barlow Condensed', sans-serif",
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {f}
          </button>
        ))}
        <input
          className="input"
          placeholder="Search circuit or country..."
          value={search}
          onChange={e => onSearch(e.target.value)}
          style={{ marginLeft: 'auto', width: 220, fontSize: '0.82rem', padding: '0.28rem 0.75rem' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--text-muted)',
          fontFamily: "'Barlow Condensed', sans-serif", marginRight: '0.2rem',
        }}>Type:</span>
        {TYPE_FILTERS.map(t => {
          const c = typeFilter === t ? (TYPE_COLORS[t.toLowerCase()] || 'var(--f1-red)') : 'var(--text-muted)'
          return (
            <button
              key={t}
              onClick={() => onTypeFilter(t)}
              style={{
                padding: '0.22rem 0.7rem', borderRadius: 99, border: '1px solid',
                borderColor: typeFilter === t ? c : 'var(--border-color)',
                background:  typeFilter === t ? `${c}20` : 'transparent',
                color:       c,
                fontFamily:  "'Barlow Condensed', sans-serif",
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          )
        })}
      </div>
    </div>
  )
}
