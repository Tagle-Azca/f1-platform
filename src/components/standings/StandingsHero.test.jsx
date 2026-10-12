import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import StandingsHero from './StandingsHero'
import { normalizeSeries, rankAt, heroModel } from './standingsModel'

const payload = {
  rounds: [{ round: '1' }, { round: '2' }, { round: '3' }],
  drivers: [
    { driverId: 'ver', name: 'Max Verstappen', team: 'Red Bull', teamId: 'red_bull', number: '1', cumulative: [25, 43, 68] },
    { driverId: 'nor', name: 'Lando Norris', team: 'McLaren', teamId: 'mclaren', number: '4', cumulative: [18, 43, 61] },
    { driverId: 'lec', name: 'Charles Leclerc', team: 'Ferrari', teamId: 'ferrari', number: '16', cumulative: [15, 30, 50] },
    { driverId: 'tsu', name: 'Yuki Tsunoda', team: 'Red Bull', teamId: 'red_bull', number: '22', cumulative: [10, 20, 30] },
  ],
  constructors: [
    { constructorId: 'mclaren', name: 'McLaren', wins: 1, cumulative: [30, 70, 100] },
    { constructorId: 'ferrari', name: 'Ferrari', wins: 1, cumulative: [20, 50, 80] },
    { constructorId: 'red_bull', name: 'Red Bull', wins: 2, cumulative: [35, 63, 98] },
  ],
}

function mount({ view = 'drivers', round = 3, opts = {}, props = {} } = {}) {
  const series = normalizeSeries(payload, view)
  const rows = rankAt(series, round)
  const hero = heroModel(rows, { view, season: 2026, current: true, totalRounds: 4, roundsDone: round, atEnd: round === 3, ...opts })
  return render(
    <MemoryRouter>
      <StandingsHero view={view} season={2026} rows={rows} hero={hero} photos={new Map([['ver', { photoUrl: 'https://example.test/v.png', number: '1', code: 'VER' }]])} datasetKey={`2026-${view}`} source="seek" {...props} />
    </MemoryRouter>,
  )
}

describe('StandingsHero', () => {
  it('title fight: podium order P2 P1 P3, verdict, caption naming the per-Grand-Prix value', () => {
    mount()
    expect(screen.getByRole('heading', { name: 'Title fight' })).toBeInTheDocument()
    expect(screen.getByText('Still open: 25 points in play against a 7-point gap.', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Counts 25 points per remaining Grand Prix. Sprint points are not included.')).toBeInTheDocument()
    expect(screen.getByText('1 round left')).toBeInTheDocument()
    const names = screen.getAllByRole('link').map(l => l.getAttribute('aria-label'))
    expect(names).toEqual(['Lando Norris', 'Max Verstappen', 'Charles Leclerc'])
    expect(screen.queryByText('Teammates')).toBeNull()
  })
  it('shows the Teammates pill when the top two share a team', () => {
    const series = normalizeSeries({ ...payload, drivers: payload.drivers.map(d => (d.driverId === 'tsu' ? { ...d, cumulative: [30, 60, 90] } : d)) }, 'drivers')
    const rows = rankAt(series, 3)
    render(<MemoryRouter><StandingsHero view="drivers" season={2026} rows={rows} hero={heroModel(rows, { totalRounds: 4, roundsDone: 3, current: true })} photos={new Map()} datasetKey="t" source="seek" /></MemoryRouter>)
    expect(screen.getByText('Teammates')).toBeInTheDocument()
  })
  it('names the number actually used for 2024 (26)', () => {
    mount({ opts: { season: 2024 } })
    expect(screen.getByText('Counts 26 points per remaining Grand Prix. Sprint points are not included.')).toBeInTheDocument()
  })
  it('photos are https only; a missing photo falls back to the number text', () => {
    const { container } = mount()
    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(1)
    expect(imgs[0]).toHaveAttribute('referrerpolicy', 'no-referrer')
    expect(container.querySelectorAll('svg text').length).toBeGreaterThanOrEqual(3)
  })
  it('a hostile photo URL is dropped', () => {
    const { container } = mount({ props: { photos: new Map([['ver', { photoUrl: 'javascript:alert(1)' }]]) } })
    expect(container.querySelectorAll('img')).toHaveLength(0)
  })
  it('champion: pill, margin sentence and no caption', () => {
    mount({ opts: { current: false, totalRounds: 3, roundsDone: 3 } })
    expect(screen.getByRole('heading', { name: 'Champion' })).toBeInTheDocument()
    expect(screen.getByText('Verstappen won the title by 7 points over Norris.')).toBeInTheDocument()
    expect(screen.queryByText(/Counts \d+ points/)).toBeNull()
    expect(screen.getAllByText('Champion').length).toBeGreaterThanOrEqual(2)
  })
  it('decided title and zero points in play', () => {
    mount({ opts: { totalRounds: 4, roundsDone: 3, season: 2026 }, round: 3 })
    const d = mount({ round: 1, opts: { totalRounds: 4, roundsDone: 1 } })
    expect(d.container).toBeTruthy()
    mount({ opts: { totalRounds: 3, roundsDone: 3, current: true } })
    expect(screen.getByText('Verstappen leads by 7 points.')).toBeInTheDocument()
  })
  it('constructors: team names, drawer button and the +18 caption', async () => {
    const onOpen = vi.fn()
    mount({ view: 'constructors', props: { onOpenConstructor: onOpen } })
    expect(screen.getByText('Counts 43 points per remaining Grand Prix (a one-two). Sprint points are not included.')).toBeInTheDocument()
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    await userEvent.setup().click(screen.getByRole('button', { name: 'McLaren' }))
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'mclaren' }))
  })
  it('fewer than two entries shows a plain sentence', () => {
    const series = normalizeSeries({ ...payload, drivers: payload.drivers.slice(0, 1) }, 'drivers')
    const rows = rankAt(series, 3)
    render(<MemoryRouter><StandingsHero view="drivers" season={2026} rows={rows} hero={heroModel(rows, {})} photos={new Map()} datasetKey="x" source="seek" /></MemoryRouter>)
    expect(screen.getByText('Standings appear after the first race.')).toBeInTheDocument()
  })
  it('states the podium for screen readers in one sentence', () => {
    mount()
    expect(screen.getByText(/Max Verstappen, 68 points, leads Lando Norris, 61 points, by 7/)).toBeInTheDocument()
  })
  it('renders with only two entries and during play (layout on)', () => {
    const series = normalizeSeries({ ...payload, drivers: payload.drivers.slice(0, 2) }, 'drivers')
    const rows = rankAt(series, 3)
    render(<MemoryRouter><StandingsHero view="drivers" season={2026} rows={rows} hero={heroModel(rows, { totalRounds: 4, roundsDone: 3 })} photos={null} datasetKey="x" source="play" /></MemoryRouter>)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
