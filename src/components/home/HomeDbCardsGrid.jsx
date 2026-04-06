import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Panel from '../ui/Panel'
import DbCardBody from './DbCardBody'
import { usePreferences } from '../../contexts/PreferencesContext'
import { WIDGET_REGISTRY, hasConstraintViolation } from '../../utils/widgetRegistry'

// ── Container query styles — cards respond to their own width, not viewport ──
const CONTAINER_CSS = `
  .pw-card { container-type: inline-size; container-name: pw-card; }
  @container pw-card (max-width: 300px) {
    .pw-card-title  { font-size: 0.95rem !important; }
    .pw-card-links  { flex-direction: column !important; }
    .pw-card-link   { justify-content: center !important; }
  }
  @container pw-card (min-width: 420px) {
    .pw-card-title  { font-size: 1.25rem !important; }
    .pw-card-links  { flex-wrap: nowrap !important; }
  }
`

const CARDS_CONFIG = {
  cassandra: {
    db: 'cassandra', title: 'Driver Spotlight', subtitle: 'Telemetry · Pace · Strategy',
    links: [
      { to: '/telemetry',     label: 'Telemetry' },
      { to: '/race-pace',     label: 'Race Pace' },
      { to: '/tire-strategy', label: 'Tire Strategy' },
    ],
  },
  team: {
    db: 'team', title: 'Team Spotlight', subtitle: 'WCC · Drivers · Championship',
    links: [
      { to: '/constructor-standings', label: 'WCC Standings' },
      { to: '/teammates',             label: 'Rivalries' },
    ],
  },
  mongo: {
    db: 'mongo', title: 'Season at a Glance', subtitle: 'Standings · Races · Circuits',
    links: [
      { to: '/races',                 label: 'Races' },
      { to: '/standings',             label: 'Driver Championship' },
      { to: '/constructor-standings', label: 'Constructors' },
      { to: '/circuits',              label: 'Circuits Map' },
    ],
  },
  dgraph: {
    db: 'dgraph', title: 'Title Fight', subtitle: 'Championship · Momentum · Records',
    links: [
      { to: '/graph',     label: 'Graph Explorer' },
      { to: '/teammates', label: 'Teammate History' },
    ],
  },
}

function CardWrapper({ card, data, hasFavorite, layout, style = {} }) {
  const { db, title, subtitle, links } = card
  const isPersonal   = db === 'cassandra' || db === 'team'
  const hasViolation = hasConstraintViolation(db, layout)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-glow-accent)' }}
      className="pw-card"
      style={{
        position: 'relative', overflow: 'hidden',
        borderLeft: isPersonal && hasFavorite ? '3px solid var(--accent-color)' : '3px solid transparent',
        borderRadius: 12,
        transition: 'border-color 0.4s ease',
        ...style,
      }}
    >
      <Panel accent="accent" style={{ height: '100%', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: isPersonal ? 140 : 100,
          background: isPersonal
            ? 'radial-gradient(ellipse at 0% 0%, rgb(var(--accent-rgb) / 0.18) 0%, transparent 65%)'
            : 'radial-gradient(ellipse at 50% 0%, rgb(var(--accent-rgb) / 0.10) 0%, transparent 70%)',
          pointerEvents: 'none', transition: 'background 0.4s ease',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div className="pw-card-title" style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: isPersonal ? '1.15rem' : '1.05rem',
              fontWeight: 800, letterSpacing: '0.04em',
              textTransform: 'uppercase', color: 'var(--accent-color)',
              lineHeight: 1.15, transition: 'color 0.4s ease',
            }}>
              {title}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginTop: 3 }}>
              {subtitle}
            </div>
          </div>

          <DbCardBody db={db} data={data} isNarrow={hasViolation} />

          <div className="pw-card-links" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {links.map(({ to, label }) => (
              <Link
                key={to} to={to} className="pw-card-link"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.4rem 0.85rem', borderRadius: 6,
                  border: '1px solid rgb(var(--accent-rgb) / 0.22)',
                  background: 'rgb(var(--accent-rgb) / 0.10)',
                  color: 'var(--accent-color)',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '0.78rem', fontWeight: 700,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgb(var(--accent-rgb) / 0.22)'; e.currentTarget.style.borderColor = 'var(--accent-color)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgb(var(--accent-rgb) / 0.10)'; e.currentTarget.style.borderColor = 'rgb(var(--accent-rgb) / 0.22)' }}
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

const DEFAULT_ORDER   = ['cassandra', 'mongo', 'dgraph']
const DEFAULT_ENABLED = ['cassandra', 'mongo', 'dgraph']
const DEFAULT_FEATURED = 'cassandra'

export default function HomeDbCardsGrid({ data, isMobile, isTablet }) {
  const { prefs } = usePreferences()
  const hasFavorite = !!prefs.favoriteDriver

  const layout   = prefs.dashboardLayout ?? {}
  const order    = layout.order    ?? DEFAULT_ORDER
  const enabled  = layout.enabled  ?? DEFAULT_ENABLED
  const featured = layout.featured ?? DEFAULT_FEATURED

  // Only render enabled widgets, in user-defined order
  const cards = order
    .filter(db => enabled.includes(db) && CARDS_CONFIG[db])
    .map(db => CARDS_CONFIG[db])

  if (!cards.length) return null

  const featuredCard = CARDS_CONFIG[featured] && enabled.includes(featured)
    ? CARDS_CONFIG[featured]
    : cards[0]

  // ── Desktop: featured (2fr) + others stacked (1fr) ──
  if (!isMobile && !isTablet) {
    const others = cards.filter(c => c.db !== featuredCard.db)
    return (
      <>
        <style>{CONTAINER_CSS}</style>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
          <CardWrapper card={featuredCard} data={data} hasFavorite={hasFavorite} layout={layout} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {others.map(card => <CardWrapper key={card.db} card={card} data={data} hasFavorite={hasFavorite} layout={layout} />)}
          </div>
        </div>
      </>
    )
  }

  // ── Tablet: 2-column ──
  if (isTablet && !isMobile) {
    const [first, second, third] = cards
    return (
      <>
        <style>{CONTAINER_CSS}</style>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
          <CardWrapper card={first} data={data} hasFavorite={hasFavorite} layout={layout} />
          {second && <CardWrapper card={second} data={data} hasFavorite={hasFavorite} layout={layout} />}
          {third  && <CardWrapper card={third}  data={data} hasFavorite={hasFavorite} layout={layout} style={{ gridColumn: '1 / -1' }} />}
        </div>
      </>
    )
  }

  // ── Mobile: stacked ──
  return (
    <>
      <style>{CONTAINER_CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
        {cards.map(card => <CardWrapper key={card.db} card={card} data={data} hasFavorite={hasFavorite} layout={layout} />)}
      </div>
    </>
  )
}
