import { useRaceContext } from '../hooks/useRaceContext'
import { RaceCtx } from './raceContextStore'

/** One shared poller for the next-race identity (header bar, Live empty state). No duplicate requests. */
export function RaceProvider({ children }) {
  const value = useRaceContext()
  return <RaceCtx.Provider value={value}>{children}</RaceCtx.Provider>
}
