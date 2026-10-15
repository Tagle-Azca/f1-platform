// Pure model for the session result tables (race, sprint, qualifying, sprint shootout, live-timing snapshots).
// Inputs are untrusted API payloads: every field is validated and only primitives leave this module.
import { asObjectArray } from '../../utils/safeArray'
import { safeString, safeText } from '../../utils/safeText'
import { CTOR_COLORS, ctorColor } from '../../utils/teamColors'

const hasOwn = (o, k) => typeof k === 'string' && Object.hasOwn(o, k)

// ---- status words -------------------------------------------------------------------------------------------------

const STATUS_MAP = {
  'Did not start': 'DNS', 'Did not qualify': 'DNQ', 'Did not prequalify': 'DNPQ', 'Disqualified': 'DSQ', 'Excluded': 'DSQ',
  'Withdrew': 'WD', 'Not classified': 'NC',
  'Accident': 'DNF', 'Collision': 'DNF', 'Collision damage': 'DNF', 'Retired': 'DNF', 'Mechanical': 'DNF', 'Engine': 'DNF',
  'Gearbox': 'DNF', 'Transmission': 'DNF', 'Hydraulics': 'DNF', 'Electrical': 'DNF', 'Spun off': 'DNF', 'Brakes': 'DNF',
  'Suspension': 'DNF', 'Tyre': 'DNF', 'Puncture': 'DNF', 'Wheel': 'DNF', 'Power Unit': 'DNF', 'ERS': 'DNF', 'Overheating': 'DNF',
  'Oil pressure': 'DNF', 'Water pressure': 'DNF', 'Water leak': 'DNF', 'Fuel pressure': 'DNF', 'Fuel system': 'DNF', 'Fire': 'DNF',
  'Driver Seat': 'DNF', 'Debris': 'DNF',
}
const WORDS = { DNF: 'did not finish', DNS: 'did not start', DNQ: 'did not qualify', DNPQ: 'did not prequalify', DSQ: 'disqualified', WD: 'withdrew', NC: 'not classified' }

/** Status as a word: { label, tone: 'ok' | 'bad' | 'plain' | 'none', spoken }. DNF and DSQ are the only `bad` ones. */
export function statusWord(status) {
  const s = safeString(status).trim()
  if (!s) return { label: '-', tone: 'none', spoken: '' }
  if (s === 'Finished') return { label: 'Finished', tone: 'ok', spoken: 'finished' }
  const lap = /^\+(\d+) Laps?$/i.exec(s)
  if (lap) { const n = Number(lap[1]); return { label: `+${n} ${n === 1 ? 'lap' : 'laps'}`, tone: 'ok', spoken: `${n} ${n === 1 ? 'lap' : 'laps'} down` } }
  const label = hasOwn(STATUS_MAP, s) ? STATUS_MAP[s] : s.length > 10 ? 'DNF' : s
  return { label, tone: label === 'DNF' || label === 'DSQ' ? 'bad' : 'plain', spoken: WORDS[label] ?? label.toLowerCase() }
}

// ---- positions ----------------------------------------------------------------------------------------------------

/** Places gained (positive) or lost (negative) from the grid; null when either is unknown or the start was from the pit lane. */
export function positionDelta(grid, position) {
  const g = parseInt(grid, 10)
  const p = parseInt(position, 10)
  if (Number.isNaN(g) || Number.isNaN(p) || g === 0) return null
  return g - p
}

const placeWord = (n) => `${n} ${n === 1 ? 'place' : 'places'}`
export function deltaSpoken(delta) {
  if (delta === null) return ''
  if (delta === 0) return 'kept their grid place'
  return `${delta > 0 ? 'gained' : 'lost'} ${placeWord(Math.abs(delta))}`
}

const posLabel = (p) => (safeString(p) === '\\N' ? 'DNF' : safeString(p) || '-')

function person(r) {
  const d = r?.Driver && typeof r.Driver === 'object' ? r.Driver : {}
  const given = safeString(d.givenName).trim()
  const family = safeString(d.familyName).trim()
  return {
    driverId: safeString(d.driverId),
    name: [given, family].filter(Boolean).join(' ') || safeString(d.code) || 'Unknown',
    family: family || safeString(d.code),
    code: safeString(d.code) || family.slice(0, 3).toUpperCase(),
    number: safeString(d.permanentNumber),
  }
}

function team(r) {
  const c = r?.Constructor && typeof r.Constructor === 'object' ? r.Constructor : {}
  const id = safeString(c.constructorId)
  return { team: safeString(c.name), constructorId: id, color: ctorColor(hasOwn(CTOR_COLORS, id) ? id : '') }
}

// ---- row builders -------------------------------------------------------------------------------------------------

/**
 * Race or sprint classification.
 * @returns {{ key, pos, isLeader, driverId, name, family, code, number, team, constructorId, color, grid, delta, timeText, status, points, spoken }[]}
 */
export function raceRows(results) {
  return asObjectArray(results).map((r, i) => {
    const who = person(r)
    const t = team(r)
    const delta = positionDelta(r.grid, r.position)
    const status = statusWord(r.status)
    const timeText = safeString(r.Time?.time)
    const points = parseFloat(r.points) > 0 ? safeString(r.points) : ''
    const grid = safeString(r.grid) === '0' ? 'PL' : safeString(r.grid)
    const isLeader = i === 0
    const spoken = [
      `Position ${posLabel(r.position)}`, who.name, t.team,
      grid ? `started ${grid === 'PL' ? 'from the pit lane' : `P${grid}`}` : '', deltaSpoken(delta),
      timeText ? `time ${timeText}` : status.spoken, points ? `${points} points` : '',
    ].filter(Boolean).join(', ')
    return { key: who.driverId || String(i), pos: posLabel(r.position), isLeader, ...who, ...t, grid, delta, timeText, status, points, spoken }
  })
}

/**
 * Qualifying (Q1-Q3) or sprint shootout (SQ1-SQ3, read from Q1-Q3 or SQ1-SQ3).
 * @returns {{ key, pos, isLeader, driverId, name, family, code, number, team, constructorId, color, q: string[], spoken }[]}
 */
export function qualiRows(results, { shootout = false } = {}) {
  return asObjectArray(results).map((r, i) => {
    const who = person(r)
    const t = team(r)
    const q = shootout
      ? [r.Q1 || r.SQ1, r.Q2 || r.SQ2, r.Q3 || r.SQ3]
      : [r.Q1, r.Q2, r.Q3]
    const times = q.map((v) => safeString(v))
    const best = [...times].reverse().find(Boolean)
    const spoken = [`Position ${posLabel(r.position)}`, who.name, t.team, best ? `best time ${best}` : 'no time set'].filter(Boolean).join(', ')
    return { key: who.driverId || String(i), pos: posLabel(r.position), isLeader: i === 0, ...who, ...t, q: times, spoken }
  })
}

/**
 * Live-timing classification saved by the backend (used until the official results are in).
 * @param {'gap'|'bestLap'} column  what the last column shows
 */
export function snapshotRows(snapshot, { column = 'gap' } = {}) {
  return asObjectArray(snapshot?.classification).map((d, i) => {
    const hex = safeString(d.teamColor).replace(/^#/, '')
    const color = /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex}` : ''
    const isLeader = i === 0
    const value = column === 'bestLap'
      ? safeString(d.bestLap)
      : isLeader ? 'Leader' : safeString(d.statLabel && d.statLabel !== 'gap' ? d.statLabel : d.stat) || safeString(d.bestLap)
    const name = safeString(d.fullName) || safeString(d.acronym) || 'Unknown'
    const spoken = [`Position ${safeString(d.position)}`, name, safeString(d.teamName), value ? `${column === 'bestLap' ? 'best lap' : 'gap'} ${value}` : ''].filter(Boolean).join(', ')
    return {
      key: safeString(d.driverNum) || String(i), pos: safeString(d.position) || String(i + 1), isLeader,
      name, family: name.split(/\s+/).slice(-1)[0], code: safeString(d.acronym), number: safeString(d.driverNum),
      team: safeString(d.teamName), color, value: value || '-', spoken, driverId: '',
    }
  })
}

// ---- stat cards ---------------------------------------------------------------------------------------------------

/** Winner, pole, fastest lap and DNF count for the cards under the results. Missing values are null, never "undefined". */
export function statCards(results, qualifyingResults, raceSnapshot) {
  const res = asObjectArray(results)
  const quali = asObjectArray(qualifyingResults)
  const winner = res.find((r) => safeString(r.position) === '1') ?? res[0]
  const pole = quali[0] ?? res.find((r) => safeString(r.grid) === '1')
  const fastest = res.find((r) => r.FastestLap?.rank != null && String(r.FastestLap.rank) === '1')
  const dnf = res.filter((r) => { const s = safeString(r.status); return s !== 'Finished' && !s.startsWith('+') }).length
  const snapWinner = !winner ? asObjectArray(raceSnapshot?.classification)[0] : null
  const display = (r) => (r ? person(r).name : '')
  const laps = winner?.laps ? `${safeString(winner.laps)} laps` : ''
  const snapLaps = !winner && safeText(raceSnapshot?.totalLaps) ? `${safeString(raceSnapshot.totalLaps)} laps` : ''
  return {
    winner: winner ? { value: display(winner), sub: team(winner).team, ...team(winner) }
      : snapWinner ? { value: safeString(snapWinner.fullName) || safeString(snapWinner.acronym), sub: safeString(snapWinner.teamName) || 'Live timing', constructorId: '', color: '' } : null,
    pole: pole ? { value: display(pole), sub: team(pole).team, ...team(pole) } : null,
    fastest: fastest ? { value: display(fastest), sub: safeString(fastest.FastestLap?.Time?.time), ...team(fastest) } : null,
    dnfs: { count: dnf, laps: laps || snapLaps, classified: res.length },
  }
}
