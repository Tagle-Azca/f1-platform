import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

vi.mock('../services/api', () => ({ constructorsApi: { getStats: vi.fn() } }))
import { constructorsApi } from '../services/api'
import { useConstructorProfile, resetConstructorProfileCache } from './useConstructorProfile'

const http = (status) => Object.assign(new Error('x'), { status })
const body = { constructorId: 'mclaren', name: 'McLaren', stats: {}, seasons: [] }

beforeEach(() => {
  resetConstructorProfileCache()
  vi.clearAllMocks()
  constructorsApi.getStats.mockResolvedValue(body)
})

describe('useConstructorProfile', () => {
  it('makes no request for an invalid id', () => {
    for (const id of ['', '<script>', 'A', null, undefined]) {
      expect(renderHook(() => useConstructorProfile(id)).result.current.status).toBe('notFound')
    }
    expect(constructorsApi.getStats).not.toHaveBeenCalled()
  })
  it('does not request while disabled', () => {
    const { result } = renderHook(() => useConstructorProfile('mclaren', { enabled: false }))
    expect(result.current.status).toBe('loading')
    expect(constructorsApi.getStats).not.toHaveBeenCalled()
  })
  it('loads once and shares the cache between mounts (drawer then page)', async () => {
    const a = renderHook(() => useConstructorProfile('mclaren'))
    await waitFor(() => expect(a.result.current.status).toBe('ready'))
    expect(a.result.current.data).toBe(body)
    const b = renderHook(() => useConstructorProfile('mclaren'))
    expect(b.result.current.status).toBe('ready')
    expect(constructorsApi.getStats).toHaveBeenCalledTimes(1)
  })
  it('maps 404 and null bodies to notFound, other errors to error', async () => {
    constructorsApi.getStats.mockRejectedValueOnce(http(404))
    const a = renderHook(() => useConstructorProfile('ghost'))
    await waitFor(() => expect(a.result.current.status).toBe('notFound'))
    constructorsApi.getStats.mockResolvedValueOnce(null)
    const b = renderHook(() => useConstructorProfile('nulled'))
    await waitFor(() => expect(b.result.current.status).toBe('notFound'))
    constructorsApi.getStats.mockRejectedValueOnce(http(500))
    const c = renderHook(() => useConstructorProfile('broken'))
    await waitFor(() => expect(c.result.current.status).toBe('error'))
  })
  it('retry recovers from an error', async () => {
    constructorsApi.getStats.mockRejectedValueOnce(http(500))
    const { result } = renderHook(() => useConstructorProfile('mclaren'))
    await waitFor(() => expect(result.current.status).toBe('error'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('ready'))
  })
})
