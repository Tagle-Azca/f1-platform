import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

vi.mock('../services/api', () => ({
  circuitsApi: { getAll: vi.fn(), getById: vi.fn() },
  racesApi: { getBySeason: vi.fn() },
  statsApi: { circuitHistory: vi.fn() },
}))
import { circuitsApi, racesApi, statsApi } from '../services/api'
import { useCircuitDetail } from './useCircuitDetail'
import { useCircuitsIndex, resetCircuitsIndexCache } from './useCircuitsIndex'

const raw = (id, extra = {}) => ({ circuitId: id, circuitName: `Name ${id}`, Location: { lat: '1', long: '2', locality: 'L', country: 'Italy' }, trackCoords: [[0, 0]], raceCount: 4, lastSeason: 2025, ...extra })
const http = (status, message = 'x') => Object.assign(new Error(message), { status })

beforeEach(() => {
  resetCircuitsIndexCache()
  vi.clearAllMocks()
  circuitsApi.getById.mockImplementation(async (id) => raw(id))
  statsApi.circuitHistory.mockResolvedValue({ races: [{ season: '2025', round: '1', Results: [] }], cassandraRaceId: '2025_9912' })
})

describe('useCircuitDetail', () => {
  it('rejects an invalid id without any request', () => {
    for (const id of ['', 'A B', '<x>', '../etc', 'x'.repeat(41), undefined]) {
      const { result } = renderHook(() => useCircuitDetail(id))
      expect(result.current.status).toBe('notFound')
    }
    expect(circuitsApi.getById).not.toHaveBeenCalled()
    expect(statsApi.circuitHistory).not.toHaveBeenCalled()
  })

  it('loads the circuit and history in parallel, one call each', async () => {
    const { result } = renderHook(() => useCircuitDetail('monza'))
    expect(result.current.status).toBe('loading')
    expect(result.current.historyStatus).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.circuit).toMatchObject({ id: 'monza', name: 'Name monza' })
    expect(result.current.historyStatus).toBe('ready')
    expect(result.current.races).toHaveLength(1)
    expect(result.current.cassandraRaceId).toBe('2025_9912')
    expect(circuitsApi.getById).toHaveBeenCalledTimes(1)
    expect(statsApi.circuitHistory).toHaveBeenCalledTimes(1)
  })

  it('drops a malformed cassandraRaceId', async () => {
    statsApi.circuitHistory.mockResolvedValue({ races: {}, cassandraRaceId: '../x' })
    const { result } = renderHook(() => useCircuitDetail('monza'))
    await waitFor(() => expect(result.current.historyStatus).toBe('ready'))
    expect(result.current.cassandraRaceId).toBeNull()
    expect(result.current.races).toEqual([])
  })

  it('maps a 404 and a null body to notFound', async () => {
    circuitsApi.getById.mockRejectedValueOnce(http(404, 'Circuit not found'))
    const a = renderHook(() => useCircuitDetail('zzz'))
    await waitFor(() => expect(a.result.current.status).toBe('notFound'))
    circuitsApi.getById.mockResolvedValueOnce(null)
    const b = renderHook(() => useCircuitDetail('yyy'))
    await waitFor(() => expect(b.result.current.status).toBe('notFound'))
    circuitsApi.getById.mockResolvedValueOnce([1])
    const c = renderHook(() => useCircuitDetail('xxx'))
    await waitFor(() => expect(c.result.current.status).toBe('notFound'))
  })

  it('reports an error for a network failure and retry reloads', async () => {
    circuitsApi.getById.mockRejectedValueOnce(new Error('network'))
    const { result } = renderHook(() => useCircuitDetail('monza'))
    await waitFor(() => expect(result.current.status).toBe('error'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(circuitsApi.getById).toHaveBeenCalledTimes(2)
  })

  it('keeps the circuit when only the history fails', async () => {
    statsApi.circuitHistory.mockRejectedValueOnce(new Error('down'))
    const { result } = renderHook(() => useCircuitDetail('monza'))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.historyStatus).toBe('error')
    expect(result.current.circuit.id).toBe('monza')
    expect(result.current.races).toEqual([])
  })

  it('treats a history 404 as no races and a non-object body as an error', async () => {
    statsApi.circuitHistory.mockRejectedValueOnce(http(404))
    const a = renderHook(() => useCircuitDetail('monza'))
    await waitFor(() => expect(a.result.current.status).toBe('ready'))
    expect(a.result.current.historyStatus).toBe('ready')
    statsApi.circuitHistory.mockResolvedValueOnce(null)
    const b = renderHook(() => useCircuitDetail('spa'))
    await waitFor(() => expect(b.result.current.status).toBe('ready'))
    expect(b.result.current.historyStatus).toBe('error')
  })

  it('seeds the header from the index cache and keeps calendar fields', async () => {
    circuitsApi.getAll.mockResolvedValue([raw('monza')])
    racesApi.getBySeason.mockResolvedValue([{ round: '14', date: '2999-09-01', Circuit: { circuitId: 'monza' } }])
    const idx = renderHook(() => useCircuitsIndex())
    await waitFor(() => expect(idx.result.current.status).toBe('ready'))
    const { result } = renderHook(() => useCircuitDetail('monza'))
    expect(result.current.status).toBe('ready') // first paint: seeded
    expect(result.current.circuit.calendarRound).toBe(14)
    expect(result.current.historyStatus).toBe('loading')
    await waitFor(() => expect(result.current.historyStatus).toBe('ready'))
    expect(result.current.circuit).toMatchObject({ calendarRound: 14, raceCount: 4 })
    expect(circuitsApi.getAll).toHaveBeenCalledTimes(1)
  })

  it('keeps seeded outline when the fetched circuit has none, and fills a missing id', async () => {
    circuitsApi.getAll.mockResolvedValue([raw('monza', { trackCoords: Array.from({ length: 9 }, (_, i) => [i, i]) })])
    racesApi.getBySeason.mockResolvedValue([])
    const idx = renderHook(() => useCircuitsIndex())
    await waitFor(() => expect(idx.result.current.status).toBe('ready'))
    circuitsApi.getById.mockResolvedValue(raw('monza', { trackCoords: null }))
    const { result } = renderHook(() => useCircuitDetail('monza'))
    await waitFor(() => expect(result.current.historyStatus).toBe('ready'))
    expect(result.current.circuit.coords).toHaveLength(9)
    circuitsApi.getById.mockResolvedValue({ circuitName: 'No id' })
    const b = renderHook(() => useCircuitDetail('other'))
    await waitFor(() => expect(b.result.current.status).toBe('ready'))
    expect(b.result.current.circuit.id).toBe('other')
  })

  it('ignores a response that arrives after unmount', async () => {
    const { unmount } = renderHook(() => useCircuitDetail('monza'))
    unmount()
    await new Promise((r) => setTimeout(r, 10))
  })
})
