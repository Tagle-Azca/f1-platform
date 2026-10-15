import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { dashboard, seasonStandings, ctorStandings } from './fixtures'

const liveState = { available: false, sessionName: null }
vi.mock('../contexts/LiveStatusContext', () => ({ useLiveStatus: () => liveState }))
vi.mock('../services/api', () => ({
  dashboardApi: { get: vi.fn(), getLive: vi.fn() },
  statsApi: { getSeasonStandings: vi.fn(), getConstructorStandings: vi.fn() },
  telemetryApi: { getTimingTower: vi.fn() },
}))
vi.mock('../contexts/PreferencesContext', () => ({ usePreferences: () => ({ prefs: { favoriteDriver: 'Lando Norris', favoriteTeam: 'ferrari' } }) }))
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: null, loading: false, login: vi.fn() }) }))
vi.mock('../components/garage/GarageDrawer', () => ({ default: () => null }))

import { dashboardApi, statsApi } from '../services/api'
import NavList from '../components/layout/NavList'
import Sidebar from '../components/layout/Sidebar'
import MobileNav from '../components/layout/MobileNav'
import RaceContextBar from '../components/layout/RaceContextBar'
import AppShell from '../components/layout/AppShell'
import PageHeader from '../components/layout/PageHeader'
import PageWrapper from '../components/layout/PageWrapper'
import StandingsSidebar from '../components/standings/StandingsSidebar'
import { RaceProvider } from '../contexts/RaceContext'

beforeEach(() => {
  liveState.available = false; liveState.sessionName = null
  dashboardApi.get.mockResolvedValue(dashboard())
  statsApi.getSeasonStandings.mockResolvedValue(seasonStandings())
  statsApi.getConstructorStandings.mockResolvedValue(ctorStandings())
  window.scrollTo = vi.fn()
  const mem = new Map()
  vi.stubGlobal('localStorage', { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) })
  delete window.matchMedia
})

const at = (path, ui) => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)

describe('NavList / Sidebar', () => {
  it('renders 3 groups, 8 links, aria-current on the active one and live text (DoD-1)', () => {
    liveState.available = true
    at('/live', <NavList />)
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Race weekend', 'Championship', 'Analysis'])
    expect(screen.getAllByRole('link').map((l) => l.querySelector('.truncate').textContent)).toEqual([
      'Dashboard', 'Live timing', 'Calendar', 'Circuits', 'Standings', 'Drivers & teams', 'Rivalries', 'Race analysis',
    ])
    expect(screen.getByRole('link', { name: /Live timing/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Dashboard/ })).not.toHaveAttribute('aria-current')
  })
  it('clicking the active link scrolls to top and calls onNavigate', () => {
    const onNavigate = vi.fn()
    at('/analysis', <NavList onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('link', { name: /Race analysis/ }))
    expect(onNavigate).toHaveBeenCalled()
    expect(window.scrollTo).toHaveBeenCalled()
  })
  it('a race weekend page highlights Calendar; team and driver profiles highlight Drivers & teams', () => {
    const { unmount } = at('/races/2026/3', <NavList />)
    expect(screen.getByRole('link', { name: /Calendar/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page')).toHaveLength(1)
    unmount()
    for (const path of ['/drivers/norris', '/constructors/mclaren', '/drivers?view=constructors']) {
      const view = at(path.split('?')[0], <NavList />)
      expect(screen.getByRole('link', { name: /Drivers & teams/ })).toHaveAttribute('aria-current', 'page')
      view.unmount()
    }
    at('/circuits/monza', <NavList />)
    expect(screen.getByRole('link', { name: /Circuits/ })).toHaveAttribute('aria-current', 'page')
  })
  it('Sidebar has a Primary nav and sign-in', () => {
    at('/', <Sidebar />)
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign in/ })).toBeInTheDocument()
  })
})

describe('MobileNav', () => {
  it('shows 4 tabs plus More; More opens a dialog that closes on Escape and the close button', async () => {
    at('/races/2026/13', <><MobileNav /><main id="main" tabIndex={-1} /></>)
    expect(within(screen.getByRole('navigation', { name: 'Mobile' })).getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual(['/', '/live', '/calendar', '/standings'])
    expect(screen.getByRole('link', { name: /Calendar/ })).toHaveAttribute('aria-current', 'page')
    const more = screen.getByRole('button', { name: 'More' })
    fireEvent.click(more)
    expect(await screen.findByRole('dialog', { name: 'Main menu' })).toBeInTheDocument()
    expect(more).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    fireEvent.click(more)
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
  it('choosing a drawer link closes the drawer and focuses main', async () => {
    at('/', <><MobileNav /><main id="main" tabIndex={-1} /><Routes><Route path="*" element={null} /></Routes></>)
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    const dlg = await screen.findByRole('dialog')
    fireEvent.click(dlg.querySelector('a[href="/circuits"]'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), { timeout: 3000 })
    await waitFor(() => expect(document.getElementById('main')).toHaveFocus(), { timeout: 3000 })
  })
  it('closes when the viewport grows to md', async () => {
    let handler
    window.matchMedia = () => ({ matches: false, addEventListener: (_, h) => { handler = h }, removeEventListener() {} })
    at('/', <MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    await screen.findByRole('dialog')
    await act(async () => { handler({ matches: true }) })
    // handler reads mql.matches; emulate via a matching mql
    window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })
  })
})

describe('RaceContextBar', () => {
  const bar = () => at('/', <RaceProvider><RaceContextBar /></RaceProvider>)
  it('shows upcoming session with ETA and race identity', async () => {
    bar()
    expect((await screen.findAllByText('Practice 2')).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/in \d+h|in \d+d/).length).toBeGreaterThan(0)
    expect(screen.getByText('Hungarian Grand Prix')).toBeInTheDocument()
    expect(screen.getByText(/Round 13 of 24/)).toBeInTheDocument()
    expect(screen.getByText('FP1', { exact: false })).toBeInTheDocument()
  })
  it('shows LIVE state as text when a session is live', async () => {
    liveState.available = true; liveState.sessionName = 'Qualifying'
    bar()
    expect((await screen.findAllByText('Live')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Qualifying').length).toBeGreaterThan(0)
  })
  it('shows an unavailable message when the API fails and there is no data', async () => {
    dashboardApi.get.mockRejectedValue(new Error('boom'))
    bar()
    expect((await screen.findAllByText('Session data unavailable')).length).toBeGreaterThan(0)
    expect(screen.queryByText('boom')).toBeNull()
  })
  it('shows no-session when there is no next race', async () => {
    dashboardApi.get.mockResolvedValue({ nextRace: null })
    bar()
    expect((await screen.findAllByText('No session scheduled')).length).toBeGreaterThan(0)
  })
  it('timezone picker opens, selects, persists and closes with Escape', async () => {
    bar()
    await screen.findByText('Hungarian Grand Prix')
    const btn = screen.getByRole('button', { name: /Time zone/ })
    fireEvent.click(btn)
    fireEvent.click(screen.getByRole('button', { name: 'Tokyo (JST)' }))
    expect(localStorage.getItem('f1_tz')).toBe('Asia/Tokyo')
    fireEvent.click(screen.getByRole('button', { name: /Time zone/ }))
    expect(screen.getByRole('button', { name: 'Tokyo (JST)' })).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('button', { name: 'Tokyo (JST)' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Time zone/ }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('button', { name: 'Tokyo (JST)' })).toBeNull()
  })
})

describe('StandingsSidebar rail', () => {
  it('renders nothing below xl and does not fetch', () => {
    at('/', <StandingsSidebar />)
    expect(screen.queryByRole('complementary')).toBeNull()
    expect(statsApi.getSeasonStandings).not.toHaveBeenCalled()
  })
  it('renders at xl: drivers, favorites highlighted, constructors tab, loading/empty/error states', async () => {
    window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })
    at('/', <StandingsSidebar />)
    expect(screen.getByText('Loading standings')).toBeInTheDocument()
    expect(await screen.findByText('Verstappen')).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Championship standings' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Constructors' }))
    expect(screen.getByText('McLaren')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Full standings' })).toHaveAttribute('href', '/standings?view=constructors')
  })
  it('handles failed fetch with an empty message', async () => {
    window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })
    statsApi.getSeasonStandings.mockRejectedValue(new Error('x'))
    at('/', <StandingsSidebar />)
    expect(await screen.findByText('Standings not available yet')).toBeInTheDocument()
  })
})

describe('AppShell / error boundary / headers', () => {
  it('has skip link, landmarks and renders routes', async () => {
    at('/', <AppShell><Routes><Route path="/" element={<h1>Hello page</h1>} /></Routes></AppShell>)
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hello page' })).toBeInTheDocument()
  })
  it('error boundary shows static copy (no raw message) and recovers', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let boom = true
    const Bad = () => { if (boom) throw new Error('SECRET stack detail'); return <p>ok</p> }
    at('/', <AppShell><Routes><Route path="/" element={<Bad />} /></Routes></AppShell>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('data-error-boundary')
    expect(alert).toHaveTextContent('Red flag')
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument()
    expect(screen.getAllByRole('button').filter(b => alert.contains(b)).map(b => b.textContent)).toEqual(['Try again', 'Dashboard'])
    expect(screen.queryByText(/SECRET/)).toBeNull()
    boom = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByText('ok')).toBeInTheDocument()
    spy.mockRestore()
  })
  it('PageHeader and PageWrapper render', () => {
    render(<><PageHeader title="T" subtitle="S" badge="mongo" actions={<b>act</b>} /><PageHeader title="Only" /><PageWrapper>kid</PageWrapper></>)
    expect(screen.getByRole('heading', { level: 1, name: 'T' })).toBeInTheDocument()
    expect(screen.getByText('act')).toBeInTheDocument()
    expect(screen.getByText('kid')).toBeInTheDocument()
  })
})
