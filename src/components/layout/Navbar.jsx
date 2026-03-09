import { NavLink } from 'react-router-dom'

const TABS = [
  {
    path:  '/graph',
    label: 'GRAPH EXPLORER',
    sub:   'Dgraph',
    color: 'var(--dgraph-color)',
    bg:    'rgba(239,68,68,0.12)',
  },
  {
    path:  '/encyclopedia',
    label: 'ENCYCLOPEDIA',
    sub:   'MongoDB',
    color: 'var(--mongo-color)',
    bg:    'rgba(34,197,94,0.12)',
  },
  {
    path:  '/standings',
    label: 'CHAMPIONSHIP BATTLE',
    sub:   'MongoDB',
    color: 'var(--mongo-color)',
    bg:    'rgba(34,197,94,0.12)',
  },
  {
    path:  '/circuits',
    label: 'CIRCUITS',
    sub:   'MongoDB',
    color: 'var(--mongo-color)',
    bg:    'rgba(34,197,94,0.12)',
  },
  {
    path:  '/telemetry',
    label: 'TELEMETRY',
    sub:   'Cassandra',
    color: 'var(--cassandra-color)',
    bg:    'rgba(168,85,247,0.12)',
  },
]

export default function Navbar() {
  return (
    <nav style={{
      height: 'var(--navbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      background: 'rgba(13,13,13,0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      gap: '1rem',
    }}>
      {/* Logo */}
      <NavLink
        to="/"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          textDecoration: 'none', flexShrink: 0,
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--f1-red)', fontWeight: 900, fontSize: 13,
          color: '#fff', letterSpacing: '-0.5px',
        }}>F1</div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            F1<span style={{ color: 'var(--f1-red)' }}>IP</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            Intelligence Platform
          </div>
        </div>
      </NavLink>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
        {TABS.map(({ path, label, sub, color, bg }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 1rem',
              borderRadius: 8,
              border: `1px solid ${isActive ? color : 'transparent'}`,
              background: isActive ? bg : 'transparent',
              color: isActive ? color : 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              boxShadow: isActive ? `0 0 16px ${color}33` : 'none',
            })}
          >
            <div>
              <div>{label}</div>
              <div style={{ fontSize: '0.62rem', fontWeight: 500, opacity: 0.75 }}>({sub})</div>
            </div>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
