import { useState, useEffect, useRef, useMemo } from 'react'
import PageWrapper               from '../components/layout/PageWrapper'
import ChampionshipChart         from '../components/standings/ChampionshipChart'
import ConstructorLeaderBanner   from '../components/standings/ConstructorLeaderBanner'
import ConstructorStandingsTable from '../components/standings/ConstructorStandingsTable'
import { statsApi }              from '../services/api'
import { CTOR_COLORS }           from '../utils/teamColors'

const currentYear = new Date().getFullYear()

function ctorColor(constructorId, idx) {
  return CTOR_COLORS[constructorId] || `hsl(${(idx * 53 + 20) % 360}, 65%, 58%)`
}

export default function ConstructorStandingsPage() {
  const [season,        setSeason]        = useState(String(currentYear))
  const [data,          setData]          = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [visibleRounds, setVisibleRounds] = useState(999)
  const [isPlaying,     setIsPlaying]     = useState(false)
  const playRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setData(null)
    setVisibleRounds(999)
    setIsPlaying(false)
    statsApi.getConstructorStandings(season)
      .then(d => { setData(d); setVisibleRounds(d.rounds.length) })
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

  const { chartData, drivers } = useMemo(() => {
    if (!data) return { chartData: [], drivers: [] }
    const capped = Math.min(visibleRounds, data.rounds.length)
    const chartData = data.rounds.slice(0, capped).map((round, idx) => {
      const entry = { _round: idx + 1 }
      for (const c of data.constructors) entry[c.constructorId] = c.cumulative[idx]
      return entry
    })
    // Map constructors into the same shape ChampionshipChart expects (uses driverId key)
    const drivers = data.constructors.map((c, i) => ({
      driverId: c.constructorId,   // reuse driverId slot for the chart key
      name:     c.name,
      color:    ctorColor(c.constructorId, i),
      finalPoints: c.finalPoints,
      cumulative:  c.cumulative,
    }))
    return { chartData, drivers }
  }, [data, visibleRounds])

  const totalRounds  = data?.rounds.length ?? 0
  const capped       = Math.min(visibleRounds, totalRounds)
  const currentRound = data?.rounds[capped - 1]
  const seasons      = Array.from({ length: currentYear - 1949 }, (_, i) => String(currentYear - i))
  const isLive       = season === String(currentYear)

  const currentStandings = useMemo(() => {
    if (!chartData.length || !drivers.length) return []
    const last = chartData[chartData.length - 1]
    return [...drivers]
      .map(d => ({ ...d, pts: last[d.driverId] ?? 0 }))
      .sort((a, b) => b.pts - a.pts)
  }, [chartData, drivers])

  const leader = currentStandings[0]
  const gap    = currentStandings.length >= 2
    ? currentStandings[0].pts - currentStandings[1].pts
    : null

  return (
    <PageWrapper>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page__title" style={{ marginBottom: 0 }}>Constructor Championship</h1>
          <p className="page__subtitle" style={{ marginBottom: 0 }}>Points evolution round by round</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="db-badge db-badge--mongo">MongoDB</span>
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

      {leader && !loading && (
        <ConstructorLeaderBanner leader={leader} gap={gap} isLive={isLive} season={season} />
      )}

      {/* Chart + Table */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <ChampionshipChart
          chartData={chartData}
          drivers={drivers}
          data={data ? { ...data, rounds: data.rounds } : null}
          loading={loading}
          season={season}
          isPlaying={isPlaying}
          capped={capped}
          totalRounds={totalRounds}
          currentRound={currentRound}
          onPlayPause={handlePlayPause}
          onScrub={handleScrub}
        />
        <ConstructorStandingsTable
          currentStandings={currentStandings}
          currentRound={currentRound}
          loading={loading}
        />
      </div>
    </PageWrapper>
  )
}
