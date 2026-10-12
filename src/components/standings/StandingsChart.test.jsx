import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { cloneElement } from 'react'

vi.mock('recharts', async (orig) => {
  const mod = await orig()
  return { ...mod, ResponsiveContainer: ({ children, height }) => <div style={{ width: 800, height }}>{cloneElement(children, { width: 800, height })}</div> }
})
vi.mock('../../styles/motion', async (orig) => ({ ...(await orig()), useReducedMotion: () => true }))
import StandingsChart from './StandingsChart'
import { normalizeSeries } from './standingsModel'

const rounds = Array.from({ length: 4 }, (_, i) => ({ round: String(i + 1), raceName: `GP ${i + 1}`, complete: true }))
const mkDrivers = (count) => Array.from({ length: count }, (_, i) => ({
  driverId: `d${i}`, name: `Driver ${String.fromCharCode(65 + i)}`, team: `T${i}`, teamId: i % 2 ? 'ferrari' : 'mclaren',
  cumulative: [30 - i, 60 - i * 2, 90 - i * 3, 120 - i * 4],
}))
const series = (count = 12) => normalizeSeries({ rounds, drivers: mkDrivers(count) }, 'drivers')

const props = (over = {}) => ({
  series: series(), rounds, round: 3, view: 'drivers', datasetKey: '2026-drivers', mode: 'points', onModeChange: vi.fn(), hoverId: null,
  onHover: vi.fn(), selectedId: null, sprintOnly: new Set(), ...over,
})

describe('StandingsChart', () => {
  it('renders the heading, caption, toggle, legend and an sr summary', () => {
    render(<StandingsChart {...props()} />)
    expect(screen.getByRole('heading', { name: 'Season progress' })).toBeInTheDocument()
    expect(screen.getByText(/After round 3, GP 3\. The top 5 are highlighted/)).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Chart type' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Points' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Second teammate')).toBeInTheDocument()
    expect(screen.getByText('Replay position')).toBeInTheDocument()
    expect(screen.getByText(/Points chart\. After round 3, GP 3\. Leader Driver A, 90 points\. Second Driver B, 87 points\./)).toBeInTheDocument()
  })
  it('draws every line once, the top 5 plus hovered and selected at full opacity, the rest muted', () => {
    const { container, rerender } = render(<StandingsChart {...props()} />)
    const lines = [...container.querySelectorAll('.st-line .recharts-line-curve')]
    expect(lines).toHaveLength(12)
    const opacities = lines.map(l => l.getAttribute('stroke-opacity'))
    expect(opacities.filter(o => o === '1')).toHaveLength(5)
    expect(opacities.filter(o => o === '0.25')).toHaveLength(7)
    rerender(<StandingsChart {...props({ hoverId: 'd9', selectedId: 'd10' })} />)
    expect([...container.querySelectorAll('.st-line .recharts-line-curve')].filter(l => l.getAttribute('stroke-opacity') === '1')).toHaveLength(7)
  })
  it('dashes the second teammate', () => {
    const { container } = render(<StandingsChart {...props()} />)
    expect(container.querySelectorAll('.st-line .recharts-line-curve[stroke-dasharray="6 3"]').length).toBeGreaterThan(0)
  })
  it('replay marker and the future overlay follow the round without re-slicing the data', () => {
    const { container, rerender } = render(<StandingsChart {...props({ round: 2 })} />)
    expect(container.querySelector('.recharts-reference-area')).toBeTruthy()
    const pathBefore = container.querySelector('.st-line .recharts-line-curve').getAttribute('d')
    rerender(<StandingsChart {...props({ round: 3 })} />)
    expect(container.querySelector('.st-line .recharts-line-curve').getAttribute('d')).toBe(pathBefore)
    rerender(<StandingsChart {...props({ round: 4 })} />)
    expect(container.querySelector('.recharts-reference-area')).toBeNull()
    expect(container.querySelectorAll('.recharts-reference-line').length).toBe(1)
  })
  it('end labels exist for highlighted entries only', () => {
    const { container } = render(<StandingsChart {...props()} />)
    const labels = [...container.querySelectorAll('text.font-display')].map(t => t.textContent)
    expect(labels).toHaveLength(5)
  })
  it('position mode: inverted integer axis with P ticks and a toggle callback', () => {
    const onModeChange = vi.fn()
    const { container } = render(<StandingsChart {...props({ mode: 'position', onModeChange })} />)
    // integer ranks 1, 5, 10 (labels are measured text, which jsdom does not lay out)
    expect(container.querySelectorAll('.recharts-yAxis .recharts-cartesian-axis-tick')).toHaveLength(3)
    fireEvent.click(screen.getByRole('radio', { name: 'Points' }))
    expect(onModeChange).toHaveBeenCalledWith('points')
  })
  it('hover over the plot reports the nearest line through onHover; leaving clears it', () => {
    const onHover = vi.fn()
    const { container } = render(<StandingsChart {...props({ onHover })} />)
    const overlay = container.querySelector('rect[pointer-events="all"]')
    overlay.getBoundingClientRect = () => ({ left: 0, top: 0, width: 700, height: 220, right: 700, bottom: 220 })
    fireEvent.mouseMove(overlay, { clientX: 100, clientY: 1 })
    expect(onHover).toHaveBeenCalled()
    fireEvent.mouseMove(overlay, { clientX: 100, clientY: 5000 })
    expect(onHover).toHaveBeenLastCalledWith(null)
    fireEvent.mouseLeave(overlay)
    expect(onHover).toHaveBeenLastCalledWith(null)
  })
  it('no rounds: shows the empty text', () => {
    render(<StandingsChart {...props({ series: normalizeSeries({ drivers: [{ driverId: 'a', name: 'A' }] }), rounds: [] })} />)
    expect(screen.getByText('No data for this selection.')).toBeInTheDocument()
  })
  it('constructors view has no teammate legend entry', () => {
    const c = normalizeSeries({ rounds, constructors: [{ constructorId: 'mclaren', name: 'McLaren', cumulative: [1, 2, 3, 4] }, { constructorId: 'ferrari', name: 'Ferrari', cumulative: [2, 3, 4, 5] }] }, 'constructors')
    render(<StandingsChart {...props({ series: c, view: 'constructors', mode: 'position' })} />)
    expect(screen.queryByText('Second teammate')).toBeNull()
  })
  it('a single round draws dots only and does not crash', () => {
    const one = normalizeSeries({ rounds: [{ round: '1', raceName: 'A' }], drivers: mkDrivers(3).map(d => ({ ...d, cumulative: [10] })) })
    render(<StandingsChart {...props({ series: one, rounds: [{ round: '1', raceName: 'A' }], round: 1 })} />)
    expect(screen.getByRole('heading', { name: 'Season progress' })).toBeInTheDocument()
  })
})
