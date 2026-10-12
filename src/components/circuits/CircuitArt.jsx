import TrackTrace from '../viz/TrackTrace'
import CircuitFallbackTile from './CircuitFallbackTile'
import { hasOutline } from './circuitFormat'

/**
 * The circuit's outline (static unless `animate`) or the fallback tile. Fills its parent; the parent sets the aspect box,
 * so swapping between the two never shifts layout. The outline stroke follows the parent's text colour.
 */
export default function CircuitArt({ circuit, size = 'card', animate = false, width, height, caption = false }) {
  if (hasOutline(circuit)) {
    return (
      <TrackTrace
        coords={circuit.coords} animate={animate} tone="currentColor" width={width} height={height}
        className="size-full" 
      />
    )
  }
  return <CircuitFallbackTile circuit={circuit} size={size} caption={caption} />
}
