import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import SegmentedControl from './SegmentedControl'

const OPTS = [{ value: 'drivers', label: 'Drivers' }, { value: 'constructors', label: 'Constructors' }, { value: 'x', label: 'Third' }]

function Harness(props) {
  const [v, setV] = useState('drivers')
  const { onChange, ...rest } = props
  return <SegmentedControl options={OPTS} aria-label="Championship" {...rest} value={v} onChange={(n) => { setV(n); onChange?.(n) }} />
}

describe('SegmentedControl as tabs', () => {
  it('has tablist semantics, aria-selected, aria-controls and ids', () => {
    render(<Harness controls="st-panel" idPrefix="st-tab" />)
    expect(screen.getByRole('tablist', { name: 'Championship' })).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map(t => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false'])
    expect(tabs.every(t => t.getAttribute('aria-controls') === 'st-panel')).toBe(true)
    expect(tabs[1].id).toBe('st-tab-constructors')
  })
  it('uses a roving tabindex: only the selected tab is a Tab stop', () => {
    render(<Harness />)
    expect(screen.getAllByRole('tab').map(t => t.tabIndex)).toEqual([0, -1, -1])
  })
  it('arrow keys move focus and select; Home and End jump; wraps around', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    screen.getByRole('tab', { name: 'Drivers' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith('constructors')
    expect(screen.getByRole('tab', { name: 'Constructors' })).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Constructors' })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Third' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Drivers' })).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Third' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Drivers' })).toHaveFocus()
    await user.keyboard('{ArrowDown}{ArrowUp}')
    expect(screen.getByRole('tab', { name: 'Drivers' })).toHaveFocus()
    await user.keyboard('a')
    expect(onChange).toHaveBeenCalledTimes(7)
  })
  it('click selects', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} fill />)
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Constructors' }))
    expect(onChange).toHaveBeenCalledWith('constructors')
  })
  it('falls back to the first option for an unknown value and has no inline style', () => {
    const { container } = render(<SegmentedControl options={OPTS} value="nope" onChange={() => {}} aria-label="c" />)
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true')
    expect(container.innerHTML).not.toMatch(/style=/)
  })
})

describe('SegmentedControl as a radiogroup', () => {
  it('has radio semantics with aria-checked and no aria-controls', async () => {
    render(<Harness role="radiogroup" aria-label="Chart type" />)
    expect(screen.getByRole('radiogroup', { name: 'Chart type' })).toBeInTheDocument()
    const radios = screen.getAllByRole('radio')
    expect(radios.map(r => r.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false'])
    expect(radios.some(r => r.hasAttribute('aria-controls'))).toBe(false)
    expect(radios.map(r => r.tabIndex)).toEqual([0, -1, -1])
    radios[0].focus()
    await userEvent.setup().keyboard('{ArrowRight}')
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true')
  })
})
