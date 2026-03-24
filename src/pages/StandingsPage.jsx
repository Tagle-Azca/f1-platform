import { useState, useEffect, useRef, useMemo } from 'react'
import PageWrapper        from '../components/layout/PageWrapper'
import ChampionBanner     from '../components/standings/ChampionBanner'
import ChampionshipChart  from '../components/standings/ChampionshipChart'
import StandingsTable     from '../components/standings/StandingsTable'
import StandingsHeader    from '../components/standings/StandingsHeader'
import LiveRaceBanner     from '../components/standings/LiveRaceBanner'
import { driverColor, CTOR_COLORS } from '../utils/teamColors'
import { statsApi, dashboardApi }   from '../services/api'
import { useBreakpoint }            from '../hooks/useBreakpoint'
import PageHint                     from '../components/ui/PageHint'
import DriverDrawer                 from '../components/ui/DriverDrawer'
import ConstructorDrawer            from '../components/ui/ConstructorDrawer'
import EmptyState                   from '../components/ui/EmptyState'

export default function StandingsPage() {
  const { isMobile } = useBreakpoint()
  const currentYear = new Date().getFullYear()
  const [season,        setSeason]        = useState(String(currentYear))
  const [tab,           setTab]           = useState('wdc')
  const [data,          setData]          = useState(null)
  const [ctorData,      setCtorData]      = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(false)
  const [visibleRounds, setVisibleRounds] = useState(999)
  const [isPlaying,     setIsPlaying]     = useState(false)
  const [liveData,      setLiveData]      = useState(null)
  const [selectedDriver,      setSelectedDriver]      = useState(null)
  const [selectedConstructor, setSelectedConstructor] = useState(null)
  const playRef = useRef(null)

  // Poll live race data every 15s
  useEffect(() => {
  let cancelled = false

  const poll = async () => {
    try {
      const d = await dashboardApi.getLive()
      if (!cancelled) setLiveData(d?.isLive ? d : null)
    } catch {}

    if (!cancelled) {
      setTimeout(poll, 3000)
    }
  }

  poll()

  return () => { cancelled = true }
}, [])

  useEffect(() => {
    setLoading(true)
    setError(false)
    setData(null)
    setCtorData(null)
    setVisibleRounds(999)
    setIsPlaying(false)
    Promise.all([
      statsApi.getSeasonStandings(season),
      statsApi.getConstructorStandings(season),
    ])
      .then(([d, c]) => {
        setData(d)
        setCtorData(c)
        setVisibleRounds(d.rounds.length)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [season])

  useEffect(() => {
    if (!isPlaying || !data) return
    playRef.current = setInterval(() => {
      setVisibleRounds(v => {
        if (v >= data.rounds.length) {
          setIsPlaying(false)
          clearInterval(playRef.current)
          return data.rounds.length
        }
        return v + 1
      })
    }, 650)
    return () => clearInterval(playRef.current)
  }, [isPlaying, data])

  function handlePlayPause() {
    if (!data) return
    if (visibleRounds >= data.rounds.length) {
      setVisibleRounds(1)
      setIsPlaying(true)
    } else {
      setIsPlaying(v => !v)
    }
  }

  function handleScrub(val) {
    setIsPlaying(false)
    setVisibleRounds(val)
  }

  // WDC chart data — full (for rendering) + capped (for standings table)
  const { chartData, fullChartData, drivers } = useMemo(() => {
    if (!data) return { chartData: [], fullChartData: [], drivers: [] }
    const cappedN = Math.min(visibleRounds, data.rounds.length)
    const full = data.rounds.map((_, idx) => {
      const entry = { _round: idx + 1 }
      for (const d of data.drivers) entry[d.driverId] = d.cumulative[idx]
      return entry
    })
    const drivers = data.drivers.map((d, i) => ({ ...d, color: driverColor(d.teamId, i) }))
    return { chartData: full.slice(0, cappedN), fullChartData: full, drivers }
  }, [data, visibleRounds])

  // WCC chart data — full + capped
  const { ctorChartData, fullCtorChartData, ctors } = useMemo(() => {
    if (!ctorData) return { ctorChartData: [], fullCtorChartData: [], ctors: [] }
    const cappedN = Math.min(visibleRounds, ctorData.rounds.length)
    const full = ctorData.rounds.map((_, idx) => {
      const entry = { _round: idx + 1 }
      for (const c of ctorData.constructors) entry[c.constructorId] = c.cumulative[idx]
      return entry
    })
    const ctors = ctorData.constructors.map((c, i) => ({
      driverId:    c.constructorId,
      name:        c.name,
      color:       CTOR_COLORS[c.constructorId] || `hsl(${(i * 53 + 20) % 360}, 65%, 58%)`,
      finalPoints: c.finalPoints,
    }))
    return { ctorChartData: full.slice(0, cappedN), fullCtorChartData: full, ctors }
  }, [ctorData, visibleRounds])

  const isWCC           = tab === 'wcc'
  const activeData      = isWCC ? ctorData        : data
  const activeChart     = isWCC ? ctorChartData   : chartData
  const activeFullChart = isWCC ? fullCtorChartData : fullChartData
  const activeItems     = isWCC ? ctors           : drivers

  const champion      = isWCC ? (ctors[0] ?? null) : drivers[0]
  const totalRounds   = activeData?.rounds.length ?? 0
  const capped        = Math.min(visibleRounds, totalRounds)
  const currentRound  = activeData?.rounds[capped - 1]
  const seasons       = Array.from({ length: currentYear - 1949 }, (_, i) => String(currentYear - i))

  const currentStandings = useMemo(() => {
    if (!activeChart.length || !activeItems.length) return []
    const last = activeChart[activeChart.length - 1]
    return [...activeItems]
      .map(d => ({ ...d, pts: last[d.driverId] ?? 0 }))
      .sort((a, b) => b.pts - a.pts)
  }, [activeChart, activeItems])

  const gap = currentStandings.length >= 2
    ? currentStandings[0].pts - currentStandings[1].pts
    : null

  return (
    <>
    <PageWrapper>
      <PageHint
        id="standings"
        title="Championship Battle"
        text="Use the slider or Play button to animate the season round by round. Switch between WDC and WCC to see drivers or constructors."
      />
      <StandingsHeader
        season={season}
        onSeasonChange={setSeason}
        seasons={seasons}
        tab={tab}
        onTabChange={setTab}
      />

      {liveData && <LiveRaceBanner liveData={liveData} />}

      {error && <EmptyState type="error" />}

      {champion && !loading && (
        <ChampionBanner champion={champion} gap={gap} season={season} />
      )}

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', alignItems: isMobile ? 'stretch' : 'flex-start' }}>
        <ChampionshipChart
          chartData={activeChart}
          fullChartData={activeFullChart}
          drivers={activeItems}
          data={activeData}
          loading={loading}
          season={season}
          isPlaying={isPlaying}
          capped={capped}
          totalRounds={totalRounds}
          currentRound={currentRound}
          onPlayPause={handlePlayPause}
          onScrub={handleScrub}
        />
        <StandingsTable
          currentStandings={currentStandings}
          currentRound={currentRound}
          season={season}
          loading={loading}
          onDriverClick={isMobile ? undefined : (item) => {
            if (isWCC) setSelectedConstructor({ constructorId: item.driverId, name: item.name })
            else       setSelectedDriver(item)
          }}
        />
      </div>
    </PageWrapper>
    {!isMobile && <>
      <DriverDrawer      driver={selectedDriver}      onClose={() => setSelectedDriver(null)} />
      <ConstructorDrawer constructor={selectedConstructor} onClose={() => setSelectedConstructor(null)} />
    </>}
    </>
  )
}
