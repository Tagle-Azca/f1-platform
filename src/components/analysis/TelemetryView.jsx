import { useState, useEffect, useMemo } from 'react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { isHistoricalSeason } from '../../hooks/useAnalysisParams'
import { usePreferences } from '../../contexts/PreferencesContext'
import { useDriverTelemetry } from '../../hooks/useDriverTelemetry'
import { useDriverComparison } from '../../hooks/useDriverComparison'
import { useHistoricalTelemetry } from '../../hooks/useHistoricalTelemetry'
import Rise from '../layout/Rise'
import BackendError from '../ui/BackendError'
import VizSkeleton from '../viz/VizSkeleton'
import CassandraLapChart from '../telemetry/CassandraLapChart'
import TyreAnalysisPanel from '../telemetry/TyreAnalysisPanel'
import SectorChart from '../telemetry/SectorChart'
import PitStopsPanel from '../telemetry/PitStopsPanel'
import HistoricalSeasonView from '../telemetry/HistoricalSeasonView'
import TelemetryControls from '../telemetry/TelemetryControls'
import DriverComparisonBanner from '../telemetry/DriverComparisonBanner'
import { buildStints, stintSlope } from '../telemetry/telemetryUtils'
import { telemetryApi } from '../../services/api'
import { F1_TEAMS } from '../../data/f1Teams'
import { teamNameToColor } from '../../utils/teamColors'
import { teamMark, BASE } from '../../styles/vizPalette'

// Series fallbacks when a team color is unknown: steel (A) and ink-2 (B)
const SERIES_A = 'var(--viz-series-1)'
const SERIES_B = 'var(--viz-series-2)'
const markFor = (teamName, fallback) => {
  const hex = teamNameToColor(teamName)
  return hex ? teamMark(hex, BASE.bg) : fallback
}

/** Returns the teammate's entry from a driver list, or null. */
function findTeammateIn(favoriteDriverName, list, nameKey) {
  if (!favoriteDriverName) return null
  const team = F1_TEAMS.find(t => t.drivers.includes(favoriteDriverName))
  const teammateName = team?.drivers.find(d => d !== favoriteDriverName)
  if (!teammateName) return null
  return list.find(d => (d[nameKey] ?? '').toLowerCase() === teammateName.toLowerCase()) ?? null
}

/**
 * Telemetry view of Race analysis. The page owns season and race (one picker for every view); this view owns the drivers.
 * `memo` is a ref held by the page: the driver selection survives a switch to another view and back.
 * Seasons before 2023 (`isHistorical`) show the season archive for one driver instead of lap data.
 */
export default function TelemetryView({ season, raceId, cassRaces, dbOffline, memo }) {
  const { isMobile } = useBreakpoint()
  const { prefs } = usePreferences()
  const year = season
  const isHistorical = isHistoricalSeason(season)
  const [driverId, setDriverId] = useState('')

  // ── Cassandra: drivers list ─────────────────────────
  const [cassDrivers,    setCassDrivers]    = useState([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)

  // ── Driver B (comparison) ──────────────────────────
  const [driverIdB, setDriverIdB] = useState('')

  // ── Sector X-Ray ───────────────────────────────────
  const [activeSector, setActiveSector] = useState(null)

  // ── Hooks ──────────────────────────────────────────
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // A new season (or leaving the season archive) starts with no driver chosen
  useEffect(() => { setDriverId(''); setDriverIdB('') }, [season])

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
        const kept = memo?.current
        if (sorted.length && kept?.raceId === raceId && sorted.some(d => d.driverId === kept.driverId)) {
          setDriverId(kept.driverId)
          setDriverIdB(sorted.some(d => d.driverId === kept.driverIdB) ? kept.driverIdB : '')
        } else if (sorted.length) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceId])

  // Remember the selection for this race so another view and back keeps it
  useEffect(() => {
    if (memo && raceId && driverId) memo.current = { raceId, driverId, driverIdB }
  }, [memo, raceId, driverId, driverIdB])

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

  const selectedCassDriver  = cassDrivers.find(d => d.driverId === driverId)
  const selectedCassDriverB = cassDrivers.find(d => d.driverId === driverIdB)
  const selectedHistDriver  = histDrivers.find(d => d.driverId === driverId)

  // Team colors, lifted to >= 3:1 on the page background (teamMark); B is also dashed so teammates stay distinct
  const colorA = markFor(selectedCassDriver?.teamName, SERIES_A)
  const colorB = markFor(selectedCassDriverB?.teamName, SERIES_B)
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
    <div className="min-w-0">
      <p className="text-sm text-ink-2">
        {isHistorical ? `Season results for one driver, ${year}.` : 'Lap times, tyres, sectors and pit stops for one or two drivers.'}
      </p>

      <Rise index={0} className="mt-pw-4">
        <TelemetryControls
          isHistorical={isHistorical}
          driverId={driverId}    onDriverChange={setDriverId}
          histDrivers={histDrivers}   cassDrivers={cassDrivers}
          loadingDrivers={loadingDrivers}  loadingHist={loadingHist}
          driverIdB={driverIdB}  onDriverBChange={setDriverIdB}    laps={laps}  loadingB={loadingB}
          loading={loading}      onLoad={isHistorical ? loadHistoricalData : loadCassandraTelemetry}
          favoriteDriverId={favoriteDriverId} raceId={raceId}
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
    </div>
  )
}
