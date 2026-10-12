import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../services/api', () => ({ constructorsApi: { getStats: vi.fn() } }))
import { constructorsApi } from '../../services/api'
import ConstructorDrawer from './ConstructorDrawer'
import { resetConstructorProfileCache } from '../../hooks/useConstructorProfile'

const team = { constructorId: 'mclaren', name: 'McLaren', stats: { championships: 2, wins: 22, podiums: 53, poles: 17 }, seasons: [{ season: '2026', points: 1, drivers: [{ id: 'norris', name: 'Lando Norris', points: 201 }] }] }
const open = (ctor, onClose = vi.fn()) => render(<MemoryRouter><ConstructorDrawer constructor={ctor} onClose={onClose} /></MemoryRouter>)

beforeEach(() => { vi.clearAllMocks(); resetConstructorProfileCache(); constructorsApi.getStats.mockResolvedValue(team) })

describe('ConstructorDrawer', () => {
  it('renders nothing without a constructor', () => {
    open(null)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('shows the season line, totals, drivers and a working full-profile link', async () => {
    open({ constructorId: 'mclaren', name: 'McLaren', season: 2026, position: 2, points: 780 })
    expect(screen.getByRole('dialog', { name: 'McLaren' })).toBeInTheDocument()
    expect(screen.getByText('P2 · 780 points')).toBeInTheDocument()
    expect(await screen.findByText('Lando Norris')).toBeInTheDocument()
    expect(screen.getByText('Titles')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open full profile' })).toHaveAttribute('href', '/constructors/mclaren')
  })
  it('omits the season line when the row has no rank', () => {
    open({ constructorId: 'mclaren', name: 'McLaren' })
    expect(screen.queryByText(/season$/)).toBeNull()
  })
  it('Esc and the 44px close button close it', () => {
    const onClose = vi.fn()
    open({ constructorId: 'mclaren', name: 'McLaren' }, onClose)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    const close = screen.getByRole('button', { name: 'Close' })
    expect(close.className).toMatch(/size-11/)
    fireEvent.click(close)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
  it('error and not-found states keep the footer link only for valid ids', async () => {
    constructorsApi.getStats.mockRejectedValueOnce(Object.assign(new Error('x'), { status: 500 }))
    open({ constructorId: 'mclaren', name: 'McLaren' })
    expect(await screen.findByText("We couldn't load this team.")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open full profile' })).toBeInTheDocument()
  })
  it('hides the link for an unsafe id and makes no request', () => {
    open({ constructorId: '<x>', name: 'Bad' })
    expect(screen.queryByRole('link', { name: 'Open full profile' })).toBeNull()
    expect(constructorsApi.getStats).not.toHaveBeenCalled()
  })
})
