import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../styles/motion', async (orig) => ({ ...(await orig()), useReducedMotion: vi.fn(() => false) }))
import { useReducedMotion } from '../styles/motion'
import { useTweenedNumber } from './useTweenedNumber'

beforeEach(() => { vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] }); useReducedMotion.mockReturnValue(false) })
afterEach(() => { vi.useRealTimers() })
const run = (ms) => act(() => { vi.advanceTimersByTime(ms) })

describe('useTweenedNumber', () => {
  it('counts from 0 to the target over 900ms on first mount', () => {
    const { result } = renderHook(() => useTweenedNumber(100))
    expect(result.current).toBe(0)
    run(160)
    expect(result.current).toBeGreaterThan(0)
    expect(result.current).toBeLessThan(100)
    run(800)
    expect(result.current).toBe(100)
  })
  it('follows a new target over 320ms, from the shown value (not from 0)', () => {
    const { result, rerender } = renderHook(({ t }) => useTweenedNumber(t), { initialProps: { t: 100 } })
    run(1000)
    expect(result.current).toBe(100)
    rerender({ t: 200 })
    expect(result.current).toBe(100)
    run(80)
    expect(result.current).toBeGreaterThan(100)
    expect(result.current).toBeLessThan(200)
    run(260)
    expect(result.current).toBe(200)
  })
  it('restarts from 0 over 900ms when the dataset key changes', () => {
    const { result, rerender } = renderHook(({ t, k }) => useTweenedNumber(t, { datasetKey: k }), { initialProps: { t: 100, k: 'a' } })
    run(1000)
    rerender({ t: 50, k: 'b' })
    run(32)
    expect(result.current).toBeLessThan(50)
    run(900)
    expect(result.current).toBe(50)
  })
  it('startAt sets where a fresh count begins', () => {
    const { result } = renderHook(() => useTweenedNumber(100, { startAt: 100 }))
    expect(result.current).toBe(100)
    run(1000)
    expect(result.current).toBe(100)
  })
  it('a custom duration is honoured', () => {
    const { result, rerender } = renderHook(({ t }) => useTweenedNumber(t, { duration: 100, enterDuration: 100 }), { initialProps: { t: 10 } })
    run(120)
    expect(result.current).toBe(10)
    rerender({ t: 20 })
    run(120)
    expect(result.current).toBe(20)
  })
  it('snaps under reduced motion, including on target and dataset changes', () => {
    useReducedMotion.mockReturnValue(true)
    const { result, rerender } = renderHook(({ t, k }) => useTweenedNumber(t, { datasetKey: k }), { initialProps: { t: 100, k: 'a' } })
    expect(result.current).toBe(100)
    rerender({ t: 7, k: 'a' })
    expect(result.current).toBe(7)
    rerender({ t: 9, k: 'b' })
    expect(result.current).toBe(9)
  })
  it('non-finite targets render 0 and an unchanged target does not animate', () => {
    const { result, rerender } = renderHook(({ t }) => useTweenedNumber(t), { initialProps: { t: NaN } })
    run(1000)
    expect(result.current).toBe(0)
    rerender({ t: 0 })
    expect(result.current).toBe(0)
  })
  it('cancels the frame on unmount', () => {
    const { unmount } = renderHook(() => useTweenedNumber(100))
    unmount()
    expect(() => run(1000)).not.toThrow()
  })
})
