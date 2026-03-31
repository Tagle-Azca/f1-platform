import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Panel from '../ui/Panel'
import DbCardBody from './DbCardBody'

const DB_CARDS = [
  {
    db: 'mongo',
    title: 'Season at a Glance',
    subtitle: 'Standings · Races · Circuits',
    links: [
      { to: '/races',                 label: 'Races' },
      { to: '/standings',             label: 'Driver Championship' },
      { to: '/constructor-standings', label: 'Constructors' },
      { to: '/circuits',              label: 'Circuits Map' },
    ],
  },
  {
    db: 'cassandra',
    title: 'Driver Spotlight',
    subtitle: 'Telemetry · Pace · Tire Strategy',
    links: [
      { to: '/telemetry',     label: 'Telemetry' },
      { to: '/race-pace',     label: 'Race Pace' },
      { to: '/tire-strategy', label: 'Tire Strategy' },
    ],
  },
  {
    db: 'dgraph',
    title: 'Season Records',
    subtitle: 'Networks · Careers · Connections',
    links: [
      { to: '/graph',     label: 'Graph Explorer' },
      { to: '/teammates', label: 'Teammate History' },
    ],
  },
]

export default function HomeDbCardsGrid({ data, isMobile, isTablet }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
      {DB_CARDS.map(({ db, title, subtitle, links }, i) => (
        <motion.div
          key={db}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 + i * 0.08, duration: 0.4 }}
          whileHover={{ y: -2, boxShadow: 'var(--shadow-glow-accent)' }}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          <Panel accent="accent" style={{ height: '100%', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 100,
              background: 'radial-gradient(ellipse at 50% 0%, rgb(var(--accent-rgb) / 0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
              transition: 'background 0.4s ease',
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.04em',
                  textTransform: 'uppercase', color: 'var(--accent-color)',
                  lineHeight: 1.15, transition: 'color 0.4s ease',
                }}>
                  {title}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginTop: 3 }}>
                  {subtitle}
                </div>
              </div>
              <DbCardBody db={db} data={data} />
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {links.map(({ to, label }) => (
                  <Link
                    key={to} to={to}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: 6,
                      border: '1px solid rgb(var(--accent-rgb) / 0.22)',
                      background: 'rgb(var(--accent-rgb) / 0.10)',
                      color: 'var(--accent-color)',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '0.78rem', fontWeight: 700,
                      letterSpacing: '0.07em', textTransform: 'uppercase',
                      textDecoration: 'none', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgb(var(--accent-rgb) / 0.22)'
                      e.currentTarget.style.borderColor = 'var(--accent-color)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgb(var(--accent-rgb) / 0.10)'
                      e.currentTarget.style.borderColor = 'rgb(var(--accent-rgb) / 0.22)'
                    }}
                  >
                    {label} <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </Panel>
        </motion.div>
      ))}
    </div>
  )
}
