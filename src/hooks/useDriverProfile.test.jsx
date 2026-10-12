import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { StrictMode } from 'react'

vi.mock('../services/api', () => ({
  statsApi: { driverStats: vi.fn(), driverSeasons: vi.fn(), driverCircuits: vi.fn() },
}))
import { statsApi } from '../services/api'
import { useDriverProfile, resetDriverProfileCache } from './useDriverProfile'

const http = (status) => Object.assign(new Error('x'), { status })
const stats = { driver: { driverId: 'norris', givenName: 'Lando', familyName: 'Norris' }, wins: 13 }

beforeEach(() => {
  resetDriverProfileCache()
  vi.clearAllMocks()
  statsApi.driverStats.mockResolvedValue(stats)
  statsApi.driverSeasons.mockResolvedValue([{ season: '2026' }])
  statsApi.driverCircuits.mockResolvedValue([{ _id: 'monza' }])
})

describe('useDriverProfile', () => {
  it('makes no request for an invalid id and reports notFound', () => {
    for (const id of ['', '<script>', '%3Cscript%3E', 'A B', undefined, 'x'.repeat(41)]) {
      const { result } = renderHook(() => useDriverProfile(id))
      expect(result.current.status).toBe('notFound')
    }
    expect(statsApi.driverStats).not.toHaveBeenCalled()
  })

  it('loads the three endpoints in parallel, once, even under StrictMode', async () => {
    const { result } = renderHook(() => useDriverProfile('norris'), { wrapper: StrictMode })
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current).toMatchObject({ stats, seasons: [{ season: '2026' }], circuits: [{ _id: 'monza' }], seasonsStatus: 'ready', circuitsStatus: 'ready' })
    expect(statsApi.driverStats).toHaveBeenCalledTimes(1)
    expect(statsApi.driverSeasons).toHaveBeenCalledTimes(1)
  })

  it('serves a second mount from the session cache', async () => {
    const a = renderHook(() => useDriverProfile('norris'))
    await waitFor(() => expect(a.result.current.status).toBe('ready'))
    const b = renderHook(() => useDriverProfile('norris'))
    expect(b.result.current.status).toBe('ready')
    expect(statsApi.driverStats).toHaveBeenCalledTimes(1)
  })

  it('maps a 404 to notFound and other failures to error', async () => {
    statsApi.driverStats.mockRejectedValueOnce(http(404))
    const a = renderHook(() => useDriverProfile('ghost'))
    await waitFor(() => expect(a.result.current.status).toBe('notFound'))
    statsApi.driverStats.mockRejectedValueOnce(http(503))
    const b = renderHook(() => useDriverProfile('other'))
    await waitFor(() => expect(b.result.current.status).toBe('error'))
  })

  it('treats a body without a driver as notFound', async () => {
    statsApi.driverStats.mockResolvedValueOnce({})
    const { result } = renderHook(() => useDriverProfile('empty'))
    await waitFor(() => expect(result.current.status).toBe('notFound'))
  })

  it('a seasons or circuits failure only degrades that section', async () => {
    statsApi.driverSeasons.mockRejectedValueOnce(http(500))
    statsApi.driverCircuits.mockResolvedValueOnce({ not: 'an array' })
    const { result } = renderHook(() => useDriverProfile('norris'))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.seasonsStatus).toBe('error')
    expect(result.current.circuitsStatus).toBe('error')
    expect(result.current.seasons).toEqual([])
    expect(result.current.stats).toBe(stats)
  })

  it('retry asks again and recovers', async () => {
    statsApi.driverStats.mockRejectedValueOnce(http(503))
    const { result } = renderHook(() => useDriverProfile('norris'))
    await waitFor(() => expect(result.current.status).toBe('error'))
    act(() => result.current.retry())
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(statsApi.driverStats).toHaveBeenCalledTimes(2)
  })

  it('a partial failure is not cached, so the next mount asks again', async () => {
    statsApi.driverSeasons.mockRejectedValueOnce(http(500))
    const a = renderHook(() => useDriverProfile('norris'))
    await waitFor(() => expect(a.result.current.seasonsStatus).toBe('error'))
    const b = renderHook(() => useDriverProfile('norris'))
    await waitFor(() => expect(b.result.current.seasonsStatus).toBe('ready'))
    expect(statsApi.driverStats).toHaveBeenCalledTimes(2)
  })
})
