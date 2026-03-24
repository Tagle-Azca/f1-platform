import { describe, it, expect } from 'vitest'
import { fmtDate, fmtDateObj, fmtSessionDate } from './date'

describe('fmtDate', () => {
  it('returns empty string for null', () => {
    expect(fmtDate(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(fmtDate(undefined)).toBe('')
  })

  it('converts YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(fmtDate('2024-03-15')).toBe('15/03/2024')
  })

  it('returns partial input as-is when parts are missing', () => {
    expect(fmtDate('2024-03')).toBe('2024-03')
  })
})

describe('fmtDateObj', () => {
  it('returns empty string for null', () => {
    expect(fmtDateObj(null)).toBe('')
  })

  it('formats a Date object to DD/MM/YYYY', () => {
    const date = new Date(2024, 2, 15) // March 15, 2024 (month is 0-indexed)
    expect(fmtDateObj(date)).toBe('15/03/2024')
  })

  it('pads single digit day and month with zeros', () => {
    const date = new Date(2024, 0, 5) // January 5, 2024
    expect(fmtDateObj(date)).toBe('05/01/2024')
  })
})

describe('fmtSessionDate', () => {
  it('returns empty string for null', () => {
    expect(fmtSessionDate(null)).toBe('')
  })

  it('returns a string with weekday prefix for valid iso + time', () => {
    const result = fmtSessionDate('2024-03-15', '10:00:00')
    // Should include a weekday short name (e.g. "Fri")
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    // Result should include the date portion
    expect(result).toContain('03/2024')
  })

  it('includes weekday prefix (3 letters)', () => {
    const result = fmtSessionDate('2024-03-15', '10:00:00')
    // Format is "Mon DD/MM/YYYY" — first token should be a 3-letter weekday
    const parts = result.split(' ')
    expect(parts[0].length).toBe(3)
  })
})
