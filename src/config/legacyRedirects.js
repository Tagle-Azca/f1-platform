/**
 * Legacy URL map: old route -> canonical route (Navigation 14 -> 8).
 * mapLegacy(pathname, search) returns the target path (with query) or null when the path is not legacy.
 * Unknown query keys are dropped; invalid values are dropped so the target page can normalise.
 * `/next-race` is not mapped here: it needs the dashboard to resolve the round (NextRaceRedirect).
 */
const YEAR = /^\d{4}$/
const RACE_ID = /^\d{4}_\d+$/

function build(path, entries) {
  const q = new URLSearchParams()
  for (const [k, v] of entries) if (v) q.set(k, v)
  const s = q.toString()
  return s ? `${path}?${s}` : path
}

export function mapLegacy(pathname, search = '') {
  const p = (pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname) || '/'
  const sp = new URLSearchParams(search)
  const season = sp.get('season')
  const okSeason = season && YEAR.test(season) ? season : null

  switch (p) {
    case '/races':
      return build('/calendar', [['season', okSeason]])
    case '/encyclopedia':
    case '/drivers': {
      const view = sp.get('view')
      if (view === 'circuits') return '/circuits'
      if (p === '/drivers') return null
      return build('/drivers', [['view', view === 'drivers' || view === 'constructors' ? view : null], ['season', okSeason]])
    }
    case '/telemetry': {
      const race = sp.get('race')
      const year = sp.get('year')
      return build('/analysis', [
        ['view', 'telemetry'],
        ['race', race && RACE_ID.test(race) ? race : null],
        ['season', year && YEAR.test(year) ? year : null],
      ])
    }
    case '/race-pace':
      return '/analysis?view=pace'
    case '/tire-strategy':
      return '/analysis?view=tyres'
    case '/graph':
      return '/teammates?view=network'
    default:
      return null
  }
}
