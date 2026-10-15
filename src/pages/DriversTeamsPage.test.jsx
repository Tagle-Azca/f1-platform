import { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

const prefsState = { prefs: { favoriteDriver: null, favoriteTeam: null } }
vi.mock('../contexts/PreferencesContext', () => ({ usePreferences: () => prefsState }))
vi.mock('../services/api', () => ({
  statsApi: { getSeasonStandings: vi.fn(), getConstructorStandings: vi.fn() },
  driversApi: { getAll: vi.fn(), getFeatured: vi.fn() },
  searchApi: { search: vi.fn() },
}))
import { statsApi, driversApi } from '../services/api'
import DriversTeamsPage from './DriversTeamsPage'
import { resetStandingsCache } from '../hooks/useStandingsData'
import { resetFeaturedDriversCache } from '../hooks/useFeaturedDrivers'

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
const mount = (url = '/drivers') => render(<MemoryRouter initialEntries={[url]}><Where /><DriversTeamsPage /></MemoryRouter>)

beforeEach(() => {
  vi.clearAllMocks()
  resetStandingsCache(); resetFeaturedDriversCache()
  prefsState.prefs = { favoriteDriver: null, favoriteTeam: null }
  statsApi.getSeasonStandings.mockImplementation(async (y) => (Number(y) >= YEAR - 2 ? full(Number(y)) : { rounds: [], drivers: [], totalRounds: null }))
  statsApi.getConstructorStandings.mockResolvedValue(ctors)
  driversApi.getAll.mockResolvedValue([{ driverId: 'ann', photoUrl: 'https://x.test/a.png', permanentNumber: '7', code: 'ANN' }])
  driversApi.getFeatured.mockResolvedValue([
    { driverId: 'senna', givenName: 'Ayrton', familyName: 'Senna', constructorId: 'mclaren', constructorName: 'McLaren', permanentNumber: '12', code: 'SEN' },
    { driverId: 'alesi', givenName: 'Jean', familyName: 'Alesi', constructorId: 'ferrari', constructorName: 'Ferrari' },
  ])
})

const cards = () => Array.from(document.querySelectorAll('[data-driver-card]')).map((e) => e.getAttribute('data-driver-card'))

describe('DriversTeamsPage', () => {
  it('shows the header, a driver grid in standings order and the honest range line', async () => {
    mount()
    expect(screen.getByRole('heading', { level: 1, name: 'Drivers & teams' })).toBeInTheDocument()
    await waitFor(() => expect(cards()).toEqual(['ann', 'bee', 'cee']))
    expect(screen.getByText(/Every driver and team from 1950 to today/)).toBeInTheDocument()
    expect(screen.getByText((_, el) => el.tagName === 'P' && el.textContent === '3 drivers')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ann One' })).toHaveAttribute('href', '/drivers/ann')
    expect(document.querySelector('select')).toBeNull()
  })

  it('offers every season from 1950 to now, a Circuits link and only two views', async () => {
    mount()
    await waitFor(() => expect(cards().length).toBe(3))
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Drivers', 'Constructors'])
    expect(screen.getByRole('link', { name: 'Circuits' })).toHaveAttribute('href', '/circuits')
    expect(screen.queryByRole('textbox', { name: /filter/i })).toBeNull()
    fireEvent.click(document.getElementById('drivers-season'))
    const opts = (await screen.findAllByRole('option')).map((o) => o.textContent)
    expect(opts[0]).toBe(String(YEAR))
    expect(opts[opts.length - 1]).toBe('1950')
    expect(opts).toHaveLength(YEAR - 1950 + 1)
  })

  it('switches tabs through the URL', async () => {
    mount()
    await waitFor(() => expect(cards().length).toBe(3))
    fireEvent.click(screen.getByRole('tab', { name: 'Constructors' }))
    await waitFor(() => expect(LOCATION.current.search).toContain('view=constructors'))
    await waitFor(() => expect(document.querySelectorAll('[data-constructor-card]').length).toBe(2))
    expect(document.querySelector('[data-constructor-card]').getAttribute('data-constructor-card')).toBe('mclaren')
  })

  it('reads ?view and drops invalid values with replace', async () => {
    mount('/drivers?view=constructors&season=abc')
    await waitFor(() => expect(document.querySelectorAll('[data-constructor-card]').length).toBe(2))
    expect(LOCATION.current.search).toBe('?view=constructors')
  })

  it('lists a season before the standings data by surname from the featured drivers (probed range)', async () => {
    mount(`/drivers?season=${YEAR - 5}`)
    await waitFor(() => expect(cards()).toEqual(['alesi', 'senna']))
    expect(driversApi.getFeatured).toHaveBeenCalledWith(null, YEAR - 5)
    expect(LOCATION.current.search).toBe(`?season=${YEAR - 5}`)
    expect(screen.getByText(/Line-ups before \d{4} are listed by surname; points are not shown/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ayrton Senna' }).textContent).toContain('SEN')
    expect(screen.queryByText(/pts/)).toBeNull()
  })

  it('lists a 1950s season without probing for it', async () => {
    mount('/drivers?season=1955')
    await waitFor(() => expect(cards()).toEqual(['alesi', 'senna']))
    expect(driversApi.getFeatured).toHaveBeenCalledWith(null, 1955)
  })

  it('shows an honest empty state for constructors before the standings data, with a way back', async () => {
    mount('/drivers?view=constructors&season=1988')
    expect(await screen.findByText(`Team standings cover ${YEAR - 2}–${YEAR}`)).toBeInTheDocument()
    expect(driversApi.getFeatured).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: `Show ${YEAR}` }))
    await waitFor(() => expect(LOCATION.current.search).toContain(`season=${YEAR}`))
    await waitFor(() => expect(document.querySelectorAll('[data-constructor-card]').length).toBe(2))
  })

  it('shows an error with retry when the featured list fails', async () => {
    driversApi.getFeatured.mockRejectedValueOnce(new Error('x'))
    mount('/drivers?season=1970')
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(cards()).toEqual(['alesi', 'senna']))
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

  it('shows the seasons error when nothing loads', async () => {
    statsApi.getSeasonStandings.mockRejectedValue(new Error('x'))
    mount('/drivers?view=constructors')
    expect(await screen.findByText(/We couldn't load/)).toBeInTheDocument()
  })
})
