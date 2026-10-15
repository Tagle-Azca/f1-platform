import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

vi.mock('../../services/api', () => ({
  graphApi: { getDriverConnections: vi.fn() },
  dashboardApi: { getTeammateH2H: vi.fn() },
  searchApi: { search: vi.fn() },
  driversApi: { getAll: vi.fn() },
}))
import { graphApi, dashboardApi, searchApi, driversApi } from '../../services/api'
import { resetDriverConnectionsCache } from '../../hooks/useDriverConnections'
import { resetTeammateH2HCache } from '../../hooks/useTeammateH2H'
import TeammateHistoryPage from '../../pages/TeammateHistoryPage'

const stats = (o) => ({ races: 70, wins: 11, podiums: 30, points: 900, poles: 12, fastestLaps: 6, seasons: 4, firstSeason: '2023', lastSeason: '2026', ...o })
const DATA = {
  norris: {
    teams: [{ constructorId: 'mclaren', name: 'McLaren', seasons: ['2023', '2024', '2025'] }],
    teammates: [{ driverId: 'piastri', name: 'Oscar Piastri', seasons: ['2023', '2024', '2025'], teams: ['McLaren'] }],
    debut: null, stats: stats(),
  },
  piastri: {
    teams: [{ constructorId: 'mclaren', name: 'McLaren', seasons: ['2023', '2024', '2025'] }],
    teammates: [{ driverId: 'norris', name: 'Lando Norris', seasons: ['2023', '2024', '2025'], teams: ['McLaren'] }],
    debut: null, stats: stats({ wins: 9, poles: null }),
  },
  ghost: { teams: [], teammates: [], debut: null, stats: null },
}

function Probe() { const l = useLocation(); return <output data-testid="loc">{l.pathname}{l.search}</output> }
const mount = (url) => render(<MemoryRouter initialEntries={[url]}><TeammateHistoryPage /><Probe /></MemoryRouter>)

beforeEach(() => {
  resetDriverConnectionsCache(); resetTeammateH2HCache(); vi.clearAllMocks()
  graphApi.getDriverConnections.mockImplementation((id) => (DATA[id] ? Promise.resolve(DATA[id]) : Promise.reject(new Error('x'))))
  dashboardApi.getTeammateH2H.mockResolvedValue({ teammateName: 'Oscar Piastri', racesCompared: 24, qualiCompared: 24, race: { driver: 14, teammate: 10 }, quali: { driver: 12, teammate: 12 }, avgQualiGapSeconds: 0.082 })
  searchApi.search.mockResolvedValue([])
  driversApi.getAll.mockResolvedValue([])
})

describe('Rivalries page', () => {
  it('zero drivers: two comboboxes, empty state, presets as links and driver chips', () => {
    mount('/teammates')
    expect(screen.getByRole('heading', { level: 1, name: 'Rivalries' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'First driver' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Second driver' })).toBeInTheDocument()
    expect(screen.getByText('Pick two drivers to compare')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Verstappen vs Norris/ })
    expect(link).toHaveAttribute('href', '/teammates?a=max_verstappen&b=norris')
    expect(screen.queryByText(/Career Networks/i)).toBeNull()
    expect(screen.getByRole('link', { name: /Senna vs Prost/ })).toHaveAttribute('href', '/teammates?a=senna&b=prost')
  })

  it('a chip fills the first driver and focuses the second (pushes the URL)', async () => {
    mount('/teammates')
    fireEvent.click(screen.getByRole('button', { name: /Lando Norris/ }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('/teammates?a=norris'))
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Second driver' })).toHaveFocus())
  })

  it('feed: 6 of 10 cards, View all, filter pills, and the open pair is never offered', async () => {
    const { unmount } = mount('/teammates')
    const feed = () => within(screen.getByRole('region', { name: 'Popular matchups' }))
    expect(feed().getAllByRole('link')).toHaveLength(6)
    fireEvent.click(screen.getByRole('button', { name: /View all rivalries/ }))
    expect(feed().getAllByRole('link')).toHaveLength(10)
    fireEvent.click(screen.getByRole('button', { name: 'Title fights' }))
    expect(screen.getByRole('button', { name: 'Title fights' })).toHaveAttribute('aria-pressed', 'true')
    expect(feed().getAllByRole('link').map((l) => l.textContent)).toEqual([expect.stringMatching(/Verstappen vs Hamilton/), expect.stringMatching(/Verstappen vs Norris/), expect.stringMatching(/Alonso vs Schumacher/)])
    expect(screen.queryByRole('button', { name: /View all rivalries/ })).toBeNull()
    unmount()
    mount('/teammates?a=norris&b=piastri')
    await screen.findByRole('heading', { name: 'Try another matchup' })
    fireEvent.click(screen.getByRole('button', { name: /View all rivalries/ }))
    expect(screen.queryByRole('link', { name: /Norris vs Piastri/ })).toBeNull()
  })

  it('two drivers from the URL: hero, relation chip, mirrored rows with leader, same garage and one live sentence', async () => {
    mount('/teammates?a=norris&b=piastri')
    await screen.findByText('Teammates, McLaren 2023-2025')
    expect(screen.getByRole('link', { name: 'Lando Norris' })).toHaveAttribute('href', '/drivers/norris')
    const winsRow = screen.getAllByText(/^Wins:/)[0]
    expect(winsRow).toHaveTextContent('Wins: Norris 11, Piastri 9. Norris leads.')
    expect(screen.getByText('Poles: Norris 12, Piastri –.')).toBeInTheDocument()
    expect(screen.getByText('Norris and Piastri. Teammates, McLaren 2023-2025. Norris leads on wins, 11 to 9.')).toBeInTheDocument()
    expect(screen.getByText(/Points are not comparable across scoring eras/)).toBeInTheDocument()
    expect(screen.getByText('No teammates in common.')).toBeInTheDocument()
    await waitFor(() => expect(dashboardApi.getTeammateH2H).toHaveBeenCalledWith('Lando Norris', '2025'))
    expect(await screen.findByText('Average qualifying gap 0.082 s')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Season' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Swap drivers' })).toBeInTheDocument()
  })

  it('remove and swap push new URLs', async () => {
    mount('/teammates?a=norris&b=piastri')
    await screen.findByText('Teammates, McLaren 2023-2025')
    fireEvent.click(screen.getByRole('button', { name: 'Swap drivers' }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('?a=piastri&b=norris'))
    fireEvent.click(screen.getByRole('button', { name: 'Remove Piastri' }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('/teammates?a=norris'))
    expect(screen.getByTestId('loc')).not.toHaveTextContent('b=')
    expect(await screen.findByRole('combobox', { name: 'Second driver' })).toHaveFocus()
  })

  it('one driver: totals and teammates as pair links', async () => {
    mount('/teammates?a=norris')
    await screen.findByText("Norris's teammates")
    expect(screen.getByRole('link', { name: /Oscar Piastri/ })).toHaveAttribute('href', '/teammates?a=norris&b=piastri')
    expect(screen.getByRole('heading', { name: 'Popular matchups' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Second driver' })).toHaveAttribute('placeholder', 'Pick a rival')
  })

  it('normalises a malformed or duplicate URL with replace and never echoes the bad id', async () => {
    mount('/teammates?a=%3Cb%3Ex%3C%2Fb%3E&b=norris')
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('/teammates?a=norris'))
    expect(screen.getByTestId('loc')).not.toHaveTextContent('script')
    expect(screen.queryByText(/<b>/)).toBeNull()
  })

  it('a driver with stats null shows the no-data state and no comparison', async () => {
    mount('/teammates?a=norris&b=ghost')
    await screen.findByText('No race data for this driver in Pitwall.')
    expect(screen.queryByText('Career comparison')).toBeNull()
    expect(screen.getByText("Norris's career")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Ghost' })).toBeInTheDocument()
  })

  it('an error affects only its slot and can be retried', async () => {
    mount('/teammates?a=norris&b=mystery')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("We couldn't load Mystery.")
    expect(await screen.findByText("Norris's career")).toBeInTheDocument()
    graphApi.getDriverConnections.mockResolvedValueOnce(DATA.piastri)
    fireEvent.click(within(alert).getByRole('button', { name: 'Try again' }))
    await screen.findByText('Career comparison')
  })

  it('shows loading placeholders while the answer is pending', () => {
    graphApi.getDriverConnections.mockReturnValue(new Promise(() => {}))
    mount('/teammates?a=norris&b=piastri')
    expect(screen.getByRole('region', { name: 'Matchup' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('link', { name: 'Lando Norris' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /Loading driver career/ })).toBeInTheDocument()
  })

  it('h2h with a different teammate that season is shown as unavailable', async () => {
    dashboardApi.getTeammateH2H.mockResolvedValue({ teammateName: 'Someone Else', racesCompared: 5, qualiCompared: 5, race: { driver: 3, teammate: 2 }, quali: { driver: 3, teammate: 2 } })
    mount('/teammates?a=norris&b=piastri')
    await screen.findByText('Teammates, McLaren 2023-2025')
    expect(await screen.findByText('Season comparison unavailable.')).toBeInTheDocument()
  })
})
