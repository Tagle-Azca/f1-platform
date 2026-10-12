import { safeText, safeString } from './safeText'
import { asObjectArray } from './safeArray'

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const str = (v) => (typeof v === 'string' ? v : null)

const SESSION_KEYS = ['fp1', 'fp2', 'fp3', 'sprintQualifying', 'sprint', 'qualifying', 'race']

/** Schedule entries keep only string date/time/dateTime; anything else is dropped (never reaches Date parsing). */
export function normalizeSchedule(schedule) {
  if (!isObj(schedule)) return null
  const out = {}
  for (const key of SESSION_KEYS) {
    if (!Object.hasOwn(schedule, key) || !isObj(schedule[key])) continue
    const s = schedule[key]
    const entry = { date: str(s.date), time: str(s.time), dateTime: str(s.dateTime) }
    if (entry.date || entry.dateTime) out[key] = entry
  }
  return out
}

/** The next-race object with only primitives in every field the UI renders or parses. */
export function normalizeNextRace(nr) {
  if (!isObj(nr)) return null
  const cs = isObj(nr.currentSession) ? nr.currentSession : null
  const ns = isObj(nr.nextSession) ? nr.nextSession : null
  return {
    raceName: safeText(nr.raceName), round: safeText(nr.round), season: safeText(nr.season),
    locality: safeText(nr.locality), country: safeText(nr.country), circuit: safeText(nr.circuit),
    circuitId: str(nr.circuitId),
    schedule: normalizeSchedule(nr.schedule),
    currentSession: cs ? { isLive: cs.isLive === true, key: str(cs.key), label: str(cs.label) } : null,
    nextSession: ns ? { key: str(ns.key), label: str(ns.label), dateTime: str(ns.dateTime) } : null,
    raceDateTime: str(nr.raceDateTime),
  }
}

const driverRow = (d) => ({
  position: safeText(d.position), driverId: safeString(d.driverId) || null, name: safeString(d.name),
  team: safeString(d.team), constructorId: safeString(d.constructorId), points: safeText(d.points) ?? 0,
  time: safeText(d.time),
  // Title-fight VS card extras; the URL is checked again (https only) where it renders
  photoUrl: safeString(d.photoUrl) || null, permanentNumber: safeText(d.permanentNumber) ?? null,
})

export function normalizeLastSession(ls) {
  if (!isObj(ls)) return null
  return {
    sessionType: safeString(ls.sessionType), sessionLabel: safeString(ls.sessionLabel), date: str(ls.date),
    season: safeText(ls.season), round: safeText(ls.round), resultsPending: ls.resultsPending === true,
    podium: asObjectArray(ls.podium).map(driverRow), top3: asObjectArray(ls.top3).map(driverRow),
    fastestLap: isObj(ls.fastestLap) ? { name: safeString(ls.fastestLap.name), time: safeString(ls.fastestLap.time) } : null,
  }
}

/** Whole /api/dashboard payload -> renderable primitives. Non-arrays become [], non-objects are dropped. */
export function normalizeDashboard(d) {
  if (!isObj(d)) return null
  return {
    season: safeText(d.season), totalRounds: safeText(d.totalRounds), roundsDone: safeText(d.roundsDone),
    nextRace: normalizeNextRace(d.nextRace),
    standings: asObjectArray(d.standings).map(driverRow),
    constructorStandings: asObjectArray(d.constructorStandings).map(driverRow),
    lastSession: normalizeLastSession(d.lastSession),
  }
}
