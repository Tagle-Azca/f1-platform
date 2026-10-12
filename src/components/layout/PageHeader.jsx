/**
 * PageHeader — standard page title (the page's single h1) + subtitle + optional actions.
 *
 * Props:
 *   title     string
 *   subtitle? string
 *   badge?   'mongo' | 'cassandra' | 'dgraph'
 *   actions? ReactNode   — rendered right-aligned (season selects, buttons, etc.)
 *   className? string
 */
export default function PageHeader({ title, subtitle, badge, actions, className = '' }) {
  return (
    <div className={`page-header ${className}`}>
      <div className="page-header__left">
        <h1 className="page__title !mb-0">{title}</h1>
        {subtitle && <p className="page__subtitle !mb-0">{subtitle}</p>}
      </div>
      {(badge || actions) && (
        <div className="page-header__right">
          {actions}
          {badge && <span className={`db-badge db-badge--${badge}`}>{badge}</span>}
        </div>
      )}
    </div>
  )
}
