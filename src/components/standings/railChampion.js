import { normalizeSeries, normalizeRounds } from './standingsModel'
import { clinchModel } from '../viz/clinchModel'

/**
 * Id of the champion in a standings payload (`statsApi.getSeasonStandings` / `getConstructorStandings`) when the
 * title is locked after its latest round, else null. Waits for the sprint calendar through `sprints.ready`.
 */
export function championIdOf(payload, view, season, sprints) {
  if (!payload || !sprints?.ready) return null
  const clinch = clinchModel({
    series: normalizeSeries(payload, view), totalRounds: payload.totalRounds, season, kind: view === 'constructors' ? 'constructor' : 'driver',
    complete: normalizeRounds(payload).map(r => r.complete), sprintRounds: sprints.rounds,
  })
  return clinch.clinched ? clinch.champion.id : null
}
