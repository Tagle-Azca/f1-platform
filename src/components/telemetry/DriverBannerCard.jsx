import StatCard from '../ui/StatCard'
import { fmtLap } from './telemetryUtils'

const DNS_STATUSES = ['Did not start', 'Withdrew', 'Did not qualify', 'Not classified']

export default function DriverBannerCard({ driver, validLaps, bestLap, avgLap, pitStops, color, isMobile, status }) {
  const hasMongo = status != null
  const isDns    = hasMongo ? DNS_STATUSES.includes(status) : validLaps.length === 0
  const isLapped = hasMongo && !isDns && status.startsWith('+')
  const isDnf    = hasMongo && !isDns && !isLapped && status !== 'Finished'

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '0.5rem' : '1.25rem' }}>
      {/* Name block */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.62rem', color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Driver</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {driver.fullName}
          </span>
          <span style={{ fontSize: '0.9rem', color }}>{driver.acronym}</span>
          {isDns && (
            <span style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.07em', padding: '1px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.14)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }}>
              DNS
            </span>
          )}
          {isDnf && (
            <span style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.07em', padding: '2px 7px', borderRadius: 4, background: 'rgba(251,146,60,0.14)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
              DNF
              <span style={{ fontWeight: 600, opacity: 0.8 }}>· {status}</span>
            </span>
          )}
        </div>
        {driver.teamName && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{driver.teamName}</div>
        )}
      </div>

      {!isMobile && <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, auto)', gap: '0.5rem', flex: isMobile ? undefined : 1 }}>
        <StatCard
          label="Laps"
          value={isDns ? 'DNS' : validLaps.length}
          sub={isLapped ? status : undefined}
          accent={isDns ? '#ef4444' : isDnf ? '#fb923c' : isLapped ? '#f59e0b' : undefined}
        />
        <StatCard label="Best lap"  value={isDns ? '—' : fmtLap(bestLap)} />
        <StatCard label="Avg lap"   value={isDns ? '—' : fmtLap(avgLap)} />
        <StatCard label="Pit stops" value={isDns ? '—' : pitStops.length} />
      </div>
    </div>
  )
}
