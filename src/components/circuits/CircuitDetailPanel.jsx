import { motion } from 'framer-motion'
import { Separator } from '@/components/ui/separator'
import { circuitType } from './constants'

const TYPE_COLORS = { street: '#f59e0b', hybrid: '#6366f1', permanent: '#22c55e' }

export default function CircuitDetailPanel({ circuit, onClose }) {
  if (!circuit) return null
  const type      = circuitType(circuit.circuitId)
  const typeColor = TYPE_COLORS[type] || '#888'

  return (
    <motion.div
      key={circuit.circuitId}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25 }}
      style={{
        marginTop: '0.75rem',
        background: 'linear-gradient(135deg, rgba(225,6,0,0.06) 0%, var(--surface-1) 100%)',
        border: '1px solid rgba(225,6,0,0.2)',
        borderLeft: '3px solid var(--f1-red)',
        borderRadius: 12,
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap',
        position: 'relative',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '0.6rem', right: '0.75rem',
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
        }}
      >✕</button>

      <div style={{ flex: '1 1 180px' }}>
        <div style={{ fontSize: '0.62rem', color: 'var(--f1-red)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
          CIRCUIT
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1,
        }}>
          {circuit.circuitName}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {circuit.Location?.locality || circuit.locality}, {circuit.Location?.country || circuit.country}
        </div>
        <div style={{
          marginTop: '0.45rem',
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: `${typeColor}18`,
          border: `1px solid ${typeColor}40`,
          borderRadius: 4, padding: '2px 8px',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: typeColor }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: typeColor, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {type}
          </span>
        </div>
      </div>

      <Separator orientation="vertical" style={{ height: 48, opacity: 0.2 }} />

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, color: 'var(--f1-red)', lineHeight: 1 }}>
          {circuit.raceCount || '—'}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 }}>
          Races held
        </div>
      </div>

      {circuit.lastSeason && (
        <>
          <Separator orientation="vertical" style={{ height: 48, opacity: 0.2 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {circuit.lastSeason}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 }}>
              Last GP
            </div>
          </div>
        </>
      )}

      {circuit.lastRaceName && (
        <>
          <Separator orientation="vertical" style={{ height: 48, opacity: 0.2 }} />
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              Last Event
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
              {circuit.lastRaceName}
            </div>
          </div>
        </>
      )}

      {circuit.url && (
        <a
          href={circuit.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: 'auto', flexShrink: 0,
            padding: '0.4rem 0.85rem', borderRadius: 6,
            border: '1px solid rgba(225,6,0,0.3)',
            background: 'rgba(225,6,0,0.08)',
            color: 'var(--f1-red)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', textDecoration: 'none',
          }}
        >
          Wikipedia ↗
        </a>
      )}
    </motion.div>
  )
}
