import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ConstructorDriverCard({ driver, teammate, color }) {
  const [hovered, setHovered] = useState(false)
  const lastName = driver.name.split(' ').pop()
  const tmLastName = teammate?.name.split(' ').pop()

  const rows = [
    { label: 'Points', a: driver.points, b: teammate?.points },
    { label: 'Wins',   a: driver.wins,   b: teammate?.wins   },
  ]

  return (
    <div
      style={{ position: 'relative', flex: 1, borderRadius: 10, overflow: 'hidden', border: `1px solid ${color}30`, minWidth: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence initial={false} mode="wait">
        {!hovered ? (
          <motion.div key="default"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{ padding: '0.85rem 1rem', background: `${color}0a` }}
          >
            <div style={{ fontSize: '0.52rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
              Driver
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {lastName}
            </div>
            <div style={{ fontSize: '0.68rem', color, fontWeight: 700, marginTop: '0.25rem', fontVariantNumeric: 'tabular-nums' }}>
              {driver.wins > 0 ? `${driver.wins}W · ` : ''}{driver.points} pts
            </div>
          </motion.div>
        ) : (
          <motion.div key="h2h"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{ padding: '0.85rem 1rem', background: `${color}14` }}
          >
            <div style={{ fontSize: '0.52rem', color, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '0.5rem' }}>
              vs {tmLastName ?? 'Teammate'}
            </div>
            {rows.map(({ label, a, b }) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.4rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: a >= (b ?? -1) ? color : 'var(--text-muted)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {a ?? '—'}
                </span>
                <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>
                  {label}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: (b ?? -1) > a ? color : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {b ?? '—'}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
