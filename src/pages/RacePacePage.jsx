import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer, Legend,
} from 'recharts'
import PageWrapper from '../components/layout/PageWrapper'
import PageHeader from '../components/layout/PageHeader'
import Panel from '../components/ui/Panel'
import ControlGroup from '../components/ui/ControlGroup'
import EmptyState from '../components/ui/EmptyState'
import { telemetryApi } from '../services/api'
import { useBreakpoint } from '../hooks/useBreakpoint'

const PALETTE = [
  '#e8002d', '#27F4D2', '#FF8000', '#3671C6',
  '#229971', '#FF87BC', '#6692FF', '#52E252',
]

function median(arr) {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function formatTime(secs) {
  if (!secs || secs <= 0) return '—'
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

function stdDev(arr) {
  if (arr.length < 2) return 0
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - avg) ** 2, 0) / arr.length)
}

function PaceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(8,8,8,0.97)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 8, padding: '0.65rem 0.9rem', minWidth: 160,
    }}>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>Lap {label}</p>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: '#fff', flex: 1 }}>{p.name}</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: p.color, fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function RacePacePage() {
  const { isMobile } = useBreakpoint()
  const [races,          setRaces]          = useState([])
  const [selectedRace,   setSelectedRace]   = useState('')
  const [allDrivers,     setAllDrivers]     = useState([])
  const [selectedDrivers,setSelectedDrivers]= useState([])
  const [paceData,       setPaceData]       = useState([])
  const [loading,        setLoading]        = useState(false)
  const [loadingDrivers, setLoadingDrivers] = useState(false)

  // Load available races
  useEffect(() => {
    telemetryApi.getAvailableRaces()
      .then(r => { setRaces(r); if (r.length) setSelectedRace(r[0].raceId) })
      .catch(() => {})
  }, [])

  // Load drivers when race changes
  useEffect(() => {
    if (!selectedRace) return
    setLoadingDrivers(true)
    setAllDrivers([])
    setSelectedDrivers([])
    setPaceData([])
    telemetryApi.getRaceDrivers(selectedRace)
      .then(d => {
        setAllDrivers(d)
        setSelectedDrivers(d.slice(0, 3).map(x => x.driverId))
      })
      .catch(() => {})
      .finally(() => setLoadingDrivers(false))
  }, [selectedRace])

  // Fetch pace when drivers selection changes
  useEffect(() => {
    if (!selectedRace || !selectedDrivers.length) { setPaceData([]); return }
    setLoading(true)
    telemetryApi.getRacePace(selectedRace, selectedDrivers)
      .then(setPaceData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedRace, selectedDrivers])

  function toggleDriver(driverId) {
    setSelectedDrivers(prev =>
      prev.includes(driverId)
        ? prev.filter(d => d !== driverId)
        : prev.length >= 5 ? prev : [...prev, driverId]
    )
  }

  // Build chart data — one row per lap
  const { chartData, driverMeta, pitLines, scPeriods } = useMemo(() => {
    if (!paceData.length) return { chartData: [], driverMeta: [], pitLines: [], scPeriods: [] }

    const maxLap = Math.max(...paceData.map(d => d.laps.length))
    const pitLines = new Set()

    const driverMeta = paceData.map((d, i) => {
      const validTimes = d.laps.map(l => l.time).filter(t => t > 10 && t < 200)
      const med = median(validTimes)
      d.laps.forEach(l => { if (l.isPit) pitLines.add(l.lap) })
      return {
        driverId:    d.driverId,
        color:       PALETTE[i % PALETTE.length],
        acronym:     allDrivers.find(a => a.driverId === d.driverId)?.acronym || d.driverId,
        teamName:    allDrivers.find(a => a.driverId === d.driverId)?.teamName || '',
        median:      med,
        best:        Math.min(...validTimes),
        consistency: stdDev(validTimes),
        laps:        d.laps,
      }
    })

    // Pre-compute hidden laps per driver: pit lap + out-lap + extreme outliers
    const hiddenLaps = new Map()
    for (const d of driverMeta) {
      const hide = new Set()
      for (const l of d.laps) {
        if (l.isPit) { hide.add(l.lap); hide.add(l.lap + 1) }
        if (l.time > d.median * 1.35) hide.add(l.lap)
      }
      hiddenLaps.set(d.driverId, hide)
    }

    const chartData = Array.from({ length: maxLap }, (_, i) => {
      const lap = i + 1
      const row = { lap }
      for (const d of driverMeta) {
        const lapData = d.laps.find(l => l.lap === lap)
        if (lapData && lapData.time > 10) {
          const hide = hiddenLaps.get(d.driverId)
          row[d.driverId]          = hide.has(lap) ? null : lapData.time
          row[`${d.driverId}_raw`] = lapData.time
        }
      }
      return row
    })

    // Detect SC/VSC: ≥60% of drivers simultaneously >10% slower, no one pitting
    const scLapFlags = Array.from({ length: maxLap }, (_, i) => {
      const lap = i + 1
      let slowCount = 0, pitCount = 0
      for (const d of driverMeta) {
        const l = d.laps.find(x => x.lap === lap)
        if (!l || l.time <= 10) continue
        if (l.isPit) { pitCount++; continue }
        if (l.time > d.median * 1.10) slowCount++
      }
      return pitCount === 0 && slowCount >= Math.max(2, Math.ceil(driverMeta.length * 0.6))
    })
    const scPeriods = []
    let start = null
    for (let i = 0; i < scLapFlags.length; i++) {
      if (scLapFlags[i] && start === null) start = i + 1
      if (!scLapFlags[i] && start !== null) {
        if (i + 1 - start >= 2) scPeriods.push({ x1: start, x2: i })
        start = null
      }
    }
    if (start !== null && maxLap - start >= 1) scPeriods.push({ x1: start, x2: maxLap })

    return { chartData, driverMeta, pitLines: [...pitLines], scPeriods }
  }, [paceData, allDrivers])

  const raceName = races.find(r => r.raceId === selectedRace)?.raceName || ''

  return (
    <PageWrapper>
      <PageHeader
        title="Race Pace Analysis"
        subtitle="Lap-by-lap time comparison · up to 5 drivers"
        badge="cassandra"
        actions={
          <ControlGroup label="Race" width={200}>
            <select
              className="input"
              style={{ width: 200 }}
              value={selectedRace}
              onChange={e => setSelectedRace(e.target.value)}
            >
              {races.map(r => <option key={r.raceId} value={r.raceId}>{r.raceName}</option>)}
            </select>
          </ControlGroup>
        }
      />

      {/* Driver selector */}
      {allDrivers.length > 0 && (
        <Panel padding="sm" className="card" style={{ marginBottom: '0.75rem' }}>
          <div className="table-header" style={{ marginBottom: '0.5rem' }}>
            SELECT DRIVERS · max 5
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {allDrivers.map((d, i) => {
              const isSelected = selectedDrivers.includes(d.driverId)
              const color = isSelected
                ? PALETTE[selectedDrivers.indexOf(d.driverId) % PALETTE.length]
                : undefined
              return (
                <button
                  key={d.driverId}
                  onClick={() => toggleDriver(d.driverId)}
                  style={{
                    padding: '0.3rem 0.75rem', borderRadius: 99, cursor: 'pointer',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
                    border: `1px solid ${isSelected ? color : 'rgba(255,255,255,0.1)'}`,
                    background: isSelected ? `${color}22` : 'transparent',
                    color: isSelected ? color : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {d.acronym}
                  <span style={{ marginLeft: '0.3rem', fontSize: '0.65rem', opacity: 0.6 }}>{d.teamName?.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </Panel>
      )}

      {loadingDrivers && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading drivers...</p>}

      {/* Stat cards */}
      {driverMeta.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${driverMeta.length}, 1fr)`, gap: '0.6rem', marginBottom: '0.75rem' }}>
          {driverMeta.map(d => (
            <Panel
              key={d.driverId}
              padding="sm"
              className="card"
              style={{
                borderTop: `3px solid ${d.color}`,
                background: `linear-gradient(135deg, ${d.color}10, transparent)`,
              }}
            >
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 900, color: d.color, marginBottom: '0.5rem' }}>
                {d.acronym}
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '0.4rem', fontWeight: 400 }}>{d.teamName}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 0.75rem' }}>
                {[
                  { label: 'Best Lap',    value: formatTime(d.best) },
                  { label: 'Median',      value: formatTime(d.median) },
                  { label: 'Consistency', value: `±${d.consistency.toFixed(2)}s` },
                  { label: 'Laps',        value: d.laps.length },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* Chart */}
      <Panel padding="none" className="card" style={{ padding: '1.25rem 1rem 1rem', overflow: isMobile ? 'auto' : 'visible' }}>
        {loading ? (
          <EmptyState type="loading" message="Loading pace data..." height={420} />
        ) : !chartData.length ? (
          <EmptyState type="empty" message="Select a race and drivers to compare" height={420} />
        ) : (
          <>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.06em' }}>
              DASHED LINES = pit stop laps · anomalous laps (SC/pit in-out) hidden for clarity
            </div>
            <div style={{ minWidth: isMobile ? 520 : 0 }}>
            <ResponsiveContainer width="100%" height={isMobile ? 320 : 420}>
              <LineChart data={chartData} margin={{ top: 5, right: 16, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="lap"
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  label={{ value: 'Lap', position: 'insideBottomRight', offset: -5, fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                />
                <YAxis
                  reversed
                  tickFormatter={formatTime}
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<PaceTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} wrapperStyle={{ zIndex: 9999 }} />
                {/* SC / VSC periods */}
                {scPeriods.map(({ x1, x2 }) => (
                  <ReferenceArea key={`sc-${x1}`} x1={x1} x2={x2}
                    fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.3)" strokeWidth={1}
                    label={{ value: 'SC/VSC', position: 'insideTop', fill: 'rgba(245,158,11,0.75)', fontSize: 9, fontWeight: 700 }}
                  />
                ))}
                {pitLines.map(lap => (
                  <ReferenceLine
                    key={`pit-${lap}`}
                    x={lap}
                    stroke="rgba(255,255,255,0.12)"
                    strokeDasharray="4 3"
                    label={{ value: 'PIT', position: 'top', fill: 'rgba(255,255,255,0.2)', fontSize: 8 }}
                  />
                ))}
                {driverMeta.map(d => (
                  <Line
                    key={d.driverId}
                    type="monotone"
                    dataKey={d.driverId}
                    name={d.acronym}
                    stroke={d.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: d.color }}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            </div>
          </>
        )}
      </Panel>
    </PageWrapper>
  )
}
