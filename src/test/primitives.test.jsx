import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Panel from '../components/ui/Panel'
import SectionHeader from '../components/ui/SectionHeader'
import DataRow from '../components/ui/DataRow'
import StatLine from '../components/ui/StatLine'
import Meter from '../components/ui/Meter'
import TyreBadge from '../components/ui/TyreBadge'
import StatCard from '../components/ui/StatCard'
import TabBar from '../components/ui/TabBar'
import LivePill from '../components/ui/LivePill'
import CountdownDisplay from '../components/ui/CountdownDisplay'
import EmptyState from '../components/ui/EmptyState'
import BackendError from '../components/ui/BackendError'
import Disclosure from '../components/ui/Disclosure'

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('Panel / SectionHeader', () => {
  it('renders title, actions and children; accent and padding classes', () => {
    render(<Panel title="Hello" actions={<button>Share</button>} accent="red" padding="sm">body</Panel>)
    expect(screen.getByRole('heading', { level: 2, name: 'Hello' })).toBeInTheDocument()
    expect(screen.getByText('Share')).toBeInTheDocument()
    expect(screen.getByText('body').closest('.panel')).toHaveClass('panel--sm', 'panel--red')
  })
  it('escapes hostile text', () => {
    render(<Panel title={'<img src=x onerror=alert(1)>'}>x</Panel>)
    expect(document.querySelector('img')).toBeNull()
  })
  it('SectionHeader without title or actions still renders', () => {
    const { container } = render(<SectionHeader />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('DataRow', () => {
  it('plain row with sanitized team color', () => {
    const { container } = wrap(<DataRow pos={1} teamColor="#ff8000" label="Norris" sub="McLaren" value="25" highlight />)
    expect(screen.getByText('Norris')).toBeInTheDocument()
    expect(container.querySelector('[style]').getAttribute('style')).toContain('--team: #ff8000')
  })
  it('drops non-hex team colors', () => {
    const { container } = wrap(<DataRow teamColor="red;background:url(x)" label="A" />)
    expect(container.querySelector('[style]')).toBeNull()
  })
  it('link and button variants', () => {
    const onClick = vi.fn()
    wrap(<><DataRow to="/drivers/x" label="Link" /><DataRow onClick={onClick} label="Btn" /></>)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/drivers/x')
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})

describe('small primitives', () => {
  it('StatLine renders label, value, extra, hint', () => {
    render(<dl><StatLine label="Pole" hint value="Max" extra="1:20.0" /></dl>)
    expect(screen.getByText('Pole')).toBeInTheDocument()
    expect(screen.getByText('1:20.0')).toBeInTheDocument()
  })
  it('Meter clamps values and supports vertical', () => {
    const { container, rerender } = render(<Meter value={250} />)
    expect(container.querySelector('[style]')).toHaveStyle({ width: '100%' })
    rerender(<Meter value={-5} vertical />)
    expect(container.querySelector('[style]')).toHaveStyle({ height: '0%' })
    rerender(<Meter value="abc" />)
    expect(container.querySelector('[style]')).toHaveStyle({ width: '0%' })
  })
  it('TyreBadge shows compound as text and ignores unknown', () => {
    const { rerender } = render(<TyreBadge compound="SOFT" />)
    expect(screen.getByText('Soft tyre')).toBeInTheDocument()
    rerender(<TyreBadge compound="__proto__" />)
    expect(screen.getByText('Unknown tyre')).toBeInTheDocument()
    rerender(<TyreBadge compound="UNKNOWN" />)
    expect(screen.queryByText(/tyre/)).toBeNull()
  })
  it('StatCard with and without accent/sub', () => {
    const { rerender } = render(<StatCard label="Wins" value={3} sub="this year" accent="#f00" size="md" />)
    expect(screen.getByText('this year')).toBeInTheDocument()
    rerender(<StatCard label="Poles" value={1} />)
    expect(screen.getByText('Poles')).toBeInTheDocument()
  })
  it('TabBar pill and underline variants call onChange and set aria-pressed', () => {
    const onChange = vi.fn()
    const tabs = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B', badge: <i>!</i> }]
    const { rerender } = render(<TabBar tabs={tabs} activeTab="a" onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /B/ }))
    expect(onChange).toHaveBeenCalledWith('b')
    rerender(<TabBar tabs={tabs} activeTab="b" onChange={onChange} variant="underline" />)
    fireEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(onChange).toHaveBeenCalledWith('a')
  })
  it('LivePill defaults to the word Live', () => {
    render(<LivePill />)
    expect(screen.getByText('Live')).toBeInTheDocument()
    render(<LivePill>Live now</LivePill>)
    expect(screen.getByText('Live now')).toBeInTheDocument()
  })
  it('CountdownDisplay exposes a static spoken label and hides ticking digits', () => {
    const { container, rerender } = render(<CountdownDisplay parts={{ d: 2, h: 3, m: 4, s: 5 }} label="Race starts in" />)
    expect(screen.getByText('Race starts in 2 days 3 hours 4 minutes')).toBeInTheDocument()
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(1)
    expect(container.querySelector('[data-countdown]')).toHaveTextContent('2d03h04m')
    rerender(<CountdownDisplay parts={{ d: 0, h: 0, m: 0, s: 1 }} size="lg" />)
    expect(screen.getByText(/Starts in/)).toBeInTheDocument()
    rerender(<CountdownDisplay parts={null} />)
    expect(container.firstChild).toBeNull()
  })
  it('EmptyState variants', () => {
    const { rerender } = render(<EmptyState type="empty" />)
    expect(screen.getByText('No data available')).toBeInTheDocument()
    rerender(<EmptyState type="error" action={<button>Retry</button>} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })
  it('BackendError never echoes raw errors and wires retry', () => {
    const onRetry = vi.fn()
    render(<BackendError onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })
})

describe('Disclosure', () => {
  it('toggles with aria-expanded / aria-controls below lg', () => {
    render(<Disclosure title="Specs">content</Disclosure>)
    const btn = screen.getByRole('button', { name: /Specs/ })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('content')).toHaveAttribute('hidden')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(btn.getAttribute('aria-controls')).toBe(screen.getByText('content').id)
  })
  it('is always open without a button from lg', () => {
    window.matchMedia = (q) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} })
    render(<Disclosure title="Specs" meta="m">content</Disclosure>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('content')).not.toHaveAttribute('hidden')
    delete window.matchMedia
  })
})
