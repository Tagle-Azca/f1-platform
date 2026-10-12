import { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

const prefsState = { prefs: { favoriteDriver: null, favoriteTeam: null } }
vi.mock('../contexts/PreferencesContext', () => ({ usePreferences: () => prefsState }))
vi.mock('../services/api', () => ({
  statsApi: { getSeasonStandings: vi.fn(), getConstructorStandings: vi.fn() },
  driversApi: { getAll: vi.fn() },
  racesApi: { getBySeason: vi.fn() },
  circuitsApi: { getAll: vi.fn() },
  searchApi: { search: vi.fn() },
}))
import { statsApi, driversApi, racesApi, circuitsApi } from '../services/api'
import EncyclopediaPage from './EncyclopediaPage'
import { resetStandingsCache } from '../hooks/useStandingsData'
import { resetSeasonCircuitsCache } from '../hooks/useSeasonCircuits'

const YEAR = new Date().getFullYear()
const rounds = [{ round: '1', raceName: 'A GP', complete: true }, { round: '2', raceName: 'B GP', complete: true }]
const full = (year) => ({
  rounds, totalRounds: 24,
  drivers: [
    { driverId: 'ann', name: 'Ann One', team: 'McLaren', teamId: 'mclaren', wins: 2, finalPoints: 90, cumulative: [40, 90] },
    { driverId: 'bee', name: 'Bee Two', team: 'Ferrari', teamId: 'ferrari', wins: 0, finalPoints: 60, cumulative: [20, 60] },
    { driverId: 'cee', name: 'Cee Three', team: 'Ferrari', teamId: 'ferrari', wins: 0, finalPoints: 10, cumulative: [5, 10] },
  ],
  season: year,
})
const ctors = { rounds, constructors: [{ constructorId: 'ferrari', name: 'Ferrari', finalPoints: 70, wins: 0 }, { constructorId: 'mclaren', name: 'McLaren', finalPoints: 90, wins: 2 }] }
const LOCATION = { current: null }
function Where() {
  const loc = useLocation()
  useEffect(() => { LOCATION.current = loc })
  return null
}
const mount = (url = '/encyclopedia') => render(<MemoryRouter initialEntries={[url]}><Where /><EncyclopediaPage /></MemoryRouter>)

beforeEach(() => {
  vi.clearAllMocks()
  resetStandingsCache(); resetSeasonCircuitsCache()
  prefsState.prefs = { favoriteDriver: null, favoriteTeam: null }
  statsApi.getSeasonStandings.mockImplementation(async (y) => (Number(y) >= YEAR - 2 ? full(Number(y)) : { rounds: [], drivers: [], totalRounds: null }))
  statsApi.getConstructorStandings.mockResolvedValue(ctors)
  driversApi.getAll.mockResolvedValue([{ driverId: 'ann', photoUrl: 'https://x.test/a.png', permanentNumber: '7', code: 'ANN' }])
  racesApi.getBySeason.mockResolvedValue([{ round: '1', date: `${YEAR}-03-01`, raceName: 'A GP', Circuit: { circuitId: 'monza', circuitName: 'Monza', Location: { country: 'Italy' } } }])
  circuitsApi.getAll.mockResolvedValue([{ circuitId: 'monza', circuitName: 'Monza', Location: { country: 'Italy', locality: 'Monza' }, trackCoords: [], raceCount: 3, lastSeason: YEAR }])
})

const cards = () => Array.from(document.querySelectorAll('[data-driver-card]')).map((e) => e.getAttribute('data-driver-card'))

describe('EncyclopediaPage', () => {
  it('shows the header, a driver grid in standings order and the data-driven subline', async () => {
    mount()
    expect(screen.getByRole('heading', { level: 1, name: 'Encyclopedia' })).toBeInTheDocument()
    await waitFor(() => expect(cards()).toEqual(['ann', 'bee', 'cee']))
    expect(screen.getByText(`${YEAR - 2}–${YEAR}`)).toBeInTheDocument()
    expect(screen.getByText((_, el) => el.tagName === 'P' && el.textContent === '3 drivers')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ann One' })).toHaveAttribute('href', '/drivers/ann')
    expect(document.querySelector('select')).toBeNull()
  })

  it('lists only seasons with data in the Select', async () => {
    mount()
    await waitFor(() => expect(cards().length).toBe(3))
    fireEvent.click(document.getElementById('enc-season'))
    const opts = (await screen.findAllByRole('option')).map((o) => o.textContent)
    expect(opts).toEqual([String(YEAR), String(YEAR - 1), String(YEAR - 2)])
  })

  it('switches tabs through the URL and fetches circuits only when opened', async () => {
    mount()
    await waitFor(() => expect(cards().length).toBe(3))
    expect(circuitsApi.getAll).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('tab', { name: 'Constructors' }))
    await waitFor(() => expect(LOCATION.current.search).toContain('view=constructors'))
    await waitFor(() => expect(document.querySelectorAll('[data-constructor-card]').length).toBe(2))
    expect(document.querySelector('[data-constructor-card]').getAttribute('data-constructor-card')).toBe('mclaren')
    fireEvent.click(screen.getByRole('tab', { name: 'Circuits' }))
    await waitFor(() => expect(document.querySelectorAll('[data-circuit-card]').length).toBe(1))
    expect(circuitsApi.getAll).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/1 circuit on the/)).toBeInTheDocument()
  })

  it('reads ?view and drops invalid values with replace', async () => {
    mount('/encyclopedia?view=constructors&season=abc')
    await waitFor(() => expect(document.querySelectorAll('[data-constructor-card]').length).toBe(2))
    expect(LOCATION.current.search).toBe('?view=constructors')
  })

  it('falls back from a season without data by dropping it from the URL', async () => {
    mount(`/encyclopedia?season=${YEAR - 5}`)
    await waitFor(() => expect(cards().length).toBe(3))
    await waitFor(() => expect(LOCATION.current.search).toBe(''))
  })

  it('pins the favourite driver first and keeps its true rank', async () => {
    prefsState.prefs = { favoriteDriver: 'Cee Three', favoriteTeam: 'mclaren' }
    mount()
    await waitFor(() => expect(cards()).toEqual(['cee', 'ann', 'bee']))
    const link = screen.getByRole('link', { name: 'Cee Three' })
    expect(within(link).getByText('P3')).toBeInTheDocument()
    expect(within(link).getByText('Favourite')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Constructors' }))
    await waitFor(() => expect(document.querySelector('[data-constructor-card]')?.getAttribute('data-favourite')).toBe('true'))
  })

  it('shows an error state with retry', async () => {
    statsApi.getSeasonStandings.mockRejectedValue(new Error('x'))
    mount()
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('shows the empty state when the season has no calendar', async () => {
    racesApi.getBySeason.mockResolvedValue([])
    mount('/encyclopedia?view=circuits')
    expect(await screen.findByText(`No calendar for ${YEAR}`)).toBeInTheDocument()
    expect(screen.getByText('Pick another season.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Show .* season/ })).toBeNull() // already the latest season
  })

  it('shows the seasons error when nothing loads', async () => {
    statsApi.getSeasonStandings.mockRejectedValue(new Error('x'))
    mount('/encyclopedia?view=constructors')
    expect(await screen.findByText(/We couldn't load/)).toBeInTheDocument()
  })
})
