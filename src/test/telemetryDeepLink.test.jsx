import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/api', () => ({
  telemetryApi: { getAvailableRaces: vi.fn(), getRaceDrivers: vi.fn(() => Promise.resolve([])) },
}))
vi.mock('../contexts/PreferencesContext', () => ({ usePreferences: () => ({ prefs: {} }) }))
vi.mock('../hooks/useBreakpoint', () => ({ useBreakpoint: () => ({ isMobile: false }) }))
vi.mock('../hooks/useDriverTelemetry', () => ({
  useDriverTelemetry: () => ({ laps: [], pitStops: [], loading: false, error: false, telemetryLoaded: false, totalLaps: 0, raceResult: null, driverStatuses: [], scPeriods: [], circuitCoords: null, load: () => {} }),
}))
vi.mock('../hooks/useDriverComparison', () => ({ useDriverComparison: () => ({ lapsB: [], pitStopsB: [], loadingB: false, lapsBLoaded: false }) }))
vi.mock('../hooks/useHistoricalTelemetry', () => ({
  useHistoricalTelemetry: () => ({ histDrivers: [], histData: null, loadingHist: false, noSeasonData: false, load: () => {} }),
}))
vi.mock('../components/telemetry/TelemetryControls', () => ({
  default: ({ year, raceId }) => <p data-testid="sel">{`year=${year};race=${raceId}`}</p>,
}))
vi.mock('../components/telemetry/CassandraLapChart', () => ({ default: () => null }))
vi.mock('../components/telemetry/TyreAnalysisPanel', () => ({ default: () => null }))
vi.mock('../components/telemetry/SectorChart', () => ({ default: () => null }))
vi.mock('../components/telemetry/PitStopsPanel', () => ({ default: () => null }))
vi.mock('../components/telemetry/HistoricalSeasonView', () => ({ default: () => null }))
vi.mock('../components/telemetry/DriverComparisonBanner', () => ({ default: () => null }))
import { telemetryApi } from '../services/api'
import TelemetryPage from '../pages/TelemetryPage'

const races = [
  { raceId: '2025_9912', date: '2025-09-07T13:00:00Z' },
  { raceId: '2025_9100', date: '2025-04-01T13:00:00Z' },
  { raceId: '2024_8800', date: '2024-09-01T13:00:00Z' },
]
const renderAt = (url) => render(<MemoryRouter initialEntries={[url]}><TelemetryPage /></MemoryRouter>)

beforeEach(() => { telemetryApi.getAvailableRaces.mockResolvedValue(races) })

describe('Telemetry ?race= deep link', () => {
  it('keeps today\'s default (latest past race of the latest year) without the param', async () => {
    renderAt('/telemetry')
    await waitFor(() => expect(screen.getByTestId('sel')).toHaveTextContent('year=2025;race=2025_9912'))
  })

  it('preselects the year and race from a valid, known race id', async () => {
    renderAt('/telemetry?race=2024_8800')
    await waitFor(() => expect(screen.getByTestId('sel')).toHaveTextContent('year=2024;race=2024_8800'))
  })

  it('ignores junk, malformed and unknown race ids', async () => {
    for (const bad of ['junk', '2024_x', '../2024_8800', '2023_1', '2025_9100%20']) {
      const { unmount } = renderAt(`/telemetry?race=${bad}`)
      await waitFor(() => expect(screen.getByTestId('sel')).toHaveTextContent('year=2025;race=2025_9912'))
      unmount()
    }
  })

  it('still initialises when the race list is empty or the request fails', async () => {
    telemetryApi.getAvailableRaces.mockRejectedValue(new Error('503'))
    renderAt('/telemetry?race=2024_8800')
    await waitFor(() => expect(screen.getByTestId('sel')).toHaveTextContent(/year=\d{4};race=$/))
  })
})
