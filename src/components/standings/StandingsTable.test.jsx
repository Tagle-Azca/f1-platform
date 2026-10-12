import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import StandingsTable from './StandingsTable'
import { normalizeSeries, rankAt, heroModel } from './standingsModel'

const rounds = [{ round: '1', raceName: 'Australian GP' }, { round: '2', raceName: 'Chinese GP' }, { round: '3', raceName: 'Japanese GP' }]
const raw = {
  rounds,
  drivers: [
    { driverId: 'ver', name: 'Max Verstappen', team: 'Red Bull', teamId: 'red_bull', wins: 2, cumulative: [25, 43, 68] },
    { driverId: 'tsu', name: 'Yuki Tsunoda', team: 'Red Bull', teamId: 'red_bull', wins: 0, cumulative: [10, 20, 30] },
    { driverId: 'nor', name: 'Lando Norris', team: 'McLaren', teamId: 'mclaren', wins: 1, cumulative: [18, 43, 61] },
    { driverId: 'lec', name: 'Charles Leclerc', team: 'Ferrari', teamId: 'ferrari', wins: 0, cumulative: [15, 30, 50] },
  ],
  constructors: [
    { constructorId: 'mclaren', name: 'McLaren', wins: 1, cumulative: [30, 70, 100] },
    { constructorId: 'ferrari', name: 'Ferrari', wins: 0, cumulative: [20, 50, 80] },
    { constructorId: 'red_bull', name: 'Red Bull', wins: 2, cumulative: [35, 63, 98] },
  ],
}

function Harness({ view = 'drivers', round = 3, isWide = false, totalRounds = 4, onOpenProfile = vi.fn(), initialOpen = null }) {
  const series = normalizeSeries(raw, view)
  const rows = rankAt(series, round)
  const hero = heroModel(rows, { view, season: 2026, current: true, totalRounds, roundsDone: round })
  const [open, setOpen] = useState(initialOpen)
  const [hover, setHover] = useState(null)
  return (
    <>
      <StandingsTable
        series={series} rows={rows} view={view} round={round} rounds={rounds} hero={hero} isWide={isWide}
        open={open} onOpenChange={setOpen} hoverId={hover} onHover={setHover} source="seek" reduced entrance={false} onOpenProfile={onOpenProfile}
      />
      <output data-testid="hover">{hover ?? ''}</output>
    </>
  )
}

const detailRegion = () => document.querySelector('[id^="st-detail"]')

describe('StandingsTable (compact)', () => {
  it('renders every entry as a disclosure button with a composed accessible name', () => {
    render(<Harness />)
    const list = screen.getByRole('list', { name: 'Driver standings after round 3' })
    expect(within(list).getAllByRole('button')).toHaveLength(4)
    const first = screen.getByRole('button', { name: /^1, Max Verstappen, Red Bull, 68 points, Leader/ })
    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: /^2, Lando Norris, McLaren, 61 points, 7 behind the leader, No change since round 2/ })).toBeInTheDocument()
  })
  it('opens one row at a time with the detail strip and closes with Escape, keeping focus on the row', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const ver = screen.getByRole('button', { name: /Max Verstappen/ })
    await user.click(ver)
    expect(ver).toHaveAttribute('aria-expanded', 'true')
    const region = detailRegion()
    expect(region).toHaveAttribute('aria-labelledby', ver.id)
    expect(ver).toHaveAttribute('aria-controls', region.id)
    expect(within(region).getByText('Wins this season')).toBeInTheDocument()
    expect(within(region).getByText('Best round')).toBeInTheDocument()
    expect(within(region).getByText('Last 3 rounds')).toBeInTheDocument()
    expect(within(region).getByText(/Against Tsunoda/)).toBeInTheDocument()
    expect(within(region).getByText('38 points ahead')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Lando Norris/ }))
    expect(document.querySelectorAll('[id^="st-detail"]')).toHaveLength(1)
    expect(ver).toHaveAttribute('aria-expanded', 'false')
    await user.click(within(detailRegion()).getByRole('button', { name: 'Open profile' }))
    fireEvent.keyDown(detailRegion(), { key: 'Escape' })
    expect(document.querySelector('[id^="st-detail"]')).toBeNull()
    expect(screen.getByRole('button', { name: /Lando Norris/ })).toHaveFocus()
  })
  it('Open profile reports the row', async () => {
    const onOpenProfile = vi.fn()
    render(<Harness initialOpen="ver" onOpenProfile={onOpenProfile} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Open profile' }))
    expect(onOpenProfile).toHaveBeenCalledWith(expect.objectContaining({ id: 'ver' }))
  })
  it('hover and focus report the row id; leaving clears it', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.hover(screen.getByRole('button', { name: /Lando Norris/ }))
    expect(screen.getByTestId('hover').textContent).toBe('nor')
    expect(screen.getByRole('button', { name: /Lando Norris/ })).toHaveAttribute('data-hover', 'true')
    await user.unhover(screen.getByRole('button', { name: /Lando Norris/ }))
    expect(screen.getByTestId('hover').textContent).toBe('')
    act(() => screen.getByRole('button', { name: /Charles Leclerc/ }).focus())
    expect(screen.getByTestId('hover').textContent).toBe('lec')
  })
  it('says who is out of the title race in words while points are in play', () => {
    render(<Harness totalRounds={4} />) // 1 round left, 25 in play: Tsunoda (38 behind) is out
    expect(screen.getByRole('button', { name: /Yuki Tsunoda.*Out of the title race/ })).toBeInTheDocument()
    expect(screen.getByText(/out of the title race/)).toBeInTheDocument()
    expect(screen.getByText(/Tick: the lowest total/)).toBeInTheDocument()
  })
  it('marks nobody out when nothing is in play, and drops the tick legend', () => {
    render(<Harness totalRounds={3} />)
    expect(screen.queryByText(/out of the title race/)).toBeNull()
    expect(screen.queryByText(/Tick:/)).toBeNull()
  })
  it('shows place changes with text for screen readers, and nothing at round 1', () => {
    const { rerender } = render(<Harness round={2} />)
    // round 2 vs 1: tsunoda stays last; nobody moves
    expect(screen.getByRole('button', { name: /Max Verstappen.*No change since round 1/ })).toBeInTheDocument()
    rerender(<Harness round={1} />)
    expect(screen.getByRole('button', { name: /Max Verstappen/ }).textContent).not.toMatch(/since round/)
  })
  it('legend mentions the dashed teammate stripe for drivers only', () => {
    const { rerender } = render(<Harness />)
    expect(screen.getByText('Dashed stripe: second teammate.')).toBeInTheDocument()
    rerender(<Harness view="constructors" />)
    expect(screen.queryByText('Dashed stripe: second teammate.')).toBeNull()
  })
})

describe('StandingsTable (wide) and constructors', () => {
  it('wide layout shows the column headers and the same rows', () => {
    render(<Harness isWide />)
    expect(screen.getByText('Gap to leader')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(4)
    expect(screen.getByText('Wins')).toBeInTheDocument()
  })
  it('constructors: no team column and the gap to the team ahead in the detail', async () => {
    const user = userEvent.setup()
    render(<Harness view="constructors" isWide />)
    expect(screen.queryByText('Team', { selector: 'span' })).not.toBeNull()
    expect(screen.getByRole('list', { name: 'Constructor standings after round 3' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^2, Red Bull/ }))
    expect(screen.getByText('Gap to the team ahead')).toBeInTheDocument()
    expect(screen.getByText('behind McLaren')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^1, McLaren/ }))
    expect(screen.getByText('Leader', { selector: 'dd span' })).toBeInTheDocument()
  })
  it('compact constructor rows show wins on the second line', () => {
    render(<Harness view="constructors" />)
    expect(screen.getByText('2 wins')).toBeInTheDocument()
    expect(screen.getByText('No wins')).toBeInTheDocument()
  })
})
