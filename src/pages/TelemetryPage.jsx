import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { usePreferences } from '../contexts/PreferencesContext'
import { useCassandraRaces } from '../hooks/useCassandraRaces'
import { useDriverTelemetry } from '../hooks/useDriverTelemetry'
import { useDriverComparison } from '../hooks/useDriverComparison'
import { useHistoricalTelemetry } from '../hooks/useHistoricalTelemetry'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'
import DbOfflineBanner from '../components/ui/DbOfflineBanner'
import BackendError from '../components/ui/BackendError'
import VizSkeleton from '../components/viz/VizSkeleton'
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
import { F1_TEAMS } from '../data/f1Teams'
import { teamNameToColor } from '../utils/teamColors'
import { teamMark, BASE } from '../styles/vizPalette'

// Series fallbacks when a team color is unknown: steel (A) and ink-2 (B), matching --viz-series-1/-2
const SERIES_A = '#8fb4d8'
const SERIES_B = '#a2abb4'

/** Only show races whose start date is in the past (or no date known). */
function isPastRace(r) {
  return r.isLive || !r.date || new Date(r.date) <= new Date()
}

/** Returns the teammate's entry from a driver list, or null. */
function findTeammateIn(favoriteDriverName, list, nameKey) {
  if (!favoriteDriverName) return null
  const team = F1_TEAMS.find(t => t.drivers.includes(favoriteDriverName))
  const teammateName = team?.drivers.find(d => d !== favoriteDriverName)
  if (!teammateName) return null
  return list.find(d => (d[nameKey] ?? '').toLowerCase() === teammateName.toLowerCase()) ?? null
}

// ── Main page ──────────────────────────────────────────
export default function TelemetryPage() {
  const { isMobile } = useBreakpoint()
  const { prefs } = usePreferences()
  // ?race=<year>_<key> (the Circuits "Compare laps" link): read once, only honoured when that race exists in the list
  const [searchParams] = useSearchParams()
  const deepLink = searchParams.get('race')
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
  const { cassRaces, dbOffline } = useCassandraRaces((years, firstRaceId, sortedRaces = []) => {
    if (years.length) {
      if (deepLink && /^\d{4}_\d+$/.test(deepLink) && sortedRaces.some(r => r.raceId === deepLink)) {
        setYear(deepLink.split('_')[0])
        setRaceId(deepLink)
        return
      }
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
    histDrivers, histData, loadingHist, noSeasonData,
    load: loadHistoricalData,
  } = useHistoricalTelemetry(year, driverId, isHistorical)

  // ── Sync driver from histDrivers (prefer favorite) ─
  useEffect(() => {
    if (!isHistorical || !histDrivers.length) return
    const favName = prefs.favoriteDriver?.toLowerCase()
    const favMatch = favName
      ? histDrivers.find(d => d.name?.toLowerCase() === favName)
      : null
    if (favMatch) {
      setDriverId(favMatch.driverId)
      const mate = findTeammateIn(prefs.favoriteDriver, histDrivers, 'name')
      setDriverIdB(mate ? mate.driverId : '')
    } else if (!driverId) {
      setDriverId(histDrivers[0].driverId)
    }
  }, [histDrivers, isHistorical])

  // ── Re-select when favorite driver changes in My Garage ─
  useEffect(() => {
    if (!prefs.favoriteDriver) return
    const favName = prefs.favoriteDriver.toLowerCase()
    if (!isHistorical && cassDrivers.length) {
      const match = cassDrivers.find(d => d.fullName?.toLowerCase() === favName)
      if (match) {
        setDriverId(match.driverId)
        const mate = findTeammateIn(prefs.favoriteDriver, cassDrivers, 'fullName')
        setDriverIdB(mate ? mate.driverId : '')
      }
    } else if (isHistorical && histDrivers.length) {
      const match = histDrivers.find(d => d.name?.toLowerCase() === favName)
      if (match) {
        setDriverId(match.driverId)
        const mate = findTeammateIn(prefs.favoriteDriver, histDrivers, 'name')
        setDriverIdB(mate ? mate.driverId : '')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.favoriteDriver])

  // ── Year change ────────────────────────────────────
  function handleYearChange(y) {
    setYear(y)
    setDriverId('')
    setDriverIdB('')

    if (parseInt(y) >= TELEMETRY_CUTOFF) {
      // Select the last (most recent) past race of the chosen year
      const racesOfY = cassRaces.filter(r => r.raceId.startsWith(y + '_') && isPastRace(r))
      const last = racesOfY[racesOfY.length - 1]
      setRaceId(last?.raceId ?? '')
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
        if (sorted.length) {
          const favName = prefs.favoriteDriver?.toLowerCase()
          const favMatch = favName
            ? sorted.find(d => d.fullName?.toLowerCase() === favName)
            : null
          setDriverId(favMatch ? favMatch.driverId : sorted[0].driverId)
          if (favMatch) {
            const mate = findTeammateIn(prefs.favoriteDriver, sorted, 'fullName')
            setDriverIdB(mate ? mate.driverId : '')
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDrivers(false))
  }, [raceId])

  // ── Derived ────────────────────────────────────────
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

  // The driverId that corresponds to the user's favoriteDriver pref
  const favoriteDriverId = useMemo(() => {
    if (!prefs.favoriteDriver) return null
    const favName = prefs.favoriteDriver.toLowerCase()
    if (!isHistorical) {
      return cassDrivers.find(d => d.fullName?.toLowerCase() === favName)?.driverId ?? null
    }
    return histDrivers.find(d => d.name?.toLowerCase() === favName)?.driverId ?? null
  }, [prefs.favoriteDriver, cassDrivers, histDrivers, isHistorical])

  const cassYears    = [...new Set(cassRaces.map(r => r.raceId.split('_')[0]))].sort((a, b) => b - a)
  const allYears     = [...cassYears, ...HISTORICAL_YEARS]
  const racesOfYear  = cassRaces.filter(r => r.raceId.startsWith(year + '_') && isPastRace(r))
  const selectedCassDriver  = cassDrivers.find(d => d.driverId === driverId)
  const selectedCassDriverB = cassDrivers.find(d => d.driverId === driverIdB)
  const selectedHistDriver  = histDrivers.find(d => d.driverId === driverId)

  // Team colors, lifted to >= 3:1 on the page background (teamMark); B is also dashed so teammates stay distinct
  const colorA = teamMark(teamNameToColor(selectedCassDriver?.teamName) ?? SERIES_A, BASE.bg)
  const colorB = teamMark(teamNameToColor(selectedCassDriverB?.teamName) ?? SERIES_B, BASE.bg)
  const selectedRace = cassRaces.find(r => r.raceId === raceId)
  const animationId  = `${raceId}-${driverId}-${driverIdB}`

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
    <PageWrapper stagger>
      <header className="mb-pw-5">
        <div className="flex flex-col gap-pw-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-title text-ink">Telemetry</h1>
            <p className="mt-pw-1 text-sm text-ink-2">
              {isHistorical ? `Season results for one driver, ${year}.` : 'Lap times, tyres, sectors and pit stops for one or two drivers.'}
            </p>
          </div>
          <TelemetryModeBadge isHistorical={isHistorical} />
        </div>
      </header>

      {dbOffline && !isHistorical && (
        <div className="mb-pw-4">
          <DbOfflineBanner message={<>Cassandra is not running. Start it and run <code>npm run seed -- --cassandra</code>.</>} />
        </div>
      )}

      <Rise index={0}>
        <TelemetryControls
          year={year}            onYearChange={handleYearChange}  allYears={allYears}
          isHistorical={isHistorical}
          raceId={raceId}        onRaceChange={setRaceId}          racesOfYear={racesOfYear}
          driverId={driverId}    onDriverChange={setDriverId}
          histDrivers={histDrivers}   cassDrivers={cassDrivers}
          loadingDrivers={loadingDrivers}  loadingHist={loadingHist}
          driverIdB={driverIdB}  onDriverBChange={setDriverIdB}    laps={laps}  loadingB={loadingB}
          loading={loading}      onLoad={isHistorical ? loadHistoricalData : loadCassandraTelemetry}
          favoriteDriverId={favoriteDriverId}
        />
      </Rise>

      <div className="mt-pw-6">
        {error && <BackendError />}

        {!isHistorical && (
          loading ? (
            <div className="flex flex-col gap-pw-6">
              <VizSkeleton variant="hero" name="driver summary" />
              <VizSkeleton variant="rows" name="lap times" count={6} />
            </div>
          ) : telemetryLoaded && selectedCassDriver ? (
            <div className="flex flex-col gap-pw-7">
              <Rise index={1}>
                <DriverComparisonBanner
                  raceName={selectedRace?.raceName} season={year} circuitCoords={circuitCoords}
                  driverA={selectedCassDriver}   validLaps={validLaps}   bestLap={bestLap}   avgLap={avgLap}   pitStops={pitStops}   statusA={driverStatus}
                  driverB={selectedCassDriverB}  validLapsB={validLapsB} bestLapB={bestLapB} avgLapB={avgLapB} pitStopsB={pitStopsB} statusB={driverStatusB}
                  lapsBLoaded={lapsBLoaded}
                  colorA={colorA} colorB={colorB}
                />
              </Rise>

              {laps.length > 0 && (
                <Rise index={2}>
                  <CassandraLapChart
                    mergedLaps={mergedLaps} scPeriods={scPeriods}
                    pitStops={pitStops} pitStopsB={pitStopsB} avgLap={avgLap}
                    isComparing={isComparing} driverIdB={driverIdB}
                    driverA={selectedCassDriver} driverB={selectedCassDriverB}
                    stintAnalysis={stintAnalysis} isMobile={isMobile}
                    colorA={colorA} colorB={colorB} animationId={animationId}
                  />
                </Rise>
              )}

              {laps.length > 0 && ((!isComparing && stintAnalysis.length > 0) || pitStops.length > 0 || pitStopsB.length > 0) && (
                <Rise index={3} className="grid grid-cols-1 items-start gap-x-pw-6 gap-y-pw-7 lg:grid-cols-12">
                  {!isComparing && stintAnalysis.length > 0 && (
                    <div className="min-w-0 lg:col-span-7">
                      <TyreAnalysisPanel stintAnalysis={stintAnalysis} totalLaps={totalLaps} />
                    </div>
                  )}
                  {(pitStops.length > 0 || pitStopsB.length > 0) && (
                    <div className={`min-w-0 ${!isComparing && stintAnalysis.length > 0 ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
                      <PitStopsPanel
                        pitStops={pitStops} pitStopsB={pitStopsB} isComparing={isComparing}
                        driverA={selectedCassDriver} driverB={selectedCassDriverB}
                        colorA={colorA} colorB={colorB}
                      />
                    </div>
                  )}
                </Rise>
              )}

              {laps.length > 0 && (
                <Rise index={4}>
                  <SectorChart
                    validLaps={validLaps} validLapsB={validLapsB}
                    bestS1={bestS1} bestS2={bestS2} bestS3={bestS3}
                    activeSector={activeSector}
                    onSectorEnter={setActiveSector} onSectorLeave={() => setActiveSector(null)}
                    circuitCoords={circuitCoords} isMobile={isMobile} isComparing={isComparing}
                    driverA={selectedCassDriver} driverB={selectedCassDriverB}
                    colorA={colorA} colorB={colorB} animationId={animationId}
                  />
                </Rise>
              )}

              {laps.length === 0 && !error && (
                <p className="text-sm text-ink-2">No lap data for this driver in this race.</p>
              )}
            </div>
          ) : !dbOffline && !error && (
            <p className="rounded-md border border-edge px-pw-4 py-pw-4 text-sm text-ink-2">
              {raceId ? 'Pick a driver and load the telemetry.' : 'Loading the race list.'}
            </p>
          )
        )}

        {isHistorical && noSeasonData && (
          <p className="rounded-md border border-edge px-pw-4 py-pw-4 text-sm text-ink-2">
            No race results are stored for {year}. Try another season; older seasons need the archive seed.
          </p>
        )}

        {isHistorical && !noSeasonData && (
          loadingHist
            ? <VizSkeleton variant="hero" name={`${year} season`} />
            : (
              <HistoricalSeasonView
                histData={histData} selectedDriver={selectedHistDriver}
                year={year} loadingHist={loadingHist}
              />
            )
        )}
      </div>
    </PageWrapper>
  )
}
