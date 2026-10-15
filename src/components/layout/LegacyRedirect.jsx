import { Navigate, useLocation } from 'react-router-dom'
import { mapLegacy } from '@/config/legacyRedirects'

/** Renders a replace-redirect for an old URL (see config/legacyRedirects.js). Unmapped paths fall back to the not-found route. */
export default function LegacyRedirect() {
  const { pathname, search } = useLocation()
  const to = mapLegacy(pathname, search)
  return <Navigate replace to={to ?? '/calendar'} />
}
