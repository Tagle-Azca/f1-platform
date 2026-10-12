import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { nextRace, dashboard } from './fixtures'

vi.mock('../components/ui/CircuitLoader', () => ({ default: ({ message }) => <p>{message}</p> }))
vi.mock('../contexts/LiveStatusContext', () => ({ useLiveStatus: () => ({ available: false }) }))
vi.mock('../contexts/PreferencesContext', () => ({ usePreferences: () => ({ prefs: {} }) }))
vi.mock('../services/api', () => ({ statsApi: { getSeasonStandings: vi.fn(), getConstructorStandings: vi.fn() } }))
vi.mock('../components/circuit/CircuitSilhouette', () => ({ default: () => <svg /> }))

import { statsApi } from '../services/api'
import EmptyState from '../components/ui/EmptyState'
import StandingsSidebar from '../components/standings/StandingsSidebar'
import NextRaceHero from '../components/nextrace/NextRaceHero'
import WeekendSchedulePanel from '../components/nextrace/WeekendSchedulePanel'
import HomeStandingsPanel from '../components/home/HomeStandingsPanel'
import TitleFightCard from '../components/home/TitleFightCard'
import { formatEta } from '../utils/eta'

const rounds = [1, 2, 3]
describe('extra branches', () => {
  beforeEach(() => { window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) })

  it('EmptyState loading delegates to the loader (small and large)', () => {
    const { rerender } = render(<EmptyState message="Wait" />)
    expect(screen.getByText('Wait')).toBeInTheDocument()
    rerender(<EmptyState height={300} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
  it('rail shows position trends up/down with spoken text', async () => {
    statsApi.getSeasonStandings.mockResolvedValue({ season: '2026', rounds, drivers: [
      { driverId: 'a', name: 'A One', team: 'T', teamId: 'ferrari', cumulative: [1, 2, 30] },
      { driverId: 'b', name: 'B Two', team: 'T', teamId: 'mclaren', cumulative: [10, 20, 21] },
      { driverId: 'c', name: 'C Three', team: 'T', teamId: 'mclaren', cumulative: [5, 25, 25.5] },
    ] })
    statsApi.getConstructorStandings.mockResolvedValue({ season: '2026', rounds, constructors: [] })
    render(<MemoryRouter><StandingsSidebar /></MemoryRouter>)
    await screen.findByText('One')
    expect(document.body.textContent).toMatch(/up \d+ position|down \d+ position/)
    fireEvent.click(screen.getByRole('button', { name: 'Constructors' }))
    expect(screen.getByText('Standings not available yet')).toBeInTheDocument()
  })
  it('NextRaceHero countdown branch with and without session label', () => {
    const parts = { d: 1, h: 2, m: 3, s: 4 }
    const { rerender } = render(<MemoryRouter><NextRaceHero race={nextRace()} circuit={{ circuitName: 'C' }} live={null} countdown={parts} flagUrl={null} /></MemoryRouter>)
    expect(screen.getByText('Practice 2 starts in')).toBeInTheDocument()
    const r = nextRace(); r.nextSession = null
    rerender(<MemoryRouter><NextRaceHero race={r} circuit={null} live={null} countdown={parts} flagUrl={null} /></MemoryRouter>)
    expect(screen.getByText(/Next session starts in/)).toBeInTheDocument()
  })
  it('schedule weather codes and chip statuses', () => {
    const sched = nextRace().schedule
    const date = sched.fp2.date
    for (const code of [0, 2, 45, 55, 66, 75, 81, 99]) {
      const { unmount } = render(<MemoryRouter><WeekendSchedulePanel schedule={sched} nextSessionKey="fp2" weather={{ [date]: { code, tempMax: 1, tempMin: 0, precipProb: 0 } }} /></MemoryRouter>)
      unmount()
    }
  })
  it('standings panel gap for constructors and trend arrows', async () => {
    statsApi.getSeasonStandings.mockResolvedValue({ rounds, drivers: [
      { driverId: 'max', cumulative: [1, 2, 30] }, { driverId: 'lando', cumulative: [10, 20, 21] }, { driverId: 'charles', cumulative: [5, 25, 25.5] }] })
    statsApi.getConstructorStandings.mockResolvedValue({ rounds, constructors: [{ constructorId: 'mclaren', cumulative: [1, 2, 9] }, { constructorId: 'ferrari', cumulative: [5, 6, 7] }] })
    const props = { standingsTab: 'constructors', onTabChange() {}, onDriverClick() {}, onConstructorClick() {} }
    render(<MemoryRouter><HomeStandingsPanel {...props} data={dashboard()} /></MemoryRouter>)
    await waitFor(() => expect(document.body.textContent).toMatch(/up \d|down \d/))
    expect(screen.getByRole('link', { name: 'Full standings' })).toHaveAttribute('href', '/standings?view=constructors')
  })
  it('title fight handles a missing round count', () => {
    render(<MemoryRouter><TitleFightCard data={{ ...dashboard(), totalRounds: null, roundsDone: null }} /></MemoryRouter>)
    expect(screen.getByText('0 rounds left')).toBeInTheDocument()
  })
  it('formatEta bad input', () => {
    expect(formatEta('not a date', 0)).toBe('')
  })
})
