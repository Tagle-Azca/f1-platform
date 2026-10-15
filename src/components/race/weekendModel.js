// Pure race-weekend model (no React): one page for any round, in one of three phases.
//   results  the round has an official classification
//   live     a session of this round is in progress
//   preview  everything else (upcoming rounds, and rounds whose results are not in yet)
// Inputs are untrusted API payloads; only primitives leave this module.
import { asArray } from '../../utils/safeArray'
import { safeString } from '../../utils/safeText'
import { normalizeSchedule } from '../../utils/normalizeDashboard'
import { sessionsAt, winnerName } from '../calendar/calendarModel'
import { isValidWeekendParams, weekendPathFor } from '../../utils/weekendPath'

export { isValidWeekendParams, weekendPathFor }

const SEGMENT = /^\d{1,4}$/

const sameRound = (a, b) => a && b && String(a.season) === String(b.season) && String(a.round) === String(b.round)
const hasRows = (v) => asArray(v).length > 0
const hasSnapshot = (s) => hasRows(s?.classification)

/**
 * @param {object|null} race       GET /api/races/:season/:round
 * @param {object|null} dashNext   normalised dashboard nextRace (live and next session when it is this round)
 * @param {number} now             epoch ms
 */
export function toWeekend(race, dashNext, now = Date.now()) {
  if (!race || typeof race !== 'object') return null
  const loc = race.Circuit?.Location ?? {}
  const results = asArray(race.Results)
  const schedule = normalizeSchedule(race.schedule) ?? (sameRound(race, dashNext) ? dashNext.schedule : null)
  const sessions = sessionsAt(schedule, now)
  const fromDash = sameRound(race, dashNext)

  const live = sessions.find((s) => s.status === 'live') ?? null
  const next = sessions.find((s) => s.status === 'next') ?? null
  const currentSession = fromDash ? dashNext.currentSession : live ? { isLive: true, key: live.key, label: live.label } : null
  const nextSession = fromDash ? dashNext.nextSession : next ? { key: next.key, label: next.label, dateTime: next.dateTime } : null
  const raceEntry = schedule?.race
  const raceDateTime = raceEntry?.dateTime || (raceEntry?.date ? `${raceEntry.date}T${String(raceEntry.time || '00:00:00').replace(/Z$/i, '')}Z` : '')
    || (fromDash ? dashNext.raceDateTime : '') || ''

  const phase = results.length ? 'results' : currentSession?.isLive ? 'live' : 'preview'
  const top = results.find((r) => String(r?.position) === '1') ?? results[0]
  const winner = top ? {
    name: winnerName(top), team: safeString(top.Constructor?.name), constructorId: safeString(top.Constructor?.constructorId),
  } : null

  return {
    phase,
    hero: {
      season: safeString(race.season), round: safeString(race.round), raceName: safeString(race.raceName, 'Grand Prix'),
      circuitId: safeString(race.Circuit?.circuitId), circuit: safeString(race.Circuit?.circuitName),
      locality: safeString(loc.locality), country: safeString(loc.country),
      currentSession, nextSession, raceDateTime, date: safeString(race.date),
    },
    schedule,
    nextSession,
    currentSession,
    circuitId: safeString(race.Circuit?.circuitId),
    isSprint: Boolean(schedule?.sprint || schedule?.sprintQualifying || hasRows(race.SprintResults) || hasRows(race.SprintQualifyingResults) || race.hasSprint),
    hasSessionResults: results.length > 0 || hasRows(race.QualifyingResults) || hasRows(race.SprintResults) || hasRows(race.SprintQualifyingResults) || hasSnapshot(race.raceSnapshot) || hasSnapshot(race.qualifyingSnapshot),
    winner,
  }
}

// ---- session tabs -------------------------------------------------------------------------------------------------

export const SESSION_LABEL = { race: 'Race', quali: 'Qualifying', sprint: 'Sprint', shootout: 'Sprint shootout', practice: 'Practice' }
const ORDER = ['race', 'quali', 'sprint', 'shootout', 'practice']
const PRACTICE_KEYS = ['fp1', 'fp2', 'fp3']

/** Session switch options, only for sessions with data (results, a live-timing snapshot, or a practice that has started). */
export function sessionOptions(race, now = Date.now()) {
  if (!race || typeof race !== 'object') return []
  const schedule = normalizeSchedule(race.schedule)
  const started = sessionsAt(schedule, now).some((s) => PRACTICE_KEYS.includes(s.key) && s.start <= now)
  const has = {
    race: hasRows(race.Results) || hasSnapshot(race.raceSnapshot),
    quali: hasRows(race.QualifyingResults) || hasSnapshot(race.qualifyingSnapshot),
    sprint: hasRows(race.SprintResults),
    shootout: hasRows(race.SprintQualifyingResults),
    practice: started,
  }
  return ORDER.filter((v) => has[v]).map((value) => ({ value, label: SESSION_LABEL[value] }))
}

/** `?session=` value if it is one of the options, else Race (or the first option when there is no race result). */
export function pickSession(raw, options) {
  if (options.some((o) => o.value === raw)) return raw
  return options.find((o) => o.value === 'race')?.value ?? options[0]?.value ?? null
}

// ---- neighbours ---------------------------------------------------------------------------------------------------

/** Previous and next round of the season from its calendar list. Missing list or round gives nulls. */
export function neighbours(calendar, round) {
  const list = asArray(calendar)
    .map((r) => ({ round: safeString(r?.round), name: safeString(r?.raceName) }))
    .filter((r) => SEGMENT.test(r.round))
    .sort((a, b) => Number(a.round) - Number(b.round))
  const i = list.findIndex((r) => r.round === String(Number(round)) || r.round === String(round))
  if (i < 0) return { prev: null, next: null }
  return { prev: list[i - 1] ?? null, next: list[i + 1] ?? null }
}

/** True when the forecast window (16 days) can cover the weekend's first day. */
export function withinForecast(schedule, now = Date.now()) {
  const dates = Object.values(schedule ?? {}).map((s) => s?.date).filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
  if (!dates.length) return null
  const start = dates.reduce((a, b) => (a < b ? a : b))
  const end = dates.reduce((a, b) => (a > b ? a : b))
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((new Date(start) - today) / 86400000)
  return diffDays > 16 ? null : { start, end }
}
