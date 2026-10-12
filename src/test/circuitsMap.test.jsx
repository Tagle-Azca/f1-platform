import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

let KEY = false
vi.mock('../utils/mapTiles', () => ({ get HAS_CARTO_KEY() { return KEY }, CARTO_DARK_TILES: 'https://tiles.test/{z}/{x}/{y}.png' }))
import CircuitsMap from '../components/circuits/CircuitsMap'
import { makePin, pinLabel, syncPinState, graticuleLines, pinSize, groupByPixels, clusterLabel } from '../components/circuits/circuitsMapParts'
import { normalizeCircuit } from '../components/circuits/circuitIndexModel'

const mk = (id, lat, lng, o = {}) => normalizeCircuit({ circuitId: id, circuitName: id.toUpperCase(), Location: { lat: String(lat), long: String(lng), locality: 'L', country: 'Italy' }, trackCoords: [], raceCount: 2, lastSeason: 2025, ...o })
const LIST = [mk('monza', 45.6, 9.2), mk('interlagos', -23.7, -46.7), { ...mk('sepang', 2.7, 101.7), calendarOnly: true, calendarRound: 17 }, { ...mk('nowhere', 0, 0), lat: null, lng: null }]
const mq = (map) => { window.matchMedia = vi.fn().mockImplementation((q) => ({ matches: Object.entries(map).some(([k, v]) => q.includes(k) && v), addEventListener() {}, removeEventListener() {} })) }
const setup = (props = {}) => {
  const onSelect = vi.fn(), onGrid = vi.fn()
  const utils = render(<MemoryRouter><CircuitsMap circuits={LIST} total={9} selectedId="" onSelect={onSelect} onGrid={onGrid} region="" {...props} /></MemoryRouter>)
  return { onSelect, onGrid, ...utils }
}
beforeEach(() => { KEY = false; mq({}) })
afterEach(() => { delete window.matchMedia })

describe('CircuitsMap', () => {
  it('without a key: plain canvas, graticule, "Basemap unavailable", no tile layer, no Leaflet attribution, no popup', () => {
    const { container } = setup()
    expect(screen.getByText('Basemap unavailable. Pins show circuit locations.')).toBeInTheDocument()
    expect(container.querySelector('.leaflet-tile')).toBeNull()
    expect(container.querySelector('.leaflet-control-attribution')).toBeNull()
    expect(container.querySelector('.leaflet-popup')).toBeNull()
    expect(container.querySelector('.leaflet-container').getAttribute('aria-label')).toMatch(/Grid view lists every circuit/)
    expect(screen.getByRole('button', { name: /View as grid/ })).toBeInTheDocument()
  })

  it('with a key: the attribution caption has live CARTO and OpenStreetMap links', () => {
    KEY = true
    setup()
    const carto = screen.getByRole('link', { name: 'CARTO' })
    expect(carto).toHaveAttribute('href', 'https://carto.com/attributions')
    expect(carto).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toHaveAttribute('href', 'https://www.openstreetmap.org/copyright')
    expect(screen.queryByText(/Basemap unavailable/)).toBeNull()
  })

  it('renders one focusable pin per located circuit, named with type, and selection opens the bottom card below lg', async () => {
    const { container, onSelect, rerender } = setup()
    const pins = container.querySelectorAll('.leaflet-marker-icon')
    expect(pins).toHaveLength(3)
    expect(pins[0]).toHaveAttribute('tabindex', '0')
    expect(pins[0].getAttribute('aria-label')).toBe('MONZA, permanent')
    expect(pins[2].getAttribute('aria-label')).toMatch(/not in race data/)
    fireEvent.click(pins[0])
    expect(onSelect).toHaveBeenCalledWith('monza')
    rerender(<MemoryRouter><CircuitsMap circuits={LIST} total={9} selectedId="monza" onSelect={onSelect} onGrid={() => {}} region="" /></MemoryRouter>)
    const card = await screen.findByRole('region', { name: 'Selected circuit' })
    expect(card).toHaveTextContent('MONZA')
    expect(screen.getByRole('link', { name: 'Open circuit' })).toHaveAttribute('href', '/circuits/monza')
    await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')[0].getAttribute('aria-label')).toMatch(/selected/))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onSelect).toHaveBeenLastCalledWith('')
  })

  it('Escape closes the card', async () => {
    const { onSelect } = setup({ selectedId: 'interlagos' })
    await screen.findByRole('region', { name: 'Selected circuit' })
    fireEvent.keyDown(document.querySelector('[data-circuits-map]'), { key: 'Escape' })
    expect(onSelect).toHaveBeenCalledWith('')
  })

  it('a coarse pointer below lg gets the Explore map toggle (aria-pressed), a fine pointer does not', async () => {
    mq({ coarse: true })
    setup()
    const btn = screen.getByRole('button', { name: 'Explore map' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(btn)
    expect(screen.getByRole('button', { name: 'Lock map' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('at lg the synced rail replaces the card: rows select, mark the current one and link out', () => {
    mq({ 1024: true })
    const { onSelect } = setup({ selectedId: 'monza' })
    const rail = screen.getByRole('region', { name: 'Circuits on the map' })
    expect(rail).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Selected circuit' })).toBeNull()
    expect(within(rail).getByRole('button', { name: /MONZA/ })).toHaveAttribute('aria-current', 'true')
    fireEvent.click(within(rail).getByRole('button', { name: /INTERLAGOS/ }))
    expect(onSelect).toHaveBeenCalledWith('interlagos')
    expect(screen.getByRole('link', { name: 'Open INTERLAGOS' })).toHaveAttribute('href', '/circuits/interlagos')
    expect(screen.getByText('Round 17')).toBeInTheDocument()
    fireEvent.mouseEnter(within(rail).getByRole('button', { name: /INTERLAGOS/ }).closest('li'))
  })

  it('the skip link and View as grid work', () => {
    const { onGrid } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'View as grid' }))
    expect(onGrid).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Skip map'))
  })
})

describe('circuitsMapParts', () => {
  it('builds pins, labels and graticule', () => {
    expect(pinSize()).toBe(32)
    mq({ coarse: true })
    expect(pinSize()).toBe(44)
    expect(makePin(LIST[0]).options.iconSize).toEqual([44, 44])
    expect(pinLabel(LIST[0], true)).toBe('MONZA, permanent, selected')
    expect(pinLabel({ name: '', type: 'street', calendarOnly: true }, false)).toBe('Unknown circuit, street, not in race data')
    expect(graticuleLines().length).toBeGreaterThan(8)
  })
  it('syncPinState ignores a marker without an element and sets state on one with', () => {
    syncPinState(null, LIST[0], { selected: true, hover: false })
    syncPinState({ getElement: () => null }, LIST[0], { selected: true, hover: false })
    const el = document.createElement('div')
    const marker = { getElement: () => el, setZIndexOffset: vi.fn() }
    syncPinState(marker, LIST[0], { selected: true, hover: false })
    expect(el).toHaveClass('cmark-wrap--selected')
    expect(el).toHaveAttribute('aria-current', 'true')
    syncPinState(marker, LIST[0], { selected: false, hover: true })
    expect(el).toHaveClass('cmark-wrap--hover')
    expect(el).not.toHaveAttribute('aria-current')
    expect(marker.setZIndexOffset).toHaveBeenLastCalledWith(500)
  })
})

describe('pin clustering', () => {
  const at = (id, x, y) => ({ id, name: id.toUpperCase(), lat: y, lng: x })
  const project = ([lat, lng]) => ({ x: lng, y: lat }) // identity: test coords are pixels

  it('merges pins closer than the radius and keeps distant ones apart', () => {
    const g = groupByPixels([at('a', 0, 0), at('b', 10, 10), at('c', 100, 0)], project, 32, null)
    expect(g.map((x) => x.members.map((m) => m.id))).toEqual([['a', 'b'], ['c']])
  })
  it('never groups the selected circuit and skips circuits without coordinates', () => {
    const g = groupByPixels([at('a', 0, 0), at('b', 5, 5), { id: 'z', lat: null, lng: null }], project, 32, 'b')
    expect(g.map((x) => x.members.map((m) => m.id))).toEqual([['a'], ['b']])
  })
  it('names every member in the bubble label', () => {
    expect(clusterLabel([at('monza', 0, 0), at('spa', 1, 1)])).toBe('2 circuits close together: MONZA, SPA. Press to zoom in.')
  })
  it('renders one bubble for close circuits, with a count and a label', () => {
    const close = [mk('monza', 45.6, 9.2), mk('spa', 50.4, 5.9)]
    const { container } = render(<MemoryRouter><CircuitsMap circuits={close} total={2} selectedId="" onSelect={() => {}} onGrid={() => {}} region="" /></MemoryRouter>)
    const bubble = container.querySelector('.cmark-wrap--cluster')
    expect(bubble).not.toBeNull()
    expect(bubble).toHaveTextContent('2')
    expect(bubble.getAttribute('aria-label')).toMatch(/2 circuits close together/)
  })
})

