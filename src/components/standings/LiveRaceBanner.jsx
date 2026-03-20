import { CTOR_COLORS } from '../../utils/teamColors'

export default function LiveRaceBanner({ liveData }) {
  return (
    <div style={{
      marginBottom: '0.85rem',
      background: 'rgba(225,6,0,0.08)',
      border: '1px solid rgba(225,6,0,0.35)',
      borderLeft: '3px solid #e10600',
      borderRadius: 10,
      padding: '0.65rem 1rem',
      display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#e10600',
          boxShadow: '0 0 6px #e10600',
          animation: 'pulse 1.4s ease-in-out infinite',
        }} />
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: '#e10600', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          LIVE
        </span>
      </div>

      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
          {liveData.raceName}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {liveData.sessionName}{liveData.currentLap ? ` · Lap ${liveData.currentLap}${liveData.totalLaps ? `/${liveData.totalLaps}` : ''}` : ''}
        </div>
      </div>

      {liveData.top3?.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {liveData.top3.slice(0, 5).map((d, i) => (
            <div key={d.driverId || i} style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: 'rgba(255,255,255,0.04)', borderRadius: 6,
              padding: '0.2rem 0.55rem',
            }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: i === 0 ? '#e10600' : 'rgba(255,255,255,0.35)', width: 14, textAlign: 'right' }}>
                {d.position ?? i + 1}
              </span>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: d.color || CTOR_COLORS[d.teamId] || '#888', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.8rem', fontWeight: 700, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                {d.acronym}
              </span>
              {d.interval && (
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginLeft: 2 }}>
                  {d.interval}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
        {new Date(liveData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  )
}
