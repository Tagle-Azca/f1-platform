import { Link } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'

const DB_CARDS = [
  {
    db: 'mongo',
    name: 'MongoDB',
    desc: 'Drivers, races and circuits. Structured documents with rich querying.',
    links: [
      { to: '/drivers',  label: 'Drivers'   },
      { to: '/races',    label: 'Races'     },
      { to: '/circuits', label: 'Circuits'  },
    ],
  },
  {
    db: 'cassandra',
    name: 'Cassandra',
    desc: 'High-frequency telemetry data: lap times, sectors and pit stops.',
    links: [
      { to: '/telemetry', label: 'Telemetry' },
    ],
  },
  {
    db: 'dgraph',
    name: 'Dgraph',
    desc: 'Graph relationships between drivers, teams, and circuits over seasons.',
    links: [
      { to: '/graph', label: 'Driver Graph' },
    ],
  },
]

export default function HomePage() {
  return (
    <PageWrapper>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 className="page__title" style={{ fontSize: '2.5rem' }}>
          F1 Intelligence Platform
        </h1>
        <p className="page__subtitle" style={{ fontSize: '1rem', marginBottom: 0 }}>
          Multi-database analytics for Formula 1 — MongoDB · Cassandra · Dgraph
        </p>
      </div>

      <div className="grid-3">
        {DB_CARDS.map(({ db, name, desc, links }) => (
          <div key={db} className={`card card--${db}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span className={`db-badge db-badge--${db}`}>{name}</span>
            </div>
            <p style={{ marginBottom: '1.25rem', fontSize: '0.88rem' }}>{desc}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {links.map(({ to, label }) => (
                <Link key={to} to={to} className="btn btn--ghost" style={{ fontSize: '0.8rem' }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  )
}
