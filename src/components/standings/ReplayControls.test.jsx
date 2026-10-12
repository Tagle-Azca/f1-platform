import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReplayControls from './ReplayControls'

const base = { round: 12, total: 22, playing: false, atEnd: false, onToggle: vi.fn(), onSeek: vi.fn(), valueText: 'After round 12, British GP', compactLabel: 'R12/22', longLabel: 'R12 · British GP' }

describe('ReplayControls', () => {
  it('exposes the group, a named play button and a scrubber with aria-valuetext', () => {
    render(<ReplayControls {...base} />)
    expect(screen.getByRole('group', { name: 'Season replay' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play replay' })).toBeInTheDocument()
    const range = screen.getByRole('slider', { name: 'Replay round' })
    expect(range).toHaveAttribute('aria-valuetext', 'After round 12, British GP')
    expect(range).toHaveAttribute('min', '1')
    expect(range).toHaveAttribute('max', '22')
    expect(range.style.getPropertyValue('--pct')).toMatch(/52\.3/)
    expect(screen.getByText('R12/22')).toBeInTheDocument()
    expect(screen.getByText('R12 · British GP')).toBeInTheDocument()
  })
  it('button names follow the state', () => {
    const { rerender } = render(<ReplayControls {...base} playing />)
    expect(screen.getByRole('button', { name: 'Pause replay' })).toBeInTheDocument()
    rerender(<ReplayControls {...base} atEnd round={22} />)
    expect(screen.getByRole('button', { name: 'Replay season' })).toBeInTheDocument()
  })
  it('toggle and seek callbacks', async () => {
    const onToggle = vi.fn(); const onSeek = vi.fn()
    render(<ReplayControls {...base} onToggle={onToggle} onSeek={onSeek} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Play replay' }))
    expect(onToggle).toHaveBeenCalled()
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } })
    expect(onSeek).toHaveBeenCalledWith(7)
  })
  it('PageUp and PageDown move five rounds; other keys are left to the native range', () => {
    const onSeek = vi.fn()
    render(<ReplayControls {...base} onSeek={onSeek} />)
    const range = screen.getByRole('slider')
    fireEvent.keyDown(range, { key: 'PageUp' })
    expect(onSeek).toHaveBeenLastCalledWith(17)
    fireEvent.keyDown(range, { key: 'PageDown' })
    expect(onSeek).toHaveBeenLastCalledWith(7)
    fireEvent.keyDown(range, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenCalledTimes(2)
  })
  it('with fewer than two rounds the controls are aria-disabled, focusable and explained', async () => {
    const onToggle = vi.fn(); const onSeek = vi.fn()
    render(<ReplayControls {...base} total={1} round={1} onToggle={onToggle} onSeek={onSeek} />)
    const btn = screen.getByRole('button', { name: /replay/i })
    expect(btn).toHaveAttribute('aria-disabled', 'true')
    expect(btn).toHaveAccessibleDescription('Needs at least two rounds')
    await userEvent.setup().click(btn)
    expect(onToggle).not.toHaveBeenCalled()
    fireEvent.change(screen.getByRole('slider'), { target: { value: '1' } })
    expect(onSeek).not.toHaveBeenCalled()
  })
  it('can ship non-sticky', () => {
    const { rerender } = render(<ReplayControls {...base} />)
    expect(screen.getByRole('group').className).toMatch(/sticky/)
    rerender(<ReplayControls {...base} sticky={false} />)
    expect(screen.getByRole('group').className).not.toMatch(/sticky/)
  })
})
