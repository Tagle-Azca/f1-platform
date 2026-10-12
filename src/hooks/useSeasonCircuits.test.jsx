import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

vi.mock('../services/api', () => ({ circuitsApi: { getAll: vi.fn() }, racesApi: { getBySeason: vi.fn() } }))
import { circuitsApi, racesApi } from '../services/api'
import { useSeasonCircuits, calendarCircuits, resetSeasonCircuitsCache } from './useSeasonCircuits'

const raw = (id, extra = {}) => ({ circuitId: id, circuitName: `Name ${id}`, Location: { lat: '1', long: '2', locality: 'L', country: 'Italy' }, trackCoords: [[0, 0]], raceCount: 4, lastSeason: 2025, ...extra })
const race = (round, id, extra = {}) => ({ round: String(round), date: `2026-0${round}-01`, raceName: `GP ${round}`, Circuit: { circuitId: id, circuitName: `Name ${id}`, Location: { locality: 'L', country: 'Italy' } }, ...extra })

beforeEach(() => {
  resetSeasonCircuitsCache()
  vi.clearAllMocks()
  circuitsApi.getAll.mockResolvedValue([raw('monza'), raw('imola'), raw('zandvoort')])
  racesApi.getBySeason.mockResolvedValue([race(2, 'imola'), race(1, 'monza'), race(3, 'sepang'), race(4, 'monza')])
})

describe('calendarCircuits', () => {
  it('orders by round, keeps one card per circuit and appends calendar-only circuits in place', () => {
    const list = calendarCircuits([raw('monza'), raw('imola')], [race(2, 'imola'), race(1, 'monza'), race(3, 'sepang'), race(4, 'monza')])
    expect(list.map((c) => [c.id, c.calendarRound])).toEqual([['monza', 1], ['imola', 2], ['sepang', 3]])
    expect(list[0].calendarOnly).toBe(false)
    expect(list[2].calendarOnly).toBe(true)
  })
  it('drops unsafe ids and junk', () => {
    expect(calendarCircuits(null, [race(1, '<b>'), null, 'x', { Circuit: {} }])).toEqual([])
    expect(calendarCircuits('x', 'y')).toEqual([])
  })
})

describe('useSeasonCircuits', () => {
  it('requests nothing until enabled', async () => {
    const { result, rerender } = renderHook(({ on }) => useSeasonCircuits(2026, { enabled: on }), { initialProps: { on: false } })
    expect(result.current.status).toBe('idle')
    expect(racesApi.getBySeason).not.toHaveBeenCalled()
    expect(circuitsApi.getAll).not.toHaveBeenCalled()
    rerender({ on: true })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.circuits).toHaveLength(3)
  })
  it('sets the next circuit only for the current season', async () => {
    racesApi.getBySeason.mockResolvedValue([race(1, 'monza', { isUpcoming: false }), race(2, 'imola', { isUpcoming: true })])
    const a = renderHook(() => useSeasonCircuits(2026, { isCurrent: true }))
    await waitFor(() => expect(a.result.current.status).toBe('ready'))
    expect(a.result.current.nextId).toBe('imola')
    const b = renderHook(() => useSeasonCircuits(2025, { isCurrent: false }))
    await waitFor(() => expect(b.result.current.status).toBe('ready'))
    expect(b.result.current.nextId).toBeNull()
  })
  it('caches the calendar per season and the circuits list once', async () => {
    const a = renderHook(() => useSeasonCircuits(2026))
    await waitFor(() => expect(a.result.current.status).toBe('ready'))
    const b = renderHook(() => useSeasonCircuits(2026))
    await waitFor(() => expect(b.result.current.status).toBe('ready'))
    const c = renderHook(() => useSeasonCircuits(2025))
    await waitFor(() => expect(c.result.current.status).toBe('ready'))
    expect(racesApi.getBySeason).toHaveBeenCalledTimes(2)
    expect(circuitsApi.getAll).toHaveBeenCalledTimes(1)
  })
  it('degrades to calendar-only cards when the circuits list fails', async () => {
    circuitsApi.getAll.mockRejectedValueOnce(new Error('down'))
    const { result } = renderHook(() => useSeasonCircuits(2026))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.circuits.every((c) => c.calendarOnly)).toBe(true)
  })
  it('reports a calendar failure and retries', async () => {
    racesApi.getBySeason.mockRejectedValueOnce(new Error('down'))
    const { result } = renderHook(() => useSeasonCircuits(2026))
    await waitFor(() => expect(result.current.status).toBe('error'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('ready'))
  })
  it('returns an empty ready list for an empty calendar', async () => {
    racesApi.getBySeason.mockResolvedValueOnce([])
    const { result } = renderHook(() => useSeasonCircuits(2019))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.circuits).toEqual([])
  })
  it('stays idle for a missing season', () => {
    expect(renderHook(() => useSeasonCircuits(null)).result.current.status).toBe('idle')
  })
})
