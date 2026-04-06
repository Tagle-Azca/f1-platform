import DriverBanner from './DriverBanner'
import ConstructorBanner from './ConstructorBanner'
import FavoriteHighlight from './FavoriteHighlight'

const INFO_CARDS = [
  { title: 'Grand Prix',    desc: 'Search any GP from 1950 to today' },
  { title: 'Drivers',       desc: 'Profiles with full career statistics' },
  { title: 'Constructors',  desc: 'Team history, wins and season stats' },
  { title: 'Circuits',      desc: 'History of every track in F1' },
]

export default function EncyclopediaEmptyState({ bannerSeason, onSeasonChange, years, isMobile, onSelect }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em' }}>
          SEASON
        </h3>
        <select
          className="input"
          style={{ width: 100 }}
          value={bannerSeason}
          onChange={e => onSeasonChange(e.target.value)}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <FavoriteHighlight onSelect={onSelect} />
      <DriverBanner season={bannerSeason} onDriverSelect={onSelect} />
      <ConstructorBanner season={bannerSeason} onSelect={onSelect} />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
        {INFO_CARDS.map(({ title, desc }) => (
          <div key={title} className="card card--mongo" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '0.35rem' }}>{title}</h3>
            <p style={{ fontSize: '0.82rem' }}>{desc}</p>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        Try searching "Monaco", "Hamilton", "Ferrari", "Spa" or "Red Bull"
      </p>
    </>
  )
}
