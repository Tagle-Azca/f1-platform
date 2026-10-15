import { statCards } from './resultsModel'
import { teamMark, BASE } from '../../styles/vizPalette'

function Cell({ label, value, sub, color }) {
  return (
    <div className="flex min-w-0 flex-col bg-bg px-pw-4 py-pw-3">
      <dt className="order-2 mt-pw-1 text-xs text-ink-3">{label}</dt>
      <dd className="order-1 m-0 min-w-0">
        <span className="block truncate font-display text-base font-semibold text-ink">{value}</span>
        {sub && (
          <span className="mt-pw-1 flex min-w-0 items-center gap-pw-2 text-xs text-ink-2">
            {color && (
              <svg aria-hidden="true" focusable="false" width="3" height="12" className="shrink-0"><rect width="3" height="12" rx="1.5" fill={teamMark(color, BASE.bg)} /></svg>
            )}
            <span className="num truncate">{sub}</span>
          </span>
        )}
      </dd>
    </div>
  )
}

/** Winner, pole, fastest lap and DNFs of the race: two columns on a phone, four from md. Missing facts show a dash. */
export default function RaceStatCards({ results, qualifyingResults, raceSnapshot }) {
  const c = statCards(results, qualifyingResults, raceSnapshot)
  const dnf = c.dnfs.count > 0
  return (
    <section className="section" aria-label="Race facts">
      <dl className="m-0 grid grid-cols-2 gap-px bg-edge-soft md:grid-cols-4" data-stat-cards>
        <Cell label="Winner" value={c.winner?.value || '-'} sub={c.winner?.sub} color={c.winner?.color} />
        <Cell label="Pole position" value={c.pole?.value || '-'} sub={c.pole?.sub} color={c.pole?.color} />
        <Cell label="Fastest lap" value={c.fastest?.value || '-'} sub={c.fastest?.sub} color={c.fastest?.color} />
        <Cell
          label={dnf ? 'Did not finish' : 'Race laps'}
          value={dnf ? String(c.dnfs.count) : (c.dnfs.laps || '-')}
          sub={dnf ? (c.dnfs.laps || `${c.dnfs.classified} classified`) : (c.dnfs.classified ? `${c.dnfs.classified} classified` : '')}
        />
      </dl>
    </section>
  )
}
