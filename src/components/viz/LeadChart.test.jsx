import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LeadChart from './LeadChart'

const pts = [{ round: 1, lead: 5 }, { round: 2, lead: 20 }, { round: 3, lead: 40 }]

describe('LeadChart', () => {
  it('is one labelled figure with a clinch marker and no projection past the data', () => {
    render(<LeadChart points={pts} total={6} clinchRound={3} color="#fff" label="Lead over P2 by round" />)
    expect(screen.getByRole('img', { name: 'Lead over P2 by round' })).toBeInTheDocument()
    expect(screen.getByText('Clinched')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-lead-chart] path')).toHaveLength(2)
    expect(document.querySelectorAll('[data-lead-chart] line')).toHaveLength(2)
  })
  it('omits the marker without a clinch round and renders nothing for too little data', () => {
    const { container, rerender } = render(<LeadChart points={pts} total={6} color="#fff" label="x" />)
    expect(screen.queryByText('Clinched')).toBeNull()
    rerender(<LeadChart points={[{ round: 1, lead: 3 }]} total={6} color="#fff" label="x" />)
    expect(container).toBeEmptyDOMElement()
  })
})
