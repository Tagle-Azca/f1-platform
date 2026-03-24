import { describe, it, expect } from 'vitest'
import { getCircuitSpecs } from './circuitSpecs'

describe('getCircuitSpecs', () => {
  it('returns an object with length, laps, and turns for monaco', () => {
    const specs = getCircuitSpecs('monaco')
    expect(specs).not.toBeNull()
    expect(specs).toHaveProperty('length')
    expect(specs).toHaveProperty('laps')
    expect(specs).toHaveProperty('turns')
  })

  it('returns a valid object for monza', () => {
    const specs = getCircuitSpecs('monza')
    expect(specs).not.toBeNull()
    expect(typeof specs).toBe('object')
    expect(specs).toHaveProperty('length')
    expect(specs).toHaveProperty('laps')
    expect(specs).toHaveProperty('turns')
  })

  it('returns null for a nonexistent circuit', () => {
    expect(getCircuitSpecs('nonexistent')).toBeNull()
  })

  it('all numeric fields for monaco are greater than 0', () => {
    const specs = getCircuitSpecs('monaco')
    expect(specs.length).toBeGreaterThan(0)
    expect(specs.laps).toBeGreaterThan(0)
    expect(specs.turns).toBeGreaterThan(0)
    expect(specs.drs).toBeGreaterThan(0)
    expect(specs.throttle).toBeGreaterThan(0)
    expect(specs.topSpeed).toBeGreaterThan(0)
    expect(specs.gforce).toBeGreaterThan(0)
    expect(specs.gearChanges).toBeGreaterThan(0)
    expect(specs.braking).toBeGreaterThan(0)
    expect(specs.tireStress).toBeGreaterThan(0)
  })
})
