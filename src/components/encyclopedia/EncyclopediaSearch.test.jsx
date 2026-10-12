import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../../services/api', () => ({ searchApi: { search: vi.fn() } }))
import { searchApi } from '../../services/api'
import EncyclopediaSearch from './EncyclopediaSearch'

const rows = [
  { type: 'race', id: '2025-9', label: '2025 Italian Grand Prix', circuitName: 'Monza' },
  { type: 'driver', id: 'norris', label: 'Lando Norris', nationality: 'British' },
  { type: 'constructor', id: 'mclaren', label: 'McLaren' },
  { type: 'circuit', id: 'monza', label: 'Monza', country: 'Italy' },
]

function mount() {
  return render(
    <MemoryRouter initialEntries={['/encyclopedia']}>
      <Routes>
        <Route path="/encyclopedia" element={<EncyclopediaSearch />} />
        <Route path="/drivers/:id" element={<p>driver page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}
const type = async (box, text) => {
  fireEvent.change(box, { target: { value: text } })
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
}

beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); searchApi.search.mockResolvedValue(rows) })
afterEach(() => vi.useRealTimers())

describe('EncyclopediaSearch', () => {
  it('does not search below two characters and debounces', async () => {
    mount()
    const box = screen.getByRole('combobox', { name: 'Search' })
    await type(box, 'n')
    expect(searchApi.search).not.toHaveBeenCalled()
    fireEvent.change(box, { target: { value: 'no' } })
    fireEvent.change(box, { target: { value: 'nor' } })
    await act(async () => { await vi.advanceTimersByTimeAsync(300) })
    expect(searchApi.search).toHaveBeenCalledTimes(1)
    expect(searchApi.search).toHaveBeenCalledWith('nor', 20)
  })

  it('groups results in order and every option is a canonical link', async () => {
    mount()
    await type(screen.getByRole('combobox'), 'mo')
    const opts = screen.getAllByRole('option')
    expect(opts.map((o) => o.getAttribute('href'))).toEqual(['/drivers/norris', '/constructors/mclaren', '/circuits/monza', '/races/2025/9'])
    expect(screen.getAllByText(/^(Drivers|Constructors|Circuits|Races)$/).map((e) => e.textContent)).toEqual(['Drivers', 'Constructors', 'Circuits', 'Races'])
    expect(screen.getByRole('status', { hidden: true })).toBeDefined()
  })

  it('arrow keys move aria-activedescendant, wrap, and Esc closes then clears', async () => {
    mount()
    const box = screen.getByRole('combobox')
    await type(box, 'mo')
    expect(box).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(box, { key: 'ArrowDown' })
    const first = screen.getAllByRole('option')[0]
    expect(box).toHaveAttribute('aria-activedescendant', first.id)
    expect(first).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(box, { key: 'ArrowUp' })
    expect(box).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[3].id)
    fireEvent.keyDown(box, { key: 'Home' })
    expect(box).toHaveAttribute('aria-activedescendant', first.id)
    fireEvent.keyDown(box, { key: 'End' })
    expect(box).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[3].id)
    fireEvent.keyDown(box, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(box).toHaveValue('mo')
    fireEvent.keyDown(box, { key: 'Escape' })
    expect(box).toHaveValue('')
  })

  it('Enter follows the active option', async () => {
    mount()
    const box = screen.getByRole('combobox')
    await type(box, 'mo')
    fireEvent.keyDown(box, { key: 'ArrowDown' })
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(screen.getByText('driver page')).toBeInTheDocument()
  })

  it('shows a no-results row and an error row with retry', async () => {
    searchApi.search.mockResolvedValueOnce([])
    mount()
    const box = screen.getByRole('combobox')
    await type(box, 'zzz')
    expect(screen.getByText(/No matches for/)).toBeInTheDocument()
    searchApi.search.mockRejectedValueOnce(new Error('x'))
    await type(box, 'zzzz')
    expect(screen.getByText("Search isn't available right now.")).toBeInTheDocument()
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

  it('"/" focuses the field unless typing elsewhere; clear empties it', async () => {
    mount()
    const box = screen.getByRole('combobox')
    fireEvent.keyDown(document.body, { key: '/' })
    expect(box).toHaveFocus()
    box.blur()
    const other = document.createElement('input')
    document.body.appendChild(other)
    other.focus()
    fireEvent.keyDown(other, { key: '/' })
    expect(box).not.toHaveFocus()
    other.remove()
    await type(box, 'mo')
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(box).toHaveValue('')
  })
})
