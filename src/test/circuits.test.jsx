/* global process */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

vi.mock('../services/api', () => ({
  circuitsApi: { getAll: vi.fn(), getById: vi.fn() },
  racesApi: { getBySeason: vi.fn() },
  statsApi: { circuitHistory: vi.fn() },
}))
vi.mock('../components/circuits/CircuitsMap', () => ({
  default: ({ circuits, selectedId, onSelect, onGrid }) => (
    <div data-testid="map">
      {circuits.map((c) => <button key={c.id} onClick={() => onSelect(c.id)}>{`pin ${c.id}`}</button>)}
      <span>{`selected:${selectedId}`}</span><button onClick={onGrid}>to grid</button>
    </div>
  ),
}))
import { circuitsApi, racesApi, statsApi } from '../services/api'
import { resetCircuitsIndexCache } from '../hooks/useCircuitsIndex'
import CircuitsPage from '../pages/CircuitsPage'
import CircuitDetailPage from '../pages/CircuitDetailPage'
import CircuitFallbackTile, { Locator } from '../components/circuits/CircuitFallbackTile'
import CircuitLink from '../components/circuits/CircuitLink'
import CircuitDNAPanel from '../components/circuits/CircuitDNAPanel'
import CircuitRecords from '../components/circuits/CircuitRecords'
import { namesLine, recordItems, heroMeta, backTarget } from '../components/circuits/circuitUiModel'
import CircuitResultsTable from '../components/circuits/CircuitResultsTable'
import { resultsByYear } from '../components/circuits/circuitHistoryModel'
import { normalizeCircuit } from '../components/circuits/circuitIndexModel'

const loop = Array.from({ length: 12 }, (_, i) => [9 + i * 0.01, 45 + (i % 3) * 0.01])
const raw = (id, name, o = {}) => ({ circuitId: id, circuitName: name, url: 'https://en.wikipedia.org/wiki/X', Location: { lat: '45.6', long: '9.28', locality: 'Monza', country: 'Italy' }, trackCoords: loop, raceCount: 5, lastSeason: 2025, lastRaceName: 'Italian Grand Prix', ...o })
const LIST = [
  raw('monza', 'Autodromo Nazionale di Monza'),
  raw('monaco', 'Circuit de Monaco', { Location: { lat: '43.7', long: '7.4', locality: 'Monte Carlo', country: 'Monaco' } }),
  raw('ricard', 'Circuit Paul Ricard', { trackCoords: null, Location: { lat: '43.25', long: '5.79', locality: 'Le Castellet', country: 'France' }, raceCount: 1, lastSeason: 2022 }),
]
const CAL = [
  { round: '14', date: '2999-09-06', isUpcoming: true, isCurrentWeekend: false, Circuit: { circuitId: 'monza' } },
  { round: '17', date: '2999-10-25', isUpcoming: false, Circuit: { circuitId: 'sepang', circuitName: 'Sepang International Circuit', Location: { lat: '2.76', long: '101.74', locality: 'Kuala Lumpur', country: 'Malaysia' } } },
]
const res = (pos, grid, id, ctor = 'ferrari') => ({ position: String(pos), grid: String(grid), status: 'Finished', Driver: { driverId: id, givenName: 'G', familyName: id[0].toUpperCase() + id.slice(1) }, Constructor: { constructorId: ctor, name: ctor } })
const HIST = { races: [
  { season: '2025', round: '16', raceName: 'Italian Grand Prix', Results: [res(1, 1, 'norris', 'mclaren'), res(2, 5, 'piastri', 'mclaren'), res(3, 2, 'leclerc')] },
  { season: '2024', round: '16', raceName: 'Italian Grand Prix', Results: [res(1, 4, 'leclerc'), res(2, 1, 'norris', 'mclaren')] },
  { season: '2026', round: '16', raceName: 'Italian Grand Prix', Results: [] },
], cassandraRaceId: '2025_9912' }

const wide = (matches) => { window.matchMedia = vi.fn().mockImplementation((q) => ({ matches: matches && /640|1024/.test(q), addEventListener() {}, removeEventListener() {} })) }
function Where() { const l = useLocation(); return <p data-testid="loc">{l.pathname + l.search}</p> }
const renderIndex = (url = '/circuits') => render(
  <MemoryRouter initialEntries={[url]}><Where /><Routes>
    <Route path="/circuits" element={<CircuitsPage />} /><Route path="/circuits/:circuitId" element={<CircuitDetailPage />} />
  </Routes></MemoryRouter>,
)
const renderDetail = (url, state) => render(
  <MemoryRouter initialEntries={[{ pathname: url, state }]}><Where /><Routes>
    <Route path="/circuits" element={<p>index</p>} /><Route path="/circuits/:circuitId" element={<CircuitDetailPage />} />
  </Routes></MemoryRouter>,
)

beforeEach(() => {
  resetCircuitsIndexCache()
  vi.clearAllMocks()
  wide(true)
  circuitsApi.getAll.mockResolvedValue(LIST)
  racesApi.getBySeason.mockResolvedValue(CAL)
  circuitsApi.getById.mockImplementation(async (id) => (id === 'zzz' ? Promise.reject(Object.assign(new Error('nf'), { status: 404 })) : raw(id, `Name ${id}`)))
  statsApi.circuitHistory.mockResolvedValue(HIST)
})
afterEach(() => { delete window.matchMedia })

describe('Circuits index', () => {
  it('renders cards, calendar groups, the Next chip and the calendar-only entry', async () => {
    renderIndex()
    expect(await screen.findByRole('heading', { level: 2, name: /calendar/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Other circuits' })).toBeInTheDocument()
    const monza = screen.getByRole('link', { name: 'Autodromo Nazionale di Monza' })
    expect(monza).toHaveAttribute('href', '/circuits/monza')
    expect(monza).toHaveAttribute('data-next', 'true')
    expect(within(monza).getByText('Next, round 14')).toBeInTheDocument()
    const sepang = screen.getByRole('link', { name: 'Sepang International Circuit' })
    expect(within(sepang).getByText('Not in the 2022 to 2026 race data.')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-next]')).toHaveLength(1)
    expect(document.querySelector('[data-fallback-tile]')).not.toBeNull() // ricard / sepang
    expect(screen.getAllByText(/4 circuits/).length).toBeGreaterThan(0)
  })

  it('filters by search into the URL (debounced), empty state clears everything but the view', async () => {
    const user = userEvent.setup()
    renderIndex('/circuits?view=grid')
    await screen.findByRole('link', { name: 'Circuit de Monaco' })
    await user.type(screen.getByLabelText('Search'), 'MONTE')
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('/circuits?q=MONTE'))
    expect(screen.queryByRole('link', { name: 'Autodromo Nazionale di Monza' })).toBeNull()
    await user.clear(screen.getByLabelText('Search'))
    await user.type(screen.getByLabelText('Search'), 'zzzz')
    expect(await screen.findByText('No circuits match')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0])
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent(/^\/circuits$/))
    expect(await screen.findByRole('link', { name: 'Circuit de Monaco' })).toBeInTheDocument()
  })

  it('type radiogroup, calendar toggle and sort round-trip through the URL', async () => {
    const user = userEvent.setup()
    renderIndex()
    await screen.findByRole('link', { name: 'Circuit de Monaco' })
    await user.click(screen.getByRole('radio', { name: 'Permanent' }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('type=permanent'))
    await user.click(screen.getByRole('button', { name: /On \d{4} calendar/ }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('cal=1'))
    expect(screen.getByRole('button', { name: /On \d{4} calendar/ })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('radio', { name: 'All' }))
    await waitFor(() => expect(screen.getByTestId('loc')).not.toHaveTextContent('type='))
  })

  it('honours URL state on load: invalid values fall back, c is kept only with the map', async () => {
    renderIndex('/circuits?type=oval&sort=zzz&view=map&c=monza&region=Mars')
    expect(await screen.findByTestId('map')).toBeInTheDocument()
    expect(screen.getByText('selected:monza')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Map' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'circuits-panel')
    await userEvent.click(screen.getByRole('button', { name: 'pin monaco' }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('c=monaco'))
    await userEvent.click(screen.getByRole('button', { name: 'to grid' }))
    await waitFor(() => expect(screen.getByTestId('loc')).not.toHaveTextContent('view=map'))
  })

  it('degrades without a calendar: notice, no calendar toggle, A to Z, no groups', async () => {
    racesApi.getBySeason.mockRejectedValue(new Error('down'))
    renderIndex('/circuits?cal=1&sort=calendar')
    expect(await screen.findByText(/calendar could not be loaded/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /On \d{4} calendar/ })).toBeNull()
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
    expect(document.querySelectorAll('[data-next]')).toHaveLength(0)
  })

  it('shows an error state with a working retry', async () => {
    circuitsApi.getAll.mockRejectedValueOnce(new Error('x'))
    renderIndex()
    expect(await screen.findByText('Circuits could not be loaded')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('link', { name: 'Circuit de Monaco' })).toBeInTheDocument()
  })

  it('shows the empty source message', async () => {
    circuitsApi.getAll.mockResolvedValue([])
    racesApi.getBySeason.mockResolvedValue([])
    renderIndex()
    expect(await screen.findByText('No circuits available yet.')).toBeInTheDocument()
  })

  it('below 640px the filters live in a sheet with a count badge, Esc closes it', async () => {
    wide(false)
    const user = userEvent.setup()
    renderIndex()
    await screen.findByRole('link', { name: 'Circuit de Monaco' })
    const trigger = screen.getByRole('button', { name: 'Filters' })
    await user.click(trigger)
    const dlg = await screen.findByRole('dialog', { name: 'Filters' })
    await user.click(within(dlg).getByRole('radio', { name: 'Hybrid' }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('type=hybrid'))
    expect(await within(dlg).findByText('No circuits match')).toBeInTheDocument()
    await user.click(within(dlg).getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent(/^\/circuits$/))
    await user.click(within(dlg).getByRole('radio', { name: 'Permanent' }))
    expect(await within(dlg).findByRole('button', { name: /Show \d+ circuits/ })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByRole('button', { name: 'Filters, 1 active' })).toBeInTheDocument()
  })

  it('card links pass the current query to the detail page for Back', async () => {
    const user = userEvent.setup()
    renderIndex('/circuits?type=permanent')
    await user.click(await screen.findByRole('link', { name: 'Autodromo Nazionale di Monza' }))
    const back = await screen.findByRole('link', { name: /All circuits/ })
    expect(back).toHaveAttribute('href', '/circuits?type=permanent')
  })

  it('renders hostile payloads without crashing', async () => {
    circuitsApi.getAll.mockResolvedValue([
      raw('monza', 5), raw('spa', { a: 1 }, { Location: null, trackCoords: 'x', raceCount: 'many' }),
      null, 'str', raw('Bad Id', 'x'), raw('proto', '__proto__', { Location: { country: '__proto__', lat: {}, long: [] } }),
    ])
    racesApi.getBySeason.mockResolvedValue({ length: 2 })
    renderIndex()
    expect(await screen.findAllByText('Unknown circuit')).not.toHaveLength(0)
    expect(screen.queryByRole('link', { name: 'x' })).toBeNull()
  })
})

describe('Circuit detail page', () => {
  it('renders hero, spec strip, results, records, DNA, location and a collapsed car demand in order', async () => {
    renderDetail('/circuits/monza', { from: '?type=permanent' })
    expect(await screen.findByRole('heading', { level: 1, name: 'Name monza' })).toBeInTheDocument()
    expect(document.title).toBe('Name monza · Pitwall')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Compare laps at Name monza' })).toHaveAttribute('href', '/telemetry?race=2025_9912')
    expect(screen.getByRole('link', { name: /Wikipedia/ })).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: /All circuits/ })).toHaveAttribute('href', '/circuits?type=permanent')
    expect(screen.getByText('Lap length')).toBeInTheDocument()
    const table = await screen.findByRole('table', { name: /Results at Name monza/ })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows.map((r) => r.getAttribute('data-season'))).toEqual(['2026', '2025', '2024'])
    expect(within(rows[0]).getByText('No result yet')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Won from pole')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Won from P4')).toBeInTheDocument()
    expect(within(table).getByRole('link', { name: 'Italian Grand Prix 2025' })).toHaveAttribute('href', '/races/2025/16')
    expect(screen.getByText('Most wins')).toBeInTheDocument()
    expect(screen.getByText('Within 2022 to 2026 race data.')).toBeInTheDocument()
    const order = ['Results', 'Records', 'Circuit DNA', 'Location', 'Car demand']
    const heads = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    const idx = order.map((t) => heads.findIndex((h) => h.includes(t)))
    expect(idx.every((v) => v >= 0)).toBe(true)
    expect([...idx].sort((x, y) => x - y)).toEqual(idx)
    const disclosure = screen.getByRole('button', { name: 'Car demand' })
    expect(disclosure).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(disclosure)
    expect(disclosure).toHaveAttribute('aria-expanded', 'true')
    expect(statsApi.circuitHistory).toHaveBeenCalledTimes(1)
    expect(document.querySelectorAll('[data-track-trace]:not([data-static])').length).toBeLessThanOrEqual(1)
  })

  it('shows the designed not-found state for unknown and invalid ids; invalid ids make no request', async () => {
    renderDetail('/circuits/zzz')
    expect(await screen.findByRole('heading', { name: 'Circuit not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse circuits' })).toHaveAttribute('href', '/circuits')
    expect(document.title).toBe('Circuit not found · Pitwall')
    vi.clearAllMocks()
    renderDetail('/circuits/%3Cscript%3E')
    await waitFor(() => expect(screen.getAllByRole('heading', { name: 'Circuit not found' })).toHaveLength(2))
    expect(circuitsApi.getById).not.toHaveBeenCalled()
    expect(document.querySelector('p script')).toBeNull() // echoed as escaped text only
  })

  it('error state retries; a history failure keeps the hero and offers a retry', async () => {
    circuitsApi.getById.mockRejectedValueOnce(new Error('boom'))
    renderDetail('/circuits/monza')
    expect(await screen.findByText('Circuit could not be loaded')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    cleanupDom()
    statsApi.circuitHistory.mockRejectedValueOnce(new Error('x'))
    renderDetail('/circuits/spa')
    expect(await screen.findByText('Race history could not be loaded.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.queryByText('Circuit DNA')).toBeNull()
  })

  it('a circuit without races shows the empty message and no DNA or car demand; no cassandra id hides Compare laps', async () => {
    statsApi.circuitHistory.mockResolvedValue({ races: [], cassandraRaceId: null })
    renderDetail('/circuits/sepang')
    expect(await screen.findByText('No Grand Prix here in the 2022 to 2026 data yet.')).toBeInTheDocument()
    expect(screen.queryByText('Circuit DNA')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Car demand' })).toBeNull()
    expect(screen.queryByRole('link', { name: /Compare laps/ })).toBeNull()
  })

  it('survives hostile history', async () => {
    statsApi.circuitHistory.mockResolvedValue({ races: { length: 2 }, cassandraRaceId: 5 })
    circuitsApi.getById.mockResolvedValue({ circuitId: 5, circuitName: { a: 1 }, Location: null, trackCoords: 'x', url: 'javascript:alert(1)' })
    renderDetail('/circuits/monza')
    expect(await screen.findByRole('heading', { level: 1, name: 'Unknown circuit' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Wikipedia/ })).toBeNull()
  })
})

function cleanupDom() { document.body.innerHTML = '' }

describe('pure UI helpers', () => {
  const c = (o = {}) => ({ ...normalizeCircuit(raw('monza', 'M')), ...o })
  it('heroMeta chooses data, calendar round or the not-in-data sentence', () => {
    expect(heroMeta(c(), { first: 2022 }, { season: 2025, raceName: 'GP' })).toMatchObject({ kind: 'data', first: 2022, season: 2025 })
    expect(heroMeta(c(), null, null)).toMatchObject({ kind: 'data', season: 2025 })
    expect(heroMeta(c({ lastSeason: null, calendarRound: 17, calendarDate: '2026-10-25' }), null, null).text).toMatch(/^Round 17 · Sun 25 October$/)
    expect(heroMeta(c({ lastSeason: null, calendarRound: 17, calendarDate: 'bad' }), null, null).text).toBe('Round 17')
    expect(heroMeta(c({ lastSeason: null }), null, null).kind).toBe('none')
  })
  it('backTarget only accepts a plain query string', () => {
    expect(backTarget('?q=a&type=street')).toBe('/circuits?q=a&type=street')
    for (const bad of [undefined, '', '/evil', '?<x>', 5, `?${'a'.repeat(400)}`]) expect(backTarget(bad)).toBe('/circuits')
  })
  it('namesLine and recordItems', () => {
    expect(namesLine([{ name: 'A' }, { name: 'B' }])).toBe('A, B')
    expect(namesLine([{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }])).toBe('A, B and 2 more')
    const items = recordItems({ mostWins: null, bestGain: { gain: 1, name: 'X', season: 2024, grid: 3, position: 2 }, dnfRate: null })
    expect(items.map((i) => i.value)).toEqual(['n/a', '+1', 'n/a'])
    expect(items[1].unit).toBe('place')
    render(<CircuitRecords records={{ mostWins: { count: 1, drivers: [{ name: 'Z' }] }, bestGain: null, dnfRate: { pct: 5, dnfs: 1, starts: 20 } }} />)
    expect(screen.getByText('5%')).toBeInTheDocument()
  })
  it('results table renders pit-lane, unknown grid and missing rows', () => {
    const rows = resultsByYear([
      { season: '2025', round: '1', raceName: 'A', Results: [{ ...res(1, 0, 'a'), position: '1' }] },
      { season: '2024', round: '1', raceName: 'B', Results: [{ position: '1', Driver: { driverId: 'b' } }] },
    ])
    const { container } = render(<MemoryRouter><CircuitResultsTable rows={rows} circuitName="X" /></MemoryRouter>)
    expect(container.textContent).toContain('Won from the pit lane')
    expect(container.textContent).toContain('Grid position unknown')
    expect(render(<CircuitResultsTable rows={[]} circuitName="X" />).container.firstChild).toBeNull()
  })
  it('CircuitLink links valid ids and leaves hostile ones as text', () => {
    render(<MemoryRouter><CircuitLink circuitId="monza">Monza</CircuitLink><CircuitLink circuitId="../x">Evil</CircuitLink></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Monza' })).toHaveAttribute('href', '/circuits/monza')
    expect(screen.queryByRole('link', { name: 'Evil' })).toBeNull()
    expect(screen.getByText('Evil')).toBeInTheDocument()
  })
})

describe('fallback tile', () => {
  const circuit = { lat: 2.76, lng: 101.74, locality: 'Kuala Lumpur', name: 'Sepang', type: 'permanent' }
  it('shows the monogram, coordinates as text and a locator inside the frame', () => {
    const { container } = render(<CircuitFallbackTile circuit={circuit} size="hero" caption />)
    expect(screen.getByText('KL')).toHaveAttribute('class', expect.stringContaining('text-ink-2'))
    expect(screen.getByText('2.76° N · 101.74° E')).toBeInTheDocument()
    expect(screen.getByText('No track outline available')).toBeInTheDocument()
    const dot = container.querySelector('circle[r="3"]')
    expect(Number(dot.getAttribute('cx'))).toBeGreaterThan(0)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
  it('drops the locator and coordinates without a position, and the locator for the mini size', () => {
    const { container } = render(<CircuitFallbackTile circuit={{ ...circuit, lat: null }} />)
    expect(container.querySelector('svg')).toBeNull()
    const mini = render(<CircuitFallbackTile circuit={circuit} size="mini" />)
    expect(mini.container.querySelector('svg')).toBeNull()
    expect(render(<CircuitFallbackTile circuit={circuit} size="nope" />).container.querySelector('svg')).not.toBeNull()
  })
  it('Locator tolerates an unknown type', () => {
    const { container } = render(<Locator lat={0} lng={0} type="x" />)
    expect(container.querySelector('circle[r="3"]')).toHaveAttribute('fill', 'var(--pw-ink-3)')
  })
})

describe('CircuitDNAPanel races prop', () => {
  it('renders from supplied races without fetching', () => {
    render(<CircuitDNAPanel circuit={{ circuitId: 'monza' }} theme="viz" bare compact races={HIST.races} />)
    expect(statsApi.circuitHistory).not.toHaveBeenCalled()
    expect(screen.getByText(/3 races/)).toBeInTheDocument()
  })
})

describe('token discipline', () => {
  const dir = resolve(process.cwd(), 'src/components/circuits')
  const files = readdirSync(dir).filter((f) => /\.(jsx|js)$/.test(f) && !/test|DNAPanel/.test(f))
  const pages = ['CircuitsPage.jsx', 'CircuitDetailPage.jsx'].map((f) => resolve(process.cwd(), 'src/pages', f))
  const sources = [...files.map((f) => [f, readFileSync(resolve(dir, f), 'utf8')]), ...pages.map((f) => [f, readFileSync(f, 'utf8')])]
  it('no hex literals and no style= in the new Circuits files', () => {
    for (const [f, src] of sources) {
      expect(src, f).not.toMatch(/#[0-9a-fA-F]{6}\b/)
      expect(src, f).not.toMatch(/\sstyle=\{/)
    }
  })
  it('type tones are never a text colour', () => {
    for (const [f, src] of sources) expect(src, f).not.toMatch(/text-\[?var\(--viz-type|text-type|color:\s*var\(--viz-type/)
  })
  it('Leaflet is imported only by the lazy map files', () => {
    for (const [f, src] of sources) {
      if (f === 'CircuitsMap.jsx' || f === 'circuitsMapParts.js') continue
      expect(src, f).not.toMatch(/from 'leaflet|from 'react-leaflet|leaflet\.css/)
    }
  })
  it('the old Circuits files are gone', () => {
    const present = readdirSync(dir)
    for (const gone of ['GhostLapsPanel.jsx', 'CircuitDetailPanel.jsx', 'CircuitsFilters.jsx', 'CircuitsMapView.jsx', 'MapController.jsx']) expect(present).not.toContain(gone)
  })
})
