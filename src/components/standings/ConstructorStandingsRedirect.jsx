import { Navigate, useLocation } from 'react-router-dom'

/** Legacy URL: the constructors table lives at /standings?view=constructors. Keeps ?season=; replaces the history entry. */
export default function ConstructorStandingsRedirect() {
  const season = new URLSearchParams(useLocation().search).get('season')
  const query = new URLSearchParams({ view: 'constructors', ...(season ? { season } : {}) })
  return <Navigate replace to={`/standings?${query}`} />
}
