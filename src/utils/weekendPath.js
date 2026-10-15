/** Season and round are path segments of /races/:season/:round: 1 to 4 digits each. */
const SEGMENT = /^\d{1,4}$/

export const isValidWeekendParams = (season, round) => SEGMENT.test(String(season ?? '')) && SEGMENT.test(String(round ?? ''))

/** Race weekend path of a dashboard next race ({ season, round }), or the calendar when it is unknown or unsafe. */
export function weekendPathFor(nextRace) {
  const season = nextRace?.season != null ? String(nextRace.season) : ''
  const round = nextRace?.round != null ? String(nextRace.round) : ''
  return isValidWeekendParams(season, round) ? `/races/${season}/${round}` : '/calendar'
}
