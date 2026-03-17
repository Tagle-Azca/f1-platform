import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import PageHeader from '../components/layout/PageHeader'
import Panel from '../components/ui/Panel'
import ControlGroup from '../components/ui/ControlGroup'
import DbOfflineBanner from '../components/ui/DbOfflineBanner'
import EmptyState from '../components/ui/EmptyState'
import AccentBanner from '../components/ui/AccentBanner'
import { telemetryApi } from '../services/api'

const COMPOUND_COLOR = {
  SOFT:         { bg: '#e8002d', label: '#fff' },
  MEDIUM:       { bg: '#ffd600', label: '#111' },
  HARD:         { bg: '#e0e0e0', label: '#111' },
  INTERMEDIATE: { bg: '#39b54a', label: '#fff' },
  WET:          { bg: '#0067ff', label: '#fff' },
  UNKNOWN:      { bg: 'repeating-linear-gradient(45deg,#444 0px,#444 4px,#2a2a2a 4px,#2a2a2a 8px)', label: 'rgba(255,255,255,0.55)' },
}

const COMPOUND_ABBR = {
  SOFT: 'S', MEDIUM: 'M', HARD: 'H', INTERMEDIATE: 'I', WET: 'W', UNKNOWN: '?',
}

function compound(raw = '') {
  const key = raw.toUpperCase()
  return COMPOUND_COLOR[key] ? key : 'UNKNOWN'
}

export default function TireStrategyPage() {
  const [races,    setRaces]    = useState([])
  const [year,     setYear]     = useState('')
  const [raceId,   setRaceId]   = useState('')
  const [strategy, setStrategy] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [dbOffline,setDbOffline]= useState(false)

  useEffect(() => {
    telemetryApi.getAvailableRaces()
      .then(data => {
        setRaces(data)
        const years = [...new Set(data.map(r => r.raceId.split('_')[0]))].sort((a,b) => b-a)
        if (years.length) {
          setYear(years[0])
          const first = data.filter(r => r.raceId.startsWith(years[0]))[0]
          if (first) setRaceId(first.raceId)
        }
      })
      .catch(e => { if (e.message?.includes('503')) setDbOffline(true) })
  }, [])

  // When year changes, reset to first race of that year
  function handleYearChange(y) {
    setYear(y)
    const first = races.filter(r => r.raceId.startsWith(y + '_'))[0]
    if (first) setRaceId(first.raceId)
  }

  const years      = [...new Set(races.map(r => r.raceId.split('_')[0]))].sort((a,b) => b-a)
  const racesOfYear = races.filter(r => r.raceId.startsWith(year + '_'))

  useEffect(() => {
    if (!raceId) return
    setLoading(true)
    setStrategy([])
    telemetryApi.getTireStrategy(raceId)
      .then(setStrategy)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [raceId])

  // Total laps = max lap_end across all stints
  const totalLaps = strategy.length
    ? Math.max(...strategy.flatMap(d => d.stints.map(s => s.lapEnd)))
    : 0

  const raceName = races.find(r => r.raceId === raceId)?.raceName || ''

  return (
    <PageWrapper>

      <PageHeader
        title="Tire Strategy"
        subtitle="Compound stints per driver · full race at a glance"
        badge="cassandra"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <ControlGroup label="Season" width={90}>
              <select
                className="input"
                style={{ width: 90 }}
                value={year}
                onChange={e => handleYearChange(e.target.value)}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </ControlGroup>
            <ControlGroup label="Race" width={200}>
              <select
                className="input"
                style={{ width: 200 }}
                value={raceId}
                onChange={e => setRaceId(e.target.value)}
              >
                {racesOfYear.map(r => <option key={r.raceId} value={r.raceId}>{r.raceName}</option>)}
              </select>
            </ControlGroup>
          </div>
        }
      />

      {/* Data notice */}
      <AccentBanner
        color="var(--cassandra-color)"
        padding="sm"
        radius={8}
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}
      >
        <span style={{ color: 'var(--cassandra-color)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.06em' }}>
          DATA AVAILABILITY
        </span>
        Tire strategy data is available from the 2023 season onward via OpenF1.
      </AccentBanner>

      {dbOffline && (
        <div style={{ marginBottom: '1rem' }}>
          <DbOfflineBanner
            db="cassandra"
            message={<>Database not running. Start Cassandra and run <code style={{ color: 'var(--cassandra-color)' }}>npm run seed -- --cassandra</code></>}
          />
        </div>
      )}

      {/* Compound legend */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {Object.entries(COMPOUND_COLOR).map(([key, { bg, label }]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{
              width: 22, height: 14, borderRadius: 3,
              background: bg, border: '1px solid rgba(255,255,255,0.12)',
            }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              {key === 'UNKNOWN' ? '? Not recorded' : key.charAt(0) + key.slice(1).toLowerCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <Panel padding="none" className="card" style={{ padding: '1rem 1.25rem', overflowX: 'auto' }}>
        {loading && (
          <EmptyState type="loading" message="Loading strategy..." height={200} />
        )}

        {!loading && !strategy.length && !dbOffline && (
          <EmptyState type="empty" message="Select a race to view tire strategy" height={200} />
        )}

        {!loading && strategy.length > 0 && (
          <div style={{ minWidth: 600 }}>
            {/* Lap axis header */}
            <div style={{ display: 'flex', marginBottom: '0.5rem', paddingLeft: 72 }}>
              <div style={{ flex: 1, position: 'relative', height: 16 }}>
                {Array.from({ length: Math.ceil(totalLaps / 10) }, (_, i) => {
                  const lap = (i + 1) * 10
                  if (lap > totalLaps) return null
                  return (
                    <span key={lap} style={{
                      position: 'absolute',
                      left: `${(lap / totalLaps) * 100}%`,
                      transform: 'translateX(-50%)',
                      fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {lap}
                    </span>
                  )
                })}
                <span style={{
                  position: 'absolute', right: 0,
                  fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)',
                }}>
                  L{totalLaps}
                </span>
              </div>
            </div>

            {/* Driver rows */}
            {strategy.map(driver => {
              const lastLap = Math.max(...driver.stints.map(s => s.lapEnd))
              const dnf     = lastLap < totalLaps - 1
              return (
              <div key={driver.driverId} style={{
                display: 'flex', alignItems: 'center',
                gap: '0.5rem', marginBottom: '0.4rem',
              }}>
                {/* Driver label */}
                <div style={{
                  width: 64, flexShrink: 0, textAlign: 'right',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '0.78rem', fontWeight: 700,
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.05em',
                }}>
                  {driver.acronym}
                </div>

                {/* Stint bars */}
                <div style={{
                  flex: 1, height: 28, position: 'relative',
                  background: 'rgba(22,22,22,0.9)',
                  borderRadius: 5, overflow: 'hidden',
                  opacity: dnf ? 0.75 : 1,
                }}>
                  {dnf && (
                    <div style={{
                      position: 'absolute',
                      left: `${(lastLap / totalLaps) * 100}%`,
                      top: 0, bottom: 0, width: 2,
                      background: 'rgba(239,68,68,0.7)',
                      zIndex: 2,
                    }} />
                  )}
                  {dnf && (
                    <div style={{
                      position: 'absolute',
                      left: `${(lastLap / totalLaps) * 100}%`,
                      top: 0, bottom: 0, width: 2,
                      background: 'rgba(239,68,68,0.7)',
                      zIndex: 2,
                    }} />
                  )}
                  {driver.stints.map(stint => {
                    const cKey  = compound(stint.compound)
                    const color = COMPOUND_COLOR[cKey]
                    const left  = ((stint.lapStart - 1) / totalLaps) * 100
                    const width = ((stint.lapEnd - stint.lapStart + 1) / totalLaps) * 100
                    const laps  = stint.lapEnd - stint.lapStart + 1

                    return (
                      <div
                        key={stint.stintNumber}
                        title={`${cKey} · Laps ${stint.lapStart}–${stint.lapEnd} (${laps} laps)${stint.tyreAge > 0 ? ` · Tyre age: ${stint.tyreAge} laps` : ''}`}
                        style={{
                          position: 'absolute',
                          left:   `${left}%`,
                          width:  `${width}%`,
                          top: 0, bottom: 0,
                          background: color.bg,
                          borderRight: '2px solid rgba(0,0,0,0.35)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'default',
                          transition: 'filter 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                        onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                      >
                        {width > 5 && (
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 800,
                            color: color.label, letterSpacing: '0.04em',
                            pointerEvents: 'none', userSelect: 'none',
                          }}>
                            {COMPOUND_ABBR[cKey]}{laps > 4 ? ` ${laps}` : ''}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* DNF badge or stint count */}
                <div style={{ width: 36, flexShrink: 0, textAlign: 'left' }}>
                  {dnf ? (
                    <span title={`Retired on lap ${lastLap}`} style={{
                      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em',
                      color: '#ef4444', background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 3, padding: '1px 4px',
                    }}>
                      DNF
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {driver.stints.length}
                    </span>
                  )}
                </div>
              </div>
              )
            })}

            {/* Bottom lap axis */}
            <div style={{
              paddingLeft: 72, paddingTop: '0.5rem',
              fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)',
              borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem',
            }}>
              Lap · {strategy.length} drivers · {totalLaps} total laps
            </div>
          </div>
        )}
      </Panel>
    </PageWrapper>
  )
}
