import { useState, useEffect, useMemo } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useCassandraRaces } from '../hooks/useCassandraRaces'
import { useDriverTelemetry } from '../hooks/useDriverTelemetry'
import { useDriverComparison } from '../hooks/useDriverComparison'
import { useHistoricalTelemetry } from '../hooks/useHistoricalTelemetry'
import PageWrapper from '../components/layout/PageWrapper'
import PageHeader from '../components/layout/PageHeader'
import PageHint from '../components/ui/PageHint'
import DbOfflineBanner from '../components/ui/DbOfflineBanner'
import BackendError from '../components/ui/BackendError'
import EmptyState from '../components/ui/EmptyState'
import CassandraLapChart from '../components/telemetry/CassandraLapChart'
import TyreAnalysisPanel from '../components/telemetry/TyreAnalysisPanel'
import SectorChart from '../components/telemetry/SectorChart'
import PitStopsPanel from '../components/telemetry/PitStopsPanel'
import HistoricalSeasonView from '../components/telemetry/HistoricalSeasonView'
import TelemetryModeBadge from '../components/telemetry/TelemetryModeBadge'
import TelemetryControls from '../components/telemetry/TelemetryControls'
import DriverComparisonBanner from '../components/telemetry/DriverComparisonBanner'
import { TELEMETRY_CUTOFF, HISTORICAL_YEARS } from '../components/telemetry/telemetryConstants'
import { buildStints, stintSlope } from '../components/telemetry/telemetryUtils'
import { telemetryApi } from '../services/api'

// ── Main page ──────────────────────────────────────────
export default function TelemetryPage() {
  const { isMobile } = useBreakpoint()
  // ── Shared state ───────────────────────────────────
  const [year,     setYear]     = useState('')
  const [driverId, setDriverId] = useState('')
  const [raceId,   setRaceId]   = useState('')

  // ── Cassandra: drivers list ─────────────────────────
  const [cassDrivers,    setCassDrivers]    = useState([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)

  // ── Driver B (comparison) ──────────────────────────
  const [driverIdB, setDriverIdB] = useState('')

  // ── Sector X-Ray ───────────────────────────────────
  const [activeSector, setActiveSector] = useState(null)

  // ── Mode ───────────────────────────────────────────
  const isHistorical = year !== '' && parseInt(year) < TELEMETRY_CUTOFF

  // ── Hooks ──────────────────────────────────────────
  const { cassRaces, dbOffline } = useCassandraRaces((years, firstRaceId) => {
    if (years.length) {
      setYear(years[0])
      if (firstRaceId) setRaceId(firstRaceId)
    } else {
      // offline fallback: firstRaceId contains fallback year string
      setYear(firstRaceId)
    }
  })

  const {
    laps, pitStops, loading, error, telemetryLoaded,
    totalLaps, raceResult, driverStatuses, scPeriods, circuitCoords,
    load: loadCassandraTelemetry,
  } = useDriverTelemetry(raceId, driverId, cassRaces, isHistorical)

  const { lapsB, pitStopsB, loadingB, lapsBLoaded } =
    useDriverComparison(raceId, driverIdB, isHistorical)

  const {
    histDrivers, histData, loadingHist,
    load: loadHistoricalData,
  } = useHistoricalTelemetry(year, driverId, isHistorical)

  // ── Sync first driver from histDrivers ─────────────
  useEffect(() => {
    if (isHistorical && histDrivers.length && !driverId) {
      setDriverId(histDrivers[0].driverId)
    }
  }, [histDrivers, isHistorical])

  // ── Year change ────────────────────────────────────
  function handleYearChange(y) {
    setYear(y)
    setDriverId('')
    setDriverIdB('')

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
    setDriverIdB('')
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

      <TelemetryModeBadge isHistorical={isHistorical} />

      {dbOffline && !isHistorical && (
        <div style={{ marginBottom: '1rem' }}>
          <DbOfflineBanner
            message={<>Cassandra not running. Start it and run <code style={{ color: 'var(--cassandra-color)' }}>npm run seed -- --cassandra</code></>}
          />
        </div>
      )}

      {/* ── Controls ───────────────────────────────────── */}
      <TelemetryControls
        year={year}            onYearChange={handleYearChange}  allYears={allYears}
        isHistorical={isHistorical}
        raceId={raceId}        onRaceChange={setRaceId}          racesOfYear={racesOfYear}
        driverId={driverId}    onDriverChange={setDriverId}
        histDrivers={histDrivers}   cassDrivers={cassDrivers}
        loadingDrivers={loadingDrivers}  loadingHist={loadingHist}
        driverIdB={driverIdB}  onDriverBChange={setDriverIdB}    laps={laps}  loadingB={loadingB}
        loading={loading}      onLoad={isHistorical ? loadHistoricalData : loadCassandraTelemetry}
      />

      {error && (
        <BackendError />
      )}

      {/* ════════════════════════════════════════════════
          CASSANDRA MODE
      ════════════════════════════════════════════════ */}
      {!isHistorical && (
        <>
          {telemetryLoaded && selectedCassDriver && (
            <DriverComparisonBanner
              isMobile={isMobile}
              driverA={selectedCassDriver}   validLaps={validLaps}   bestLap={bestLap}   avgLap={avgLap}   pitStops={pitStops}   statusA={driverStatus}
              driverB={selectedCassDriverB}  validLapsB={validLapsB} bestLapB={bestLapB} avgLapB={avgLapB} pitStopsB={pitStopsB} statusB={driverStatusB}
              lapsBLoaded={lapsBLoaded}
            />
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
