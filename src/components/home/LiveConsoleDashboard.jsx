import { memo, useCallback, useState } from 'react'
import CircuitRadarCanvas from './CircuitRadarCanvas'
import LiveTelemetryStrip from './LiveTelemetryStrip'
import LivePill from '../ui/LivePill'
import TyreBadge from '../ui/TyreBadge'
import Meter from '../ui/Meter'
import TeamBar from '../viz/TeamBar'
import { sectorTone } from '../../styles/vizPalette'
import { asObjectArray } from '../../utils/safeArray'

function Sector({ s }) {
  if (!s) return <span className="text-ink-3">—</span>
  const val = typeof s.time === 'number' ? s.time.toFixed(3) : s.time
  const tone = sectorTone(s.color)
  return <span className={tone ? `${tone.cls} font-semibold` : 'text-ink-2'}>{val}{tone && <span className="sr-only"> ({tone.hint})</span>}</span>
}

const DriverRow = memo(function DriverRow({ driver: d, selected, onToggle }) {
  const leaderish = d.gapStr === 'LEADER' || d.gapStr === 'fastest'
  return (
    <tr className={`border-b border-edge-soft text-sm ${selected ? 'bg-steel-soft' : ''}`}>
      <td className="num w-10 py-1 pl-pw-3 text-center text-ink-2">{d.position}</td>
      <td className="py-1 pr-pw-2">
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => onToggle(d.driverNum)}
          className="flex min-h-11 w-full cursor-pointer items-center gap-pw-2 border-0 bg-transparent text-left text-ink"
        >
          <TeamBar color={d.teamColor} height={20} />
          <TyreBadge compound={d.compound} />
          <span className="min-w-0">
            <span className="block font-display font-semibold">{d.acronym}</span>
            <span className="block truncate text-xs leading-3 text-ink-3">{d.teamName}</span>
          </span>
        </button>
      </td>
      <td className={`num ${d.position === 1 ? 'font-semibold text-violet' : 'text-ink'}`}>{d.bestLapStr || '—'}</td>
      <td className="num pr-pw-2 text-right text-ink-2">{d.laps ?? '—'}</td>
      <td className="num"><Sector s={d.s1} /></td>
      <td className="num"><Sector s={d.s2} /></td>
      <td className="num"><Sector s={d.s3} /></td>
      <td className={`num ${leaderish ? 'font-semibold text-signal-yellow' : 'text-ink-2'}`}>{d.gapStr}</td>
      <td className="text-center text-xs font-semibold text-ink-2">{d.gear == null ? '' : d.gear === 0 ? 'N' : d.gear}</td>
      <td className="w-14 pr-pw-3">
        {d.throttle != null || d.brake != null ? (
          <div className="flex flex-col gap-1">
            <Meter value={d.throttle ?? 0} tone="bg-pos" />
            <Meter value={d.brake ?? 0} tone="bg-neg" />
          </div>
        ) : <span className="text-ink-3">—</span>}
      </td>
    </tr>
  )
})

/** Desktop live console on the Dashboard: timing table + track radar + selected-driver telemetry. */
export default function LiveConsoleDashboard({ tower }) {
  const drivers = asObjectArray(tower?.drivers)
  const [selectedNum, setSelectedNum] = useState(null)
  const toggle = useCallback((num) => setSelectedNum(prev => (prev === num ? null : num)), [])
  const selectedDriver = selectedNum ? drivers.find(d => d.driverNum === selectedNum) : null

  return (
    <section aria-labelledby="live-console-h" className="section">
      <div className="mb-pw-3 flex items-center gap-pw-3">
        <LivePill>Session live</LivePill>
        <h2 id="live-console-h" className="text-heading text-ink">
          Live console <span className="font-medium text-ink-2">{tower?.raceName}, {tower?.sessionName}</span>
        </h2>
      </div>
      <div className="flex h-[480px] flex-row overflow-hidden rounded-md border border-edge">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-auto" tabIndex={0} role="region" aria-label="Live timing table">
            <table className="w-full border-collapse">
              <caption className="sr-only">Live timing for {tower?.sessionName}</caption>
              <thead className="sticky top-0 bg-bg text-left text-xs font-medium text-ink-3">
                <tr>
                  <th scope="col" className="py-1 pl-pw-3 text-center">P</th>
                  <th scope="col" className="py-1">Driver</th>
                  <th scope="col">Best</th>
                  <th scope="col" className="pr-pw-2 text-right">L</th>
                  <th scope="col">S1</th><th scope="col">S2</th><th scope="col">S3</th>
                  <th scope="col">Gap</th>
                  <th scope="col" className="text-center">G</th>
                  <th scope="col" className="pr-pw-3">T/B</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <DriverRow key={d.driverNum} driver={d} selected={d.driverNum === selectedNum} onToggle={toggle} />
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-edge-soft px-pw-4 py-pw-2 text-xs text-ink-3">
            Select a driver to highlight them on the radar. Violet: session best. Green: personal best.
          </p>
        </div>

        <div className="flex w-72 shrink-0 flex-col border-l border-edge-soft">
          <h3 className="font-sans border-b border-edge-soft px-pw-3 py-pw-2 text-xs font-medium text-ink-3">Track radar</h3>
          <div className="min-h-0 flex-1">
            <CircuitRadarCanvas drivers={drivers} selectedDriverNum={selectedNum} />
          </div>
          {selectedNum && <LiveTelemetryStrip driverNum={selectedNum} driverName={selectedDriver?.acronym} />}
        </div>
      </div>
    </section>
  )
}
