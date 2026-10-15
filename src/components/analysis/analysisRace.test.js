import { describe, it, expect } from 'vitest'
import { analysisRaceFor, analysisHref } from './analysisRace'

const list = [
  { raceId: '2025_9912', round: 9, raceName: 'Spanish Grand Prix' },
  { raceId: '2025_9913', raceName: 'Sprint' },
  { raceId: '2024_8800', round: '9', raceName: 'Spanish Grand Prix' },
]
describe('analysisRaceFor', () => {
  it('matches by season and round', () => {
    expect(analysisRaceFor(list, '2025', '9')?.raceId).toBe('2025_9912')
    expect(analysisRaceFor(list, 2024, 9)?.raceId).toBe('2024_8800')
    expect(analysisRaceFor(list, '2025', '09')?.raceId).toBe('2025_9912')
  })
  it('never matches a sprint without a round, a missing round or another season', () => {
    expect(analysisRaceFor(list, '2025', '10')).toBeNull()
    expect(analysisRaceFor(list, '2023', '9')).toBeNull()
    expect(analysisRaceFor(list, '2025', undefined)).toBeNull()
  })
  it('rejects malformed input', () => {
    expect(analysisRaceFor(list, '../x', '9')).toBeNull()
    expect(analysisRaceFor(list, '2025', '../9')).toBeNull()
    expect(analysisRaceFor(null, '2025', '9')).toBeNull()
    expect(analysisRaceFor([null, {}], '2025', '9')).toBeNull()
  })
})
describe('analysisHref', () => {
  it('builds the link and omits the default view', () => {
    expect(analysisHref(list[0])).toBe('/analysis?race=2025_9912')
    expect(analysisHref(list[0], 'telemetry')).toBe('/analysis?view=telemetry&race=2025_9912')
    expect(analysisHref(null)).toBeNull()
    expect(analysisHref({ raceId: 'bad' })).toBeNull()
  })
})
