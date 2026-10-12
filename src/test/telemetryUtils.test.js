import { describe, it, expect } from 'vitest'
import { stintSlope, fmtDelta, median, paceDomain, degradTone, DEGRAD_LIMIT_MS } from '../components/telemetry/telemetryUtils'

describe('stintSlope', () => {
  it('returns the per-lap trend of a clean stint', () => {
    expect(stintSlope([90, 90.1, 90.2, 90.3, 90.4])).toBeCloseTo(0.1, 6)
  })

  it('keeps the true trend when an outlier lap is dropped', () => {
    // The 120 s lap (safety car) is excluded; the remaining 4 laps rise 0.1 s/lap.
    // The old formula divided with the unfiltered count and returned a wrong slope here.
    expect(stintSlope([90, 90.1, 120, 90.2, 90.3])).toBeCloseTo(0.1, 6)
  })

  it('returns null with fewer than 3 usable laps', () => {
    expect(stintSlope([90, 91])).toBeNull()
    // 3 laps, but the 200 s lap is > 110% of the median and gets dropped, leaving 2
    expect(stintSlope([90, 91, 200])).toBeNull()
  })
})

describe('fmtDelta', () => {
  it('signs and rounds to milliseconds', () => {
    expect(fmtDelta(0.1234)).toBe('+0.123 s')
    expect(fmtDelta(-0.045)).toBe('−0.045 s')
    expect(fmtDelta(0)).toBe('±0.000 s')
  })
  it('renders a dash for missing values', () => {
    expect(fmtDelta(null)).toBe('—')
    expect(fmtDelta(NaN)).toBe('—')
  })
})

describe('median', () => {
  it('handles odd, even, empty and non-finite input', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
    expect(median([])).toBeNull()
    expect(median([NaN, 5])).toBe(5)
  })
})

describe('paceDomain', () => {
  const race = [95, 96, 96.2, 96.4, 96.1, 96.3]

  it('returns null when no lap is far off the pace', () => {
    expect(paceDomain(race)).toBeNull()
  })

  it('caps the range at 108% of the median and counts the laps above it', () => {
    const d = paceDomain([...race, 140, 150, null, undefined])
    expect(d.over).toBe(2)
    expect(d.cap).toBeCloseTo(median([...race, 140, 150]) * 1.08, 6)
    expect(d.domain[0]).toBeLessThanOrEqual(95)
    expect(d.domain[1]).toBeGreaterThanOrEqual(d.cap)
  })

  it('needs at least 3 laps', () => {
    expect(paceDomain([90, 200])).toBeNull()
  })
})

describe('degradTone', () => {
  it('always pairs a word with the tone', () => {
    expect(degradTone(null).word).toBe('Not enough laps')
    expect(degradTone(-10).word).toBe('Improving')
    expect(degradTone(30).word).toBe('Low')
    expect(degradTone(60).word).toBe('Medium')
    expect(degradTone(120).word).toBe('High')
  })
  it('flags implausible trends instead of reporting them', () => {
    expect(degradTone(-534).word).toBe('Disrupted, no trend')
    expect(degradTone(DEGRAD_LIMIT_MS + 1).cls).toBe('text-ink-3')
  })
})
