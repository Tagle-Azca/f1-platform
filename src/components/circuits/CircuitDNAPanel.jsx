import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import { statsApi } from '../../services/api'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const DNA_DESC = {
  'Danger':     'Percentage of historical retirements (DNFs) at this circuit',
  'Pole Power': 'How often the pole-sitter goes on to win the race',
  'Overtaking': 'Drivers who gained 3+ positions during the race',
  'Heritage':   'How many F1 races this circuit has hosted (vs. all-time record)',
  'Domination': 'Winner concentration — few unique winners means high domination',
}

function computeDNA(races) {
  const allResults = races.flatMap(r => r.Results || [])
  const total = allResults.length
  if (!total) return null

  const dnfs = allResults.filter(r => {
    const s = r.status || ''
    return s !== 'Finished' && !/^\+\d+/.test(s)
  }).length
  const danger = Math.round((dnfs / total) * 100)

  const racesWithData = races.filter(r => (r.Results || []).length > 0)
  const poleWins = racesWithData.filter(r => {
    const winner = r.Results.find(res => res.position === '1')
    return winner?.grid === '1'
  }).length
  const polePower = Math.round((poleWins / (racesWithData.length || 1)) * 100)

  const classified = allResults.filter(r => !isNaN(parseInt(r.position)) && !isNaN(parseInt(r.grid)) && parseInt(r.grid) > 0)
  const overtakers = classified.filter(r => parseInt(r.grid) - parseInt(r.position) >= 3).length
  const overtaking = classified.length ? Math.round((overtakers / classified.length) * 100) : 0

  const heritage = Math.min(100, Math.round((races.length / 75) * 100))

  const winnerIds = new Set(
    races.map(r => r.Results?.find(res => res.position === '1')?.Driver?.driverId).filter(Boolean)
  )
  const dominio = Math.round((1 - winnerIds.size / Math.max(races.length, 1)) * 100)

  return [
    { metric: 'Danger',     value: danger     },
    { metric: 'Pole Power', value: polePower  },
    { metric: 'Overtaking', value: overtaking },
    { metric: 'Heritage',   value: heritage   },
    { metric: 'Domination', value: dominio    },
  ]
}

function topWinners(races, n = 6) {
  const wins = {}, names = {}
  for (const r of races) {
    const w = r.Results?.find(res => res.position === '1')
    if (w?.Driver?.driverId) {
      const id = w.Driver.driverId
      wins[id] = (wins[id] || 0) + 1
      names[id] = `${w.Driver.givenName} ${w.Driver.familyName}`
    }
  }
  return Object.entries(wins)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, count]) => ({ driverId: id, name: names[id], wins: count }))
}

function topConstructors(races, n = 5) {
  const wins = {}, names = {}
  for (const r of races) {
    const w = r.Results?.find(res => res.position === '1')
    if (w?.Constructor?.constructorId) {
      const id = w.Constructor.constructorId
      wins[id] = (wins[id] || 0) + 1
      names[id] = w.Constructor.name
    }
  }
  return Object.entries(wins)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, count]) => ({ constructorId: id, name: names[id], wins: count }))
}

function CustomDot({ cx, cy, payload, activeMetric }) {
  const isActive = payload.metric === activeMetric
  if (!isActive) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="#e10600" fillOpacity={0.2} />
      <circle cx={cx} cy={cy} r={5} fill="#e10600" />
    </g>
  )
}

function CustomTick({ x, y, payload, activeMetric, onHover }) {
  const isActive = payload.value === activeMetric
  return (
    <text
      x={x} y={y}
      fill={isActive ? '#e10600' : 'rgba(255,255,255,0.55)'}
      fontSize={11}
      fontWeight={isActive ? 900 : 700}
      fontFamily="'Barlow Condensed', sans-serif"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ cursor: 'pointer', transition: 'fill 0.15s' }}
      onMouseEnter={() => onHover(payload.value)}
      onMouseLeave={() => onHover(null)}
    >
      {payload.value}
    </text>
  )
}

export default function CircuitDNAPanel({ circuit }) {
  const { isMobile } = useBreakpoint()
  const [data,         setData]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [activeMetric, setActiveMetric] = useState(null)

  useEffect(() => {
    setData(null)
    setLoading(true)
    statsApi.circuitHistory(circuit.circuitId)
      .then(res => {
        const races = res?.races || []
        setData({ dna: computeDNA(races), winners: topWinners(races), constructors: topConstructors(races), total: races.length })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [circuit.circuitId])

  const maxWins = data?.winners?.[0]?.wins ?? 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{
        background: 'rgba(22,22,22,0.92)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderLeft: '3px solid rgba(255,255,255,0.25)',
        borderRadius: 12,
        padding: '1rem 1.25rem',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
          Circuit DNA
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Historical character analysis · {data?.total ?? '—'} races · MongoDB
        </div>
      </div>

      {loading && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '1rem 0' }}>Analysing circuit history...</div>
      )}

      {!loading && data && (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.5rem', alignItems: 'flex-start' }}>

          {data.dna && (
            <div style={{ flex: isMobile ? 'unset' : '0 0 260px', width: isMobile ? '100%' : 'auto' }}>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={data.dna} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={props => <CustomTick {...props} activeMetric={activeMetric} onHover={setActiveMetric} />}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    dataKey="value"
                    stroke="#e10600" fill="#e10600" fillOpacity={0.18} strokeWidth={1.5}
                    dot={props => <CustomDot {...props} activeMetric={activeMetric} />}
                    activeDot={false}
                  />
                </RadarChart>
              </ResponsiveContainer>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                {data.dna.map(d => {
                  const isActive = d.metric === activeMetric
                  const accent = d.value >= 70 ? '#e10600' : d.value >= 40 ? '#f59e0b' : '#22c55e'
                  return (
                    <div
                      key={d.metric}
                      onMouseEnter={() => setActiveMetric(d.metric)}
                      onMouseLeave={() => setActiveMetric(null)}
                      onClick={() => setActiveMetric(v => v === d.metric ? null : d.metric)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.55rem',
                        background: isActive ? 'rgba(225,6,0,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? 'rgba(225,6,0,0.3)' : 'transparent'}`,
                        borderRadius: 6,
                        padding: '0.3rem 0.6rem',
                        cursor: 'pointer',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                    >
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: '1.05rem', fontWeight: 900,
                        color: accent, lineHeight: 1,
                        width: 28, textAlign: 'right', flexShrink: 0,
                      }}>
                        {d.value}<span style={{ fontSize: '0.6rem', fontWeight: 700 }}>%</span>
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: isActive ? '#fff' : 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.2, transition: 'color 0.15s' }}>
                          {d.metric}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.3, marginTop: 1 }}>
                          {DNA_DESC[d.metric]}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!isMobile && <div style={{ width: 1, background: 'rgba(255,255,255,0.07)', alignSelf: 'stretch', flexShrink: 0 }} />}

          {(data.winners.length > 0 || data.constructors?.length > 0) && (
            <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {data.winners.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                    All-time winners
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {data.winners.map((w, i) => (
                      <div key={w.driverId} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <span style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: '0.75rem', fontWeight: 700,
                          color: i === 0 ? '#e10600' : 'rgba(255,255,255,0.22)',
                          width: 14, textAlign: 'right', flexShrink: 0,
                        }}>{i + 1}</span>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(w.wins / maxWins) * 100}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                            style={{ height: '100%', borderRadius: 2, background: i === 0 ? '#e10600' : 'rgba(255,255,255,0.28)' }}
                          />
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: i === 0 ? 700 : 400, color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', minWidth: 120 }}>
                          {w.name}
                        </div>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.85rem', fontWeight: 700, color: i === 0 ? '#e10600' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                          {w.wins}×
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.constructors?.length > 0 && (() => {
                const maxCWins = data.constructors[0].wins
                return (
                  <div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                      Top constructors
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {data.constructors.map((c, i) => (
                        <div key={c.constructorId} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <span style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: '0.75rem', fontWeight: 700,
                            color: i === 0 ? '#e10600' : 'rgba(255,255,255,0.22)',
                            width: 14, textAlign: 'right', flexShrink: 0,
                          }}>{i + 1}</span>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(c.wins / maxCWins) * 100}%` }}
                              transition={{ duration: 0.6, delay: i * 0.05 }}
                              style={{ height: '100%', borderRadius: 2, background: i === 0 ? '#e10600' : 'rgba(255,255,255,0.28)' }}
                            />
                          </div>
                          <div style={{ fontSize: '0.78rem', fontWeight: i === 0 ? 700 : 400, color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', minWidth: 120 }}>
                            {c.name}
                          </div>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.85rem', fontWeight: 700, color: i === 0 ? '#e10600' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                            {c.wins}×
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {!loading && !data && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No historical data available for this circuit.</div>
      )}
    </motion.div>
  )
}
