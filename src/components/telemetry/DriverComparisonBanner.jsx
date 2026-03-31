import AccentBanner from '../ui/AccentBanner'
import DriverBannerCard from './DriverBannerCard'
import { COLORS, COLOR_B } from './telemetryConstants'

export default function DriverComparisonBanner({
  isMobile,
  driverA, validLaps, bestLap, avgLap, pitStops, statusA,
  driverB, validLapsB, bestLapB, avgLapB, pitStopsB, statusB,
  lapsBLoaded,
  colorA = COLORS.lap,
  colorB = COLOR_B,
}) {
  return (
    <AccentBanner
      color="var(--cassandra-color)"
      padding="sm"
      radius={10}
      style={{ marginBottom: '1rem', borderTop: '2px solid rgba(168,85,247,0.45)' }}
    >
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '1rem' : '1.5rem' }}>

        <DriverBannerCard
          driver={driverA}
          validLaps={validLaps}
          bestLap={bestLap}
          avgLap={avgLap}
          pitStops={pitStops}
          color={colorA}
          isMobile={isMobile}
          status={statusA}
        />

        {lapsBLoaded && driverB && (
          <>
            <div style={isMobile
              ? { height: 1, background: 'rgba(255,255,255,0.07)' }
              : { width: 1, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}
            />
            <DriverBannerCard
              driver={driverB}
              validLaps={validLapsB}
              bestLap={bestLapB}
              avgLap={avgLapB}
              pitStops={pitStopsB}
              color={colorB}
              isMobile={isMobile}
              status={statusB}
            />
          </>
        )}
      </div>
    </AccentBanner>
  )
}
