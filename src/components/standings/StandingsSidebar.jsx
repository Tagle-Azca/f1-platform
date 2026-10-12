import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { statsApi } from '../../services/api'
import { CTOR_COLORS } from '../../utils/teamColors'
import { computePosChanges } from '../../utils/standingsUtils'
import { useIsXl } from '../../hooks/useMediaQuery'
import { usePreferences } from '../../contexts/PreferencesContext'
import { features } from '../../config/features'
import { safeString } from '../../utils/safeText'
import { asObjectArray } from '../../utils/safeArray'
import ShellBoundary from '../layout/ShellBoundary'
import DataRow from '../ui/DataRow'
import TabBar from '../ui/TabBar'

const ROWS = 10

const teamColor = (constructorId) => CTOR_COLORS[constructorId] || null

function Trend({ delta }) {
  if (!delta) return <span aria-hidden="true" className="w-8 shrink-0 text-center text-xs text-ink-3">–</span>
  const up = delta > 0
  const n = Math.abs(delta)
  return (
    <span className={`w-8 shrink-0 text-center text-xs font-bold ${up ? 'text-pos' : 'text-neg'}`}>
      <span aria-hidden="true">{up ? '▲' : '▼'}{n}</span>
      <span className="sr-only">{up ? 'up' : 'down'} {n} position{n === 1 ? '' : 's'}</span>
    </span>
  )
}

/** Desktop rail (>= 1280px only). Renders nothing, and fetches nothing, below that. */
export default function StandingsSidebar() {
  const isXl = useIsXl()
  return isXl ? <ShellBoundary><Rail /></ShellBoundary> : null
}

function Rail() {
  const { prefs } = usePreferences()
  const [tab,     setTab]     = useState('drivers')
  const [drivers, setDrivers] = useState([])
  const [ctors,   setCtors]   = useState([])
  const [season,  setSeason]  = useState('')
  const [loading, setLoading] = useState(true)

  const year = String(new Date().getFullYear())

  useEffect(() => {
    let cancelled = false
    Promise.all([
      statsApi.getSeasonStandings(year),
      statsApi.getConstructorStandings(year),
    ])
      .then(([ds, cs]) => {
        if (cancelled) return
        if (ds?.drivers && ds.rounds?.length) {
          const lastIdx = ds.rounds.length - 1
          const pts = (d, idx) => Math.round((d.cumulative?.[idx] ?? 0) * 10) / 10
          const changes = computePosChanges(asObjectArray(ds.drivers), pts, 'driverId')
          setDrivers(asObjectArray(ds.drivers)
            .map(d => ({
              id: safeString(d.driverId), name: safeString(d.name), team: safeString(d.team), constructorId: safeString(d.teamId),
              points: pts(d, lastIdx), posChange: changes[d.driverId] ?? 0,
            }))
            .sort((a, b) => b.points - a.points))
          setSeason(safeString(ds.season) || year)
        }
        if (cs?.constructors && cs.rounds?.length) {
          const lastIdx = cs.rounds.length - 1
          const pts = (c, idx) => Math.round((c.cumulative?.[idx] ?? 0) * 10) / 10
          const changes = computePosChanges(asObjectArray(cs.constructors), pts, 'constructorId')
          setCtors(asObjectArray(cs.constructors)
            .map(c => ({
              id: safeString(c.constructorId), name: safeString(c.name), constructorId: safeString(c.constructorId),
              points: pts(c, lastIdx), posChange: changes[c.constructorId] ?? 0,
            }))
            .sort((a, b) => b.points - a.points))
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [year])

  const isDrivers = tab === 'drivers'
  const list = (isDrivers ? drivers : ctors).slice(0, ROWS)

  return (
    <div className="hidden xl:block w-80 shrink-0 bg-sidebar border-l border-edge-soft">
    <aside aria-label="Championship standings" className="sticky top-0 flex h-dvh flex-col">
      <div className="p-pw-4 pb-pw-3 border-b border-edge-soft">
        <h2 className="mb-pw-3 font-display text-base font-semibold leading-5 text-ink">{isDrivers ? `Drivers' championship ${season}` : `Constructors' championship ${season}`}</h2>
        <TabBar
          className="tab-bar--plain"
          tabs={[{ id: 'drivers', label: 'Drivers' }, { id: 'constructors', label: 'Constructors' }]}
          activeTab={tab}
          onChange={setTab}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-pw-4 text-sm text-ink-3" role="status">Loading standings</p>
        ) : list.length === 0 ? (
          <p className="p-pw-4 text-sm text-ink-3">Standings not available yet</p>
        ) : (
          <ol className="list-none">
            {list.map((e, i) => {
              const focus = isDrivers
                ? prefs?.favoriteDriver && e.name === prefs.favoriteDriver
                : prefs?.favoriteTeam && e.constructorId === prefs.favoriteTeam
              return (
                <li key={e.id}>
                  <DataRow
                    pos={i + 1}
                    teamColor={teamColor(e.constructorId)}
                    label={isDrivers ? e.name.split(' ').slice(-1)[0] : e.name}
                    sub={isDrivers ? e.team : undefined}
                    value={e.points}
                    highlight={!!focus}
                  >
                    <Trend delta={e.posChange} />
                  </DataRow>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <div className="p-pw-4 border-t border-edge-soft flex items-center justify-between gap-pw-2">
        <Link
          to={isDrivers ? '/standings' : '/standings?view=constructors'}
          className="inline-flex items-center min-h-11 text-sm font-semibold text-ink-2 hover:text-ink no-underline"
        >
          Full standings
        </Link>
        {features.social && <div data-slot="rail-actions" />}
      </div>
    </aside>
    </div>
  )
}
