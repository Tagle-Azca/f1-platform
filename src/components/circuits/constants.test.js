import { describe, it, expect } from 'vitest'
import { regionOf, circuitType, CIRCUIT_TYPES, REGION_ORDER, CONTINENT } from './constants'

describe('regionOf', () => {
  it('maps known countries and defaults to Other', () => {
    expect(regionOf('Italy')).toBe('Europe')
    expect(regionOf('Qatar')).toBe('Middle East')
    expect(regionOf('Atlantis')).toBe('Other')
    expect(regionOf('')).toBe('Other')
  })
  it('never resolves prototype keys or non-strings', () => {
    for (const v of ['__proto__', 'constructor', 'toString', 5, null, undefined, {}]) expect(regionOf(v)).toBe('Other')
  })
  it('every mapped region is in the display order', () => {
    for (const r of Object.values(CONTINENT)) expect(REGION_ORDER).toContain(r)
  })
})

describe('circuitType', () => {
  it('types the street, hybrid and permanent examples', () => {
    expect(circuitType('monaco')).toBe('street')
    expect(circuitType('albert_park')).toBe('hybrid')
    expect(circuitType('monza')).toBe('permanent')
  })
  it('resolves vegas through the alias, madring as hybrid, sepang as permanent', () => {
    expect(circuitType('vegas')).toBe('street')
    expect(circuitType('madring')).toBe('hybrid')
    expect(circuitType('sepang')).toBe('permanent')
  })
  it('defaults unknown or hostile ids to permanent', () => {
    for (const v of ['nope', '__proto__', 'constructor', 3, null, undefined]) expect(circuitType(v)).toBe('permanent')
    expect(Object.values(CIRCUIT_TYPES).every((t) => ['permanent', 'street', 'hybrid'].includes(t))).toBe(true)
  })
})
