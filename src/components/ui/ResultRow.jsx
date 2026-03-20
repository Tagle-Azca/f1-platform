import { useState } from 'react'
import { motion } from 'framer-motion'
import { useBreakpoint } from '../../hooks/useBreakpoint'

export default function ResultRow({
  position,
  name,
  sub,
  stat,
  color = '#888',
  isLeader = false,
  podiumColor = null,
  leftSwatch = false,
  compact = false,
  showChevron = false,
  onClick,
  style = {},
}) {
  const [hovered, setHovered] = useState(false)
  const { isMobile } = useBreakpoint()

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r},${g},${b}`
  }

  const rgb = color.startsWith('#') ? hexToRgb(color) : null
  const interactive = !!onClick

  return (
    <motion.div
      whileTap={interactive ? { scale: 0.98 } : undefined}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: compact
          ? '0.35rem 0.75rem'
          : isLeader ? '0.6rem 0.75rem' : '0.4rem 0.75rem',
        paddingRight: showChevron && interactive
          ? '1.5rem'
          : (compact ? '0.75rem' : isLeader ? '0.75rem' : '0.75rem'),
        background: hovered && interactive
          ? 'rgba(255,255,255,0.03)'
          : isLeader && rgb ? `rgba(${rgb},0.08)` : 'transparent',
        border: isLeader && rgb
          ? `1px solid rgba(${rgb},0.2)`
          : '1px solid transparent',
        borderLeft: leftSwatch
          ? `3px solid ${color}`
          : undefined,
        borderRadius: 8,
        cursor: interactive ? 'pointer' : undefined,
        transform: hovered && interactive ? 'translateY(-1px)' : undefined,
        transition: 'background 0.2s ease-in-out, transform 0.2s ease-in-out',
        ...style,
      }}
    >
      {/* Position */}
      <span style={{
        fontFamily: 'var(--font-condensed)',
        fontSize: isLeader ? '1.1rem' : '0.9rem',
        fontWeight: 900,
        color: podiumColor || (isLeader ? color : 'var(--text-muted)'),
        width: 22,
        textAlign: 'center',
        flexShrink: 0,
      }}>
        {position}
      </span>

      {/* Name + sub */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-condensed)',
          fontSize: isLeader ? '1rem' : '0.88rem',
          fontWeight: 700,
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {name}
        </div>
        {sub && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {sub}
          </div>
        )}
      </div>

      {/* Stat */}
      <span style={{
        fontFamily: 'var(--font-condensed)',
        fontSize: isLeader ? '1.15rem' : '0.95rem',
        fontWeight: 900,
        color: isLeader ? color : 'rgba(255,255,255,0.7)',
        flexShrink: 0,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {stat}
      </span>

      {/* Chevron */}
      {showChevron && interactive && (
        <span style={{
          position: 'absolute',
          right: '0.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
          opacity: isMobile ? 0.5 : (hovered ? 1 : 0),
          transition: 'opacity 0.2s ease-in-out',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      )}
    </motion.div>
  )
}
