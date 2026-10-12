// Pure standings model (no React). Same split as tires/strategyModel.js: the page and the
// components only read what this module computes, so the maths is unit-tested in one place.
// All inputs are untrusted API payloads: strings and numbers are validated, lookups are own-property.
import { asArray, asObjectArray } from '../../utils/safeArray'
import { safeString } from '../../utils/safeText'
import { codeFromName } from '../../utils/driverCode'
import { markTeammateDash } from '../../utils/standingsUtils'
import { CTOR_COLORS, ctorColor, ctorCode } from '../../utils/teamColors'
import { maxDriverPointsPerGp, maxConstructorPointsPerGp } from '../viz/pointsModel'

const finite = (v, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const hasOwn = (o, k) => typeof k === 'string' && Object.hasOwn(o, k)

/** Last word of a full name, or the whole name when it is a single word. */
export const surnameOf = (name) => safeString(name).trim().split(/\s+/).pop() || 'Unknown'

/** Gap to the leader as text: "-8", and "0" (never "-0") for a tie on points. */
export const gapLabel = (gap) => (gap > 0 ? `-${gap}` : '0')

/** Rounds in the payload, in order, with validated fields. */
export function normalizeRounds(payload) {
  return asObjectArray(payload?.rounds).map((r, i) => ({
    index: i,
    round: safeString(r.round) || String(i + 1),
    raceName: safeString(r.raceName),
    date: safeString(r.date),
    complete: r.complete !== false, // an older backend sends no flag: every round counts as complete
    hasFlag: typeof r.complete === 'boolean',
  }))
}

/**
 * Drivers and constructors payloads become the same Series shape.
 * `cumulative` is carried forward / trimmed to the number of rounds so every index is defined.
 * @returns {{ id:string, kind:'driver'|'constructor', name:string, surname:string, code:string, team:string, teamKey:string,
 *   color:string, number:string, wins:number, cumulative:number[], total:number, dash:boolean }[]}
 */
export function normalizeSeries(raw, view = 'drivers') {
  const isDrivers = view !== 'constructors'
  const list = asObjectArray(isDrivers ? raw?.drivers : raw?.constructors)
  const roundCount = asArray(raw?.rounds).length
  const longest = list.reduce((m, e) => Math.max(m, asArray(e.cumulative).length), 0)
  const n = roundCount || longest

  const seen = new Set()
  const series = list.map((e, i) => {
    let id = safeString(isDrivers ? e.driverId : e.constructorId) || `${isDrivers ? 'driver' : 'constructor'}-${i}`
    if (seen.has(id)) id = `${id}-${i}`
    seen.add(id)
    const name = safeString(e.name).trim() || 'Unknown'
    const teamKey = isDrivers ? safeString(e.teamId) : id
    const team = isDrivers ? safeString(e.team) : name
    const src = asArray(e.cumulative)
    const cumulative = []
    let prev = 0
    for (let r = 0; r < n; r++) {
      const v = finite(src[r], null)
      prev = v === null ? prev : v
      cumulative.push(prev)
    }
    const color = ctorColor(hasOwn(CTOR_COLORS, teamKey) ? teamKey : '')
    return {
      id,
      kind: isDrivers ? 'driver' : 'constructor',
      name,
      surname: isDrivers ? surnameOf(name) : name,
      code: isDrivers ? codeFromName(name) : (hasOwn(CTOR_COLORS, teamKey) ? ctorCode(teamKey) : null) ?? codeFromName(name),
      team,
      teamKey,
      color,
      number: safeString(e.number),
      official: typeof e.officialPosition === 'number' && e.officialPosition > 0 ? e.officialPosition : null,
      wins: Math.max(0, finite(e.wins)),
      cumulative,
      total: cumulative.length ? cumulative[cumulative.length - 1] : 0,
      dash: false,
    }
  })
  if (!isDrivers) return series
  const dashed = new Set(markTeammateDash(series.filter(s => s.teamKey), 'teamKey').filter(s => s.dash).map(s => s.id))
  return series.map(s => ({ ...s, dash: dashed.has(s.id) }))
}

const rankCache = new WeakMap()

function rankFresh(series, round) {
  const n = series[0]?.cumulative.length ?? 0
  const r = Math.min(Math.max(1, Math.floor(finite(round, 1))), Math.max(1, n))
  const at = (s, k) => s.cumulative[k - 1] ?? 0
  const sorted = [...series]
    .map(s => ({ s, pts: at(s, r) }))
    .sort((a, b) => b.pts - a.pts || (a.s.official && b.s.official ? a.s.official - b.s.official : 0) || b.s.wins - a.s.wins || b.s.total - a.s.total || a.s.name.localeCompare(b.s.name) || (a.s.id < b.s.id ? -1 : 1))
  return { r, sorted }
}

/**
 * Standings after `round` (1-based, clamped). Ties break on points, then the official order (the backend's wins countback), then wins, the final total and the name,
 * so the order is deterministic and every position is unique.
 * `delta` = places gained since the previous round (0 at round 1).
 * @returns {(object)[]} rows: { ...series, pos, pts, gap, delta }
 */
export function rankAt(series, round) {
  if (!series.length) return []
  const { r, sorted } = rankFresh(series, round)
  let cache = rankCache.get(series)
  if (!cache) { cache = new Map(); rankCache.set(series, cache) }
  if (cache.has(r)) return cache.get(r)
  const prevPos = new Map()
  if (r > 1) rankFresh(series, r - 1).sorted.forEach((x, i) => prevPos.set(x.s.id, i + 1))
  const leader = sorted[0].pts
  const rows = sorted.map((x, i) => ({
    ...x.s, pos: i + 1, pts: x.pts, gap: leader - x.pts, delta: r > 1 ? prevPos.get(x.s.id) - (i + 1) : 0,
  }))
  cache.set(r, rows)
  return rows
}

/** Rank of every entry after every round, for the bump chart: { id, positions: number[] }[] in series order. */
export function positionsByRound(series) {
  const n = series[0]?.cumulative.length ?? 0
  const map = new Map(series.map(s => [s.id, []]))
  for (let r = 1; r <= n; r++) rankAt(series, r).forEach(row => map.get(row.id).push(row.pos))
  return series.map(s => ({ id: s.id, positions: map.get(s.id) }))
}

/** Points scored in each round. Penalties can make a delta negative; those are clamped to 0. */
export function pointsPerRound(cumulative) {
  const c = asArray(cumulative).map(v => finite(v))
  return c.map((v, i) => Math.max(0, v - (i ? c[i - 1] : 0)))
}

/** True when a negative per-round delta (a points deduction) was clamped by `pointsPerRound`. */
export function hasPenalty(cumulative) {
  const c = asArray(cumulative).map(v => finite(v))
  return c.some((v, i) => v - (i ? c[i - 1] : 0) < 0)
}

/**
 * Detail strip for one entry, as of `round` (default: the last round).
 * `perRound` always covers the whole season so the sparkline can dim the future.
 * teammate: drivers only (null for constructors or a driver alone on a team); ahead: constructors only (null for the leader).
 */
export function rowDetail(series, id, round) {
  const s = series.find(x => x.id === id)
  if (!s) return null
  const n = s.cumulative.length
  const r = Math.min(Math.max(1, Math.floor(finite(round, n))), Math.max(1, n))
  const perRound = pointsPerRound(s.cumulative)
  const upTo = perRound.slice(0, r)
  let bestRound = null
  upTo.forEach((pts, i) => { if (!bestRound || pts > bestRound.pts) bestRound = { round: i + 1, pts } })
  const last5 = upTo.slice(-5)
  const rows = rankAt(series, r)
  const me = rows.find(x => x.id === id)
  let teammate = null
  let ahead = null
  if (s.kind === 'driver' && s.teamKey) {
    const mate = rows.filter(x => x.id !== id && x.teamKey === s.teamKey).sort((a, b) => b.pts - a.pts)[0]
    if (mate) teammate = { id: mate.id, name: mate.name, surname: mate.surname, code: mate.code, color: mate.color, pts: mate.pts, diff: me.pts - mate.pts }
  }
  if (s.kind === 'constructor' && me && me.pos > 1) {
    const up = rows[me.pos - 2]
    ahead = { id: up.id, name: up.name, gap: up.pts - me.pts }
  }
  return {
    perRound, bestRound, last5, last5Sum: last5.reduce((a, b) => a + b, 0),
    teammate, ahead, penalty: hasPenalty(s.cumulative),
  }
}

/**
 * Season facts from the drivers payload (it carries the round metadata for both views).
 * roundsDone counts rounds with complete === true; a payload without the flag counts every round.
 * A sprint-only entry is an incomplete round that already carries points.
 */
export function seasonStatus(payload, { current = false } = {}) {
  const rounds = normalizeRounds(payload)
  const completeFlags = rounds.map(r => r.complete)
  const doneThrough = []
  completeFlags.reduce((acc, c, i) => { doneThrough[i] = acc + (c ? 1 : 0); return doneThrough[i] }, 0)
  const roundsDone = doneThrough.length ? doneThrough[doneThrough.length - 1] : 0
  const rawTotal = payload?.totalRounds
  const knownTotal = typeof rawTotal === 'number' && Number.isFinite(rawTotal) && rawTotal > 0
  const totalRounds = knownTotal ? Math.floor(rawTotal) : rounds.length
  const remaining = Math.max(0, totalRounds - roundsDone)
  const partial = !current && knownTotal && roundsDone < totalRounds
  const sprintOnly = new Set()
  const entries = asObjectArray(payload?.drivers)
  rounds.forEach((r, i) => {
    if (r.complete) return
    if (entries.some(e => { const c = asArray(e.cumulative); return finite(c[i]) > (i ? finite(c[i - 1]) : 0) })) sprintOnly.add(i)
  })
  return {
    roundsDone, totalRounds, knownTotal, remaining, partial,
    chipLabel: partial ? `${roundsDone} of ${totalRounds} rounds` : null,
    sprintOnly, doneThrough, count: rounds.length,
  }
}

/** Complete rounds among the first `round` (1-based) rounds. */
export function doneAt(status, round) {
  const r = Math.floor(finite(round, 0))
  if (r < 1 || !status.doneThrough.length) return 0
  return status.doneThrough[Math.min(r, status.doneThrough.length) - 1]
}

/** Replay label for round index `i` (0-based): "R12/22" (compact) or "R12 · British GP" / "R17 · Singapore GP, sprint". */
export function roundLabel(rounds, i, { compact = false, total, sprintOnly } = {}) {
  const list = asObjectArray(rounds)
  const r = list[i]
  if (!r) return ''
  const num = safeString(r.round) || String(i + 1)
  if (compact) return `R${num}/${total ?? list.length}`
  const name = safeString(r.raceName).trim()
  if (!name) return `R${num}`
  return `R${num} · ${name}${sprintOnly?.has(i) ? ', sprint' : ''}`
}

/** Text for aria-valuetext and announcements: "After round 12, British GP" (", sprint" for a sprint-only entry). */
export function roundText(rounds, i, { sprintOnly } = {}) {
  const r = asObjectArray(rounds)[i]
  if (!r) return ''
  const name = safeString(r.raceName).trim()
  return `After round ${safeString(r.round) || i + 1}${name ? `, ${name}` : ''}${sprintOnly?.has(i) ? ', sprint' : ''}`
}

/**
 * Hero numbers for the rows at one replay round.
 * `roundsDone` = complete rounds among the first r; remaining = totalRounds - roundsDone.
 * `atEnd` = the replay is on the last round. kind is 'champion' only at the end of a finished season.
 * With no known total (`totalRounds` null) any past season counts as finished.
 */
export function heroModel(rows, { view = 'drivers', season, current = false, totalRounds = null, roundsDone = 0, atEnd = true } = {}) {
  const podium = rows.slice(0, 3)
  const total = typeof totalRounds === 'number' && Number.isFinite(totalRounds) && totalRounds > 0 ? totalRounds : null
  const remaining = total === null ? 0 : Math.max(0, total - roundsDone)
  const perGp = view === 'constructors' ? maxConstructorPointsPerGp(season) : maxDriverPointsPerGp(season)
  const inPlay = remaining * perGp
  const gap = podium.length > 1 ? podium[0].pts - podium[1].pts : 0
  const finished = !current && (total === null || roundsDone === total)
  const kind = finished && atEnd ? 'champion' : 'fight'
  const contenders = new Set(inPlay > 0 ? rows.filter(r => r.gap <= inPlay).map(r => r.id) : rows.map(r => r.id))
  return {
    kind, podium, margin: gap, gap, perGp, remaining, inPlay,
    decided: podium.length > 1 && inPlay <= gap,
    marksOut: inPlay > 0, contenders,
  }
}

/**
 * Visible rank domain for the Position chart.
 * Capped to `cap` ranks unless showAll; widens to the selected entry's worst rank across all rounds.
 * Hover never widens it.
 */
export function chartCap(series, { cap = 10, showAll = false, selectedId = null, positions } = {}) {
  const total = series.length
  if (showAll || total <= cap) return { max: total, total, capped: false }
  let max = cap
  if (selectedId != null) {
    const mine = (positions ?? positionsByRound(series)).find(p => p.id === selectedId)
    if (mine?.positions.length) max = Math.max(max, ...mine.positions)
  }
  max = Math.min(max, total)
  return { max, total, capped: max < total }
}

/** probe results: [{ year, payload }]; returns the years with at least one round, newest first. */
export function discoverSeasons(probeResults) {
  return asObjectArray(probeResults)
    .filter(p => asArray(p.payload?.rounds).length > 0 && Number.isFinite(Number(p.year)))
    .map(p => Number(p.year))
    .sort((a, b) => b - a)
}
