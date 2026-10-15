import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

vi.mock('../services/api', () => ({ graphApi: { getDriverConnections: vi.fn() } }))
import { graphApi } from '../services/api'
import { useDriverConnections, resetDriverConnectionsCache } from './useDriverConnections'

beforeEach(() => { resetDriverConnectionsCache(); vi.clearAllMocks() })

describe('useDriverConnections', () => {
  it('is idle for an invalid id and makes no request', () => {
    expect(renderHook(() => useDriverConnections('')).result.current.status).toBe('idle')
    expect(renderHook(() => useDriverConnections('../x')).result.current.status).toBe('idle')
    expect(graphApi.getDriverConnections).not.toHaveBeenCalled()
  })
  it('loads, normalises and caches per id', async () => {
    graphApi.getDriverConnections.mockResolvedValue({ teams: [{ constructorId: 'mclaren' }], stats: { races: 3 } })
    const { result } = renderHook(() => useDriverConnections('norris'))
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.data).toEqual({ teams: [{ constructorId: 'mclaren' }], teammates: [], debut: null, stats: { races: 3 } })
    renderHook(() => useDriverConnections('norris'))
    expect(graphApi.getDriverConnections).toHaveBeenCalledTimes(1)
  })
  it('an unknown driver is ready with stats null', async () => {
    graphApi.getDriverConnections.mockResolvedValue({ teams: [], teammates: [], debut: null, stats: null })
    const { result } = renderHook(() => useDriverConnections('nobody'))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.data.stats).toBeNull()
  })
  it('reports an error and retries', async () => {
    graphApi.getDriverConnections.mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce({ teams: [], teammates: [], debut: null, stats: null })
    const { result } = renderHook(() => useDriverConnections('norris'))
    await waitFor(() => expect(result.current.status).toBe('error'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('ready'))
  })
})
