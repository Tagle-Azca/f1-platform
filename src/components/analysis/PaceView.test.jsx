import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../../services/api', () => ({
  telemetryApi: { getRaceDrivers: vi.fn(), getRacePace: vi.fn(), getRacePositions: vi.fn() },
}))
import { telemetryApi } from '../../services/api'
import PaceView from './PaceView'

const drivers = ['a', 'b', 'c', 'd'].map((id, i) => ({ driverId: id, acronym: id.toUpperCase().repeat(3), teamName: i < 2 ? 'McLaren' : 'Ferrari' }))
const laps = (n) => Array.from({ length: n }, (_, i) => ({ lap: i + 1, time: 90 + (i % 3), isPit: false }))

beforeEach(() => {
  vi.clearAllMocks()
  telemetryApi.getRaceDrivers.mockResolvedValue(drivers)
  telemetryApi.getRacePace.mockImplementation((_, ids) => Promise.resolve(ids.map(driverId => ({ driverId, laps: laps(12) }))))
  telemetryApi.getRacePositions.mockResolvedValue({
    totalLaps: 2,
    drivers: [{ driverId: 'a', acronym: 'AAA', pitLaps: [] }, { driverId: 'b', acronym: 'BBB', pitLaps: [], dnf: true, lastLap: 1 }],
    laps: [{ lap: 1, a: 1, b: 2 }, { lap: 2, a: 1 }],
  })
})

describe('PaceView', () => {
  it('selects the first three drivers, shows their summary and the position chart with a table alternative', async () => {
    render(<PaceView raceId="2025_9912" />)
    const aaa = await screen.findByRole('button', { name: /AAA/ })
    expect(aaa).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /DDD/ })).toHaveAttribute('aria-pressed', 'false')
    await waitFor(() => expect(telemetryApi.getRacePace).toHaveBeenCalledWith('2025_9912', ['a', 'b', 'c']))
    expect(await screen.findByRole('list', { name: 'Pace summary' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Position by lap' })).toBeInTheDocument()
    expect(await screen.findByRole('table', { name: /Start and finish position/ })).toBeInTheDocument()
    expect(screen.getByText('Out on lap 1')).toBeInTheDocument()
  })

  it('toggling a driver refetches pace', async () => {
    render(<PaceView raceId="2025_9912" />)
    fireEvent.click(await screen.findByRole('button', { name: /DDD/ }))
    await waitFor(() => expect(telemetryApi.getRacePace).toHaveBeenLastCalledWith('2025_9912', ['a', 'b', 'c', 'd']))
  })

  it('shows an error with retry when the driver list fails', async () => {
    telemetryApi.getRaceDrivers.mockRejectedValueOnce(new Error('x'))
    render(<PaceView raceId="2025_9912" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('button', { name: /AAA/ })).toBeInTheDocument()
  })
})
