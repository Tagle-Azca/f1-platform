// Pure model for the circuit detail page: results by season, records and the data span.
// Feed values are untrusted: non-array races become [], non-object entries are dropped, names fall back to "Unknown".
import { asObjectArray } from '../../utils/safeArray'

const obj = (v) => (v !== null && typeof v === 'object' ? v : {})
const text = (v) => (typeof v === 'string' ? v : '')
const int = (v) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) ? Math.trunc(n) : null
}

/** A result is a DNF unless it is "Finished" or a lapped finish ("+1 Lap"). Shared with CircuitDNAPanel. */
export function isDnf(status) {
  const s = status || ''
  return s !== 'Finished' && !/^\+\d+/.test(s)
}

/** Races as an array of objects whose `Results` are arrays of objects. */
export function normalizeRaces(races) {
  return asObjectArray(races).map((r) => ({ ...r, Results: asObjectArray(r.Results) }))
}

function person(res) {
  const d = obj(res.Driver)
  const family = text(d.familyName).trim()
  const given = text(d.givenName).trim()
  const name = family || given || 'Unknown'
  return {
    driverId: text(d.driverId),
    name,
    fullName: [given, family].filter(Boolean).join(' ') || 'Unknown',
    code: text(d.code),
  }
}

const teamOf = (res) => {
  const c = obj(res.Constructor)
  return { constructorId: text(c.constructorId), team: text(c.name) }
}

/** Seasons newest first (round breaks ties); one entry per race in the data. */
export function resultsByYear(races) {
  return normalizeRaces(races)
    .map((r) => {
      const results = r.Results
      const podium = results
        .map((res) => ({ res, pos: int(res.position) }))
        .filter((x) => x.pos !== null && x.pos >= 1 && x.pos <= 3)
        .sort((a, b) => a.pos - b.pos)
        .slice(0, 3)
        .map(({ res, pos }) => ({ pos, ...person(res), ...teamOf(res) }))
      const pole = results.find((res) => text(res.grid) === '1' || res.grid === 1)
      const winner = results.find((res) => int(res.position) === 1)
      const winnerGrid = winner ? int(winner.grid) : null
      return {
        season: int(r.season),
        round: int(r.round),
        raceName: text(r.raceName),
        date: text(r.date),
        hasResult: results.length > 0,
        podium,
        poleSitter: pole ? { ...person(pole), pos: int(pole.position) } : null,
        poleToWin: winnerGrid === 1,
        winnerGrid,
      }
    })
    .sort((a, b) => (b.season ?? -1) - (a.season ?? -1) || (b.round ?? -1) - (a.round ?? -1))
}

/** Most wins (tie-aware), best grid-to-finish gain and DNF rate. Each is null when the data cannot support it. */
export function circuitRecords(races) {
  const list = normalizeRaces(races)

  const wins = new Map()
  for (const r of list) {
    const w = r.Results.find((res) => int(res.position) === 1)
    if (!w) continue
    const p = person(w)
    if (!p.driverId) continue
    const cur = wins.get(p.driverId)
    wins.set(p.driverId, { driverId: p.driverId, name: p.name, count: (cur?.count ?? 0) + 1 })
  }
  let mostWins = null
  if (wins.size) {
    const top = Math.max(...[...wins.values()].map((w) => w.count))
    const drivers = [...wins.values()].filter((w) => w.count === top).sort((a, b) => a.name.localeCompare(b.name))
    mostWins = { drivers, count: top }
  }

  let bestGain = null
  for (const r of list) {
    const season = int(r.season) ?? -1
    const round = int(r.round) ?? -1
    for (const res of r.Results) {
      const grid = int(res.grid)
      const position = int(res.position)
      if (grid === null || grid <= 0 || position === null || position < 1 || isDnf(res.status)) continue
      const gain = grid - position
      if (gain <= 0) continue
      const recent = bestGain && (season > bestGain.season || (season === bestGain.season && round > bestGain.round))
      if (!bestGain || gain > bestGain.gain || (gain === bestGain.gain && recent)) {
        const p = person(res)
        bestGain = { driverId: p.driverId, name: p.name, season, round, grid, position, gain }
      }
    }
  }

  const starts = list.reduce((n, r) => n + r.Results.length, 0)
  const dnfs = list.reduce((n, r) => n + r.Results.filter((res) => isDnf(res.status)).length, 0)
  const dnfRate = starts ? { dnfs, starts, pct: Math.round((dnfs / starts) * 100) } : null

  return { mostWins, bestGain, dnfRate }
}

/** First and last season in the data and the race count; null with no dated races. */
export function dataSpan(races) {
  const list = normalizeRaces(races)
  const seasons = list.map((r) => int(r.season)).filter((s) => s !== null)
  if (!seasons.length) return null
  return { first: Math.min(...seasons), last: Math.max(...seasons), count: list.length }
}
