import GapBar from '../../viz/GapBar'

const Champion = () => <span className="inline-flex min-h-6 items-center rounded-pill bg-steel-soft px-pw-3 text-xs font-medium text-steel">Champion</span>

/** Season by season: races, wins and points with a share bar against the team's best season. Newest first. */
export default function SeasonHistory({ rows, color }) {
  return (
    <section className="section" aria-labelledby="cp-history">
      <h2 id="cp-history" className="text-heading text-ink">Season by season</h2>
      {rows.length === 0 ? (
        <p className="mt-pw-3 text-sm text-ink-2">No seasons in Pitwall data yet.</p>
      ) : (
        <>
          <table className="mt-pw-4 hidden w-full border-collapse sm:table">
            <caption className="sr-only">Team seasons in Pitwall data, newest first</caption>
            <thead>
              <tr className="border-b border-edge text-xs text-ink-3">
                <th scope="col" className="py-pw-2 pr-pw-3 text-left font-medium">Season</th>
                <th scope="col" className="py-pw-2 text-left font-medium">Drivers</th>
                <th scope="col" className="py-pw-2 pl-pw-3 text-right font-medium">Races</th>
                <th scope="col" className="py-pw-2 pl-pw-3 text-right font-medium">Wins</th>
                <th scope="col" className="py-pw-2 pl-pw-3 text-right font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.season} className="border-b border-edge-soft [@media(hover:hover)]:hover:bg-hover">
                  <th scope="row" className="py-pw-2 pr-pw-3 text-left font-normal">
                    <span className="flex items-center gap-pw-3"><span className="num text-ink">{r.season}</span>{r.champion && <Champion />}</span>
                  </th>
                  <td className="py-pw-2 text-sm text-ink-2"><span className="block">{r.drivers.map((d) => d.name).join(', ') || 'No drivers listed'}</span></td>
                  <td className="num pl-pw-3 text-right text-ink">{r.races}</td>
                  <td className="num pl-pw-3 text-right text-ink">{r.wins}</td>
                  <td className="py-pw-2 pl-pw-3">
                    <span className="flex items-center justify-end gap-pw-3">
                      <span className="w-24"><GapBar value={r.points} max={r.best} mode="share" color={color} index={i} /></span>
                      <span className="num w-12 text-right text-ink">{r.points}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="mt-pw-4 flex flex-col sm:hidden">
            {rows.map((r, i) => (
              <li key={r.season} className="flex flex-col gap-pw-1 border-b border-edge-soft py-pw-3">
                <div className="flex items-center gap-pw-3">
                  <span className="num text-ink">{r.season}</span>
                  {r.champion && <Champion />}
                  <span className="num ml-auto text-ink">{r.points}<span className="ml-1 font-sans text-xs text-ink-3">pts</span></span>
                </div>
                <p className="text-xs text-ink-2 [overflow-wrap:anywhere]">{r.drivers.map((d) => d.name).join(', ') || 'No drivers listed'}</p>
                <p className="num text-xs text-ink-2">{r.races} races · {r.wins} wins</p>
                <GapBar value={r.points} max={r.best} mode="share" color={color} index={i} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
