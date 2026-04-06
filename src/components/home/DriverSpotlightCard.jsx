import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useSpotlightData } from '../../hooks/useSpotlightData'
import SpotlightHeader from '../spotlight/SpotlightHeader'
import ChampionshipStrip from '../spotlight/ChampionshipStrip'
import PredictionRow from '../spotlight/PredictionRow'
import H2HBars from '../spotlight/H2HBars'

const PULSE_STYLE = `
  @keyframes spotlightPulse {
    0%   { box-shadow: 0 0 0 0   rgb(var(--accent-rgb) / 0.55); }
    55%  { box-shadow: 0 0 0 8px rgb(var(--accent-rgb) / 0.15); }
    100% { box-shadow: 0 0 0 14px rgb(var(--accent-rgb) / 0);  }
  }
`

export default function DriverSpotlightCard({ data, isNarrow = false }) {
  const { isMobile } = useBreakpoint()
  const {
    spotlight, driverTeam, isYourDriver, pulseKey,
    driverPhoto, teamColor, trend, trendColor, showTrend,
    spotlightGap, leaderPoints, remaining,
    predicted, confidence, lastPos, lastRaceName, qualiGap,
    insight, mateSurname, h2hRows,
  } = useSpotlightData(data)

  if (!spotlight) {
    return (
      <div style={{ height: 56, display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Select a driver in My Garage</div>
      </div>
    )
  }

  return (
    <>
      <style>{PULSE_STYLE}</style>
      <div
        key={pulseKey}
        style={{
          position: 'relative', marginBottom: '0.75rem', borderRadius: 8,
          animation: pulseKey > 0 ? 'spotlightPulse 0.9s ease-out' : 'none',
        }}
      >
        <SpotlightHeader
          spotlight={spotlight}
          driverTeam={driverTeam}
          driverPhoto={driverPhoto}
          teamColor={teamColor}
          isYourDriver={isYourDriver}
          trend={trend}
          trendColor={trendColor}
          showTrend={showTrend}
          isMobile={isMobile}
        />

        <ChampionshipStrip
          position={spotlight.position}
          points={spotlight.points ?? 0}
          wins={spotlight.wins ?? 0}
          spotlightGap={spotlightGap}
          leaderPoints={leaderPoints}
          remaining={remaining}
          teamColor={teamColor}
          isMobile={isMobile}
        />

        {!isNarrow && (
          <>
            <PredictionRow
              predicted={predicted}
              confidence={confidence}
              lastPos={lastPos}
              lastRaceName={lastRaceName}
              qualiGap={qualiGap}
              mateSurname={mateSurname}
              isMobile={isMobile}
            />

            {insight && (
              <div style={{ fontSize: isMobile ? '0.62rem' : '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '0.65rem' }}>
                {insight}
              </div>
            )}

            {isYourDriver && (
              <H2HBars rows={h2hRows} mateSurname={mateSurname} teamColor={teamColor} isMobile={isMobile} />
            )}
          </>
        )}
      </div>
    </>
  )
}
