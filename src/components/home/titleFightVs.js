// Head-to-head numbers for the title-fight VS card. Inputs are season performance
// payloads from /api/stats/historical-performance; every field is checked before use.
import { asObjectArray } from '../../utils/safeArray'

const n = (v) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : null)

/**
 * Who finished ahead, and who started ahead, in rounds both drivers took part in.
 * A classified finish beats a retirement; two retirements don't count.
 */
export function headToHead(racesA, racesB) {
  const byRound = new Map(asObjectArray(racesB).map(r => [n(r.round), r]))
  const out = { race: [0, 0], quali: [0, 0] }
  for (const a of asObjectArray(racesA)) {
    const b = byRound.get(n(a.round))
    if (!b) continue
    const pa = a.finished ? n(a.position) : null
    const pb = b.finished ? n(b.position) : null
    if (pa != null && (pb == null || pa < pb)) out.race[0] += 1
    else if (pb != null && (pa == null || pb < pa)) out.race[1] += 1
    const ga = n(a.grid), gb = n(b.grid)
    // Grid 0 means pit-lane start; it counts as behind any real grid slot
    if (ga != null && gb != null && ga !== gb) {
      const ra = ga === 0 ? Infinity : ga, rb = gb === 0 ? Infinity : gb
      if (ra < rb) out.quali[0] += 1
      else if (rb < ra) out.quali[1] += 1
    }
  }
  return out
}

/** Comparison rows (label, value A, value B). Rows where both values are missing are dropped. */
export function statRows(perfA, perfB) {
  const a = perfA?.stats ?? {}, b = perfB?.stats ?? {}
  const h2h = headToHead(perfA?.races, perfB?.races)
  const rows = [
    { key: 'wins', label: 'Grand Prix wins', a: n(a.wins), b: n(b.wins) },
    { key: 'podiums', label: 'Podiums', a: n(a.podiums), b: n(b.podiums) },
    { key: 'poles', label: 'Poles', a: n(a.poles), b: n(b.poles) },
    { key: 'fastest', label: 'Fastest laps', a: n(a.fastestLaps), b: n(b.fastestLaps) },
  ]
  if (h2h.race[0] + h2h.race[1] > 0) rows.push({ key: 'ahead', label: 'Finished ahead', a: h2h.race[0], b: h2h.race[1] })
  if (h2h.quali[0] + h2h.quali[1] > 0) rows.push({ key: 'grid', label: 'Started ahead', a: h2h.quali[0], b: h2h.quali[1] })
  return rows.filter(r => r.a != null || r.b != null)
}

/** Points the chaser must outscore the leader by, per remaining round, to draw level. */
export function neededPerRound(gap, remaining) {
  if (!(remaining > 0) || !(gap > 0)) return null
  return Math.ceil(gap / remaining)
}

/** Share of the two drivers' combined points held by A (0..1); 0.5 when both are 0. */
export function pointsShare(a, b) {
  const t = (a > 0 ? a : 0) + (b > 0 ? b : 0)
  return t ? (a > 0 ? a : 0) / t : 0.5
}
