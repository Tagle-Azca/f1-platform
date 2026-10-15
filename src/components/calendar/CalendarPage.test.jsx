import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'

vi.mock('../../services/api', () => ({ racesApi: { getBySeason: vi.fn() } }))
import { racesApi } from '../../services/api'
import CalendarPage from '../../pages/CalendarPage'

const sched = {
  isSprint: false,
  fp1: { date: '2026-10-23', time: '17:30:00Z' },
  fp2: { date: '2026-10-23', time: '21:00:00Z' },
  fp3: { date: '2026-10-24', time: '17:30:00Z' },
  qualifying: { date: '2026-10-24', time: '21:00:00Z' },
  race: { date: '2026-10-25', time: '20:00:00Z' },
}
const circuit = (id, name, country, locality) => ({ circuitId: id, circuitName: name, Location: { country, locality } })
const race = (round, o = {}) => ({
  season: '2026', round: String(round), raceName: `Grand Prix ${round}`, date: '2026-01-01', hasResults: false, hasSprint: false,
  Circuit: circuit('monza', 'Autodromo Nazionale Monza', 'Italy', 'Monza'), winner: null, schedule: null, ...o,
})
const SEASON = [
  race(1, { raceName: 'Australian Grand Prix', date: '2026-03-08', hasResults: true, hasSprint: true, winner: { Driver: { givenName: 'Lando', familyName: 'Norris' } } }),
  race(2, { raceName: 'Chinese Grand Prix', date: '2026-03-15', hasResults: true, winner: { Driver: { givenName: 'Max', familyName: 'Verstappen' } } }),
  race(3, { raceName: 'Mexico City Grand Prix', date: '2026-10-25', schedule: sched, Circuit: circuit('rodriguez', 'Autodromo Hermanos Rodriguez', 'Mexico', 'Mexico City') }),
  race(4, { raceName: 'Brazilian Grand Prix', date: '2026-11-08' }),
]

function Probe() { const l = useLocation(); return <output data-testid="loc">{l.pathname}{l.search}</output> }
const mount = (url = '/calendar') => render(<MemoryRouter initialEntries={[url]}><CalendarPage /><Probe /></MemoryRouter>)
const store = new Map()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('localStorage', { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() })
  store.clear(); store.set('f1_tz', 'UTC')
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-23T18:30:00Z'))
  racesApi.getBySeason.mockResolvedValue(SEASON)
})
afterEach(() => { vi.useRealTimers() })

describe('CalendarPage current season', () => {
  it('renders hero, toolbar and month-grouped rounds (DoD-1, DoD-6)', async () => {
    mount()
    expect(screen.getByText('Loading calendar')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 2, name: 'Mexico City Grand Prix' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Season calendar' })).toBeInTheDocument()
    expect(screen.getByText('Round 3 of 4, Mexico City')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open race weekend' })).toHaveAttribute('href', '/races/2026/3')
    expect(screen.getByLabelText('Season')).toBeInTheDocument()
    expect(screen.getByLabelText('Times in')).toBeInTheDocument()
    const months = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(months).toEqual(expect.arrayContaining(['March', 'October', 'November']))
    const items = screen.getAllByRole('listitem').filter((li) => li.dataset.status)
    expect(items.map((li) => li.dataset.status)).toEqual(['done', 'done', 'next', 'upcoming'])
    const next = document.getElementById('round-3')
    expect(next).toHaveAttribute('aria-current', 'true')
    expect(next).toHaveTextContent('This weekend')
    expect(document.querySelectorAll('[aria-current="true"]')).toHaveLength(1)
    const first = document.getElementById('round-1')
    expect(first).toHaveTextContent('Lando Norris')
    expect(first).toHaveTextContent('Completed')
    expect(within(first).getByText('Sprint')).toBeInTheDocument()
    expect(document.getElementById('round-2')).not.toHaveTextContent('Sprint')
  })

  it('links every round to its race weekend page (DoD-8)', async () => {
    mount()
    await screen.findByRole('heading', { level: 2, name: 'Mexico City Grand Prix' })
    expect(within(document.getElementById('round-1')).getByRole('link', { name: 'Australian Grand Prix' })).toHaveAttribute('href', '/races/2026/1')
    expect(within(document.getElementById('round-3')).getByRole('link', { name: 'Mexico City Grand Prix' })).toHaveAttribute('href', '/races/2026/3')
    expect(within(document.getElementById('round-3')).getByRole('link', { name: 'Autodromo Hermanos Rodriguez' })).toHaveAttribute('href', '/circuits/rodriguez')
    expect(within(document.getElementById('round-4')).getByRole('link', { name: 'Brazilian Grand Prix' })).toHaveAttribute('href', '/races/2026/4')
    expect(within(document.getElementById('round-4')).queryByRole('button')).toBeNull()
  })

  it('expands sessions in the selected zone with aria-expanded/controls (DoD-7, DoD-4)', async () => {
    mount()
    await screen.findByRole('heading', { level: 2, name: 'Mexico City Grand Prix' })
    expect(within(document.getElementById('round-1')).queryByRole('button')).toBeNull()
    const btn = within(document.getElementById('round-3')).getByRole('button', { name: 'Show sessions for Mexico City Grand Prix' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    const region = document.getElementById(btn.getAttribute('aria-controls'))
    expect(region).toHaveAttribute('role', 'region')
    expect(region).toHaveTextContent('Times in UTC')
    expect(region).toHaveTextContent('17:30')
    fireEvent.click(btn)
    await waitFor(() => expect(btn).toHaveAttribute('aria-expanded', 'false'))
  })

  it('shows hero times in the chosen zone and shifts them when the zone changes (DoD-4)', async () => {
    store.set('f1_tz', 'Asia/Tokyo')
    mount()
    await screen.findByRole('heading', { level: 2, name: 'Mexico City Grand Prix' })
    // next session after 18:30Z is Practice 2 at 21:00Z -> Sat 06:00 in Tokyo
    expect(screen.getByText('Sat 06:00')).toBeInTheDocument()
  })

  it('jump scrolls to and focuses the next round, and is absent when there is none (DoD-9)', async () => {
    const scroll = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scroll
    mount()
    await screen.findByRole('heading', { level: 2, name: 'Mexico City Grand Prix' })
    expect(scroll).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Jump to next round/ }))
    expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ block: 'center' }))
    expect(document.activeElement).toBe(document.getElementById('round-link-3'))
  })

  it('without a next round there is no jump button and the hero says the season is complete', async () => {
    racesApi.getBySeason.mockResolvedValue(SEASON.slice(0, 2))
    mount()
    expect(await screen.findByText('Season complete')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Jump to next round/ })).toBeNull()
  })
})

describe('?season= (DoD-3)', () => {
  it('loads a past season, shows it in the control, and notes that times are current-season only (DoD-7)', async () => {
    racesApi.getBySeason.mockResolvedValue(SEASON.map((r) => ({ ...r, season: '2023', hasResults: true, schedule: null })))
    mount('/calendar?season=2023')
    await screen.findByText('2023 season')
    expect(racesApi.getBySeason).toHaveBeenCalledWith('2023')
    expect(screen.getByLabelText('Season')).toHaveTextContent('2023')
    expect(screen.getByText(/current season only/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Show sessions/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Jump to next round/ })).toBeNull()
    expect(document.getElementById('round-1')).toHaveTextContent('Lando Norris')
  })

  it('normalises invalid and out-of-range values in place', async () => {
    for (const bad of ['abc', '1949', '2999']) {
      const { unmount } = mount(`/calendar?season=${bad}`)
      await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('/calendar?season=2026'))
      expect(racesApi.getBySeason).toHaveBeenLastCalledWith('2026')
      unmount()
    }
  })

  it('a missing value means the current season', async () => {
    mount('/calendar')
    await screen.findByRole('heading', { level: 2, name: 'Mexico City Grand Prix' })
    expect(racesApi.getBySeason).toHaveBeenCalledWith('2026')
    expect(screen.getByLabelText('Season')).toHaveTextContent('2026')
  })

  it('choosing a season pushes the param', async () => {
    mount()
    await screen.findByRole('heading', { level: 2, name: 'Mexico City Grand Prix' })
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Season'))
    await user.click(await screen.findByRole('option', { name: '2023' }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('/calendar?season=2023'))
    expect(racesApi.getBySeason).toHaveBeenLastCalledWith('2023')
  })
})

describe('states (DoD-10)', () => {
  it('shows a retry on error without raw error text, then recovers', async () => {
    racesApi.getBySeason.mockRejectedValueOnce(new Error('boom stack at db.js:1'))
    mount()
    expect(await screen.findByText('Could not load the calendar')).toBeInTheDocument()
    expect(screen.queryByText(/boom/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Mexico City Grand Prix' })).toBeInTheDocument()
  })
  it('shows the empty message for a season with no rounds', async () => {
    racesApi.getBySeason.mockResolvedValue([])
    mount()
    expect(await screen.findByText('No rounds found for 2026.')).toBeInTheDocument()
  })
  it('marks the loading container busy', () => {
    racesApi.getBySeason.mockReturnValue(new Promise(() => {}))
    mount()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
  })
  it('says session times are not published for a next round without a schedule', async () => {
    racesApi.getBySeason.mockResolvedValue([SEASON[0], SEASON[3]])
    mount()
    expect(await screen.findByText('Session times not published yet.')).toBeInTheDocument()
  })
})
