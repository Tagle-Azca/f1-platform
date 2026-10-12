import CircuitLink from '../../circuits/CircuitLink'
import GapBar from '../../viz/GapBar'
import { SectionError } from '../ProfileLinks'

/**
 * Best circuits: top rows ranked by wins, then podiums, then points per race. The circuit name is the link.
 * A table from md, two-line rows below. The win bar is a circuit-centric series (steel), not a team colour.
 */
export default function BestCircuits({ rows, name, status, onRetry }) {
  return (
    <section className="section min-w-0" aria-labelledby="dp-circuits">
      <h2 id="dp-circuits" className="text-heading text-ink">Best circuits</h2>
      <p className="mt-pw-1 text-xs text-ink-3">Ranked by wins, then podiums, then points per race. 2022–2026.</p>
      {status === 'error' ? (
        <div className="mt-pw-4"><SectionError what="circuit results" onRetry={onRetry} /></div>
      ) : rows.length === 0 ? (
        <p className="mt-pw-3 text-sm text-ink-2">No circuit results yet.</p>
      ) : (
        <>
          <table className="mt-pw-3 hidden w-full border-collapse md:table">
            <caption className="sr-only">Best circuits for {name}</caption>
            <thead>
              <tr className="border-b border-edge text-xs text-ink-3">
                <th scope="col" className="w-8 py-pw-2 text-left font-medium">#</th>
                <th scope="col" className="py-pw-2 text-left font-medium">Circuit</th>
                <th scope="col" className="py-pw-2 pl-pw-3 text-right font-medium">Races</th>
                <th scope="col" className="py-pw-2 pl-pw-3 text-right font-medium">Podiums</th>
                <th scope="col" className="py-pw-2 pl-pw-3 text-right font-medium">Pts/race</th>
                <th scope="col" className="py-pw-2 pl-pw-3 text-right font-medium">Wins</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id || r.name} className="h-12 border-b border-edge-soft [@media(hover:hover)]:hover:bg-hover">
                  <td className="num text-ink-3">{i + 1}</td>
                  <th scope="row" className="py-pw-2 pr-pw-3 text-left text-sm font-normal text-ink"><span className="block"><CircuitLink circuitId={r.id}>{r.name}</CircuitLink></span></th>
                  <td className="num pl-pw-3 text-right text-ink">{r.races}</td>
                  <td className="num pl-pw-3 text-right text-ink">{r.podiums}</td>
                  <td className="num pl-pw-3 text-right text-ink">{r.pprText}</td>
                  <td className="pl-pw-3">
                    <span className="flex items-center justify-end gap-pw-2">
                      <span className="w-20"><GapBar value={r.wins} max={r.max} mode="share" index={i} /></span>
                      <span className="num w-6 text-right text-ink">{r.wins}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ol className="mt-pw-3 flex flex-col md:hidden">
            {rows.map((r, i) => (
              <li key={r.id || r.name} className="flex min-h-12 flex-col justify-center gap-pw-1 border-b border-edge-soft py-pw-2">
                <div className="flex items-baseline gap-pw-3">
                  <span className="num w-5 text-ink-3">{i + 1}</span>
                  <span className="min-w-0 flex-1 text-sm text-ink [overflow-wrap:anywhere]"><CircuitLink circuitId={r.id}>{r.name}</CircuitLink></span>
                  <span className="num text-ink">{r.wins}<span className="ml-1 font-sans text-xs text-ink-3">{r.wins === 1 ? 'win' : 'wins'}</span></span>
                </div>
                <p className="num pl-8 text-xs text-ink-2">{r.races} races · {r.podiums} podiums · {r.pprText} pts/race</p>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
