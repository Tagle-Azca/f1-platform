import { Link } from 'react-router-dom'
import { matchupHref, seasonRange, surname } from './teammatesModel'

const TOTALS = [['races', 'Races'], ['wins', 'Wins'], ['podiums', 'Podiums'], ['seasons', 'Seasons']]

/** One driver's career totals, plus (with only one driver picked) their teammates as links that start a matchup. */
export default function DriverOverview({ id, name, data, withTeammates }) {
  const stats = data.stats
  return (
    <section className="section min-w-0" aria-labelledby={`teammates-overview-${id}`}>
      <h2 id={`teammates-overview-${id}`} className="text-heading mb-pw-3 text-ink">{surname(name)}&apos;s career</h2>
      <dl className="grid grid-cols-2 gap-pw-4 md:grid-cols-4">
        {TOTALS.map(([k, label]) => (
          <div key={k}>
            <dt className="text-xs text-ink-3">{label}</dt>
            <dd className="text-stat m-0 text-ink">{Number.isFinite(stats[k]) ? stats[k] : '–'}</dd>
          </div>
        ))}
      </dl>
      {withTeammates && (
        <div className="mt-pw-6">
          <h3 className="text-heading mb-pw-3 text-ink">{surname(name)}&apos;s teammates</h3>
          {data.teammates.length === 0 ? <p className="text-sm text-ink-2">No teammates in Pitwall data.</p> : (
            <ul className="grid grid-cols-1 md:grid-cols-2 md:gap-x-pw-6">
              {data.teammates.map((t) => (
                <li key={t.driverId} className="border-t border-edge-soft">
                  <Link to={matchupHref(id, t.driverId)} className="flex min-h-11 flex-col justify-center px-pw-2 py-pw-2 no-underline hover:bg-hover">
                    <span className="text-sm text-ink">{t.name}</span>
                    <span className="text-xs text-ink-3"><span className="num">{seasonRange(t.seasons)}</span>{Array.isArray(t.teams) && t.teams[0] ? `, ${t.teams[0]}` : ''}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
