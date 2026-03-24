import { describe, it, expect } from 'vitest'
import { ctorColor, driverColor } from './teamColors'

describe('ctorColor', () => {
  it('returns correct color for ferrari', () => {
    expect(ctorColor('ferrari')).toBe('#E8002D')
  })

  it('returns correct color for mercedes', () => {
    expect(ctorColor('mercedes')).toBe('#27F4D2')
  })

  it('returns fallback #888 for unknown team', () => {
    expect(ctorColor('unknown_team')).toBe('#888')
  })
})

describe('driverColor', () => {
  it('returns correct color for mclaren at index 0', () => {
    expect(driverColor('mclaren', 0)).toBe('#FF8000')
  })

  it('returns an hsl string for unknown team', () => {
    const color = driverColor('unknown', 0)
    expect(typeof color).toBe('string')
    expect(color.startsWith('hsl(')).toBe(true)
  })
})
