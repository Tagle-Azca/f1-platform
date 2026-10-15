/**
 * The lap-data race (Cassandra `YYYY_key`) of a championship round, matched by season and round only.
 * Sprints have no round in the list and never match; a missing or malformed input returns null, so a link built from
 * the result is hidden rather than wrong.
 */
export function analysisRaceFor(cassRaces, season, round) {
  const s = String(season ?? '')
  const r = String(round ?? '')
  if (!/^\d{4}$/.test(s) || !/^\d{1,3}$/.test(r) || !Array.isArray(cassRaces)) return null
  return cassRaces.find(x => x && typeof x.raceId === 'string' && x.raceId.startsWith(`${s}_`) && x.round != null && String(x.round) === String(Number(r))) ?? null
}

/** `/analysis?...` for a lap-data race; null when there is none. */
export function analysisHref(race, view = 'pace') {
  if (!race?.raceId || !/^\d{4}_\d+$/.test(race.raceId)) return null
  const q = new URLSearchParams()
  if (view !== 'pace') q.set('view', view)
  q.set('race', race.raceId)
  return `/analysis?${q}`
}
