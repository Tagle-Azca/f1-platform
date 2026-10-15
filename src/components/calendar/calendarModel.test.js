import { describe, it, expect } from 'vitest'
import {
  parseSeason, seasonOptions, resultsPath, sessionsAt, sessionClock, deriveRoundStatus, markRounds,
  isThisWeekend, roundDate, groupByMonth, winnerName, heroState,
} from './calendarModel'

const t = (s) => Date.parse(s)
const sched = {
  isSprint: false,
  fp1: { date: '2026-10-23', time: '17:30:00Z' },
  fp2: { date: '2026-10-23', time: '21:00:00Z' },
  fp3: { date: '2026-10-24', time: '17:30:00Z' },
  qualifying: { date: '2026-10-24', time: '21:00:00Z' },
  race: { date: '2026-10-25', time: '20:00:00Z' },
}
const mk = (round, o = {}) => ({ season: '2026', round: String(round), raceName: `GP ${round}`, date: '2026-01-01', hasResults: false, hasSprint: false, schedule: null, ...o })

describe('season param (DoD-3)', () => {
  it('accepts years from 1950 to the current year only', () => {
    expect(parseSeason('2023', 2026)).toBe('2023')
    expect(parseSeason('1950', 2026)).toBe('1950')
    expect(parseSeason('2026', 2026)).toBe('2026')
    for (const bad of ['1949', '2027', 'abc', '', '20x3', '02023', null, undefined, ['2023']]) expect(parseSeason(bad, 2026)).toBeNull()
  })
  it('lists every season, newest first', () => {
    const o = seasonOptions(2026)
    expect(o[0]).toEqual({ value: '2026', label: '2026' })
    expect(o.at(-1).value).toBe('1950')
    expect(o).toHaveLength(77)
  })
  it('only builds results paths from digits', () => {
    expect(resultsPath('2025', '7')).toBe('/races/2025/7')
    expect(resultsPath('2025', '../x')).toBeNull()
    expect(resultsPath('20/25', '1')).toBeNull()
  })
})

describe('time zones (DoD-4)', () => {
  const fp1 = '2026-10-23T17:30:00Z'
  it('renders day and HH:MM per zone, including a day rollover', () => {
    expect(sessionClock(fp1, 'UTC')).toEqual({ day: 'Fri', date: 23, time: '17:30' })
    expect(sessionClock(fp1, 'America/Mexico_City')).toEqual({ day: 'Fri', date: 23, time: '11:30' })
    expect(sessionClock(fp1, 'Asia/Tokyo')).toEqual({ day: 'Sat', date: 24, time: '02:30' })
  })
  it('shifts the date stub with the zone for a scheduled round and not for a bare race day', () => {
    const r = mk(18, { schedule: sched })
    expect(roundDate(r, 'UTC').day).toBe('25')
    expect(roundDate({ ...r, schedule: { ...sched, race: { date: '2026-10-25', time: '23:30:00Z' } } }, 'Asia/Tokyo').day).toBe('26')
    expect(roundDate(mk(1, { date: '2023-03-05' }), 'Asia/Tokyo')).toMatchObject({ day: '5', month: 'Mar', monthKey: '2023-03', weekday: 'Sun' })
  })
})

describe('round status (DoD-5)', () => {
  const r = mk(18, { schedule: sched })
  it('is upcoming before the weekend and done after the race ends', () => {
    expect(deriveRoundStatus(r, t('2026-10-20T00:00:00Z'))).toBe('upcoming')
    expect(deriveRoundStatus(r, t('2026-10-25T22:00:00Z'))).toBe('done')
    expect(deriveRoundStatus(r, t('2026-10-25T21:59:00Z'))).toBe('live')
  })
  it('is live mid-session and not live between sessions', () => {
    expect(deriveRoundStatus(r, t('2026-10-24T21:30:00Z'))).toBe('live')
    expect(deriveRoundStatus(r, t('2026-10-24T19:30:00Z'))).toBe('upcoming')
  })
  it('trusts hasResults', () => {
    expect(deriveRoundStatus({ ...r, hasResults: true }, t('2026-10-20T00:00:00Z'))).toBe('done')
  })
  it('falls back to the race date without a schedule', () => {
    expect(deriveRoundStatus(mk(1, { date: '2026-03-01' }), t('2026-10-15T00:00:00Z'))).toBe('done')
    expect(deriveRoundStatus(mk(1, { date: '2026-10-15' }), t('2026-10-15T12:00:00Z'))).toBe('upcoming')
    expect(deriveRoundStatus(mk(1, { date: '2026-12-01' }), t('2026-10-15T00:00:00Z'))).toBe('upcoming')
    expect(deriveRoundStatus(mk(1, { date: '2026-12-01', hasResults: true }), t('2026-10-15T00:00:00Z'))).toBe('done')
  })
  it('marks exactly one next round and everything after it upcoming', () => {
    const races = [mk(1, { date: '2026-03-01' }), mk(2, { date: '2026-10-10' }), mk(3, { schedule: sched }), mk(4, { date: '2026-12-01' })]
    const out = markRounds(races, t('2026-10-20T00:00:00Z'))
    expect(out.map((m) => m.status)).toEqual(['done', 'done', 'next', 'upcoming'])
  })
  it('marks the round with a running session live and never two live/next', () => {
    const races = [mk(1, { date: '2026-03-01' }), mk(3, { schedule: sched }), mk(4, { schedule: { ...sched, race: { date: '2026-11-01', time: '20:00:00Z' }, fp1: { date: '2026-10-24', time: '21:00:00Z' } } })]
    const out = markRounds(races, t('2026-10-24T21:20:00Z'))
    expect(out.map((m) => m.status)).toEqual(['done', 'live', 'upcoming'])
    expect(out.filter((m) => m.status === 'live' || m.status === 'next')).toHaveLength(1)
  })
  it('season finished: all done, no next', () => {
    const out = markRounds([mk(1, { hasResults: true }), mk(2, { hasResults: true })], t('2026-12-30T00:00:00Z'))
    expect(out.every((m) => m.status === 'done')).toBe(true)
    expect(heroState(out, t('2026-12-30T00:00:00Z'), { current: true }).kind).toBe('complete')
  })
  it('never assigns next/live for a past season', () => {
    const out = markRounds([mk(1, { date: '2023-03-05' })], t('2026-10-15T00:00:00Z'), { current: false })
    expect(out[0].status).toBe('done')
    expect(markRounds([mk(1, { date: '2030-03-05' })], t('2026-10-15T00:00:00Z'), { current: false })[0].status).toBe('upcoming')
  })
  it('knows the weekend window', () => {
    const r2 = mk(18, { schedule: sched })
    expect(isThisWeekend(r2, t('2026-10-23T02:00:00Z'))).toBe(true)
    expect(isThisWeekend(r2, t('2026-10-22T23:00:00Z'))).toBe(false)
    expect(isThisWeekend(r2, t('2026-10-26T00:00:00Z'))).toBe(false)
  })
  it('tags sessions done/live/next/upcoming from the given clock', () => {
    expect(sessionsAt(sched, t('2026-10-23T17:45:00Z')).map((s) => s.status)).toEqual(['live', 'next', 'upcoming', 'upcoming', 'upcoming'])
    expect(sessionsAt(null, 0)).toEqual([])
  })
})

describe('hero and grouping', () => {
  it('leads with the next round and its next three sessions', () => {
    const marked = markRounds([mk(17, { hasResults: true }), mk(18, { schedule: sched })], t('2026-10-23T18:30:00Z'))
    const h = heroState(marked, t('2026-10-23T18:30:00Z'), { current: true })
    expect(h).toMatchObject({ kind: 'next', rounds: 2, thisWeekend: true, unpublished: false })
    expect(h.next.key).toBe('fp2')
    expect(h.upcoming).toHaveLength(3)
  })
  it('reports unpublished times and past-season summaries', () => {
    const m = markRounds([mk(18)], t('2026-01-01T00:00:00Z'))
    expect(heroState(m, 0, { current: true }).unpublished).toBe(true)
    expect(heroState([{ race: mk(1, { hasSprint: true }), status: 'done' }, { race: mk(2), status: 'done' }], 0, { current: false })).toEqual({ kind: 'summary', rounds: 2, sprints: 1 })
    expect(heroState([], 0, { current: true }).kind).toBe('empty')
  })
  it('groups rounds by month in order', () => {
    const marked = [mk(1, { date: '2026-03-01' }), mk(2, { date: '2026-03-15' }), mk(3, { date: '2026-04-05' }), mk(4, { date: 'nope' })].map((race) => ({ race, status: 'upcoming' }))
    const g = groupByMonth(marked, 'UTC')
    expect(g.map((x) => [x.label, x.rows.length])).toEqual([['March', 2], ['April', 1], ['Date to be confirmed', 1]])
  })
  it('reads the winner from a result entry, a driver or a string', () => {
    expect(winnerName({ Driver: { givenName: 'Lando', familyName: 'Norris' } })).toBe('Lando Norris')
    expect(winnerName({ givenName: 'Max', familyName: 'Verstappen' })).toBe('Max Verstappen')
    expect(winnerName('Oscar Piastri')).toBe('Oscar Piastri')
    expect(winnerName(null)).toBe('')
    expect(winnerName({ Driver: { givenName: { x: 1 } } })).toBe('')
  })
})
