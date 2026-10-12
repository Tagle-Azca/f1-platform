// Pure helpers behind the circuits UI (hero meta line, back link, record rows, toolbar options).
// Kept out of the component files so those export components only (React fast refresh).
import { NOT_IN_DATA } from './circuitFormat'
import { SORT_LABELS } from './circuitIndexModel'

/** Calendar date like "Sun, 6 September" (UTC, so the day never shifts with the viewer's zone). */
function calendarDay(date) {
  const d = new Date(`${date}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' })
}

/** The meta line: data span and last GP, or the calendar round for circuits we hold no races for. */
export function heroMeta(circuit, span, lastRace) {
  if (span && lastRace) return { kind: 'data', first: span.first, season: lastRace.season, race: lastRace.raceName }
  if (circuit.lastSeason != null && !span) return { kind: 'data', first: null, season: circuit.lastSeason, race: circuit.lastRaceName }
  if (circuit.calendarRound != null) {
    const day = calendarDay(circuit.calendarDate)
    return { kind: 'round', text: `Round ${circuit.calendarRound}${day ? ` · ${day}` : ''}` }
  }
  return { kind: 'none', text: NOT_IN_DATA }
}

/** Back link target: the previous index query when the index handed it over, else a clean /circuits. */
export const backTarget = (from) => (typeof from === 'string' && /^\?[\w%+=&.~*'(),:@-]{0,300}$/.test(from) ? `/circuits${from}` : '/circuits')

const NA = { value: 'n/a', unit: '', detail: 'Not enough data' }

const plural = (n, one, many) => (n === 1 ? one : many)

/** Surnames for a tied record: up to two, then "and N more". */
export function namesLine(drivers) {
  const names = drivers.map((d) => d.name)
  if (names.length <= 2) return names.join(', ')
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`
}

/** The three record tiles as plain text rows; a record without data reads "n/a", never 0. */
export function recordItems(records) {
  const { mostWins, bestGain, dnfRate } = records
  return [
    {
      label: 'Most wins',
      ...(mostWins ? { value: String(mostWins.count), unit: plural(mostWins.count, 'win', 'wins'), detail: namesLine(mostWins.drivers) } : NA),
    },
    {
      label: 'Best gain',
      ...(bestGain
        ? { value: `+${bestGain.gain}`, unit: plural(bestGain.gain, 'place', 'places'), detail: `${bestGain.name}, ${bestGain.season}. P${bestGain.grid} to P${bestGain.position}` }
        : NA),
    },
    {
      label: 'DNF rate',
      ...(dnfRate ? { value: `${dnfRate.pct}%`, unit: '', detail: `${dnfRate.dnfs} of ${dnfRate.starts} starts` } : NA),
    },
  ]
}

export const TYPE_OPTIONS = [
  { value: '', label: 'All' }, { value: 'permanent', label: 'Permanent' }, { value: 'street', label: 'Street' }, { value: 'hybrid', label: 'Hybrid' },
]

export const sortOptions = (hasCalendar) => (hasCalendar ? ['calendar', 'az', 'races', 'last'] : ['az', 'races', 'last'])
  .map((value) => ({ value, label: SORT_LABELS[value] }))
export const regionOptions = (regions) => [{ value: '', label: 'All regions' }, ...regions.map((r) => ({ value: r, label: r }))]
