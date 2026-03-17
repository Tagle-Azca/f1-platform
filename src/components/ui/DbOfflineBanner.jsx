import AccentBanner from './AccentBanner'

const DB_META = {
  mongo:     { color: '#22c55e', label: 'MongoDB',   badge: 'db-badge--mongo' },
  cassandra: { color: '#a855f7', label: 'Cassandra', badge: 'db-badge--cassandra' },
  dgraph:    { color: '#ef4444', label: 'Dgraph',    badge: 'db-badge--dgraph' },
}

/**
 * DbOfflineBanner — database offline / data unavailable notice.
 *
 * Props:
 *   db       'mongo' | 'cassandra' | 'dgraph'
 *   message? string | ReactNode   — custom message
 */
export default function DbOfflineBanner({ db, message }) {
  const meta = DB_META[db] || DB_META.mongo
  const defaultMsg = `${meta.label} is not reachable. Start the database and run the seed script.`

  return (
    <AccentBanner color={meta.color} padding="sm">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span className={`db-badge ${meta.badge}`}>{meta.label}</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {message ?? defaultMsg}
        </span>
      </div>
    </AccentBanner>
  )
}
