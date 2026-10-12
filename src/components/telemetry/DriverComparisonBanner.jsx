import { motion } from 'framer-motion'
import Panel from '../ui/Panel'
import TrackTrace from '../viz/TrackTrace'
import DriverBannerCard from './DriverBannerCard'
import { safeString } from '../../utils/safeText'
import { heroChildProps, useReducedMotion } from '../../styles/motion'

/** Page hero: the race, the circuit outline, and one or two drivers' summaries. The only card on the page. */
export default function DriverComparisonBanner({
  raceName, season, circuitCoords,
  driverA, validLaps, bestLap, avgLap, pitStops, statusA,
  driverB, validLapsB, bestLapB, avgLapB, pitStopsB, statusB,
  lapsBLoaded,
  colorA, colorB,
}) {
  const reduced = useReducedMotion()
  const child = (i) => heroChildProps(i, reduced)
  const comparing = lapsBLoaded && driverB
  const hasTrack  = Array.isArray(circuitCoords) && circuitCoords.length >= 8

  return (
    <Panel as="section" aria-label="Driver summary" className="grid grid-cols-1 gap-pw-5 md:grid-cols-12">
      <div className={`flex min-w-0 flex-col gap-pw-5 ${hasTrack ? 'md:col-span-9' : 'md:col-span-12'}`}>
        <motion.p className="text-sm text-ink-2" {...child(0)}>
          {safeString(raceName) || 'Race'}{season ? `, ${season}` : ''}
        </motion.p>

        <motion.div className={comparing ? 'grid grid-cols-1 gap-pw-6 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-edge-soft' : ''} {...child(1)}>
          <div className={comparing ? 'lg:pr-pw-6' : ''}>
            <DriverBannerCard
              driver={driverA} validLaps={validLaps} bestLap={bestLap} avgLap={avgLap}
              pitStops={pitStops} color={colorA} status={statusA} compact={comparing}
            />
          </div>
          {comparing && (
            <div className="border-t border-edge-soft pt-pw-6 lg:border-t-0 lg:pl-pw-6 lg:pt-0">
              <DriverBannerCard
                driver={driverB} validLaps={validLapsB} bestLap={bestLapB} avgLap={avgLapB}
                pitStops={pitStopsB} color={colorB} status={statusB} compact
              />
            </div>
          )}
        </motion.div>
      </div>

      {hasTrack && (
        <div className="hidden items-center justify-center md:col-span-3 md:flex" aria-hidden="true">
          <TrackTrace coords={circuitCoords} className="h-auto w-full max-w-48 opacity-[0.35]" />
        </div>
      )}
    </Panel>
  )
}
