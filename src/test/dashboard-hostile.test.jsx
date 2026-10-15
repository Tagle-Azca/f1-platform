import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { dashboard } from './fixtures'

const api = vi.hoisted(() => ({
  dashboardApi: { get: vi.fn(), getLive: vi.fn() },
  statsApi: { getSeasonStandings: vi.fn(), getConstructorStandings: vi.fn(), circuitHistory: vi.fn() },
  telemetryApi: { getTimingTower: vi.fn() },
  circuitsApi: { getById: vi.fn() },
  racesApi: { getByRound: vi.fn(), getBySeason: vi.fn(), getSessionSnapshot: vi.fn() },
}))
vi.mock('../services/api', () => api)
vi.mock('../contexts/LiveStatusContext', () => ({ useLiveStatus: () => ({ available: false }) }))
vi.mock('../components/ui/DriverDrawer', () => ({ default: () => null }))
vi.mock('../components/ui/ConstructorDrawer', () => ({ default: () => null }))
vi.mock('../components/circuits/CircuitDNAPanel', () => ({ default: () => null }))
vi.mock('../components/circuit/CircuitSilhouette', async (orig) => ({ ...(await orig()), default: () => null }))

import { buildSessionList, getFeaturedSession } from '../utils/sessionSchedule'
import { normalizeDashboard, normalizeNextRace, normalizeSchedule } from '../utils/normalizeDashboard'
import HomePage from '../pages/HomePage'
import RaceWeekendPage from '../pages/RaceWeekendPage'
import NextRaceRedirect from '../components/race/NextRaceRedirect'
import { resetRaceWeekendCache } from '../hooks/useRaceWeekend'
import LivePage from '../pages/LivePage'
import { RaceProvider } from '../contexts/RaceContext'
import TitleFightCard from '../components/home/TitleFightCard'
import HomeStandingsPanel from '../components/home/HomeStandingsPanel'
import LastSessionPanel from '../components/home/LastSessionPanel'
import WeekendSchedulePanel from '../components/nextrace/WeekendSchedulePanel'
import NextRaceHero from '../components/nextrace/NextRaceHero'

const at = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)
const BOOM = 'Stewards are investigating'

const hostileVariants = () => {
  const v = []
  const mk = (fn) => { const d = dashboard(); fn(d); v.push(d) }
  mk(d => { d.nextRace.schedule.fp1 = { date: '2099-01-01', time: 5 } })
  mk(d => { d.nextRace.schedule.fp1 = { date: { a: 1 }, time: [1] } })
  mk(d => { d.nextRace.schedule = 'nope' })
  mk(d => { d.nextRace.schedule = { fp1: null, race: 7, __proto__: { x: 1 } } })
  mk(d => { d.nextRace.raceName = { $ne: 1 } })
  mk(d => { d.nextRace.round = { a: 1 }; d.nextRace.season = [1]; d.nextRace.locality = {}; d.nextRace.country = [] })
  mk(d => { d.nextRace.nextSession = { label: { x: 1 }, dateTime: 5 }; d.nextRace.currentSession = { isLive: 'yes', label: {} } })
  mk(d => { d.standings = { length: 2 } })
  mk(d => { d.standings = 'abc' })
  mk(d => { d.standings[0].name = { a: 1 }; d.standings[1].team = [1]; d.standings[2].points = { p: 1 } })
  mk(d => { d.standings = [null, 5, 'x', { name: 12 }] })
  mk(d => { d.constructorStandings = { a: 1 } })
  mk(d => { d.lastSession = { sessionType: 'Race', sessionLabel: { a: 1 }, podium: 'x', date: { d: 1 } } })
  mk(d => { d.lastSession.podium = [{ name: { a: 1 }, time: {}, position: [] }, null] })
  mk(d => { d.totalRounds = { a: 1 }; d.roundsDone = [1] })
  return v
}

beforeEach(() => {
  vi.clearAllMocks()
  resetRaceWeekendCache()
  api.racesApi.getBySeason.mockResolvedValue([])
  api.statsApi.getSeasonStandings.mockResolvedValue(null)
  api.statsApi.getConstructorStandings.mockResolvedValue(null)
  api.statsApi.circuitHistory.mockResolvedValue(null)
  api.telemetryApi.getTimingTower.mockResolvedValue(null)
  api.dashboardApi.getLive.mockResolvedValue({ isLive: false })
  api.circuitsApi.getById.mockResolvedValue(null)
  delete window.matchMedia
})

describe('S10: pure helpers', () => {
  it('buildSessionList ignores non-string date/time/dateTime and non-object schedules', () => {
    expect(buildSessionList({ fp1: { date: '2099-01-01', time: 5 } }, null).map(s => s.key)).toEqual(['fp1'])
    expect(buildSessionList({ fp1: { date: { a: 1 } } }, null)).toEqual([])
    expect(buildSessionList({ fp1: { dateTime: 7 } }, null)).toEqual([])
    expect(buildSessionList('abc', null)).toEqual([])
    expect(buildSessionList({ fp1: null, race: 7 }, { isLive: 'true' })).toEqual([])
    expect(getFeaturedSession({ fp1: { date: '2099-01-01', time: ['x'] } }, null)?.key).toBe('fp1')
    expect(buildSessionList({ ['__proto__']: { date: '2099-01-01' } }, null)).toEqual([])
  })
  it('normalizeDashboard / normalizeNextRace / normalizeSchedule only keep primitives', () => {
    expect(normalizeDashboard(null)).toBeNull(); expect(normalizeDashboard([1])).toBeNull()
    for (const d of hostileVariants()) {
      const n = normalizeDashboard(d)
      expect(Array.isArray(n.standings)).toBe(true)
      expect(Array.isArray(n.constructorStandings)).toBe(true)
      if (n.nextRace) for (const k of ['raceName', 'round', 'season', 'locality', 'country']) expect(['string', 'number', 'object']).toContain(typeof n.nextRace[k])
      for (const row of n.standings) expect(typeof row.name).toBe('string')
    }
    expect(normalizeSchedule({ fp1: { date: '2099-01-01', time: 5 } })).toEqual({ fp1: { date: '2099-01-01', time: null, dateTime: null } })
    expect(normalizeNextRace({ raceName: { x: 1 }, currentSession: 'x', nextSession: [1] })).toMatchObject({ raceName: null, currentSession: null, nextSession: null })
  })
})

describe('S10: pages survive every hostile /api/dashboard shape', () => {
  it('HomePage (hero, title fight, last session, standings) never reaches the Red Flag path', async () => {
    for (const d of hostileVariants()) {
      api.dashboardApi.get.mockResolvedValue(d)
      const { unmount } = at(<HomePage />)
      expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
      await screen.findAllByRole("heading", { name: /Title fight|Next session|Championship standings/ })
      expect(screen.queryByText(BOOM)).toBeNull()
      unmount()
    }
  })
  it('RaceWeekendPage survives every hostile race and dashboard shape', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (const d of hostileVariants()) {
      api.dashboardApi.get.mockResolvedValue(d)
      api.racesApi.getByRound.mockResolvedValue({
        season: '2026', round: '13', raceName: d.nextRace.raceName, schedule: d.nextRace.schedule,
        Circuit: { circuitId: 'hungaroring', circuitName: d.nextRace.circuit, Location: { locality: d.nextRace.locality, country: d.nextRace.country } },
      })
      resetRaceWeekendCache()
      const { unmount, container } = render(
        <MemoryRouter initialEntries={['/races/2026/13']}><Routes><Route path="/races/:season/:round" element={<RaceWeekendPage />} /></Routes></MemoryRouter>,
      )
      await screen.findByRole('heading', { level: 1 })
      await screen.findByRole('navigation', { name: 'Race weekend navigation' })
      expect(container.textContent).not.toContain('[object Object]')
      unmount()
    }
    spy.mockRestore()
  })
  it('NextRaceRedirect survives every hostile dashboard shape (lands on a weekend or the calendar, never crashes)', async () => {
    const Where = () => <output data-testid="where">{useLocation().pathname}</output>
    for (const d of hostileVariants()) {
      api.dashboardApi.get.mockResolvedValue(d)
      resetRaceWeekendCache()
      const { unmount } = render(
        <MemoryRouter initialEntries={['/next-race']}><Routes><Route path="/next-race" element={<NextRaceRedirect />} /><Route path="*" element={<Where />} /></Routes></MemoryRouter>,
      )
      const where = await screen.findByTestId('where')
      expect(where.textContent).toMatch(/^(\/calendar|\/races\/\d{1,4}\/\d{1,4})$/)
      unmount()
    }
  })
  it('LivePage empty state (NoLiveSession) survives hostile schedules via the shared race context', async () => {
    for (const d of hostileVariants().slice(0, 7)) {
      api.dashboardApi.get.mockResolvedValue(d)
      const { unmount } = at(<RaceProvider><LivePage /></RaceProvider>)
      expect(await screen.findByText('No live session')).toBeInTheDocument()
      expect(screen.queryByText(BOOM)).toBeNull()
      unmount()
    }
  })
})

describe('S10: widgets are defensive on their own (not only via the normalizer)', () => {
  it('TitleFightCard / HomeStandingsPanel / LastSessionPanel with raw hostile data', () => {
    for (const d of hostileVariants()) {
      const props = { standingsTab: 'drivers', onTabChange() {}, onDriverClick() {}, onConstructorClick() {} }
      const { unmount } = at(<><TitleFightCard data={d} /><HomeStandingsPanel {...props} data={d} /><HomeStandingsPanel {...props} standingsTab="constructors" data={d} /><LastSessionPanel session={d.lastSession} /></>)
      unmount()
    }
    expect(true).toBe(true)
  })
  it('WeekendSchedulePanel and NextRaceHero with raw hostile race objects', () => {
    for (const d of hostileVariants()) {
      const { unmount } = at(<><WeekendSchedulePanel schedule={d.nextRace.schedule} nextSessionKey={d.nextRace.nextSession?.key} weather={{}} /><NextRaceHero race={d.nextRace} circuit={{ circuitName: { a: 1 } }} live={{ label: { x: 1 } }} countdown={null} flagUrl={null} /></>)
      unmount()
    }
    expect(true).toBe(true)
  })
})
