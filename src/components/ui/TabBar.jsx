/**
 * TabBar — horizontal tab selector.
 *
 * Props:
 *   tabs        Array<{ id: string, label: string, badge?: ReactNode }>
 *   activeTab   string
 *   onChange    (id: string) => void
 *   variant?    'pill' | 'underline'   default 'pill'
 *   accentColor? string   CSS color for active tab, default 'var(--f1-red)'
 *   className?  string
 */
export default function TabBar({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  accentColor = 'var(--f1-red)',
  className = '',
}) {
  if (variant === 'underline') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          gap: '0.2rem',
          padding: '0.6rem 0.75rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--surface-2)',
          flexWrap: 'wrap',
        }}
      >
        {tabs.map(t => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              style={{
                padding: '0.3rem 0.9rem',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-condensed)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-muted)',
                borderBottom: isActive ? `2px solid ${accentColor}` : '2px solid transparent',
                transition: 'all var(--transition-fast)',
              }}
            >
              {t.label}
              {t.badge && t.badge}
            </button>
          )
        })}
      </div>
    )
  }

  // pill variant
  return (
    <div className={`tab-bar ${className}`}>
      {tabs.map(t => {
        const isActive = activeTab === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`tab-bar__btn${isActive ? ' tab-bar__btn--active' : ''}`}
            style={isActive ? { '--tab-color': accentColor } : undefined}
          >
            {t.label}
            {t.badge && t.badge}
          </button>
        )
      })}
    </div>
  )
}
