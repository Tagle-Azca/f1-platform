import { describe, it, expect } from 'vitest'
import { monogram, formatCoords, locatorPoint, LOCATOR, cardSpecs, specsLine, hasOutline, describeCircuit, circuitTitle, placeLine, NOT_IN_DATA } from './circuitFormat'

const base = { id: 'monza', name: 'Autodromo', locality: 'Monza', country: 'Italy', type: 'permanent', raceCount: 5, lastSeason: 2025, calendarRound: null, calendarOnly: false }

describe('monogram', () => {
  it('uses locality initials', () => {
    expect(monogram('Kuala Lumpur', 'x')).toBe('KL')
    expect(monogram('Monza', 'x')).toBe('MO')
    expect(monogram('Mexico City', '')).toBe('MC')
    expect(monogram('Le Castellet', '')).toBe('LC')
  })
  it('skips short lower-case filler words and punctuation', () => {
    expect(monogram('Sao de Paulo', '')).toBe('SP')
    expect(monogram('Marina-Bay', '')).toBe('MA')
    expect(monogram('édimbourg', '')).toBe('ÉD')
    expect(monogram('the City of Lights', '')).toBe('TC')
  })
  it('falls back to the circuit name, then a dash', () => {
    expect(monogram('', 'Sepang International')).toBe('SI')
    expect(monogram(null, 'Spa')).toBe('SP')
    expect(monogram('', '')).toBe('–')
    expect(monogram('12 3', '!!')).toBe('–')
    expect(monogram(5, {})).toBe('–')
  })
})

describe('formatCoords', () => {
  it('formats hemispheres', () => {
    expect(formatCoords(2.76083, 101.738)).toBe('2.76° N · 101.74° E')
    expect(formatCoords(-37.8497, -122.5)).toBe('37.85° S · 122.50° W')
    expect(formatCoords(0, 0)).toBe('0.00° N · 0.00° E')
  })
  it('is null for non-finite values', () => {
    expect(formatCoords(null, 1)).toBeNull()
    expect(formatCoords(1, NaN)).toBeNull()
    expect(formatCoords(undefined, undefined)).toBeNull()
  })
})

describe('locatorPoint', () => {
  it('keeps the dot inside the frame for extreme values', () => {
    for (const lat of [-85, 0, 85, 90, -90, 500, -500]) {
      for (const lng of [-180, 0, 180, 999, -999]) {
        const { cx, cy } = locatorPoint(lat, lng)
        expect(cx).toBeGreaterThanOrEqual(LOCATOR.inset)
        expect(cx).toBeLessThanOrEqual(LOCATOR.w - LOCATOR.inset)
        expect(cy).toBeGreaterThanOrEqual(LOCATOR.inset)
        expect(cy).toBeLessThanOrEqual(LOCATOR.h - LOCATOR.inset)
      }
    }
  })
  it('projects the equator and prime meridian to the centre, north above south', () => {
    expect(locatorPoint(0, 0)).toEqual({ cx: 60, cy: 30 })
    expect(locatorPoint(45, 0).cy).toBeLessThan(locatorPoint(-45, 0).cy)
    expect(locatorPoint(0, -90).cx).toBeLessThan(locatorPoint(0, 90).cx)
  })
})

describe('specs', () => {
  it('lists length, turns and races for a known circuit', () => {
    expect(cardSpecs(base).map((s) => [s.key, s.value])).toEqual([['length', '5.8'], ['turns', '11'], ['races', '5']])
    // A non-breaking space keeps each spec on one line ("5 races" never splits)
    expect(specsLine(base)).toBe('5.8\u00a0km · 11\u00a0turns · 5\u00a0races')
    expect(specsLine({ ...base, raceCount: 1 })).toBe('5.8\u00a0km · 11\u00a0turns · 1\u00a0race')
  })
  it('drops cells the data lacks', () => {
    expect(cardSpecs({ ...base, id: 'nowhere', raceCount: 0 })).toEqual([])
    expect(cardSpecs({ ...base, id: 'nowhere' }).map((s) => s.key)).toEqual(['races'])
    expect(specsLine({ ...base, id: 'nowhere', raceCount: 0 })).toBe('')
  })
  it('hides races and explains for calendar-only circuits', () => {
    const c = { ...base, id: 'sepang', calendarOnly: true, raceCount: 0 }
    expect(cardSpecs(c).map((s) => s.key)).not.toContain('races')
    expect(specsLine(c)).toBe(NOT_IN_DATA)
  })
})

describe('labels', () => {
  it('describes a card without repeating the name', () => {
    expect(describeCircuit({ ...base, calendarRound: 14 }, 2026, true)).toBe('Permanent, Italy. Last GP 2025. 5 races. Round 14 of the 2026 calendar.')
    expect(describeCircuit({ ...base, raceCount: 1, lastSeason: null, country: '' }, 2026, false)).toBe('Permanent. 1 race. No track outline available.')
    expect(describeCircuit({ ...base, calendarOnly: true, type: 'hybrid' }, 2026, false)).toBe(`Hybrid, Italy. ${NOT_IN_DATA} No track outline available.`)
  })
  it('falls back for missing names and joins the place', () => {
    expect(circuitTitle({ name: '' })).toBe('Unknown circuit')
    expect(circuitTitle({ name: 'Spa' })).toBe('Spa')
    expect(placeLine(base)).toBe('Monza, Italy')
    expect(placeLine({ locality: '', country: 'Italy' })).toBe('Italy')
    expect(placeLine({ locality: '', country: '' })).toBe('')
  })
})

describe('hasOutline', () => {
  it('needs at least 8 clean points', () => {
    expect(hasOutline({ coords: Array.from({ length: 8 }, (_, i) => [i, i]) })).toBe(true)
    expect(hasOutline({ coords: [[1, 1]] })).toBe(false)
    expect(hasOutline({ coords: 'x' })).toBe(false)
  })
})
