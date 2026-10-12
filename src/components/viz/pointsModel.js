import { asObjectArray } from '../../utils/safeArray'
import { safeString } from '../../utils/safeText'

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

const FIRST_SEASON = 1950
const LAST_FASTEST_LAP_SEASON = 2024 // the fastest-lap point was abolished from 2025

/**
 * Most points one driver can score in a Grand Prix (sprints excluded):
 * 26 up to 2024 (25 for the win + 1 for fastest lap), 25 from 2025.
 * A missing or invalid season uses the current rule (25).
 */
export function maxDriverPointsPerGp(season) {
  const n = typeof season === 'string' && season.trim() === '' ? NaN : Number(season)
  return Number.isInteger(n) && n >= FIRST_SEASON && n <= LAST_FASTEST_LAP_SEASON ? 26 : 25
}

/** Most points a team can score in a Grand Prix: a one-two (25 + 18) plus the driver-rule extras. */
export function maxConstructorPointsPerGp(season) {
  return maxDriverPointsPerGp(season) + 18
}

/** Normalized top rows + the shared scale. Exported so the card sentence and the bars use the same numbers. */
export function titleFightModel(standings, totalRounds, roundsDone, season) {
  const rows = asObjectArray(standings).slice(0, 3).map((d, i) => ({
    position: i + 1,
    driverId: safeString(d.driverId) || null,
    name: safeString(d.name),
    team: safeString(d.team),
    constructorId: safeString(d.constructorId),
    points: num(d.points),
    // Display extras for the VS card; validated again where they are used
    photoUrl: safeString(d.photoUrl) || null,
    permanentNumber: d.permanentNumber != null && d.permanentNumber !== '' ? safeString(String(d.permanentNumber)) || null : null,
  }))
  const total = num(totalRounds)
  const remaining = total && typeof roundsDone === 'number' ? Math.max(0, total - num(roundsDone)) : 0
  const inPlay = remaining * maxDriverPointsPerGp(season)
  const gap = rows.length > 1 ? rows[0].points - rows[1].points : 0
  return { rows, remaining, inPlay, gap, final: total > 0 && remaining === 0, decided: rows.length > 1 && inPlay <= gap }
}
