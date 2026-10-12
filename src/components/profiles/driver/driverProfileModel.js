// Pure driver profile model (no React). The API payloads are untrusted: everything is validated here once,
// so the components only format and place what this module returns.
import { asArray, asObjectArray } from '../../../utils/safeArray'
import { safeString } from '../../../utils/safeText'
import { codeFromName } from '../../../utils/driverCode'
import { CTOR_COLORS, ctorColor } from '../../../utils/teamColors'
import { isValidEntityId, initialsOf } from '../entityId'

const fin = (v) => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n + 0 : null // "+ 0" turns -0 into 0
}
const count = (v) => Math.max(0, Math.floor(fin(v) ?? 0))
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true })

/** "2022–2026" (or "2022") from two year-like values; '' when neither is usable. */
export function rangeLabel(first, last) {
  const a = fin(first)
  const b = fin(last)
  if (a === null && b === null) return ''
  if (a === null || b === null || a === b) return String(a ?? b)
  return `${Math.min(a, b)}–${Math.max(a, b)}`
}

export const seasonsSince2022Label = (seasons) => {
  const years = asObjectArray(seasons).map((s) => fin(s.season)).filter((y) => y !== null)
  return years.length ? rangeLabel(Math.min(...years), Math.max(...years)) : '2022–2026'
}

/** Whole years between a birth date and `now` (UTC), or null for a missing or impossible date. */
export function ageOn(dateOfBirth, now = new Date()) {
  const d = new Date(dateOfBirth)
  if (typeof dateOfBirth !== 'string' || Number.isNaN(d.getTime())) return null
  let age = now.getUTCFullYear() - d.getUTCFullYear()
  const before = now.getUTCMonth() < d.getUTCMonth() || (now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate())
  if (before) age -= 1
  return age >= 0 && age < 120 ? age : null
}

const bornFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
export function bornLabel(dateOfBirth) {
  const d = new Date(dateOfBirth)
  return typeof dateOfBirth === 'string' && !Number.isNaN(d.getTime()) ? bornFmt.format(d) : ''
}

/** Normalised season rows, newest first. */
export function seasonRows(seasons) {
  const rows = asObjectArray(seasons).map((s) => {
    const constructorId = safeString(s.constructorId)
    return {
      season: fin(s.season),
      team: safeString(s.team),
      constructorId: isValidEntityId(constructorId) ? constructorId : '',
      color: ctorColor(Object.hasOwn(CTOR_COLORS, constructorId) ? constructorId : ''),
      races: count(s.races), wins: count(s.wins), podiums: count(s.podiums), poles: count(s.poles), points: Math.max(0, fin(s.points) ?? 0),
    }
  }).filter((r) => r.season !== null)
  rows.sort((a, b) => b.season - a.season)
  const best = rows.reduce((m, r) => Math.max(m, r.points), 0)
  return rows.map((r) => ({ ...r, best }))
}

/** Hero data: name parts, number fallback chain (number, code, initials), age and the latest team. */
export function heroMeta(stats, seasons, now = new Date()) {
  const d = stats && typeof stats === 'object' && stats.driver && typeof stats.driver === 'object' ? stats.driver : {}
  const given = safeString(d.givenName).trim()
  const surname = safeString(d.familyName).trim()
  const fullName = [given, surname].filter(Boolean).join(' ')
  const code = safeString(d.code).trim() || (fullName ? codeFromName(fullName) : '')
  const number = safeString(d.permanentNumber).trim()
  const latest = seasonRows(seasons)[0] ?? null
  const age = ageOn(d.dateOfBirth, now)
  return {
    given, surname: surname || given || 'Unknown driver', fullName: fullName || 'Unknown driver',
    code: code === '—' ? '' : code,
    number,
    art: number || (code && code !== '—' ? code : '') || initialsOf(fullName),
    nationality: safeString(d.nationality).trim(),
    age,
    born: bornLabel(d.dateOfBirth),
    photoUrl: safeString(d.photoUrl) || null,
    team: latest?.team ?? '',
    teamId: latest?.constructorId ?? '',
    teamColor: latest?.color ?? ctorColor(''),
    lastSeason: latest?.season ?? fin(stats?.lastSeason),
  }
}

const int = (n) => String(Math.round(n))
const one = (n) => (Math.abs(n) < 0.05 ? '0.0' : n.toFixed(1))

/** "82.6%" from a 0-100 rate with one decimal. */
export const pct = (n) => `${one(n)}%`

/**
 * Stat strip: four primary figures and the secondary list. A datum that is not finite is omitted with its cell.
 * `gained` is signed; `dir` says whether it is places gained, lost or level (the arrow glyph and sr text come from it).
 */
export function statStrip(stats) {
  const s = stats && typeof stats === 'object' ? stats : {}
  const primary = [['points', 'Points'], ['wins', 'Wins'], ['podiums', 'Podiums'], ['polePositions', 'Poles']]
    .map(([key, label]) => ({ key, label, value: fin(s[key]) })).filter((p) => p.value !== null)
    .map((p) => ({ ...p, value: Math.max(0, p.value) }))
  const secondary = []
  const add = (key, label, v, fmt, extra = {}) => { if (v !== null) secondary.push({ key, label, value: v, text: fmt(v), ...extra }) }
  add('races', 'Races', fin(s.races), (v) => int(Math.max(0, v)))
  add('fastestLaps', 'Fastest laps', fin(s.fastestLaps), (v) => int(Math.max(0, v)))
  add('pointsPerRace', 'Points per race', fin(s.pointsPerRace), one)
  add('top10Rate', 'Top 10 rate', fin(s.top10Rate), pct)
  add('dnfRate', 'DNF rate', fin(s.dnfRate), pct)
  const g = fin(s.avgPositionsGained)
  if (g !== null) {
    const level = Math.abs(g) < 0.05
    secondary.push({
      key: 'gained', label: 'Average places gained', value: g, text: `${g > 0 && !level ? '+' : ''}${one(g)}`,
      dir: level ? 'level' : g > 0 ? 'gained' : 'lost',
    })
  }
  return { primary, secondary }
}

/**
 * Team ribbon segments, oldest first. Consecutive seasons with the same constructor merge into one segment;
 * a gap year (or a different team) starts a new one.
 */
export function timelineSegments(seasons) {
  const rows = [...seasonRows(seasons)].reverse()
  const out = []
  for (const r of rows) {
    const last = out[out.length - 1]
    if (last && last.constructorId === r.constructorId && last.team === r.team && r.season === last.to + 1) {
      last.to = r.season
      last.count += 1
    } else out.push({ constructorId: r.constructorId, team: r.team, color: r.color, from: r.season, to: r.season, count: 1 })
  }
  return out.map((s) => ({ ...s, years: rangeLabel(s.from, s.to) }))
}

/** Best circuits: wins, then podiums, then points per race, then name. Top `limit` (8). */
export function bestCircuits(circuits, limit = 8) {
  const rows = asObjectArray(circuits).map((c) => {
    const races = count(c.races)
    const points = Math.max(0, fin(c.points) ?? 0)
    const id = safeString(c._id)
    return {
      id: isValidEntityId(id) ? id : '', name: safeString(c.circuitName).trim() || 'Unknown circuit',
      races, wins: count(c.wins), podiums: count(c.podiums), points, ppr: races > 0 ? points / races : 0,
    }
  })
  rows.sort((a, b) => b.wins - a.wins || b.podiums - a.podiums || b.ppr - a.ppr || collator.compare(a.name, b.name))
  const top = rows.slice(0, limit)
  const max = top.reduce((m, r) => Math.max(m, r.wins), 0)
  return top.map((r) => ({ ...r, pprText: one(r.ppr), max }))
}

/** Seasons offered in the H2H control (newest first), from the driver's season rows. */
export const h2hSeasons = (seasons) => seasonRows(seasons).map((r) => r.season)

/** `?h2h=` must be one of the driver's seasons; anything else means the latest. */
export function parseH2hSeason(raw, available) {
  const list = asArray(available)
  const n = typeof raw === 'string' && /^\d{4}$/.test(raw) ? Number(raw) : null
  return n !== null && list.includes(n) ? n : (list[0] ?? null)
}

/**
 * Teammate head to head. status: 'ok' | 'noTeammate' | 'noShared'.
 * Each side is { driver, teammate, total } wins out of the compared sessions; the sentence is for screen readers.
 */
export function h2hView(data, { driverName, season }) {
  const d = data && typeof data === 'object' ? data : {}
  const teammate = safeString(d.teammateName).trim()
  if (!teammate) return { status: 'noTeammate', season, teammate: '' }
  const racesCompared = count(d.racesCompared)
  const qualiCompared = count(d.qualiCompared)
  if (racesCompared === 0 && qualiCompared === 0) return { status: 'noShared', season, teammate }
  const side = (o, total) => {
    const a = o && typeof o === 'object' ? o : {}
    return { driver: count(a.driver), teammate: count(a.teammate), total }
  }
  const race = side(d.race, racesCompared)
  const quali = side(d.quali, qualiCompared)
  const parts = []
  const verdict = (label, s) => {
    if (s.total === 0) return
    const [who, n] = s.driver === s.teammate ? [null, s.driver] : s.driver > s.teammate ? [driverName, s.driver] : [teammate, s.teammate]
    parts.push(who ? `${who} led in ${n} of ${s.total} ${label}` : `the two were level at ${n} of ${s.total} ${label}`)
  }
  verdict(race.total === 1 ? 'race' : 'races', race)
  verdict(quali.total === 1 ? 'qualifying session' : 'qualifying sessions', quali)
  return {
    status: 'ok', season, teammate, race, quali,
    sentence: `In ${season}, ${driverName} against ${teammate}: ${parts.join(' and ')}.`,
  }
}
