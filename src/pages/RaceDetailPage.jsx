import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useParams, useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import Panel from '../components/ui/Panel'
import TabBar from '../components/ui/TabBar'
import EmptyState from '../components/ui/EmptyState'
import { racesApi } from '../services/api'
import PageHint from '../components/ui/PageHint'
import WeekendSchedule from '../components/race/WeekendSchedule'
import PracticePanel from '../components/race/PracticePanel'
import DriverDrawer from '../components/ui/DriverDrawer'
import RaceHeroPanel from '../components/race/RaceHeroPanel'
import RaceStatCards from '../components/race/RaceStatCards'
import RaceResultsTable from '../components/race/RaceResultsTable'
import QualifyingTable from '../components/race/QualifyingTable'
import SprintResultsTable from '../components/race/SprintResultsTable'
import SprintQualifyingTable from '../components/race/SprintQualifyingTable'

const RaceTelemetrySection = lazy(() => import('../components/race/RaceTelemetrySection'))

export default function RaceDetailPage() {
  const { isMobile } = useBreakpoint()
  const { season, round } = useParams()
  const navigate = useNavigate()
  const [race,    setRace]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const [tab, setTab] = useState(null)
  const [selectedDriver, setSelectedDriver] = useState(null)

  useEffect(() => {
    setTab(null)
    setLoading(true)
    racesApi.getByRound(season, round)
      .then(setRace)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [season, round])

  const goToTelemetry = useCallback(
    () => navigate(`/telemetry?year=${season}`),
    [navigate, season]
  )

  const results                 = race?.Results                 || []
  const sprintResults           = race?.SprintResults           || []
  const qualifyingResults       = race?.QualifyingResults       || []
  const sprintQualifyingResults = race?.SprintQualifyingResults || []
  const schedule                = race?.schedule                || null

  // isSprint: backend sets schedule.isSprint; fallback to result arrays if schedule not yet loaded
  const isSprint = !!(schedule?.isSprint || sprintResults.length || sprintQualifyingResults.length)

  const SPRINT_BADGE = <span style={{ marginLeft: '0.35rem', fontSize: '0.55rem', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', borderRadius: 3, padding: '1px 4px' }}>SPRINT</span>

  const TABS = useMemo(() => {
    const t = []
    // Practice 1
    if (schedule?.fp1) t.push({ id: 'fp1', label: 'FP1' })
    if (isSprint) {
      // Sprint weekend: FP1 → Sprint Shootout → Sprint → Qualifying → Race
      if (schedule?.sprintQualifying || sprintQualifyingResults.length)
        t.push({ id: 'sq',     label: 'Sprint Shootout', badge: SPRINT_BADGE })
      if (schedule?.sprint || sprintResults.length)
        t.push({ id: 'sprint', label: 'Sprint',          badge: SPRINT_BADGE })
    } else {
      // Normal weekend: FP1 → FP2 → FP3 → Qualifying → Race
      if (schedule?.fp2) t.push({ id: 'fp2', label: 'FP2' })
      if (schedule?.fp3) t.push({ id: 'fp3', label: 'FP3' })
    }
    // Qualifying — show if schedule has it, we have results, or a live timing snapshot exists
    if (schedule?.qualifying || qualifyingResults.length || race?.qualifyingSnapshot)
      t.push({ id: 'quali', label: 'Qualifying' })
    // Race — always shown
    t.push({ id: 'race', label: 'Race Results' })
    return t
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.length, qualifyingResults.length, sprintResults.length, sprintQualifyingResults.length, schedule, isSprint, race?.qualifyingSnapshot])

  if (loading) return (
    <PageWrapper>
      <EmptyState type="loading" message="Loading race..." height={120} page />
    </PageWrapper>
  )
  if (error || !race) return (
    <PageWrapper>
      <EmptyState type="error" message={error || 'Race not found'} height={120} />
    </PageWrapper>
  )

  // Default to Race Results if available (and past), otherwise first tab
  const activeTab  = tab || (results.length ? 'race' : (TABS[0]?.id ?? null))
  // A race is "upcoming" only if it hasn't started yet (date + 4h buffer)
  const raceStartMs = race.date
    ? new Date(`${race.date}T${(race.time || '00:00:00').replace(/Z$/i, '')}Z`).getTime()
    : null
  const isUpcoming = raceStartMs
    ? Date.now() < raceStartMs + 4 * 60 * 60 * 1000
    : !results.length

  return (
    <>
    <PageWrapper>
      <button
        className="btn btn--ghost"
        style={{ fontSize: '0.75rem', marginBottom: '1rem', padding: '0.3rem 0.75rem' }}
        onClick={() => navigate(`/races?season=${season}`)}
      >
        ← Back to Races
      </button>
      <PageHint
        id="race_detail"
        title="Race Detail"
        text="Navigate between weekend sessions using the tabs. In Race Results, the arrows show positions gained or lost from the starting grid."
        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
      />

      <RaceHeroPanel race={race} />

      <WeekendSchedule schedule={race.schedule} />

      {!isUpcoming && (
        <RaceStatCards
          results={results}
          qualifyingResults={qualifyingResults}
          isMobile={isMobile}
        />
      )}

      {TABS.length > 0 && (
        <Panel padding="none" className="card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
          <TabBar
            variant="underline"
            accentColor="var(--f1-red)"
            tabs={TABS}
            activeTab={activeTab}
            onChange={setTab}
          />

          {['fp1', 'fp2', 'fp3'].includes(activeTab) && (
            <PracticePanel
              sessionKey={activeTab}
              scheduleEntry={schedule?.[activeTab]}
              season={season}
              round={round}
              onGoTelemetry={goToTelemetry}
            />
          )}

          {activeTab === 'race' && (
            <RaceResultsTable
              results={results}
              isMobile={isMobile}
              onDriverClick={setSelectedDriver}
              raceDate={race.date}
            />
          )}

          {activeTab === 'quali' && (
            <QualifyingTable
              qualifyingResults={qualifyingResults}
              qualifyingSnapshot={race.qualifyingSnapshot}
              isMobile={isMobile}
              onDriverClick={setSelectedDriver}
              schedule={schedule}
            />
          )}

          {activeTab === 'sprint' && (
            <SprintResultsTable
              sprintResults={sprintResults}
              isMobile={isMobile}
              onDriverClick={setSelectedDriver}
              schedule={schedule}
            />
          )}

          {activeTab === 'sq' && (
            <SprintQualifyingTable
              sprintQualifyingResults={sprintQualifyingResults}
              schedule={schedule}
            />
          )}
        </Panel>
      )}

      <Suspense fallback={
        <Panel accent="cassandra" style={{ marginTop: '1rem' }}>
          <EmptyState type="loading" message="Loading telemetry..." height={80} />
        </Panel>
      }>
        <RaceTelemetrySection
          season={race.season}
          raceName={race.raceName}
          circuitLocality={race.Circuit?.Location?.locality}
          isUpcoming={isUpcoming}
        />
      </Suspense>
    </PageWrapper>
    {!isMobile && <DriverDrawer driver={selectedDriver} onClose={() => setSelectedDriver(null)} />}
    </>
  )
}
