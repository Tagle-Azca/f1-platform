/**
 * TabBar — horizontal tab selector (buttons with aria-pressed semantics).
 *
 * Props:
 *   tabs        Array<{ id: string, label: string, badge?: ReactNode }>
 *   activeTab   string
 *   onChange    (id: string) => void
 *   variant?    'pill' | 'underline'   default 'pill'
 *   accentColor? string   CSS color for active tab, default 'var(--pw-steel)'
 *   className?  string
 */
export default function TabBar({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  accentColor = 'var(--pw-steel)',
  className = '',
}) {
  if (variant === 'underline') {
    return (
      <div className={`flex flex-wrap gap-1 px-pw-3 py-pw-2 border-b border-[var(--border-color)] bg-panel ${className}`}>
        {tabs.map(t => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(t.id)}
              style={isActive ? { '--tab-color': accentColor } : undefined}
              className={[
                'min-h-11 md:min-h-8 px-pw-4 rounded-sm cursor-pointer font-condensed text-xs font-bold uppercase tracking-[0.07em] border-0 border-b-2 transition-colors',
                isActive ? 'bg-white/10 text-ink border-b-[var(--tab-color)]' : 'bg-transparent text-ink-3 border-b-transparent hover:text-ink',
              ].join(' ')}
            >
              {t.label}
              {t.badge && t.badge}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`tab-bar ${className}`}>
      {tabs.map(t => {
        const isActive = activeTab === t.id
        return (
          <button
            key={t.id}
            type="button"
            aria-pressed={isActive}
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
