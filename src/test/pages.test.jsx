import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { dashboard, nextRace, live, tower, seasonStandings, ctorStandings } from './fixtures'

const liveState = { available: false, sessionName: null }
vi.mock('../contexts/LiveStatusContext', () => ({ useLiveStatus: () => liveState }))
vi.mock('../services/api', () => ({
  dashboardApi: { get: vi.fn(), getLive: vi.fn() },
  statsApi: { getSeasonStandings: vi.fn(), getConstructorStandings: vi.fn(), circuitHistory: vi.fn() },
  telemetryApi: { getTimingTower: vi.fn(), getCarPositions: vi.fn(), getCarData: vi.fn(), getWinnerStrategy: vi.fn(), getSafetyCar: vi.fn(), getAvailableRaces: vi.fn() },
  circuitsApi: { getById: vi.fn() },
  racesApi: { getByRound: vi.fn(), getBySeason: vi.fn(), getSessionSnapshot: vi.fn() },
}))
vi.mock('../components/ui/DriverDrawer', () => ({ default: ({ driver }) => (driver ? <p>drawer:{driver.name}</p> : null) }))
vi.mock('../components/ui/ConstructorDrawer', () => ({ default: ({ constructor: c }) => (c ? <p>cdrawer:{c.name}</p> : null) }))
vi.mock('../components/home/CircuitRadarCanvas', () => ({ default: () => <div data-testid="radar" /> }))
vi.mock('../components/circuits/CircuitDNAPanel', () => ({ default: () => <p>dna</p> }))
vi.mock('../components/circuit/CircuitSilhouette', async (orig) => ({ ...(await orig()), default: () => <svg data-testid="sil" /> }))

import { dashboardApi, statsApi, telemetryApi, circuitsApi, racesApi } from '../services/api'
import HomePage from '../pages/HomePage'
import LivePage from '../pages/LivePage'
import RaceWeekendPage from '../pages/RaceWeekendPage'
import NextRaceRedirect from '../components/race/NextRaceRedirect'
import { resetRaceWeekendCache } from '../hooks/useRaceWeekend'
import { RaceProvider } from '../contexts/RaceContext'
import LiveRacePanel from '../components/home/LiveRacePanel'
import LiveConsoleDashboard from '../components/home/LiveConsoleDashboard'
import LiveTelemetryStrip from '../components/home/LiveTelemetryStrip'
import HomeFooter from '../components/home/HomeFooter'
import HomeHero from '../components/home/HomeHero'
import TitleFightCard from '../components/home/TitleFightCard'
import LastSessionPanel from '../components/home/LastSessionPanel'
import HomeStandingsPanel from '../components/home/HomeStandingsPanel'
import WeekendSchedulePanel from '../components/nextrace/WeekendSchedulePanel'
import CircuitMapPanel from '../components/nextrace/CircuitMapPanel'
import LastGPPanel from '../components/nextrace/LastGPPanel'
import PoleRecordPanel from '../components/nextrace/PoleRecordPanel'
import RaceExpectationsPanel from '../components/nextrace/RaceExpectationsPanel'
import StrategyOutlookPanel from '../components/nextrace/StrategyOutlookPanel'
import NextRaceHero from '../components/nextrace/NextRaceHero'

// HomePage loads the drawers with React.lazy(import()). The first dynamic import of a module goes through the
// transform/instrumentation pipeline and can take longer than findBy's 1000 ms under coverage, so warm the module
// cache once; the lazy components then resolve from cache on the next microtask.
beforeAll(async () => {
  await Promise.all([import('../components/ui/DriverDrawer'), import('../components/ui/ConstructorDrawer')])
})

const at = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)
const flush = () => act(async () => { await Promise.resolve() })

beforeEach(() => {
  vi.clearAllMocks()
  resetRaceWeekendCache()
  liveState.available = false; liveState.sessionName = null
  const mem = new Map()
  vi.stubGlobal('localStorage', { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) })
  delete window.matchMedia
  dashboardApi.get.mockResolvedValue(dashboard())
  dashboardApi.getLive.mockResolvedValue(live())
  statsApi.getSeasonStandings.mockResolvedValue(seasonStandings())
  statsApi.getConstructorStandings.mockResolvedValue(ctorStandings())
  statsApi.circuitHistory.mockResolvedValue(null)
  telemetryApi.getTimingTower.mockResolvedValue(null)
  telemetryApi.getCarPositions.mockResolvedValue({ positions: {} })
  telemetryApi.getCarData.mockResolvedValue({ telemetry: { 1: { gear: 7, rpm: 12000, throttle: 90, brake: 0 } } })
  telemetryApi.getWinnerStrategy.mockResolvedValue({ stints: [{ compound: 'SOFT', laps: 20 }, { compound: 'HARD', laps: 30 }] })
  telemetryApi.getSafetyCar.mockResolvedValue([{ type: 'SC' }, { type: 'VSC' }])
  telemetryApi.getAvailableRaces.mockResolvedValue([])
  circuitsApi.getById.mockResolvedValue({ circuitName: 'Hungaroring', Location: { lat: '47.5', long: '19.2' }, trackCoords: [[1, 2], [2, 3]] })
  racesApi.getBySeason.mockResolvedValue([{ round: '12', raceName: 'Belgian Grand Prix' }, { round: '13', raceName: 'Hungarian Grand Prix' }, { round: '14', raceName: 'Dutch Grand Prix' }])
  racesApi.getByRound.mockImplementation(async () => weekendRace())
})

// The Hungarian GP weekend as GET /api/races/:season/:round answers it (no results yet)
const weekendRace = (over = {}) => {
  const n = nextRace()
  return { season: n.season, round: n.round, raceName: n.raceName, date: n.schedule.race.date, Circuit: { circuitId: n.circuitId, circuitName: 'Hungaroring', Location: { locality: n.locality, country: n.country, lat: '47.5', long: '19.2' } }, schedule: n.schedule, ...over }
}
const atWeekend = (url = '/races/2026/13') => render(<MemoryRouter initialEntries={[url]}><Routes><Route path="/races/:season/:round" element={<RaceWeekendPage />} /></Routes></MemoryRouter>)
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('HomePage', () => {
  it('renders the widgets in order and opens the driver drawer', async () => {
    at(<HomePage />)
    // Wait for the loaded card (the loading skeleton has its own heading node). Text and label queries are used on
    // purpose: getByRole computes accessible names for the whole page and, under coverage instrumentation, a single
    // role query can take longer than findBy's 1000 ms window.
    await screen.findByText('Show full battle')
    expect(screen.getByText('Title fight', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getByText('Dashboard', { selector: 'h1' })).toBeInTheDocument()
    const order = [...document.querySelectorAll('[data-widget]')].map(n => n.getAttribute('data-widget'))
    expect(order).toEqual(['hero', 'titleFight', 'lastSession', 'standings', 'goDeeper'])
    fireEvent.click(await screen.findByLabelText(/Max Verstappen, position 1/))
    expect(screen.getByText('drawer:Max Verstappen')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Constructors', { selector: 'button' }))
    fireEvent.click(await screen.findByLabelText(/McLaren, position 1/))
    expect(await screen.findByText('cdrawer:McLaren')).toBeInTheDocument()
    fireEvent.click(screen.getAllByLabelText(/Lando Norris, position 1/)[0])
  })
  it('error state shows per-widget retry that reloads', async () => {
    dashboardApi.get.mockRejectedValueOnce(new Error('x'))
    at(<HomePage />)
    const retries = await screen.findAllByRole('button', { name: 'Try again' })
    expect(retries.length).toBeGreaterThanOrEqual(3)
    fireEvent.click(retries[0])
    // Wait for the loaded card (the loading skeleton has its own heading node)
    await screen.findByRole('link', { name: 'Show full battle' })
    expect(screen.getByRole('heading', { name: 'Title fight' })).toBeInTheDocument()
    expect(screen.queryByText('x')).toBeNull()
  })
  it('live: shows live race panel and polls only while live', async () => {
    liveState.available = true
    at(<HomePage />)
    expect(await screen.findByText('Full classification')).toBeInTheDocument()
    expect(dashboardApi.getLive).toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Open live timing' })).toHaveAttribute('href', '/live')
  })
  it('live tower at lg+ shows the live console', async () => {
    window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })
    Object.defineProperty(window, 'innerWidth', { value: 1100, configurable: true })
    telemetryApi.getTimingTower.mockResolvedValue(tower())
    at(<HomePage />)
    expect(await screen.findByRole('region', { name: 'Live timing table' })).toBeInTheDocument()
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
  })
})

describe('home widgets', () => {
  it('HomeHero: loading, error, empty, live and upcoming', () => {
    const { rerender } = at(<HomeHero loading />)
    expect(screen.getByLabelText('Loading next session')).toBeInTheDocument()
    rerender(<MemoryRouter><HomeHero error onRetry={() => {}} race={null} /></MemoryRouter>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    rerender(<MemoryRouter><HomeHero race={null} /></MemoryRouter>)
    expect(screen.getByText('No upcoming session.')).toBeInTheDocument()
    liveState.available = true; liveState.sessionName = 'Sprint'
    rerender(<MemoryRouter><HomeHero race={nextRace()} /></MemoryRouter>)
    expect(screen.getByText('Live now')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Sprint' })).toBeInTheDocument()
  })
  it('HomeHero upcoming shows spoken countdown and ladder', async () => {
    at(<HomeHero race={nextRace()} />)
    expect(await screen.findByText(/starts in/)).toBeInTheDocument()
    // The session ladder is now the SessionTimeline (an ordered list of sessions with status text).
    const list = document.querySelector('[data-timeline-list]')
    expect(list).toBeInTheDocument()
    expect(list.querySelectorAll('li[data-status]').length).toBeGreaterThan(1)
  })
  it('TitleFightCard states', () => {
    const d = dashboard()
    const { rerender } = at(<TitleFightCard loading />)
    expect(screen.getByLabelText('Loading title fight')).toBeInTheDocument()
    rerender(<MemoryRouter><TitleFightCard error onRetry={() => {}} data={null} /></MemoryRouter>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    rerender(<MemoryRouter><TitleFightCard data={{ standings: [] }} /></MemoryRouter>)
    expect(screen.getByText(/Standings appear after/)).toBeInTheDocument()
    rerender(<MemoryRouter><TitleFightCard data={d} /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Show full battle' })).toHaveAttribute('href', '/standings')
    expect(screen.getByRole('link', { name: /Lando Norris/ })).toHaveAttribute('href', '/drivers/lando')
    rerender(<MemoryRouter><TitleFightCard data={{ ...d, roundsDone: 24 }} /></MemoryRouter>)
    expect(screen.getByText(/is champion|can no longer be caught/)).toBeInTheDocument()
  })
  it('LastSessionPanel states incl. qualifying, practice and pending', () => {
    const s = dashboard().lastSession
    const { rerender } = at(<LastSessionPanel loading />)
    expect(screen.getByLabelText('Loading last session')).toBeInTheDocument()
    rerender(<MemoryRouter><LastSessionPanel error onRetry={() => {}} /></MemoryRouter>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    rerender(<MemoryRouter><LastSessionPanel /></MemoryRouter>)
    expect(screen.getByText(/Results appear after/)).toBeInTheDocument()
    const onDriverClick = vi.fn()
    rerender(<MemoryRouter><LastSessionPanel session={s} onDriverClick={onDriverClick} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Lando Norris, position 1, / }))
    expect(onDriverClick).toHaveBeenCalled()
    expect(screen.getByText('Fastest lap')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Full results' })).toHaveAttribute('href', '/races/2026/12')
    rerender(<MemoryRouter><LastSessionPanel session={{ sessionType: 'Qualifying', sessionLabel: 'Quali', top3: [{ position: 1, name: 'A B', points: 0 }] }} /></MemoryRouter>)
    expect(screen.getByText('A B')).toBeInTheDocument()
    rerender(<MemoryRouter><LastSessionPanel session={{ sessionType: 'FP1', sessionLabel: 'Practice 1' }} /></MemoryRouter>)
    expect(screen.getByText('Practice 1 completed')).toBeInTheDocument()
    rerender(<MemoryRouter><LastSessionPanel session={{ sessionType: 'Race', sessionLabel: 'Race', resultsPending: true }} /></MemoryRouter>)
    expect(screen.getByText('Results pending')).toBeInTheDocument()
    rerender(<MemoryRouter><LastSessionPanel session={{ sessionType: 'Other', sessionLabel: 'X' }} /></MemoryRouter>)
    expect(screen.getByText('No results yet')).toBeInTheDocument()
  })
  it('HomeStandingsPanel states', async () => {
    const d = dashboard()
    const props = { standingsTab: 'drivers', onTabChange: vi.fn(), onDriverClick: vi.fn(), onConstructorClick: vi.fn() }
    const { rerender } = at(<HomeStandingsPanel {...props} loading />)
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    rerender(<MemoryRouter><HomeStandingsPanel {...props} error onRetry={() => {}} /></MemoryRouter>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    rerender(<MemoryRouter><HomeStandingsPanel {...props} data={{ ...d, standings: [] }} /></MemoryRouter>)
    expect(screen.getByText('Standings not available yet')).toBeInTheDocument()
    rerender(<MemoryRouter><HomeStandingsPanel {...props} data={d} /></MemoryRouter>)
    await flush()
    expect(screen.getByText('After round 12 of 24')).toBeInTheDocument()
    expect(screen.getByText('−19')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Constructors' }))
    expect(props.onTabChange).toHaveBeenCalledWith('constructors')
  })
  it('HomeFooter renders attribution', () => {
    render(<HomeFooter />)
    expect(screen.getByText(/Data from the Jolpica F1 API/)).toBeInTheDocument()
  })
  it('LiveRacePanel: live, finished, no status, qualifying', () => {
    const { rerender } = at(<LiveRacePanel live={live()} />)
    expect(screen.getByText('Yellow flag')).toBeInTheDocument()
    expect(screen.getByText('Leader')).toBeInTheDocument()
    rerender(<MemoryRouter><LiveRacePanel live={live({ finished: true, trackStatus: null, updatedAt: null })} /></MemoryRouter>)
    expect(screen.getByText(/Race finished/)).toBeInTheDocument()
    expect(screen.queryByText('Full classification')).toBeNull()
    rerender(<MemoryRouter><LiveRacePanel live={live({ isRaceType: false, top3: undefined })} /></MemoryRouter>)
  })
  it('LiveConsoleDashboard selects a driver and shows telemetry', async () => {
    at(<LiveConsoleDashboard tower={tower()} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByTestId('radar')).toBeInTheDocument()
    const btn = screen.getAllByRole('button', { pressed: false })[0]
    fireEvent.click(btn)
    expect(await screen.findByText(/Telemetry: VER/)).toBeInTheDocument()
    // the strip renders its header first and the telemetry after the poll resolves
    expect(await screen.findByText('12,000 RPM')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { pressed: true })[0])
    expect(screen.queryByText(/Telemetry: VER/)).toBeNull()
  })
  it('LiveTelemetryStrip: null without driver, keeps last data on a failed poll', async () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<LiveTelemetryStrip driverNum={null} />)
    expect(container.firstChild).toBeNull()
    rerender(<LiveTelemetryStrip driverNum="1" driverName="VER" />)
    await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
    expect(screen.getByText('Gear')).toBeInTheDocument()
    telemetryApi.getCarData.mockRejectedValue(new Error('x'))
    await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
    expect(screen.getByText('Gear')).toBeInTheDocument()
  })
})

describe('LivePage', () => {
  it('no live session: empty state with next session and link', async () => {
    at(<RaceProvider><LivePage /></RaceProvider>)
    expect(await screen.findByText('No live session')).toBeInTheDocument()
    expect(await screen.findByText(/Next: /)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /schedule/ })).toHaveAttribute('href', '/races/2026/13')
    expect(dashboardApi.getLive).not.toHaveBeenCalled()
  })
  it('live: renders tower, banner, polls every 2s and shows interruption banner on failure', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    liveState.available = true
    at(<RaceProvider><LivePage /></RaceProvider>)
    expect(screen.getByText('Connecting')).toBeInTheDocument()
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Yellow flag')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Hungarian Grand Prix' })).toBeInTheDocument()
    const calls = dashboardApi.getLive.mock.calls.length
    dashboardApi.getLive.mockRejectedValue(new Error('down'))
    await act(async () => { await vi.advanceTimersByTimeAsync(2100) })
    expect(dashboardApi.getLive.mock.calls.length).toBeGreaterThan(calls)
    expect(await screen.findByText(/Live feed interrupted, retrying/)).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument() // last known data kept
    dashboardApi.getLive.mockResolvedValue(live({ classification: [] }))
    await act(async () => { await vi.advanceTimersByTimeAsync(2100) })
    expect(await screen.findByText('Waiting for data')).toBeInTheDocument()
  })
  it('live feed failing from the start shows the interruption banner and empty state', async () => {
    liveState.available = true
    dashboardApi.getLive.mockRejectedValue(new Error('x'))
    at(<RaceProvider><LivePage /></RaceProvider>)
    expect(await screen.findByText(/Live feed interrupted/)).toBeInTheDocument()
    expect(screen.getByText('No live session')).toBeInTheDocument()
  })
})

describe('RaceWeekendPage (preview) and panels', () => {
  it('loading, then hero + schedule + circuit sections in preview order (DoD-4, DoD-16)', async () => {
    atWeekend()
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Hungarian Grand Prix' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Calendar 2026' })).toHaveAttribute('href', '/calendar?season=2026')
    expect(screen.getByRole('heading', { name: 'Weekend schedule' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Track map' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Load map' })).toBeInTheDocument()
    expect(document.querySelector('iframe')).toBeNull() // nothing third-party until the user asks
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(circuitsApi.getById).toHaveBeenCalledWith('hungaroring')
    expect(statsApi.circuitHistory).toHaveBeenCalledWith('hungaroring')
    expect(document.querySelector('[data-phase="preview"]')).toBeInTheDocument()
    expect(screen.queryByRole('tablist', { name: 'Session results' })).toBeNull()
  })
  it('previous and next round links come from the season calendar and are absent at the ends', async () => {
    atWeekend()
    expect(await screen.findByRole('link', { name: 'Previous round, Belgian Grand Prix' })).toHaveAttribute('href', '/races/2026/12')
    expect(screen.getByRole('link', { name: 'Next round, Dutch Grand Prix' })).toHaveAttribute('href', '/races/2026/14')
  })
  it('a round without a next or previous neighbour hides that link', async () => {
    racesApi.getBySeason.mockResolvedValue([{ round: '13', raceName: 'Hungarian Grand Prix' }, { round: '14', raceName: 'Dutch Grand Prix' }])
    atWeekend()
    await screen.findByRole('link', { name: /Next round/ })
    expect(screen.queryByRole('link', { name: /Previous round/ })).toBeNull()
  })
  it('invalid params and unknown rounds show the not-found state with a calendar link', async () => {
    atWeekend('/races/abc/1')
    expect(await screen.findByText('That race weekend does not exist')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the calendar' })).toHaveAttribute('href', '/calendar')
    expect(racesApi.getByRound).not.toHaveBeenCalled()
  })
  it('an API failure shows Retry and a calendar link; Retry recovers', async () => {
    racesApi.getByRound.mockRejectedValueOnce(new Error('x'))
    atWeekend()
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load this race weekend")
    expect(screen.getByRole('link', { name: 'Back to the calendar' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Hungarian Grand Prix' })).toBeInTheDocument()
  })
  it('a completed round leads with the result tables, then stat cards, schedule in a collapsed disclosure (DoD-16, DoD-17)', async () => {
    const res = (pos, id, fam, team, grid) => ({ position: pos, grid, points: '25', status: 'Finished', Time: { time: '1:31:44.2' }, Driver: { driverId: id, givenName: 'G', familyName: fam, code: fam.slice(0, 3).toUpperCase() }, Constructor: { constructorId: team, name: team } })
    racesApi.getByRound.mockResolvedValue(weekendRace({
      Results: [res('1', 'a', 'Alpha', 'mclaren', '2'), res('2', 'b', 'Bravo', 'ferrari', '1')],
      QualifyingResults: [{ position: '1', Q1: '1:20.0', Q2: '1:19.5', Q3: '1:19.1', Driver: { driverId: 'b', givenName: 'G', familyName: 'Bravo' }, Constructor: { constructorId: 'ferrari', name: 'Ferrari' } }],
      SprintResults: [res('1', 'b', 'Bravo', 'ferrari', '1')],
    }))
    telemetryApi.getAvailableRaces.mockResolvedValue([{ raceId: '2026_9912', round: 13, raceName: 'Hungarian Grand Prix' }])
    atWeekend()
    expect(await screen.findByRole('tablist', { name: 'Session results' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Race', 'Qualifying', 'Sprint', 'Practice'])
    expect(screen.getByRole('tab', { name: 'Race' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'weekend-tab-race')
    expect(screen.getByRole('list', { name: 'Race classification' }).querySelectorAll('li')).toHaveLength(2)
    const facts = document.querySelector('[data-stat-cards]')
    const panel = document.getElementById('weekend-results-panel')
    expect(panel.compareDocumentPosition(facts) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const toggle = screen.getByRole('button', { name: 'Weekend schedule' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(await screen.findByRole('link', { name: 'Analyse this race' })).toHaveAttribute('href', '/analysis?race=2026_9912')
    fireEvent.click(screen.getByRole('tab', { name: 'Qualifying' }))
    expect(screen.getByRole('list', { name: 'Qualifying classification' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Qualifying' })).toHaveAttribute('aria-selected', 'true')
  })
  it('live state: Live now and a live timing link', async () => {
    const n = nextRace()
    dashboardApi.get.mockResolvedValue({ ...dashboard(), nextRace: { ...n, currentSession: { isLive: true, key: 'fp2', label: 'Practice 2' } } })
    atWeekend()
    expect(await screen.findByText('Live now')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open live timing' })).toHaveAttribute('href', '/live')
  })
  it('/next-race resolves the next round and replaces the URL; no next race goes to the calendar (DoD-3)', async () => {
    const Where = () => <output data-testid="where">{useLocation().pathname}</output>
    const go = () => render(<MemoryRouter initialEntries={['/next-race']}><Routes><Route path="/next-race" element={<NextRaceRedirect />} /><Route path="*" element={<Where />} /></Routes></MemoryRouter>)
    const { unmount } = go()
    expect(await screen.findByTestId('where')).toHaveTextContent('/races/2026/13')
    unmount()
    resetRaceWeekendCache()
    dashboardApi.get.mockResolvedValue({ nextRace: null })
    const second = go()
    expect(await screen.findByTestId('where')).toHaveTextContent('/calendar')
    second.unmount()
    resetRaceWeekendCache()
    dashboardApi.get.mockRejectedValue(new Error('x'))
    go()
    expect(await screen.findByRole('alert')).toHaveTextContent('Race data is unavailable')
    expect(screen.getByRole('link', { name: 'Open the calendar' })).toHaveAttribute('href', '/calendar')
    dashboardApi.get.mockResolvedValue(dashboard())
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByTestId('where')).toHaveTextContent('/races/2026/13')
  })
  it('live session shows Live now in the hero', () => {
    const r = nextRace(); const liveSess = { key: 'race', label: 'Race', isLive: true }
    at(<NextRaceHero race={r} circuit={{ circuitName: 'X', trackCoords: [[1, 1]] }} live={liveSess} countdown={null} flagUrl="https://flagcdn.com/w40/hu.png" />)
    expect(screen.getByText('Live now')).toBeInTheDocument()
  })
  it('hero without countdown/live renders no timer', () => {
    at(<NextRaceHero race={nextRace()} circuit={null} live={null} countdown={null} flagUrl={null} />)
    expect(screen.queryByText(/starts in/)).toBeNull()
  })
  it('WeekendSchedulePanel: timezone select persists, weather and missing schedule', () => {
    const r = nextRace()
    const today = r.schedule.fp2.date
    const { rerender } = at(<WeekendSchedulePanel schedule={r.schedule} liveKey="fp3" nextSessionKey="fp2" weather={{ [today]: { code: 61, tempMax: 20, tempMin: 10, precipProb: 40 } }} />)
    fireEvent.change(screen.getByLabelText(/Times in/), { target: { value: 'Asia/Tokyo' } })
    expect(localStorage.getItem('f1_tz')).toBe('Asia/Tokyo')
    expect(screen.getAllByText(/20° \/ 10°, 40% rain/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Live').length).toBeGreaterThan(0)
    rerender(<MemoryRouter><WeekendSchedulePanel schedule={null} /></MemoryRouter>)
    expect(screen.getByText('Schedule not available yet.')).toBeInTheDocument()
  })
  it('CircuitMapPanel only builds URLs from finite numbers and sandboxes the iframe', () => {
    const { container, rerender } = render(<CircuitMapPanel lat="47.5" lng="19.2" />)
    expect(container.querySelector('iframe')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Load map' }))
    const f = container.querySelector('iframe')
    expect(f.getAttribute('src')).toMatch(/^https:\/\/www\.openstreetmap\.org\/export\/embed\.html\?bbox=[\d.,-]+&layer=mapnik&marker=47\.5,19\.2$/)
    expect(f).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin')
    expect(f).toHaveAttribute('referrerpolicy', 'no-referrer')
    expect(screen.getByRole('link', { name: 'Open in OpenStreetMap' })).toHaveAttribute('rel', 'noopener noreferrer')
    rerender(<CircuitMapPanel lat={'1&x=<script>'} lng="2" />)
    expect(container.querySelector('iframe')?.getAttribute('src') ?? '').not.toContain('script')
    rerender(<CircuitMapPanel />)
    expect(container.firstChild).toBeNull()
  })
  const specs = { tireStress: 9, braking: 8, drs: 2, throttle: 70, turns: 20, topSpeed: 320, gforce: 5, length: 4.4, laps: 70, gearChanges: 44, pitLoss: 21 }
  it('spec panels render across thresholds and null specs', () => {
    for (const s of [specs, { ...specs, tireStress: 6, braking: 4, turns: 16, throttle: 30, drs: 1 }, { ...specs, tireStress: 2, braking: 2, turns: 10, throttle: 10, drs: 0, pitLoss: 0 }]) {
      const { unmount } = render(<><PoleRecordPanel specs={s} /><RaceExpectationsPanel specs={s} /><StrategyOutlookPanel specs={s} /></>)
      expect(screen.getByText('Tire deg')).toBeInTheDocument()
      unmount()
    }
    const { container } = render(<><PoleRecordPanel specs={null} /><RaceExpectationsPanel specs={null} /><StrategyOutlookPanel specs={null} /></>)
    expect(container.firstChild).toBeNull()
  })
  const history = () => ({
    cassandraRaceId: '2025_12', races: [{}],
    lastRace: {
      season: '2025', raceName: 'Hungarian Grand Prix', Circuit: { Location: { locality: 'Budapest' } },
      QualifyingResults: [{ position: '1', Q3: '1:15.0', Driver: { givenName: 'Lando', familyName: 'Norris' }, Constructor: { constructorId: 'mclaren' } }],
      Results: [
        { position: '1', grid: '1', status: 'Finished', Driver: { givenName: 'Lando', familyName: 'Norris' }, Constructor: { constructorId: 'mclaren', name: 'McLaren' }, FastestLap: { rank: '1', Time: { time: '1:20.1' } } },
        { position: '2', grid: '4', status: 'Finished', Driver: { givenName: 'Oscar', familyName: 'Piastri' }, Constructor: { constructorId: 'mclaren', name: 'McLaren' } },
        { position: '3', grid: '3', status: 'Finished', Driver: { givenName: 'Max', familyName: 'Verstappen' }, Constructor: { constructorId: 'red_bull', name: 'RB' } },
        { position: '18', grid: '0', status: 'Did not start', Driver: { givenName: 'A', familyName: 'B' }, Constructor: {} },
        { position: '19', grid: '9', status: 'Engine', Driver: { givenName: 'C', familyName: 'D' }, Constructor: {} },
      ],
    },
  })
  it('LastGPPanel: podium, technical, strategy recap from telemetry', async () => {
    at(<LastGPPanel history={history()} />)
    expect(screen.getByText('Podium')).toBeInTheDocument()
    expect(await screen.findByText('1 SC / 1 VSC')).toBeInTheDocument()
    expect(screen.getByText('DNF')).toBeInTheDocument()
    expect(screen.getByText('DNS')).toBeInTheDocument()
    expect(screen.getByText('Soft tyre')).toBeInTheDocument()
  })
  it('LastGPPanel fallback matching without raceId, fastest by time, and empty history', async () => {
    const h = history(); delete h.cassandraRaceId
    h.lastRace.Results[0].FastestLap = { Time: { time: '1:20.1' } }
    h.lastRace.QualifyingResults = []
    telemetryApi.getAvailableRaces.mockResolvedValue([{ raceId: '2024_12', raceName: 'Hungarian Grand Prix' }, { raceId: '2025_12', raceName: 'Hungarian Grand Prix' }, { raceId: '2020_1', raceName: 'Other' }])
    telemetryApi.getSafetyCar.mockResolvedValue([])
    at(<LastGPPanel history={h} />)
    await waitFor(() => expect(telemetryApi.getWinnerStrategy).toHaveBeenCalledWith('2025_12'))
    expect(await screen.findByText('None')).toBeInTheDocument()
    render(<LastGPPanel history={{ races: [] }} />)
    expect(screen.getByText('No previous race at this circuit yet')).toBeInTheDocument()
  })
})

describe('feed shape hardening in pages/widgets', () => {
  it('LivePage survives non-array classification from the feed', async () => {
    liveState.available = true
    dashboardApi.getLive.mockResolvedValue(live({ classification: { length: 1 } }))
    at(<RaceProvider><LivePage /></RaceProvider>)
    expect(await screen.findByText('Waiting for data')).toBeInTheDocument()
  })
  it('LiveRacePanel and LiveConsoleDashboard survive non-array top3/drivers', () => {
    at(<LiveRacePanel live={live({ top3: 'abc' })} />)
    at(<LiveConsoleDashboard tower={{ ...tower(), drivers: { length: 2 } }} />)
    at(<LiveConsoleDashboard tower={null} />)
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0)
  })
})
