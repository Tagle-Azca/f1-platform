import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RowDetail from './RowDetail'

const row = { id: 'a', name: 'Ann A', code: 'ANN', kind: 'driver', color: 'x', pts: 50, wins: 1 }
const base = { id: 'd', labelledBy: 'r', row, round: 3, rounds: [{ raceName: 'One GP' }, { raceName: 'Two GP' }, {}], onOpenProfile: vi.fn(), onKeyDown: vi.fn() }
const detail = (over = {}) => ({ perRound: [10, 0, 5], bestRound: { round: 1, pts: 10 }, last5: [10, 0, 5], last5Sum: 15, teammate: null, ahead: null, penalty: false, ...over })

describe('RowDetail', () => {
  it('shows best round with the race, last rounds and no teammate stat', () => {
    render(<RowDetail {...base} detail={detail()} />)
    expect(screen.getByText('10 pts')).toBeInTheDocument()
    expect(screen.getByText('R1, One GP')).toBeInTheDocument()
    expect(screen.getByText('Last 3 rounds')).toBeInTheDocument()
    expect(screen.queryByText(/Against/)).toBeNull()
    expect(screen.queryByText(/Penalties/)).toBeNull()
  })
  it('penalty note, a missing race name, single last round and the Level / behind wording', () => {
    const mate = { id: 'b', surname: 'Bee', code: 'BEE', pts: 50, diff: 0 }
    const { rerender } = render(<RowDetail {...base} detail={detail({ penalty: true, bestRound: { round: 3, pts: 5 }, last5: [5], last5Sum: 5, teammate: mate })} />)
    expect(screen.getByText('Penalties are not shown.')).toBeInTheDocument()
    expect(screen.getByText('Last round')).toBeInTheDocument()
    expect(screen.getByText('Level')).toBeInTheDocument()
    rerender(<RowDetail {...base} detail={detail({ teammate: { ...mate, pts: 60, diff: -10 } })} />)
    expect(screen.getByText('10 behind')).toBeInTheDocument()
    rerender(<RowDetail {...base} detail={detail({ last5: [1, 2, 3, 4, 5] })} />)
    expect(screen.getByText('Last 5 rounds')).toBeInTheDocument()
  })
  it('no points yet', () => {
    render(<RowDetail {...base} detail={detail({ perRound: [], bestRound: null, last5: [], last5Sum: 0 })} />)
    expect(screen.getByText('None yet')).toBeInTheDocument()
    expect(screen.getByText('Ann A has no points yet.')).toBeInTheDocument()
  })
  it('constructor leader shows Leader and others the gap', () => {
    const c = { ...row, kind: 'constructor' }
    const { rerender } = render(<RowDetail {...base} row={c} detail={detail()} />)
    expect(screen.getByText('Leader')).toBeInTheDocument()
    rerender(<RowDetail {...base} row={c} detail={detail({ ahead: { id: 'z', name: 'Zed', gap: 4 } })} />)
    expect(screen.getByText('behind Zed')).toBeInTheDocument()
  })
})
