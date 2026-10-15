import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { useTimezone, TZ_EVENT } from './useTimezone'
import { TZ_LS_KEY } from '../utils/timezone'

vi.mock('../contexts/raceContextStore', () => ({ useRace: () => ({ nextRace: null, totalRounds: 24, loaded: true, failed: false }) }))
vi.mock('../contexts/LiveStatusContext', () => ({ useLiveStatus: () => ({ available: false }) }))
import RaceContextBar from '../components/layout/RaceContextBar'

function Probe({ id }) {
  const [tz, setTz] = useTimezone()
  return <button type="button" data-testid={id} onClick={() => setTz('Asia/Tokyo')}>{tz}</button>
}

const store = new Map()
const memoryStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)) }, removeItem: (k) => { store.delete(k) }, clear: () => store.clear() }

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage)
  store.clear()
  localStorage.setItem(TZ_LS_KEY, 'UTC')
})

describe('useTimezone', () => {
  it('shares one value across subscribers and persists it', () => {
    render(<><Probe id="a" /><Probe id="b" /></>)
    expect(screen.getByTestId('a')).toHaveTextContent('UTC')
    fireEvent.click(screen.getByTestId('a'))
    expect(screen.getByTestId('b')).toHaveTextContent('Asia/Tokyo')
    expect(localStorage.getItem(TZ_LS_KEY)).toBe('Asia/Tokyo')
  })
  it('follows a storage event from another tab and ignores unrelated keys', () => {
    render(<Probe id="a" />)
    localStorage.setItem(TZ_LS_KEY, 'Europe/London')
    act(() => { window.dispatchEvent(new StorageEvent('storage', { key: 'other' })) })
    expect(screen.getByTestId('a')).toHaveTextContent('UTC')
    act(() => { window.dispatchEvent(new StorageEvent('storage', { key: TZ_LS_KEY })) })
    expect(screen.getByTestId('a')).toHaveTextContent('Europe/London')
  })
  it('rejects unknown zones', () => {
    function Bad() { const [tz, setTz] = useTimezone(); return <button type="button" onClick={() => setTz('Mars/Base')}>{tz}</button> }
    render(<Bad />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveTextContent('UTC')
    expect(localStorage.getItem(TZ_LS_KEY)).toBe('UTC')
  })
  it('exposes the event name used for the broadcast', () => {
    expect(TZ_EVENT).toBe('pitwall:timezone')
  })
})

describe('top bar sync (DoD-13)', () => {
  it('updates the top bar picker when the zone changes elsewhere, without a remount', () => {
    render(<><RaceContextBar /><Probe id="calendar" /></>)
    expect(screen.getByRole('button', { name: /Time zone:/ })).toHaveTextContent('UTC')
    fireEvent.click(screen.getByTestId('calendar'))
    expect(screen.getByRole('button', { name: /Time zone:/ })).toHaveTextContent('GMT+9')
  })
})
