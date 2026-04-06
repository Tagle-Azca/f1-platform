import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Panel from '../ui/Panel'
import DbCardBody from './DbCardBody'
import { usePreferences } from '../../contexts/PreferencesContext'

// Spotlight first — most personal. Title Fight second — narrative. Season last — reference.
const SPOTLIGHT  = {
  db: 'cassandra',
  title: 'Driver Spotlight',
  subtitle: 'Telemetry · Pace · Strategy',
  links: [
    { to: '/telemetry',     label: 'Telemetry' },
    { to: '/race-pace',     label: 'Race Pace' },
    { to: '/tire-strategy', label: 'Tire Strategy' },
  ],
}

const TITLE_FIGHT = {
  db: 'dgraph',
  title: 'Title Fight',
  subtitle: 'Championship · Momentum · Records',
  links: [
    { to: '/graph',     label: 'Graph Explorer' },
    { to: '/teammates', label: 'Teammate History' },
  ],
}

const SEASON_GLANCE = {
  db: 'mongo',
  title: 'Season at a Glance',
  subtitle: 'Standings · Races · Circuits',
  links: [
    { to: '/races',                 label: 'Races' },
    { to: '/standings',             label: 'Driver Championship' },
    { to: '/constructor-standings', label: 'Constructors' },
    { to: '/circuits',              label: 'Circuits Map' },
  ],
}

function CardWrapper({ card, data, hasFavorite, style = {} }) {
  const { db, title, subtitle, links } = card
  const isSpotlight = db === 'cassandra'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-glow-accent)' }}
      style={{
        position: 'relative', overflow: 'hidden',
        // Accent left border when this is "Your Driver" card
        borderLeft: isSpotlight && hasFavorite ? '3px solid var(--accent-color)' : '3px solid transparent',
        borderRadius: 12,
        transition: 'border-color 0.4s ease',
        ...style,
      }}
    >
      <Panel accent="accent" style={{ height: '100%', position: 'relative' }}>
        {/* Top radial glow — stronger on Spotlight */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: isSpotlight ? 140 : 100,
          background: isSpotlight
            ? 'radial-gradient(ellipse at 0% 0%, rgb(var(--accent-rgb) / 0.18) 0%, transparent 65%)'
            : 'radial-gradient(ellipse at 50% 0%, rgb(var(--accent-rgb) / 0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
          transition: 'background 0.4s ease',
        }} />

        <div style={{ position: 'relative' }}>
          {/* Card header */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: isSpotlight ? '1.15rem' : '1.05rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--accent-color)',
              lineHeight: 1.15,
              transition: 'color 0.4s ease',
            }}>
              {title}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginTop: 3 }}>
              {subtitle}
            </div>
          </div>

          <DbCardBody db={db} data={data} />

          {/* Nav links */}
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
  )
}

export default function HomeDbCardsGrid({ data, isMobile, isTablet }) {
  const { prefs } = usePreferences()
  const hasFavorite = !!prefs.favoriteDriver

  // ── Desktop: Spotlight dominates left (2fr), Season + Title Fight stacked right (1fr)
  if (!isMobile && !isTablet) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
        <CardWrapper card={SPOTLIGHT}    data={data} hasFavorite={hasFavorite} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <CardWrapper card={SEASON_GLANCE} data={data} hasFavorite={hasFavorite} />
          <CardWrapper card={TITLE_FIGHT}   data={data} hasFavorite={hasFavorite} />
        </div>
      </div>
    )
  }

  // ── Tablet: 2-column, Spotlight first (not mobile)
  if (isTablet && !isMobile) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
        <CardWrapper card={SPOTLIGHT}    data={data} hasFavorite={hasFavorite} />
        <CardWrapper card={TITLE_FIGHT}  data={data} hasFavorite={hasFavorite} />
        <CardWrapper card={SEASON_GLANCE} data={data} hasFavorite={hasFavorite} style={{ gridColumn: '1 / -1' }} />
      </div>
    )
  }

  // ── Mobile: stacked — Spotlight first, Title Fight second, Season last
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
      <CardWrapper card={SPOTLIGHT}    data={data} hasFavorite={hasFavorite} />
      <CardWrapper card={TITLE_FIGHT}  data={data} hasFavorite={hasFavorite} />
      <CardWrapper card={SEASON_GLANCE} data={data} hasFavorite={hasFavorite} />
    </div>
  )
}
