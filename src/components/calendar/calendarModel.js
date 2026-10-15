import { buildSessionList } from '../../utils/sessionSchedule'
import { safeString } from '../../utils/safeText'

/** Approximate session lengths in minutes, used only to tell "in progress" from "done". */
export const SESSION_MIN = { fp1: 60, fp2: 60, fp3: 60, sprintQualifying: 45, sprint: 60, qualifying: 60, race: 120 }
const MIN = 60000
export const FIRST_SEASON = 1950

export const SEASON_NOTE = 'Session times are available for the current season only. Dates for earlier seasons are race day.'

// ---- season param -------------------------------------------------------------------------------------------------

/** A valid `?season=` value ("1950".."currentYear") or null. */
export function parseSeason(raw, currentYear) {
  if (typeof raw !== 'string' || !/^\d{4}$/.test(raw)) return null
  const n = Number(raw)
  return n >= FIRST_SEASON && n <= currentYear ? String(n) : null
}

export function seasonOptions(currentYear) {
  return Array.from({ length: currentYear - FIRST_SEASON + 1 }, (_, i) => {
    const y = String(currentYear - i)
    return { value: y, label: y }
  })
}

const isDigits = (v) => /^\d{1,4}$/.test(String(v ?? ''))

/** Path of the results page, only when season and round are safe path segments. */
export function resultsPath(season, round) {
  return isDigits(season) && isDigits(round) ? `/races/${season}/${round}` : null
}

// ---- sessions -----------------------------------------------------------------------------------------------------

/** Sessions of a schedule with start/end (ms) and a status derived from `now` (not the wall clock). */
export function sessionsAt(schedule, now) {
  const list = buildSessionList(schedule, null).map((s) => {
    const start = Date.parse(s.dateTime)
    return { key: s.key, label: s.label, chip: s.chip, dateTime: s.dateTime, start, end: start + (SESSION_MIN[s.key] ?? 60) * MIN }
  }).sort((a, b) => a.start - b.start)
  let nextDone = false
  return list.map((s) => {
    let status = 'upcoming'
    if (s.start <= now && now < s.end) status = 'live'
    else if (s.end <= now) status = 'done'
    else if (!nextDone) { status = 'next'; nextDone = true }
    return { ...s, status }
  })
}

const raceSession = (list) => list.find((s) => s.key === 'race') ?? list.at(-1) ?? null

/** Day label and HH:MM of an instant in an IANA zone, e.g. { day: 'Sat', date: 24, time: '15:00' }. */
export function sessionClock(dateTime, tz) {
  const d = new Date(dateTime)
  if (Number.isNaN(d.getTime())) return { day: '', date: '', time: '' }
  const part = (opt) => d.toLocaleString('en-US', { timeZone: tz, ...opt })
  return {
    day: part({ weekday: 'short' }),
    date: Number(part({ day: 'numeric' })),
    time: d.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }),
  }
}

// ---- round status -------------------------------------------------------------------------------------------------

const todayUtc = (now) => new Date(now).toISOString().slice(0, 10)

/** 'done' | 'live' | 'upcoming' for one round. ('next' is assigned by markRounds, which sees the whole list.) */
export function deriveRoundStatus(race, now) {
  const list = sessionsAt(race?.schedule, now)
  if (list.length) {
    const end = raceSession(list).end
    if (race.hasResults || end <= now) return 'done'
    return list.some((s) => s.status === 'live') ? 'live' : 'upcoming'
  }
  if (race?.hasResults) return 'done'
  return typeof race?.date === 'string' && race.date < todayUtc(now) ? 'done' : 'upcoming'
}

/**
 * Rounds with a status each: at most one 'live' or 'next' (the first round that is not done) and every other
 * unfinished round 'upcoming'. `current: false` (past seasons) never assigns next/live.
 */
export function markRounds(races, now, { current = true } = {}) {
  let marked = false
  return races.map((race) => {
    const base = deriveRoundStatus(race, now)
    if (base === 'done') return { race, status: 'done' }
    if (!current || marked) return { race, status: 'upcoming' }
    marked = true
    return { race, status: base === 'live' ? 'live' : 'next' }
  })
}

/** True from the start of the first session's UTC day until the race ends. */
export function isThisWeekend(race, now) {
  const list = sessionsAt(race?.schedule, now)
  if (!list.length) return false
  const dayStart = Math.floor(list[0].start / 86400000) * 86400000
  return now >= dayStart && now < raceSession(list).end
}

// ---- display ------------------------------------------------------------------------------------------------------

/** Date shown in the stub: the race session in `tz` when the schedule is known, else the API race day as-is. */
export function roundDate(race, tz) {
  const rs = race?.schedule?.race
  const fromSchedule = rs?.date ? Date.parse(`${rs.date}T${String(rs.time || '00:00:00').replace(/Z$/i, '')}Z`) : NaN
  const useSchedule = Number.isFinite(fromSchedule)
  const t = useSchedule ? fromSchedule : Date.parse(`${race?.date}T00:00:00Z`)
  if (!Number.isFinite(t)) return null
  const zone = useSchedule ? tz : 'UTC'
  const f = (opt) => new Date(t).toLocaleString('en-US', { timeZone: zone, ...opt })
  const year = f({ year: 'numeric' })
  const monthNum = new Date(t).toLocaleString('en-CA', { timeZone: zone, month: '2-digit' })
  return {
    iso: new Date(t).toLocaleDateString('en-CA', { timeZone: zone }),
    day: f({ day: 'numeric' }),
    weekday: f({ weekday: 'short' }),
    month: f({ month: 'short' }),
    monthLabel: f({ month: 'long' }),
    monthKey: `${year}-${monthNum}`,
  }
}

/** Month groups in list order: [{ key, label, rows: [{ race, status, date }] }]. Rounds without a usable date go to 'Date to be confirmed'. */
export function groupByMonth(marked, tz) {
  const groups = []
  for (const m of marked) {
    const date = roundDate(m.race, tz)
    const key = date?.monthKey ?? 'tbc'
    let g = groups.at(-1)
    if (!g || g.key !== key) { g = { key, label: date?.monthLabel ?? 'Date to be confirmed', rows: [] }; groups.push(g) }
    g.rows.push({ ...m, date })
  }
  return groups
}

/** Winner text from a payload that may be a Results entry ({Driver}), a Driver, or a string. Empty when unknown. */
export function winnerName(winner) {
  if (typeof winner === 'string') return winner
  const d = winner && typeof winner === 'object' ? (winner.Driver && typeof winner.Driver === 'object' ? winner.Driver : winner) : null
  if (!d) return ''
  return [safeString(d.givenName), safeString(d.familyName)].filter(Boolean).join(' ')
}

export const hasSchedule = (race) => sessionsAt(race?.schedule, 0).length > 0

/** What the hero leads with. kind: 'live' | 'next' | 'complete' | 'summary' (past season) | 'empty'. */
export function heroState(marked, now, { current }) {
  if (!marked.length) return { kind: 'empty' }
  if (!current) {
    return { kind: 'summary', rounds: marked.length, sprints: marked.filter((m) => m.race.hasSprint).length }
  }
  const m = marked.find((x) => x.status === 'live' || x.status === 'next')
  if (!m) {
    const last = [...marked].reverse().find((x) => x.status === 'done') ?? marked.at(-1)
    return { kind: 'complete', race: last.race, rounds: marked.length }
  }
  const sessions = sessionsAt(m.race.schedule, now)
  const live = sessions.find((s) => s.status === 'live') ?? null
  const upcoming = sessions.filter((s) => s.status === 'next' || s.status === 'upcoming')
  return {
    kind: m.status === 'live' ? 'live' : 'next',
    race: m.race,
    index: marked.indexOf(m),
    rounds: marked.length,
    live,
    next: upcoming[0] ?? null,
    upcoming: upcoming.slice(0, 3),
    thisWeekend: isThisWeekend(m.race, now),
    unpublished: sessions.length === 0,
  }
}
