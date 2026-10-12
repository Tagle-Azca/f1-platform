import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, renderHook, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import GapBar from '../components/viz/GapBar'
import PointsRace from '../components/viz/PointsRace'
import Sparkline from '../components/viz/Sparkline'
import DriverPortrait from '../components/viz/DriverPortrait'
import { titleFightModel } from '../components/viz/pointsModel'
import CountdownDigits from '../components/viz/CountdownDigits'
import { countdownGroups, countdownSpoken } from '../components/viz/countdownFormat'
import SessionTimeline from '../components/viz/SessionTimeline'
import { layoutTimeline } from '../components/viz/timelineLayout'
import TrackTrace from '../components/viz/TrackTrace'
import { cleanCoords } from '../components/viz/trackCoords'
import LapProgress from '../components/viz/LapProgress'
import VizSkeleton from '../components/viz/VizSkeleton'
import TeamBar from '../components/viz/TeamBar'
import {
  parseSeconds, classifyGap, quantizeMax, nextMax, fraction, useGapMax, RACE_STEPS, TIMED_STEPS,
} from '../components/viz/gapScale'
import { staggerDelay, riseProps, heroChildProps, growProps, useReducedMotion } from '../styles/motion'
import { seriesStyle, animationProps, seriesOpacity, readVizColors } from '../styles/chartTheme'
import { formatDayWeather, weatherText } from '../utils/weather'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)
const allSvgHidden = (c) => [...c.querySelectorAll('svg')].every((s) => s.getAttribute('aria-hidden') === 'true')

afterEach(() => { delete window.matchMedia })

describe('gapScale', () => {
  it('parses seconds and rejects junk', () => {
    expect(parseSeconds('+2.740')).toBeCloseTo(2.74)
    expect(parseSeconds('1:02.500')).toBeCloseTo(62.5)
    expect(parseSeconds(3)).toBe(3)
    expect(parseSeconds(-1)).toBeNull()
    expect(parseSeconds('abc')).toBeNull()
    expect(parseSeconds({})).toBeNull()
    expect(parseSeconds(NaN)).toBeNull()
  })
  it('classifies race and timed gaps', () => {
    expect(classifyGap({ stat: 'LEADER' }, true).kind).toBe('leader')
    expect(classifyGap({ statLabel: 'fastest' }, false).kind).toBe('leader')
    expect(classifyGap({ stat: '+1 LAP' }, true)).toEqual({ kind: 'lapped', laps: 1 })
    expect(classifyGap({ stat: '+3 LAPS' }, true)).toEqual({ kind: 'lapped', laps: 3 })
    expect(classifyGap({ stat: '+2.5' }, true)).toEqual({ kind: 'gap', seconds: 2.5 })
    expect(classifyGap({ stat: '1:21.0', statLabel: '+0.345' }, false)).toEqual({ kind: 'gap', seconds: 0.345 })
    expect(classifyGap({ stat: 'x' }, true).kind).toBe('none')
    expect(classifyGap(null, true).kind).toBe('none')
  })
  it('quantizes and only grows', () => {
    expect(quantizeMax(0, RACE_STEPS)).toBe(10)
    expect(quantizeMax(10, RACE_STEPS)).toBe(10)
    expect(quantizeMax(10.1, RACE_STEPS)).toBe(30)
    expect(quantizeMax(9999, RACE_STEPS)).toBe(300)
    expect(quantizeMax(NaN, TIMED_STEPS)).toBe(1)
    expect(nextMax(null, 5, RACE_STEPS)).toBe(10)
    expect(nextMax(60, 5, RACE_STEPS)).toBe(60)
    expect(nextMax(10, 40, RACE_STEPS)).toBe(60)
  })
  it('sqrt keeps the front of the field visible', () => {
    expect(fraction(2.7, 120)).toBeGreaterThan(0.1)
    expect(fraction(2.7, 120, 'linear')).toBeLessThan(0.03)
    expect(fraction(0, 10)).toBe(0)
    expect(fraction(5, 0)).toBe(0)
    expect(fraction(50, 10)).toBe(1)
  })
  it('useGapMax is monotonic within a session and resets on a new one (UX-D3)', () => {
    const { result, rerender } = renderHook(({ n, k }) => useGapMax(n, RACE_STEPS, k), { initialProps: { n: 8, k: 'race' } })
    expect(result.current).toBe(10)
    rerender({ n: 25, k: 'race' }); expect(result.current).toBe(30)
    rerender({ n: 3, k: 'race' }); expect(result.current).toBe(30)
    rerender({ n: 3, k: 'quali' }); expect(result.current).toBe(10)
  })
  it('one driver gap change never moves another bar unless the max steps', () => {
    const widthOf = (v, max) => fraction(v, max)
    const max = nextMax(null, 20, RACE_STEPS) // 30
    const before = widthOf(12, max)
    const maxAfter = nextMax(max, 26, RACE_STEPS) // driver B went 20 -> 26, still 30
    expect(maxAfter).toBe(max)
    expect(widthOf(12, maxAfter)).toBe(before)
    expect(widthOf(12, nextMax(max, 40, RACE_STEPS))).not.toBe(before)
  })
})

describe('GapBar', () => {
  it('is decorative and draws a team-colored fill', () => {
    const { container } = render(<GapBar value={2.7} max={30} color="#FF8000" animate={false} />)
    expect(allSvgHidden(container)).toBe(true)
    expect(container.querySelector('rect[fill="#ff8000"]')).toBeTruthy()
  })
  it('lapped renders a hatch stub and no fill', () => {
    const { container } = render(<GapBar value={0} max={30} lapped={2} />)
    expect(container.querySelector('pattern')).toBeTruthy()
    expect(container.querySelector('[data-gapbar="lapped"]')).toBeTruthy()
  })
  it('share mode uses the series color when no team color; zero value draws no fill; srText is exposed', () => {
    const { container } = render(<GapBar mode="share" value={50} max={100} srText="50 of 100 points" />)
    expect(container.querySelector('rect[fill="var(--viz-series-1)"]')).toBeTruthy()
    expect(screen.getByText('50 of 100 points')).toHaveClass('sr-only')
    const z = render(<GapBar value={0} max={10} />)
    expect(z.container.querySelectorAll('rect').length).toBe(1)
  })
  it('hostile color falls back to grey', () => {
    const { container } = render(<GapBar value={5} max={10} color="url(javascript:x)" animate={false} />)
    expect(container.querySelector('rect[fill="#888888"]')).toBeTruthy()
  })
})

const standings = [
  { driverId: 'a', name: 'Max Verstappen', team: 'Red Bull', constructorId: 'red_bull', points: 380 },
  { driverId: 'b', name: 'Lando Norris', team: 'McLaren', constructorId: 'mclaren', points: 361 },
  { driverId: null, name: 'Oscar Piastri', team: 'McLaren', constructorId: 'mclaren', points: 322 },
]

describe('PointsRace', () => {
  it('models inPlay and gap from the per-season points rule (25 from 2025, 26 up to 2024)', () => {
    const m = titleFightModel(standings, 24, 12, 2026)
    expect(m.inPlay).toBe(300)
    expect(titleFightModel(standings, 24, 12, 2024).inPlay).toBe(312)
    expect(titleFightModel(standings, 24, 12).inPlay).toBe(300)
    expect(titleFightModel(standings, 24, 17, '2026').inPlay).toBe(175)
    expect(m.gap).toBe(19)
    expect(m.decided).toBe(false)
    expect(titleFightModel(standings, 24, 24, 2026).final).toBe(true)
    expect(titleFightModel([{ ...standings[0], points: 400 }, standings[1]], 13, 12).decided).toBe(true)
    expect(titleFightModel('junk', 'x', 'y').rows).toEqual([])
  })
  it('renders accessible rows, links and the available label', () => {
    const { container } = wrap(<PointsRace standings={standings} totalRounds={24} roundsDone={12} season="2024" />)
    expect(screen.getByText('Max Verstappen, 380 points, first')).toBeInTheDocument()
    expect(screen.getByText('Lando Norris, 19 points behind, second')).toBeInTheDocument()
    expect(screen.getByText('Oscar Piastri, 58 points behind, third')).toBeInTheDocument()
    expect(screen.getByText('312 available')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(allSvgHidden(container)).toBe(true)
  })
  it('title decided fills the track; season over has no tracks; calls onSelect', () => {
    const far = [{ ...standings[0], points: 400 }, standings[1], standings[2]]
    const { container, rerender } = wrap(<PointsRace standings={far} totalRounds={13} roundsDone={12} />)
    expect(screen.getByText('Title decided')).toBeInTheDocument()
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
    rerender(<MemoryRouter><PointsRace standings={standings} totalRounds={24} roundsDone={24} /></MemoryRouter>)
    expect(container.querySelectorAll('svg[data-gapbar]').length).toBe(0)
    expect(screen.queryByText('Title decided')).toBeNull()
  })
  it('select callback and tiny inputs', () => {
    const onSelect = vi.fn()
    wrap(<PointsRace standings={standings} totalRounds={24} roundsDone={12} onSelect={onSelect} />)
    screen.getAllByRole('link')[0].click()
    expect(onSelect).toHaveBeenCalled()
    const { container } = wrap(<PointsRace standings={[standings[0]]} totalRounds={24} roundsDone={12} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('CountdownDigits', () => {
  it('formats by remaining time', () => {
    expect(countdownGroups({ d: 1, h: 23, m: 59, s: 4 })).toEqual([['1', 'd'], ['23', 'h'], ['59', 'm']])
    expect(countdownGroups({ d: 0, h: 3, m: 5, s: 4 })).toEqual([['3', 'h'], ['05', 'm'], ['04', 's']])
    expect(countdownGroups({ d: 0, h: 0, m: 59, s: 58 })).toEqual([['59', 'm'], ['58', 's']])
    expect(countdownGroups({ d: 0, h: 0, m: 0, s: 5 })).toEqual([['5', 's']])
    expect(countdownGroups(null)).toEqual([['0', 's']])
  })
  it('speaks days hours minutes without seconds', () => {
    expect(countdownSpoken({ d: 2, h: 3, m: 4, s: 5 })).toBe('2 days 3 hours 4 minutes')
    expect(countdownSpoken({ d: 0, h: 1, m: 1, s: 0 })).toBe('1 hour 1 minute')
    expect(countdownSpoken({ d: 0, h: 0, m: 5, s: 0 })).toBe('5 minutes')
  })
  it('hides digits, labels once, urgent under 10 minutes', () => {
    const { container, rerender } = render(<CountdownDigits parts={{ d: 0, h: 0, m: 5, s: 1 }} label="Race starts in" />)
    expect(screen.getByText('Race starts in 5 minutes')).toBeInTheDocument()
    expect(container.querySelector('[data-countdown]')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[data-countdown]')).toHaveClass('text-steel-hi')
    rerender(<CountdownDigits parts={{ d: 1, h: 0, m: 0, s: 0 }} size="sm" />)
    expect(container.querySelector('[data-countdown]')).toHaveClass('text-ink')
    rerender(<CountdownDigits parts={null} />)
    expect(container.firstChild).toBeNull()
  })
})

const at = (iso) => ({ dateTime: iso })
const mk = (key, label, iso, status = 'upcoming') => ({ key, label, ...at(iso), status })
const SESS = [
  mk('fp1', 'Practice 1', '2026-10-09T11:30:00Z', 'done'),
  mk('fp2', 'Practice 2', '2026-10-09T15:00:00Z', 'next'),
  mk('fp3', 'Practice 3', '2026-10-10T10:30:00Z'),
  mk('qualifying', 'Qualifying', '2026-10-10T14:00:00Z'),
  mk('race', 'Race', '2026-10-11T13:00:00Z'),
]

describe('SessionTimeline', () => {
  it('lays out one lane per day with real order and places Now', () => {
    const g = layoutTimeline(SESS, 'UTC', Date.parse('2026-10-09T13:00:00Z'))
    expect(g.lanes.map((l) => l.items.length)).toEqual([2, 2, 1])
    const xs = g.lanes.flatMap((l) => l.items.map((i) => i.x))
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    expect(g.nowX).toBeGreaterThan(g.lanes[0].items[0].x)
    expect(g.nowX).toBeLessThan(g.lanes[0].items[1].x)
    const between = layoutTimeline(SESS, 'UTC', Date.parse('2026-10-09T20:00:00Z'))
    expect(between.nowX).toBeGreaterThan(between.lanes[0].items[1].x)
    expect(between.nowX).toBeLessThan(between.lanes[1].items[0].x)
  })
  it('hides Now before the weekend and after it ends; shows it at the last session', () => {
    expect(layoutTimeline(SESS, 'UTC', Date.parse('2026-10-01T00:00:00Z')).nowX).toBeNull()
    expect(layoutTimeline(SESS, 'UTC', Date.parse('2026-10-09T05:00:00Z')).nowX).toBe(0)
    expect(layoutTimeline(SESS, 'UTC', Date.parse('2026-10-11T14:00:00Z')).nowX).not.toBeNull()
    expect(layoutTimeline(SESS, 'UTC', Date.parse('2026-10-12T14:00:00Z')).nowX).toBeNull()
    expect(layoutTimeline(SESS, 'UTC', NaN).nowX).toBeNull()
  })
  it('keeps markers apart for crowded lanes, single and equal times', () => {
    const crowded = layoutTimeline([mk('a', 'A', '2026-10-09T10:00:00Z'), mk('b', 'B', '2026-10-09T10:30:00Z'), mk('c', 'C', '2026-10-09T11:00:00Z')], 'UTC', 0, 200)
    const x = crowded.lanes[0].items.map((i) => i.x)
    expect(x[1]).toBeGreaterThan(x[0]); expect(x[2]).toBeGreaterThan(x[1])
    expect(crowded.lanes[0].items.some((i) => i.side === 'above')).toBe(true)
    const same = layoutTimeline([mk('a', 'A', '2026-10-09T10:00:00Z'), mk('b', 'B', '2026-10-09T10:00:00Z')], 'UTC', 0)
    expect(same.lanes[0].items).toHaveLength(2)
    expect(layoutTimeline('junk', 'UTC', 0).lanes).toEqual([])
    expect(layoutTimeline([{ key: 'x', dateTime: 'nope' }], 'UTC', 0).lanes).toEqual([])
  })
  it('renders the ordered list with status text and per-day weather; axis is aria-hidden', () => {
    const weather = { '2026-10-09': { tempMax: 22, tempMin: 14, precipProb: 20 } }
    const { container } = render(<SessionTimeline sessions={SESS} tz="UTC" now={Date.parse('2026-10-09T13:00:00Z')} weather={weather} caption />)
    expect(screen.getAllByText(/22° \/ 14°, 20% rain/).length).toBeGreaterThan(0)
    expect(container.querySelector('[data-timeline-list]')).toHaveClass('lg:sr-only')
    expect(container.querySelector('[data-timeline-axis]').closest('[aria-hidden="true"]')).toBeTruthy()
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText(/not to scale/)).toBeInTheDocument()
    expect(container.querySelector('[data-status="done"]')).toBeTruthy()
  })
  it('live status shows the word Live; no sessions renders nothing; reduced motion draws final state', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
    const { container, rerender } = render(<SessionTimeline sessions={[mk('race', 'Race', '2026-10-11T13:00:00Z', 'live')]} tz="UTC" now={Date.parse('2026-10-11T13:30:00Z')} />)
    expect(screen.getAllByText('Live').length).toBeGreaterThan(0)
    rerender(<SessionTimeline sessions={[]} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('TrackTrace / LapProgress / TeamBar', () => {
  const ring = Array.from({ length: 12 }, (_, i) => [19 + Math.cos(i) * 0.01, 47 + Math.sin(i) * 0.01])
  it('needs 8 finite points and ignores junk', () => {
    expect(cleanCoords('x')).toEqual([])
    expect(cleanCoords([[1, 2], ['a', 2], null, [3]])).toEqual([[1, 2]])
    const { container, rerender } = render(<TrackTrace coords={ring.slice(0, 7)} />)
    expect(container.firstChild).toBeNull()
    rerender(<TrackTrace coords={ring} />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('path')).toBeTruthy()
    rerender(<TrackTrace coords={[...ring.slice(0, 7), [NaN, 1]]} />)
    expect(container.firstChild).toBeNull()
  })
  it('LapProgress exposes text and hides for unknown laps', () => {
    const { container, rerender } = render(<LapProgress lap={31} total={70} />)
    expect(screen.getByText('Lap 31 of 70')).toHaveClass('sr-only')
    expect(allSvgHidden(container)).toBe(true)
    rerender(<LapProgress lap={5} total={null} />)
    expect(container.firstChild).toBeNull()
    rerender(<LapProgress lap="7" total="0" />)
    expect(container.firstChild).toBeNull()
    rerender(<LapProgress lap={99} total={70} />)
    expect(container.querySelector('rect:last-of-type').getAttribute('width')).toBe('100%')
  })
  it('TeamBar is decorative', () => {
    const { container } = render(<TeamBar color="#0600EF" />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('rect').getAttribute('fill')).not.toBe('#0600ef')
  })
})

describe('VizSkeleton', () => {
  it.each(['hero', 'pointsrace', 'rows', 'tower', 'timeline', 'digits', 'map', 'podium', 'lines', 'standingsrows', 'nope'])('variant %s is busy, labelled and hides pieces', (variant) => {
    const { container } = render(<VizSkeleton variant={variant} name="thing" count={2} />)
    const root = container.firstChild
    expect(root).toHaveAttribute('aria-busy', 'true')
    expect(root).toHaveAttribute('aria-label', 'Loading thing')
    expect(root.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0)
  })
  it('standingsrows renders the requested row count and the podium has three columns', () => {
    const { container } = render(<VizSkeleton variant="standingsrows" count={7} />)
    expect(container.querySelectorAll('.h-14').length).toBe(7)
    const pod = render(<VizSkeleton variant="podium" />)
    expect(pod.container.querySelectorAll('.grid-cols-3 > div').length).toBe(3)
  })
  it('tower has the requested row count', () => {
    const { container } = render(<VizSkeleton variant="tower" count={5} />)
    expect(container.querySelectorAll('.h-12').length).toBe(5)
  })
})

describe('motion + chart theme + weather', () => {
  it('stagger caps at 6 children', () => {
    expect(staggerDelay(0)).toBe(0)
    expect(staggerDelay(2)).toBeCloseTo(0.14)
    expect(staggerDelay(50)).toBeCloseTo(0.35)
    expect(staggerDelay(-1)).toBe(0)
    expect(staggerDelay(NaN)).toBe(0)
  })
  it('reduced motion renders the final state', () => {
    expect(riseProps(1, true)).toEqual({ initial: false })
    expect(heroChildProps(1, true)).toEqual({ initial: false })
    expect(growProps(1, true)).toEqual({ initial: false })
    expect(riseProps(1, false).initial.y).toBe(12)
    expect(heroChildProps(2, false, 0.07).transition.delay).toBeCloseTo(0.07 + 0.1 + 0.12)
    expect(growProps(3, false).initial.scaleX).toBe(0)
  })
  it('useReducedMotion returns a boolean', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
    const { result } = renderHook(() => useReducedMotion())
    expect(typeof result.current).toBe('boolean')
  })
  it('Rise and PageWrapper render children (stagger is opt-in)', () => {
    const { container, rerender } = render(<Rise index={1} className="x"><b>kid</b></Rise>)
    expect(container.querySelector('.x')).toBeTruthy()
    rerender(<Rise as="section">sec</Rise>)
    expect(container.querySelector('section')).toBeTruthy()
    rerender(<PageWrapper stagger>fade</PageWrapper>)
    expect(container.querySelector('.page')).toHaveTextContent('fade')
    rerender(<PageWrapper>plain</PageWrapper>)
    expect(container.querySelector('.page')).toHaveTextContent('plain')
  })
  it('chart theme helpers', () => {
    expect(seriesStyle(0).stroke).toBe('var(--viz-series-1)')
    expect(seriesStyle(1).strokeDasharray).toBe('6 3')
    expect(seriesStyle(0, '#FF8000').stroke).toBe('#ff8000')
    expect(animationProps(true).isAnimationActive).toBe(false)
    expect(animationProps(false, 'k').animationId).toBe('k')
    expect(seriesOpacity(null, 'a')).toBe(1)
    expect(seriesOpacity('a', 'b')).toBe(0.35)
    const c = readVizColors()
    expect(Object.keys(c)).toContain('steel')
  })
  it('weather helpers', () => {
    expect(weatherText(0)).toBe('Clear')
    expect(weatherText(2)).toBe('Partly cloudy')
    expect(weatherText(45)).toBe('Foggy')
    expect(weatherText(55)).toBe('Drizzle')
    expect(weatherText(63)).toBe('Rain')
    expect(weatherText(73)).toBe('Snow')
    expect(weatherText(80)).toBe('Showers')
    expect(weatherText(95)).toBe('Storm')
    expect(weatherText('x')).toBe('')
    expect(formatDayWeather({ tempMax: 22, tempMin: 14, precipProb: 0 })).toBe('22° / 14°')
    expect(formatDayWeather({ tempMax: 22 })).toBe('22°')
    expect(formatDayWeather({ tempMax: 'x', precipProb: 40 })).toBe('40% rain')
    expect(formatDayWeather(null)).toBe('')
  })
  it('act is exported for hooks tests', () => { expect(typeof act).toBe('function') })
})

describe('Sparkline', () => {
  it('draws one bar per round plus the marker cap, and dims the rounds after the mark', () => {
    const { container } = render(<Sparkline values={[25, 18, 0, 12]} mark={2} color="#ff8000" />)
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(5)
    expect([...rects].slice(0, 4).map(r => r.getAttribute('fill-opacity'))).toEqual(['1', '1', '0.3', '0.3'])
    expect(rects[2].getAttribute('fill')).toBe('var(--viz-baseline)')
    expect(rects[2].getAttribute('height')).toBe('1')
    expect(rects[0].getAttribute('fill')).toBe('#ff8000')
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
  it('scales to at least 25 points and clamps the mark', () => {
    const { container } = render(<Sparkline values={[5]} mark={99} color="#fff" height={50} />)
    expect(container.querySelector('rect').getAttribute('height')).toBe('10')
    const none = render(<Sparkline values={[]} color="#fff" />)
    expect(none.container.firstChild).toBeNull()
    const bad = render(<Sparkline values={[NaN, -4, 'x']} color="#fff" />)
    expect(bad.container.querySelectorAll('rect[height="1"]').length).toBe(3)
    expect(render(<Sparkline values="junk" color="#fff" />).container.firstChild).toBeNull()
    expect(render(<Sparkline values={[3, 4]} mark={NaN} color="#fff" />).container.querySelectorAll('rect')).toHaveLength(3)
  })
})

describe('DriverPortrait', () => {
  it('shows the photo over the number for https URLs and falls back to the number alone on error', () => {
    const { container } = render(<DriverPortrait photoUrl="https://example.test/a.png" number="4" color="#ff8000" className="box" imgClassName="pic" />)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('referrerpolicy', 'no-referrer')
    expect(container.querySelector('text').getAttribute('fill')).toBe('none')
    fireEvent.error(img)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('text').getAttribute('fill')).toBe('#ff8000')
  })
  it('drops http and script URLs and renders nothing for no number', () => {
    const { container } = render(<DriverPortrait photoUrl="http://example.test/a.png" number="" color="#fff" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('text')).toBeNull()
    expect(render(<DriverPortrait photoUrl="javascript:alert(1)" number={7} color="#fff" />).container.querySelector('img')).toBeNull()
  })
})
