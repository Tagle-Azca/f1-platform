import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

vi.mock('../services/api', () => ({ dashboardApi: { getTeammateH2H: vi.fn() } }))
import { dashboardApi } from '../services/api'
import { useTeammateH2H, resetTeammateH2HCache } from './useTeammateH2H'

beforeEach(() => {
  resetTeammateH2HCache()
  vi.clearAllMocks()
  dashboardApi.getTeammateH2H.mockResolvedValue({ teammateName: 'Oscar Piastri', racesCompared: 3 })
})

describe('useTeammateH2H', () => {
  it('is idle without a name or season and makes no request', () => {
    expect(renderHook(() => useTeammateH2H('', 2025)).result.current.status).toBe('idle')
    expect(renderHook(() => useTeammateH2H('Lando Norris', null)).result.current.status).toBe('idle')
    expect(renderHook(() => useTeammateH2H(undefined, 2025)).result.current.status).toBe('idle')
    expect(dashboardApi.getTeammateH2H).not.toHaveBeenCalled()
  })
  it('sends the exact full name (accents kept) and the season', async () => {
    const { result } = renderHook(() => useTeammateH2H('Sergio Pérez', 2024))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(dashboardApi.getTeammateH2H).toHaveBeenCalledWith('Sergio Pérez', '2024')
    expect(result.current.data.teammateName).toBe('Oscar Piastri')
  })
  it('caches per name and season', async () => {
    const { result, rerender } = renderHook(({ s }) => useTeammateH2H('Lando Norris', s), { initialProps: { s: 2025 } })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    rerender({ s: 2024 })
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    rerender({ s: 2025 })
    expect(result.current.status).toBe('ready')
    expect(dashboardApi.getTeammateH2H).toHaveBeenCalledTimes(2)
  })
  it('reports an error and retries', async () => {
    dashboardApi.getTeammateH2H.mockRejectedValueOnce(new Error('x'))
    const { result } = renderHook(() => useTeammateH2H('Lando Norris', 2025))
    await waitFor(() => expect(result.current.status).toBe('error'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('ready'))
  })
  it('turns a non-object body into null data', async () => {
    dashboardApi.getTeammateH2H.mockResolvedValueOnce('nope')
    const { result } = renderHook(() => useTeammateH2H('A B', 2023))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.data).toBeNull()
  })
})
