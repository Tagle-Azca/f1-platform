import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ctorColor, teamMark } from '../../styles/vizPalette'
import { surname } from './teammatesModel'

const MAX_COMMON = 8

/** Shared teams with each driver's seasons there. */
export function SharedTeams({ teams, nameA, nameB }) {
  return (
    <section className="section min-w-0" aria-labelledby="teammates-teams-h">
      <h2 id="teammates-teams-h" className="text-heading mb-pw-3 text-ink">Shared teams</h2>
      {teams.length === 0 ? <p className="text-sm text-ink-2">No team in common.</p> : (
        <ul>
          {teams.map((t) => (
            <li key={t.constructorId} className="flex min-h-11 flex-col justify-center border-t border-edge-soft py-pw-2">
              <span className="flex items-center gap-pw-2 text-sm text-ink">
                <svg aria-hidden="true" focusable="false" width="3" height="12" className="shrink-0"><rect width="3" height="12" rx="1.5" fill={teamMark(ctorColor(t.constructorId))} /></svg>
                {t.name}
              </span>
              <span className="num text-xs text-ink-3">{surname(nameA)} {t.a || '–'} / {surname(nameB)} {t.b || '–'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Row({ t }) {
  return (
    <li className="border-t border-edge-soft">
      <Link to={`/drivers/${encodeURIComponent(t.driverId)}`} className="flex min-h-11 items-center text-sm text-steel no-underline hover:text-steel-hi">{t.name}</Link>
    </li>
  )
}

/** Drivers who partnered both; up to 8, the rest behind a disclosure. */
export function CommonTeammates({ people }) {
  const [all, setAll] = useState(false)
  const shown = all ? people : people.slice(0, MAX_COMMON)
  return (
    <section className="section min-w-0" aria-labelledby="teammates-common-h">
      <h2 id="teammates-common-h" className="text-heading mb-pw-3 text-ink">Common teammates</h2>
      {people.length === 0 ? <p className="text-sm text-ink-2">No teammates in common.</p> : (
        <>
          <ul>{shown.map((t) => <Row key={t.driverId} t={t} />)}</ul>
          {people.length > MAX_COMMON && (
            <button type="button" aria-expanded={all} onClick={() => setAll((v) => !v)} className="inline-flex min-h-11 cursor-pointer items-center border-0 border-t border-edge-soft bg-transparent p-0 text-sm font-semibold text-steel hover:text-steel-hi">
              {all ? 'Show fewer' : `Show all ${people.length}`}
            </button>
          )}
        </>
      )}
    </section>
  )
}
