import { useState, useEffect, useRef, useMemo } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import PageWrapper from '../components/layout/PageWrapper'
import PageHeader from '../components/layout/PageHeader'
import PageHint from '../components/ui/PageHint'
import StatCard from '../components/ui/StatCard'
import ControlGroup from '../components/ui/ControlGroup'
import DbOfflineBanner from '../components/ui/DbOfflineBanner'
import EmptyState from '../components/ui/EmptyState'
import AccentBanner from '../components/ui/AccentBanner'
import CassandraLapChart from '../components/telemetry/CassandraLapChart'
import TyreAnalysisPanel from '../components/telemetry/TyreAnalysisPanel'
import SectorChart from '../components/telemetry/SectorChart'
import PitStopsPanel from '../components/telemetry/PitStopsPanel'
import HistoricalSeasonView from '../components/telemetry/HistoricalSeasonView'
import { COLOR_B, TELEMETRY_CUTOFF, HISTORICAL_YEARS } from '../components/telemetry/telemetryConstants'
import { fmtLap, buildStints, stintSlope, raceToCircuitId } from '../components/telemetry/telemetryUtils'
import { telemetryApi, statsApi, circuitsApi, racesApi } from '../services/api'

// ── Driver summary card (used in AccentBanner for both drivers) ───────────
const DNS_STATUSES = ['Did not start', 'Withdrew', 'Did not qualify', 'Not classified']

function DriverBannerCard({ driver, validLaps, bestLap, avgLap, pitStops, color, isMobile, status }) {
  // Classify using MongoDB status when available, fall back to 0-lap heuristic for DNS
  const hasMongo = status != null
  const isDns    = hasMongo ? DNS_STATUSES.includes(status) : validLaps.length === 0
  const isLapped = hasMongo && !isDns && status.startsWith('+')   // "+1 Lap", "+3 Laps" etc.
  const isDnf    = hasMongo && !isDns && !isLapped && status !== 'Finished'

  // DNF reason label — shorten long strings
  const dnfReason = isDnf ? status : null

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '0.5rem' : '1.25rem' }}>
      {/* Name block */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.62rem', color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Driver</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {driver.fullName}
          </span>
          <span style={{ fontSize: '0.9rem', color }}>{driver.acronym}</span>
          {isDns && (
            <span style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.07em', padding: '1px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.14)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }}>
              DNS
            </span>
          )}
          {isDnf && (
            <span style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.07em', padding: '2px 7px', borderRadius: 4, background: 'rgba(251,146,60,0.14)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
              DNF
              {dnfReason && <span style={{ fontWeight: 600, opacity: 0.8 }}>· {dnfReason}</span>}
            </span>
          )}
        </div>
        {driver.teamName && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{driver.teamName}</div>
        )}
      </div>

      {!isMobile && <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />}

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, auto)', gap: '0.5rem', flex: isMobile ? undefined : 1 }}>
        <StatCard
          label="Laps"
          value={isDns ? 'DNS' : validLaps.length}
          sub={isLapped ? status : undefined}
          accent={isDns ? '#ef4444' : isDnf ? '#fb923c' : isLapped ? '#f59e0b' : undefined}
        />
        <StatCard label="Best lap"  value={isDns ? '—' : fmtLap(bestLap)} />
        <StatCard label="Avg lap"   value={isDns ? '—' : fmtLap(avgLap)} />
        <StatCard label="Pit stops" value={isDns ? '—' : pitStops.length} />
      </div>
    </div>
  )
}

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

  // ── Driver B (comparison) ──────────────────────────
  const [driverIdB,      setDriverIdB]      = useState('')
  const [lapsB,          setLapsB]          = useState([])
  const [pitStopsB,      setPitStopsB]      = useState([])
  const [loadingB,       setLoadingB]       = useState(false)
  const [lapsBLoaded,    setLapsBLoaded]    = useState(false)

  // ── Telemetry load flag / race info ────────────────
  const [telemetryLoaded,  setTelemetryLoaded]  = useState(false)
  const [totalLaps,        setTotalLaps]        = useState(null)
  const [raceResult,       setRaceResult]       = useState(null)
  const [driverStatuses,   setDriverStatuses]   = useState({})

  // ── Safety Car / VSC ───────────────────────────────
  const [scPeriods, setScPeriods] = useState([])

  // ── Sector X-Ray ───────────────────────────────────
  const [activeSector,  setActiveSector]  = useState(null)
  const [circuitCoords, setCircuitCoords] = useState(null)

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
    setDriverIdB('')
    setLapsB([])
    setPitStopsB([])
    setHistData(null)
    setError(null)
    setTelemetryLoaded(false)
    setLapsBLoaded(false)
    setTotalLaps(null)
    setRaceResult(null)
    setDriverStatuses({})
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
    setDriverIdB('')
    setLapsB([])
    setPitStopsB([])
    setScPeriods([])
    setTelemetryLoaded(false)
    setLapsBLoaded(false)
    setTotalLaps(null)
    setRaceResult(null)
    setDriverStatuses({})
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
    setTelemetryLoaded(false)
    setLaps([])
    setPitStops([])
    setScPeriods([])
    const [season, round] = [raceId.split('_')[0], parseInt(raceId.split('_')[1])]
    Promise.all([
      telemetryApi.getLapTimes(raceId, driverId),
      telemetryApi.getPitStops(raceId, driverId),
      telemetryApi.getSafetyCar(raceId).catch(() => []),
      telemetryApi.getRaceInfo(raceId).catch(() => ({ totalLaps: null })),
      racesApi.getByRound(season, round).catch(() => null),
    ])
      .then(([lapData, pitData, scData, infoData, raceData]) => {
        setLaps(lapData)
        setPitStops(pitData)
        setScPeriods(scData)
        setRaceResult(raceData)
        setDriverStatuses(infoData.driverStatuses ?? {})
        const mongoTotal = raceData?.Results?.length
          ? Math.max(...raceData.Results.map(r => parseInt(r.laps) || 0))
          : null
        setTotalLaps(mongoTotal ?? infoData.totalLaps)
      })
      .catch(e => setError(e.message))
      .finally(() => { setLoading(false); setTelemetryLoaded(true) })
  }

  // ── Circuit coords for sector mini-map ─────────────
  useEffect(() => {
    if (!raceId || isHistorical) return
    const race       = cassRaces.find(r => r.raceId === raceId)
    const circuitId  = raceToCircuitId(race?.raceName)
    if (!circuitId) { setCircuitCoords(null); return }
    circuitsApi.getById(circuitId)
      .then(c => setCircuitCoords(c?.trackCoords ?? null))
      .catch(() => setCircuitCoords(null))
  }, [raceId, cassRaces])

  // ── Driver B: auto-load when selection changes ─────
  useEffect(() => {
    if (!driverIdB || isHistorical || !raceId) return
    setLoadingB(true)
    setLapsBLoaded(false)
    setLapsB([])
    setPitStopsB([])
    Promise.all([
      telemetryApi.getLapTimes(raceId, driverIdB),
      telemetryApi.getPitStops(raceId, driverIdB),
    ])
      .then(([lapData, pitData]) => { setLapsB(lapData); setPitStopsB(pitData) })
      .catch(() => {})
      .finally(() => { setLoadingB(false); setLapsBLoaded(true) })
  }, [driverIdB, raceId])

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
  const selectedCassDriverB = cassDrivers.find(d => d.driverId === driverIdB)
  const validLapsB = lapsB.filter(l => l.lap_time > 0)
  const isComparing = validLapsB.length > 0

  // Merge Driver A + B laps by lap_number for the chart
  const mergedLaps = useMemo(() => {
    if (!laps.length) return []
    const map = new Map()
    for (const l of laps) {
      if (l.lap_time > 0) map.set(l.lap_number, { lap_number: l.lap_number, a: l.lap_time, compound_a: l.compound || null })
    }
    for (const l of lapsB) {
      if (l.lap_time > 0) {
        const row = map.get(l.lap_number) || { lap_number: l.lap_number }
        row.b = l.lap_time
        row.compound_b = l.compound || null
        map.set(l.lap_number, row)
      }
    }
    return [...map.values()].sort((x, y) => x.lap_number - y.lap_number)
  }, [laps, lapsB])

  const cassYears    = [...new Set(cassRaces.map(r => r.raceId.split('_')[0]))].sort((a, b) => b - a)
  const allYears     = [...cassYears, ...HISTORICAL_YEARS]
  const racesOfYear  = cassRaces.filter(r => r.raceId.startsWith(year + '_'))
  const selectedCassDriver = cassDrivers.find(d => d.driverId === driverId)
  const selectedHistDriver = histDrivers.find(d => d.driverId === driverId)
  const validLaps    = laps.filter(l => l.lap_time > 0)

  // Stint/degradation analysis — must come after validLaps
  const stintAnalysis = useMemo(() => {
    if (!validLaps.length) return []
    return buildStints(validLaps).map((stint, i) => {
      const times = stint.laps.map(l => l.lap_time)
      const slope = stintSlope(times)
      return {
        index:    i + 1,
        compound: stint.compound,
        lapStart: stint.laps[0].lap_number,
        lapEnd:   stint.laps[stint.laps.length - 1].lap_number,
        lapCount: stint.laps.length,
        degradMs: slope != null ? Math.round(slope * 1000) : null,
      }
    })
  }, [validLaps])
  const bestLap      = validLaps.length ? Math.min(...validLaps.map(l => l.lap_time)) : null
  const avgLap       = validLaps.length ? validLaps.reduce((s, l) => s + l.lap_time, 0) / validLaps.length : null
  const bestLapB     = validLapsB.length ? Math.min(...validLapsB.map(l => l.lap_time)) : null
  const avgLapB      = validLapsB.length ? validLapsB.reduce((s, l) => s + l.lap_time, 0) / validLapsB.length : null

  // Race finish status — MongoDB first (has lapping info), fall back to Cassandra positions
  const findStatus = (id) =>
    raceResult?.Results?.find(r => r.Driver.driverId === id)?.status
    ?? driverStatuses[id]
    ?? null
  const driverStatus  = findStatus(driverId)
  const driverStatusB = findStatus(driverIdB)
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

        {/* Driver B — Cassandra compare mode only */}
        {!isHistorical && laps.length > 0 && (
          <ControlGroup
            label={<>vs Driver {loadingB && <span style={{ color: COLOR_B }}>···</span>}</>}
            width={200}
          >
            <select
              className="input"
              style={{ width: 200, borderColor: driverIdB ? `${COLOR_B}80` : undefined }}
              value={driverIdB}
              onChange={e => setDriverIdB(e.target.value)}
              disabled={!cassDrivers.length}
            >
              <option value="">— no comparison —</option>
              {cassDrivers.filter(d => d.driverId !== driverId).map(d => (
                <option key={d.driverId} value={d.driverId}>
                  {d.acronym} — {d.fullName}
                </option>
              ))}
            </select>
          </ControlGroup>
        )}

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
          {telemetryLoaded && selectedCassDriver && (
            <AccentBanner
              color="var(--cassandra-color)"
              padding="sm"
              radius={10}
              style={{ marginBottom: '1rem', borderTop: '2px solid rgba(168,85,247,0.45)' }}
            >
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '1rem' : '1.5rem' }}>

                {/* ── Driver A card ── */}
                <DriverBannerCard
                  driver={selectedCassDriver}
                  validLaps={validLaps}
                  bestLap={bestLap}
                  avgLap={avgLap}
                  pitStops={pitStops}
                  color="var(--cassandra-color)"
                  isMobile={isMobile}
                  totalLaps={totalLaps}
                  status={driverStatus}
                />

                {/* ── Driver B card (comparison) ── */}
                {lapsBLoaded && selectedCassDriverB && (
                  <>
                    <div style={isMobile
                      ? { height: 1, background: 'rgba(255,255,255,0.07)' }
                      : { width: 1, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}
                    />
                    <DriverBannerCard
                      driver={selectedCassDriverB}
                      validLaps={validLapsB}
                      bestLap={bestLapB}
                      avgLap={avgLapB}
                      pitStops={pitStopsB}
                      color={COLOR_B}
                      isMobile={isMobile}
                      totalLaps={totalLaps}
                      status={driverStatusB}
                    />
                  </>
                )}
              </div>
            </AccentBanner>
          )}

          {laps.length > 0 && (
            <>
              <CassandraLapChart
                mergedLaps={mergedLaps}
                scPeriods={scPeriods}
                pitStops={pitStops}
                pitStopsB={pitStopsB}
                avgLap={avgLap}
                isComparing={isComparing}
                driverIdB={driverIdB}
                driverA={selectedCassDriver}
                driverB={selectedCassDriverB}
                stintAnalysis={stintAnalysis}
                isMobile={isMobile}
              />

              {!isComparing && stintAnalysis.length > 0 && (
                <TyreAnalysisPanel stintAnalysis={stintAnalysis} />
              )}

              <SectorChart
                validLaps={validLaps}
                validLapsB={validLapsB}
                bestS1={bestS1}
                bestS2={bestS2}
                bestS3={bestS3}
                activeSector={activeSector}
                onSectorEnter={setActiveSector}
                onSectorLeave={() => setActiveSector(null)}
                circuitCoords={circuitCoords}
                isMobile={isMobile}
                isComparing={isComparing}
                driverA={selectedCassDriver}
                driverB={selectedCassDriverB}
              />
            </>
          )}

          {(pitStops.length > 0 || pitStopsB.length > 0) && (
            <PitStopsPanel
              pitStops={pitStops}
              pitStopsB={pitStopsB}
              isComparing={isComparing}
              driverA={selectedCassDriver}
              driverB={selectedCassDriverB}
            />
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

          <HistoricalSeasonView
            histData={histData}
            selectedDriver={selectedHistDriver}
            year={year}
            isMobile={isMobile}
            loadingHist={loadingHist}
          />
        </>
      )}
    </PageWrapper>
  )
}
