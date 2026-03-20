import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper           from '../components/layout/PageWrapper'
import SearchBox             from '../components/encyclopedia/SearchBox'
import DriverProfile         from '../components/encyclopedia/DriverProfile'
import DriverGraph           from '../components/encyclopedia/DriverGraph'
import CircuitDetail         from '../components/encyclopedia/CircuitDetail'
import ConstructorDetail     from '../components/encyclopedia/ConstructorDetail'
import ConstructorGraph      from '../components/encyclopedia/ConstructorGraph'
import EncyclopediaEmptyState from '../components/encyclopedia/EncyclopediaEmptyState'
import PageHint              from '../components/ui/PageHint'

const CY    = new Date().getFullYear()
const YEARS = Array.from({ length: CY - 1949 }, (_, i) => String(CY - i))

export default function EncyclopediaPage() {
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()
  const location = useLocation()
  const [selected,     setSelected]     = useState(null)
  const [bannerSeason, setBannerSeason] = useState(String(CY))

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
      <p className="page__subtitle">The full history of F1 since 1950 · Data from MongoDB</p>

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
            <EncyclopediaEmptyState
              bannerSeason={bannerSeason}
              onSeasonChange={setBannerSeason}
              years={YEARS}
              isMobile={isMobile}
              onSelect={handleSelect}
            />
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
