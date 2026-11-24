// Pure title-clinch maths (no React). Inputs are untrusted API payloads, so every value is validated.
// The rule: the title is clinched at the first complete round where the leader's lead over P2 is bigger than
// the most P2 can still score (per-GP maximum for the season + sprint points for the sprints still to run).
import { asArray, asObjectArray } from '../../utils/safeArray'
import { safeString } from '../../utils/safeText'
import { maxDriverPointsPerGp, maxConstructorPointsPerGp } from './pointsModel'

const SPRINT_MAX = { driver: 8, constructor: 15 } // sprint win; a sprint one-two for a team is 8 + 7
const finite = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

const NO_DATA = Object.freeze({
  status: 'no-data', clinched: false, champion: null, runnerUp: null, clinchRound: null, racesEarly: null,
  margin: 0, pointsToClinch: null, alive: [], leadSeries: [], totalRounds: 0, roundsDone: 0, sprintsKnown: false,
})

/**
 * Sprint points still available to a rival after round `round` (1-based).
 * `sprintRounds` is a list of 1-based round numbers that have a sprint. The standings API does not send
 * this, so it is optional: when missing, no sprint points are counted (`sprintsKnown: false` in the result).
 */
const sprintsAfter = (sprintRounds, round) => sprintRounds.filter((n) => n > round).length

/** Entries sorted by points at index `i`; ties keep the input order (pass the official order to settle them). */
function rankedAt(entries, i) {
  return entries.map((e, order) => ({ e, order, pts: e.cumulative[i] })).sort((a, b) => b.pts - a.pts || a.order - b.order)
}

function normalize(series) {
  return asObjectArray(series).map((s, i) => {
    let prev = 0
    const cumulative = asArray(s.cumulative).map((v) => (prev = typeof v === 'number' && Number.isFinite(v) ? v : prev))
    return { id: safeString(s.id) || safeString(s.driverId) || safeString(s.constructorId) || `entry-${i}`, name: safeString(s.name), cumulative }
  })
}

/**
 * Clinch analysis for the drivers' or constructors' title.
 * @param {object} args
 * @param {object[]} args.series entries { id, name, cumulative:number[] } in official order (same shape as normalizeSeries output)
 * @param {number} args.totalRounds rounds in the season
 * @param {number|string} args.season year, picks the fastest-lap rule (26 max per GP up to 2024, 25 after)
 * @param {'driver'|'constructor'} [args.kind='driver']
 * @param {boolean[]} [args.complete] per-round complete flag (a sprint-only round is false); default: every round counts
 * @param {number[]} [args.sprintRounds] 1-based round numbers with a sprint; default: none known
 * @returns {{ status:'no-data'|'open'|'clinched', clinched:boolean, champion:{id:string,name:string}|null,
 *   runnerUp:{id:string,name:string}|null, clinchRound:number|null, racesEarly:number|null, margin:number,
 *   pointsToClinch:number|null, alive:{id:string,name:string,points:number}[], leadSeries:{round:number,lead:number}[],
 *   totalRounds:number, roundsDone:number, sprintsKnown:boolean }}
 *   margin = lead over P2 now (final margin once clinched); pointsToClinch = extra lead the leader needs (null once clinched);
 *   alive = rivals who can still catch the leader; leadSeries = lead over P2 after each complete round.
 */
export function clinchModel({ series, totalRounds, season, kind = 'driver', complete, sprintRounds } = {}) {
  const entries = normalize(series)
  const total = Math.floor(finite(totalRounds))
  const n = entries.reduce((m, e) => Math.max(m, e.cumulative.length), 0)
  if (entries.length < 2 || total < 1 || n < 1) return NO_DATA
  entries.forEach((e) => { while (e.cumulative.length < n) e.cumulative.push(e.cumulative[e.cumulative.length - 1] ?? 0) })

  const isCtor = kind === 'constructor'
  const perGp = isCtor ? maxConstructorPointsPerGp(season) : maxDriverPointsPerGp(season)
  const sprints = asArray(sprintRounds).filter((v) => Number.isInteger(v) && v > 0)
  const flags = asArray(complete)
  const leadSeries = []
  let done = 0
  let clinchRound = null
  let last = null

  for (let i = 0; i < n && clinchRound === null; i++) {
    if (flags[i] === false) continue
    done += 1
    const [first, second] = rankedAt(entries, i)
    const remaining = Math.max(0, total - done)
    const available = remaining * perGp + sprintsAfter(sprints, i + 1) * (isCtor ? SPRINT_MAX.constructor : SPRINT_MAX.driver)
    const lead = first.pts - second.pts
    last = { i, lead, available, remaining }
    leadSeries.push({ round: i + 1, lead })
    // A points tie after the last race is settled by the official order the caller passes in.
    if (lead > available || (remaining === 0 && done >= total)) clinchRound = i + 1
  }
  if (!last) return NO_DATA
  // Rounds after the clinch still feed the lead chart ("how it was decided" shows the whole season).
  for (let i = last.i + 1; i < n; i++) {
    if (flags[i] === false) continue
    const [first, second] = rankedAt(entries, i)
    leadSeries.push({ round: i + 1, lead: first.pts - second.pts })
    done += 1
  }

  const clinched = clinchRound !== null
  const view = clinched ? rankedAt(entries, n - 1) : rankedAt(entries, last.i)
  const available = clinched ? 0 : last.available
  const leaderPts = view[0].pts
  const pick = (r) => (r ? { id: r.e.id, name: r.e.name } : null)
  return {
    status: clinched ? 'clinched' : 'open',
    clinched,
    champion: clinched ? pick(view[0]) : null,
    runnerUp: pick(view[1]),
    clinchRound,
    racesEarly: clinched ? Math.max(0, total - clinchRound) : null,
    margin: view[0].pts - view[1].pts,
    pointsToClinch: clinched ? null : Math.max(1, available + 1 - last.lead),
    alive: clinched ? [] : view.slice(1).filter((r) => r.pts + available >= leaderPts).map((r) => ({ id: r.e.id, name: r.e.name, points: r.pts })),
    leadSeries,
    totalRounds: total,
    roundsDone: done,
    sprintsKnown: Array.isArray(sprintRounds),
  }
}
