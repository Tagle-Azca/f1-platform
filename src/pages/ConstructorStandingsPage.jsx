import { useState, useEffect, useRef, useMemo } from 'react'
import PageWrapper       from '../components/layout/PageWrapper'
import ChampionshipChart from '../components/standings/ChampionshipChart'
import { statsApi }      from '../services/api'
import { CTOR_COLORS }   from '../utils/teamColors'

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

      {/* Leader banner */}
      {leader && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
          padding: '0.65rem 1.1rem', marginBottom: '1rem',
          background: `linear-gradient(135deg, ${leader.color}18, transparent)`,
          border: `1px solid ${leader.color}33`,
          borderLeft: `3px solid ${leader.color}`,
          borderRadius: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: leader.color }} />
            <span style={{ fontWeight: 800, color: leader.color, fontSize: '1rem' }}>{leader.name}</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isLive && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.2rem 0.6rem',
                background: 'rgba(225,6,0,0.1)',
                border: '1px solid rgba(225,6,0,0.25)',
                borderRadius: 99,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--f1-red)', animation: 'pulse 2s infinite' }} />
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '0.65rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'rgba(225,6,0,0.85)',
                }}>
                  Live Season · Updated weekly
                </span>
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: leader.color, fontSize: '1.1rem' }}>{leader.pts} pts</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {isLive ? 'Current leader' : `Champion ${season}`}
              </div>
            </div>
          </div>

          {gap !== null && gap > 0 && (
            <div style={{ padding: '0.3rem 0.7rem', background: 'rgba(28,28,28,0.92)', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Current lead</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>+{gap} pts</div>
            </div>
          )}
        </div>
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

        {/* Standings table */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.7rem' }}>
              CONSTRUCTORS{currentRound ? ` · ${currentRound.raceName}` : ''}
            </div>
            {currentStandings.map((c, i) => {
              const prev      = currentStandings[i - 1]
              const gapToPrev = prev ? prev.pts - c.pts : null
              return (
                <div key={c.driverId} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.38rem 0',
                  borderBottom: i < currentStandings.length - 1 ? '1px solid rgba(255,255,255,0.09)' : 'none',
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: i === 0 ? c.color : 'var(--text-muted)', width: 18, textAlign: 'right', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <span style={{
                    fontSize: '0.77rem',
                    color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: i === 0 ? 700 : 400,
                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {c.name}
                  </span>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: i === 0 ? c.color : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {c.pts}
                    </div>
                    {gapToPrev !== null && gapToPrev > 0 && (
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        -{gapToPrev}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {!currentStandings.length && !loading && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No data</p>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
