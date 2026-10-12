import { describe, it, expect } from 'vitest'
import { safeHttpsUrl, safeColor } from './safeUrl'
import { formatEta } from './eta'
import { diffStatus } from '../hooks/useStatusAnnouncer'

describe('safeHttpsUrl', () => {
  it('accepts https only', () => {
    expect(safeHttpsUrl('https://flagcdn.com/w40/hu.png')).toBe('https://flagcdn.com/w40/hu.png')
    expect(safeHttpsUrl('http://example.com/x.png')).toBeNull()
    expect(safeHttpsUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpsUrl('data:text/html,<script>1</script>')).toBeNull()
    expect(safeHttpsUrl('//evil.com')).toBeNull()
    expect(safeHttpsUrl(null)).toBeNull()
  })
})

describe('safeColor', () => {
  it('accepts plain hex only', () => {
    expect(safeColor('#FF8000')).toBe('#FF8000')
    expect(safeColor('#fff')).toBe('#fff')
    expect(safeColor('red')).toBeNull()
    expect(safeColor('#fff; background:url(x)')).toBeNull()
    expect(safeColor('url(javascript:1)')).toBeNull()
    expect(safeColor(undefined)).toBeNull()
  })
})

describe('formatEta', () => {
  const now = Date.parse('2026-01-01T00:00:00Z')
  it('formats days, hours and minutes at minute resolution', () => {
    expect(formatEta('2026-01-03T03:10:00Z', now)).toBe('in 2d 3h')
    expect(formatEta('2026-01-01T03:20:30Z', now)).toBe('in 3h 20m')
    expect(formatEta('2026-01-01T00:12:59Z', now)).toBe('in 12m')
    expect(formatEta('2025-12-31T00:00:00Z', now)).toBe('starting')
  })
})

describe('diffStatus (screen-reader announcements: status changes only)', () => {
  const a = { sessionName: 'Race', trackStatus: null, classification: [{ driverNum: '1', acronym: 'VER', fullName: 'Max Verstappen' }] }
  it('announces session start/end, flag changes and leader changes', () => {
    expect(diffStatus(null, a)).toMatch(/started/)
    expect(diffStatus(a, null)).toMatch(/ended/)
    expect(diffStatus(a, { ...a, trackStatus: 'Red' })).toBe('Red flag')
    expect(diffStatus({ ...a, trackStatus: 'Red' }, a)).toBe('Track clear')
    expect(diffStatus(a, { ...a, classification: [{ driverNum: '4', acronym: 'NOR', fullName: 'Lando Norris' }] })).toMatch(/Lando Norris/)
  })
  it('stays silent for tick-only changes', () => {
    expect(diffStatus(a, { ...a, currentLap: 5, classification: [{ ...a.classification[0], lastLap: '1:21.0' }] })).toBeNull()
  })
})
