import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeadToHeadBar from './HeadToHeadBar'

describe('HeadToHeadBar', () => {
  it('shows codes, numbers and the caption, with the leader in semibold', () => {
    render(<HeadToHeadBar left={{ code: 'NOR', value: 9 }} right={{ code: 'PIA', value: 7 }} color="red" max={16} caption="of 16 races compared" />)
    expect(screen.getByText('NOR')).toBeInTheDocument()
    expect(screen.getByText('of 16 races compared')).toBeInTheDocument()
    expect(screen.getByText('9')).toHaveClass('font-semibold')
    expect(screen.getByText('7')).not.toHaveClass('font-semibold')
  })
  it('never divides by zero', () => {
    const { container } = render(<HeadToHeadBar left={{ code: 'A', value: 0 }} right={{ code: 'B', value: 0 }} color="red" max={0} caption="Level" />)
    expect(container.querySelectorAll('rect[width="0"]').length).toBeGreaterThan(0)
  })
})
