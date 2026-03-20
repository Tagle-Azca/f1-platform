import ControlGroup from '../ui/ControlGroup'
import { COLOR_B } from './telemetryConstants'

export default function TelemetryControls({
  year, onYearChange, allYears,
  isHistorical,
  raceId, onRaceChange, racesOfYear,
  driverId, onDriverChange,
  histDrivers, cassDrivers, loadingDrivers, loadingHist,
  driverIdB, onDriverBChange, laps, loadingB,
  loading, onLoad,
}) {
  const driverLoading = loadingDrivers || loadingHist

  return (
    <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>

      <ControlGroup label="Season" width={100}>
        <select className="input" style={{ width: 100 }} value={year} onChange={e => onYearChange(e.target.value)}>
          {allYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </ControlGroup>

      {!isHistorical && (
        <ControlGroup label="Race" width={220}>
          <select className="input" style={{ width: 220 }} value={raceId} onChange={e => onRaceChange(e.target.value)}>
            <option value="">Select race…</option>
            {racesOfYear.map(r => (
              <option key={r.raceId} value={r.raceId}>{r.raceName}</option>
            ))}
          </select>
        </ControlGroup>
      )}

      <ControlGroup
        label={<>Driver {driverLoading && <span style={{ color: isHistorical ? 'var(--mongo-color)' : 'var(--cassandra-color)' }}>···</span>}</>}
        width={240}
      >
        {isHistorical ? (
          <select className="input" style={{ width: 240 }} value={driverId} onChange={e => onDriverChange(e.target.value)} disabled={!histDrivers.length}>
            <option value="">Select driver…</option>
            {histDrivers.map(d => (
              <option key={d.driverId} value={d.driverId}>{d.name}</option>
            ))}
          </select>
        ) : (
          <select className="input" style={{ width: 240 }} value={driverId} onChange={e => onDriverChange(e.target.value)} disabled={!cassDrivers.length || loadingDrivers}>
            <option value="">Select driver…</option>
            {cassDrivers.map(d => (
              <option key={d.driverId} value={d.driverId}>
                {d.acronym} — {d.fullName}{d.teamName ? ` (${d.teamName})` : ''}
              </option>
            ))}
          </select>
        )}
      </ControlGroup>

      {!isHistorical && laps.length > 0 && (
        <ControlGroup
          label={<>vs Driver {loadingB && <span style={{ color: COLOR_B }}>···</span>}</>}
          width={200}
        >
          <select
            className="input"
            style={{ width: 200, borderColor: driverIdB ? `${COLOR_B}80` : undefined }}
            value={driverIdB}
            onChange={e => onDriverBChange(e.target.value)}
            disabled={!cassDrivers.length}
          >
            <option value="">— no comparison —</option>
            {cassDrivers.filter(d => d.driverId !== driverId).map(d => (
              <option key={d.driverId} value={d.driverId}>
                {d.acronym} — {d.fullName}
              </option>
            ))}
          </select>
        </ControlGroup>
      )}

      <button
        className="btn btn--primary"
        onClick={onLoad}
        disabled={isHistorical ? (!driverId || loadingHist) : (!raceId || !driverId || loading)}
        style={{ alignSelf: 'flex-end' }}
      >
        {(loading || loadingHist) ? 'Loading…' : isHistorical ? 'Load Analysis' : 'Load Telemetry'}
      </button>
    </div>
  )
}
