import { useState, useEffect, useRef, useMemo } from 'react'
import PageWrapper        from '../components/layout/PageWrapper'
import ChampionBanner     from '../components/standings/ChampionBanner'
import ChampionshipChart  from '../components/standings/ChampionshipChart'
import StandingsTable     from '../components/standings/StandingsTable'
import { driverColor, CTOR_COLORS } from '../utils/teamColors'
import { statsApi, dashboardApi }   from '../services/api'
import { useBreakpoint }            from '../hooks/useBreakpoint'
import PageHint                     from '../components/ui/PageHint'
import DriverDrawer                 from '../components/ui/DriverDrawer'
import ConstructorDrawer            from '../components/ui/ConstructorDrawer'

export default function StandingsPage() {
  const { isMobile } = useBreakpoint()
  const currentYear = new Date().getFullYear()
  const [season,        setSeason]        = useState(String(currentYear))
  const [tab,           setTab]           = useState('wdc')
  const [data,          setData]          = useState(null)
  const [ctorData,      setCtorData]      = useState(null)
  const [loading,       setLoading]       = useState(false)
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
      .catch(() => {})
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page__title" style={{ marginBottom: 0 }}>Championship Battle</h1>
          <p className="page__subtitle" style={{ marginBottom: 0 }}>Points evolution round by round</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* WDC / WCC tabs */}
          {[['wdc', 'WDC'], ['wcc', 'WCC']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '0.3rem 0.85rem', borderRadius: 6,
                border: `1px solid ${tab === key ? 'rgba(225,6,0,0.8)' : 'rgba(255,255,255,0.1)'}`,
                background: tab === key ? 'rgba(255, 10, 2, 0.7)' : 'transparent',
                color: tab === key ? '#FFFDFD' : 'rgba(255,255,255,0.4)',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
          <select
            className="input"
            style={{ width: 115 }}
            value={season}
            onChange={e => setSeason(e.target.value)}
          >
            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ── Live race banner ─────────────────────────── */}
      {liveData && (
        <div style={{
          marginBottom: '0.85rem',
          background: 'rgba(225,6,0,0.08)',
          border: '1px solid rgba(225,6,0,0.35)',
          borderLeft: '3px solid #e10600',
          borderRadius: 10,
          padding: '0.65rem 1rem',
          display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
        }}>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#e10600',
              boxShadow: '0 0 6px #e10600',
              animation: 'pulse 1.4s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: '#e10600', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              LIVE
            </span>
          </div>

          <div style={{ flexShrink: 0 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {liveData.raceName}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {liveData.sessionName}{liveData.currentLap ? ` · Lap ${liveData.currentLap}${liveData.totalLaps ? `/${liveData.totalLaps}` : ''}` : ''}
            </div>
          </div>

          {/* Top 3 */}
          {liveData.top3?.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {liveData.top3.slice(0, 5).map((d, i) => (
                <div key={d.driverId || i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  background: 'rgba(255,255,255,0.04)', borderRadius: 6,
                  padding: '0.2rem 0.55rem',
                }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: i === 0 ? '#e10600' : 'rgba(255,255,255,0.35)', width: 14, textAlign: 'right' }}>
                    {d.position ?? i + 1}
                  </span>
                  <div style={{ width: 3, height: 14, borderRadius: 2, background: d.color || CTOR_COLORS[d.teamId] || '#888', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.8rem', fontWeight: 700, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                    {d.acronym}
                  </span>
                  {d.interval && (
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginLeft: 2 }}>
                      {d.interval}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
            {new Date(liveData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      )}

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
