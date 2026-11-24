import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const history = vi.hoisted(() => ({ payload: null }))
vi.mock('../../hooks/useStandingsData', () => ({
  getSeasonStandingsCached: vi.fn(() => Promise.resolve(history.payload ? { ok: true, payload: history.payload } : { ok: false, payload: null })),
}))
vi.mock('../../services/api', () => ({
  statsApi: { historicalPerformance: vi.fn(() => Promise.resolve(null)) },
  racesApi: { getBySeason: vi.fn(() => Promise.resolve([{ round: '5', hasSprint: true }])) },
}))

import TitleFightCard from './TitleFightCard'

const rounds = [1, 2, 3, 4].map(n => ({ round: String(n), complete: true }))
const drivers = (nor) => [
  { driverId: 'ver', name: 'Max Verstappen', team: 'Red Bull', teamId: 'red_bull', cumulative: [25, 50, 75, 100] },
  { driverId: 'nor', name: 'Lando Norris', team: 'McLaren', teamId: 'mclaren', cumulative: nor },
  { driverId: 'lec', name: 'Charles Leclerc', team: 'Ferrari', teamId: 'ferrari', cumulative: [8, 16, 24, 32] },
]
const standings = [
  { driverId: 'ver', name: 'Max Verstappen', team: 'Red Bull', constructorId: 'red_bull', points: 100 },
  { driverId: 'nor', name: 'Lando Norris', team: 'McLaren', constructorId: 'mclaren', points: 40 },
  { driverId: 'lec', name: 'Charles Leclerc', team: 'Ferrari', constructorId: 'ferrari', points: 32 },
]
const card = (totalRounds) => render(
  <MemoryRouter><TitleFightCard data={{ season: 2026, totalRounds, roundsDone: 4, standings }} /></MemoryRouter>,
)

beforeEach(() => { history.payload = null })

describe('TitleFightCard clinch states', () => {
  it('open title: keeps the title fight view and says what the leader needs', async () => {
    history.payload = { totalRounds: 6, rounds, drivers: drivers([40, 60, 70, 80]) }
    card(6)
    expect(await screen.findByText('Verstappen needs 39 more points to clinch.', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Title fight' })).toBeInTheDocument()
    expect(document.querySelector('[data-clinch-recap]')).toBeNull()
  })
  it('clinched early: champion header, recap chart with marker, final margin and the P2/P3 battle', async () => {
    history.payload = { totalRounds: 6, rounds, drivers: drivers([10, 20, 30, 40]) }
    card(6)
    expect(await screen.findByRole('heading', { name: 'Champion' })).toBeInTheDocument()
    expect(screen.getByText('Max Verstappen is champion. Clinched at Round 4, 2 races early.')).toBeInTheDocument()
    await waitFor(() => expect(document.querySelector('[data-clinch-recap]')).not.toBeNull())
    expect(screen.getByText('How it was decided')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Verstappen's lead over Norris after each round/ })).toBeInTheDocument()
    expect(screen.getByText('Final margin: 60 points over Norris. Decided with 2 races to go.')).toBeInTheDocument()
    expect(screen.getByText('final margin')).toBeInTheDocument()
    expect(screen.getByText('Battle for P2, 2 rounds left')).toBeInTheDocument()
    expect(screen.getByText('Norris leads Leclerc by 8 points.')).toBeInTheDocument()
    expect(screen.queryByText(/per round to draw level/)).toBeNull()
  })
  it('history unavailable: falls back to the old card without a clinch line', async () => {
    card(6)
    expect(screen.getByRole('heading', { name: 'Title fight' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/to clinch/)).toBeNull())
  })
})
