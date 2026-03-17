import { useState, useEffect, useRef } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import ReliabilityBar from '../components/telemetry/ReliabilityBar'
import GridVsResultChart from '../components/telemetry/GridVsResultChart'
import LapTooltip from '../components/telemetry/LapTooltip'
import SectorTooltip from '../components/telemetry/SectorTooltip'
import PageWrapper from '../components/layout/PageWrapper'
import PageHeader from '../components/layout/PageHeader'
import PageHint from '../components/ui/PageHint'
import Panel from '../components/ui/Panel'
import StatCard from '../components/ui/StatCard'
import ControlGroup from '../components/ui/ControlGroup'
import DbOfflineBanner from '../components/ui/DbOfflineBanner'
import EmptyState from '../components/ui/EmptyState'
import AccentBanner from '../components/ui/AccentBanner'
import { telemetryApi, statsApi } from '../services/api'

const COLORS = { lap: '#e10600', s1: '#a855f7', s2: '#22c55e', s3: '#3b82f6' }
const TELEMETRY_CUTOFF = 2023

function fmtLap(secs) {
  if (!secs || secs <= 0) return '—'
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

// All F1 seasons for historical mode
const HISTORICAL_YEARS = Array.from({ length: TELEMETRY_CUTOFF - 1950 }, (_, i) => String(TELEMETRY_CUTOFF - 1 - i))

// ── Main page ──────────────────────────────────────────
export default function TelemetryPage() {
  const { isMobile } = useBreakpoint()
  // ── Shared state ───────────────────────────────────
  const [year,     setYear]     = useState('')
  const [driverId, setDriverId] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  // ── Cassandra state ────────────────────────────────
  const [cassRaces,    setCassRaces]    = useState([])
  const [raceId,       setRaceId]       = useState('')
  const [cassDrivers,  setCassDrivers]  = useState([])
  const [laps,         setLaps]         = useState([])
  const [pitStops,     setPitStops]     = useState([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [dbOffline,    setDbOffline]    = useState(false)
  const autoLoadedRef = useRef(false)

  // ── Historical state ───────────────────────────────
  const [histDrivers,  setHistDrivers]  = useState([])
  const [histData,     setHistData]     = useState(null)
  const [loadingHist,  setLoadingHist]  = useState(false)

  // ── Mode ───────────────────────────────────────────
  const isHistorical = year !== '' && parseInt(year) < TELEMETRY_CUTOFF

  // ── Init: load Cassandra races ─────────────────────
  useEffect(() => {
    telemetryApi.getAvailableRaces()
      .then(data => {
        setCassRaces(data)
        const years = [...new Set(data.map(r => r.raceId.split('_')[0]))].sort((a, b) => b - a)
        if (years.length) {
          setYear(years[0])
          const first = data.find(r => r.raceId.startsWith(years[0] + '_'))
          if (first) setRaceId(first.raceId)
        }
      })
      .catch(e => {
        if (e.message?.includes('503') || e.message?.includes('not connected')) setDbOffline(true)
        // Still allow historical mode even if Cassandra is offline
        setYear(String(TELEMETRY_CUTOFF - 1))
      })
  }, [])

  // ── Year change ────────────────────────────────────
  function handleYearChange(y) {
    setYear(y)
    setDriverId('')
    setLaps([])
    setPitStops([])
    setHistData(null)
    setError(null)
    autoLoadedRef.current = false

    if (parseInt(y) >= TELEMETRY_CUTOFF) {
      // Cassandra mode: select first race of year
      const first = cassRaces.find(r => r.raceId.startsWith(y + '_'))
      if (first) setRaceId(first.raceId)
      else setRaceId('')
    } else {
      setRaceId('')
    }
  }

  // ── Cassandra: load drivers when race changes ──────
  useEffect(() => {
    if (!raceId || isHistorical) return
    setCassDrivers([])
    setDriverId('')
    setLaps([])
    setPitStops([])
    setLoadingDrivers(true)
    telemetryApi.getRaceDrivers(raceId)
      .then(data => {
        const sorted = [...data].sort((a, b) => a.acronym.localeCompare(b.acronym))
        setCassDrivers(sorted)
        if (sorted.length) setDriverId(sorted[0].driverId)
      })
      .catch(() => {})
      .finally(() => setLoadingDrivers(false))
  }, [raceId])

  // ── Cassandra: auto-load telemetry ─────────────────
  useEffect(() => {
    if (isHistorical || autoLoadedRef.current || !raceId || !driverId) return
    autoLoadedRef.current = true
    loadCassandraTelemetry()
  }, [raceId, driverId])

  function loadCassandraTelemetry() {
    if (!raceId || !driverId) return
    setLoading(true)
    setError(null)
    setLaps([])
    setPitStops([])
    Promise.all([
      telemetryApi.getLapTimes(raceId, driverId),
      telemetryApi.getPitStops(raceId, driverId),
    ])
      .then(([lapData, pitData]) => { setLaps(lapData); setPitStops(pitData) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  // ── Historical: load drivers when year changes ─────
  useEffect(() => {
    if (!isHistorical || !year) return
    setHistDrivers([])
    setDriverId('')
    setHistData(null)
    statsApi.seasonDrivers(year)
      .then(list => {
        setHistDrivers(list)
        if (list.length) setDriverId(list[0].driverId)
      })
      .catch(() => {})
  }, [year, isHistorical])

  // ── Historical: auto-load when driver ready ────────
  useEffect(() => {
    if (!isHistorical || !driverId || !year) return
    loadHistoricalData()
  }, [driverId, isHistorical])

  function loadHistoricalData() {
    if (!driverId || !year) return
    setLoadingHist(true)
    setHistData(null)
    setError(null)
    statsApi.historicalPerformance(driverId, year)
      .then(setHistData)
      .catch(e => setError(e.message))
      .finally(() => setLoadingHist(false))
  }

  // ── Derived ────────────────────────────────────────
  const cassYears    = [...new Set(cassRaces.map(r => r.raceId.split('_')[0]))].sort((a, b) => b - a)
  const allYears     = [...cassYears, ...HISTORICAL_YEARS]
  const racesOfYear  = cassRaces.filter(r => r.raceId.startsWith(year + '_'))
  const selectedCassDriver = cassDrivers.find(d => d.driverId === driverId)
  const selectedHistDriver = histDrivers.find(d => d.driverId === driverId)
  const validLaps    = laps.filter(l => l.lap_time > 0)
  const bestLap      = validLaps.length ? Math.min(...validLaps.map(l => l.lap_time)) : null
  const avgLap       = validLaps.length ? validLaps.reduce((s, l) => s + l.lap_time, 0) / validLaps.length : null
  const fmt          = v => v != null ? v.toFixed(3) : null
  const bestS1       = validLaps.length ? Math.min(...validLaps.filter(l => l.sector1 > 0).map(l => l.sector1)) : null
  const bestS2       = validLaps.length ? Math.min(...validLaps.filter(l => l.sector2 > 0).map(l => l.sector2)) : null
  const bestS3       = validLaps.length ? Math.min(...validLaps.filter(l => l.sector3 > 0).map(l => l.sector3)) : null

  return (
    <PageWrapper>
      <PageHint
        id="telemetry"
        title="Performance Hub"
        text="Select a race and a driver to view lap times and pit stop data. Data from 2023 onwards comes from Cassandra."
        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>}
      />
      <PageHeader
        title="Performance Hub"
        subtitle={isHistorical
          ? `Historical analysis ${year} · MongoDB`
          : 'Lap times & telemetry · Cassandra'}
        badge={isHistorical ? 'mongo' : 'cassandra'}
      />

      {/* ── Mode indicator ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.25rem 0.7rem', borderRadius: 99,
          background: isHistorical ? 'rgba(34,197,94,0.12)' : 'rgba(168,85,247,0.12)',
          border: `1px solid ${isHistorical ? 'rgba(34,197,94,0.35)' : 'rgba(168,85,247,0.35)'}`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isHistorical ? '#22c55e' : '#a855f7' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isHistorical ? '#22c55e' : '#a855f7' }}>
            {isHistorical ? 'Historical Mode · MongoDB' : 'Telemetry Mode · Cassandra'}
          </span>
        </div>
        {isHistorical && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Select 2023 or later for live telemetry data
          </span>
        )}
      </div>

      {dbOffline && !isHistorical && (
        <div style={{ marginBottom: '1rem' }}>
          <DbOfflineBanner
            message={<>Cassandra not running. Start it and run <code style={{ color: 'var(--cassandra-color)' }}>npm run seed -- --cassandra</code></>}
          />
        </div>
      )}

      {/* ── Controls ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>

        <ControlGroup label="Season" width={100}>
          <select className="input" style={{ width: 100 }} value={year} onChange={e => handleYearChange(e.target.value)}>
            {allYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </ControlGroup>

        {/* Race selector — Cassandra mode only */}
        {!isHistorical && (
          <ControlGroup label="Race" width={220}>
            <select className="input" style={{ width: 220 }} value={raceId} onChange={e => setRaceId(e.target.value)}>
              <option value="">Select race…</option>
              {racesOfYear.map(r => (
                <option key={r.raceId} value={r.raceId}>{r.raceName}</option>
              ))}
            </select>
          </ControlGroup>
        )}

        {/* Driver selector */}
        <ControlGroup
          label={<>Driver {(loadingDrivers || loadingHist) && <span style={{ color: isHistorical ? 'var(--mongo-color)' : 'var(--cassandra-color)' }}>···</span>}</>}
          width={240}
        >
          {isHistorical ? (
            <select className="input" style={{ width: 240 }} value={driverId} onChange={e => setDriverId(e.target.value)} disabled={!histDrivers.length}>
              <option value="">Select driver…</option>
              {histDrivers.map(d => (
                <option key={d.driverId} value={d.driverId}>{d.name}</option>
              ))}
            </select>
          ) : (
            <select className="input" style={{ width: 240, paddingLeft: '0.75rem', paddingRight: '0.75rem' }} value={driverId} onChange={e => setDriverId(e.target.value)} disabled={!cassDrivers.length || loadingDrivers}>
              <option value="">Select driver…</option>
              {cassDrivers.map(d => (
                <option key={d.driverId} value={d.driverId}>
                  {d.acronym} — {d.fullName}{d.teamName ? ` (${d.teamName})` : ''}
                </option>
              ))}
            </select>
          )}
        </ControlGroup>

        <button
          className="btn btn--primary"
          onClick={isHistorical ? loadHistoricalData : loadCassandraTelemetry}
          disabled={isHistorical ? (!driverId || loadingHist) : (!raceId || !driverId || loading)}
          style={{ alignSelf: 'flex-end' }}
        >
          {(loading || loadingHist) ? 'Loading…' : isHistorical ? 'Load Analysis' : 'Load Telemetry'}
        </button>
      </div>

      {error && (
        <p style={{ color: 'var(--f1-red)', marginBottom: '1rem', fontSize: '0.88rem' }}>Error: {error}</p>
      )}

      {/* ════════════════════════════════════════════════
          CASSANDRA MODE
      ════════════════════════════════════════════════ */}
      {!isHistorical && (
        <>
          {laps.length > 0 && selectedCassDriver && (
            <AccentBanner
              color="var(--cassandra-color)"
              padding="sm"
              radius={10}
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: isMobile ? '0.75rem' : '1.5rem',
                marginBottom: '1rem',
                borderTop: '2px solid rgba(168,85,247,0.45)',
              }}
            >
              {/* Driver info */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.62rem', color: 'var(--cassandra-color)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Driver</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {selectedCassDriver.fullName}
                  <span style={{ fontSize: '0.9rem', color: 'var(--cassandra-color)', marginLeft: 8 }}>{selectedCassDriver.acronym}</span>
                </div>
                {selectedCassDriver.teamName && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{selectedCassDriver.teamName}</div>
                )}
              </div>

              {!isMobile && <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />}

              {/* KPIs — 2×2 on mobile, row on desktop */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, auto)',
                gap: '0.5rem',
                flex: isMobile ? undefined : 1,
              }}>
                <StatCard label="Laps"      value={validLaps.length} />
                <StatCard label="Best lap"  value={fmtLap(bestLap)} />
                <StatCard label="Avg lap"   value={fmtLap(avgLap)} />
                <StatCard label="Pit stops" value={pitStops.length} />
              </div>
            </AccentBanner>
          )}

          {laps.length > 0 && (
            <>
              {/* ── Lap Times ─────────────────────────── */}
              <Panel accent="cassandra" className="card" style={{ marginBottom: '0.85rem', borderTop: '2px solid rgba(168,85,247,0.35)' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lap Times</h2>
                  {pitStops.length > 0 && (
                    <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                      Dashed line = average · <span style={{ color: '#fbbf24' }}>Yellow markers</span> = pit stops
                    </p>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={laps} margin={{ top: 8, right: 24, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="lap_number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} label={{ value: 'Lap', position: 'insideBottomRight', fill: 'rgba(255,255,255,0.3)', fontSize: 10, offset: -4 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} width={55} domain={['auto', 'auto']} tickFormatter={fmtLap} />
                    <Tooltip content={<LapTooltip pitStops={pitStops} />} />
                    {/* Average reference line */}
                    {avgLap && (
                      <ReferenceLine
                        y={avgLap}
                        stroke="rgba(255,255,255,0.28)"
                        strokeDasharray="6 4"
                        label={{ value: `Avg ${fmtLap(avgLap)}`, position: 'insideTopRight', fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                      />
                    )}
                    {/* Pit stop vertical markers */}
                    {pitStops.map(p => (
                      <ReferenceLine
                        key={p.stop_number}
                        x={p.lap}
                        stroke="#fbbf24"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        label={{ value: `P${p.stop_number}`, position: 'top', fill: '#fbbf24', fontSize: 9 }}
                      />
                    ))}
                    <Line type="monotone" dataKey="lap_time" stroke={COLORS.lap} dot={false} strokeWidth={2} activeDot={{ r: 5, fill: COLORS.lap, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Panel>

              {/* ── Sector Times (stacked bar) ──────────── */}
              <Panel accent="cassandra" className="card" style={{ marginBottom: '0.85rem', borderTop: '2px solid rgba(168,85,247,0.35)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sector Times</h2>
                    <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                      Stacked per lap · <span style={{ color: '#a855f7' }}>Purple</span> = personal best sector
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[['S1', COLORS.s1], ['S2', COLORS.s2], ['S3', COLORS.s3]].map(([s, c]) => (
                      <span key={s} style={{ fontSize: '0.68rem', fontWeight: 700, color: c, background: `${c}18`, border: `1px solid ${c}40`, padding: '1px 7px', borderRadius: 4 }}>{s}</span>
                    ))}
                  </div>
                </div>
                {/* Horizontal scroll on mobile */}
                <div style={isMobile ? { overflowX: 'auto', marginLeft: '-0.25rem', marginRight: '-0.25rem' } : {}}>
                  <div style={isMobile ? { minWidth: Math.max(560, validLaps.length * 14) } : {}}>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={validLaps} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="lap_number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} width={42} tickFormatter={v => `${v.toFixed(0)}s`} />
                        <Tooltip content={<SectorTooltip />} />
                        <Bar dataKey="sector1" stackId="a" name="S1" radius={[0,0,0,0]}>
                          {validLaps.map((lap, idx) => (
                            <Cell key={idx} fill={bestS1 && lap.sector1 > 0 && lap.sector1 === bestS1 ? '#a855f7' : COLORS.s1} />
                          ))}
                        </Bar>
                        <Bar dataKey="sector2" stackId="a" name="S2" radius={[0,0,0,0]}>
                          {validLaps.map((lap, idx) => (
                            <Cell key={idx} fill={bestS2 && lap.sector2 > 0 && lap.sector2 === bestS2 ? '#a855f7' : COLORS.s2} />
                          ))}
                        </Bar>
                        <Bar dataKey="sector3" stackId="a" name="S3" radius={[2,2,0,0]}>
                          {validLaps.map((lap, idx) => (
                            <Cell key={idx} fill={bestS3 && lap.sector3 > 0 && lap.sector3 === bestS3 ? '#a855f7' : COLORS.s3} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Panel>
            </>
          )}

          {pitStops.length > 0 && (
            <Panel accent="cassandra" className="card" style={{ borderTop: '2px solid rgba(168,85,247,0.35)' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pit Stops</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {pitStops.map((p, i) => (
                  <StatCard key={i} label={`Stop ${p.stop_number}`} value={p.duration?.toFixed(1) ?? '—'} sub={`Lap ${p.lap}`} accent="var(--cassandra-color)" />
                ))}
              </div>
            </Panel>
          )}

          {!dbOffline && !loading && laps.length === 0 && !error && !raceId && (
            <EmptyState type="loading" message="Loading available races…" height={120} />
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════
          HISTORICAL MODE
      ════════════════════════════════════════════════ */}
      {isHistorical && (
        <>
          {loadingHist && (
            <EmptyState type="loading" message={`Loading ${year} season data…`} height={120} />
          )}

          {histData && selectedHistDriver && (
            <>
              {/* Driver + season summary banner */}
              <AccentBanner
                color="var(--mongo-color)"
                padding="sm"
                radius={10}
                style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}
              >
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.62rem', color: 'var(--mongo-color)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Driver · {year}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {selectedHistDriver.name}
                  </div>
                </div>
                <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '0.5rem' }}>
                  <StatCard label="Races"   value={histData.stats.races} />
                  <StatCard label="Wins"    value={histData.stats.wins} />
                  <StatCard label="Podiums" value={histData.stats.podiums} />
                  <StatCard label="Points"  value={histData.stats.points} />
                </div>
                <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '0.5rem' }}>
                  <StatCard label="Poles"      value={histData.stats.poles} />
                  <StatCard label="Fastest"    value={histData.stats.fastestLaps} />
                  <StatCard label="Finishes"   value={histData.stats.finishes} />
                  <StatCard label="Reliability" value={`${histData.stats.reliability}%`} />
                </div>
              </AccentBanner>

              {/* Grid vs Result chart */}
              <Panel accent="mongo" className="card" style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Grid vs Result
                    </h2>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Green = gained positions · Red = lost positions · Purple = same
                    </p>
                  </div>
                </div>
                <GridVsResultChart races={histData.races} />
              </Panel>

              {/* Season stats + reliability */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.85rem' }}>
                <Panel accent="mongo" className="card">
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                    Season Stats
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {[
                      { label: 'Points scored',    value: histData.stats.points,      max: histData.stats.maxPoints, color: '#22c55e' },
                      { label: 'Podium rate',      value: histData.stats.podiums,      max: histData.stats.races,     color: '#f59e0b' },
                      { label: 'Points per race',  value: histData.stats.races ? (histData.stats.points / histData.stats.races).toFixed(1) : 0, max: null, color: '#a855f7' },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: item.color }}>
                            {item.value}{item.max != null ? ` / ${item.max}` : ''}
                          </span>
                        </div>
                        {item.max != null && item.max > 0 && (
                          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                            <div style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%`, height: '100%', background: item.color, borderRadius: 2, transition: 'width 0.6s' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel accent="mongo" className="card">
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                    Reliability
                  </h2>
                  <ReliabilityBar reliability={histData.reliability} total={histData.stats.races} />
                </Panel>
              </div>
            </>
          )}

          {!loadingHist && histData && histData.races.length === 0 && (
            <EmptyState type="empty" message={`No race data found for this driver in ${year}`} height={120} />
          )}
        </>
      )}
    </PageWrapper>
  )
}
