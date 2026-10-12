import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DriverCard from './DriverCard'
import ConstructorCard from './ConstructorCard'
import { Footer } from './cardParts'

const wrap = (ui) => render(<MemoryRouter><ul>{ui}</ul></MemoryRouter>)
const driver = { id: 'ann', name: 'Ann One', given: 'Ann', surname: 'One', team: 'McLaren', color: '#ff8000', position: 1, points: 90, wins: 2, number: '7', code: 'ANN', photoUrl: null }
const ctor = { id: 'mclaren', name: 'McLaren', code: 'MCL', color: '#ff8000', position: 2, points: 70, wins: 1 }

describe('hub cards', () => {
  it('DriverCard portrait: one link named by the driver, pill, footer and favourite chip', () => {
    wrap(<DriverCard card={driver} season={2025} favourite />)
    const link = screen.getByRole('link', { name: 'Ann One' })
    expect(link).toHaveAttribute('href', '/drivers/ann')
    expect(link).toHaveAttribute('data-favourite', 'true')
    expect(link.textContent).toContain('Favourite')
    expect(link.textContent).toContain('P1')
    expect(link.textContent).toContain('Points')
  })
  it('DriverCard portrait without team, given name or favourite renders no blanks', () => {
    wrap(<DriverCard card={{ ...driver, team: '', given: '', number: '', code: '' }} season={2025} />)
    const link = screen.getByRole('link', { name: 'Ann One' })
    expect(link).not.toHaveAttribute('data-favourite')
    expect(link.textContent).not.toContain('Favourite')
  })
  it('DriverCard row layout shows the inline points line and favourite', () => {
    wrap(<DriverCard card={{ ...driver, wins: 1 }} season={2025} layout="row" favourite />)
    expect(screen.getByRole('link', { name: 'Ann One' }).textContent).toMatch(/90 pts · 1 win(?!s)/)
  })
  it('ConstructorCard portrait and row link to the canonical route', () => {
    const { unmount } = wrap(<ConstructorCard card={ctor} season={2025} favourite />)
    expect(screen.getByRole('link', { name: 'McLaren' })).toHaveAttribute('href', '/constructors/mclaren')
    expect(screen.getByRole('link', { name: 'McLaren' }).textContent).toContain('Favourite')
    unmount()
    wrap(<ConstructorCard card={ctor} season={2025} layout="row" />)
    expect(screen.getByRole('link', { name: 'McLaren' }).textContent).toMatch(/70 pts · 1 win(?!s)/)
  })
  it('Footer drops a cell whose datum is missing and renders nothing when both are', () => {
    const { container, rerender } = render(<Footer points={5} wins={NaN} />)
    expect(container.textContent).toContain('Points')
    expect(container.textContent).not.toContain('Wins')
    rerender(<Footer points={undefined} wins={undefined} />)
    expect(container.firstChild).toBeNull()
  })
})
