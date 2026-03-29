import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HOME_LIVE_POLL_INTERVAL } from '../constants'
import PageWrapper from '../components/layout/PageWrapper'
import DriverDrawer from '../components/ui/DriverDrawer'
import ConstructorDrawer from '../components/ui/ConstructorDrawer'
import { dashboardApi, telemetryApi } from '../services/api'
import NextRaceBanner from '../components/home/NextRaceBanner'
import LiveRacePanel from '../components/home/LiveRacePanel'
import LastSessionPanel from '../components/home/LastSessionPanel'
import HomeHero from '../components/home/HomeHero'
import HomeStandingsPanel from '../components/home/HomeStandingsPanel'
import HomeDbCardsGrid from '../components/home/HomeDbCardsGrid'
import HomeFooter from '../components/home/HomeFooter'
import { useBreakpoint } from '../hooks/useBreakpoint'
import BackendError from '../components/ui/BackendError'
import LiveTimingBanner from '../components/home/LiveTimingBanner'
import LiveConsoleDashboard from '../components/home/LiveConsoleDashboard'

export default function HomePage() {
  const { isMobile, isTablet } = useBreakpoint()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [standingsTab, setStandingsTab] = useState('drivers')
  const [liveData, setLiveData] = useState(null)
  const [tower,    setTower]    = useState(null)
  const [selectedDriver,      setSelectedDriver]      = useState(null)
  const [selectedConstructor, setSelectedConstructor] = useState(null)

  // Derived session state
  // A completed session older than 3 hours is treated as standby (no banner)
  const isRecentCompleted = tower?.completed && tower.updatedAt
    ? (Date.now() - new Date(tower.updatedAt).getTime()) < 3 * 60 * 60 * 1000
    : tower?.completed ?? false
  const sessionState = tower && !tower.completed ? 'live' : isRecentCompleted ? 'completed' : 'standby'
  const isLive = sessionState === 'live'

  useEffect(() => {
    dashboardApi.get()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  // Poll live race data (top-5 panel)
  useEffect(() => {
    let cancelled = false
    const poll = () => {
      dashboardApi.getLive()
        .then(d => { if (!cancelled) setLiveData((d?.isLive || d?.finished) ? d : null) })
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, HOME_LIVE_POLL_INTERVAL)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  // Poll timing tower — drives session state machine
  useEffect(() => {
    let cancelled = false
    const poll = () => {
      telemetryApi.getTimingTower()
        .then(d => { if (!cancelled) setTower(d ?? null) })
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return (
    <>
    <PageWrapper>

      <HomeHero race={data?.nextRace ?? null} />

      {!loading && data?.nextRace && (
        <NextRaceBanner race={data.nextRace} totalRounds={data.totalRounds} />
      )}

      {error && (
        <BackendError onRetry={() => {
          setError(false); setLoading(true)
          dashboardApi.get().then(setData).catch(() => setError(true)).finally(() => setLoading(false))
        }} />
      )}

      {/* ── Session state machine ──────────────────────────── */}
      <AnimatePresence mode="wait">
        {isLive ? (
          // LIVE MODE: full timing console + track radar
          <motion.div
            key="live-console"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <LiveConsoleDashboard tower={tower} isMobile={isMobile} />
          </motion.div>
        ) : (
          // STANDINGS MODE: normal dashboard layout
          <motion.div
            key="standings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Completed banner (shows summary when session just ended) */}
            <LiveTimingBanner tower={tower} />

            {/* Main grid: standings + last session */}
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
          </motion.div>
        )}
      </AnimatePresence>

      <HomeDbCardsGrid data={data} isMobile={isMobile} isTablet={isTablet} />

      <HomeFooter />

    </PageWrapper>

    <DriverDrawer driver={selectedDriver} onClose={() => setSelectedDriver(null)} />
    <ConstructorDrawer constructor={selectedConstructor} onClose={() => setSelectedConstructor(null)} />
    </>
  )
}
