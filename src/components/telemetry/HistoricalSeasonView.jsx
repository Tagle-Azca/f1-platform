import AccentBanner from '../ui/AccentBanner'
import Panel from '../ui/Panel'
import StatCard from '../ui/StatCard'
import EmptyState from '../ui/EmptyState'
import ReliabilityBar from './ReliabilityBar'
import GridVsResultChart from './GridVsResultChart'

export default function HistoricalSeasonView({ histData, selectedDriver, year, isMobile, loadingHist }) {
  return (
    <>
      {histData && selectedDriver && (
        <>
          {/* Driver + season summary banner */}
          <AccentBanner
            color="var(--mongo-color)"
            padding="sm"
            radius={10}
            style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}
          >
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.62rem', color: 'var(--mongo-color)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Driver · {year}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {selectedDriver.name}
              </div>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '0.5rem' }}>
              <StatCard label="Races"   value={histData.stats.races} />
              <StatCard label="Wins"    value={histData.stats.wins} />
              <StatCard label="Podiums" value={histData.stats.podiums} />
              <StatCard label="Points"  value={histData.stats.points} />
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '0.5rem' }}>
              <StatCard label="Poles"       value={histData.stats.poles} />
              <StatCard label="Fastest"     value={histData.stats.fastestLaps} />
              <StatCard label="Finishes"    value={histData.stats.finishes} />
              <StatCard label="Reliability" value={`${histData.stats.reliability}%`} />
            </div>
          </AccentBanner>

          {/* Grid vs Result chart */}
          <Panel accent="mongo" className="card" style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Grid vs Result
                </h2>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Green = gained positions · Red = lost positions · Purple = same
                </p>
              </div>
            </div>
            <GridVsResultChart races={histData.races} />
          </Panel>

          {/* Season stats + reliability */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.85rem' }}>
            <Panel accent="mongo" className="card">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                Season Stats
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  { label: 'Points scored',   value: histData.stats.points,      max: histData.stats.maxPoints, color: '#22c55e' },
                  { label: 'Podium rate',      value: histData.stats.podiums,      max: histData.stats.races,     color: '#f59e0b' },
                  { label: 'Points per race',  value: histData.stats.races ? (histData.stats.points / histData.stats.races).toFixed(1) : 0, max: null, color: '#a855f7' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: item.color }}>
                        {item.value}{item.max != null ? ` / ${item.max}` : ''}
                      </span>
                    </div>
                    {item.max != null && item.max > 0 && (
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%`, height: '100%', background: item.color, borderRadius: 2, transition: 'width 0.6s' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel accent="mongo" className="card">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                Reliability
              </h2>
              <ReliabilityBar reliability={histData.reliability} total={histData.stats.races} />
            </Panel>
          </div>
        </>
      )}

      {!loadingHist && histData && histData.races.length === 0 && (
        <EmptyState type="empty" message={`No race data found for this driver in ${year}`} height={120} />
      )}
    </>
  )
}
