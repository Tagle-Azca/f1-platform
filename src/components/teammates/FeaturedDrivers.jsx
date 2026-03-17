import { motion } from 'framer-motion'
import { FEATURED, ERA_COLORS, RIVALRIES, SLOT_COLORS } from './constants'

export default function FeaturedDrivers({ onAdd, onAddPair }) {
  return (
    <div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        Select a driver to explore their career, teams and teammates — or search above
      </p>

      {/* Featured drivers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem', marginBottom: '2rem' }}>
        {FEATURED.map((d, i) => (
          <motion.button
            key={d.driverId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -2 }}
            onClick={() => onAdd({ driverId: d.driverId, name: d.name })}
            style={{
              background: 'rgba(22,22,22,0.92)',
              border: `1px solid ${ERA_COLORS[i]}33`,
              borderTop: `2px solid ${ERA_COLORS[i]}`,
              borderRadius: 10,
              padding: '1rem 1.1rem',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              display: 'flex', flexDirection: 'column', gap: '0.3rem',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${ERA_COLORS[i]}12`; e.currentTarget.style.borderColor = `${ERA_COLORS[i]}66` }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(22,22,22,0.92)'; e.currentTarget.style.borderColor = `${ERA_COLORS[i]}33` }}
          >
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.05rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
              {d.name}
            </div>
            <div style={{ fontSize: '0.68rem', color: ERA_COLORS[i], fontWeight: 600 }}>{d.era}</div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{d.note}</div>
          </motion.button>
        ))}
      </div>

      {/* Notable rivalries */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.9rem' }}>
          Notable Rivalries · click to load both drivers
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.55rem' }}>
          {RIVALRIES.map((r, i) => (
            <motion.button
              key={`${r.a.driverId}-${r.b.driverId}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              whileHover={{ y: -1 }}
              onClick={() => onAddPair(r.a, r.b)}
              style={{
                background: 'rgba(18,18,18,0.95)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: '0.8rem 1rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
                display: 'flex', flexDirection: 'column', gap: '0.3rem',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(18,18,18,0.95)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.95rem', fontWeight: 800, color: SLOT_COLORS[0] }}>
                  {r.a.name.split(' ').slice(-1)[0]}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>vs</span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.95rem', fontWeight: 800, color: SLOT_COLORS[1] }}>
                  {r.b.name.split(' ').slice(-1)[0]}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{r.team}</span>
                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>·</span>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>{r.years}</span>
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                {r.note}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
