/* global process */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { nextRace, dashboard } from './fixtures'

const liveState = { available: false, sessionName: null }
vi.mock('../contexts/LiveStatusContext', () => ({ useLiveStatus: () => liveState }))
vi.mock('../services/api', () => ({
  circuitsApi: { getById: vi.fn() },
  statsApi: { getSeasonStandings: vi.fn(), getConstructorStandings: vi.fn(), circuitHistory: vi.fn() },
  telemetryApi: { getCarPositions: vi.fn(), getCarData: vi.fn(), getAvailableRaces: vi.fn(), getWinnerStrategy: vi.fn(), getSafetyCar: vi.fn() },
}))

import { circuitsApi, statsApi, telemetryApi } from '../services/api'
import HomeHero from '../components/home/HomeHero'
import TimingTower from '../components/live/TimingTower'
import CircuitRadarCanvas from '../components/home/CircuitRadarCanvas'
import CircuitMapPanel from '../components/nextrace/CircuitMapPanel'
import CircuitSpecStrip from '../components/nextrace/CircuitSpecStrip'
import SectionDisclosure from '../components/nextrace/SectionDisclosure'
import WeekendSchedulePanel from '../components/nextrace/WeekendSchedulePanel'
import LastGPPanel from '../components/nextrace/LastGPPanel'
import PoleRecordPanel from '../components/nextrace/PoleRecordPanel'
import TyreBadge from '../components/ui/TyreBadge'
import TitleFightCard from '../components/home/TitleFightCard'
import GoDeeperPanel from '../components/home/GoDeeperPanel'
import CircuitDNAPanel from '../components/circuits/CircuitDNAPanel'

const ring = Array.from({ length: 16 }, (_, i) => [19 + Math.cos(i) * 0.01, 47 + Math.sin(i) * 0.01])
const at = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)
const mq = (matches) => { window.matchMedia = vi.fn().mockReturnValue({ matches, addEventListener() {}, removeEventListener() {} }) }

beforeEach(() => {
  vi.clearAllMocks()
  delete window.matchMedia
  liveState.available = false
  telemetryApi.getAvailableRaces.mockResolvedValue([]); telemetryApi.getWinnerStrategy.mockResolvedValue(null); telemetryApi.getSafetyCar.mockResolvedValue([])
  statsApi.getSeasonStandings.mockResolvedValue(null)
  statsApi.getConstructorStandings.mockResolvedValue(null)
  const mem = new Map()
  vi.stubGlobal('localStorage', { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) })
})
afterEach(() => vi.useRealTimers())

describe('HomeHero circuit fetch (DISCUSSION A3)', () => {
  it('does not fetch below lg', async () => {
    mq(false)
    at(<HomeHero race={nextRace()} />)
    await act(async () => { await Promise.resolve() })
    expect(circuitsApi.getById).not.toHaveBeenCalled()
  })
  it('fetches once at lg+, renders the trace, ignores a second render', async () => {
    mq(true)
    circuitsApi.getById.mockResolvedValue({ trackCoords: ring })
    const { container, rerender } = at(<HomeHero race={nextRace()} />)
    await waitFor(() => expect(container.querySelector('[data-track-trace]')).toBeTruthy())
    rerender(<MemoryRouter><HomeHero race={nextRace()} /></MemoryRouter>)
    expect(circuitsApi.getById).toHaveBeenCalledTimes(1)
    expect(circuitsApi.getById).toHaveBeenCalledWith('hungaroring')
  })
  it('is silent on failure and on too few points', async () => {
    mq(true)
    circuitsApi.getById.mockRejectedValue(new Error('x'))
    const { container, unmount } = at(<HomeHero race={nextRace()} />)
    await act(async () => { await Promise.resolve() })
    expect(container.querySelector('[data-track-trace]')).toBeNull()
    expect(screen.getByRole('link', { name: 'Weekend schedule' })).toBeInTheDocument()
    unmount()
    circuitsApi.getById.mockResolvedValue({ trackCoords: [[1, 2], [2, 3]] })
    const r2 = at(<HomeHero race={nextRace()} />)
    await act(async () => { await Promise.resolve() })
    expect(r2.container.querySelector('[data-track-trace]')).toBeNull()
  })
  it('live: primary live link plus secondary schedule link; otherwise one primary action', () => {
    liveState.available = true; liveState.sessionName = 'Race'
    const { unmount } = at(<HomeHero race={nextRace()} />)
    expect(screen.getByRole('link', { name: 'Open live timing' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Weekend schedule' })).toBeInTheDocument()
    unmount()
    liveState.available = false
    at(<HomeHero race={nextRace()} />)
    expect(screen.queryByRole('link', { name: 'Open live timing' })).toBeNull()
  })
})

describe('TimingTower pass 2', () => {
  const row = (n, pos, extra = {}) => ({ driverNum: String(n), position: pos, acronym: `D${n}`, fullName: `Driver ${n}`, teamName: 'T', teamColor: '#ff8000', stat: pos === 1 ? 'LEADER' : `+${pos}.0`, statLabel: 'gap', lastLap: '1:21.0', sectors: [], ...extra })
  it('renders lapped cars with +N LAP text and no fill', () => {
    const { container } = render(<TimingTower classification={[row(1, 1), row(2, 2, { stat: '+1 LAP' })]} isRaceType expandable={false} />)
    expect(screen.getByText('+1 LAP')).toBeInTheDocument()
    expect(container.querySelector('[data-gapbar="lapped"]')).toBeTruthy()
  })
  it('stale marks the table so bars and discs dim but text is untouched', () => {
    const { container } = render(<TimingTower classification={[row(1, 1, { compound: 'SOFT' })]} isRaceType expandable={false} stale />)
    expect(container.querySelector('table')).toHaveAttribute('data-stale', 'true')
    expect(container.querySelector('table').className).not.toMatch(/opacity/)
  })
  it('flashes changed cells once per poll, never on first render, and skips big changes', () => {
    const rows = (gap2, pos2 = 2) => [row(1, 1), row(2, pos2, { stat: gap2 })]
    const { container, rerender } = render(<TimingTower classification={rows('+2.0')} isRaceType expandable={false} />)
    expect(container.querySelector('[data-flash]')).toBeNull()
    rerender(<TimingTower classification={rows('+2.5')} isRaceType expandable={false} />)
    expect(container.querySelector('tr[data-num="2"] [data-cell="gap"]')).toHaveAttribute('data-flash', 'neutral')
    const many = Array.from({ length: 12 }, (_, i) => row(i + 1, i + 1, { stat: `+${i + 1}.0` }))
    const { container: c2, rerender: r2 } = render(<TimingTower classification={many} isRaceType expandable={false} />)
    r2(<TimingTower classification={many.map(d => ({ ...d, stat: '+9.0' }))} isRaceType expandable={false} />)
    expect(c2.querySelector('[data-flash]')).toBeNull()
  })
  it('position gain flashes the position cell; flashes clear themselves', () => {
    vi.useFakeTimers()
    const a = [row(1, 1), row(2, 2)]
    const b = [row(2, 1, { stat: 'LEADER' }), row(1, 2, { stat: '+1.0' })]
    const { container, rerender } = render(<TimingTower classification={a} isRaceType expandable={false} />)
    rerender(<TimingTower classification={b} isRaceType expandable={false} />)
    expect(container.querySelector('tr[data-num="2"] [data-cell="pos"]')).toHaveAttribute('data-flash', 'gain')
    expect(container.querySelector('tr[data-num="1"] [data-cell="pos"]')).toHaveAttribute('data-flash', 'loss')
    act(() => { vi.advanceTimersByTime(900) })
    expect(container.querySelector('[data-flash]')).toBeNull()
  })
  it('no flash under reduced motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} })
    const { container, rerender } = render(<TimingTower classification={[row(1, 1), row(2, 2, { stat: '+2.0' })]} isRaceType expandable={false} />)
    rerender(<TimingTower classification={[row(1, 1), row(2, 2, { stat: '+3.0' })]} isRaceType expandable={false} />)
    expect(container.querySelector('[data-flash]')).toBeNull()
  })
  it('timed sessions use the delta and the 1-10s steps', () => {
    const { container } = render(<TimingTower classification={[row(1, 1, { stat: '1:20.0', statLabel: 'fastest' }), row(2, 2, { stat: '1:20.4', statLabel: '+0.400' })]} isRaceType={false} expandable />)
    expect(container.querySelectorAll('[data-gapbar]').length).toBe(1)
    expect(screen.getByText('Best lap')).toBeInTheDocument()
  })
})

describe('Next race pieces', () => {
  it('CircuitMapPanel: placeholder shows the trace and coordinates; Load map mounts the iframe once', () => {
    const { container } = render(<CircuitMapPanel lat="47.5" lng="19.2" coords={ring} />)
    expect(container.querySelector('[data-track-trace]')).toBeTruthy()
    expect(screen.getByText(/47\.5000/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Load map' }))
    expect(container.querySelector('iframe')).toHaveAttribute('loading', 'lazy')
    expect(screen.queryByRole('button', { name: 'Load map' })).toBeNull()
    expect(container.querySelector('iframe').className).not.toMatch(/invert/)
  })
  it('CircuitSpecStrip drops missing specs', () => {
    const { container, rerender } = render(<CircuitSpecStrip specs={{ length: 4.4, turns: 14, laps: 70 }} />)
    expect(screen.getByText('Lap length')).toBeInTheDocument()
    rerender(<CircuitSpecStrip specs={{ length: 4.4, turns: 'x' }} />)
    expect(screen.queryByText('Turns')).toBeNull()
    rerender(<CircuitSpecStrip specs={{}} />)
    expect(container.firstChild).toBeNull()
    rerender(<CircuitSpecStrip specs={null} />)
    expect(container.firstChild).toBeNull()
  })
  it('PoleRecordPanel hides featured rows on request', () => {
    const specs = { tireStress: 9, braking: 8, drs: 2, throttle: 70, turns: 20, topSpeed: 320, gforce: 5, length: 4.4, laps: 70, gearChanges: 44, pitLoss: 21 }
    const { rerender } = render(<PoleRecordPanel specs={specs} />)
    expect(screen.getByText('Turns')).toBeInTheDocument()
    rerender(<PoleRecordPanel specs={specs} hideFeatured />)
    expect(screen.queryByText('Turns')).toBeNull()
    expect(screen.getByText('Average pit loss')).toBeInTheDocument()
  })
  it('SectionDisclosure is a button below lg and a plain heading at lg', () => {
    const { unmount } = render(<SectionDisclosure title="Circuit DNA"><p>body</p></SectionDisclosure>)
    const btn = screen.getByRole('button', { name: 'Circuit DNA' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    unmount()
    mq(true)
    render(<SectionDisclosure title="Circuit DNA"><p>body</p></SectionDisclosure>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Circuit DNA' })).toBeInTheDocument()
  })
  it('WeekendSchedulePanel: forecast line, loading skeleton and live override', () => {
    const r = nextRace()
    const { rerender } = at(<WeekendSchedulePanel schedule={r.schedule} weatherFailed />)
    expect(screen.getByText('Forecast unavailable')).toBeInTheDocument()
    rerender(<MemoryRouter><WeekendSchedulePanel schedule={r.schedule} loading /></MemoryRouter>)
    expect(screen.getByLabelText('Loading schedule')).toBeInTheDocument()
    rerender(<MemoryRouter><WeekendSchedulePanel schedule={r.schedule} liveKey="race" nextSessionKey="fp2" /></MemoryRouter>)
    expect(document.querySelectorAll('li[data-status="live"]').length).toBe(1)
  })
  it('LastGPPanel shows a gap bar for P2 and P3 when the time is parseable', () => {
    const h = { races: [{}], lastRace: { season: '2025', raceName: 'Hungarian Grand Prix', Circuit: {}, Results: [
      { position: '1', grid: '1', status: 'Finished', Driver: { givenName: 'A', familyName: 'B' }, Constructor: { constructorId: 'mclaren', name: 'M' } },
      { position: '2', grid: '2', status: 'Finished', Time: { time: '+2.100' }, Driver: { givenName: 'C', familyName: 'D' }, Constructor: { constructorId: 'ferrari', name: 'F' } },
      { position: '3', grid: '3', status: 'Finished', Time: { time: '+9.9' }, Driver: { givenName: 'E', familyName: 'F' }, Constructor: { constructorId: 'ferrari', name: 'F' } },
    ] } }
    const { container } = at(<LastGPPanel history={h} />)
    expect(container.querySelectorAll('[data-gapbar]').length).toBe(2)
    expect(screen.getByText('+2.100')).toBeInTheDocument()
  })
  it('TyreBadge size prop only affects the 22px variant', () => {
    const { container, rerender } = render(<TyreBadge compound="HARD" />)
    expect(container.firstChild).not.toHaveClass('tyre--lg')
    rerender(<TyreBadge compound="HARD" size={22} />)
    expect(container.firstChild).toHaveClass('tyre--lg')
  })
})

describe('Dashboard sections', () => {
  it('TitleFightCard shows the section sentence and rounds left', () => {
    at(<TitleFightCard data={dashboard()} />)
    expect(screen.getByText('Still open: 300 points in play against a 19-point gap.')).toBeInTheDocument()
    expect(screen.getByText('12 rounds left')).toBeInTheDocument()
    // VS card: both contenders link to their profiles; the gap is stated for screen readers
    expect(screen.getAllByRole('link', { name: /Norris|Verstappen|Leclerc|Piastri/ }).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/leads .* by 19\./)).toBeInTheDocument()
  })
  it('GoDeeperPanel is one list of 4 links', () => {
    at(<GoDeeperPanel />)
    expect(screen.getAllByRole('link')).toHaveLength(4)
    expect(screen.getAllByRole('list')).toHaveLength(1)
  })
})

describe('CircuitDNAPanel theme props', () => {
  beforeEach(() => { statsApi.circuitHistory.mockResolvedValue({ races: [{ Results: [{ position: '1', grid: '1', status: 'Finished', Driver: { driverId: 'a', givenName: 'A', familyName: 'B' }, Constructor: { constructorId: 'x', name: 'X' } }] }] }) })
  it('default keeps the title and frame; bare viz drops the title and keeps metrics keyboard-operable', async () => {
    const { container, unmount } = render(<CircuitDNAPanel circuit={{ circuitId: 'c' }} compact />)
    expect(await screen.findByText('Circuit DNA')).toBeInTheDocument()
    expect(container.querySelector('[role="button"]')).toBeNull()
    unmount()
    const r = render(<CircuitDNAPanel circuit={{ circuitId: 'c' }} compact theme="viz" bare />)
    await waitFor(() => expect(r.container.querySelector('[role="button"]')).toBeTruthy())
    expect(screen.queryByText('Circuit DNA')).toBeNull()
    const metric = r.container.querySelector('[role="button"]')
    fireEvent.focus(metric)
    expect(metric).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(metric, { key: 'Escape' })
    expect(metric).toHaveAttribute('aria-pressed', 'false')
    fireEvent.keyDown(metric, { key: 'Enter' })
    expect(metric).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(metric, { key: ' ' })
    expect(metric).toHaveAttribute('aria-pressed', 'false')
    fireEvent.blur(metric)
  })
})

describe('CircuitRadarCanvas', () => {
  it('draws on demand, never loops, and stops when the tab is hidden', async () => {
    telemetryApi.getCarPositions.mockResolvedValue({ positions: { 1: { x: 1, y: 2 }, 2: { x: 'bad', y: 1 } } })
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { setTimeout(() => cb(0), 0); return 1 })
    const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true } })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
    const { rerender, unmount } = render(<CircuitRadarCanvas drivers={[{ driverNum: '1', teamColor: '#ff8000' }, null]} selectedDriverNum={null} />)
    const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 10)) })
    await settle()
    const calls = raf.mock.calls.length
    expect(calls).toBeGreaterThan(0)
    expect(calls).toBeLessThan(10) // no perpetual loop
    rerender(<CircuitRadarCanvas drivers={[{ driverNum: '1', teamColor: '#ff8000' }]} selectedDriverNum="1" />)
    await settle()
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    const before = raf.mock.calls.length
    rerender(<CircuitRadarCanvas drivers={[]} selectedDriverNum={null} />)
    expect(raf.mock.calls.length).toBe(before)
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(raf.mock.calls.length).toBeGreaterThan(before)
    await settle()
    unmount()
    raf.mockRestore()
    vi.restoreAllMocks()
  })
})

// ── Mechanical pre-flight (DoD-14, DoD-10, DoD-7) on the touched files ──
const SRC = resolve(process.cwd(), 'src')
const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).flatMap((f) => walk(join(p, f))) : [p])
const SCOPE = [
  ...['components/layout', 'components/home', 'components/live', 'components/nextrace', 'components/viz', 'components/dashboard'].flatMap((d) => walk(join(SRC, d))),
  ...['pages/HomePage.jsx', 'pages/LivePage.jsx', 'pages/RaceWeekendPage.jsx', 'components/standings/StandingsSidebar.jsx'].map((f) => join(SRC, f)),
].filter((f) => /\.jsx?$/.test(f))

const STANDINGS = [...walk(join(SRC, 'components/standings')), join(SRC, 'pages/StandingsPage.jsx'), join(SRC, 'components/ui/SegmentedControl.jsx'), join(SRC, 'components/viz/Sparkline.jsx')]
  .filter((f) => /\.jsx?$/.test(f) && !/\.test\./.test(f))

describe('Standings pre-flight greps', () => {
  const src = (f) => readFileSync(f, 'utf8')
  it('no hex literals, eyebrows, condensed face or scroll listeners', () => {
    for (const f of STANDINGS) {
      const t = src(f)
      expect(t, f).not.toMatch(/#[0-9a-fA-F]{6}\b/)
      expect(t, f).not.toMatch(/uppercase[^"'`]*tracking|tracking[^"'`]*uppercase/)
      expect(t, f).not.toMatch(/font-condensed/)
      expect(t, f).not.toMatch(/addEventListener\(\s*['"]scroll['"]/)
    }
  })
  it('inline styles stay within the data-driven budget (at most 6 in total, none in SegmentedControl)', () => {
    const count = (f) => (src(f).match(/\bstyle=\{/g) || []).length
    const total = STANDINGS.filter((f) => !/SegmentedControl|Sparkline/.test(f)).reduce((n, f) => n + count(f), 0)
    expect(total).toBeLessThanOrEqual(6)
    expect(count(join(SRC, 'components/ui/SegmentedControl.jsx'))).toBe(0)
  })
})

describe('pre-flight greps on the 3 pages + shell', () => {
  const src = (f) => readFileSync(f, 'utf8')
  it('no eyebrows, condensed face, banned radii or scroll listeners', () => {
    for (const f of SCOPE) {
      const t = src(f)
      expect(t, f).not.toMatch(/uppercase[^"'`]*tracking/)
      expect(t, f).not.toMatch(/tracking[^"'`]*uppercase/)
      expect(t, f).not.toMatch(/font-condensed/)
      expect(t, f).not.toMatch(/rounded-(xs|sm|lg)\b/)
      expect(t, f).not.toMatch(/addEventListener\(\s*['"]scroll['"]/)
    }
  })
  it('no team, tyre, sector, status or flash hex literals outside vizPalette', () => {
    for (const f of SCOPE) expect(src(f), f).not.toMatch(/#[0-9a-fA-F]{6}\b/)
  })
  it('no inline style attribute is added by new files', () => {
    for (const f of SCOPE.filter((x) => /components\/(viz|layout)\//.test(x) || /nextrace|home\/(HomeHero|TitleFight|LastSession|HomeStandings|GoDeeper|LiveRace)/.test(x))) {
      expect(src(f), f).not.toMatch(/\sstyle=\{/)
    }
  })
})
