import { useMemo } from 'react'
import { clinchModel } from '../viz/clinchModel'
import { useSprintRounds } from './useSprintRounds'

/**
 * The champion at the replayed round: set once the title is locked (round at or after the clinch round),
 * waiting for the sprint calendar so a clinch is never shown a sprint early. Past seasons resolve at their final round.
 */
export function useChampion({ series, rounds, totalRounds, season, view, round }) {
  const sprints = useSprintRounds(season)
  const clinch = useMemo(() => clinchModel({
    series, totalRounds, season, kind: view === 'constructors' ? 'constructor' : 'driver', complete: rounds.map(r => r.complete), sprintRounds: sprints.rounds,
  }), [series, rounds, totalRounds, season, view, sprints.rounds])
  const decided = sprints.ready && clinch.clinched && round >= clinch.clinchRound
  const champion = decided ? series.find(s => s.id === clinch.champion.id) ?? null : null
  return { clinch, decided, champion }
}
