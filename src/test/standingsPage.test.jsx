import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'

vi.mock('../services/api', () => ({
  statsApi: { getSeasonStandings: vi.fn(), getConstructorStandings: vi.fn(), driverStats: vi.fn(), constructorStats: vi.fn() },
  driversApi: { getAll: vi.fn() },
  racesApi: { getAll: vi.fn() },
  dashboardApi: { get: vi.fn() },
}))
vi.mock('../components/ui/DriverDrawer', () => ({ default: ({ driver, onClose }) => (driver ? <div role="dialog" aria-label="driver drawer"><button onClick={onClose}>Close drawer</button>{driver.name}</div> : null) }))
vi.mock('../components/ui/ConstructorDrawer', () => ({ default: ({ constructor: c, onClose }) => (c ? <div role="dialog" aria-label="constructor drawer"><button onClick={onClose}>Close drawer</button>{c.name}</div> : null) }))
import { statsApi, driversApi, racesApi, dashboardApi } from '../services/api'
import { resetStandingsCache } from '../hooks/useStandingsData'
import StandingsPage from '../pages/StandingsPage'

const YEAR = new Date().getFullYear()
const mkRounds = (n, extra = {}) => Array.from({ length: n }, (_, i) => ({ round: String(i + 1), raceName: `Race ${i + 1} GP`, date: '2026-01-01', complete: true, ...extra }))
const drivers = (n) => [
  { driverId: 'ver', name: 'Max Verstappen', team: 'Red Bull', teamId: 'red_bull', wins: 2, number: '1', cumulative: Array.from({ length: n }, (_, i) => 25 * (i + 1)) },
  { driverId: 'nor', name: 'Lando Norris', team: 'McLaren', teamId: 'mclaren', wins: 1, number: '4', cumulative: Array.from({ length: n }, (_, i) => 18 * (i + 1)) },
  { driverId: 'lec', name: 'Charles Leclerc', team: 'Ferrari', teamId: 'ferrari', wins: 0, number: '16', cumulative: Array.from({ length: n }, (_, i) => 10 * (i + 1)) },
]
const standings = (n = 4, over = {}) => ({ rounds: mkRounds(n), totalRounds: 6, drivers: drivers(n), ...over })
const ctors = (n = 4) => ({ rounds: mkRounds(n), constructors: [
  { constructorId: 'mclaren', name: 'McLaren', wins: 1, cumulative: Array.from({ length: n }, (_, i) => 40 * (i + 1)) },
  { constructorId: 'ferrari', name: 'Ferrari', wins: 0, cumulative: Array.from({ length: n }, (_, i) => 20 * (i + 1)) },
] })

let byYear
function Where() { const l = useLocation(); return <output data-testid="loc">{l.pathname + l.search}</output> }
const mount = (url = '/standings') => render(<MemoryRouter initialEntries={[url]}><StandingsPage /><Where /></MemoryRouter>)

beforeEach(() => {
  resetStandingsCache()
  vi.clearAllMocks()
  byYear = { [YEAR]: standings(4), [YEAR - 1]: standings(6, { totalRounds: 6 }), [YEAR - 2]: standings(3, { totalRounds: 6 }) }
  statsApi.getSeasonStandings.mockImplementation(async (y) => byYear[y] ?? { rounds: [], drivers: [] })
  statsApi.getConstructorStandings.mockImplementation(async () => ctors(4))
  driversApi.getAll.mockResolvedValue([{ driverId: 'ver', photoUrl: 'https://example.test/v.png', permanentNumber: '1', code: 'VER' }])
})
afterEach(() => vi.useRealTimers())

describe('StandingsPage', () => {
  it('renders the header, hero, replay bar, chart section and every row; no races or dashboard requests', async () => {
    mount()
    expect(await screen.findByRole('heading', { name: 'Standings', level: 1 })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Title fight' })).toBeInTheDocument()
    expect(screen.getByText(`Drivers, ${YEAR}. After round 4 of 6.`)).toBeInTheDocument()
    expect(screen.queryByText(/of \d+ rounds$/)).toBeNull()
    expect(screen.getByRole('group', { name: 'Season replay' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Season progress' })).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: /Driver standings after round 4/ })).getAllByRole('button')).toHaveLength(3)
    expect(screen.queryByRole('complementary')).toBeNull()
    expect(racesApi.getAll).not.toHaveBeenCalled()
    expect(dashboardApi.get).not.toHaveBeenCalled()
    expect(statsApi.getSeasonStandings).toHaveBeenCalledTimes(8)
  })

  it('lists only the seasons with data, newest first', async () => {
    mount()
    await screen.findByRole('heading', { name: 'Title fight' })
    await userEvent.setup().click(screen.getByRole('combobox'))
    const opts = await screen.findAllByRole('option')
    expect(opts.map(o => o.textContent)).toEqual([String(YEAR), String(YEAR - 1), String(YEAR - 2)])
  })

  it('reads view and season from the URL and writes them back with replace', async () => {
    const user = userEvent.setup()
    mount(`/standings?view=constructors&season=${YEAR - 1}`)
    expect(await screen.findByRole('heading', { name: 'Champion' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Constructors' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'st-panel')
    expect(screen.getByRole('tab', { name: 'Constructors' })).toHaveAttribute('aria-controls', 'st-panel')
    expect(screen.getByRole('list', { name: /Constructor standings/ })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Drivers' }))
    expect(screen.getByTestId('loc').textContent).toBe(`/standings?season=${YEAR - 1}`)
    await user.click(screen.getByRole('tab', { name: 'Constructors' }))
    expect(screen.getByTestId('loc').textContent).toContain('view=constructors')
  })

  it('invalid view and season fall back silently', async () => {
    mount('/standings?view=banana&season=abc')
    expect(await screen.findByRole('heading', { name: 'Title fight' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Drivers' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText(/No standings for/)).toBeNull()
  })

  it('a season without data falls back to the latest, fixes the URL and says so', async () => {
    mount('/standings?season=1988')
    expect(await screen.findByText(`No standings for 1988. Showing ${YEAR} instead.`)).toBeInTheDocument()
    expect(screen.getByTestId('loc').textContent).toBe(`/standings?season=${YEAR}`)
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Constructors' }))
    expect(screen.queryByText(/No standings for 1988/)).toBeNull()
  })

  it('a partial past season shows the chip and the note; the current season shows neither', async () => {
    mount(`/standings?season=${YEAR - 2}`)
    expect(await screen.findByText('3 of 6 rounds')).toBeInTheDocument()
    expect(screen.getByText(/incomplete in our data/)).toBeInTheDocument()
    expect(screen.getByText(`Drivers, ${YEAR - 2}. 3 rounds.`)).toBeInTheDocument()
  })

  it('an old backend (no totalRounds, no complete flag) shows no chip and does not crash', async () => {
    byYear[YEAR] = { rounds: [{ round: '1', raceName: 'A GP' }, { round: '2', raceName: 'B GP' }], drivers: drivers(2) }
    mount()
    expect(await screen.findByText(`Drivers, ${YEAR}. After round 2.`)).toBeInTheDocument()
    expect(screen.queryByText(/ of \d+ rounds/)).toBeNull()
  })

  it('a sprint-only last entry reads "sprint", keeps roundsDone and does not consume a race', async () => {
    byYear[YEAR] = { rounds: [...mkRounds(3), { round: '4', raceName: 'Singapore GP', complete: false }], totalRounds: 6, drivers: drivers(4) }
    mount()
    expect(await screen.findByText(`Drivers, ${YEAR}. After round 3 of 6.`)).toBeInTheDocument()
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'After round 4, Singapore GP, sprint')
    expect(screen.getByText('R4 · Singapore GP, sprint')).toBeInTheDocument()
    expect(screen.getByText('3 rounds left')).toBeInTheDocument()
  })

  it('replay: scrubbing moves hero, rows and label together; play steps and stops; season change resets', async () => {
    mount()
    await screen.findByRole('heading', { name: 'Title fight' })
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '2' } })
    expect(slider).toHaveAttribute('aria-valuetext', 'After round 2, Race 2 GP')
    expect(screen.getByRole('list', { name: /standings after round 2/ })).toBeInTheDocument()
    expect(screen.getByText('4 rounds left')).toBeInTheDocument()
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] })
    fireEvent.click(screen.getByRole('button', { name: 'Play replay' }))
    expect(screen.getByRole('button', { name: 'Pause replay' })).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(520) })
    expect(slider).toHaveAttribute('aria-valuetext', 'After round 3, Race 3 GP')
    act(() => { vi.advanceTimersByTime(520) })
    expect(screen.getByRole('button', { name: 'Replay season' })).toBeInTheDocument()
    expect(vi.getTimerCount()).toBeLessThanOrEqual(2)
    fireEvent.click(screen.getByRole('button', { name: 'Replay season' }))
    fireEvent.change(slider, { target: { value: '2' } })
    expect(screen.getByRole('button', { name: 'Play replay' })).toBeInTheDocument()
  })

  it('opens a row, shows the detail, and Open profile opens the matching drawer; closing returns focus to the row', async () => {
    const user = userEvent.setup()
    mount()
    await screen.findByRole('heading', { name: 'Title fight' })
    const row = screen.getByRole('button', { name: /Lando Norris/ })
    await user.click(row)
    await user.click(screen.getByRole('button', { name: 'Open profile' }))
    expect(screen.getByRole('dialog', { name: 'driver drawer' })).toHaveTextContent('Lando Norris')
    await user.click(screen.getByRole('button', { name: 'Close drawer' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Lando Norris/ })).toHaveFocus())
  })

  it('constructors: the drawer is the constructor drawer', async () => {
    const user = userEvent.setup()
    mount('/standings?view=constructors')
    await screen.findByRole('heading', { name: 'Title fight' })
    await user.click(screen.getByRole('button', { name: /McLaren/, expanded: false }))
    await user.click(screen.getByRole('button', { name: 'Open profile' }))
    expect(screen.getByRole('dialog', { name: 'constructor drawer' })).toBeInTheDocument()
  })

  it('shows skeletons while loading, an error state with a working retry, and an empty state', async () => {
    let fail = true
    statsApi.getSeasonStandings.mockImplementation(async (y) => { if (fail) throw new Error('x'); return byYear[y] ?? { rounds: [], drivers: [] } })
    mount()
    expect(document.querySelector('[data-viz-skeleton="podium"]')).toBeTruthy()
    expect(await screen.findByRole('alert')).toHaveTextContent('Standings could not be loaded')
    expect(screen.getByRole('heading', { name: 'Standings', level: 1 })).toBeInTheDocument()
    fail = false
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Title fight' })).toBeInTheDocument()
  })

  it('empty when no season has data', async () => {
    byYear = {}
    mount()
    expect(await screen.findByText('No standings available yet.')).toBeInTheDocument()
    expect(screen.getByText(/appear after the first race of a season/)).toBeInTheDocument()
  })

  it('hostile payloads render without crashing', async () => {
    byYear[YEAR] = {
      rounds: [{ round: { a: 1 }, raceName: 7 }, 'x', null], totalRounds: 'many',
      drivers: [
        { driverId: { a: 1 }, name: 12345, team: ['t'], teamId: {}, wins: 'x', cumulative: [1, 'z', null] },
        null, 'junk', { driverId: 'b', name: { n: 1 }, team: 'T', teamId: '__proto__', cumulative: { length: 3 } },
      ],
    }
    statsApi.getConstructorStandings.mockResolvedValue({ rounds: [1], constructors: { length: 2 } })
    const user = userEvent.setup()
    mount()
    expect(await screen.findByRole('heading', { name: 'Standings', level: 1 })).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('button', { name: /12345|Unknown/ }).length).toBeGreaterThan(0))
    await user.click(screen.getByRole('tab', { name: 'Constructors' }))
    expect(await screen.findByRole('heading', { name: 'Standings', level: 2 })).toBeInTheDocument()
  })
})
