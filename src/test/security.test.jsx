import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { dashboard, live, seasonStandings, ctorStandings } from './fixtures'

const api = vi.hoisted(() => ({
  dashboardApi: { get: vi.fn(), getLive: vi.fn() },
  statsApi: { getSeasonStandings: vi.fn(), getConstructorStandings: vi.fn(), driverStats: vi.fn() },
  telemetryApi: { getTimingTower: vi.fn() },
}))
vi.mock('../services/api', () => api)
vi.mock('../contexts/PreferencesContext', () => ({ usePreferences: () => ({ prefs: {} }) }))
const auth = vi.hoisted(() => ({ user: null, loading: false, login: vi.fn(), loginWithGoogle: vi.fn() }))
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../components/garage/GarageDrawer', () => ({ default: () => null }))
vi.mock('../components/home/CircuitRadarCanvas', () => ({ default: () => null }))

import { LiveStatusProvider, useLiveStatus } from '../contexts/LiveStatusContext'
import { normalizeNextRace } from '../hooks/useRaceContext'
import { RaceProvider } from '../contexts/RaceContext'
import ShellBoundary from '../components/layout/ShellBoundary'
import AppShell from '../components/layout/AppShell'
import StandingsSidebar from '../components/standings/StandingsSidebar'
import LivePage from '../pages/LivePage'
import DriverDrawer from '../components/ui/DriverDrawer'
import LoginModal from '../components/auth/LoginModal'
import { normalizeRow } from '../components/live/normalizeRow'
import { safeText, safeString } from '../utils/safeText'

const at = (ui, path = '/') => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)
const xl = () => { window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) }

beforeEach(() => {
  vi.clearAllMocks(); delete window.matchMedia
  api.dashboardApi.get.mockResolvedValue(dashboard())
  api.dashboardApi.getLive.mockResolvedValue(live())
  api.statsApi.getSeasonStandings.mockResolvedValue(seasonStandings())
  api.statsApi.getConstructorStandings.mockResolvedValue(ctorStandings())
  api.telemetryApi.getTimingTower.mockResolvedValue(null)
  auth.user = null; auth.loading = false
})
afterEach(() => vi.useRealTimers())

describe('S1: shell survives malformed API / SSE values', () => {
  it('safeText / safeString only let strings and finite numbers through', () => {
    expect(safeText({ x: 1 })).toBeNull(); expect(safeText([1])).toBeNull(); expect(safeText(NaN)).toBeNull()
    expect(safeText(null)).toBeNull(); expect(safeText(7)).toBe(7); expect(safeText('a')).toBe('a')
    expect(safeString({ a: 1 }, 'fb')).toBe('fb'); expect(safeString(5)).toBe('5')
  })
  it('SSE payload with an object sessionName is coerced to null by LiveStatusProvider', () => {
    let es
    vi.stubGlobal('EventSource', class { constructor() { es = this } close() {} })
    const Probe = () => { const s = useLiveStatus(); return <p>{String(s.available)}|{String(s.sessionName)}|{String(s.isRaceType)}</p> }
    render(<LiveStatusProvider><Probe /></LiveStatusProvider>)
    act(() => es.onmessage({ data: JSON.stringify({ available: true, sessionName: { x: 1 }, raceName: ['a'], isRaceType: 'yes' }) }))
    expect(screen.getByText('true|null|null')).toBeInTheDocument()
    act(() => es.onmessage({ data: 'not json' }))
    act(() => es.onmessage({ data: 'null' }))
    expect(screen.getByText('false|null|null')).toBeInTheDocument()
    vi.unstubAllGlobals()
  })
  it('normalizeNextRace drops object text fields and non-objects', () => {
    expect(normalizeNextRace(null)).toBeNull(); expect(normalizeNextRace([1])).toBeNull(); expect(normalizeNextRace('x')).toBeNull()
    const n = normalizeNextRace({ raceName: { $ne: 1 }, round: [1], locality: 'Budapest', schedule: {} })
    expect(n.raceName).toBeNull(); expect(n.round).toBeNull(); expect(n.locality).toBe('Budapest')
  })
  it('the whole shell renders with hostile dashboard values and the page still shows', async () => {
    const d = dashboard(); d.nextRace.raceName = { $ne: 1 }; d.nextRace.round = { a: 1 }; d.nextRace.locality = [1]; d.totalRounds = { x: 1 }
    api.dashboardApi.get.mockResolvedValue(d)
    at(<AppShell><Routes><Route path="/drivers" element={<h1>Drivers page</h1>} /></Routes></AppShell>, '/drivers')
    expect(await screen.findByRole('heading', { name: 'Drivers page' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
  })
  it('StandingsSidebar rail survives a numeric driver name and object team/id fields', async () => {
    xl()
    api.statsApi.getSeasonStandings.mockResolvedValue({ season: { x: 1 }, rounds: [1, 2], drivers: [
      { driverId: { a: 1 }, name: 12345, team: ['t'], teamId: {}, cumulative: [1, 2] },
      null, 'junk', { driverId: 'b', name: 'Bee Two', team: 'T', teamId: 'ferrari', cumulative: [1, 1] }] })
    api.statsApi.getConstructorStandings.mockResolvedValue({ rounds: [1], constructors: { length: 2 } })
    at(<StandingsSidebar />)
    expect(await screen.findByText('Two')).toBeInTheDocument()
    expect(screen.getByText('12345')).toBeInTheDocument()
  })
  it('ShellBoundary renders nothing (or a fallback) on a render error, and recovers on resetKey change', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let boom = true
    const Bad = () => { if (boom) throw new Error('secret'); return <p>fine</p> }
    const { rerender, container } = render(<ShellBoundary resetKey="a"><Bad /></ShellBoundary>)
    expect(container.textContent).toBe('')
    boom = false
    rerender(<ShellBoundary resetKey="b"><Bad /></ShellBoundary>)
    expect(screen.getByText('fine')).toBeInTheDocument()
    boom = true
    rerender(<ShellBoundary resetKey="c" fallback={<i>fb</i>}><Bad /></ShellBoundary>)
    expect(screen.getByText('fb')).toBeInTheDocument()
    expect(screen.queryByText(/secret/)).toBeNull()
    spy.mockRestore()
  })
  it('a throwing shell piece does not unmount the app', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Bad = () => { throw new Error('x') }
    render(<><ShellBoundary><Bad /></ShellBoundary><p>app still here</p></>)
    expect(screen.getByText('app still here')).toBeInTheDocument()
    spy.mockRestore()
  })
})

describe('S3: /live recovers from hostile rows', () => {
  it('normalizeRow coerces object fields', () => {
    const r = normalizeRow({ driverNum: { a: 1 }, acronym: { a: 1 }, fullName: [1], stat: {}, lastLap: [], sectors: [{ value: {}, status: {} }, 5], inPit: 'yes' })
    expect(r.acronym).toBe('—'); expect(r.fullName).toBe(''); expect(r.stat).toBeNull(); expect(r.inPit).toBe(false)
    expect(r.sectors).toEqual([{ value: '', status: null }])
  })
  it('a row with an object acronym renders (no Red Flag) and header objects are ignored', async () => {
    const bad = live({ sessionName: { x: 1 }, raceName: ['r'], currentLap: { a: 1 }, classification: [
      { driverNum: '1', position: 1, acronym: { a: 1 }, fullName: { b: 2 }, teamName: [], stat: 'LEADER', sectors: [] },
      { driverNum: '4', position: 2, acronym: 'NOR', fullName: 'Lando', stat: '+1.0', statLabel: {}, sectors: [{ value: {}, status: {} }] },
    ] })
    api.dashboardApi.getLive.mockResolvedValue(bad)
    vi.useFakeTimers({ shouldAdvanceTime: true })
    // use the real provider through a fake EventSource so LivePage polls
    vi.stubGlobal('EventSource', class { constructor() { setTimeout(() => this.onmessage?.({ data: '{"available":true}' }), 0) } close() {} })
    at(<LiveStatusProvider><RaceProvider><LivePage /></RaceProvider></LiveStatusProvider>)
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.getByText('NOR')).toBeInTheDocument()
    expect(screen.queryByText(/Stewards are investigating/)).toBeNull()
    // next tick delivers a clean payload: still fine
    api.dashboardApi.getLive.mockResolvedValue(live())
    await act(async () => { await vi.advanceTimersByTimeAsync(2100) })
    expect(screen.getByText('VER')).toBeInTheDocument()
    vi.unstubAllGlobals()
  })
})

describe('S2: driver photo URLs must be https', () => {
  const stats = (photoUrl) => ({ driver: { givenName: 'Lando', familyName: 'Norris', code: 'NOR', photoUrl }, seasons: [], career: {} })
  const open = async (photoUrl) => {
    api.statsApi.driverStats.mockResolvedValue(stats(photoUrl))
    const view = at(<DriverDrawer driver={{ driverId: 'lando', name: 'Lando Norris' }} onClose={() => {}} />)
    await waitFor(() => expect(api.statsApi.driverStats).toHaveBeenCalled())
    await act(async () => { await Promise.resolve() })
    return view
  }
  it.each(['http://tracker.example/p.gif', 'javascript:alert(1)', 'data:image/svg+xml,<svg/>', '//evil.example/x.png', { u: 1 }])('drops %s', async (u) => {
    const { baseElement } = await open(u)
    expect(baseElement.querySelector('img')).toBeNull()
  })
  it('keeps https and sets no-referrer', async () => {
    const { baseElement } = await open('https://cdn.example/p.jpg')
    const img = baseElement.querySelector('img')
    expect(img).toHaveAttribute('src', 'https://cdn.example/p.jpg')
    expect(img).toHaveAttribute('referrerpolicy', 'no-referrer')
  })
})

describe('S4: login modal forgets the password when closed', () => {
  it('clears email/password/visibility/error on close; reopens empty and masked', async () => {
    auth.login.mockRejectedValue(new Error('Invalid credentials'))
    const { rerender } = at(<LoginModal open onClose={() => {}} />)
    const pw = screen.getByLabelText('Password', { exact: true })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } })
    fireEvent.change(pw, { target: { value: 'hunter2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(pw).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    await screen.findByRole('alert')
    rerender(<MemoryRouter><LoginModal open={false} onClose={() => {}} /></MemoryRouter>)
    expect(screen.queryByLabelText('Password', { exact: true })).toBeNull()
    rerender(<MemoryRouter><LoginModal open onClose={() => {}} /></MemoryRouter>)
    const pw2 = screen.getByLabelText('Password', { exact: true })
    expect(pw2).toHaveValue(''); expect(pw2).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('S4 residual: a login that fails after the modal closed leaves no stale error', () => {
  it('does not show the old error when the dialog is reopened', async () => {
    let reject
    auth.login.mockReturnValue(new Promise((_, rej) => { reject = rej }))
    const { rerender } = at(<LoginModal open onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } })
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    rerender(<MemoryRouter><LoginModal open={false} onClose={() => {}} /></MemoryRouter>)
    await act(async () => { reject(new Error('Invalid credentials')); await Promise.resolve() })
    rerender(<MemoryRouter><LoginModal open onClose={() => {}} /></MemoryRouter>)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('button', { name: 'Sign In' })).not.toBeDisabled()
  })
})

describe('S5: IBM Plex Mono is self-hosted, no new Google Fonts request', () => {
  it('index.html no longer asks Google Fonts for IBM Plex Mono and main.jsx imports @fontsource', () => {
    const html = readFileSync('index.html', 'utf8'); const main = readFileSync('src/main.jsx', 'utf8')
    expect(html).not.toMatch(/IBM\+Plex/)
    expect(main).toMatch(/@fontsource\/ibm-plex-mono\/latin-400\.css/)
    expect(main).toMatch(/@fontsource\/ibm-plex-mono\/latin-500\.css/)
    expect(JSON.parse(readFileSync('package.json', 'utf8')).dependencies).toHaveProperty('@fontsource/ibm-plex-mono')
  })
})
