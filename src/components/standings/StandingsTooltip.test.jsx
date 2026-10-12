import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StandingsTooltip from './StandingsTooltip'

const rowsAt = () => [
  { id: 'a', code: 'ANT', color: '#27F4D2', pos: 1, pts: 120 },
  { id: 'b', code: 'RUS', color: '#27F4D2', pos: 2, pts: 100 },
]
const props = { active: true, label: 3, title: (r) => `R${r} · GP`, rowsAt, mode: 'points', hoverId: null }

describe('StandingsTooltip', () => {
  it('lists the highlighted entries best first with points', () => {
    render(<StandingsTooltip {...props} />)
    expect(screen.getByText('R3 · GP')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map(li => li.textContent)).toEqual(['ANT120 pts', 'RUS100 pts'])
  })
  it('position mode shows the rank, and the hovered entry goes first', () => {
    render(<StandingsTooltip {...props} mode="position" hoverId="b" />)
    expect(screen.getAllByRole('listitem').map(li => li.textContent)).toEqual(['RUSP2, 100 pts', 'ANTP1, 120 pts'])
  })
  it('renders nothing when inactive, without a label, or without rows', () => {
    expect(render(<StandingsTooltip {...props} active={false} />).container.firstChild).toBeNull()
    expect(render(<StandingsTooltip {...props} label={null} />).container.firstChild).toBeNull()
    expect(render(<StandingsTooltip {...props} rowsAt={() => []} />).container.firstChild).toBeNull()
  })
})
