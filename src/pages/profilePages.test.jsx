import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../services/api', () => ({
  statsApi: { driverStats: vi.fn(), driverSeasons: vi.fn(), driverCircuits: vi.fn(), getSeasonStandings: vi.fn(), getConstructorStandings: vi.fn() },
  constructorsApi: { getStats: vi.fn() },
  dashboardApi: { getTeammateH2H: vi.fn() },
  graphApi: { getDriverEgoGraph: vi.fn(), getConstructorEgoGraph: vi.fn() },
  telemetryApi: { getTeamPace: vi.fn() },
}))
vi.mock('recharts', async () => {
  const Null = () => null
  return { ResponsiveContainer: ({ children }) => <div>{children}</div>, LineChart: ({ children }) => <svg>{children}</svg>, Line: Null, XAxis: Null, YAxis: Null, CartesianGrid: Null, Tooltip: Null }
})
vi.mock('../components/profiles/ConnectionsCanvas', () => ({ default: () => <div data-testid="canvas" /> }))
import { statsApi, constructorsApi, dashboardApi, graphApi, telemetryApi } from '../services/api'
import DriverProfilePage from './DriverProfilePage'
import ConstructorProfilePage from './ConstructorProfilePage'
import { resetDriverProfileCache } from '../hooks/useDriverProfile'
import { resetConstructorProfileCache } from '../hooks/useConstructorProfile'
import { resetTeammateH2HCache } from '../hooks/useTeammateH2H'
import { resetStandingsCache } from '../hooks/useStandingsData'

const http = (status) => Object.assign(new Error('x'), { status })
const stats = { driver: { givenName: 'Lando', familyName: 'Norris', code: 'NOR', permanentNumber: '4', nationality: 'British', dateOfBirth: '1999-11-13T00:00:00.000Z' }, wins: 13, podiums: 44, races: 109, points: 1206, polePositions: 18, fastestLaps: 17, pointsPerRace: 11.06, top10Rate: 82.6, dnfRate: 12.8, avgPositionsGained: 2.1 }
const seasons = [2026, 2025].map((y) => ({ season: String(y), team: 'McLaren', constructorId: 'mclaren', points: 100, wins: 1, podiums: 2, poles: 1, races: 20 }))
const circuits = [{ _id: 'monza', circuitName: 'Monza', races: 5, points: 50, wins: 2, podiums: 3 }]
const team = { constructorId: 'mclaren', name: 'McLaren', stats: { seasons: 5, firstSeason: '2022', lastSeason: '2026', races: 109, wins: 22, podiums: 53, poles: 17, points: 2299, championships: 2, championSeasons: ['2024', '2025'], reliability: 85.8 }, seasons: [{ season: '2026', wins: 2, points: 339, races: 17, drivers: [{ id: 'norris', name: 'Lando Norris', points: 201 }] }, { season: '2025', wins: 14, points: 833, races: 24, champion: true, drivers: [{ id: 'norris', name: 'Lando Norris', points: 423 }] }] }

const driverApp = (path) => render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/drivers/:id" element={<DriverProfilePage />} /></Routes></MemoryRouter>)
const teamApp = (path) => render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/constructors/:constructorId" element={<ConstructorProfilePage />} /></Routes></MemoryRouter>)

beforeEach(() => {
  vi.clearAllMocks()
  resetDriverProfileCache(); resetConstructorProfileCache(); resetTeammateH2HCache(); resetStandingsCache()
  statsApi.driverStats.mockResolvedValue(stats)
  statsApi.driverSeasons.mockResolvedValue(seasons)
  statsApi.driverCircuits.mockResolvedValue(circuits)
  dashboardApi.getTeammateH2H.mockResolvedValue({ teammateName: 'Oscar Piastri', racesCompared: 16, qualiCompared: 10, race: { driver: 9, teammate: 7 }, quali: { driver: 4, teammate: 6 } })
  graphApi.getDriverEgoGraph.mockResolvedValue({ nodes: [{ id: 'driver_norris', name: 'Lando Norris', isSelf: true }, { id: 'teammate_piastri', name: 'Oscar Piastri', seasons: ['2025'] }], links: [] })
  graphApi.getConstructorEgoGraph.mockResolvedValue({ nodes: [{ id: 'team_mclaren', name: 'McLaren', isSelf: true }, { id: 'driver_norris', name: 'Lando Norris', seasons: ['2025'] }], links: [] })
  constructorsApi.getStats.mockResolvedValue(team)
  statsApi.getConstructorStandings.mockResolvedValue({ rounds: [{ round: '1', raceName: 'A GP' }], constructors: [{ constructorId: 'mclaren', cumulative: [25] }] })
  telemetryApi.getTeamPace.mockResolvedValue(null)
})

describe('DriverProfilePage', () => {
  it('renders every section with since-2022 labels and no career wording', async () => {
    driverApp('/drivers/norris')
    expect(await screen.findByRole('heading', { level: 1, name: /Norris/ })).toBeInTheDocument()
    for (const h of ['Totals since 2022', 'Seasons', 'Against teammates', 'Best circuits', 'Connections']) expect(screen.getByRole('heading', { level: 2, name: h })).toBeInTheDocument()
    expect(screen.getByText('Totals for 2025–2026, the seasons in Pitwall data.')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/career|all-time/i)
    await waitFor(() => expect(dashboardApi.getTeammateH2H).toHaveBeenCalledWith('Lando Norris', '2026'))
    expect(await screen.findByText('Compared with Oscar Piastri in 2026.')).toBeInTheDocument()
  })

  it('switching the H2H season loads that season', async () => {
    driverApp('/drivers/norris')
    fireEvent.click(await screen.findByRole('radio', { name: '2025' }))
    await waitFor(() => expect(dashboardApi.getTeammateH2H).toHaveBeenCalledWith('Lando Norris', '2025'))
  })

  it('shows a designed not-found for 404s and never requests or echoes a hostile id', async () => {
    statsApi.driverStats.mockRejectedValue(http(404))
    const { unmount } = driverApp('/drivers/ghost')
    expect(await screen.findByRole('heading', { level: 1, name: 'Driver not found' })).toBeInTheDocument()
    unmount()
    statsApi.driverStats.mockClear()
    driverApp('/drivers/%3Cscript%3E')
    expect(await screen.findByRole('heading', { level: 1, name: 'Driver not found' })).toBeInTheDocument()
    expect(statsApi.driverStats).not.toHaveBeenCalled()
    expect(document.body.textContent).not.toMatch(/script/i)
  })

  it('page error retries', async () => {
    statsApi.driverStats.mockRejectedValueOnce(http(500))
    driverApp('/drivers/norris')
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Seasons' })).toBeInTheDocument()
  })

  it('a seasons failure degrades only that section', async () => {
    statsApi.driverSeasons.mockRejectedValueOnce(http(500))
    driverApp('/drivers/norris')
    expect(await screen.findByText("We couldn't load seasons.")).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Best circuits' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Totals since 2022' })).toBeInTheDocument()
  })

  it('a H2H failure degrades only that section and the no-teammate state is designed', async () => {
    dashboardApi.getTeammateH2H.mockRejectedValueOnce(new Error('x'))
    driverApp('/drivers/norris')
    expect(await screen.findByText("We couldn't load the comparison.")).toBeInTheDocument()
    dashboardApi.getTeammateH2H.mockResolvedValueOnce({ teammateName: null })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('No teammate comparison for 2026.')).toBeInTheDocument()
    expect(screen.getByText('No teammate in Pitwall data for 2026.')).toBeInTheDocument()
  })

  it('Connections loads nothing until Show network is pressed', async () => {
    driverApp('/drivers/norris')
    fireEvent.click(await screen.findByRole('button', { name: 'Show network' }))
    expect(await screen.findByRole('link', { name: 'Oscar Piastri' })).toHaveAttribute('href', '/drivers/piastri')
    expect(graphApi.getDriverEgoGraph).toHaveBeenCalledTimes(1)
  })

  it('Connections: an ego failure retries inside the frame', async () => {
    graphApi.getDriverEgoGraph.mockRejectedValueOnce(new Error('x'))
    driverApp('/drivers/norris')
    expect(graphApi.getDriverEgoGraph).not.toHaveBeenCalled()
    fireEvent.click(await screen.findByRole('button', { name: 'Show network' }))
    expect(await screen.findByText("We couldn't load the network.")).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Connected')).toBeInTheDocument()
  })
})

describe('ConstructorProfilePage', () => {
  it('renders hero titles, finish rate definition and sections', async () => {
    teamApp('/constructors/mclaren')
    expect(await screen.findByRole('heading', { level: 1, name: 'McLaren' })).toBeInTheDocument()
    expect(screen.getByText(/Constructors' titles since 2022: 2/)).toBeInTheDocument()
    expect(screen.getByText('Finish rate: share of car starts classified at the finish, 2022–2026.')).toBeInTheDocument()
    expect(screen.queryByText(/Reliability/)).toBeNull()
    for (const h of ['Totals since 2022', '2026 season', 'Points progress', 'Race pace', 'Season by season', 'Drivers by season', 'Team DNA', 'Connections']) expect(screen.getByRole('heading', { level: 2, name: h })).toBeInTheDocument()
  })

  it('race pace with no data is plain text without retry', async () => {
    teamApp('/constructors/mclaren')
    expect(await screen.findByText('No lap data for McLaren in 2026.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })

  it('race pace network failure shows a retry for that section only', async () => {
    telemetryApi.getTeamPace.mockRejectedValueOnce(new Error('x'))
    teamApp('/constructors/mclaren')
    expect(await screen.findByText("We couldn't load race pace.")).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Team DNA' })).toBeInTheDocument()
    telemetryApi.getTeamPace.mockResolvedValueOnce({ raceId: '2026_1', raceName: 'Melbourne', availableRaces: [{ raceId: '2026_1', raceName: 'Melbourne' }, { raceId: '2026_2', raceName: 'Suzuka' }], drivers: [{ acronym: 'NOR', laps: [{ lap: 2, time: 85 }] }] })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Lap times in the Melbourne race. Pit laps are excluded.')).toBeInTheDocument()
  })

  it('points progress failure degrades only that section', async () => {
    statsApi.getConstructorStandings.mockRejectedValue(new Error('x'))
    teamApp('/constructors/mclaren')
    expect(await screen.findByText("We couldn't load points progress.")).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Season by season' })).toBeInTheDocument()
  })

  it('not found for 404 and for hostile ids (no request)', async () => {
    constructorsApi.getStats.mockRejectedValue(http(404))
    const { unmount } = teamApp('/constructors/ghost')
    expect(await screen.findByRole('heading', { level: 1, name: 'Team not found' })).toBeInTheDocument()
    unmount()
    constructorsApi.getStats.mockClear()
    teamApp('/constructors/%3Cscript%3E')
    expect(await screen.findByRole('heading', { level: 1, name: 'Team not found' })).toBeInTheDocument()
    expect(constructorsApi.getStats).not.toHaveBeenCalled()
  })

  it('page error offers retry', async () => {
    constructorsApi.getStats.mockRejectedValueOnce(http(500))
    teamApp('/constructors/mclaren')
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'McLaren' })).toBeInTheDocument()
  })
})
