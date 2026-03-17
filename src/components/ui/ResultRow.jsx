/**
 * ResultRow — standings / results list row.
 * Handles position number, name, team sub-label, stat value,
 * and the "leader" elevated treatment.
 *
 * Props:
 *   position   number
 *   name       string
 *   sub?       string          — team name, nationality, etc.
 *   stat       string|number   — points, time, gap
 *   color      string          — hex team color
 *   isLeader?  boolean         — applies elevated background
 *   leftSwatch? boolean        — show 3px vertical color bar (table style)
 *   compact?   boolean         — smaller padding
 *   onClick?   () => void
 *   style?     object
 */
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
  onClick,
  style = {},
}) {
  // Parse hex to r,g,b for dynamic rgba
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r},${g},${b}`
  }

  const rgb = color.startsWith('#') ? hexToRgb(color) : null

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: compact
          ? '0.35rem 0.75rem'
          : isLeader ? '0.6rem 0.75rem' : '0.4rem 0.75rem',
        background: isLeader && rgb
          ? `rgba(${rgb},0.08)`
          : 'transparent',
        border: isLeader && rgb
          ? `1px solid rgba(${rgb},0.2)`
          : '1px solid transparent',
        borderLeft: leftSwatch
          ? `3px solid ${color}`
          : undefined,
        borderRadius: 8,
        cursor: onClick ? 'pointer' : undefined,
        transition: 'background var(--transition-fast)',
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
    </div>
  )
}
