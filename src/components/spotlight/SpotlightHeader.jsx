import ConstructorLogo from '../ui/ConstructorLogo'

export default function SpotlightHeader({ spotlight, driverTeam, driverPhoto, teamColor, isYourDriver, trend, trendColor, showTrend, isMobile }) {
  const initials = spotlight.name?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const SIZE = isMobile ? 48 : 102

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
      {/* Driver photo */}
      {driverPhoto ? (
        <img
          src={driverPhoto}
          alt={spotlight.name}
          style={{
            width: SIZE, height: SIZE, borderRadius: '20%',
            objectFit: 'cover', objectPosition: 'top center',
            border: `2px solid ${teamColor}`,
            flexShrink: 0, background: 'rgba(255,255,255,0.05)',
          }}
        />
      ) : (
        <div style={{
          width: SIZE, height: SIZE, borderRadius: '20%',
          background: `${teamColor}22`, border: `2px solid ${teamColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', fontWeight: 900,
          color: teamColor, fontFamily: "'Barlow Condensed', sans-serif",
          flexShrink: 0,
        }}>
          {initials}
        </div>
      )}

      {/* Constructor logo — same size */}
      <ConstructorLogo
        constructorId={spotlight.constructorId ?? driverTeam?.id}
        name={spotlight.team}
        color={driverTeam?.color ?? '#888'}
        size={SIZE}
      />

      {/* Name + meta */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 4 }}>
          <span style={{
            fontSize: '0.55rem', fontWeight: 700, padding: '2px 7px', borderRadius: 3,
            background: 'rgb(var(--accent-rgb) / 0.14)', color: 'var(--accent-color)',
            textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0,
          }}>
            {isYourDriver ? 'Your Driver' : 'WDC Leader'}
          </span>
          {showTrend && (
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: trendColor, lineHeight: 1 }} title="Trend vs last race">
              {trend}
            </span>
          )}
        </div>
        <div style={{
          fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 900,
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: '0.02em', lineHeight: 1, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {spotlight.name}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
          {spotlight.team || '—'}
        </div>
      </div>
    </div>
  )
}
