import { SESSION_ORDER, SESSION_LABELS } from './sessionConfig'

const CHIP_LABELS = {
  fp1: 'FP1', fp2: 'FP2', fp3: 'FP3',
  sprintQualifying: 'SprQ', sprint: 'Sprint',
  qualifying: 'Quali', race: 'Race',
}

/**
 * Builds an ordered session list from a nextRace.schedule object, each entry
 * tagged with a status: 'done' | 'next' | 'live' | 'upcoming'.
 * Exactly one session is 'next' (the first not-yet-started one) unless a
 * `currentSession` is in progress, in which case that one is 'live' instead.
 */
export function buildSessionList(schedule, currentSession) {
  if (!schedule || typeof schedule !== 'object') return []
  const now = Date.now()

  const list = SESSION_ORDER
    .filter(key => Object.hasOwn(schedule, key) && schedule[key] && typeof schedule[key] === 'object')
    .map(key => {
      const s = schedule[key]
      // Only string date/time/dateTime are accepted; anything else makes the entry unusable (dropped below).
      const time = typeof s.time === 'string' && s.time ? s.time : '00:00:00'
      const t = time.replace(/Z$/i, '')
      const dateTime = typeof s.dateTime === 'string' && s.dateTime
        ? s.dateTime
        : (typeof s.date === 'string' && s.date ? `${s.date}T${t}Z` : null)
      return { key, label: SESSION_LABELS[key], chip: CHIP_LABELS[key] || key, dateTime }
    })
    .filter(s => s.dateTime && !isNaN(new Date(s.dateTime)))

  let nextAssigned = false
  return list.map(s => {
    const isLiveNow = currentSession?.isLive === true && currentSession.label === s.label
    const isPast = !isLiveNow && new Date(s.dateTime).getTime() <= now
    let status = 'upcoming'
    if (isLiveNow) status = 'live'
    else if (isPast) status = 'done'
    else if (!nextAssigned) { status = 'next'; nextAssigned = true }
    return { ...s, status }
  })
}

/** The session to point a single countdown/hero at — the live one, else the next upcoming one. */
export function getFeaturedSession(schedule, currentSession) {
  const list = buildSessionList(schedule, currentSession)
  return list.find(s => s.status === 'live') ?? list.find(s => s.status === 'next') ?? null
}
