import AccentBanner from '../ui/AccentBanner'
import CircuitSilhouette from '../circuit/CircuitSilhouette'
import CountdownDisplay from '../ui/CountdownDisplay'

export default function NextRaceHero({ race, circuit, live, countdown, isMobile, flagUrl }) {
  const titleInfo = (
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontSize: isMobile ? '0.6rem' : '0.65rem',
        color: 'var(--f1-red)', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        marginBottom: isMobile ? '0.15rem' : '0.25rem',
      }}>
        Round {race.round} · {race.season}
      </div>
      <h1 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: isMobile ? '1.55rem' : '2.2rem',
        fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1,
      }}>
        {race.raceName}
      </h1>
      <p style={{
        fontSize: isMobile ? '0.72rem' : '0.88rem',
        color: 'var(--text-secondary)',
        marginTop: isMobile ? '0.2rem' : '0.3rem', marginBottom: 0,
      }}>
        {circuit?.circuitName || race.circuit} · {race.locality}, {race.country}
      </p>
    </div>
  )

  const liveOrCountdown = live ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-end' : 'center', gap: '0.4rem' }}>
      <div style={{ fontSize: isMobile ? '0.62rem' : '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ef4444' }}>
        {live.label}
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6, padding: isMobile ? '0.3rem 0.75rem' : '0.35rem 1rem' }}>
        <span style={{ width: isMobile ? 7 : 8, height: isMobile ? 7 : 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0 }} />
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 900, color: '#ef4444', letterSpacing: '0.1em' }}>LIVE NOW</span>
      </div>
    </div>
  ) : countdown ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-end' : 'center', gap: isMobile ? '0.25rem' : '0.35rem', flexShrink: 0 }}>
      {race.nextSession?.label && (
        <div style={{ fontSize: isMobile ? '0.62rem' : '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--f1-red)' }}>
          {race.nextSession.label}
        </div>
      )}
      <CountdownDisplay parts={countdown} size={isMobile ? 'sm' : 'lg'} />
    </div>
  ) : null

  const hasSilhouette = circuit?.trackCoords?.length > 0

  return (
    <AccentBanner color="var(--f1-red)" radius={16} style={{ position: 'relative', overflow: 'hidden', padding: isMobile ? '1rem 1.25rem' : '1.5rem 2rem', maxWidth: '100%' }}>
      {/* Desktop background silhouette */}
      {!isMobile && hasSilhouette && (
        <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.18, pointerEvents: 'none' }}>
          <CircuitSilhouette coords={circuit.trackCoords} color="#e8002d" width={260} height={170} strokeWidth={3} animate />
        </div>
      )}

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Row 1: flag + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {flagUrl && (
              <img src={flagUrl} alt={race.country} style={{ width: 44, height: 'auto', borderRadius: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.5)', flexShrink: 0 }} />
            )}
            {titleInfo}
          </div>
          {/* Row 2: silhouette + countdown */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', overflow: 'hidden' }}>
            {hasSilhouette ? (
              <div style={{ opacity: 0.5, flex: '0 1 auto', minWidth: 0, overflow: 'hidden' }}>
                <CircuitSilhouette coords={circuit.trackCoords} color="#e8002d" width={110} height={68} strokeWidth={2.5} animate />
              </div>
            ) : <div />}
            {liveOrCountdown}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {flagUrl && (
              <img src={flagUrl} alt={race.country} style={{ width: 64, height: 'auto', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }} />
            )}
            {titleInfo}
          </div>
          {liveOrCountdown}
        </div>
      )}
    </AccentBanner>
  )
}
