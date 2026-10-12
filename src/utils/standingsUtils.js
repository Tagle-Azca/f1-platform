/**
 * Compute per-entry position change between the last two rounds, from a
 * `statsApi.getSeasonStandings`/`getConstructorStandings` entry list where
 * each entry carries a `cumulative` points-per-round array.
 */
export function computePosChanges(entries, getPoints, idKey) {
  const lastIdx = (entries[0]?.cumulative?.length ?? 0) - 1
  const prevIdx = lastIdx - 1

  const current = entries
    .map(e => ({ id: e[idKey], pts: getPoints(e, lastIdx) }))
    .sort((a, b) => b.pts - a.pts)

  const prevPositions = {}
  if (prevIdx >= 0) {
    const prev = [...entries]
      .map(e => ({ id: e[idKey], pts: getPoints(e, prevIdx) }))
      .sort((a, b) => b.pts - a.pts)
    prev.forEach((e, i) => { prevPositions[e.id] = i + 1 })
  }

  const changes = {}
  current.forEach((e, i) => {
    const currPos = i + 1
    const prevPos = prevPositions[e.id] ?? currPos
    changes[e.id] = prevIdx >= 0 ? prevPos - currPos : 0
  })
  return changes
}

/**
 * Marks the second (lower full-season points) driver on each team with
 * `dash: true` — used to tell teammates' chart lines apart, since they'd
 * otherwise share one team color and become the same line.
 */
export function markTeammateDash(series, teamKey = 'team') {
  const byTeam = new Map()
  for (const s of series) {
    const list = byTeam.get(s[teamKey]) ?? []
    list.push(s)
    byTeam.set(s[teamKey], list)
  }
  const dashIds = new Set()
  for (const list of byTeam.values()) {
    if (list.length < 2) continue
    ;[...list].sort((a, b) => b.total - a.total).slice(1).forEach(s => dashIds.add(s.id))
  }
  return series.map(s => ({ ...s, dash: dashIds.has(s.id) }))
}
