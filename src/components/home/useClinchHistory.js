import { useEffect, useState } from 'react'
import { getSeasonStandingsCached } from '../../hooks/useStandingsData'
import { normalizeSeries, normalizeRounds } from '../standings/standingsModel'
import { clinchModel } from '../viz/clinchModel'
import { loadSprintRounds } from '../standings/useSprintRounds'

/**
 * Per-round standings for the Dashboard card (through the Standings page's session cache), reduced to the
 * clinch analysis. `null` until loaded or when the history is unavailable, so the card keeps its old view.
 * Returns { clinch, series } for a season, or null.
 */
export function useClinchHistory(season, totalRounds) {
  const year = Number(season)
  const [res, setRes] = useState(null)
  useEffect(() => {
    if (!Number.isInteger(year) || year < 1950) return
    let alive = true
    const sprints = loadSprintRounds(year).catch(() => undefined) // a missing calendar means no sprint points
    Promise.all([getSeasonStandingsCached(year, new Date().getFullYear()), sprints]).then(([r, sprintRounds]) => {
      if (!alive || !r?.ok || !r.payload) return
      const series = normalizeSeries(r.payload, 'drivers')
      const total = Number.isFinite(totalRounds) && totalRounds > 0 ? totalRounds : r.payload.totalRounds
      const clinch = clinchModel({ series, totalRounds: total, season: year, complete: normalizeRounds(r.payload).map(x => x.complete), sprintRounds })
      setRes({ year, series, clinch })
    }).catch(() => {})
    return () => { alive = false }
  }, [year, totalRounds])
  return res?.year === year && res.clinch.status !== 'no-data' ? res : null
}
