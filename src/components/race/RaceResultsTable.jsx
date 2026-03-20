import { motion } from 'framer-motion'
import { ctorColor, PODIUM_COLORS } from '../../utils/teamColors'
import StatusBadge from './StatusBadge'
import Delta, { positionDelta } from './PositionDelta'
import { fmtDate } from '../../utils/date'

export default function RaceResultsTable({ results, isMobile, onDriverClick, raceDate }) {
  if (!results.length) {
    return (
      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ opacity: 0.15, marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" style={{ width: 40, height: 40 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
          </svg>
        </div>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>Results not available yet</p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem' }}>Check back after the race on {fmtDate(raceDate)}</p>
      </div>
    )
  }

  return (
    <div style={{ minWidth: isMobile ? 540 : 0 }}>
      <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '2.5rem 1.5rem 1fr 1fr 3rem 4rem 3.5rem 4.5rem', gap: '0 0.75rem', padding: '0.45rem 1.25rem' }}>
        <span>Pos</span><span>No.</span><span>Driver</span><span>Constructor</span>
        <span style={{ textAlign: 'center' }}>Grid</span><span style={{ textAlign: 'center' }}>+/−</span>
        <span style={{ textAlign: 'right' }}>Pts</span><span style={{ textAlign: 'right' }}>Status</span>
      </div>
      {results.map((r, i) => {
        const color = ctorColor(r.Constructor?.constructorId)
        const delta = positionDelta(r)
        const isFirst = i === 0
        const podiumColor = PODIUM_COLORS[i] ?? null
        return (
          <motion.div
            key={r.Driver?.driverId || i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className="row-divider"
            style={{
              display: 'grid',
              gridTemplateColumns: '2.5rem 1.5rem 1fr 1fr 3rem 4rem 3.5rem 4.5rem',
              gap: '0 0.75rem',
              padding: '0.55rem 1.25rem',
              alignItems: 'center',
              borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              background: isFirst ? 'var(--surface-3)' : 'transparent',
              borderLeft: isFirst ? `3px solid ${color}` : '3px solid transparent',
            }}
          >
            <span style={{ fontFamily: 'var(--font-condensed)', fontSize: '1rem', fontWeight: 900, color: podiumColor || 'var(--text-muted)' }}>
              {r.position === '\\N' ? 'DNF' : r.position}
            </span>
            <span style={{ fontFamily: 'var(--font-condensed)', fontSize: '0.75rem', fontWeight: 700, color, opacity: 0.8 }}>
              {r.Driver?.permanentNumber || r.Driver?.code || '—'}
            </span>
            <div
              onClick={!isMobile && r.Driver?.driverId ? () => onDriverClick({ driverId: r.Driver.driverId, name: `${r.Driver.givenName} ${r.Driver.familyName}` }) : undefined}
              style={{ cursor: !isMobile && r.Driver?.driverId ? 'pointer' : undefined }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: isFirst ? 700 : 500 }}>{r.Driver?.givenName} {r.Driver?.familyName}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{r.Driver?.nationality}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 3, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{r.Constructor?.name || '—'}</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              {r.grid === '0' ? 'PL' : r.grid || '—'}
            </span>
            <div style={{ textAlign: 'center' }}><Delta value={delta} /></div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textAlign: 'right', color: parseFloat(r.points) > 0 ? color : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {parseFloat(r.points) > 0 ? r.points : '—'}
            </span>
            <div style={{ textAlign: 'right' }}><StatusBadge status={r.status} /></div>
          </motion.div>
        )
      })}
    </div>
  )
}
