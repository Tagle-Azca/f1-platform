import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'

vi.mock('../../services/api', () => ({ searchApi: { search: vi.fn() } }))
import { searchApi } from '../../services/api'
import DriverCombobox from './DriverCombobox'

const rows = [
  { type: 'constructor', id: 'mclaren', label: 'McLaren' },
  { type: 'driver', id: 'norris', label: 'Lando Norris', nationality: 'British' },
  { type: 'driver', id: 'piastri', label: 'Oscar Piastri', nationality: 'Australian' },
  { type: 'driver', id: 'Bad Id!', label: 'Broken' },
]
const mount = (props = {}) => {
  const onPick = vi.fn()
  render(<DriverCombobox id="c" label="First driver" onPick={onPick} {...props} />)
  return onPick
}
const type = async (box, text) => {
  fireEvent.change(box, { target: { value: text } })
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
}
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); searchApi.search.mockResolvedValue(rows) })
afterEach(() => vi.useRealTimers())

describe('DriverCombobox', () => {
  it('debounces and needs two characters', async () => {
    mount()
    const box = screen.getByRole('combobox', { name: 'First driver' })
    await type(box, 'n')
    expect(searchApi.search).not.toHaveBeenCalled()
    fireEvent.change(box, { target: { value: 'no' } })
    fireEvent.change(box, { target: { value: 'nor' } })
    await act(async () => { await vi.advanceTimersByTimeAsync(300) })
    expect(searchApi.search).toHaveBeenCalledTimes(1)
    expect(searchApi.search).toHaveBeenCalledWith('nor', 20)
  })

  it('lists only valid drivers and hides excluded ids', async () => {
    mount({ exclude: ['piastri'] })
    await type(screen.getByRole('combobox'), 'or')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Lando NorrisBritish'])
  })

  it('arrows move aria-activedescendant, Home/End jump, Escape closes then clears', async () => {
    mount()
    const box = screen.getByRole('combobox')
    await type(box, 'or')
    expect(box).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(box, { key: 'ArrowDown' })
    const opts = screen.getAllByRole('option')
    expect(box).toHaveAttribute('aria-activedescendant', opts[0].id)
    expect(opts[0]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(box, { key: 'ArrowDown' })
    fireEvent.keyDown(box, { key: 'ArrowDown' })
    expect(box).toHaveAttribute('aria-activedescendant', opts[0].id)
    fireEvent.keyDown(box, { key: 'End' })
    expect(box).toHaveAttribute('aria-activedescendant', opts[1].id)
    fireEvent.keyDown(box, { key: 'Home' })
    expect(box).toHaveAttribute('aria-activedescendant', opts[0].id)
    fireEvent.keyDown(box, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(box).toHaveValue('or')
    fireEvent.keyDown(box, { key: 'Escape' })
    expect(box).toHaveValue('')
  })

  it('Enter and click pick a driver and clear the field', async () => {
    const onPick = mount()
    const box = screen.getByRole('combobox')
    await type(box, 'or')
    fireEvent.keyDown(box, { key: 'ArrowDown' })
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(onPick).toHaveBeenCalledWith({ driverId: 'norris', name: 'Lando Norris', nationality: 'British' })
    expect(box).toHaveValue('')
    await type(box, 'pi')
    fireEvent.click(screen.getByRole('option', { name: /Oscar Piastri/ }))
    expect(onPick).toHaveBeenLastCalledWith({ driverId: 'piastri', name: 'Oscar Piastri', nationality: 'Australian' })
  })

  it('shows no matches and an error row with retry', async () => {
    searchApi.search.mockResolvedValueOnce([])
    mount()
    const box = screen.getByRole('combobox')
    await type(box, 'zzz')
    expect(screen.getByText(/No matches for/)).toBeInTheDocument()
    searchApi.search.mockRejectedValueOnce(new Error('x'))
    await type(box, 'zzzz')
    expect(screen.getByRole('alert')).toHaveTextContent("Search isn't available right now.")
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Try again' })); await vi.advanceTimersByTimeAsync(300) })
    expect(searchApi.search).toHaveBeenCalledTimes(3)
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
  })

  it('a slower earlier answer never overwrites a newer one', async () => {
    let first
    searchApi.search.mockImplementationOnce(() => new Promise((r) => { first = r }))
    mount()
    const box = screen.getByRole('combobox')
    await type(box, 'aa')
    searchApi.search.mockResolvedValueOnce([{ type: 'driver', id: 'bee', label: 'Bee' }])
    await type(box, 'bee')
    await act(async () => { first([{ type: 'driver', id: 'late', label: 'Late' }]) })
    expect(screen.queryByText('Late')).toBeNull()
    expect(screen.getByRole('option', { name: /Bee/ })).toBeInTheDocument()
  })

  it('focuses itself when asked and announces the result count', async () => {
    mount({ autoFocus: true })
    const box = screen.getByRole('combobox')
    expect(box).toHaveFocus()
    await type(box, 'or')
    expect(screen.getByRole('status')).toHaveTextContent('2 drivers found')
  })
})
