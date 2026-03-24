import { motion } from 'framer-motion'
import { FEATURED, ERA_COLORS, RIVALRIES, SLOT_COLORS, DRIVER_ACCENT } from './constants'

const pulseStyle = `
@keyframes card-invite {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
  50%       { box-shadow: 0 0 0 6px rgba(255,255,255,0.06); }
}
.card-invite { animation: card-invite 2.2s ease-in-out infinite; }
`

function isRivalryRelevant(rivalry, selectedIds) {
  if (!selectedIds.length) return true
  return selectedIds.some(id => id === rivalry.a.driverId || id === rivalry.b.driverId)
}

export default function FeaturedDrivers({ onAdd, onAddPair, drivers = [], disabledIds = [] }) {
  const selectedIds = drivers.map(d => d.driverId)
  const hasSelection = selectedIds.length > 0

  const inviteActive = drivers.length === 1

  return (
    <div>
      <style>{pulseStyle}</style>
      {/* ── Featured Drivers ── */}
      <div style={{
        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
        marginBottom: '0.85rem',
      }}>
        Legendary Drivers
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(188px, 1fr))',
        gap: '0.65rem',
        marginBottom: '2.5rem',
      }}>
        {FEATURED.map((d, i) => {
          const accent  = DRIVER_ACCENT[d.driverId] || ERA_COLORS[i]
          const isSelected = selectedIds.includes(d.driverId)
          const isDisabled = disabledIds.includes(d.driverId) || drivers.length >= 2
          const dim = isSelected
          const invite = inviteActive && !isSelected && !isDisabled

          return (
            <motion.button
              key={d.driverId}
              className={invite ? 'card-invite' : undefined}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: dim ? 0.9 : 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              disabled={isDisabled}
              onClick={() => !isDisabled && onAdd({ driverId: d.driverId, name: d.name })}
              style={{
                background: isSelected ? `${accent}22` : 'rgba(18,18,18,0.95)',
                border: `1px solid ${isSelected ? accent : `${accent}30`}`,
                borderTop: `3px solid ${accent}`,
                borderRadius: 12,
                padding: '1rem 1.1rem',
                textAlign: 'left',
                cursor: isDisabled ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column', gap: '0.28rem',
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => {
                if (isDisabled) return
                e.currentTarget.style.background = `${accent}18`
                e.currentTarget.style.borderColor = `${accent}88`
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = `0 8px 24px ${accent}22`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = isSelected ? `${accent}22` : 'rgba(18,18,18,0.95)'
                e.currentTarget.style.borderColor = isSelected ? accent : `${accent}30`
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1.1rem', fontWeight: 900,
                color: isSelected ? accent : '#fff',
                letterSpacing: '0.02em', lineHeight: 1.1,
              }}>
                {d.name}
              </div>
              <div style={{ fontSize: '0.65rem', color: accent, fontWeight: 700, opacity: 0.9 }}>
                {d.era}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.35, marginTop: '0.1rem' }}>
                {d.note}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* ── Notable Rivalries ── */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem' }}>
        <div style={{
          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text-muted)',
          marginBottom: '0.85rem',
        }}>
          Notable Rivalries · click to load both
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '0.6rem',
        }}>
          {RIVALRIES.map((r, i) => {
            const relevant = isRivalryRelevant(r, selectedIds)
            const isDisabled = drivers.length >= 2
            const inviteRivalry = inviteActive && relevant

            return (
              <motion.button
                key={`${r.a.driverId}-${r.b.driverId}`}
                className={inviteRivalry ? 'card-invite' : undefined}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.04, duration: 0.25 }}
                disabled={isDisabled}
                onClick={() => !isDisabled && onAddPair(r.a, r.b)}
                style={{
                  background: 'rgba(16,16,16,0.95)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderLeft: `3px solid ${relevant && hasSelection ? SLOT_COLORS[0] : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10,
                  padding: '0.85rem 1rem',
                  textAlign: 'left',
                  cursor: isDisabled ? 'default' : 'pointer',
                  display: 'flex', flexDirection: 'column', gap: '0.35rem',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => {
                  if (isDisabled) return
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(16,16,16,0.95)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                {/* SURNAME vs SURNAME — big typography */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '1.2rem', fontWeight: 900,
                    color: SLOT_COLORS[0],
                    letterSpacing: '0.02em', lineHeight: 1,
                    textTransform: 'uppercase',
                  }}>
                    {r.a.name.split(' ').slice(-1)[0]}
                  </span>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 800,
                    color: 'rgba(255, 255, 255, 0.54)',
                    letterSpacing: '0.1em',
                  }}>
                    vs
                  </span>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '1.2rem', fontWeight: 900,
                    color: SLOT_COLORS[1],
                    letterSpacing: '0.02em', lineHeight: 1,
                    textTransform: 'uppercase',
                  }}>
                    {r.b.name.split(' ').slice(-1)[0]}
                  </span>
                </div>

                {/* Team + Years */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
                    {r.team}
                  </span>
                  <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.15)' }}>·</span>
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)' }}>
                    {r.years}
                  </span>
                </div>

                {/* Note */}
                <div style={{
                  fontSize: '0.65rem', color: 'var(--text-muted)',
                  fontStyle: 'italic', lineHeight: 1.4,
                }}>
                  {r.note}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
