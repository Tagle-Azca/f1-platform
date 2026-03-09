import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper    from '../components/layout/PageWrapper'
import SearchBox      from '../components/encyclopedia/SearchBox'
import DriverBanner   from '../components/encyclopedia/DriverBanner'
import RaceDetail     from '../components/encyclopedia/RaceDetail'
import DriverProfile  from '../components/encyclopedia/DriverProfile'

export default function EncyclopediaPage() {
  const [selected,      setSelected]      = useState(null)
  const [bannerSeasons, setBannerSeasons] = useState(10)

  return (
    <PageWrapper>
      <h1 className="page__title">Race Encyclopedia</h1>
      <p className="page__subtitle">
        The full history of F1 since 1950 · Data from MongoDB
      </p>

      <SearchBox onSelect={setSelected} />

      <AnimatePresence mode="wait">
        {!selected && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em' }}>
                DRIVERS OF THE LAST
              </h3>
              {[5, 10, 20].map(y => (
                <button
                  key={y}
                  onClick={() => setBannerSeasons(y)}
                  style={{
                    padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                    cursor: 'pointer', border: '1px solid',
                    borderColor: bannerSeasons === y ? 'var(--mongo-color)' : 'var(--border)',
                    color:       bannerSeasons === y ? 'var(--mongo-color)' : 'var(--text-muted)',
                    background:  bannerSeasons === y ? 'rgba(34,197,94,0.08)' : 'transparent',
                  }}
                >
                  {y} years
                </button>
              ))}
            </div>

            <DriverBanner seasons={bannerSeasons} onDriverSelect={setSelected} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
              {[
                { title: 'Grand Prix',  desc: 'Search any GP from 1950 to today' },
                { title: 'Drivers',     desc: 'Profiles with full career statistics' },
                { title: 'Circuits',    desc: 'History of every track in F1' },
              ].map(({ title, desc }) => (
                <div key={title} className="card card--mongo" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '0.35rem' }}>{title}</h3>
                  <p style={{ fontSize: '0.82rem' }}>{desc}</p>
                </div>
              ))}
            </div>

            <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Try searching "Monaco", "Hamilton", "Verstappen" or "Spa"
            </p>
          </motion.div>
        )}

        {selected?.type === 'race' && (
          <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RaceDetail season={selected.season} round={selected.round} />
          </motion.div>
        )}

        {selected?.type === 'driver' && (
          <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DriverProfile driverId={selected.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
