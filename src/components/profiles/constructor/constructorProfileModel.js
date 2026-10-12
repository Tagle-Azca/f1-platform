// Pure constructor profile model (no React). Inputs are untrusted API payloads, validated here once.
import { asArray, asObjectArray } from '../../../utils/safeArray'
import { safeString } from '../../../utils/safeText'
import { CTOR_COLORS, ctorColor, ctorCode } from '../../../utils/teamColors'
import { isValidEntityId, initialsOf } from '../entityId'
import { rangeLabel, pct } from '../driver/driverProfileModel'

const fin = (v) => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n + 0 : null // "+ 0" turns -0 into 0
}
const count = (v) => Math.max(0, Math.floor(fin(v) ?? 0))
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true })
const one = (n) => n.toFixed(1)

/** Code and colour for a team id and name (initials and grey for a team the palette does not know). */
export function teamIdentity(id, name) {
  const known = typeof id === 'string' && Object.hasOwn(CTOR_COLORS, id)
  return { code: (known ? ctorCode(id) : null) ?? initialsOf(safeString(name)), color: ctorColor(known ? id : '') }
}

/** Header facts for the hero and the drawer. */
export function teamMeta(payload, id = '') {
  const p = payload && typeof payload === 'object' ? payload : {}
  const teamId = safeString(p.constructorId) || id
  const name = safeString(p.name).trim() || 'Unknown team'
  const stats = p.stats && typeof p.stats === 'object' ? p.stats : {}
  return {
    id: teamId, name,
    ...teamIdentity(teamId, name),
    firstSeason: fin(stats.firstSeason), lastSeason: fin(stats.lastSeason),
    range: rangeLabel(stats.firstSeason, stats.lastSeason),
  }
}

/** Titles line for the hero. `null` when the payload has no title data (the line is omitted, never "0"). */
export function titlesLine(stats) {
  const s = stats && typeof stats === 'object' ? stats : {}
  const n = fin(s.championships)
  if (n === null) return null
  const years = asArray(s.championSeasons).map((y) => safeString(y)).filter((y) => /^\d{4}$/.test(y))
  if (n <= 0) return { count: 0, years: [], text: "No constructors' titles since 2022." }
  return { count: n, years, text: `Constructors' titles since 2022: ${n}`, yearsText: years.length ? `(${years.join(', ')})` : '' }
}

/** Primary and secondary figures. A datum that is not finite is omitted with its cell. */
export function kpis(stats) {
  const s = stats && typeof stats === 'object' ? stats : {}
  const primary = [['championships', 'Titles'], ['wins', 'Wins'], ['podiums', 'Podiums'], ['poles', 'Poles']]
    .map(([key, label]) => ({ key, label, value: fin(s[key]) })).filter((p) => p.value !== null)
    .map((p) => ({ ...p, value: Math.max(0, p.value) }))
  const secondary = []
  const add = (key, label, v, text) => { if (v !== null) secondary.push({ key, label, value: v, text }) }
  const int = (k) => { const v = fin(s[k]); return v === null ? null : Math.max(0, Math.round(v)) }
  add('seasons', 'Seasons in data', int('seasons'), String(int('seasons')))
  add('races', 'Races', int('races'), String(int('races')))
  add('points', 'Points', int('points'), String(int('points')))
  const fr = fin(s.reliability)
  add('finishRate', 'Finish rate', fr, fr === null ? '' : pct(Math.min(100, Math.max(0, fr))))
  return { primary, secondary }
}

export const FINISH_RATE_DEFINITION = 'Finish rate: share of car starts classified at the finish, 2022–2026.'

/** Season history rows, newest first, with a share bar against the team's best season. */
export function seasonHistory(seasons) {
  const rows = asObjectArray(seasons).map((s) => ({
    season: fin(s.season),
    wins: count(s.wins), points: Math.max(0, fin(s.points) ?? 0), races: count(s.races),
    champion: s.champion === true,
    drivers: asObjectArray(s.drivers).map((d) => ({ id: safeString(d.id), name: safeString(d.name).trim() || 'Unknown', wins: count(d.wins), points: Math.max(0, fin(d.points) ?? 0) })),
  })).filter((r) => r.season !== null)
  rows.sort((a, b) => b.season - a.season)
  const best = rows.reduce((m, r) => Math.max(m, r.points), 0)
  return rows.map((r) => ({ ...r, best }))
}

/** The team's seasons, newest first, as numbers. */
export const seasonList = (seasons) => seasonHistory(seasons).map((r) => r.season)

/** `?season=` must be one of the team's seasons; anything else means the latest. */
export function parseSeasonParam(raw, available) {
  const list = asArray(available)
  const n = typeof raw === 'string' && /^\d{4}$/.test(raw) ? Number(raw) : null
  return n !== null && list.includes(n) ? n : (list[0] ?? null)
}

/** The drivers of the latest season, for the hero. */
export function latestDrivers(seasons) {
  const latest = seasonHistory(seasons)[0]
  if (!latest) return { season: null, drivers: [] }
  const drivers = [...latest.drivers].sort((a, b) => b.points - a.points || collator.compare(a.name, b.name))
  return { season: latest.season, drivers }
}

/**
 * Drivers by season for the swimlane. One lane per driver, one column per season (oldest first).
 * `spans` are runs of consecutive seasons with the team (a gap year splits a lane into two bars).
 */
export function tenureRows(seasons) {
  const hist = [...seasonHistory(seasons)].reverse()
  const columns = hist.map((h) => h.season)
  const lanes = new Map()
  hist.forEach((h, col) => {
    for (const d of h.drivers) {
      const key = isValidEntityId(d.id) ? d.id : `name:${d.name}`
      if (!lanes.has(key)) lanes.set(key, { id: isValidEntityId(d.id) ? d.id : '', name: d.name, cells: columns.map(() => null), total: 0, first: col })
      const lane = lanes.get(key)
      lane.cells[col] = { season: h.season, points: d.points, wins: d.wins }
      lane.total += d.points
    }
  })
  const rows = [...lanes.values()].map((lane) => {
    const spans = []
    lane.cells.forEach((cell, i) => {
      if (!cell) return
      const last = spans[spans.length - 1]
      if (last && last.start + last.len === i) last.len += 1
      else spans.push({ start: i, len: 1 })
    })
    return { ...lane, spans }
  })
  rows.sort((a, b) => a.first - b.first || b.total - a.total || collator.compare(a.name, b.name))
  return { columns, rows }
}

/**
 * Team DNA: four literal rates on a 0-100 scale (races with a pole, a win, a podium; classified car entries).
 * Fewer than 5 races returns null (the "Not enough results" state).
 */
export function dnaScores(stats) {
  const s = stats && typeof stats === 'object' ? stats : {}
  const races = fin(s.races)
  if (races === null || races < 5) return null
  const rate = (n) => {
    const v = fin(n)
    return v === null ? null : Math.min(100, Math.max(0, Math.round((v / races) * 1000) / 10))
  }
  const rows = [
    { key: 'pole', label: 'Pole rate', value: rate(s.poles), detail: `${count(s.poles)} of ${count(races)} races` },
    { key: 'win', label: 'Win rate', value: rate(s.wins), detail: `${count(s.wins)} of ${count(races)} races` },
    { key: 'podium', label: 'Podium rate', value: rate(s.podiums), detail: `${count(s.podiums)} of ${count(races)} races` },
  ]
  const fr = fin(s.reliability)
  rows.push({ key: 'finish', label: 'Finish rate', value: fr === null ? null : Math.min(100, Math.max(0, Math.round(fr * 10) / 10)), detail: 'classified car starts' })
  const out = rows.filter((r) => r.value !== null)
  return out.length ? out : null
}

export const DNA_CAPTION = "Share of the team's 2022–2026 races with a pole, a win or a podium. Finish rate is the share of car starts classified at the finish."

/**
 * Points progress: cumulative points by round for the selected season against the previous one.
 * `current` / `previous` are constructor standings payloads. Returns null without the team's current line.
 */
export function progressSeries(current, previous, constructorId) {
  const line = (payload) => asObjectArray(payload?.constructors).find((c) => c.constructorId === constructorId)
  const cur = line(current)
  const curCum = asArray(cur?.cumulative).map(fin)
  if (!cur || !curCum.length || curCum.every((v) => v === null)) return null
  const prevCum = asArray(line(previous)?.cumulative).map(fin)
  const rounds = asObjectArray(current?.rounds)
  let carry = 0
  const cumulative = curCum.map((v) => (carry = v === null ? carry : v))
  const rows = cumulative.map((v, i) => ({
    round: safeString(rounds[i]?.round) || String(i + 1),
    name: safeString(rounds[i]?.raceName),
    current: v,
    previous: prevCum[i] ?? null,
  }))
  const n = rows.length
  const currentFinal = rows[n - 1].current
  const prevAt = rows[n - 1].previous
  return {
    rows, hasPrevious: prevCum.some((v) => v !== null), roundsDone: n,
    currentFinal, previousAtSame: prevAt, diff: prevAt === null ? null : currentFinal - prevAt,
  }
}

/** m:ss.s lap time label. */
export function lapLabel(seconds) {
  const s = fin(seconds)
  if (s === null || s <= 0) return ''
  const m = Math.floor(s / 60)
  const rest = s - m * 60
  return `${m}:${rest < 10 ? '0' : ''}${rest.toFixed(1)}`
}

/**
 * Race pace payload (one race, two drivers) to chart rows keyed by lap. Drivers without laps are dropped.
 * @returns {{ raceId, raceName, races: {raceId,raceName}[], drivers: {acronym}[], rows: object[], min, max } | null}
 */
export function paceChart(data) {
  if (!data || typeof data !== 'object') return null
  const races = asObjectArray(data.availableRaces)
    .map((r) => ({ raceId: safeString(r.raceId), raceName: safeString(r.raceName).trim() }))
    .filter((r) => /^\d{4}_\d+$/.test(r.raceId) && r.raceName)
  const drivers = asObjectArray(data.drivers)
    .map((d, i) => ({
      acronym: safeString(d.acronym).trim().slice(0, 4) || `D${i + 1}`,
      laps: asObjectArray(d.laps).map((l) => ({ lap: fin(l.lap), time: fin(l.time) })).filter((l) => l.lap !== null && l.lap > 0 && l.time !== null && l.time > 0),
    }))
    .filter((d) => d.laps.length > 0)
    .slice(0, 2)
  const raceId = safeString(data.raceId)
  const base = { raceId: /^\d{4}_\d+$/.test(raceId) ? raceId : '', raceName: safeString(data.raceName).trim(), races }
  if (!drivers.length) return { ...base, drivers: [], rows: [], min: 0, max: 0 }
  const byLap = new Map()
  for (const d of drivers) for (const l of d.laps) byLap.set(l.lap, { ...(byLap.get(l.lap) ?? { lap: l.lap }), [d.acronym]: l.time })
  const rows = [...byLap.values()].sort((a, b) => a.lap - b.lap)
  const times = drivers.flatMap((d) => d.laps.map((l) => l.time))
  return { ...base, drivers: drivers.map((d) => ({ acronym: d.acronym })), rows, min: Math.floor(Math.min(...times) - 1), max: Math.ceil(Math.max(...times) + 1) }
}

export { one as oneDecimal }
