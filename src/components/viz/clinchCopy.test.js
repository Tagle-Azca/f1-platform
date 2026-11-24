import { describe, it, expect } from 'vitest'
import { clinchedLine, marginLine, needsLine } from './clinchCopy'

const early = { clinched: true, clinchRound: 17, racesEarly: 5, margin: 120 }
describe('clinchCopy', () => {
  it('names the clinch round and how early', () => {
    expect(clinchedLine(early)).toBe('Clinched at Round 17, 5 races early')
    expect(clinchedLine({ ...early, racesEarly: 1 })).toBe('Clinched at Round 17, 1 race early')
  })
  it('says final round when decided on the last race', () => {
    expect(clinchedLine({ ...early, clinchRound: 24, racesEarly: 0 })).toBe('Clinched at the final round')
  })
  it('is empty when open or missing', () => {
    expect(clinchedLine({ clinched: false })).toBe('')
    expect(clinchedLine(null)).toBe('')
    expect(marginLine(null)).toBe('')
  })
  it('states the final margin, with races to go only for an early clinch', () => {
    expect(marginLine(early, 'Norris')).toBe('Final margin: 120 points over Norris. Decided with 5 races to go.')
    expect(marginLine({ ...early, racesEarly: 0, margin: 1 }, 'Norris')).toBe('Final margin: 1 point over Norris.')
  })
  it('needs line only while open', () => {
    expect(needsLine({ clinched: false, pointsToClinch: 12 }, 'Norris')).toBe('Norris needs 12 more points to clinch.')
    expect(needsLine({ clinched: false, pointsToClinch: 1 }, 'Norris')).toBe('Norris needs 1 more point to clinch.')
    expect(needsLine(early, 'Norris')).toBe('')
    expect(needsLine({ clinched: false, pointsToClinch: null }, 'Norris')).toBe('')
  })
})
