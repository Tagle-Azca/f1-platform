import Panel from '../ui/Panel'
import CircuitSilhouette from '../circuit/CircuitSilhouette'
import { fmtDate } from '../../utils/date'

export default function RaceHeroPanel({ race }) {
  return (
    <Panel padding="none" style={{
      position: 'relative',
      marginBottom: '1.25rem',
      padding: '1.5rem 1.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      minHeight: 120,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, var(--f1-red), transparent)`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
          <span style={{
            fontFamily: 'var(--font-condensed)',
            fontSize: '2.2rem', fontWeight: 900,
            color: 'rgba(255,255,255,0.15)', lineHeight: 1,
            userSelect: 'none',
          }}>
            R{race.round}
          </span>
          <h1 className="page__title" style={{ marginBottom: 0 }}>{race.raceName}</h1>
        </div>
        <p className="page__subtitle" style={{ marginBottom: '0.75rem' }}>
          {race.Circuit?.circuitName} · {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country} · {fmtDate(race.date)}
        </p>
      </div>
      {race.Circuit?.trackCoords?.length && (
        <div style={{
          flexShrink: 0,
          opacity: 0.85,
          filter: 'drop-shadow(0 0 12px rgba(225,6,0,0.2))',
        }}>
          <CircuitSilhouette
            coords={race.Circuit.trackCoords}
            color="var(--f1-red)"
            width={220}
            height={140}
            strokeWidth={2.5}
            animate
          />
        </div>
      )}
    </Panel>
  )
}
