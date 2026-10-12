import CircuitCard from '../circuits/CircuitCard'
import DriverCard from './DriverCard'
import ConstructorCard from './ConstructorCard'

const GRID = 'grid grid-cols-1 gap-pw-4 sm:grid-cols-[repeat(auto-fill,minmax(224px,1fr))]'
const ENTRANCE_LIMIT = 8

/**
 * The hub grid for one tab. Drivers and constructors arrive as `{ pinned, rest }` (the favourite first, with its true
 * rank); circuits are already in calendar order. Only the first eight cards animate in, and only when `entrance` is set.
 */
export default function HubGrid({ view, season, layout, entrance, linkState, pinned = [], rest = [], circuits = [], nextId = null }) {
  let i = 0
  const props = (extra = {}) => ({ season, layout, linkState, index: i, entrance: entrance && i < ENTRANCE_LIMIT, ...extra })
  return (
    <ul className={GRID} data-hub-grid={view}>
      {view === 'drivers' && [...pinned.map((c) => [c, true]), ...rest.map((c) => [c, false])].map(([c, fav]) => {
        const node = <DriverCard key={c.id} card={c} favourite={fav} {...props()} />
        i += 1
        return node
      })}
      {view === 'constructors' && [...pinned.map((c) => [c, true]), ...rest.map((c) => [c, false])].map(([c, fav]) => {
        const node = <ConstructorCard key={c.id} card={c} favourite={fav} {...props()} />
        i += 1
        return node
      })}
      {view === 'circuits' && circuits.map((c) => {
        const node = <CircuitCard key={c.id} circuit={c} next={c.id === nextId} {...props()} />
        i += 1
        return node
      })}
    </ul>
  )
}
