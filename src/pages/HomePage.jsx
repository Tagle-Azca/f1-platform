import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import DriverDrawer from '../components/ui/DriverDrawer'
import ConstructorDrawer from '../components/ui/ConstructorDrawer'
import { dashboardApi } from '../services/api'
import NextRaceBanner from '../components/home/NextRaceBanner'
import LiveRacePanel from '../components/home/LiveRacePanel'
import LastSessionPanel from '../components/home/LastSessionPanel'
import HomeHero from '../components/home/HomeHero'
import HomeStandingsPanel from '../components/home/HomeStandingsPanel'
import HomeDbCardsGrid from '../components/home/HomeDbCardsGrid'
import HomeFooter from '../components/home/HomeFooter'
import { useBreakpoint } from '../hooks/useBreakpoint'
import BackendError from '../components/ui/BackendError'

export default function HomePage() {
  const { isMobile, isTablet } = useBreakpoint()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [standingsTab, setStandingsTab] = useState('drivers')
  const [liveData, setLiveData] = useState(null)
  const [selectedDriver,      setSelectedDriver]      = useState(null)
  const [selectedConstructor, setSelectedConstructor] = useState(null)

  useEffect(() => {
    dashboardApi.get()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  // Poll live race data every 5 seconds
  useEffect(() => {
    let cancelled = false
    const poll = () => {
      dashboardApi.getLive()
        .then(d => { if (!cancelled) setLiveData((d?.isLive || d?.finished) ? d : null) })
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return (
    <>
    <PageWrapper>

      {!loading && data?.nextRace && (
        <NextRaceBanner race={data.nextRace} totalRounds={data.totalRounds} />
      )}

      <HomeHero />

      {error && (
        <BackendError onRetry={() => {
          setError(false); setLoading(true)
          dashboardApi.get().then(setData).catch(() => setError(true)).finally(() => setLoading(false))
        }} />
      )}

      {/* Main Grid: standings + last race */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr', gap: '1rem', marginBottom: '1rem' }}>
        <HomeStandingsPanel
          data={data}
          loading={loading}
          standingsTab={standingsTab}
          onTabChange={setStandingsTab}
          onDriverClick={setSelectedDriver}
          onConstructorClick={setSelectedConstructor}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {liveData ? <LiveRacePanel live={liveData} /> : (
            <LastSessionPanel session={data?.lastSession} loading={loading} onDriverClick={setSelectedDriver} />
          )}
        </motion.div>
      </div>

      <HomeDbCardsGrid data={data} isMobile={isMobile} isTablet={isTablet} />

      <HomeFooter />

    </PageWrapper>

    <DriverDrawer driver={selectedDriver} onClose={() => setSelectedDriver(null)} />
    <ConstructorDrawer constructor={selectedConstructor} onClose={() => setSelectedConstructor(null)} />
    </>
  )
}
