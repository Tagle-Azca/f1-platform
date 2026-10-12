import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react'
import TimingTower from '../components/live/TimingTower'
import TrackStatusBanner from '../components/live/TrackStatusBanner'
import { isStatusActive } from '../components/live/trackStatus'
import { useStatusAnnouncer, diffStatus } from '../hooks/useStatusAnnouncer'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useNow } from '../hooks/useNow'

const drv = (n, pos, extra = {}) => ({
  driverNum: String(n), position: pos, acronym: `D${n}`, fullName: `Driver ${n}`, teamName: 'Team', teamColor: '#ff8000',
  stat: pos === 1 ? 'LEADER' : `+${pos}.0`, statLabel: 'gap', lastLap: '1:21.0',
  sectors: [{ value: '28.1', status: 'green' }, { value: '31.0', status: 'purple' }, { value: '', status: null }], inPit: false, ...extra,
})

describe('TimingTower', () => {
  const rows = [drv(1, 1), drv(2, 2, { inPit: true, compound: 'MEDIUM' }), drv(3, 3, { retired: true }), drv(4, 4, { stat: null, statLabel: '+0.300' })]

  it('desktop: shows all columns and no expand buttons', () => {
    render(<TimingTower classification={rows} isRaceType expandable={false} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('In pit')).toBeInTheDocument()
    expect(screen.getByText('OUT')).toBeInTheDocument()
    expect(screen.getByText('Leader')).toBeInTheDocument()
    expect(screen.getByText('Medium tyre')).toBeInTheDocument()
  })
  it('mobile: rows expand and collapse with aria-expanded, details shown', () => {
    render(<TimingTower classification={rows} isRaceType expandable />)
    const btn = screen.getAllByRole('button')[1]
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Last lap')).toBeInTheDocument()
    expect(screen.getByText('In pit now')).toBeInTheDocument()
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })
  it('qualifying shows best lap header and "Fastest"', () => {
    render(<TimingTower classification={[drv(1, 1, { stat: '1:20.0', statLabel: 'fastest' })]} isRaceType={false} expandable={false} />)
    expect(screen.getByText('Best lap')).toBeInTheDocument()
    expect(screen.getByText('Fastest')).toBeInTheDocument()
  })
  it('survives hostile sector statuses and colors (__proto__, constructor, markup)', () => {
    const hostile = drv(9, 1, {
      teamColor: 'red;background:url(x)',
      sectors: [{ value: '1', status: '__proto__' }, { value: '2', status: 'constructor' }, { value: '<b>x</b>', status: 'toString' }],
    })
    const { container } = render(<TimingTower classification={[hostile]} isRaceType expandable={false} />)
    expect(container.querySelector('b')).toBeNull()
    expect(screen.getByText(/S1 1/)).toBeInTheDocument()
    expect(container.querySelector('tr[style]')).toBeNull()
  })
})

describe('TrackStatusBanner', () => {
  it('shows text for known statuses and nothing for unknown', () => {
    const { container, rerender } = render(<TrackStatusBanner status="Red" />)
    expect(screen.getByText('Red flag')).toBeInTheDocument()
    rerender(<TrackStatusBanner status="__proto__" />)
    expect(container.firstChild).toBeNull()
    expect(isStatusActive('Yellow')).toBe(true)
    expect(isStatusActive('Chequered')).toBe(false)
  })
})

describe('useStatusAnnouncer (5s throttle)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  it('announces a flag change once, throttled', () => {
    const base = { sessionName: 'Race', trackStatus: null, classification: [{ driverNum: '1' }] }
    const { result, rerender } = renderHook(({ d }) => useStatusAnnouncer(d), { initialProps: { d: null } })
    rerender({ d: base })
    act(() => { vi.advanceTimersByTime(6000) })
    expect(result.current).toMatch(/started/)
    rerender({ d: { ...base, trackStatus: 'Red' } })
    expect(result.current).toMatch(/started/)       // throttled: not yet
    act(() => { vi.advanceTimersByTime(5000) })
    expect(result.current).toBe('Red flag')
    rerender({ d: { ...base, trackStatus: 'Red', currentLap: 9 } })   // tick only
    act(() => { vi.advanceTimersByTime(6000) })
    expect(result.current).toBe('Red flag')
  })
})

describe('useMediaQuery / useNow', () => {
  it('tracks matchMedia changes', () => {
    let handler
    const mql = { matches: false, addEventListener: (_, h) => { handler = h }, removeEventListener: vi.fn() }
    window.matchMedia = () => mql
    const { result } = renderHook(() => useMediaQuery('(min-width: 1px)'))
    expect(result.current).toBe(false)
    mql.matches = true
    act(() => handler())
    expect(result.current).toBe(true)
    delete window.matchMedia
  })
  it('useNow ticks', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useNow(1000))
    const a = result.current
    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current).toBeGreaterThanOrEqual(a + 2000)
    vi.useRealTimers()
  })
})

describe('feed shape hardening (B7): non-array classification / drivers / sectors / top3', () => {
  const BAD = [null, undefined, 0, -1, NaN, true, 'abc', {}, { length: 1 }, [null, 5, 'x']]

  it('useStatusAnnouncer and diffStatus never throw on non-array classification', () => {
    for (const bad of BAD) {
      expect(() => diffStatus({ sessionName: 'R', classification: bad }, { sessionName: 'R', classification: bad })).not.toThrow()
      expect(() => diffStatus({ classification: [{ driverNum: '1' }] }, { classification: bad })).not.toThrow()
      const { rerender, unmount } = renderHook(({ d }) => useStatusAnnouncer(d), { initialProps: { d: null } })
      expect(() => rerender({ d: { trackStatus: null, sessionName: 'R', classification: bad } })).not.toThrow()
      expect(() => rerender({ d: { trackStatus: 'Red', sessionName: 'R', classification: bad } })).not.toThrow()
      unmount()
    }
  })
  it('exact repro from the tester: { classification: { length: 1 } }', () => {
    const { rerender } = renderHook(({ x }) => useStatusAnnouncer(x), { initialProps: { x: null } })
    expect(() => rerender({ x: { classification: { length: 1 } } })).not.toThrow()
  })
  it('leader change is still detected when entries are valid', () => {
    const a = { classification: [{ driverNum: '1', acronym: 'A' }] }
    expect(diffStatus(a, { classification: [{ driverNum: '2', acronym: 'B', fullName: 'Bee' }] })).toMatch(/Bee/)
  })
  it('TimingTower tolerates non-array classification and sectors', () => {
    for (const bad of BAD) {
      const { unmount } = render(<TimingTower classification={bad} isRaceType expandable={false} />)
      unmount()
      const { unmount: u2 } = render(<TimingTower classification={[{ driverNum: 1, position: 1, acronym: 'A', sectors: bad }]} isRaceType expandable />)
      u2()
    }
  })
})
