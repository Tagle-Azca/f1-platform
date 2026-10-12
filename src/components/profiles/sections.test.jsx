import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TeamDNA from './constructor/TeamDNA'
import TenureStrip from './constructor/TenureStrip'
import BestCircuits from './driver/BestCircuits'

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('TeamDNA', () => {
  it('shows the empty state when there are too few races', () => {
    wrap(<TeamDNA scores={null} color="#f00" />)
    expect(screen.getByText(/at least 5 races/)).toBeInTheDocument()
  })
  it('lists each literal rate with one decimal', () => {
    wrap(<TeamDNA color="#f00" scores={[{ key: 'poles', label: 'Pole rate', value: 12.5, detail: '3 of 24 races' }]} />)
    expect(screen.getByText('12.5%')).toBeInTheDocument()
    expect(screen.getByText('3 of 24 races')).toBeInTheDocument()
  })
})

describe('TenureStrip', () => {
  it('shows an empty state without drivers', () => {
    wrap(<TenureStrip columns={[]} rows={[]} color="#f00" />)
    expect(screen.getByText('No drivers listed yet.')).toBeInTheDocument()
  })
  it('renders a lane per driver with gap cells and a split bar', () => {
    const rows = [
      { id: 'ann', name: 'Ann One', cells: [{ season: 2022, points: 10 }, null, { season: 2024, points: 30 }], spans: [{ start: 0, len: 1 }, { start: 2, len: 1 }] },
      { id: '', name: 'No Id', cells: [null, { season: 2023, points: 5 }, null], spans: [{ start: 1, len: 1 }] },
    ]
    wrap(<TenureStrip columns={[2022, 2023, 2024]} rows={rows} color="#f00" />)
    expect(screen.getByText('Ann One')).toBeInTheDocument()
    expect(screen.getByText('No Id')).toBeInTheDocument()
    expect(screen.getAllByText(/points for the team in/)).toHaveLength(3)
  })
})

describe('BestCircuits', () => {
  const rows = [
    { id: 'monza', name: 'Monza', races: 3, podiums: 2, pprText: '15.0', wins: 1, max: 2 },
    { id: 'imola', name: 'Imola', races: 2, podiums: 0, pprText: '4.0', wins: 2, max: 2 },
  ]
  it('renders table and list variants with pluralised wins', () => {
    wrap(<BestCircuits rows={rows} name="Ann One" status="ready" />)
    expect(screen.getAllByRole('link', { name: 'Monza' })[0]).toHaveAttribute('href', '/circuits/monza')
    expect(screen.getByText('win')).toBeInTheDocument()
    expect(screen.getByText('wins')).toBeInTheDocument()
  })
  it('shows an empty line', () => {
    wrap(<BestCircuits rows={[]} name="Ann" status="ready" />)
    expect(screen.getByText('No circuit results yet.')).toBeInTheDocument()
  })
  it('shows a section error with a working retry', () => {
    const onRetry = vi.fn()
    wrap(<BestCircuits rows={[]} name="Ann" status="error" onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /retry|try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })
})
