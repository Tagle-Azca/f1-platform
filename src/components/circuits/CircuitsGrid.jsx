import CircuitCard from './CircuitCard'
import { groupByCalendar } from './circuitIndexModel'

const GRID = 'grid grid-cols-1 gap-pw-4 sm:grid-cols-[repeat(auto-fill,minmax(224px,1fr))]'
const ENTRANCE_LIMIT = 12

// A calendar group is a labelled region; the flat list is just a div (no extra landmark).
const Group = ({ labelledBy, children }) => (labelledBy ? <section aria-labelledby={labelledBy}>{children}</section> : <div>{children}</div>)

/**
 * The catalogue. Under calendar order it is split into "{season} calendar" and "Other circuits" groups (empty groups omitted).
 * Only the first 12 cards animate in, and only when `entrance` is set (data arrived from the network, not from the cache).
 */
export default function CircuitsGrid({ circuits, season, sort, hasCalendar, nextId, layout, entrance, linkState }) {
  const grouped = hasCalendar && sort === 'calendar'
  const groups = grouped ? groupByCalendar(circuits) : [{ key: 'all', circuits }]
  let index = 0
  return (
    <div className="flex flex-col gap-pw-6" data-circuit-grid>
      {groups.map((g) => {
        const heading = g.key === 'calendar' ? `${season} calendar` : g.key === 'other' ? 'Other circuits' : null
        const count = g.key === 'calendar' ? `${g.circuits.length} ${g.circuits.length === 1 ? 'round' : 'rounds'}` : `${g.circuits.length} ${g.circuits.length === 1 ? 'circuit' : 'circuits'}`
        return (
          <Group key={g.key} labelledBy={heading ? `cg-${g.key}` : undefined}>
            {heading && (
              <div className="mb-pw-3 flex items-baseline justify-between gap-pw-3">
                <h2 id={`cg-${g.key}`} className="text-heading text-ink">{heading}</h2>
                <span className="num text-xs text-ink-3">{count}</span>
              </div>
            )}
            <ul className={GRID}>
              {g.circuits.map((c) => {
                const i = index++
                return (
                  <CircuitCard
                    key={c.id} circuit={c} season={season} layout={layout} index={i}
                    next={c.id === nextId} entrance={entrance && i < ENTRANCE_LIMIT} linkState={linkState}
                  />
                )
              })}
            </ul>
          </Group>
        )
      })}
    </div>
  )
}
