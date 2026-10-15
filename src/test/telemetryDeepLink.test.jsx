import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

vi.mock('../services/api', () => ({ telemetryApi: { getAvailableRaces: vi.fn() } }))
vi.mock('../components/analysis/PaceView', () => ({ default: ({ raceId }) => <p data-testid="view">{`pace;race=${raceId}`}</p> }))
vi.mock('../components/analysis/TyresView', () => ({ default: ({ raceId }) => <p data-testid="view">{`tyres;race=${raceId}`}</p> }))
vi.mock('../components/analysis/TelemetryView', () => ({ default: ({ season, raceId }) => <p data-testid="view">{`telemetry;season=${season};race=${raceId}`}</p> }))
import { telemetryApi } from '../services/api'
import RaceAnalysisPage from '../pages/RaceAnalysisPage'

const races = [
  { raceId: '2025_9912', raceName: 'Italian Grand Prix', round: 16, date: '2025-09-07T13:00:00Z' },
  { raceId: '2025_9100', raceName: 'Spanish Grand Prix', round: 9, date: '2025-04-01T13:00:00Z' },
  { raceId: '2024_8800', raceName: 'Belgian Grand Prix', round: 14, date: '2024-09-01T13:00:00Z' },
]
function Where() { const l = useLocation(); return <output data-testid="loc">{l.search}</output> }
const renderAt = (url) => render(<MemoryRouter initialEntries={[url]}><RaceAnalysisPage /><Where /></MemoryRouter>)
const view = () => screen.getByTestId('view')

beforeEach(() => { telemetryApi.getAvailableRaces.mockResolvedValue(races) })

describe('Race analysis URL state (DoD-6)', () => {
  it('defaults to the Pace view of the latest past race, without writing anything', async () => {
    renderAt('/analysis')
    await waitFor(() => expect(view()).toHaveTextContent('pace;race=2025_9912'))
    expect(screen.getByTestId('loc')).toHaveTextContent('')
    expect(screen.getByRole('heading', { level: 1, name: 'Race analysis' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab').map(t => t.textContent)).toEqual(['Pace', 'Tyres', 'Telemetry'])
  })

  it('honours ?view= and a known ?race= deep link', async () => {
    renderAt('/analysis?view=telemetry&race=2024_8800')
    await waitFor(() => expect(view()).toHaveTextContent('telemetry;season=2024;race=2024_8800'))
    expect(screen.getByRole('tab', { name: 'Telemetry' })).toHaveAttribute('aria-selected', 'true')
  })

  it('drops a malformed race id and replaces an unknown one with the latest past race', async () => {
    for (const bad of ['junk', '2024_x', '../2024_8800']) {
      const { unmount } = renderAt(`/analysis?race=${bad}`)
      await waitFor(() => expect(view()).toHaveTextContent('pace;race=2025_9912'))
      await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent(/^$/))
      unmount()
    }
    renderAt('/analysis?race=2023_1')
    await waitFor(() => expect(view()).toHaveTextContent('pace;race=2025_9912'))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('?race=2025_9912'))
  })

  it('switching views pushes ?view= and keeps the race', async () => {
    renderAt('/analysis?race=2025_9100')
    await waitFor(() => expect(view()).toHaveTextContent('pace;race=2025_9100'))
    fireEvent.click(screen.getByRole('tab', { name: 'Tyres' }))
    await waitFor(() => expect(view()).toHaveTextContent('tyres;race=2025_9100'))
    expect(screen.getByTestId('loc')).toHaveTextContent('race=2025_9100')
    expect(screen.getByTestId('loc')).toHaveTextContent('view=tyres')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'analysis-tab-tyres')
  })

  it('a season before 2023: Telemetry shows the season view with the race select disabled and helper text', async () => {
    renderAt('/analysis?view=telemetry&season=2019')
    await waitFor(() => expect(view()).toHaveTextContent('telemetry;season=2019;race='))
    expect(screen.getByText('Lap-level comparison starts in 2023. Showing the season view.')).toBeInTheDocument()
    expect(document.getElementById('analysis-race')).toBeDisabled()
  })

  it('a season before 2023: Pace and Tyres say lap data starts in 2023 and offer a way out', async () => {
    renderAt('/analysis?season=2019')
    expect(await screen.findByText('Lap data starts in 2023')).toBeInTheDocument()
    expect(screen.getByText('Pick a 2023 or later race to see pace.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open season view' }))
    await waitFor(() => expect(view()).toHaveTextContent('telemetry;season=2019'))
  })

  it('"Go to latest race" leaves the season view for the latest race', async () => {
    renderAt('/analysis?season=2019')
    fireEvent.click(await screen.findByRole('button', { name: 'Go to latest race' }))
    await waitFor(() => expect(view()).toHaveTextContent('pace;race=2025_9912'))
  })

  it('shows an error with retry when the race list fails, then recovers', async () => {
    telemetryApi.getAvailableRaces.mockRejectedValueOnce(new Error('boom'))
    renderAt('/analysis')
    expect(await screen.findByText("We couldn't load the race list")).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(view()).toHaveTextContent('pace;race=2025_9912'))
  })

  it('exposes one polite live region and one season and one race select', async () => {
    renderAt('/analysis')
    await waitFor(() => expect(view()).toBeInTheDocument())
    expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(1)
    expect(document.querySelectorAll('#analysis-season, #analysis-race')).toHaveLength(2)
    expect(screen.getByText('Data from 2023 onwards')).toBeInTheDocument()
  })
})
