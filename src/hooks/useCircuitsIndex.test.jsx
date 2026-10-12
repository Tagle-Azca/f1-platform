import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

vi.mock('../services/api', () => ({
  circuitsApi: { getAll: vi.fn(), getById: vi.fn() },
  racesApi: { getBySeason: vi.fn() },
  statsApi: { circuitHistory: vi.fn() },
}))
import { circuitsApi, racesApi } from '../services/api'
import { useCircuitsIndex, resetCircuitsIndexCache, peekCircuitsIndex, INDEX_TTL_MS } from './useCircuitsIndex'

const circuit = (id, extra = {}) => ({ circuitId: id, circuitName: id.toUpperCase(), Location: { lat: '1', long: '2', locality: 'L', country: 'Italy' }, trackCoords: [], raceCount: 3, lastSeason: 2025, ...extra })
const round = (id, n, extra = {}) => ({ round: String(n), date: '2999-01-01', Circuit: { circuitId: id, circuitName: id, Location: { lat: '3', long: '4', locality: 'X', country: 'Malaysia' } }, ...extra })
const YEAR = new Date().getUTCFullYear()

beforeEach(() => {
  resetCircuitsIndexCache()
  vi.clearAllMocks()
  circuitsApi.getAll.mockResolvedValue([circuit('monza'), circuit('spa'), null, circuit('Bad Id!')])
  racesApi.getBySeason.mockResolvedValue([round('monza', 1, { isUpcoming: true }), round('sepang', 2, { isUpcoming: false })])
})

describe('useCircuitsIndex', () => {
  it('merges the calendar (including calendar-only circuits) and finds the next round', async () => {
    const { result } = renderHook(() => useCircuitsIndex())
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.hasCalendar).toBe(true)
    expect(result.current.season).toBe(YEAR)
    expect(result.current.nextId).toBe('monza')
    expect(result.current.circuits.map((c) => [c.id, c.calendarRound, c.calendarOnly])).toEqual([['monza', 1, false], ['spa', null, false], ['sepang', 2, true]])
  })

  it('falls back to the previous season when the current calendar is empty', async () => {
    racesApi.getBySeason.mockImplementation(async (y) => (y === YEAR ? [] : [round('monza', 1)]))
    const { result } = renderHook(() => useCircuitsIndex())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.season).toBe(YEAR - 1)
    expect(result.current.hasCalendar).toBe(true)
  })

  it('degrades when the calendar fails or is empty twice', async () => {
    racesApi.getBySeason.mockRejectedValue(new Error('down'))
    const a = renderHook(() => useCircuitsIndex())
    await waitFor(() => expect(a.result.current.status).toBe('ready'))
    expect(a.result.current.hasCalendar).toBe(false)
    expect(a.result.current.nextId).toBeNull()
    expect(a.result.current.circuits).toHaveLength(2)
    resetCircuitsIndexCache()
    racesApi.getBySeason.mockResolvedValue([])
    const b = renderHook(() => useCircuitsIndex())
    await waitFor(() => expect(b.result.current.status).toBe('ready'))
    expect(b.result.current.hasCalendar).toBe(false)
    expect(racesApi.getBySeason).toHaveBeenCalledWith(YEAR - 1)
  })

  it('reports an error when circuits fail, and retry loads again', async () => {
    circuitsApi.getAll.mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useCircuitsIndex())
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.circuits).toEqual([])
    act(() => result.current.retry())
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
  })

  it('serves a second mount from the cache and refetches after the TTL', async () => {
    const first = renderHook(() => useCircuitsIndex())
    await waitFor(() => expect(first.result.current.status).toBe('ready'))
    first.unmount()
    const second = renderHook(() => useCircuitsIndex())
    expect(second.result.current.status).toBe('ready')
    expect(circuitsApi.getAll).toHaveBeenCalledTimes(1)
    expect(peekCircuitsIndex()).not.toBeNull()
    second.unmount()
    const now = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + INDEX_TTL_MS + 1000)
    expect(peekCircuitsIndex()).toBeNull()
    const third = renderHook(() => useCircuitsIndex())
    expect(third.result.current.status).toBe('loading')
    await waitFor(() => expect(third.result.current.status).toBe('ready'))
    expect(circuitsApi.getAll).toHaveBeenCalledTimes(2)
    now.mockRestore()
  })

  it('shares one in-flight request between simultaneous mounts and ignores results after unmount', async () => {
    const a = renderHook(() => useCircuitsIndex())
    const b = renderHook(() => useCircuitsIndex())
    a.unmount()
    await waitFor(() => expect(b.result.current.status).toBe('ready'))
    expect(circuitsApi.getAll).toHaveBeenCalledTimes(1)
    resetCircuitsIndexCache()
    circuitsApi.getAll.mockRejectedValueOnce(new Error('x'))
    const c = renderHook(() => useCircuitsIndex())
    c.unmount()
    await new Promise((r) => setTimeout(r, 10))
  })

  it('tolerates a non-array circuits payload', async () => {
    circuitsApi.getAll.mockResolvedValue({ length: 2 })
    racesApi.getBySeason.mockResolvedValue([])
    const { result } = renderHook(() => useCircuitsIndex())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.circuits).toEqual([])
  })
})
