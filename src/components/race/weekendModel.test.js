import { describe, it, expect } from 'vitest'
import { toWeekend, isValidWeekendParams, sessionOptions, pickSession, neighbours, withinForecast } from './weekendModel'

const NOW = Date.parse('2026-10-09T10:00:00Z')
const iso = (ms) => new Date(NOW + ms).toISOString()
const D = 86400000, H = 3600000
const sched = (ms) => ({ date: iso(ms).slice(0, 10), time: iso(ms).slice(11, 19) + 'Z', dateTime: iso(ms) })
const upcoming = {
  season: '2026', round: '13', raceName: 'Hungarian Grand Prix', date: iso(3 * D).slice(0, 10),
  Circuit: { circuitId: 'hungaroring', circuitName: 'Hungaroring', Location: { locality: 'Budapest', country: 'Hungary' } },
  schedule: { fp1: sched(1 * D), fp2: sched(1 * D + 4 * H), fp3: sched(2 * D), qualifying: sched(2 * D + 4 * H), race: sched(3 * D + 4 * H) },
}
const done = {
  season: '2026', round: '12', raceName: 'Belgian Grand Prix', date: '2026-07-26',
  Circuit: { circuitId: 'spa', circuitName: 'Spa', Location: { locality: 'Spa', country: 'Belgium' } },
  Results: [
    { position: '2', Driver: { givenName: 'Oscar', familyName: 'Piastri' }, Constructor: { name: 'McLaren', constructorId: 'mclaren' } },
    { position: '1', Driver: { givenName: 'Lando', familyName: 'Norris' }, Constructor: { name: 'McLaren', constructorId: 'mclaren' } },
  ],
  QualifyingResults: [{ position: '1' }],
}
const dash = (over = {}) => ({
  season: '2026', round: '13', schedule: upcoming.schedule, currentSession: null,
  nextSession: { key: 'fp1', label: 'Practice 1', dateTime: iso(1 * D) }, raceDateTime: iso(3 * D + 4 * H), ...over,
})

describe('toWeekend phases (DoD-4)', () => {
  it('preview for an upcoming round: next session from the schedule when the dashboard is another round', () => {
    const w = toWeekend(upcoming, null, NOW)
    expect(w.phase).toBe('preview')
    expect(w.nextSession).toMatchObject({ key: 'fp1', label: 'Practice 1' })
    expect(w.currentSession).toBeNull()
    expect(w.hero).toMatchObject({ raceName: 'Hungarian Grand Prix', round: '13', circuit: 'Hungaroring', locality: 'Budapest' })
    expect(w.hasSessionResults).toBe(false)
    expect(w.winner).toBeNull()
  })
  it('preview uses the dashboard next and current session when it is this round', () => {
    const w = toWeekend(upcoming, dash({ nextSession: { key: 'fp3', label: 'Practice 3', dateTime: iso(2 * D) } }), NOW)
    expect(w.nextSession.key).toBe('fp3')
  })
  it('live when the dashboard says this round has a live session', () => {
    const w = toWeekend(upcoming, dash({ currentSession: { isLive: true, key: 'fp1', label: 'Practice 1' } }), NOW)
    expect(w.phase).toBe('live')
    expect(w.currentSession.label).toBe('Practice 1')
  })
  it('without the dashboard, a session in progress by the schedule is live', () => {
    const w = toWeekend(upcoming, null, NOW + 1 * D + 30 * 60000)
    expect(w.phase).toBe('live')
    expect(w.currentSession).toMatchObject({ isLive: true, key: 'fp1' })
  })
  it('a dashboard for another round never makes this one live', () => {
    const w = toWeekend(upcoming, dash({ round: '14', currentSession: { isLive: true, key: 'race', label: 'Race' } }), NOW)
    expect(w.phase).toBe('preview')
  })
  it('results when the round has a classification, with the winner and session data flag', () => {
    const w = toWeekend(done, null, NOW)
    expect(w.phase).toBe('results')
    expect(w.winner).toEqual({ name: 'Lando Norris', team: 'McLaren', constructorId: 'mclaren' })
    expect(w.hasSessionResults).toBe(true)
  })
  it('a sprint weekend is flagged from the schedule or its results', () => {
    expect(toWeekend({ ...upcoming, schedule: { ...upcoming.schedule, sprint: sched(2 * D + 1 * H) } }, null, NOW).isSprint).toBe(true)
    expect(toWeekend({ ...done, SprintResults: [{ position: '1' }] }, null, NOW).isSprint).toBe(true)
    expect(toWeekend(done, null, NOW).isSprint).toBe(false)
  })
  it('a past-season round without schedule or circuit still yields a results weekend', () => {
    const w = toWeekend({ season: '1950', round: '1', raceName: 'British Grand Prix', date: '1950-05-13', Results: [{ position: '1', Driver: { givenName: 'Nino', familyName: 'Farina' }, Constructor: { name: 'Alfa Romeo' } }] }, null, NOW)
    expect(w.phase).toBe('results')
    expect(w.schedule).toBeNull()
    expect(w.hero.circuitId).toBe('')
    expect(w.hero.locality).toBe('')
  })
  it('a round whose results are not in yet is still a preview', () => {
    expect(toWeekend({ ...done, Results: [] }, null, NOW).phase).toBe('preview')
  })
  it('hostile fields become primitives or empty strings, and a non-object race is null', () => {
    const w = toWeekend({ season: { x: 1 }, round: ['1'], raceName: {}, Circuit: 'x', Results: 'no', schedule: 'no' }, null, NOW)
    expect(w.hero).toMatchObject({ season: '', round: '', raceName: 'Grand Prix' })
    expect(toWeekend(null, null, NOW)).toBeNull()
    expect(toWeekend('x', null, NOW)).toBeNull()
  })
})

describe('isValidWeekendParams', () => {
  it('accepts 1 to 4 digits for both segments only', () => {
    expect(isValidWeekendParams('2025', '1')).toBe(true)
    for (const [s, r] of [['abc', '1'], ['2025', 'x'], ['20250', '1'], ['2025', ''], ['../x', '1'], ['2025', '-1'], [undefined, '1']]) expect(isValidWeekendParams(s, r)).toBe(false)
  })
})

describe('session options', () => {
  it('lists only sessions with data, in the fixed order, defaulting to Race', () => {
    const opts = sessionOptions({ ...done, SprintResults: [{}], SprintQualifyingResults: [{}], schedule: upcoming.schedule }, NOW + 5 * D)
    expect(opts.map((o) => o.value)).toEqual(['race', 'quali', 'sprint', 'shootout', 'practice'])
    expect(pickSession(null, opts)).toBe('race')
    expect(pickSession('shootout', opts)).toBe('shootout')
    expect(pickSession('bogus', opts)).toBe('race')
  })
  it('no practice before the first practice starts, and falls back to Qualifying without a race result', () => {
    const opts = sessionOptions({ ...upcoming, QualifyingResults: [{ position: '1' }] }, NOW)
    expect(opts.map((o) => o.value)).toEqual(['quali'])
    expect(pickSession(null, opts)).toBe('quali')
  })
  it('a live-timing snapshot counts as data; nothing at all gives no options and no default', () => {
    expect(sessionOptions({ raceSnapshot: { classification: [{}] } }, NOW).map((o) => o.value)).toEqual(['race'])
    expect(sessionOptions(upcoming, NOW)).toEqual([])
    expect(pickSession(null, [])).toBeNull()
    expect(sessionOptions(null, NOW)).toEqual([])
  })
})

describe('neighbours', () => {
  const cal = [{ round: '2', raceName: 'B' }, { round: '1', raceName: 'A' }, { round: '3', raceName: 'C' }]
  it('previous and next round in order, absent at the ends and for an unknown round', () => {
    expect(neighbours(cal, '2')).toEqual({ prev: { round: '1', name: 'A' }, next: { round: '3', name: 'C' } })
    expect(neighbours(cal, '1').prev).toBeNull()
    expect(neighbours(cal, '3').next).toBeNull()
    expect(neighbours(cal, '9')).toEqual({ prev: null, next: null })
    expect(neighbours(null, '1')).toEqual({ prev: null, next: null })
  })
})

describe('withinForecast', () => {
  it('only inside the 16 day window', () => {
    expect(withinForecast(upcoming.schedule, NOW)).toMatchObject({ start: expect.any(String), end: expect.any(String) })
    expect(withinForecast({ fp1: { date: '2027-01-01' } }, NOW)).toBeNull()
    expect(withinForecast(null, NOW)).toBeNull()
  })
})
