/**
 * AccentBanner — left-border + gradient background panel.
 * The `color` prop is always dynamic (team/DB color) so it stays inline.
 *
 * Props:
 *   color     string   — hex or CSS color (REQUIRED)
 *   padding?  'sm' | 'md'   default 'md'
 *   radius?   number   — border-radius in px, default 12
 *   className? string
 *   style?    object
 *   children  ReactNode
 */
export default function AccentBanner({
  color,
  padding = 'md',
  radius = 12,
  className = '',
  style = {},
  children,
}) {
  const pad = padding === 'sm' ? '0.75rem 1rem' : '1.25rem 1.5rem'

  return (
    <div
      className={className}
      style={{
        background:  `linear-gradient(135deg, ${color}22 0%, transparent 65%), rgba(22,22,22,0.92)`,
        border:      `1px solid ${color}40`,
        borderLeft:  `3px solid ${color}`,
        borderRadius: radius,
        padding:     pad,
        transition:  'background 0.4s ease, border-color 0.4s ease',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
