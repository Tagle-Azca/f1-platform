import StatCard from '../ui/StatCard'
import { fmtLap } from './telemetryUtils'
import { getRaceStatus } from '../../utils/raceUtils'

export default function DriverBannerCard({ driver, validLaps, bestLap, avgLap, pitStops, color, isMobile, status }) {
  const raceStatus = status != null ? getRaceStatus(status) : (validLaps.length === 0 ? 'dns' : 'unknown')
  const isFinishedStatus = raceStatus === 'finished'
  const isLapped         = raceStatus === 'lapped'
  const isDnf            = raceStatus === 'dnf'
  const isDns            = raceStatus === 'dns'

  // Normalize lapped label: "+1 Lap" → "+1 LAP", "+2 Laps" → "+2 LAPS"
  const lappedLabel = isLapped ? status.replace(/laps?/i, m => m.toUpperCase()) : ''

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '0.5rem' : '1.25rem' }}>
      {/* Name block */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.90rem', color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Driver</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {driver.fullName}
          </span>
          <span style={{ fontSize: '0.9rem', color }}>{driver.acronym}</span>

          {/* DNS badge */}
          {isDns && (
            <span style={{
              fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.07em',
              padding: '2px 6px', borderRadius: 4,
              background: 'rgba(239,68,68,0.14)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.35)',
            }}>
              DNS
            </span>
          )}

          {/* DNF badge — gradient border (red → orange) */}
          {isDnf && (
            <div style={{
              display: 'inline-flex',
              background: 'linear-gradient(135deg, #ef4444, #fb923c)',
              padding: '1px', borderRadius: 5,
            }}>
              <span style={{
                fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.07em',
                padding: '1px 6px', borderRadius: 4,
                background: 'rgba(14,14,14,0.95)', color: '#ef4444',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                DNF
                <span style={{ fontWeight: 600, opacity: 0.75 }}>· {status}</span>
              </span>
            </div>
          )}

          {/* Lapped badge — neutral slate */}
          {isLapped && (
            <span style={{
              fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.07em',
              padding: '2px 7px', borderRadius: 4,
              background: 'rgba(148,163,184,0.10)', color: 'rgba(148,163,184,0.85)',
              border: '1px solid rgba(148,163,184,0.28)',
            }}>
              {lappedLabel}
            </span>
          )}

          {/* Finished — subtle green check */}
          {isFinishedStatus && (
            <span style={{
              fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.07em',
              padding: '2px 6px', borderRadius: 4,
              background: 'rgba(34,197,94,0.10)', color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.25)',
            }}>
              ✓ FIN
            </span>
          )}
        </div>
        {driver.teamName && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{driver.teamName}</div>
        )}
      </div>

      {!isMobile && <div style={{ width: 1, height: 40, background: 'rgba(255, 255, 255, 0.28)', flexShrink: 0 }} />}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, auto)', gap: '0.5rem', flex: isMobile ? undefined : 1 }}>
        <StatCard
          label="Laps"
          value={isDns ? 'DNS' : validLaps.length}
          sub={isLapped ? lappedLabel : undefined}
          accent={isDns ? '#ef4444' : isDnf ? '#ef4444' : isLapped ? 'rgba(148,163,184,0.65)' : undefined}
        />
        <StatCard label="Best lap"  value={isDns ? '—' : fmtLap(bestLap)} />
        <StatCard label="Avg lap"   value={isDns ? '—' : fmtLap(avgLap)} />
        <StatCard label="Pit stops" value={isDns ? '—' : pitStops.length} />
      </div>
    </div>
  )
}
