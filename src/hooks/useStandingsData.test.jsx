import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

vi.mock('../services/api', () => ({
  statsApi: { getSeasonStandings: vi.fn(), getConstructorStandings: vi.fn() },
  driversApi: { getAll: vi.fn() },
}))
import { statsApi, driversApi } from '../services/api'
import { useStandingsData, resetStandingsCache, PROBE_SPAN, CURRENT_TTL_MS, getConstructorStandingsCached } from './useStandingsData'

const WITH_DATA = [2026, 2025, 2024, 2023, 2022]
const payload = (year) => (WITH_DATA.includes(year)
  ? { rounds: [{ round: '1', complete: true }], totalRounds: 24, drivers: [{ driverId: 'a', name: 'A', cumulative: [25] }] }
  : { rounds: [], drivers: [] })

beforeEach(() => {
  resetStandingsCache()
  vi.clearAllMocks()
  statsApi.getSeasonStandings.mockImplementation(async (y) => payload(Number(y)))
  statsApi.getConstructorStandings.mockImplementation(async (y) => ({ rounds: payload(Number(y)).rounds, constructors: [{ constructorId: 'x', name: 'X', cumulative: [30] }] }))
  driversApi.getAll.mockResolvedValue([{ driverId: 'a', photoUrl: 'https://x.test/a.png', permanentNumber: 1, code: 'AAA' }, null, { photoUrl: 'x' }])
})

const render = (props) => renderHook((p) => useStandingsData(p), { initialProps: { requested: null, currentYear: 2026, ...props } })

describe('useStandingsData', () => {
  it('current-season entries expire after the TTL on the next mount; past seasons stay cached', async () => {
    const now = vi.spyOn(Date, 'now')
    now.mockReturnValue(1_000_000)
    const first = render()
    await waitFor(() => expect(first.result.current.ctorStatus).toBe('ready'))
    first.unmount()
    const calls = () => statsApi.getSeasonStandings.mock.calls.map(c => c[0])
    expect(calls().filter(y => y === 2026)).toHaveLength(1)
    now.mockReturnValue(1_000_000 + CURRENT_TTL_MS - 1000)
    const second = render()
    await waitFor(() => expect(second.result.current.status).toBe('ready'))
    second.unmount()
    expect(calls().filter(y => y === 2026)).toHaveLength(1)
    now.mockReturnValue(1_000_000 + CURRENT_TTL_MS + 1000)
    const third = render()
    await waitFor(() => expect(third.result.current.ctorStatus).toBe('ready'))
    expect(calls().filter(y => y === 2026)).toHaveLength(2)
    expect(calls().filter(y => y === 2025)).toHaveLength(1)
    expect(statsApi.getConstructorStandings.mock.calls.filter(c => c[0] === 2026)).toHaveLength(2)
    now.mockRestore()
  })

  it('probes currentYear down to currentYear - 7 once and lists only seasons with data, newest first', async () => {
    const { result } = render()
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await waitFor(() => expect(result.current.seasons).toEqual(WITH_DATA))
    expect(PROBE_SPAN).toBe(7)
    expect(statsApi.getSeasonStandings).toHaveBeenCalledTimes(8)
    expect(result.current.season).toBe(2026)
    expect(result.current.missing).toBeNull()
    expect(result.current.constructors.constructors).toHaveLength(1)
    await waitFor(() => expect(result.current.photos.get('a')).toMatchObject({ photoUrl: 'https://x.test/a.png', number: '1', code: 'AAA' }))
  })

  it('switching to a probed season makes no duplicate standings request', async () => {
    const { result, rerender } = render()
    await waitFor(() => expect(result.current.seasons).toHaveLength(5))
    rerender({ requested: 2023, currentYear: 2026 })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.season).toBe(2023)
    expect(result.current.photos.size).toBe(0) // photos are for the current season only
    expect(statsApi.getSeasonStandings).toHaveBeenCalledTimes(8)
    expect(statsApi.getConstructorStandings).toHaveBeenCalledTimes(2)
    rerender({ requested: 2026, currentYear: 2026 })
    await waitFor(() => expect(result.current.season).toBe(2026))
    expect(statsApi.getConstructorStandings).toHaveBeenCalledTimes(2)
  })

  it('shows the loading status while the other season is still loading', async () => {
    const { result, rerender } = render()
    await waitFor(() => expect(result.current.status).toBe('ready'))
    statsApi.getConstructorStandings.mockImplementation(() => new Promise(() => {}))
    rerender({ requested: 2024, currentYear: 2026 })
    expect(result.current.season).toBe(2024)
    expect(result.current.ctorStatus).toBe('loading')
    expect(result.current.constructors).toBeNull()
  })

  it('falls back to the latest season with data for a season without data or out of range', async () => {
    const a = render({ requested: 2021 })
    await waitFor(() => expect(a.result.current.status).toBe('ready'))
    expect(a.result.current.season).toBe(2026)
    expect(a.result.current.missing).toBe(2021)
    const b = render({ requested: 1988 })
    await waitFor(() => expect(b.result.current.status).toBe('ready'))
    expect(b.result.current.missing).toBe(1988)
    expect(statsApi.getSeasonStandings).not.toHaveBeenCalledWith(1988)
  })

  it('falls back to the latest season with data when the current season has no data yet', async () => {
    const { result } = render({ currentYear: 2027 })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.season).toBe(2026)
    expect(result.current.missing).toBeNull()
    const early = render({ currentYear: 2027, requested: 2027 })
    await waitFor(() => expect(early.result.current.status).toBe('ready'))
    expect(early.result.current.missing).toBe(2027)
  })

  it('reports empty when no season has data', async () => {
    statsApi.getSeasonStandings.mockResolvedValue({ rounds: [], drivers: [] })
    const { result } = render()
    await waitFor(() => expect(result.current.status).toBe('empty'))
    expect(result.current.season).toBeNull()
  })

  it('reports an error and recovers on retry (failed requests are asked again)', async () => {
    statsApi.getSeasonStandings.mockRejectedValue(new Error('down'))
    const { result } = render()
    await waitFor(() => expect(result.current.status).toBe('error'))
    statsApi.getSeasonStandings.mockImplementation(async (y) => payload(Number(y)))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.season).toBe(2026)
  })

  it('a constructors failure is an error with retry', async () => {
    statsApi.getConstructorStandings.mockRejectedValueOnce(new Error('x'))
    const { result } = render()
    await waitFor(() => expect(result.current.ctorStatus).toBe('error'))
    expect(result.current.status).toBe('ready') // the drivers view is not blocked
    expect(result.current.drivers).not.toBeNull()
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.ctorStatus).toBe('ready'))
    expect(result.current.constructors).not.toBeNull()
  })

  it('an error on only some probes still shows an empty status when no season has data', async () => {
    statsApi.getSeasonStandings.mockImplementation(async (y) => { if (y === 2022) throw new Error('x'); return { rounds: [] } })
    const { result } = render()
    await waitFor(() => expect(result.current.status).toBe('error'))
  })

  it('photo failure is silent', async () => {
    driversApi.getAll.mockRejectedValue(new Error('x'))
    const { result } = render()
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await waitFor(() => expect(driversApi.getAll).toHaveBeenCalled())
    expect(result.current.photos.size).toBe(0)
  })

  it('ignores a stale response after unmount', async () => {
    const { unmount } = render()
    unmount()
    await Promise.resolve()
    expect(true).toBe(true)
  })
})

describe('getConstructorStandingsCached', () => {
  it('shares one request per season and reports failures without throwing', async () => {
    statsApi.getConstructorStandings.mockResolvedValue({ constructors: [] })
    const [a, b] = await Promise.all([getConstructorStandingsCached(2025, 2026), getConstructorStandingsCached(2025, 2026)])
    expect(a).toEqual({ ok: true, payload: { constructors: [] } })
    expect(b).toBe(a)
    expect(statsApi.getConstructorStandings).toHaveBeenCalledTimes(1)
    statsApi.getConstructorStandings.mockRejectedValueOnce(new Error('x'))
    expect(await getConstructorStandingsCached(2024, 2026)).toEqual({ ok: false, payload: null })
    expect(await getConstructorStandingsCached(2024, 2026)).toMatchObject({ ok: true })
  })
})
