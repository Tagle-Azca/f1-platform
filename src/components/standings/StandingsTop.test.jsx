import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import StandingsTop from './StandingsTop'
import { normalizeSeries, rankAt, heroModel, seasonStatus, normalizeRounds, doneAt } from './standingsModel'
import { resetSprintRoundsCache } from './useSprintRounds'
import { racesApi } from '../../services/api'

vi.mock('../../services/api', () => ({ racesApi: { getBySeason: vi.fn() } }))
const calendar = (sprints = []) => Array.from({ length: 6 }, (_, i) => ({ round: String(i + 1), hasSprint: sprints.includes(i + 1) }))
beforeEach(() => { resetSprintRoundsCache(); racesApi.getBySeason.mockResolvedValue(calendar()) })

const rounds = [1, 2, 3, 4].map(n => ({ round: String(n), complete: true }))
const payload = (total, nor = [10, 20, 30, 40]) => ({
  totalRounds: total,
  rounds,
  drivers: [
    { driverId: 'ver', name: 'Max Verstappen', team: 'Red Bull', teamId: 'red_bull', number: '1', cumulative: [25, 50, 75, 100] },
    { driverId: 'nor', name: 'Lando Norris', team: 'McLaren', teamId: 'mclaren', number: '4', cumulative: nor },
    { driverId: 'lec', name: 'Charles Leclerc', team: 'Ferrari', teamId: 'ferrari', number: '16', cumulative: [8, 16, 24, 32] },
  ],
  constructors: [
    { constructorId: 'red_bull', name: 'Red Bull', wins: 4, cumulative: [30, 60, 90, 120] },
    { constructorId: 'mclaren', name: 'McLaren', wins: 0, cumulative: [10, 20, 30, 40] },
    { constructorId: 'ferrari', name: 'Ferrari', wins: 0, cumulative: [8, 16, 24, 32] },
  ],
})

function mount({ total = 6, round = 4, current = true, view = 'drivers', nor } = {}) {
  const p = payload(total, nor)
  const series = normalizeSeries(view === 'drivers' ? p : { constructors: p.constructors, rounds }, view)
  const info = seasonStatus(p, { current })
  const rows = rankAt(series, round)
  const hero = heroModel(rows, { view, season: 2026, current, totalRounds: info.totalRounds, roundsDone: doneAt(info, round), atEnd: round >= 4 })
  const photos = new Map([['ver', { photoUrl: 'https://example.test/v.png', number: '1', code: 'VER' }]])
  return render(
    <MemoryRouter>
      <StandingsTop view={view} season={2026} hero={hero} photos={photos} datasetKey="k" source="seek" onOpenConstructor={() => {}}
        series={series} rounds={normalizeRounds(p)} info={info} round={round} />
    </MemoryRouter>,
  )
}

describe('StandingsTop', () => {
  it('early clinch: banner says when and how early, and the podium becomes the battle for P2', async () => {
    mount()
    const banner = await waitFor(() => { const b = document.querySelector('[data-champion-banner]'); expect(b).not.toBeNull(); return b })
    expect(banner).toHaveAccessibleName('2026 drivers champion')
    expect(banner).toHaveTextContent('Max Verstappen')
    expect(banner).toHaveTextContent('Clinched at Round 4, 2 races early')
    expect(banner.querySelector('img')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Battle for P2' })).toBeInTheDocument()
    expect(screen.getByText('Norris holds P2, 8 points ahead of Leclerc.')).toBeInTheDocument()
    expect(screen.queryByText(/Counts 25 points per remaining/)).toBeNull()
  })
  it('replay before the clinch round shows the plain title fight and no banner', async () => {
    mount({ round: 3 })
    await waitFor(() => expect(racesApi.getBySeason).toHaveBeenCalled())
    await act(async () => {})
    expect(document.querySelector('[data-champion-banner]')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Title fight' })).toBeInTheDocument()
  })
  it('a finished season decided on the last race says final round', async () => {
    mount({ total: 4, current: false, nor: [24, 48, 72, 96] })
    await waitFor(() => expect(document.querySelector('[data-champion-banner]')).not.toBeNull())
    expect(document.querySelector('[data-champion-banner]')).toHaveTextContent('Clinched at the final round')
    expect(screen.getAllByRole('heading', { name: 'Champion' }).length).toBeGreaterThan(0)
  })
  it('constructors view shows the team as champion without a headshot', async () => {
    mount({ view: 'constructors', total: 5 })
    const banner = await waitFor(() => { const b = document.querySelector('[data-champion-banner]'); expect(b).not.toBeNull(); return b })
    expect(banner).toHaveAccessibleName('2026 constructors champion')
    expect(banner).toHaveTextContent('Red Bull')
    expect(banner.querySelector('img')).toBeNull()
  })
  it('sprint points still on offer postpone the clinch', async () => {
    racesApi.getBySeason.mockResolvedValue(calendar([5, 6]))
    mount()
    await waitFor(() => expect(racesApi.getBySeason).toHaveBeenCalled())
    await act(async () => {})
    await screen.findByRole('heading', { name: 'Title fight' })
    expect(document.querySelector('[data-champion-banner]')).toBeNull()
  })
})
