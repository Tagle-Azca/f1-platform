import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { HOME_LIVE_POLL_INTERVAL } from '../constants'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'
import DriverDrawer from '../components/ui/DriverDrawer'
// Lazy: the drawer pulls in the constructor detail charts (recharts), which must not weigh on the Dashboard chunk.
const ConstructorDrawer = lazy(() => import('../components/ui/ConstructorDrawer'))
import { dashboardApi, telemetryApi } from '../services/api'
import HomeFooter from '../components/home/HomeFooter'
import { getDashboardWidgets } from '../components/dashboard/widgetRegistry'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useLiveStatus } from '../contexts/LiveStatusContext'
import { useNow } from '../hooks/useNow'
import { normalizeDashboard } from '../utils/normalizeDashboard'

export default function HomePage() {
  const { width } = useBreakpoint()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [standingsTab, setStandingsTab] = useState('drivers')
  const [rawLiveData, setLiveData] = useState(null)
  const [tower,    setTower]    = useState(null)
  const [selectedDriver,      setSelectedDriver]      = useState(null)
  const [selectedConstructor, setSelectedConstructor] = useState(null)
  const { available: liveAvailable } = useLiveStatus() ?? {}
  const now = useNow(60000)
  const liveData = liveAvailable ? rawLiveData : null

  // A completed session older than 3 hours is treated as standby
  const isRecentCompleted = tower?.completed && tower.updatedAt
    ? (now - new Date(tower.updatedAt).getTime()) < 3 * 60 * 60 * 1000
    : tower?.completed ?? false
  const sessionState = tower && !tower.completed ? 'live' : isRecentCompleted ? 'completed' : 'standby'
  const isLive = sessionState === 'live'

  const fetchDashboard = useCallback(() => {
    dashboardApi.get()
      .then(d => setData(normalizeDashboard(d)))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])
  const load = useCallback(() => { setError(false); setLoading(true); fetchDashboard() }, [fetchDashboard])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  // Poll live race data (top-5 panel): only while the SSE status says a session is live
  useEffect(() => {
    if (!liveAvailable) return
    let cancelled = false
    const poll = () => {
      dashboardApi.getLive()
        .then(d => { if (!cancelled) setLiveData((d?.isLive || d?.finished) ? d : null) })
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, HOME_LIVE_POLL_INTERVAL)
    return () => { cancelled = true; clearInterval(id) }
  }, [liveAvailable])

  // Poll timing tower: drives the live-session state
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

  const ctx = {
    data, loading, error, onRetry: load, liveData, tower,
    standingsTab, onTabChange: setStandingsTab,
    onDriverClick: setSelectedDriver, onConstructorClick: setSelectedConstructor,
  }
  const widgets = getDashboardWidgets({ width, isLive })

  return (
    <>
      <PageWrapper stagger>
        <h1 className="sr-only">Dashboard</h1>
        <div className="grid grid-cols-1 gap-x-pw-6 gap-y-pw-7 lg:grid-cols-12 lg:gap-y-pw-8">
          {widgets.map(({ id, component: Widget, className }, i) => (
            <Rise key={id} index={i} data-widget={id} className={`min-w-0 ${className ?? ''}`}>
              <Widget ctx={ctx} />
            </Rise>
          ))}
        </div>
        <HomeFooter />
      </PageWrapper>

      <DriverDrawer driver={selectedDriver} onClose={() => setSelectedDriver(null)} />
      {selectedConstructor && (
        <Suspense fallback={null}>
          <ConstructorDrawer constructor={selectedConstructor} onClose={() => setSelectedConstructor(null)} />
        </Suspense>
      )}
    </>
  )
}
