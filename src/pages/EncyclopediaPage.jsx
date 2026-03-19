import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper    from '../components/layout/PageWrapper'
import SearchBox      from '../components/encyclopedia/SearchBox'
import DriverBanner   from '../components/encyclopedia/DriverBanner'
import DriverProfile  from '../components/encyclopedia/DriverProfile'
import CircuitDetail      from '../components/encyclopedia/CircuitDetail'
import ConstructorDetail  from '../components/encyclopedia/ConstructorDetail'
import DriverGraph        from '../components/encyclopedia/DriverGraph'
import ConstructorGraph   from '../components/encyclopedia/ConstructorGraph'
import ConstructorBanner  from '../components/encyclopedia/ConstructorBanner'
import PageHint           from '../components/ui/PageHint'

export default function EncyclopediaPage() {
  const { isMobile } = useBreakpoint()
  const currentYear = new Date().getFullYear()
  const [selected,     setSelected]     = useState(null)
  const [bannerSeason, setBannerSeason] = useState(String(currentYear))
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => String(currentYear - i))
  const navigate = useNavigate()
  const location = useLocation()

  // Reset when Navbar re-clicks the Encyclopedia tab
  useEffect(() => {
    if (location.state?.reset) {
      setSelected(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.state?.reset])

  function goBack() {
    setSelected(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSelect(item) {
    if (item.type === 'race') {
      navigate(`/races/${item.season}/${item.round}`)
    } else {
      setSelected(item)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <PageWrapper>
      <PageHint
        id="encyclopedia"
        title="Race Encyclopedia"
        text="Search for a driver or circuit in the top bar. Select a year to view their full season, teams and race statistics."
        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>}
      />
      <h1 className="page__title">Race Encyclopedia</h1>
      <p className="page__subtitle">
        The full history of F1 since 1950 · Data from MongoDB
      </p>

      {selected && (
        <button
          onClick={goBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '0 0 0.75rem 0',
            fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 15, height: 15 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to Encyclopedia
        </button>
      )}

      <SearchBox onSelect={handleSelect} exclude={['race']} showConstructor externalValue={selected?.label} />

      <AnimatePresence mode="wait">
        {!selected && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em' }}>
                SEASON
              </h3>
              <select
                className="input"
                style={{ width: 100 }}
                value={bannerSeason}
                onChange={e => setBannerSeason(e.target.value)}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <DriverBanner season={bannerSeason} onDriverSelect={setSelected} />
            <ConstructorBanner season={bannerSeason} onSelect={setSelected} />

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
              {[
                { title: 'Grand Prix',    desc: 'Search any GP from 1950 to today' },
                { title: 'Drivers',       desc: 'Profiles with full career statistics' },
                { title: 'Constructors',  desc: 'Team history, wins and season stats' },
                { title: 'Circuits',      desc: 'History of every track in F1' },
              ].map(({ title, desc }) => (
                <div key={title} className="card card--mongo" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '0.35rem' }}>{title}</h3>
                  <p style={{ fontSize: '0.82rem' }}>{desc}</p>
                </div>
              ))}
            </div>

            <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Try searching "Monaco", "Hamilton", "Ferrari", "Spa" or "Red Bull"
            </p>
          </motion.div>
        )}

        {selected?.type === 'driver' && (
          <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DriverProfile driverId={selected.id} />
            <DriverGraph driverId={selected.id} driverName={selected.label} onSelect={setSelected} />
          </motion.div>
        )}

        {selected?.type === 'circuit' && (
          <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CircuitDetail circuitId={selected.id} />
          </motion.div>
        )}

        {selected?.type === 'constructor' && (
          <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ConstructorDetail constructorId={selected.id} />
            <ConstructorGraph constructorId={selected.id} constructorName={selected.label} onSelect={setSelected} />
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
