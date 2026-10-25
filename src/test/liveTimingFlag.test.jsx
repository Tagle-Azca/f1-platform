import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LiveStatusProvider, useLiveStatus } from '../contexts/LiveStatusContext'
import NavList from '../components/layout/NavList'

// The default flags are used here: liveTiming is off.
afterEach(() => vi.unstubAllGlobals())

function Probe() {
  const { available } = useLiveStatus()
  return <p>{available ? 'live' : 'not live'}</p>
}

describe('liveTiming flag off', () => {
  it('does not open the status stream', () => {
    const EventSource = vi.fn()
    vi.stubGlobal('EventSource', EventSource)
    render(<LiveStatusProvider><Probe /></LiveStatusProvider>)
    expect(EventSource).not.toHaveBeenCalled()
    expect(screen.getByText('not live')).toBeInTheDocument()
  })

  it('hides Live timing from the nav', () => {
    render(<MemoryRouter><LiveStatusProvider><NavList /></LiveStatusProvider></MemoryRouter>)
    expect(screen.queryByRole('link', { name: /Live timing/ })).toBeNull()
  })
})
