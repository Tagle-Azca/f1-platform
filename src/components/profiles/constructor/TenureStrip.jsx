import { DriverLink } from '../ProfileLinks'
import { teamMark, BASE } from '../../../styles/vizPalette'

/**
 * Drivers by season, as swimlanes: one lane per driver, one column per season (oldest first). A bar runs across the
 * consecutive seasons the driver spent with the team, with the points of each season over its cell.
 * The points are text; the bar is decoration. At 375 the table is 128 + 5 x 40 px, so it needs no scroll wrapper.
 */
export default function TenureStrip({ columns, rows, color }) {
  const bar = teamMark(color, BASE.bg)
  return (
    <section className="section min-w-0" aria-labelledby="cp-tenure">
      <h2 id="cp-tenure" className="text-heading text-ink">Drivers by season</h2>
      <p className="mt-pw-1 text-xs text-ink-3">Points scored for the team in each season.</p>
      {rows.length === 0 ? (
        <p className="mt-pw-3 text-sm text-ink-2">No drivers listed yet.</p>
      ) : (
        <table className="mt-pw-4 w-full table-fixed border-collapse">
          <caption className="sr-only">Drivers by season, with points for the team</caption>
          <thead>
            <tr className="border-b border-edge text-xs text-ink-3">
              <th scope="col" className="w-32 py-pw-2 text-left font-medium">Driver</th>
              {columns.map((y) => <th key={y} scope="col" className="num py-pw-2 text-center font-normal">{y}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const cells = []
              let col = 0
              for (const s of r.spans) {
                for (; col < s.start; col += 1) cells.push(<td key={`g${col}`} />)
                cells.push(
                  <td key={`s${s.start}`} colSpan={s.len} className="px-px py-pw-2 align-bottom">
                    <div className="flex">
                      {r.cells.slice(s.start, s.start + s.len).map((c) => (
                        <span key={c.season} className="num min-w-0 flex-1 text-center text-xs text-ink">
                          {c.points}
                          <span className="sr-only"> points for the team in {c.season}</span>
                        </span>
                      ))}
                    </div>
                    <svg aria-hidden="true" focusable="false" width="100%" height="8" className="mt-pw-1 block"><rect width="100%" height="8" rx="4" fill={bar} /></svg>
                  </td>,
                )
                col = s.start + s.len
              }
              for (; col < columns.length; col += 1) cells.push(<td key={`g${col}`} />)
              return (
                <tr key={r.id || r.name} className="border-b border-edge-soft">
                  <th scope="row" className="w-32 py-pw-1 pr-pw-2 text-left text-sm font-normal">
                    <DriverLink id={r.id} className="max-w-full"><span className="block max-w-[7.5rem] truncate">{r.name}</span></DriverLink>
                  </th>
                  {cells}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
